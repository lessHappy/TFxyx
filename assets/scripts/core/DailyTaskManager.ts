import { TaskType, TaskRewardType, TaskReward, DailyTaskData, DAILY_TASK_LIST, WEEKLY_TASK_LIST, DAILY_TASK_STORAGE_KEYS, DAILY_TASK_CONFIG } from '../config/DailyTaskConfig';
import { StorageUtil } from './StorageUtil';
import { EventManager } from './EventManager';

export interface TaskProgress {
    taskId: string;
    currentValue: number;
    targetValue: number;
    isCompleted: boolean;
    isClaimed: boolean;
}

export const DAILY_TASK_EVENT = "DAILY_TASK_UPDATED";

export class DailyTaskManager {
    private static instance: DailyTaskManager;
    private _loaded: boolean = false;

    static get Instance(): DailyTaskManager {
        if (!DailyTaskManager.instance) {
            DailyTaskManager.instance = new DailyTaskManager();
        }
        return DailyTaskManager.instance;
    }

    load() {
        if (this._loaded) return;
        this._loaded = true;
        this.checkDailyReset();
        this.checkWeeklyReset();
    }

    private ensureLoaded() {
        if (!this._loaded) this.load();
    }

    private getTodayStr(): string {
        return new Date().toDateString();
    }

    private getWeekStr(): string {
        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : DAILY_TASK_CONFIG.weeklyRefreshDay);
        const monday = new Date(now.setDate(diff));
        return monday.toDateString();
    }

    private checkDailyReset() {
        const today = this.getTodayStr();
        const lastDate = StorageUtil.getString(DAILY_TASK_STORAGE_KEYS.DAILY_DATE, "");
        if (lastDate !== today) {
            StorageUtil.setString(DAILY_TASK_STORAGE_KEYS.DAILY_DATE, today);
            StorageUtil.setObject(DAILY_TASK_STORAGE_KEYS.DAILY_PROGRESS, {});
            StorageUtil.setObject(DAILY_TASK_STORAGE_KEYS.DAILY_CLAIMED, []);
        }
    }

    private checkWeeklyReset() {
        const thisWeek = this.getWeekStr();
        const lastWeek = StorageUtil.getString(DAILY_TASK_STORAGE_KEYS.WEEKLY_DATE, "");
        if (lastWeek !== thisWeek) {
            StorageUtil.setString(DAILY_TASK_STORAGE_KEYS.WEEKLY_DATE, thisWeek);
            StorageUtil.setObject(DAILY_TASK_STORAGE_KEYS.WEEKLY_PROGRESS, {});
            StorageUtil.setObject(DAILY_TASK_STORAGE_KEYS.WEEKLY_CLAIMED, []);
        }
    }

    getDailyTasks(): DailyTaskData[] {
        return DAILY_TASK_LIST;
    }

    getWeeklyTasks(): DailyTaskData[] {
        return WEEKLY_TASK_LIST;
    }

    getDailyProgress(): Record<string, number> {
        this.ensureLoaded();
        return StorageUtil.getObject(DAILY_TASK_STORAGE_KEYS.DAILY_PROGRESS, {});
    }

    getWeeklyProgress(): Record<string, number> {
        this.ensureLoaded();
        return StorageUtil.getObject(DAILY_TASK_STORAGE_KEYS.WEEKLY_PROGRESS, {});
    }

    getDailyClaimed(): string[] {
        this.ensureLoaded();
        return StorageUtil.getObject(DAILY_TASK_STORAGE_KEYS.DAILY_CLAIMED, []);
    }

    getWeeklyClaimed(): string[] {
        this.ensureLoaded();
        return StorageUtil.getObject(DAILY_TASK_STORAGE_KEYS.WEEKLY_CLAIMED, []);
    }

    getDailyTaskProgressList(): TaskProgress[] {
        const progress = this.getDailyProgress();
        const claimed = this.getDailyClaimed();
        return DAILY_TASK_LIST.map(task => ({
            taskId: task.id,
            currentValue: progress[task.id] || 0,
            targetValue: task.targetValue,
            isCompleted: (progress[task.id] || 0) >= task.targetValue,
            isClaimed: claimed.indexOf(task.id) !== -1
        }));
    }

    getWeeklyTaskProgressList(): TaskProgress[] {
        const progress = this.getWeeklyProgress();
        const claimed = this.getWeeklyClaimed();
        return WEEKLY_TASK_LIST.map(task => ({
            taskId: task.id,
            currentValue: progress[task.id] || 0,
            targetValue: task.targetValue,
            isCompleted: (progress[task.id] || 0) >= task.targetValue,
            isClaimed: claimed.indexOf(task.id) !== -1
        }));
    }

    addProgress(type: TaskType, value: number) {
        this.ensureLoaded();
        this.addProgressToList(DAILY_TASK_LIST, DAILY_TASK_STORAGE_KEYS.DAILY_PROGRESS, type, value);
        this.addProgressToList(WEEKLY_TASK_LIST, DAILY_TASK_STORAGE_KEYS.WEEKLY_PROGRESS, type, value);
        EventManager.Instance.emit(DAILY_TASK_EVENT);
    }

    private addProgressToList(taskList: DailyTaskData[], storageKey: string, type: TaskType, value: number) {
        const progress = StorageUtil.getObject(storageKey, {});
        let changed = false;
        for (const task of taskList) {
            if (task.type !== type) continue;
            const prev = progress[task.id] || 0;
            if (prev >= task.targetValue) continue;
            progress[task.id] = Math.min(prev + value, task.targetValue);
            changed = true;
        }
        if (changed) {
            StorageUtil.setObject(storageKey, progress);
        }
    }

    canClaimDaily(taskId: string): boolean {
        const progress = this.getDailyProgress();
        const claimed = this.getDailyClaimed();
        const task = DAILY_TASK_LIST.find(t => t.id === taskId);
        if (!task) return false;
        return (progress[taskId] || 0) >= task.targetValue && claimed.indexOf(taskId) === -1;
    }

    canClaimWeekly(taskId: string): boolean {
        const progress = this.getWeeklyProgress();
        const claimed = this.getWeeklyClaimed();
        const task = WEEKLY_TASK_LIST.find(t => t.id === taskId);
        if (!task) return false;
        return (progress[taskId] || 0) >= task.targetValue && claimed.indexOf(taskId) === -1;
    }

    claimDaily(taskId: string): TaskReward | null {
        if (!this.canClaimDaily(taskId)) return null;
        const claimed = this.getDailyClaimed();
        claimed.push(taskId);
        StorageUtil.setObject(DAILY_TASK_STORAGE_KEYS.DAILY_CLAIMED, claimed);
        const task = DAILY_TASK_LIST.find(t => t.id === taskId)!;
        this.grantReward(task.reward);
        this.incrementCompletedCount(DAILY_TASK_STORAGE_KEYS.TOTAL_DAILY_COMPLETED);
        EventManager.Instance.emit(DAILY_TASK_EVENT);
        return task.reward;
    }

    claimWeekly(taskId: string): TaskReward | null {
        if (!this.canClaimWeekly(taskId)) return null;
        const claimed = this.getWeeklyClaimed();
        claimed.push(taskId);
        StorageUtil.setObject(DAILY_TASK_STORAGE_KEYS.WEEKLY_CLAIMED, claimed);
        const task = WEEKLY_TASK_LIST.find(t => t.id === taskId)!;
        this.grantReward(task.reward);
        this.incrementCompletedCount(DAILY_TASK_STORAGE_KEYS.TOTAL_WEEKLY_COMPLETED);
        EventManager.Instance.emit(DAILY_TASK_EVENT);
        return task.reward;
    }

    private grantReward(reward: TaskReward) {
        switch (reward.type) {
            case TaskRewardType.GOLD:
                const gold = StorageUtil.getNumber("sgzy_gold", 0);
                StorageUtil.setNumber("sgzy_gold", gold + reward.amount);
                break;
            case TaskRewardType.REVIVE:
                const revive = StorageUtil.getNumber("sgzy_revive", 0);
                StorageUtil.setNumber("sgzy_revive", revive + reward.amount);
                break;
            case TaskRewardType.BUFF:
                StorageUtil.setBool("sgzy_battle_double_buff", true);
                break;
        }
    }

    private incrementCompletedCount(key: string) {
        const count = StorageUtil.getNumber(key, 0);
        StorageUtil.setNumber(key, count + 1);
    }

    getDailyUnclaimedCount(): number {
        const list = this.getDailyTaskProgressList();
        return list.filter(t => t.isCompleted && !t.isClaimed).length;
    }

    getWeeklyUnclaimedCount(): number {
        const list = this.getWeeklyTaskProgressList();
        return list.filter(t => t.isCompleted && !t.isClaimed).length;
    }

    hasUnclaimedReward(): boolean {
        return this.getDailyUnclaimedCount() > 0 || this.getWeeklyUnclaimedCount() > 0;
    }
}