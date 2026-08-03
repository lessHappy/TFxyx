import { _decorator, Vec3 } from 'cc';
import { WeaponBase } from './WeaponBase';
import { GameManager } from '../core/GameManager';
import { BulletPoolManager, BulletType } from '../core/BulletPoolManager';
import { BulletComp } from '../bullet/BulletComp';
const { ccclass, property } = _decorator;

@ccclass("KnifeWeapon")
export class KnifeWeapon extends WeaponBase {
    private _dir: Vec3 = new Vec3();
    private _step: Vec3 = new Vec3();

    protected onInit(): void { }

    protected attack(): void {
        const target = GameManager.Instance.getNearestEnemy(this.player.node.worldPosition, this.config.range);
        if (!target) return;

        const startPos = this.player.node.worldPosition;
        const bullet = BulletPoolManager.Instance.getBullet(BulletType.KNIFE);
        if (!bullet) return;

        bullet.setWorldPosition(startPos);
        const bulletComp = bullet.getComponent(BulletComp)!;
        bulletComp.init(BulletType.KNIFE, this.getFinalDamage(), true);

        const targetPos = target.node.worldPosition;
        Vec3.subtract(this._dir, targetPos, startPos);
        const len = this._dir.length();
        if (len > 0) {
            this._dir.x /= len;
            this._dir.y /= len;
            this._dir.z /= len;
        } else {
            this._dir.set(1, 0, 0);
        }

        const speed = this.config.projectileSpeed;
        const maxDist = this.config.range;
        let travelDist = 0;

        const tickFunc = (dt: number) => {
            const step = speed * dt;
            Vec3.multiplyScalar(this._step, this._dir, step);
            const pos = bullet.worldPosition;
            bullet.setWorldPosition(pos.x + this._step.x, pos.y + this._step.y, pos.z + this._step.z);
            travelDist += step;
            if (travelDist >= maxDist) {
                bullet.unschedule(tickFunc);
                bulletComp.recycleSelf();
            }
        };
        bullet.schedule(tickFunc, 0.016);

        GameManager.Instance.registerBullet(bullet, bulletComp);
    }
}