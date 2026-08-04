import { _decorator, Vec3 } from 'cc';
import { Enemy } from './Enemy';
import { Player } from './Player';
import { EnemyBullet } from './EnemyBullet';
import { GameManager } from '../core/GameManager';
const { ccclass } = _decorator;

@ccclass('RangedEnemy')
export class RangedEnemy extends Enemy {
    private _shootTimer: number = 0;
    private _shootInterval: number = 2.0;
    private _preferredDist: number = 200;
    private _preferredDistSq: number = 200 * 200;
    private _retreatSpeed: number = 0;
    private _tempBulletDir: Vec3 = new Vec3();

    init(type: string) {
        super.init(type);
        this._shootTimer = this._shootInterval * 0.5;
        this._retreatSpeed = this.speed * 0.7;
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

        this._shootTimer += deltaTime;
        if (this._shootTimer >= this._shootInterval) {
            this._shootTimer = 0;
            this.shoot();
        }
    }

    shoot() {
        if (!Player.Instance) return;
        this._tempBulletDir.set(this._tempDir);
        EnemyBullet.spawn(
            this.node.worldPosition.clone(),
            this._tempBulletDir,
            this.damage,
            200,
            3,
            0,
            false
        );
    }
}