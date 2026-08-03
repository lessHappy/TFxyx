import { _decorator, Component, Vec3, tween, Sprite, Color } from 'cc';
import { Player } from './Player';
import { GameManager } from '../core/GameManager';
import { ObjectPool } from '../core/ObjectPool';
import { CHEST_CONFIG } from '../config/GameConfig';
const { ccclass, property } = _decorator;

@ccclass('TreasureChest')
export class TreasureChest extends Component {
    @property(Sprite) chestSprite: Sprite = null!;

    private goldAmount: number = 0;
    private isOpened: boolean = false;
    private _pickRange: number = 35;
    private _pickRangeSq: number = 1225;
    private _tempPos: Vec3 = new Vec3();
    private _flashColor: Color = new Color(255, 255, 200, 255);
    private _normalColor: Color = new Color(255, 255, 255, 255);
    private _flashTimer: number = 0;

    init(gold: number) {
        this.goldAmount = gold;
        this.isOpened = false;
        this._flashTimer = 0;
        if (this.chestSprite) {
            this.chestSprite.color = this._normalColor;
        }
    }

    update(dt: number) {
        if (this.isOpened) return;
        if (!GameManager.Instance || GameManager.Instance.battlePause) return;
        if (!Player.Instance) return;

        // 宝箱闪烁效果
        this._flashTimer += dt;
        if (this.chestSprite && this._flashTimer > 0.5) {
            this._flashTimer = 0;
            this.chestSprite.color = this.chestSprite.color.equals(this._normalColor)
                ? this._flashColor : this._normalColor;
        }

        const distSq = Vec3.distanceSquared(this.node.worldPosition, Player.Instance.node.worldPosition);
        if (distSq < this._pickRangeSq) {
            this.openChest();
        }
    }

    private static _scaleUp: Vec3 = new Vec3(1.3, 1.3, 1);
    private static _scaleDown: Vec3 = new Vec3(0, 0, 1);

    private openChest() {
        this.isOpened = true;
        if (GameManager.Instance) {
            GameManager.Instance.addGold(this.goldAmount);
        }
        if (this.chestSprite) {
            tween(this.chestSprite.node)
                .to(0.2, { scale: TreasureChest._scaleUp })
                .to(0.2, { scale: TreasureChest._scaleDown })
                .call(() => {
                    this.node.active = false;
                    ObjectPool.put("chest", this.node);
                })
                .start();
        } else {
            this.node.active = false;
            ObjectPool.put("chest", this.node);
        }
    }
}