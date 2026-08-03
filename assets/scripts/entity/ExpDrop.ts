import { _decorator, Component, Vec3 } from 'cc';
import { Player } from './Player';
import { ObjectPool } from '../core/ObjectPool';
import { EXP_DROP_CONFIG } from '../config/GameConfig';
import { GameManager } from '../core/GameManager';
const { ccclass, property } = _decorator;

@ccclass('ExpDrop')
export class ExpDrop extends Component {
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

    update(deltaTime: number) {
        if (!Player.Instance || GameManager.Instance?.battlePause) return;
        const playerPos = Player.Instance.node.worldPosition;
        const selfPos = this.node.worldPosition;
        const dist = Vec3.distance(selfPos, playerPos);

        if (dist < EXP_DROP_CONFIG.pickUpRange) {
            this.pickUp();
            return;
        }
        if (dist < EXP_DROP_CONFIG.magnetRange) {
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
        ObjectPool.put("exp", this.node);
    }
}