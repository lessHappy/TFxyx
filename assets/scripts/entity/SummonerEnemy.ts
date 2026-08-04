import { _decorator, Vec3, math } from 'cc';
import { Enemy } from './Enemy';
import { Player } from './Player';
import { GameManager } from '../core/GameManager';
import { EnemyPoolManager, EnemyType } from '../core/EnemyPoolManager';
const { ccclass } = _decorator;

@ccclass('SummonerEnemy')
export class SummonerEnemy extends Enemy {
    private _summonTimer: number = 0;
    private _summonInterval: number = 6;
    private _summonCount: number = 3;
    private _preferredDist: number = 250;
    private _preferredDistSq: number = 250 * 250;
    private _retreatSpeed: number = 0;
    private _tempSpawnPos: Vec3 = new Vec3();

    init(type: string) {
        super.init(type);
        this._summonTimer = this._summonInterval * 0.3;
        this._retreatSpeed = this.speed * 0.6;
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

        this._summonTimer += deltaTime;
        if (this._summonTimer >= this._summonInterval) {
            this._summonTimer = 0;
            this.summonMinions();
        }
    }

    summonMinions() {
        if (!Player.Instance || !GameManager.Instance) return;
        const selfPos = this.node.worldPosition;

        for (let i = 0; i < this._summonCount; i++) {
            const angle = math.randomRange(0, Math.PI * 2);
            const dist = math.randomRange(40, 100);
            this._tempSpawnPos.set(
                selfPos.x + Math.cos(angle) * dist,
                selfPos.y + Math.sin(angle) * dist,
                0
            );

            const minionNode = EnemyPoolManager.Instance.getEnemy(EnemyType.NORMAL);
            if (!minionNode) continue;

            minionNode.setWorldPosition(this._tempSpawnPos);
            const minionComp = minionNode.getComponent(Enemy);
            if (minionComp) {
                minionComp.init("normal");
            }
        }
    }
}