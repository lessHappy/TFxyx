import { SIGN_IN_WEEKLY, SIGN_IN_STORAGE_KEYS, SignInDayData, SignInReward, SignInRewardType } from '../config/SignInConfig';
import { StorageUtil } from './StorageUtil';

export class SignInManager {
    private static instance: SignInManager;

    static get Instance(): SignInManager {
        if (!SignInManager.instance) {
            SignInManager.instance = new SignInManager();
        }
        return SignInManager.instance;
    }

    private _loaded: boolean = false;

    load() {
        if (this._loaded) return;
        this._loaded = true;
        this.checkDayReset();
    }

    private ensureLoaded() {
        if (!this._loaded) this.load();
    }

    private checkDayReset() {
        const today = new Date().toDateString();
        const lastDate = StorageUtil.getString(SIGN_IN_STORAGE_KEYS.LAST_DATE, "");

        if (lastDate !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toDateString();

            if (lastDate === yesterdayStr) {
                const currentDay = StorageUtil.getNumber(SIGN_IN_STORAGE_KEYS.CURRENT_DAY, 1);
                const nextDay = currentDay < 7 ? currentDay + 1 : 1;
                StorageUtil.setNumber(SIGN_IN_STORAGE_KEYS.CURRENT_DAY, nextDay);
            } else {
                StorageUtil.setNumber(SIGN_IN_STORAGE_KEYS.CURRENT_DAY, 1);
                StorageUtil.setObject(SIGN_IN_STORAGE_KEYS.CLAIMED_DAYS, []);
            }

            StorageUtil.setString(SIGN_IN_STORAGE_KEYS.LAST_DATE, today);
        }
    }

    getCurrentDay(): number {
        this.ensureLoaded();
        return StorageUtil.getNumber(SIGN_IN_STORAGE_KEYS.CURRENT_DAY, 1);
    }

    getClaimedDays(): number[] {
        this.ensureLoaded();
        return StorageUtil.getObject(SIGN_IN_STORAGE_KEYS.CLAIMED_DAYS, []);
    }

    isClaimedToday(): boolean {
        const currentDay = this.getCurrentDay();
        const claimed = this.getClaimedDays();
        return claimed.indexOf(currentDay) !== -1;
    }

    canClaim(): boolean {
        return !this.isClaimedToday();
    }

    getTodayReward(): SignInDayData | null {
        const currentDay = this.getCurrentDay();
        return SIGN_IN_WEEKLY.find(d => d.day === currentDay) || null;
    }

    getAllDays(): SignInDayData[] {
        return SIGN_IN_WEEKLY;
    }

    claim(): SignInReward[] | null {
        if (!this.canClaim()) return null;

        const todayReward = this.getTodayReward();
        if (!todayReward) return null;

        const claimed = this.getClaimedDays();
        claimed.push(todayReward.day);
        StorageUtil.setObject(SIGN_IN_STORAGE_KEYS.CLAIMED_DAYS, claimed);

        for (const reward of todayReward.rewards) {
            this.grantReward(reward);
        }

        return todayReward.rewards;
    }

    private grantReward(reward: SignInReward) {
        switch (reward.type) {
            case SignInRewardType.GOLD:
                const currentGold = StorageUtil.getNumber("sgzy_gold", 0);
                StorageUtil.setNumber("sgzy_gold", currentGold + reward.amount);
                break;
            case SignInRewardType.REVIVE:
                const currentRevive = StorageUtil.getNumber("sgzy_revive", 0);
                StorageUtil.setNumber("sgzy_revive", currentRevive + reward.amount);
                break;
            case SignInRewardType.BUFF:
                StorageUtil.setBool("sgzy_battle_double_buff", true);
                break;
        }
    }

    getRewardText(rewards: SignInReward[]): string {
        return rewards.map(r => {
            switch (r.type) {
                case SignInRewardType.GOLD: return `${r.amount}金币`;
                case SignInRewardType.REVIVE: return `复活×${r.amount}`;
                case SignInRewardType.BUFF: return `双倍Buff`;
                default: return "";
            }
        }).join(" + ");
    }
}