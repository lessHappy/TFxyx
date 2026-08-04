import { _decorator, Vec3 } from 'cc';
import { Enemy } from './Enemy';
import { Player } from './Player';
import { GameManager } from '../core/GameManager';
const { ccclass } = _decorator;

@ccclass('HealerEnemy')
export class HealerEnemy extends Enemy {
    private _healTimer: number = 0;
    private _healInterval: number = 2.5;
    private _healAmount: number = 10;
    private _healRange: number = 150;
    private _healRangeSq: number = 150 * 150;
    private _preferredDist: number = 220;
    private _preferredDistSq: number = 220 * 220;
    private _retreatSpeed: number = 0;
    private _healTargets: Enemy[] = [];

    init(type: string) {
        super.init(type);
        this._healTimer = this._healInterval * 0.5;
        this._retreatSpeed = this.speed * 0.6;
        this._healAmount = Math.ceil(this.damage * 2);
    }

    update(deltaTime: number) {
        if (this.isDead || !Player.Instance || !GameManager.Instance) return;
        const gm = GameManager.Instance;
        if (gm.battlePause || gm.gameOver) return;

        if (deltaTime > 0.1) {
            deltaTime = 0.1;
        }

        const playerPos = Player.Instance.node.worldPosition;
        const selfPos = this.node.worldPosition;
        const distSq = Vec3.distanceSquared(selfPos, playerPos);

        Vec3.subtract(this._tempDir, playerPos, selfPos);
        this._tempDir.normalize();

        if (distSq < this._preferredDistSq) {
            Vec3.multiplyScalar(this._tempOffset, this._tempDir, -this._retreatSpeed * deltaTime);
            Vec3.add(this._tempOffset, selfPos, this._tempOffset);
            this.node.setWorldPosition(this._tempOffset);
        } else if (distSq > this._preferredDistSq * 2.25) {
            Vec3.multiplyScalar(this._tempOffset, this._tempDir, this.speed * deltaTime);
            Vec3.add(this._tempOffset, selfPos, this._tempOffset);
            this.node.setWorldPosition(this._tempOffset);
        }

        this._healTimer += deltaTime;
        if (this._healTimer >= this._healInterval) {
            this._healTimer = 0;
            this.healNearbyAllies();
        }
    }

    healNearbyAllies() {
        if (!GameManager.Instance) return;
        const selfPos = this.node.worldPosition;
        const enemyList = GameManager.Instance.enemyList;

        this._healTargets.length = 0;
        for (let i = 0; i < enemyList.length; i++) {
            const enemy = enemyList[i];
            if (enemy === this || enemy.isDead || !enemy.node.active) continue;
            if (enemy.constructor === HealerEnemy) continue;

            const distSq = Vec3.distanceSquared(selfPos, enemy.node.worldPosition);
            if (distSq < this._healRangeSq) {
                this._healTargets.push(enemy);
            }
        }

        const healPerTarget = this._healAmount;
        for (let i = 0; i < this._healTargets.length; i++) {
            const target = this._healTargets[i];
            target.hp = Math.min(target.hp + healPerTarget, target.maxHp);
        }
    }
}