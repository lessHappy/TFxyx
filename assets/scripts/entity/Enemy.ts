import { _decorator, Component, Vec3 } from 'cc';
import { Player } from './Player';
import { EnemyPoolManager } from '../core/EnemyPoolManager';
import { ENEMY_CONFIG } from '../config/GameConfig';
import { GameManager } from '../core/GameManager';
import { ObjectPool } from '../core/ObjectPool';
import { ExpDrop } from './ExpDrop';
import { AudioManager } from '../core/AudioManager';
const { ccclass, property } = _decorator;

@ccclass('Enemy')
export class Enemy extends Component {
    protected enemyType: string = "normal";
    public hp: number = 60;
    public maxHp: number = 60;
    protected speed: number = 80;
    public expReward: number = 8;
    protected goldReward: number = 0;
    protected damage: number = 5;
    protected isDead: boolean = false;
    protected attackCd: number = 0;
    protected readonly ATTACK_INTERVAL = 1.0;

    protected _tempDir: Vec3 = new Vec3();
    protected _tempOffset: Vec3 = new Vec3();

    init(type: string) {
        this.enemyType = type;
        const cfg = ENEMY_CONFIG[type];
        const scale = GameManager.Instance?.difficultyScale ?? 1;
        this.hp = cfg.hp * scale;
        this.maxHp = this.hp;
        this.speed = cfg.speed;
        this.expReward = cfg.exp;
        this.goldReward = cfg.gold || 0;
        this.damage = cfg.damage * scale;
        this.isDead = false;
        this.attackCd = 0;
        if (GameManager.Instance) GameManager.Instance.enemyList.push(this);
    }

    update(deltaTime: number) {
        if (this.isDead || !Player.Instance || !GameManager.Instance) return;
        const gm = GameManager.Instance;
        if (gm.battlePause || gm.gameOver) return;

        const playerPos = Player.Instance.node.worldPosition;
        const selfPos = this.node.worldPosition;
        const dist = Vec3.distance(selfPos, playerPos);

        if (dist < 35) {
            this.attackCd += deltaTime;
            if (this.attackCd >= this.ATTACK_INTERVAL) {
                Player.Instance.takeDamage(this.damage);
                this.attackCd = 0;
            }
            return;
        }

        Vec3.subtract(this._tempDir, playerPos, selfPos);
        this._tempDir.normalize();
        Vec3.multiplyScalar(this._tempOffset, this._tempDir, this.speed * deltaTime);
        Vec3.add(this._tempOffset, selfPos, this._tempOffset);
        this.node.setWorldPosition(this._tempOffset);
    }

    takeDamage(damage: number) {
        if (this.isDead) return;
        this.hp -= damage;

        // 展示伤害数字
        if (GameManager.Instance) {
            GameManager.Instance.showDamageNumber(this.node.worldPosition, damage, false);
        }

        if (this.hp <= 0) this.onDead();
    }

    onDead() {
        this.isDead = true;
        if (!GameManager.Instance) return;
        const gm = GameManager.Instance;

        const expNode = ObjectPool.get("exp");
        if (expNode && gm.dropContainer) {
            expNode.setParent(gm.dropContainer);
            expNode.setWorldPosition(this.node.worldPosition);
            const expDrop = expNode.getComponent(ExpDrop);
            if (expDrop) expDrop.init(this.expReward);
        }

        if (this.goldReward > 0) {
            gm.addGold(this.goldReward);
            AudioManager.Instance.playSfx("audio/sfx/gold");
        }

        gm.onEnemyDead(this);
        EnemyPoolManager.Instance.recycleEnemy(this.enemyType, this.node);
    }
}