import { _decorator, Component, Node, Label, Button, UIOpacity, tween, Prefab, instantiate, ProgressBar, ScrollView, Color, Sprite } from 'cc';
import { AchievementManager, AchievementProgress } from '../core/AchievementManager';
import { ACHIEVEMENT_LIST, AchievementData, AchievementRewardType } from '../config/AchievementConfig';
import { StorageUtil } from '../core/StorageUtil';
import { AudioManager } from '../core/AudioManager';
const { ccclass, property } = _decorator;

export interface AchievementUICallback {
    onGoldChanged?: (gold: number) => void;
}

@ccclass("AchievementUI")
export class AchievementUI extends Component {
    @property(Node) panel: Node = null!;
    @property(Label) labTitle: Label = null!;
    @property(Label) labProgress: Label = null!;
    @property(ProgressBar) totalProgressBar: ProgressBar = null!;

    @property(Node) contentContainer: Node = null!;
    @property(Prefab) itemPrefab: Prefab = null!;

    @property(Button) btnClose: Button = null!;
    @property(Button) btnClaimAll: Button = null!;

    private _isShow: boolean = false;
    private _callback: AchievementUICallback | null = null;
    private _items: Node[] = [];

    onLoad() {
        if (this.panel) {
            this.panel.active = false;
        }

        if (this.btnClose) {
            this.btnClose.node.on(Button.Event.CLICK, this.hide, this);
        }
        if (this.btnClaimAll) {
            this.btnClaimAll.node.on(Button.Event.CLICK, this.onClaimAll, this);
        }
    }

    init(callback: AchievementUICallback) {
        this._callback = callback;
    }

    show() {
        if (this._isShow) return;
        this._isShow = true;
        AchievementManager.Instance.load();
        this.refreshList();
        this.refreshSummary();
        this.playShowAnimation();
    }

    hide() {
        if (!this._isShow) return;
        this._isShow = false;
        this.playHideAnimation();
    }

    private refreshSummary() {
        const total = AchievementManager.Instance.getTotalCount();
        const completed = AchievementManager.Instance.getCompletedCount();
        const unclaimed = AchievementManager.Instance.getUnclaimedCount();

        if (this.labProgress) {
            this.labProgress.string = `${completed} / ${total}`;
        }
        if (this.totalProgressBar) {
            this.totalProgressBar.progress = completed / total;
        }

        if (this.btnClaimAll) {
            this.btnClaimAll.node.active = unclaimed > 0;
        }
    }

    private refreshList() {
        if (!this.contentContainer || !this.itemPrefab) return;

        this.contentContainer.removeAllChildren();
        this._items = [];

        for (const ach of ACHIEVEMENT_LIST) {
            const progress = AchievementManager.Instance.getProgress(ach.id);
            const item = instantiate(this.itemPrefab);
            item.parent = this.contentContainer;
            this._items.push(item);
            this.setupItem(item, ach, progress);
        }
    }

    private setupItem(item: Node, ach: AchievementData, progress: AchievementProgress) {
        const nameLabel = item.getChildByName("Name")?.getComponent(Label);
        const descLabel = item.getChildByName("Desc")?.getComponent(Label);
        const progressBar = item.getChildByName("ProgressBar")?.getComponent(ProgressBar);
        const progressLabel = item.getChildByName("ProgressLabel")?.getComponent(Label);
        const rewardLabel = item.getChildByName("Reward")?.getComponent(Label);
        const btnClaim = item.getChildByName("BtnClaim")?.getComponent(Button);
        const completedMark = item.getChildByName("CompletedMark");
        const claimedMark = item.getChildByName("ClaimedMark");
        const lockIcon = item.getChildByName("LockIcon");

        if (nameLabel) {
            nameLabel.string = ach.name;
        }
        if (descLabel) {
            descLabel.string = ach.desc;
        }

        if (progressBar) {
            progressBar.progress = progress.isCompleted ? 1 : progress.currentValue / ach.targetValue;
        }
        if (progressLabel) {
            progressLabel.string = `${Math.min(progress.currentValue, ach.targetValue)} / ${ach.targetValue}`;
        }

        if (rewardLabel) {
            rewardLabel.string = this.getRewardText(ach);
        }

        if (lockIcon) {
            lockIcon.active = ach.isHidden && !progress.isCompleted;
        }

        if (completedMark) {
            completedMark.active = progress.isCompleted && !progress.isClaimed;
        }
        if (claimedMark) {
            claimedMark.active = progress.isClaimed;
        }

        if (btnClaim) {
            btnClaim.node.active = progress.isCompleted && !progress.isClaimed;
            btnClaim.node.on(Button.Event.CLICK, () => {
                this.onClaimOne(ach.id);
            });
        }

        if (ach.isHidden && !progress.isCompleted) {
            if (nameLabel) nameLabel.string = "???";
            if (descLabel) descLabel.string = "达成条件后解锁";
            if (progressLabel) progressLabel.string = "? / ?";
            if (rewardLabel) rewardLabel.string = "???";
        }
    }

    private getRewardText(ach: AchievementData): string {
        switch (ach.reward.type) {
            case AchievementRewardType.GOLD: return `${ach.reward.amount}金币`;
            case AchievementRewardType.REVIVE: return `复活×${ach.reward.amount}`;
            case AchievementRewardType.BUFF: return `双倍Buff`;
            default: return "";
        }
    }

    private onClaimOne(achId: string) {
        const success = AchievementManager.Instance.claimReward(achId);
        if (!success) return;

        AudioManager.Instance.playSfx("audio/sfx/select");

        const ach = AchievementManager.Instance.getAchievementData(achId);
        if (ach) {
            const wx = (window as any).wx;
            if (wx) {
                const rewardText = this.getRewardText(ach);
                wx.showToast({ title: `达成成就：${ach.name}！获得 ${rewardText}` });
            }
        }

        this.refreshList();
        this.refreshSummary();

        if (this._callback?.onGoldChanged) {
            const gold = StorageUtil.getNumber("sgzy_gold", 0);
            this._callback.onGoldChanged(gold);
        }
    }

    private onClaimAll() {
        const completed = AchievementManager.Instance.getCompletedIds();
        const claimed = AchievementManager.Instance.getClaimedIds();
        const unclaimed = completed.filter(id => claimed.indexOf(id) === -1);

        if (unclaimed.length === 0) return;

        for (const id of unclaimed) {
            AchievementManager.Instance.claimReward(id);
        }

        AudioManager.Instance.playSfx("audio/sfx/select");

        const wx = (window as any).wx;
        if (wx) {
            wx.showToast({ title: `一键领取 ${unclaimed.length} 个成就奖励！` });
        }

        this.refreshList();
        this.refreshSummary();

        if (this._callback?.onGoldChanged) {
            const gold = StorageUtil.getNumber("sgzy_gold", 0);
            this._callback.onGoldChanged(gold);
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