import { ShareType, SHARE_CONFIG, SHARE_STORAGE_KEYS, ShareConfigData, ShareReward } from '../config/ShareConfig';
import { StorageUtil } from './StorageUtil';

export class ShareManager {
    private static instance: ShareManager;

    static get Instance(): ShareManager {
        if (!ShareManager.instance) {
            ShareManager.instance = new ShareManager();
        }
        return ShareManager.instance;
    }

    private _loaded: boolean = false;

    load() {
        if (this._loaded) return;
        this._loaded = true;
    }

    private ensureLoaded() {
        if (!this._loaded) this.load();
    }

    private resetDailyIfNeeded() {
        const today = new Date().toDateString();
        const lastDate = StorageUtil.getString(SHARE_STORAGE_KEYS.DAILY_DATE, "");
        if (lastDate !== today) {
            StorageUtil.setString(SHARE_STORAGE_KEYS.DAILY_DATE, today);
            for (const type of Object.values(ShareType)) {
                StorageUtil.setNumber(SHARE_STORAGE_KEYS.COUNT_PREFIX + type, 0);
            }
        }
    }

    getDailyCount(type: ShareType): number {
        this.ensureLoaded();
        this.resetDailyIfNeeded();
        return StorageUtil.getNumber(SHARE_STORAGE_KEYS.COUNT_PREFIX + type, 0);
    }

    getRemainingCount(type: ShareType): number {
        const cfg = SHARE_CONFIG[type];
        const used = this.getDailyCount(type);
        return Math.max(0, cfg.dailyLimit - used);
    }

    getCooldownRemaining(type: ShareType): number {
        const cfg = SHARE_CONFIG[type];
        if (cfg.cooldown <= 0) return 0;
        const lastTs = StorageUtil.getNumber(SHARE_STORAGE_KEYS.COOLDOWN_PREFIX + type, 0);
        const elapsed = (Date.now() - lastTs) / 1000;
        return Math.max(0, Math.ceil(cfg.cooldown - elapsed));
    }

    canShare(type: ShareType): boolean {
        const remaining = this.getRemainingCount(type);
        if (remaining <= 0) return false;
        const cooldown = this.getCooldownRemaining(type);
        if (cooldown > 0) return false;
        return true;
    }

    share(type: ShareType, customTitle?: string, customQuery?: string): boolean {
        if (!this.canShare(type)) return false;

        const cfg = SHARE_CONFIG[type];
        const wx = (window as any).wx;
        if (!wx || !wx.shareAppMessage) return false;

        const title = customTitle || cfg.title;
        const query = customQuery || cfg.query;

        wx.shareAppMessage({
            title: title,
            query: query,
            imageUrl: cfg.imageUrl || undefined
        });

        this.recordShare(type);
        this.grantReward(type, cfg);
        return true;
    }

    shareWithCallback(type: ShareType, onSuccess?: () => void, onFail?: () => void): boolean {
        if (!this.canShare(type)) {
            if (onFail) onFail();
            return false;
        }

        const cfg = SHARE_CONFIG[type];
        const wx = (window as any).wx;
        if (!wx) {
            if (onFail) onFail();
            return false;
        }

        if (wx.shareAppMessage) {
            wx.shareAppMessage({
                title: cfg.title,
                query: cfg.query,
                imageUrl: cfg.imageUrl || undefined,
                success: () => {
                    this.recordShare(type);
                    this.grantReward(type, cfg);
                    if (onSuccess) onSuccess();
                },
                fail: () => {
                    if (onFail) onFail();
                }
            });
        }

        return true;
    }

    private recordShare(type: ShareType) {
        const count = this.getDailyCount(type);
        StorageUtil.setNumber(SHARE_STORAGE_KEYS.COUNT_PREFIX + type, count + 1);
        if (SHARE_CONFIG[type].cooldown > 0) {
            StorageUtil.setNumber(SHARE_STORAGE_KEYS.COOLDOWN_PREFIX + type, Date.now());
        }
    }

    private grantReward(type: ShareType, cfg: ShareConfigData) {
        if (!cfg.reward) return;

        switch (cfg.reward.type) {
            case "gold":
                const currentGold = StorageUtil.getNumber("sgzy_gold", 0);
                StorageUtil.setNumber("sgzy_gold", currentGold + cfg.reward.amount);
                break;
            case "revive":
                const currentRevive = StorageUtil.getNumber("sgzy_revive", 0);
                StorageUtil.setNumber("sgzy_revive", currentRevive + cfg.reward.amount);
                break;
            case "buff":
                StorageUtil.setBool("sgzy_battle_double_buff", true);
                break;
        }
    }

    getShareReward(type: ShareType): ShareReward | null {
        return SHARE_CONFIG[type].reward;
    }

    getShareConfig(type: ShareType): ShareConfigData {
        return SHARE_CONFIG[type];
    }

    generateResultShareText(kill: number, time: number, gold: number): string {
        const min = Math.floor(time / 60);
        const sec = Math.floor(time % 60);
        return `我在三国割草中击杀 ${kill} 个敌人，获得 ${gold} 金币，生存了 ${min}分${sec}秒！快来挑战我吧！`;
    }
}