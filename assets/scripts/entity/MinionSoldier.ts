import { _decorator, Component, Vec3 } from 'cc';
import { Enemy } from './Enemy';
import { GameManager } from '../core/GameManager';
const { ccclass, property } = _decorator;

@ccclass('MinionSoldier')
export class MinionSoldier extends Component {
    private damage: number = 10;
    private attackTarget: Enemy | null = null;
    private attackCd: number = 0;
    private readonly ATTACK_INTERVAL = 0.8;
    private readonly SEARCH_RANGE = 180;
    private readonly ATTACK_RANGE = 50;

    init(dmg: number) {
        this.damage = dmg;
        this.attackCd = 0;
        this.attackTarget = null;
    }

    setAttackTarget(target: Enemy) {
        this.attackTarget = target;
    }

    update(delta: number) {
        if (GameManager.Instance?.battlePause) return;

        if (!this.attackTarget || !this.attackTarget.node || !this.attackTarget.node.active) {
            this.attackTarget = GameManager.Instance?.getNearestEnemy(
                this.node.worldPosition, this.SEARCH_RANGE
            ) || null;
            return;
        }

        this.attackCd += delta;
        if (this.attackCd < this.ATTACK_INTERVAL) return;

        const dist = Vec3.distance(this.node.worldPosition, this.attackTarget.node.worldPosition);
        if (dist < this.ATTACK_RANGE) {
            this.attackTarget.takeDamage(this.damage);
            this.attackCd = 0;
        }
    }
}