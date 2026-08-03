import { _decorator, Vec3 } from 'cc';
import { WeaponBase } from './WeaponBase';
import { GameManager } from '../core/GameManager';
import { BulletPoolManager, BulletType } from '../core/BulletPoolManager';
import { BulletComp } from '../bullet/BulletComp';
const { ccclass, property } = _decorator;

@ccclass("BoomerangWeapon")
export class BoomerangWeapon extends WeaponBase {
    private _dir: Vec3 = new Vec3();

    protected onInit(): void { }

    protected attack(): void {
        const target = GameManager.Instance.getNearestEnemy(this.player.node.worldPosition, this.config.range);
        if (!target) return;

        const startPos = this.player.node.worldPosition;
        const bullet = BulletPoolManager.Instance.getBullet(BulletType.BOOMERANG);
        if (!bullet) return;

        bullet.setWorldPosition(startPos);
        const bulletComp = bullet.getComponent(BulletComp)!;
        bulletComp.init(BulletType.BOOMERANG, this.getFinalDamage(), true);

        GameManager.Instance.registerBullet(bullet, bulletComp);

        const targetPos = target.node.worldPosition;
        Vec3.subtract(this._dir, targetPos, startPos);
        const len = this._dir.length();
        const nx = len > 0 ? this._dir.x / len : 1;
        const ny = len > 0 ? this._dir.y / len : 0;
        const nz = len > 0 ? this._dir.z / len : 0;

        const speed = this.config.projectileSpeed;
        const maxDist = this.config.range * 2;
        const halfDist = this.config.range;
        let travelDist = 0;

        const tickFunc = (dt: number) => {
            const step = speed * dt;
            travelDist += step;
            if (travelDist >= maxDist) {
                bullet.unschedule(tickFunc);
                bulletComp.recycleSelf();
                return;
            }
            const progress = travelDist <= halfDist
                ? travelDist / halfDist
                : 2 - travelDist / halfDist;
            const curDist = progress * halfDist;
            bullet.setWorldPosition(
                startPos.x + nx * curDist,
                startPos.y + ny * curDist,
                startPos.z + nz * curDist
            );
        };
        bullet.schedule(tickFunc, 0.016);
    }
}