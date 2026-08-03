import { REDEEM_CODE_LIST, REDEEM_STORAGE_KEY, REDEEM_CONFIG, RedeemCodeData, RedeemReward, RedeemRewardType } from '../config/RedeemConfig';
import { StorageUtil } from './StorageUtil';

export interface RedeemResult {
    success: boolean;
    message: string;
    rewards?: RedeemReward[];
}

export class RedeemManager {
    private static instance: RedeemManager;

    static get Instance(): RedeemManager {
        if (!RedeemManager.instance) {
            RedeemManager.instance = new RedeemManager();
        }
        return RedeemManager.instance;
    }

    private _usedCodes: string[] = [];

    init() {
        this._usedCodes = StorageUtil.getObject(REDEEM_STORAGE_KEY, []);
    }

    getUsedCodes(): string[] {
        return this._usedCodes;
    }

    isCodeUsed(code: string): boolean {
        const upperCode = code.toUpperCase();
        return this._usedCodes.indexOf(upperCode) !== -1;
    }

    redeem(code: string): RedeemResult {
        const upperCode = code.trim().toUpperCase();

        if (!upperCode || upperCode.length < REDEEM_CONFIG.codeMinLength) {
            return { success: false, message: "请输入有效的兑换码" };
        }

        if (upperCode.length > REDEEM_CONFIG.codeMaxLength) {
            return { success: false, message: "兑换码长度超出限制" };
        }

        if (this.isCodeUsed(upperCode)) {
            return { success: false, message: "该兑换码已使用过" };
        }

        if (REDEEM_CONFIG.useLocalValidation) {
            return this.localValidate(upperCode);
        }

        return { success: false, message: "兑换服务暂不可用" };
    }

    private localValidate(code: string): RedeemResult {
        const found = REDEEM_CODE_LIST.find(c => c.code.toUpperCase() === code);

        if (!found) {
            return { success: false, message: "无效的兑换码" };
        }

        if (!found.isActive) {
            return { success: false, message: "该兑换码已失效" };
        }

        if (found.expireTime > 0 && Date.now() > found.expireTime) {
            return { success: false, message: "该兑换码已过期" };
        }

        this.markUsed(code);

        for (const reward of found.rewards) {
            this.grantReward(reward);
        }

        const rewardText = this.formatRewards(found.rewards);
        return {
            success: true,
            message: `兑换成功！获得 ${rewardText}`,
            rewards: found.rewards
        };
    }

    private markUsed(code: string) {
        this._usedCodes.push(code);
        StorageUtil.setObject(REDEEM_STORAGE_KEY, this._usedCodes);
    }

    private grantReward(reward: RedeemReward) {
        switch (reward.type) {
            case RedeemRewardType.GOLD:
                const currentGold = StorageUtil.getNumber("sgzy_gold", 0);
                StorageUtil.setNumber("sgzy_gold", currentGold + reward.amount);
                break;
            case RedeemRewardType.REVIVE:
                const currentRevive = StorageUtil.getNumber("sgzy_revive", 0);
                StorageUtil.setNumber("sgzy_revive", currentRevive + reward.amount);
                break;
            case RedeemRewardType.BUFF:
                StorageUtil.setBool("sgzy_battle_double_buff", true);
                break;
            case RedeemRewardType.WEAPON:
                break;
            case RedeemRewardType.TALENT_POINT:
                break;
        }
    }

    formatRewards(rewards: RedeemReward[]): string {
        return rewards.map(r => r.desc).join(" + ");
    }

    getAvailableCodes(): RedeemCodeData[] {
        return REDEEM_CODE_LIST.filter(c => c.isActive);
    }
}