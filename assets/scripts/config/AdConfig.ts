export const AD_CONFIG = {
    rewardVideo: {
        adUnitId: "替换你的激励广告ID",
        loadTimeout: 15000,
        retryDelay: 5000,
        maxRetryCount: 3,
        preloadOnInit: true,
    },
    interstitial: {
        adUnitId: "替换你的插屏广告ID",
        minInterval: 45,
    },
    banner: {
        adUnitId: "替换你的Banner广告ID",
        refreshInterval: 30,
        style: {
            left: 10,
            top: 10,
            width: 300,
        },
    },
    custom: {
        adUnitId: "替换你的原生模板广告ID",
        style: {
            left: 10,
            top: 10,
            width: 300,
        },
    },
    policy: {
        dailyRewardAdLimit: 20,
        rewardAdCooldown: 15,
        interstitialCooldown: 45,
        bannerRefreshInterval: 30,
    },
};

export enum AdRewardType {
    DOUBLE_BUFF = "double_buff",
    REVIVE = "revive",
    GOLD_BONUS = "gold_bonus",
    EXP_BONUS = "exp_bonus",
    HERO_ZHAO_YUN = "hero_zhao_yun",
    HERO_GUAN_YU = "hero_guan_yu",
    HERO_ZHANG_FEI = "hero_zhang_fei",
    HERO_ZHUGE_LIANG = "hero_zhu_ge_liang",
    HERO_LV_BU = "hero_lv_bu",
}

export enum AdErrorCode {
    NO_AD_FILL = 1004,
    AD_UNIT_CLOSED = 1005,
    AD_UNIT_ERROR = 1006,
    AD_FREQ_LIMIT = 1007,
    AD_EXPIRED = 1008,
    AD_NOT_READY = 1009,
    AD_LOADING = 1010,
}

export enum AdState {
    IDLE = "idle",
    LOADING = "loading",
    LOADED = "loaded",
    SHOWING = "showing",
    ERROR = "error",
}

export interface AdLoadResult {
    success: boolean;
    errorCode?: number;
    errorMsg?: string;
}

export interface AdShowResult {
    isEnded: boolean;
    rewardType?: AdRewardType;
}

export interface AdAnalyticsData {
    loadAttempts: number;
    loadSuccesses: number;
    loadFailures: number;
    showAttempts: number;
    showSuccesses: number;
    showFailures: number;
    completes: number;
    abandons: number;
    lastLoadTime: number;
    lastShowTime: number;
    totalRewardsGranted: number;
}