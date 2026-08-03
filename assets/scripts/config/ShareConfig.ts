export enum ShareType {
    REVIVE = "revive",
    GOLD = "gold",
    GAME_RESULT = "game_result",
    DAILY = "daily",
    INVITE = "invite"
}

export interface ShareReward {
    type: "gold" | "revive" | "buff";
    amount: number;
}

export interface ShareConfigData {
    id: ShareType;
    title: string;
    imageUrl: string;
    query: string;
    desc: string;
    reward: ShareReward | null;
    dailyLimit: number;
    cooldown: number;
}

export const SHARE_CONFIG: Record<ShareType, ShareConfigData> = {
    [ShareType.REVIVE]: {
        id: ShareType.REVIVE,
        title: "三国割草：赵云传，爽快割草！",
        imageUrl: "",
        query: "from=share_revive",
        desc: "分享获得复活机会",
        reward: { type: "revive", amount: 1 },
        dailyLimit: 3,
        cooldown: 30
    },
    [ShareType.GOLD]: {
        id: ShareType.GOLD,
        title: "我在三国割草赚了好多金币，快来一起玩！",
        imageUrl: "",
        query: "from=share_gold",
        desc: "分享获得200金币",
        reward: { type: "gold", amount: 200 },
        dailyLimit: 5,
        cooldown: 30
    },
    [ShareType.GAME_RESULT]: {
        id: ShareType.GAME_RESULT,
        title: "",
        imageUrl: "",
        query: "from=share_result",
        desc: "分享战绩",
        reward: null,
        dailyLimit: 99,
        cooldown: 0
    },
    [ShareType.DAILY]: {
        id: ShareType.DAILY,
        title: "三国割草每日福利！和我一起割草吧！",
        imageUrl: "",
        query: "from=share_daily",
        desc: "每日分享奖励",
        reward: { type: "gold", amount: 300 },
        dailyLimit: 1,
        cooldown: 0
    },
    [ShareType.INVITE]: {
        id: ShareType.INVITE,
        title: "三国割草：赵云传，超爽割草体验！",
        imageUrl: "",
        query: "from=share_invite",
        desc: "邀请好友一起玩",
        reward: { type: "gold", amount: 500 },
        dailyLimit: 1,
        cooldown: 0
    }
};

export const SHARE_STORAGE_KEYS = {
    DAILY_DATE: "sgzy_share_daily_date",
    COUNT_PREFIX: "sgzy_share_count_",
    COOLDOWN_PREFIX: "sgzy_share_cooldown_"
};