export enum SignInRewardType {
    GOLD = "gold",
    REVIVE = "revive",
    BUFF = "buff"
}

export interface SignInReward {
    type: SignInRewardType;
    amount: number;
    icon: string;
}

export interface SignInDayData {
    day: number;
    rewards: SignInReward[];
    isBigReward: boolean;
}

export const SIGN_IN_WEEKLY: SignInDayData[] = [
    {
        day: 1,
        rewards: [{ type: SignInRewardType.GOLD, amount: 100, icon: "icon/gold" }],
        isBigReward: false
    },
    {
        day: 2,
        rewards: [{ type: SignInRewardType.GOLD, amount: 200, icon: "icon/gold" }],
        isBigReward: false
    },
    {
        day: 3,
        rewards: [{ type: SignInRewardType.GOLD, amount: 300, icon: "icon/gold" }],
        isBigReward: false
    },
    {
        day: 4,
        rewards: [{ type: SignInRewardType.REVIVE, amount: 1, icon: "icon/revive" }],
        isBigReward: false
    },
    {
        day: 5,
        rewards: [{ type: SignInRewardType.GOLD, amount: 500, icon: "icon/gold" }],
        isBigReward: false
    },
    {
        day: 6,
        rewards: [
            { type: SignInRewardType.GOLD, amount: 300, icon: "icon/gold" },
            { type: SignInRewardType.REVIVE, amount: 1, icon: "icon/revive" }
        ],
        isBigReward: false
    },
    {
        day: 7,
        rewards: [
            { type: SignInRewardType.GOLD, amount: 1000, icon: "icon/gold" },
            { type: SignInRewardType.REVIVE, amount: 2, icon: "icon/revive" }
        ],
        isBigReward: true
    }
];

export const SIGN_IN_STORAGE_KEYS = {
    LAST_DATE: "sgzy_signin_last_date",
    CURRENT_DAY: "sgzy_signin_current_day",
    CLAIMED_DAYS: "sgzy_signin_claimed_days"
};