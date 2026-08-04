import { _decorator, Vec3 } from 'cc';
import { Enemy } from './Enemy';
import { Player } from './Player';
import { GameManager } from '../core/GameManager';
const { ccclass } = _decorator;

@ccclass('ControllerEnemy')
export class ControllerEnemy extends Enemy {
    private _slowAmount: number = 0.4;
    private _slowDuration: number = 2.0;
    private _slowCd: number = 0;
    private readonly SLOW_COOLDOWN: number = 4.0;
    private _rootDuration: number = 1.0;
    private _rootCd: number = 0;
    private readonly ROOT_COOLDOWN: number = 8.0;
    private _preferredDist: number = 180;
    private _preferredDistSq: number = 180 * 180;
    private _retreatSpeed: number = 0;

    init(type: string) {
        super.init(type);
        this._slowCd = this.SLOW_COOLDOWN * 0.5;
        this._rootCd = this.ROOT_COOLDOWN * 0.5;
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

        this._slowCd += deltaTime;
        this._rootCd += deltaTime;

        const controlRange = 300 * 300;
        if (distSq < controlRange) {
            if (this._rootCd >= this.ROOT_COOLDOWN) {
                this._rootCd = 0;
                this.applyRoot();
            } else if (this._slowCd >= this.SLOW_COOLDOWN) {
                this._slowCd = 0;
                this.applySlow();
            }
        }
    }

    applySlow() {
        if (!Player.Instance) return;
        Player.Instance.applySlow(this._slowAmount, this._slowDuration);
    }

    applyRoot() {
        if (!Player.Instance) return;
        Player.Instance.applyRoot(this._rootDuration);
    }
}