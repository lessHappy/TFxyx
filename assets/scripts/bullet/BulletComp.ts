import { _decorator, Component, Node, Vec3 } from 'cc';
import { Enemy } from '../entity/Enemy';
import { BulletPoolManager, BulletType } from '../core/BulletPoolManager';
import { GameManager } from '../core/GameManager';
const { ccclass, property } = _decorator;

@ccclass("BulletComp")
export class BulletComp extends Component {
    public damage: number = 10;
    public isPenetrate: boolean = false;
    public aoeRadius: number = 0;
    public bulletType: BulletType = BulletType.KNIFE;

    public hitEnemySet: Set<Node> = new Set();
    public onHitCallback: Function | null = null;

    init(bulletType: BulletType, dmg: number, penetrate = false, aoeRange = 0, callback: Function = null) {
        this.bulletType = bulletType;
        this.damage = dmg;
        this.isPenetrate = penetrate;
        this.aoeRadius = aoeRange;
        this.onHitCallback = callback;
        this.hitEnemySet.clear();
    }

    hitEnemy(enemy: Enemy) {
        const enemyNode = enemy.node;
        if (this.hitEnemySet.has(enemyNode)) return;

        if (this.aoeRadius > 0) {
            this.triggerAoeExplosion();
            return;
        }

        enemy.takeDamage(this.damage);
        this.hitEnemySet.add(enemyNode);

        if (!this.isPenetrate) {
            this.recycleSelf();
        }
    }

    triggerAoeExplosion() {
        if (this.aoeRadius > 0 && GameManager.Instance) {
            GameManager.Instance.createAoeDamage(
                this.node.worldPosition,
                this.aoeRadius,
                this.damage
            );
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
    }
}