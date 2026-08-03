export enum TaskType {
    KILL_ENEMY = "kill_enemy",
    PLAY_GAME = "play_game",
    SURVIVE_TIME = "survive_time",
    COLLECT_GOLD = "collect_gold",
    LEVEL_UP = "level_up",
    KILL_BOSS = "kill_boss",
    COMBO = "combo",
    SHARE = "share",
    WATCH_AD = "watch_ad",
    SIGN_IN = "sign_in"
}

export enum TaskRewardType {
    GOLD = "gold",
    REVIVE = "revive",
    BUFF = "buff"
}

export interface TaskReward {
    type: TaskRewardType;
    amount: number;
    desc: string;
}

export interface DailyTaskData {
    id: string;
    type: TaskType;
    name: string;
    desc: string;
    targetValue: number;
    reward: TaskReward;
    sort: number;
}

export const DAILY_TASK_LIST: DailyTaskData[] = [
    {
        id: "daily_kill_30",
        type: TaskType.KILL_ENEMY,
        name: "小试牛刀",
        desc: "击败 30 个敌人",
        targetValue: 30,
        reward: { type: TaskRewardType.GOLD, amount: 100, desc: "100金币" },
        sort: 1
    },
    {
        id: "daily_kill_100",
        type: TaskType.KILL_ENEMY,
        name: "横扫千军",
        desc: "击败 100 个敌人",
        targetValue: 100,
        reward: { type: TaskRewardType.GOLD, amount: 300, desc: "300金币" },
        sort: 2
    },
    {
        id: "daily_survive_300",
        type: TaskType.SURVIVE_TIME,
        name: "初出茅庐",
        desc: "单局存活 5 分钟",
        targetValue: 300,
        reward: { type: TaskRewardType.GOLD, amount: 150, desc: "150金币" },
        sort: 3
    },
    {
        id: "daily_survive_600",
        type: TaskType.SURVIVE_TIME,
        name: "久经沙场",
        desc: "单局存活 10 分钟",
        targetValue: 600,
        reward: { type: TaskRewardType.GOLD, amount: 400, desc: "400金币" },
        sort: 4
    },
    {
        id: "daily_gold_200",
        type: TaskType.COLLECT_GOLD,
        name: "积少成多",
        desc: "收集 200 金币",
        targetValue: 200,
        reward: { type: TaskRewardType.GOLD, amount: 100, desc: "100金币" },
        sort: 5
    },
    {
        id: "daily_play_1",
        type: TaskType.PLAY_GAME,
        name: "每日出征",
        desc: "完成 1 场战斗",
        targetValue: 1,
        reward: { type: TaskRewardType.REVIVE, amount: 1, desc: "复活×1" },
        sort: 6
    },
    {
        id: "daily_kill_boss",
        type: TaskType.KILL_BOSS,
        name: "斩将夺旗",
        desc: "击败 1 个 Boss",
        targetValue: 1,
        reward: { type: TaskRewardType.GOLD, amount: 200, desc: "200金币" },
        sort: 7
    },
    {
        id: "daily_combo_30",
        type: TaskType.COMBO,
        name: "连战连捷",
        desc: "达成 30 连杀",
        targetValue: 30,
        reward: { type: TaskRewardType.GOLD, amount: 150, desc: "150金币" },
        sort: 8
    },
    {
        id: "daily_share_1",
        type: TaskType.SHARE,
        name: "分享战报",
        desc: "分享 1 次",
        targetValue: 1,
        reward: { type: TaskRewardType.GOLD, amount: 50, desc: "50金币" },
        sort: 9
    }
];

export const WEEKLY_TASK_LIST: DailyTaskData[] = [
    {
        id: "weekly_kill_500",
        type: TaskType.KILL_ENEMY,
        name: "万夫莫敌",
        desc: "累计击败 500 个敌人",
        targetValue: 500,
        reward: { type: TaskRewardType.GOLD, amount: 800, desc: "800金币" },
        sort: 1
    },
    {
        id: "weekly_survive_1800",
        type: TaskType.SURVIVE_TIME,
        name: "持久战将",
        desc: "累计存活 30 分钟",
        targetValue: 1800,
        reward: { type: TaskRewardType.GOLD, amount: 600, desc: "600金币" },
        sort: 2
    },
    {
        id: "weekly_play_5",
        type: TaskType.PLAY_GAME,
        name: "身经百战",
        desc: "完成 5 场战斗",
        targetValue: 5,
        reward: { type: TaskRewardType.REVIVE, amount: 3, desc: "复活×3" },
        sort: 3
    },
    {
        id: "weekly_kill_boss_3",
        type: TaskType.KILL_BOSS,
        name: "Boss 猎手",
        desc: "击败 3 个 Boss",
        targetValue: 3,
        reward: { type: TaskRewardType.GOLD, amount: 500, desc: "500金币" },
        sort: 4
    },
    {
        id: "weekly_gold_1000",
        type: TaskType.COLLECT_GOLD,
        name: "富甲一方",
        desc: "累计收集 1000 金币",
        targetValue: 1000,
        reward: { type: TaskRewardType.GOLD, amount: 400, desc: "400金币" },
        sort: 5
    },
    {
        id: "weekly_sign_in_3",
        type: TaskType.SIGN_IN,
        name: "勤勉不辍",
        desc: "本周签到 3 次",
        targetValue: 3,
        reward: { type: TaskRewardType.GOLD, amount: 300, desc: "300金币" },
        sort: 6
    }
];

export const DAILY_TASK_STORAGE_KEYS = {
    DAILY_DATE: "sgzy_daily_task_date",
    DAILY_PROGRESS: "sgzy_daily_task_progress",
    DAILY_CLAIMED: "sgzy_daily_task_claimed",
    WEEKLY_DATE: "sgzy_weekly_task_date",
    WEEKLY_PROGRESS: "sgzy_weekly_task_progress",
    WEEKLY_CLAIMED: "sgzy_weekly_task_claimed",
    TOTAL_DAILY_COMPLETED: "sgzy_daily_completed_count",
    TOTAL_WEEKLY_COMPLETED: "sgzy_weekly_completed_count"
};

export const DAILY_TASK_CONFIG = {
    dailyRefreshHour: 0,
    weeklyRefreshDay: 1,
    maxDailyTasks: 9,
    maxWeeklyTasks: 6
};