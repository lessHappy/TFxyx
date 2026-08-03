import { AD_CONFIG, AdState, AdRewardType, AdErrorCode } from '../config/AdConfig';
import { StorageUtil } from './StorageUtil';
import { DailyTaskManager } from './DailyTaskManager';
import { TaskType } from '../config/DailyTaskConfig';

class AdFrequencyController {
    private static readonly KEY_PREFIX = "ad_freq_";

    static canShowRewardAd(): boolean {
        const today = new Date().toDateString();
        const lastKey = `${this.KEY_PREFIX}reward_last_date`;
        const countKey = `${this.KEY_PREFIX}reward_daily_count`;
        const cooldownKey = `${this.KEY_PREFIX}reward_last_ts`;

        const lastDate = StorageUtil.getString(lastKey, "");
        if (lastDate !== today) {
            StorageUtil.setString(lastKey, today);
            StorageUtil.setNumber(countKey, 0);
        }

        const dailyCount = StorageUtil.getNumber(countKey, 0);
        if (dailyCount >= AD_CONFIG.policy.dailyRewardAdLimit) {
            return false;
        }

        const lastTs = StorageUtil.getNumber(cooldownKey, 0);
        const now = Date.now();
        if (now - lastTs < AD_CONFIG.policy.rewardAdCooldown * 1000) {
            return false;
        }

        return true;
    }

    static recordRewardAdShow(): void {
        const countKey = `${this.KEY_PREFIX}reward_daily_count`;
        const cooldownKey = `${this.KEY_PREFIX}reward_last_ts`;
        const dailyCount = StorageUtil.getNumber(countKey, 0);
        StorageUtil.setNumber(countKey, dailyCount + 1);
        StorageUtil.setNumber(cooldownKey, Date.now());
    }

    static getRemainingDailyAds(): number {
        const dailyCount = StorageUtil.getNumber(`${this.KEY_PREFIX}reward_daily_count`, 0);
        return Math.max(0, AD_CONFIG.policy.dailyRewardAdLimit - dailyCount);
    }

    static getCooldownRemaining(): number {
        const lastTs = StorageUtil.getNumber(`${this.KEY_PREFIX}reward_last_ts`, 0);
        const elapsed = Date.now() - lastTs;
        const cooldown = AD_CONFIG.policy.rewardAdCooldown * 1000;
        return Math.max(0, Math.ceil((cooldown - elapsed) / 1000));
    }
}

export class WxAdHelper {
    private static rewardAd: any = null;
    private static bannerAd: any = null;
    private static customAd: any = null;

    private static state: AdState = AdState.IDLE;
    private static loadTimer: ReturnType<typeof setTimeout> | null = null;
    private static retryCount: number = 0;
    private static currentRewardType: AdRewardType | null = null;

    private static pendingSuccessCb: Function | null = null;
    private static pendingFailCb: Function | null = null;

    private static wxHideHandler: (() => void) | null = null;
    private static wxShowHandler: (() => void) | null = null;

    private static getWx(): any {
        return (typeof window !== 'undefined' ? (window as any).wx : undefined);
    }

    private static isWxEnv(): boolean {
        const wx = WxAdHelper.getWx();
        return !!(wx && wx.createRewardedVideoAd);
    }

    private static getNetworkType(): Promise<string> {
        return new Promise((resolve) => {
            const wx = WxAdHelper.getWx();
            if (!wx || !wx.getNetworkType) {
                resolve('unknown');
                return;
            }
            wx.getNetworkType({
                success: (res: any) => resolve(res.networkType || 'unknown'),
                fail: () => resolve('unknown'),
            });
        });
    }

    private static createAdInstance(): void {
        const wx = WxAdHelper.getWx();
        if (!wx || !wx.createRewardedVideoAd) return;

        try {
            WxAdHelper.rewardAd = wx.createRewardedVideoAd({
                adUnitId: AD_CONFIG.rewardVideo.adUnitId,
            });

            WxAdHelper.rewardAd.onError((err: any) => {
                const errCode = err?.errCode || 0;
                const errMsg = err?.errMsg || '未知错误';
                console.error(`[Ad][${errCode}] 激励视频错误:`, errMsg);

                WxAdHelper.state = AdState.ERROR;
                WxAdHelper.clearLoadTimer();

                if (errCode === AdErrorCode.NO_AD_FILL) {
                    console.log('[Ad] 无广告填充，稍后重试');
                }

                if (WxAdHelper.pendingFailCb) {
                    const cb = WxAdHelper.pendingFailCb;
                    WxAdHelper.clearPending();
                    cb();
                }
            });

            WxAdHelper.rewardAd.onLoad(() => {
                console.log('[Ad] 激励视频加载成功');
                WxAdHelper.state = AdState.LOADED;
                WxAdHelper.retryCount = 0;
                WxAdHelper.clearLoadTimer();
            });

            WxAdHelper.rewardAd.onClose((res: any) => {
                WxAdHelper.state = AdState.IDLE;
                const isEnded = !!(res && res.isEnded);

                console.log(`[Ad] 广告关闭, isEnded=${isEnded}, type=${WxAdHelper.currentRewardType}`);

                if (isEnded) {
                    AdFrequencyController.recordRewardAdShow();
                    DailyTaskManager.Instance.addProgress(TaskType.WATCH_AD, 1);
                    if (WxAdHelper.pendingSuccessCb) {
                        const cb = WxAdHelper.pendingSuccessCb;
                        WxAdHelper.clearPending();
                        cb();
                    }
                } else {
                    if (WxAdHelper.pendingFailCb) {
                        const cb = WxAdHelper.pendingFailCb;
                        WxAdHelper.clearPending();
                        cb();
                    }
                }

                WxAdHelper.currentRewardType = null;
                WxAdHelper.preloadAd();
            });
        } catch (e) {
            console.error('[Ad] 广告实例创建失败:', e);
            WxAdHelper.rewardAd = null;
            WxAdHelper.state = AdState.ERROR;
        }
    }

    private static clearPending(): void {
        WxAdHelper.pendingSuccessCb = null;
        WxAdHelper.pendingFailCb = null;
    }

    private static clearLoadTimer(): void {
        if (WxAdHelper.loadTimer) {
            clearTimeout(WxAdHelper.loadTimer);
            WxAdHelper.loadTimer = null;
        }
    }

    static init(): void {
        if (WxAdHelper.rewardAd) return;
        if (!WxAdHelper.isWxEnv()) return;

        WxAdHelper.createAdInstance();
        WxAdHelper.registerLifecycle();
        WxAdHelper.preloadAd();
    }

    static isAdReady(): boolean {
        return WxAdHelper.state === AdState.LOADED;
    }

    static getAdState(): AdState {
        return WxAdHelper.state;
    }

    static getRemainingDailyAds(): number {
        return AdFrequencyController.getRemainingDailyAds();
    }

    static preloadAd(): void {
        if (!WxAdHelper.isWxEnv()) return;
        if (!WxAdHelper.rewardAd) {
            WxAdHelper.createAdInstance();
            if (!WxAdHelper.rewardAd) return;
        }
        if (WxAdHelper.state === AdState.LOADED || WxAdHelper.state === AdState.LOADING || WxAdHelper.state === AdState.SHOWING) return;

        WxAdHelper.state = AdState.LOADING;
        WxAdHelper.rewardAd.load().catch((err: any) => {
            const errCode = err?.errCode || 0;
            console.error(`[Ad] 预加载失败 [${errCode}]:`, err?.errMsg);

            if (errCode === AdErrorCode.NO_AD_FILL) {
                WxAdHelper.state = AdState.IDLE;
                WxAdHelper.retryCount++;
                if (WxAdHelper.retryCount < AD_CONFIG.rewardVideo.maxRetryCount) {
                    const delay = AD_CONFIG.rewardVideo.retryDelay * WxAdHelper.retryCount;
                    WxAdHelper.loadTimer = setTimeout(() => {
                        WxAdHelper.loadTimer = null;
                        WxAdHelper.preloadAd();
                    }, delay);
                }
            } else {
                WxAdHelper.state = AdState.ERROR;
                WxAdHelper.retryCount++;
                if (WxAdHelper.retryCount < AD_CONFIG.rewardVideo.maxRetryCount) {
                    WxAdHelper.loadTimer = setTimeout(() => {
                        WxAdHelper.loadTimer = null;
                        WxAdHelper.preloadAd();
                    }, AD_CONFIG.rewardVideo.retryDelay);
                }
            }
        });
    }

    static showRewardAd(
        rewardType: AdRewardType,
        successCb: Function,
        failCb: Function
    ): void {
        const wx = WxAdHelper.getWx();

        if (!wx) {
            successCb();
            return;
        }

        if (!AdFrequencyController.canShowRewardAd()) {
            const remaining = AdFrequencyController.getCooldownRemaining();
            if (remaining > 0) {
                wx.showToast({ title: `请${remaining}秒后再试` });
            } else {
                wx.showToast({ title: "今日广告次数已用完" });
            }
            failCb();
            return;
        }

        if (!WxAdHelper.rewardAd) {
            WxAdHelper.createAdInstance();
            if (!WxAdHelper.rewardAd) {
                wx.showToast({ title: "广告组件初始化失败" });
                failCb();
                return;
            }
        }

        if (WxAdHelper.state === AdState.SHOWING) {
            wx.showToast({ title: "广告正在播放中" });
            failCb();
            return;
        }

        if (WxAdHelper.pendingSuccessCb || WxAdHelper.pendingFailCb) {
            wx.showToast({ title: "广告加载中，请稍等" });
            failCb();
            return;
        }

        WxAdHelper.currentRewardType = rewardType;
        WxAdHelper.pendingSuccessCb = successCb;
        WxAdHelper.pendingFailCb = failCb;

        const doShow = () => {
            WxAdHelper.state = AdState.SHOWING;
            WxAdHelper.rewardAd.show().catch((err: any) => {
                console.error('[Ad] 展示失败:', err?.errMsg);
                wx.showToast({ title: "广告播放失败，请稍后再试" });
                WxAdHelper.state = AdState.IDLE;
                WxAdHelper.clearPending();
                WxAdHelper.preloadAd();
            });
        };

        if (WxAdHelper.state === AdState.LOADED) {
            doShow();
        } else {
            wx.showToast({ title: "广告加载中，请稍等..." });
            WxAdHelper.state = AdState.LOADING;
            WxAdHelper.rewardAd.load().then(() => {
                doShow();
            }).catch((err: any) => {
                console.error('[Ad] 加载失败:', err?.errMsg);
                wx.showToast({ title: "广告加载失败，请稍后再试" });
                WxAdHelper.state = AdState.IDLE;
                const cb = WxAdHelper.pendingFailCb;
                WxAdHelper.clearPending();
                if (cb) cb();
                WxAdHelper.preloadAd();
            });
        }
    }

    static showBannerAd(adUnitId?: string): void {
        const wx = WxAdHelper.getWx();
        if (!wx || !wx.createBannerAd) return;

        if (WxAdHelper.bannerAd) {
            WxAdHelper.bannerAd.show().catch(() => {});
            return;
        }

        try {
            const id = adUnitId || AD_CONFIG.banner.adUnitId;
            const style = AD_CONFIG.banner.style;
            WxAdHelper.bannerAd = wx.createBannerAd({ adUnitId: id, style });
            WxAdHelper.bannerAd.onError((err: any) => {
                console.error('[Ad] Banner错误:', err);
            });
            WxAdHelper.bannerAd.onResize((res: any) => {
                WxAdHelper.bannerAd.style.top = wx.getSystemInfoSync().screenHeight - res.height;
            });
            WxAdHelper.bannerAd.show().catch(() => {});
        } catch (e) {
            console.error('[Ad] Banner创建失败:', e);
        }
    }

    static hideBannerAd(): void {
        if (WxAdHelper.bannerAd) {
            WxAdHelper.bannerAd.hide().catch(() => {});
        }
    }

    static destroyBannerAd(): void {
        if (WxAdHelper.bannerAd) {
            try {
                WxAdHelper.bannerAd.offError();
                WxAdHelper.bannerAd.offResize();
                WxAdHelper.bannerAd.destroy();
            } catch (e) {
                console.warn('[Ad] Banner销毁异常:', e);
            }
            WxAdHelper.bannerAd = null;
        }
    }

    static showCustomAd(adUnitId?: string): void {
        const wx = WxAdHelper.getWx();
        if (!wx || !wx.createCustomAd) return;

        if (WxAdHelper.customAd) {
            WxAdHelper.customAd.show().catch(() => {});
            return;
        }

        try {
            const id = adUnitId || AD_CONFIG.custom.adUnitId;
            const style = AD_CONFIG.custom.style;
            WxAdHelper.customAd = wx.createCustomAd({ adUnitId: id, style });
            WxAdHelper.customAd.onError((err: any) => {
                console.error('[Ad] 原生模板错误:', err);
            });
            WxAdHelper.customAd.show().catch(() => {});
        } catch (e) {
            console.error('[Ad] 原生模板创建失败:', e);
        }
    }

    static hideCustomAd(): void {
        if (WxAdHelper.customAd) {
            WxAdHelper.customAd.hide().catch(() => {});
        }
    }

    static destroyCustomAd(): void {
        if (WxAdHelper.customAd) {
            try {
                WxAdHelper.customAd.offError();
                WxAdHelper.customAd.destroy();
            } catch (e) {
                console.warn('[Ad] 原生模板销毁异常:', e);
            }
            WxAdHelper.customAd = null;
        }
    }

    static showInterstitialAd(adUnitId?: string): Promise<void> {
        return new Promise((resolve) => {
            const wx = WxAdHelper.getWx();
            if (!wx || !wx.createInterstitialAd) {
                resolve();
                return;
            }

            try {
                const id = adUnitId || AD_CONFIG.interstitial.adUnitId;
                const interstitialAd = wx.createInterstitialAd({ adUnitId: id });
                let resolved = false;
                const done = () => {
                    if (resolved) return;
                    resolved = true;
                    try {
                        interstitialAd.offError();
                        interstitialAd.offClose();
                        interstitialAd.destroy();
                    } catch (_) {}
                    resolve();
                };
                interstitialAd.onError((err: any) => {
                    console.error('[Ad] 插屏错误:', err);
                    done();
                });
                interstitialAd.onClose(() => {
                    done();
                });
                interstitialAd.show().catch(() => {
                    done();
                });
            } catch (e) {
                console.error('[Ad] 插屏创建失败:', e);
                resolve();
            }
        });
    }

    private static registerLifecycle(): void {
        const wx = WxAdHelper.getWx();
        if (!wx) return;

        WxAdHelper.wxHideHandler = () => {
            WxAdHelper.hideBannerAd();
            WxAdHelper.hideCustomAd();
        };

        WxAdHelper.wxShowHandler = () => {
            if (WxAdHelper.state === AdState.IDLE || WxAdHelper.state === AdState.ERROR) {
                WxAdHelper.retryCount = 0;
                WxAdHelper.preloadAd();
            }
            WxAdHelper.showBannerAd();
            WxAdHelper.showCustomAd();
        };

        try {
            if (wx.onHide) wx.onHide(WxAdHelper.wxHideHandler);
            if (wx.onShow) wx.onShow(WxAdHelper.wxShowHandler);
        } catch (_) {}
    }

    private static unregisterLifecycle(): void {
        const wx = WxAdHelper.getWx();
        if (!wx) return;

        try {
            if (wx.offHide && WxAdHelper.wxHideHandler) {
                wx.offHide(WxAdHelper.wxHideHandler);
            }
            if (wx.offShow && WxAdHelper.wxShowHandler) {
                wx.offShow(WxAdHelper.wxShowHandler);
            }
        } catch (_) {}

        WxAdHelper.wxHideHandler = null;
        WxAdHelper.wxShowHandler = null;
    }

    static destroy(): void {
        WxAdHelper.unregisterLifecycle();
        WxAdHelper.clearLoadTimer();
        WxAdHelper.clearPending();

        if (WxAdHelper.rewardAd) {
            try {
                WxAdHelper.rewardAd.offError();
                WxAdHelper.rewardAd.offLoad();
                WxAdHelper.rewardAd.offClose();
                WxAdHelper.rewardAd.destroy();
            } catch (e) {
                console.warn('[Ad] 激励视频销毁异常:', e);
            }
            WxAdHelper.rewardAd = null;
        }

        WxAdHelper.destroyBannerAd();
        WxAdHelper.destroyCustomAd();

        WxAdHelper.state = AdState.IDLE;
        WxAdHelper.retryCount = 0;
        WxAdHelper.currentRewardType = null;
    }
}