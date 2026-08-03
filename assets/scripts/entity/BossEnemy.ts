import { _decorator, Vec3, Color, Sprite, math } from 'cc';
import { Enemy } from './Enemy';
import { GameManager } from '../core/GameManager';
import { EventManager } from '../core/EventManager';
import { EnemyPoolManager } from '../core/EnemyPoolManager';
import { ObjectPool } from '../core/ObjectPool';
import { ExpDrop } from './ExpDrop';
import { TreasureChest } from './TreasureChest';
import { CHEST_CONFIG, BOSS_CONFIG } from '../config/GameConfig';
const { ccclass, property } = _decorator;

@ccclass('BossEnemy')
export class BossEnemy extends Enemy {
    @property(Sprite) bossSprite: Sprite = null!;

    private chargeTimer: number = 0;
    private chargeInterval: number = 6;
    private isCharging: boolean = false;
    private chargeSpeed: number = 0;
    private chargeDir: Vec3 = new Vec3();
    private _bossColor: Color = new Color(255, 60, 60, 255);
    private _normalColor: Color = new Color(255, 255, 255, 255);

    init(type: string) {
        super.init(type);
        // 覆盖血量为Boss配置
        const scale = GameManager.Instance?.difficultyScale ?? 1;
        this.hp = BOSS_CONFIG.hpBase + BOSS_CONFIG.hpPerScale * (scale - 1) * 10;
        this.maxHp = this.hp;
        this.damage = BOSS_CONFIG.damageBase + BOSS_CONFIG.damagePerScale * (scale - 1) * 10;
        this.expReward = BOSS_CONFIG.expReward;
        this.goldReward = BOSS_CONFIG.goldReward;
        this.chargeTimer = 0;
        this.isCharging = false;
        this._attackCd = 0;
        if (this.bossSprite) {
            this.bossSprite.color = this._normalColor;
        }
    }

    private _reuseDir: Vec3 = new Vec3();
    private _attackCd: number = 0;
    private readonly ATTACK_INTERVAL: number = 1.0;
    private readonly ATTACK_RANGE_SQ: number = 70 * 70;

    update(deltaTime: number) {
        if (this.isDead || !GameManager.Instance || GameManager.Instance.battlePause) return;

        if (deltaTime > 0.1) {
            deltaTime = 0.1;
        }

        if (this.isCharging) {
            const pos = this.node.position;
            this.node.setPosition(
                pos.x + this.chargeDir.x * this.chargeSpeed * deltaTime,
                pos.y + this.chargeDir.y * this.chargeSpeed * deltaTime,
                pos.z
            );
            this.chargeTimer -= deltaTime;
            if (this.chargeTimer <= 0) {
                this.isCharging = false;
            }
            return;
        }

        this.chargeTimer -= deltaTime;
        if (this.chargeTimer <= 0 && GameManager.Instance.player) {
            this.startCharge();
        }

        const player = GameManager.Instance.player;
        if (!player) return;
        const playerPos = player.node.worldPosition;
        const selfPos = this.node.worldPosition;
        Vec3.subtract(this._reuseDir, playerPos, selfPos);
        this._reuseDir.z = 0;
        const lenSq = this._reuseDir.x * this._reuseDir.x + this._reuseDir.y * this._reuseDir.y;
        if (lenSq > 0.01) {
            const invLen = 1 / Math.sqrt(lenSq);
            this._reuseDir.x *= invLen;
            this._reuseDir.y *= invLen;
            this.node.setPosition(
                selfPos.x + this._reuseDir.x * this.speed * deltaTime,
                selfPos.y + this._reuseDir.y * this.speed * deltaTime,
                selfPos.z
            );

            if (lenSq < this.ATTACK_RANGE_SQ) {
                this._attackCd += deltaTime;
                if (this._attackCd >= this.ATTACK_INTERVAL) {
                    player.takeDamage(this.damage);
                    this._attackCd = 0;
                }
            }
        }
    }

    private startCharge() {
        this.isCharging = true;
        this.chargeTimer = 0.8;
        this.chargeSpeed = this.speed * 3.5;
        if (GameManager.Instance && GameManager.Instance.player) {
            Vec3.subtract(this.chargeDir, GameManager.Instance.player.node.worldPosition, this.node.worldPosition);
            this.chargeDir.z = 0;
            this.chargeDir.normalize();
        }
        if (this.bossSprite) {
            this.bossSprite.color = this._bossColor;
        }
    }

    takeDamage(damage: number) {
        super.takeDamage(damage);
        EventManager.Instance.emit("BOSS_HP_UPDATE", this.hp, this.maxHp);
    }

    onDead() {
        this.isDead = true;
        EventManager.Instance.emit("BOSS_DEAD");
        if (!GameManager.Instance) return;
        const gm = GameManager.Instance;

        const expNode = ObjectPool.get("exp");
        if (expNode && gm.dropContainer) {
            expNode.setParent(gm.dropContainer);
            expNode.setWorldPosition(this.node.worldPosition);
            const expDrop = expNode.getComponent(ExpDrop);
            if (expDrop) expDrop.init(this.expReward);
        }

        // Boss死亡掉落宝箱
        const chestNode = ObjectPool.get("chest");
        if (chestNode && gm.dropContainer) {
            chestNode.setParent(gm.dropContainer);
            chestNode.setWorldPosition(this.node.worldPosition);
            const chestComp = chestNode.getComponent(TreasureChest);
            if (chestComp) {
                const goldAmount = math.randomRange(CHEST_CONFIG.goldRange[0], CHEST_CONFIG.goldRange[1]);
                chestComp.init(goldAmount);
            }
        }

        if (this.goldReward > 0) {
            gm.addGold(this.goldReward);
        }

        gm.onEnemyDead(this);
        // 标记Boss已死亡
        gm.setBossAlive(false);
        EnemyPoolManager.Instance.recycleEnemy(this.enemyType, this.node);
    }
}