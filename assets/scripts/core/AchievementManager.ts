import { ACHIEVEMENT_LIST, ACHIEVEMENT_STORAGE_KEYS, AchievementData, AchievementType, AchievementRewardType } from '../config/AchievementConfig';
import { StorageUtil } from './StorageUtil';

export interface AchievementProgress {
    currentValue: number;
    isCompleted: boolean;
    isClaimed: boolean;
}

export class AchievementManager {
    private static instance: AchievementManager;

    static get Instance(): AchievementManager {
        if (!AchievementManager.instance) {
            AchievementManager.instance = new AchievementManager();
        }
        return AchievementManager.instance;
    }

    private _loaded: boolean = false;

    load() {
        if (this._loaded) return;
        this._loaded = true;
    }

    private ensureLoaded() {
        if (!this._loaded) this.load();
    }

    getCompletedIds(): string[] {
        this.ensureLoaded();
        return StorageUtil.getObject(ACHIEVEMENT_STORAGE_KEYS.COMPLETED, []);
    }

    getClaimedIds(): string[] {
        this.ensureLoaded();
        return StorageUtil.getObject(ACHIEVEMENT_STORAGE_KEYS.CLAIMED, []);
    }

    getProgress(achId: string): AchievementProgress {
        this.ensureLoaded();
        const ach = ACHIEVEMENT_LIST.find(a => a.id === achId);
        if (!ach) return { currentValue: 0, isCompleted: false, isClaimed: false };

        const completedIds = this.getCompletedIds();
        const claimedIds = this.getClaimedIds();
        const isCompleted = completedIds.indexOf(achId) !== -1;
        const isClaimed = claimedIds.indexOf(achId) !== -1;

        const statValue = this.getStatValue(ach.category);
        const currentValue = isCompleted ? ach.targetValue : Math.min(statValue, ach.targetValue);

        return { currentValue, isCompleted, isClaimed };
    }

    private getStatValue(category: AchievementType): number {
        switch (category) {
            case AchievementType.KILL:
                return Math.max(
                    StorageUtil.getNumber(ACHIEVEMENT_STORAGE_KEYS.TOTAL_KILL, 0),
                    StorageUtil.getNumber(ACHIEVEMENT_STORAGE_KEYS.MAX_SINGLE_KILL, 0)
                );
            case AchievementType.GOLD:
                return StorageUtil.getNumber(ACHIEVEMENT_STORAGE_KEYS.TOTAL_GOLD, 0);
            case AchievementType.BOSS:
                return StorageUtil.getNumber(ACHIEVEMENT_STORAGE_KEYS.TOTAL_BOSS, 0);
            case AchievementType.WEAPON:
                return StorageUtil.getNumber(ACHIEVEMENT_STORAGE_KEYS.TOTAL_WEAPON, 0);
            case AchievementType.TALENT:
                return StorageUtil.getNumber(ACHIEVEMENT_STORAGE_KEYS.TOTAL_TALENT, 0);
            case AchievementType.COMBO:
                return StorageUtil.getNumber(ACHIEVEMENT_STORAGE_KEYS.MAX_COMBO, 0);
            case AchievementType.LEVEL:
                return StorageUtil.getNumber(ACHIEVEMENT_STORAGE_KEYS.MAX_LEVEL, 0);
            case AchievementType.SURVIVE:
                return StorageUtil.getNumber(ACHIEVEMENT_STORAGE_KEYS.MAX_SURVIVE, 0);
            case AchievementType.HERO:
                return this.getHeroUnlockedCount();
            case AchievementType.SPECIAL:
                return 0;
            default:
                return 0;
        }
    }

    private getHeroUnlockedCount(): number {
        const heroData = StorageUtil.getObject("sgzy_hero_unlocked", []);
        return heroData.length || 0;
    }

    checkAndComplete(achId: string): boolean {
        this.ensureLoaded();
        const ach = ACHIEVEMENT_LIST.find(a => a.id === achId);
        if (!ach) return false;

        const completedIds = this.getCompletedIds();
        if (completedIds.indexOf(achId) !== -1) return true;

        const statValue = this.getStatValue(ach.category);
        if (statValue >= ach.targetValue) {
            completedIds.push(achId);
            StorageUtil.setObject(ACHIEVEMENT_STORAGE_KEYS.COMPLETED, completedIds);
            return true;
        }

        return false;
    }

    checkAllAchievements(): string[] {
        this.ensureLoaded();
        const newlyCompleted: string[] = [];

        for (const ach of ACHIEVEMENT_LIST) {
            const completedIds = this.getCompletedIds();
            if (completedIds.indexOf(ach.id) !== -1) continue;

            const statValue = this.getStatValue(ach.category);
            if (statValue >= ach.targetValue) {
                completedIds.push(ach.id);
                StorageUtil.setObject(ACHIEVEMENT_STORAGE_KEYS.COMPLETED, completedIds);
                newlyCompleted.push(ach.id);
            }
        }

        return newlyCompleted;
    }

    claimReward(achId: string): boolean {
        this.ensureLoaded();
        const ach = ACHIEVEMENT_LIST.find(a => a.id === achId);
        if (!ach) return false;

        const completedIds = this.getCompletedIds();
        if (completedIds.indexOf(achId) === -1) return false;

        const claimedIds = this.getClaimedIds();
        if (claimedIds.indexOf(achId) !== -1) return false;

        claimedIds.push(achId);
        StorageUtil.setObject(ACHIEVEMENT_STORAGE_KEYS.CLAIMED, claimedIds);

        this.grantReward(ach);
        return true;
    }

    private grantReward(ach: AchievementData) {
        switch (ach.reward.type) {
            case AchievementRewardType.GOLD:
                const currentGold = StorageUtil.getNumber("sgzy_gold", 0);
                StorageUtil.setNumber("sgzy_gold", currentGold + ach.reward.amount);
                break;
            case AchievementRewardType.REVIVE:
                const currentRevive = StorageUtil.getNumber("sgzy_revive", 0);
                StorageUtil.setNumber("sgzy_revive", currentRevive + ach.reward.amount);
                break;
            case AchievementRewardType.BUFF:
                StorageUtil.setBool("sgzy_battle_double_buff", true);
                break;
        }
    }

    updateStat(statKey: string, value: number) {
        this.ensureLoaded();
        const current = StorageUtil.getNumber(statKey, 0);
        if (value > current) {
            StorageUtil.setNumber(statKey, value);
        }
    }

    addStat(statKey: string, amount: number) {
        this.ensureLoaded();
        const current = StorageUtil.getNumber(statKey, 0);
        StorageUtil.setNumber(statKey, current + amount);
    }

    getAchievementData(achId: string): AchievementData | undefined {
        return ACHIEVEMENT_LIST.find(a => a.id === achId);
    }

    getAllAchievements(): AchievementData[] {
        return ACHIEVEMENT_LIST;
    }

    getCompletedCount(): number {
        return this.getCompletedIds().length;
    }

    getTotalCount(): number {
        return ACHIEVEMENT_LIST.length;
    }

    getClaimedCount(): number {
        return this.getClaimedIds().length;
    }

    getUnclaimedCount(): number {
        const completed = this.getCompletedIds();
        const claimed = this.getClaimedIds();
        return completed.filter(id => claimed.indexOf(id) === -1).length;
    }
}