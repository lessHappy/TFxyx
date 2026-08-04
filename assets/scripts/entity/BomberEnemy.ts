import { _decorator, Vec3 } from 'cc';
import { Enemy } from './Enemy';
import { Player } from './Player';
import { GameManager } from '../core/GameManager';
const { ccclass } = _decorator;

@ccclass('BomberEnemy')
export class BomberEnemy extends Enemy {
    private _explodeRange: number = 80;
    private _explodeRangeSq: number = 80 * 80;
    private _explodeDamage: number = 0;
    private _isExploding: boolean = false;
    private _explodeTimer: number = 0;
    private readonly EXPLODE_DELAY: number = 0.5;

    init(type: string) {
        super.init(type);
        this._explodeDamage = this.damage * 3;
        this._isExploding = false;
        this._explodeTimer = 0;
    }

    update(deltaTime: number) {
        if (this.isDead || !Player.Instance || !GameManager.Instance) return;
        const gm = GameManager.Instance;
        if (gm.battlePause || gm.gameOver) return;

        if (deltaTime > 0.1) {
            deltaTime = 0.1;
        }

        if (this._isExploding) {
            this._explodeTimer += deltaTime;
            if (this._explodeTimer >= this.EXPLODE_DELAY) {
                this.explode();
            }
            return;
        }

        const playerPos = Player.Instance.node.worldPosition;
        const selfPos = this.node.worldPosition;
        const distSq = Vec3.distanceSquared(selfPos, playerPos);

        if (distSq < this._explodeRangeSq) {
            this._isExploding = true;
            this._explodeTimer = 0;
            return;
        }

        Vec3.subtract(this._tempDir, playerPos, selfPos);
        this._tempDir.normalize();
        Vec3.multiplyScalar(this._tempOffset, this._tempDir, this.speed * deltaTime);
        Vec3.add(this._tempOffset, selfPos, this._tempOffset);
        this.node.setWorldPosition(this._tempOffset);
    }

    explode() {
        if (!Player.Instance || !GameManager.Instance) return;

        const selfPos = this.node.worldPosition;
        const playerPos = Player.Instance.node.worldPosition;
        const distSq = Vec3.distanceSquared(selfPos, playerPos);

        if (distSq < this._explodeRangeSq) {
            Player.Instance.takeDamage(this._explodeDamage);
        }

        if (GameManager.Instance) {
            GameManager.Instance.createAoeDamage(selfPos, this._explodeRange, 0);
        }

        this.onDead();
    }
}