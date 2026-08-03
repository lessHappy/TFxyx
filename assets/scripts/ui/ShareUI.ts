import { _decorator, Component, Node, Label, Button, UIOpacity, tween } from 'cc';
import { ShareType, SHARE_CONFIG } from '../config/ShareConfig';
import { ShareManager } from '../core/ShareManager';
import { StorageUtil } from '../core/StorageUtil';
import { AudioManager } from '../core/AudioManager';
const { ccclass, property } = _decorator;

export interface ShareUICallback {
    onGoldChanged?: (gold: number) => void;
}

@ccclass("ShareUI")
export class ShareUI extends Component {
    @property(Node) panel: Node = null!;
    @property(Label) labTitle: Label = null!;

    @property(Button) btnShareGold: Button = null!;
    @property(Label) labGoldRemain: Label = null!;
    @property(Button) btnShareDaily: Button = null!;
    @property(Label) labDailyRemain: Label = null!;
    @property(Button) btnShareInvite: Button = null!;
    @property(Label) labInviteRemain: Label = null!;
    @property(Button) btnShareRevive: Button = null!;
    @property(Label) labReviveRemain: Label = null!;

    @property(Button) btnClose: Button = null!;

    private _isShow: boolean = false;
    private _callback: ShareUICallback | null = null;

    onLoad() {
        if (this.panel) {
            this.panel.active = false;
        }

        if (this.btnClose) {
            this.btnClose.node.on(Button.Event.CLICK, this.hide, this);
        }

        if (this.btnShareGold) {
            this.btnShareGold.node.on(Button.Event.CLICK, () => this.onShare(ShareType.GOLD), this);
        }
        if (this.btnShareDaily) {
            this.btnShareDaily.node.on(Button.Event.CLICK, () => this.onShare(ShareType.DAILY), this);
        }
        if (this.btnShareInvite) {
            this.btnShareInvite.node.on(Button.Event.CLICK, () => this.onShare(ShareType.INVITE), this);
        }
        if (this.btnShareRevive) {
            this.btnShareRevive.node.on(Button.Event.CLICK, () => this.onShare(ShareType.REVIVE), this);
        }
    }

    onDestroy() {
        if (this.btnClose) {
            this.btnClose.node.off(Button.Event.CLICK, this.hide, this);
        }
    }

    init(callback: ShareUICallback) {
        this._callback = callback;
    }

    show() {
        if (this._isShow) return;
        this._isShow = true;
        ShareManager.Instance.load();
        this.refreshButtons();
        this.playShowAnimation();
    }

    hide() {
        if (!this._isShow) return;
        this._isShow = false;
        this.playHideAnimation();
    }

    private refreshButtons() {
        this.refreshButton(ShareType.GOLD, this.btnShareGold, this.labGoldRemain);
        this.refreshButton(ShareType.DAILY, this.btnShareDaily, this.labDailyRemain);
        this.refreshButton(ShareType.INVITE, this.btnShareInvite, this.labInviteRemain);
        this.refreshButton(ShareType.REVIVE, this.btnShareRevive, this.labReviveRemain);
    }

    private refreshButton(type: ShareType, btn: Button | null, lab: Label | null) {
        if (!btn) return;
        const cfg = SHARE_CONFIG[type];
        const canShare = ShareManager.Instance.canShare(type);
        const remaining = ShareManager.Instance.getRemainingCount(type);

        btn.interactable = canShare;

        if (lab) {
            if (remaining <= 0) {
                lab.string = "今日已用完";
            } else {
                const reward = cfg.reward;
                if (reward) {
                    const rewardText = reward.type === "gold" ? `${reward.amount}金币` : "复活机会";
                    lab.string = `${cfg.desc}（${rewardText}）剩余${remaining}次`;
                } else {
                    lab.string = `${cfg.desc} 剩余${remaining}次`;
                }
            }
        }
    }

    private onShare(type: ShareType) {
        if (!ShareManager.Instance.canShare(type)) {
            const wx = (window as any).wx;
            if (wx) wx.showToast({ title: "今日分享次数已用完" });
            return;
        }

        const success = ShareManager.Instance.share(type);
        if (success) {
            AudioManager.Instance.playSfx("audio/sfx/select");
            this.refreshButtons();

            const reward = ShareManager.Instance.getShareReward(type);
            if (reward && reward.type === "gold" && this._callback?.onGoldChanged) {
                const gold = StorageUtil.getNumber("sgzy_gold", 0);
                this._callback.onGoldChanged(gold);
            }

            const wx = (window as any).wx;
            if (wx) {
                const cfg = SHARE_CONFIG[type];
                const reward = cfg.reward;
                if (reward) {
                    const rewardText = reward.type === "gold" ? `${reward.amount}金币` : "复活机会×1";
                    wx.showToast({ title: `分享成功！获得${rewardText}` });
                } else {
                    wx.showToast({ title: "分享成功！" });
                }
            }
        }
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