import { _decorator, Component, Node, Label, Button, Prefab, instantiate, ProgressBar } from 'cc';
import { DailyTaskManager, TaskProgress } from '../core/DailyTaskManager';
import { DailyTaskData, TaskRewardType } from '../config/DailyTaskConfig';
import { StorageUtil } from '../core/StorageUtil';
import { AudioManager } from '../core/AudioManager';
const { ccclass, property } = _decorator;

export interface DailyTaskUICallback {
    onGoldChanged?: (gold: number) => void;
}

@ccclass("DailyTaskUI")
export class DailyTaskUI extends Component {
    @property(Node) panel: Node = null!;
    @property(Label) labTitle: Label = null!;

    @property(Node) contentContainer: Node = null!;
    @property(Prefab) itemPrefab: Prefab = null!;

    @property(Button) btnClose: Button = null!;
    @property(Button) btnClaimAll: Button = null!;
    @property(Button) btnDailyTab: Button = null!;
    @property(Button) btnWeeklyTab: Button = null!;

    @property(Label) labDailyTab: Label = null!;
    @property(Label) labWeeklyTab: Label = null!;
    @property(Node) dailyTabIndicator: Node = null!;
    @property(Node) weeklyTabIndicator: Node = null!;

    private _isShow: boolean = false;
    private _callback: DailyTaskUICallback | null = null;
    private _items: Node[] = [];
    private _isDailyTab: boolean = true;

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
        if (this.btnDailyTab) {
            this.btnDailyTab.node.on(Button.Event.CLICK, () => this.switchTab(true), this);
        }
        if (this.btnWeeklyTab) {
            this.btnWeeklyTab.node.on(Button.Event.CLICK, () => this.switchTab(false), this);
        }
    }

    init(callback: DailyTaskUICallback) {
        this._callback = callback;
    }

    show() {
        if (this._isShow) return;
        this._isShow = true;
        DailyTaskManager.Instance.load();
        this.switchTab(true);
        this.playShowAnimation();
    }

    hide() {
        if (!this._isShow) return;
        this._isShow = false;
        this.playHideAnimation();
    }

    private switchTab(isDaily: boolean) {
        this._isDailyTab = isDaily;
        if (this.dailyTabIndicator) {
            this.dailyTabIndicator.active = isDaily;
        }
        if (this.weeklyTabIndicator) {
            this.weeklyTabIndicator.active = !isDaily;
        }
        this.refreshList();
        this.refreshButtonStates();
    }

    private refreshList() {
        if (!this.contentContainer || !this.itemPrefab) return;

        this.contentContainer.removeAllChildren();
        this._items = [];

        const taskList = this._isDailyTab
            ? DailyTaskManager.Instance.getDailyTasks()
            : DailyTaskManager.Instance.getWeeklyTasks();
        const progressList = this._isDailyTab
            ? DailyTaskManager.Instance.getDailyTaskProgressList()
            : DailyTaskManager.Instance.getWeeklyTaskProgressList();

        for (let i = 0; i < taskList.length; i++) {
            const task = taskList[i];
            const progress = progressList[i];
            const item = instantiate(this.itemPrefab);
            item.parent = this.contentContainer;
            this._items.push(item);
            this.setupItem(item, task, progress, i);
        }
    }

    private setupItem(item: Node, task: DailyTaskData, progress: TaskProgress, index: number) {
        const nameLabel = item.getChildByName("Name")?.getComponent(Label);
        const descLabel = item.getChildByName("Desc")?.getComponent(Label);
        const progressBar = item.getChildByName("ProgressBar")?.getComponent(ProgressBar);
        const progressLabel = item.getChildByName("ProgressLabel")?.getComponent(Label);
        const rewardLabel = item.getChildByName("Reward")?.getComponent(Label);
        const btnClaim = item.getChildByName("BtnClaim")?.getComponent(Button);
        const completedMark = item.getChildByName("CompletedMark");
        const claimedMark = item.getChildByName("ClaimedMark");

        if (nameLabel) {
            nameLabel.string = task.name;
        }
        if (descLabel) {
            descLabel.string = task.desc;
        }

        if (progressBar) {
            progressBar.progress = progress.isCompleted ? 1 : progress.currentValue / progress.targetValue;
        }
        if (progressLabel) {
            progressLabel.string = `${Math.min(progress.currentValue, progress.targetValue)} / ${progress.targetValue}`;
        }

        if (rewardLabel) {
            rewardLabel.string = this.getRewardText(task);
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
                this.onClaimOne(task.id);
            });
        }
    }

    private getRewardText(task: DailyTaskData): string {
        switch (task.reward.type) {
            case TaskRewardType.GOLD: return `${task.reward.amount}金币`;
            case TaskRewardType.REVIVE: return `复活×${task.reward.amount}`;
            case TaskRewardType.BUFF: return `双倍Buff`;
            default: return task.reward.desc;
        }
    }

    private onClaimOne(taskId: string) {
        const reward = this._isDailyTab
            ? DailyTaskManager.Instance.claimDaily(taskId)
            : DailyTaskManager.Instance.claimWeekly(taskId);
        if (!reward) return;

        AudioManager.Instance.playSfx("audio/sfx/select");

        const wx = (window as any).wx;
        if (wx) {
            const text = this._isDailyTab ? "每日任务" : "每周任务";
            wx.showToast({ title: `${text}奖励已领取！` });
        }

        this.refreshList();
        this.refreshButtonStates();

        if (this._callback?.onGoldChanged) {
            const gold = StorageUtil.getNumber("sgzy_gold", 0);
            this._callback.onGoldChanged(gold);
        }
    }

    private onClaimAll() {
        let count = 0;
        const taskList = this._isDailyTab
            ? DailyTaskManager.Instance.getDailyTasks()
            : DailyTaskManager.Instance.getWeeklyTasks();

        for (const task of taskList) {
            const canClaim = this._isDailyTab
                ? DailyTaskManager.Instance.canClaimDaily(task.id)
                : DailyTaskManager.Instance.canClaimWeekly(task.id);
            if (canClaim) {
                const reward = this._isDailyTab
                    ? DailyTaskManager.Instance.claimDaily(task.id)
                    : DailyTaskManager.Instance.claimWeekly(task.id);
                if (reward) count++;
            }
        }

        if (count === 0) return;

        AudioManager.Instance.playSfx("audio/sfx/select");

        const wx = (window as any).wx;
        if (wx) {
            const text = this._isDailyTab ? "每日" : "每周";
            wx.showToast({ title: `一键领取 ${count} 个${text}任务奖励！` });
        }

        this.refreshList();
        this.refreshButtonStates();

        if (this._callback?.onGoldChanged) {
            const gold = StorageUtil.getNumber("sgzy_gold", 0);
            this._callback.onGoldChanged(gold);
        }
    }

    private refreshButtonStates() {
        if (this.btnClaimAll) {
            const unclaimed = this._isDailyTab
                ? DailyTaskManager.Instance.getDailyUnclaimedCount()
                : DailyTaskManager.Instance.getWeeklyUnclaimedCount();
            this.btnClaimAll.node.active = unclaimed > 0;
        }
    }

    private playShowAnimation() {
        if (!this.panel) return;
        this.panel.active = true;
    }

    private playHideAnimation() {
        if (!this.panel) return;
        this.panel.active = false;
    }
}