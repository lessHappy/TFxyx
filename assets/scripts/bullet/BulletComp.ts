import { _decorator, Component, Node, Vec3 } from 'cc';
import { Enemy } from '../entity/Enemy';
import { BulletPoolManager, BulletType } from '../core/BulletPoolManager';
import { GameManager } from '../core/GameManager';
import { StatusType } from '../buff/StatusEffect';
const { ccclass, property } = _decorator;

@ccclass("BulletComp")
export class BulletComp extends Component {
    public damage: number = 10;
    public isPenetrate: boolean = false;
    public aoeRadius: number = 0;
    public bulletType: BulletType = BulletType.KNIFE;

    public hitEnemySet: Set<Node> = new Set();
    public onHitCallback: Function | null = null;

    public debuffType: StatusType | null = null;
    public debuffDuration: number = 0;
    public debuffValue: number = 0;
    public knockbackForce: number = 0;

    init(bulletType: BulletType, dmg: number, penetrate = false, aoeRange = 0, callback: Function = null) {
        this.bulletType = bulletType;
        this.damage = dmg;
        this.isPenetrate = penetrate;
        this.aoeRadius = aoeRange;
        this.onHitCallback = callback;
        this.hitEnemySet.clear();
        this.debuffType = null;
        this.debuffDuration = 0;
        this.debuffValue = 0;
        this.knockbackForce = 0;
    }

    setDebuff(type: StatusType, duration: number, value: number = 0): void {
        this.debuffType = type;
        this.debuffDuration = duration;
        this.debuffValue = value;
    }

    setKnockback(force: number): void {
        this.knockbackForce = force;
    }

    hitEnemy(enemy: Enemy) {
        const enemyNode = enemy.node;
        if (this.hitEnemySet.has(enemyNode)) return;

        if (this.aoeRadius > 0) {
            this.triggerAoeExplosion();
            return;
        }

        this.applyHitEffects(enemy);
        enemy.takeDamage(this.damage);
        this.hitEnemySet.add(enemyNode);

        if (!this.isPenetrate) {
            this.recycleSelf();
        }
    }

    private applyHitEffects(enemy: Enemy): void {
        const bufferManager = enemy.getBufferManager();
        if (!bufferManager) return;

        if (this.debuffType) {
            bufferManager.addEffect(this.debuffType, this.debuffDuration, this.debuffValue);
        }

        if (this.knockbackForce > 0) {
            const enemyPos = enemy.node.worldPosition;
            const bulletPos = this.node.worldPosition;
            const dirX = enemyPos.x - bulletPos.x;
            const dirY = enemyPos.y - bulletPos.y;
            enemy.applyKnockback(dirX, dirY, this.knockbackForce);
        }
    }

    triggerAoeExplosion() {
        if (this.aoeRadius > 0 && GameManager.Instance) {
            GameManager.Instance.createAoeDamageWithKnockback(
                this.node.worldPosition,
                this.aoeRadius,
                this.damage,
                this.knockbackForce
            );

            if (this.debuffType) {
                const enemies = GameManager.Instance.getEnemyInRange(this.node.worldPosition, this.aoeRadius);
                for (const enemy of enemies) {
                    const bufferManager = enemy.getBufferManager();
                    if (bufferManager) {
                        bufferManager.addEffect(this.debuffType, this.debuffDuration, this.debuffValue);
                    }
                }
            }
        }
        if (this.onHitCallback) this.onHitCallback();
        this.recycleSelf();
    }

    recycleSelf() {
        BulletPoolManager.Instance.recycleBullet(this.bulletType, this.node);
    }

    onDestroy() {
        this.hitEnemySet.clear();
        this.onHitCallback = null;
        this.debuffType = null;
        this.debuffDuration = 0;
        this.debuffValue = 0;
        this.knockbackForce = 0;
    }
}