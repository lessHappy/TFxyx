import { _decorator, Component, Vec3 } from 'cc';
import { Player } from './Player';
import { ObjectPool } from '../core/ObjectPool';
import { EXP_DROP_CONFIG } from '../config/GameConfig';
import { GameManager } from '../core/GameManager';
import { TalentManager } from '../core/TalentManager';
import { TalentType } from '../config/TalentConfig';
import { EventManager } from '../core/EventManager';
const { ccclass, property } = _decorator;

@ccclass('ExpDrop')
export class ExpDrop extends Component {
    private static _firstPickDone: boolean = false;

    static resetFirstPick() {
        ExpDrop._firstPickDone = false;
    }

    private expValue: number = 5;
    private isAttracting: boolean = false;

    // 复用Vec3，减少GC
    private _tempDir: Vec3 = new Vec3();
    private _tempMove: Vec3 = new Vec3();

    init(expNum: number) {
        const gm = GameManager.Instance;
        if (!gm || !gm.dropContainer) {
            ObjectPool.put("exp", this.node);
            return;
        }
        const totalDrop = gm.dropContainer.children.length;
        if (totalDrop >= EXP_DROP_CONFIG.maxDropCount) {
            if (Player.Instance) Player.Instance.addExp(expNum);
            ObjectPool.put("exp", this.node);
            return;
        }
        this.expValue = expNum;
        this.isAttracting = false;
    }

    private static readonly PICK_RANGE_SQ: number = EXP_DROP_CONFIG.pickUpRange * EXP_DROP_CONFIG.pickUpRange;
    private static readonly MAGNET_RANGE_SQ: number = EXP_DROP_CONFIG.magnetRange * EXP_DROP_CONFIG.magnetRange;

    private _cachedPickupBonus: number = 1;
    private _bonusCached: boolean = false;

    private getPickupBonus(): number {
        if (!this._bonusCached) {
            this._cachedPickupBonus = TalentManager.Instance.getEffectPercent(TalentType.PICKUP_RANGE);
            this._bonusCached = true;
        }
        return this._cachedPickupBonus;
    }

    private getPickRangeSq(): number {
        const bonus = this.getPickupBonus();
        return ExpDrop.PICK_RANGE_SQ * bonus * bonus;
    }

    private getMagnetRangeSq(): number {
        const bonus = this.getPickupBonus();
        return ExpDrop.MAGNET_RANGE_SQ * bonus * bonus;
    }

    update(deltaTime: number) {
        if (!Player.Instance || GameManager.Instance?.battlePause) return;
        if (deltaTime > 0.1) deltaTime = 0.1;
        const playerPos = Player.Instance.node.worldPosition;
        const selfPos = this.node.worldPosition;
        const distSq = Vec3.distanceSquared(selfPos, playerPos);

        if (distSq < this.getPickRangeSq()) {
            this.pickUp();
            return;
        }
        if (distSq < this.getMagnetRangeSq()) {
            this.isAttracting = true;
        }
        if (this.isAttracting) {
            Vec3.subtract(this._tempDir, playerPos, selfPos);
            this._tempDir.normalize();
            Vec3.multiplyScalar(this._tempMove, this._tempDir, EXP_DROP_CONFIG.attractSpeed * deltaTime);
            Vec3.add(this._tempMove, selfPos, this._tempMove);
            this.node.setWorldPosition(this._tempMove);
        }
    }

    pickUp() {
        if (Player.Instance) Player.Instance.addExp(this.expValue);
        if (!ExpDrop._firstPickDone) {
            ExpDrop._firstPickDone = true;
            EventManager.Instance.emit("FIRST_EXP_PICKUP");
        }
        ObjectPool.put("exp", this.node);
    }
}