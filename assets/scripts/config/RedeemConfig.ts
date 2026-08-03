export enum RedeemRewardType {
    GOLD = "gold",
    REVIVE = "revive",
    BUFF = "buff",
    WEAPON = "weapon",
    TALENT_POINT = "talent_point"
}

export interface RedeemReward {
    type: RedeemRewardType;
    amount: number;
    desc: string;
}

export interface RedeemCodeData {
    code: string;
    rewards: RedeemReward[];
    desc: string;
    expireTime: number;
    maxUseCount: number;
    isActive: boolean;
}

export const REDEEM_CODE_LIST: RedeemCodeData[] = [
    {
        code: "SANGGUO666",
        rewards: [
            { type: RedeemRewardType.GOLD, amount: 666, desc: "666金币" },
            { type: RedeemRewardType.REVIVE, amount: 1, desc: "复活×1" }
        ],
        desc: "新手福利兑换码",
        expireTime: 0,
        maxUseCount: 1,
        isActive: true
    },
    {
        code: "ZHAOYUN888",
        rewards: [
            { type: RedeemRewardType.GOLD, amount: 888, desc: "888金币" },
            { type: RedeemRewardType.REVIVE, amount: 2, desc: "复活×2" }
        ],
        desc: "赵云专属福利",
        expireTime: 0,
        maxUseCount: 1,
        isActive: true
    },
    {
        code: "WELCOME2024",
        rewards: [
            { type: RedeemRewardType.GOLD, amount: 500, desc: "500金币" }
        ],
        desc: "欢迎礼包",
        expireTime: 0,
        maxUseCount: 1,
        isActive: true
    },
    {
        code: "LUCKY777",
        rewards: [
            { type: RedeemRewardType.GOLD, amount: 777, desc: "777金币" },
            { type: RedeemRewardType.BUFF, amount: 1, desc: "双倍Buff×1" }
        ],
        desc: "幸运777",
        expireTime: 0,
        maxUseCount: 1,
        isActive: true
    },
    {
        code: "DALAO666",
        rewards: [
            { type: RedeemRewardType.GOLD, amount: 1000, desc: "1000金币" },
            { type: RedeemRewardType.REVIVE, amount: 3, desc: "复活×3" }
        ],
        desc: "大佬专属福利",
        expireTime: 0,
        maxUseCount: 1,
        isActive: true
    }
];

export const REDEEM_STORAGE_KEY = "sgzy_redeem_used";

export const REDEEM_CONFIG = {
    apiUrl: "",
    useLocalValidation: true,
    codeMaxLength: 20,
    codeMinLength: 3,
    inputPlaceholder: "请输入兑换码"
};