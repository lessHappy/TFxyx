import { _decorator, Component, Node, Label, Button, UIOpacity, tween, Prefab, instantiate, Color, Sprite } from 'cc';
import { SignInManager } from '../core/SignInManager';
import { SIGN_IN_WEEKLY, SignInDayData, SignInRewardType } from '../config/SignInConfig';
import { StorageUtil } from '../core/StorageUtil';
import { AudioManager } from '../core/AudioManager';
const { ccclass, property } = _decorator;

export interface SignInUICallback {
    onGoldChanged?: (gold: number) => void;
}

@ccclass("SignInUI")
export class SignInUI extends Component {
    @property(Node) panel: Node = null!;
    @property(Label) labTitle: Label = null!;
    @property(Label) labDay: Label = null!;
    @property(Label) labReward: Label = null!;

    @property(Node) dayContainer: Node = null!;
    @property(Prefab) dayItemPrefab: Prefab = null!;

    @property(Button) btnClaim: Button = null!;
    @property(Label) labClaimBtn: Label = null!;
    @property(Button) btnClose: Button = null!;

    private _isShow: boolean = false;
    private _callback: SignInUICallback | null = null;
    private _dayItems: Node[] = [];

    onLoad() {
        if (this.panel) {
            this.panel.active = false;
        }

        if (this.btnClose) {
            this.btnClose.node.on(Button.Event.CLICK, this.hide, this);
        }
        if (this.btnClaim) {
            this.btnClaim.node.on(Button.Event.CLICK, this.onClaimClick, this);
        }
    }

    onDestroy() {
        if (this.btnClose) {
            this.btnClose.node.off(Button.Event.CLICK, this.hide, this);
        }
        if (this.btnClaim) {
            this.btnClaim.node.off(Button.Event.CLICK, this.onClaimClick, this);
        }
    }

    init(callback: SignInUICallback) {
        this._callback = callback;
    }

    show() {
        if (this._isShow) return;
        this._isShow = true;
        SignInManager.Instance.load();
        this.refreshDays();
        this.refreshClaimButton();
        this.playShowAnimation();
    }

    hide() {
        if (!this._isShow) return;
        this._isShow = false;
        this.playHideAnimation();
    }

    private refreshDays() {
        if (!this.dayContainer || !this.dayItemPrefab) return;

        this.dayContainer.removeAllChildren();
        this._dayItems = [];

        const currentDay = SignInManager.Instance.getCurrentDay();
        const claimedDays = SignInManager.Instance.getClaimedDays();

        for (const dayData of SIGN_IN_WEEKLY) {
            const item = instantiate(this.dayItemPrefab);
            item.parent = this.dayContainer;
            this._dayItems.push(item);

            this.setupDayItem(item, dayData, currentDay, claimedDays);
        }
    }

    private setupDayItem(item: Node, dayData: SignInDayData, currentDay: number, claimedDays: number[]) {
        const dayLabel = item.getChildByName("Day")?.getComponent(Label);
        const rewardLabel = item.getChildByName("Reward")?.getComponent(Label);
        const checkMark = item.getChildByName("CheckMark");
        const bg = item.getComponent(Sprite);
        const highlight = item.getChildByName("Highlight");
        const bigReward = item.getChildByName("BigReward");

        if (dayLabel) {
            dayLabel.string = `第${dayData.day}天`;
        }

        if (rewardLabel) {
            rewardLabel.string = SignInManager.Instance.getRewardText(dayData.rewards);
        }

        if (checkMark) {
            checkMark.active = claimedDays.indexOf(dayData.day) !== -1;
        }

        if (highlight) {
            highlight.active = dayData.day === currentDay && claimedDays.indexOf(dayData.day) === -1;
        }

        if (bigReward) {
            bigReward.active = dayData.isBigReward;
        }

        if (bg) {
            if (claimedDays.indexOf(dayData.day) !== -1) {
                bg.color = new Color(100, 180, 100, 255);
            } else if (dayData.day === currentDay) {
                bg.color = new Color(255, 200, 60, 255);
            } else if (dayData.day < currentDay) {
                bg.color = new Color(150, 150, 150, 200);
            } else {
                bg.color = new Color(180, 180, 180, 255);
            }
        }
    }

    private refreshClaimButton() {
        if (!this.btnClaim) return;

        const canClaim = SignInManager.Instance.canClaim();
        this.btnClaim.interactable = canClaim;

        if (this.labClaimBtn) {
            if (canClaim) {
                const todayReward = SignInManager.Instance.getTodayReward();
                if (todayReward) {
                    this.labClaimBtn.string = `签到领 ${SignInManager.Instance.getRewardText(todayReward.rewards)}`;
                } else {
                    this.labClaimBtn.string = "签到";
                }
            } else {
                this.labClaimBtn.string = "已签到";
            }
        }

        if (this.labDay) {
            const currentDay = SignInManager.Instance.getCurrentDay();
            this.labDay.string = `第 ${currentDay} 天`;
        }
    }

    private onClaimClick() {
        if (!SignInManager.Instance.canClaim()) {
            const wx = (window as any).wx;
            if (wx) wx.showToast({ title: "今日已签到", icon: "none" });
            return;
        }

        const rewards = SignInManager.Instance.claim();
        if (!rewards) return;

        AudioManager.Instance.playSfx("audio/sfx/select");

        const rewardText = SignInManager.Instance.getRewardText(rewards);
        const wx = (window as any).wx;
        if (wx) {
            wx.showToast({ title: `签到成功！获得 ${rewardText}` });
        }

        this.refreshDays();
        this.refreshClaimButton();

        if (this._callback?.onGoldChanged) {
            const gold = StorageUtil.getNumber("sgzy_gold", 0);
            this._callback.onGoldChanged(gold);
        }

        this.scheduleOnce(() => {
            this.hide();
        }, 1.5);
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