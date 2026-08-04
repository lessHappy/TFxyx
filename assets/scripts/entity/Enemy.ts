import { _decorator, Component, Vec3 } from 'cc';
import { Player } from './Player';
import { EnemyPoolManager } from '../core/EnemyPoolManager';
import { ENEMY_CONFIG } from '../config/GameConfig';
import { GameManager } from '../core/GameManager';
import { ObjectPool } from '../core/ObjectPool';
import { ExpDrop } from './ExpDrop';
import { AudioManager } from '../core/AudioManager';
import { BufferManager } from '../buff/BufferManager';
import { StatusType } from '../buff/StatusEffect';
import { STATUS_IMMUNITY_CONFIG } from '../config/StatusEffectConfig';
const { ccclass, property } = _decorator;

@ccclass('Enemy')
export class Enemy extends Component {
    protected enemyType: string = "normal";
    public hp: number = 60;
    public maxHp: number = 60;
    protected speed: number = 80;
    protected baseSpeed: number = 80;
    public expReward: number = 8;
    protected goldReward: number = 0;
    protected damage: number = 5;
    protected isDead: boolean = false;
    protected attackCd: number = 0;
    protected readonly ATTACK_INTERVAL = 1.0;

    protected _tempDir: Vec3 = new Vec3();
    protected _tempOffset: Vec3 = new Vec3();

    protected bufferManager: BufferManager | null = null;
    protected _knockbackResistance: number = 0;

    init(type: string) {
        this.enemyType = type;
        const cfg = ENEMY_CONFIG[type];
        const scale = GameManager.Instance?.difficultyScale ?? 1;
        this.hp = cfg.hp * scale;
        this.maxHp = this.hp;
        this.speed = cfg.speed;
        this.baseSpeed = cfg.speed;
        this.expReward = cfg.exp;
        this.goldReward = cfg.gold || 0;
        this.damage = cfg.damage * scale;
        this.isDead = false;
        this.attackCd = 0;

        this.bufferManager = this.node.getComponent(BufferManager);
        if (!this.bufferManager) {
            this.bufferManager = this.node.addComponent(BufferManager);
        }
        this.bufferManager.clearAllEffects();

        this.setupStatusImmunity(type);

        if (GameManager.Instance) GameManager.Instance.enemyList.push(this);
    }

    protected setupStatusImmunity(type: string): void {
        if (!this.bufferManager) return;
        const immunity = STATUS_IMMUNITY_CONFIG[type];
        if (immunity) {
            for (const key of Object.keys(immunity)) {
                this.bufferManager.setStatusResistance(key as StatusType, immunity[key] || 0);
            }
        }
    }

    update(deltaTime: number) {
        if (this.isDead || !Player.Instance || !GameManager.Instance) return;
        const gm = GameManager.Instance;
        if (gm.battlePause || gm.gameOver) return;

        if (deltaTime > 0.1) {
            deltaTime = 0.1;
        }

        if (this.bufferManager) {
            this.bufferManager.update(deltaTime);
        }

        const frozen = this.bufferManager ? this.bufferManager.isFrozen : false;
        if (frozen) return;

        const playerPos = Player.Instance.node.worldPosition;
        const selfPos = this.node.worldPosition;
        const distSq = Vec3.distanceSquared(selfPos, playerPos);

        if (distSq < 1225) {
            this.attackCd += deltaTime;
            if (this.attackCd >= this.ATTACK_INTERVAL) {
                Player.Instance.takeDamage(this.damage);
                this.attackCd = 0;
            }
            return;
        }

        const speedMult = this.bufferManager ? this.bufferManager.speedMultiplier : 1;
        const effectiveSpeed = this.baseSpeed * speedMult;

        Vec3.subtract(this._tempDir, playerPos, selfPos);
        this._tempDir.normalize();
        Vec3.multiplyScalar(this._tempOffset, this._tempDir, effectiveSpeed * deltaTime);
        Vec3.add(this._tempOffset, selfPos, this._tempOffset);

        if (this.bufferManager) {
            const kb = this.bufferManager.knockbackVelocity;
            this._tempOffset.x += kb.x * deltaTime;
            this._tempOffset.y += kb.y * deltaTime;
        }

        this.node.setWorldPosition(this._tempOffset);
    }

    takeDamage(damage: number) {
        if (this.isDead) return;
        if (this.bufferManager && this.bufferManager.isInvincibleActive) return;

        this.hp -= damage;

        if (GameManager.Instance) {
            GameManager.Instance.showDamageNumber(this.node.worldPosition, damage, false);
            GameManager.Instance.addHeroDamage(damage);
        }

        if (Player.Instance) {
            const lifesteal = Player.Instance.getLifestealRatio();
            if (lifesteal > 0) {
                const healAmount = Math.ceil(damage * lifesteal);
                Player.Instance.hp = Math.min(Player.Instance.hp + healAmount, Player.Instance.maxHp);
            }
        }

        if (this.hp <= 0) this.onDead();
    }

    takeRawDamage(damage: number) {
        if (this.isDead) return;
        this.hp -= damage;
        if (this.hp <= 0) this.onDead();
    }

    applyKnockback(dirX: number, dirY: number, force: number): void {
        if (!this.bufferManager) return;
        const resistance = this.bufferManager.getStatusResistance(StatusType.KNOCKBACK);
        if (resistance >= 1) return;
        const effectiveForce = force * (1 - resistance);
        this.bufferManager.applyKnockback(dirX, dirY, effectiveForce);
    }

    getBufferManager(): BufferManager | null {
        return this.bufferManager;
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