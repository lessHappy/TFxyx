import { _decorator, Component, Node, Label, Button, EditBox, UIOpacity, tween, Color } from 'cc';
import { RedeemManager } from '../core/RedeemManager';
import { StorageUtil } from '../core/StorageUtil';
import { AudioManager } from '../core/AudioManager';
const { ccclass, property } = _decorator;

export interface RedeemUICallback {
    onGoldChanged?: (gold: number) => void;
}

@ccclass("RedeemUI")
export class RedeemUI extends Component {
    @property(Node) panel: Node = null!;
    @property(Label) labTitle: Label = null!;
    @property(EditBox) inputCode: EditBox = null!;
    @property(Label) labResult: Label = null!;
    @property(Button) btnRedeem: Button = null!;
    @property(Button) btnClose: Button = null!;

    private _isShow: boolean = false;
    private _callback: RedeemUICallback | null = null;

    onLoad() {
        if (this.panel) {
            this.panel.active = false;
        }

        if (this.btnClose) {
            this.btnClose.node.on(Button.Event.CLICK, this.hide, this);
        }
        if (this.btnRedeem) {
            this.btnRedeem.node.on(Button.Event.CLICK, this.onRedeem, this);
        }

        if (this.inputCode) {
            this.inputCode.node.on("editing-return", this.onRedeem, this);
        }
    }

    init(callback: RedeemUICallback) {
        this._callback = callback;
    }

    show() {
        if (this._isShow) return;
        this._isShow = true;
        RedeemManager.Instance.init();
        this.clearInput();
        this.clearResult();
        this.playShowAnimation();
    }

    hide() {
        if (!this._isShow) return;
        this._isShow = false;
        this.playHideAnimation();
    }

    private clearInput() {
        if (this.inputCode) {
            this.inputCode.string = "";
        }
    }

    private clearResult() {
        if (this.labResult) {
            this.labResult.node.active = false;
        }
    }

    private onRedeem() {
        if (!this.inputCode) return;

        const code = this.inputCode.string.trim();
        if (!code) {
            this.showResult("请输入兑换码", false);
            return;
        }

        const result = RedeemManager.Instance.redeem(code);

        AudioManager.Instance.playSfx(result.success ? "audio/sfx/select" : "audio/sfx/hurt");
        this.showResult(result.message, result.success);

        if (result.success) {
            this.clearInput();
            if (this._callback?.onGoldChanged) {
                const gold = StorageUtil.getNumber("sgzy_gold", 0);
                this._callback.onGoldChanged(gold);
            }
        }
    }

    private showResult(message: string, isSuccess: boolean) {
        if (!this.labResult) return;

        this.labResult.node.active = true;
        this.labResult.string = message;
        this.labResult.color = isSuccess ? new Color(100, 255, 100, 255) : new Color(255, 100, 100, 255);

        this.unscheduleAllCallbacks();
        this.scheduleOnce(() => {
            if (this.labResult) {
                this.labResult.node.active = false;
            }
        }, 3);
    }

    private playShowAnimation() {
        if (!this.panel) return;
        this.panel.active = true;
        const opacity = this.panel.getComponent(UIOpacity);
        if (opacity) {
            opacity.opacity = 0;
            tween(opacity).to(0.25, { opacity: 255 }).start();
        }
    }

    private playHideAnimation() {
        if (!this.panel) return;
        const opacity = this.panel.getComponent(UIOpacity);
        if (opacity) {
            tween(opacity).to(0.2, { opacity: 0 }).call(() => {
                this.panel.active = false;
            }).start();
        } else {
            this.panel.active = false;
        }
    }
}