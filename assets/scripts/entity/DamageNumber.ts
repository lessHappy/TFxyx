import { _decorator, Component, Label, Vec3, tween, UIOpacity, Color } from 'cc';
import { ObjectPool } from '../core/ObjectPool';
const { ccclass, property } = _decorator;

@ccclass('DamageNumber')
export class DamageNumber extends Component {
    @property(Label) label: Label = null!;

    private _uiOpacity: UIOpacity | null = null;
    private _tweenPos: Vec3 = new Vec3();

    private static _critColor: Color = new Color(255, 200, 50, 255);
    private static _normalColor: Color = new Color(255, 255, 255, 255);

    onLoad() {
        this._uiOpacity = this.node.getComponent(UIOpacity);
    }

    show(value: number, worldPos: Vec3, isCrit: boolean = false) {
        this.label.string = isCrit ? `${Math.floor(value)}!` : `${Math.floor(value)}`;
        this.label.color = isCrit ? DamageNumber._critColor : DamageNumber._normalColor;

        this.node.setWorldPosition(worldPos.x, worldPos.y + 30, worldPos.z);

        if (this._uiOpacity) this._uiOpacity.opacity = 255;
        this.node.active = true;

        const startY = this.node.position.y;
        this._tweenPos.set(this.node.position.x, startY + 50, 0);
        tween(this.node)
            .to(0.6, { position: this._tweenPos })
            .call(() => {
                this.node.active = false;
                ObjectPool.put("dmg_number", this.node);
            })
            .start();

        if (this._uiOpacity) {
            tween(this._uiOpacity)
                .delay(0.3)
                .to(0.3, { opacity: 0 })
                .start();
        }
    }
}