export enum AchievementType {
    KILL = "kill",
    SURVIVE = "survive",
    GOLD = "gold",
    WEAPON = "weapon",
    HERO = "hero",
    TALENT = "talent",
    BOSS = "boss",
    COMBO = "combo",
    LEVEL = "level",
    SPECIAL = "special"
}

export enum AchievementRewardType {
    GOLD = "gold",
    REVIVE = "revive",
    BUFF = "buff"
}

export interface AchievementReward {
    type: AchievementRewardType;
    amount: number;
}

export interface AchievementData {
    id: string;
    name: string;
    desc: string;
    icon: string;
    category: AchievementType;
    targetValue: number;
    reward: AchievementReward;
    isHidden: boolean;
    sort: number;
}

export const ACHIEVEMENT_LIST: AchievementData[] = [
    {
        id: "kill_100",
        name: "初出茅庐",
        desc: "累计击杀 100 个敌人",
        icon: "icon/ach_kill_01",
        category: AchievementType.KILL,
        targetValue: 100,
        reward: { type: AchievementRewardType.GOLD, amount: 200 },
        isHidden: false,
        sort: 1
    },
    {
        id: "kill_500",
        name: "小试牛刀",
        desc: "累计击杀 500 个敌人",
        icon: "icon/ach_kill_02",
        category: AchievementType.KILL,
        targetValue: 500,
        reward: { type: AchievementRewardType.GOLD, amount: 500 },
        isHidden: false,
        sort: 2
    },
    {
        id: "kill_1000",
        name: "百战精兵",
        desc: "累计击杀 1000 个敌人",
        icon: "icon/ach_kill_03",
        category: AchievementType.KILL,
        targetValue: 1000,
        reward: { type: AchievementRewardType.GOLD, amount: 800 },
        isHidden: false,
        sort: 3
    },
    {
        id: "kill_5000",
        name: "万人敌",
        desc: "累计击杀 5000 个敌人",
        icon: "icon/ach_kill_04",
        category: AchievementType.KILL,
        targetValue: 5000,
        reward: { type: AchievementRewardType.GOLD, amount: 1500 },
        isHidden: false,
        sort: 4
    },
    {
        id: "kill_10000",
        name: "割草无双",
        desc: "累计击杀 10000 个敌人",
        icon: "icon/ach_kill_05",
        category: AchievementType.KILL,
        targetValue: 10000,
        reward: { type: AchievementRewardType.GOLD, amount: 3000 },
        isHidden: false,
        sort: 5
    },
    {
        id: "survive_5min",
        name: "初涉战场",
        desc: "单局存活 5 分钟",
        icon: "icon/ach_time_01",
        category: AchievementType.SURVIVE,
        targetValue: 300,
        reward: { type: AchievementRewardType.GOLD, amount: 300 },
        isHidden: false,
        sort: 6
    },
    {
        id: "survive_10min",
        name: "久经沙场",
        desc: "单局存活 10 分钟",
        icon: "icon/ach_time_02",
        category: AchievementType.SURVIVE,
        targetValue: 600,
        reward: { type: AchievementRewardType.GOLD, amount: 500 },
        isHidden: false,
        sort: 7
    },
    {
        id: "survive_20min",
        name: "不死战神",
        desc: "单局存活 20 分钟",
        icon: "icon/ach_time_03",
        category: AchievementType.SURVIVE,
        targetValue: 1200,
        reward: { type: AchievementRewardType.GOLD, amount: 1000 },
        isHidden: false,
        sort: 8
    },
    {
        id: "gold_1000",
        name: "腰缠万贯",
        desc: "累计获得 1000 金币",
        icon: "icon/ach_gold_01",
        category: AchievementType.GOLD,
        targetValue: 1000,
        reward: { type: AchievementRewardType.GOLD, amount: 200 },
        isHidden: false,
        sort: 9
    },
    {
        id: "gold_5000",
        name: "富甲一方",
        desc: "累计获得 5000 金币",
        icon: "icon/ach_gold_02",
        category: AchievementType.GOLD,
        targetValue: 5000,
        reward: { type: AchievementRewardType.GOLD, amount: 500 },
        isHidden: false,
        sort: 10
    },
    {
        id: "gold_10000",
        name: "富可敌国",
        desc: "累计获得 10000 金币",
        icon: "icon/ach_gold_03",
        category: AchievementType.GOLD,
        targetValue: 10000,
        reward: { type: AchievementRewardType.GOLD, amount: 1000 },
        isHidden: false,
        sort: 11
    },
    {
        id: "weapon_3",
        name: "武器收藏家",
        desc: "解锁 3 种武器",
        icon: "icon/ach_weapon_01",
        category: AchievementType.WEAPON,
        targetValue: 3,
        reward: { type: AchievementRewardType.GOLD, amount: 300 },
        isHidden: false,
        sort: 12
    },
    {
        id: "weapon_6",
        name: "武器大师",
        desc: "解锁 6 种武器",
        icon: "icon/ach_weapon_02",
        category: AchievementType.WEAPON,
        targetValue: 6,
        reward: { type: AchievementRewardType.GOLD, amount: 600 },
        isHidden: false,
        sort: 13
    },
    {
        id: "weapon_max",
        name: "神兵利器",
        desc: "将任意武器升至满级",
        icon: "icon/ach_weapon_max",
        category: AchievementType.WEAPON,
        targetValue: 1,
        reward: { type: AchievementRewardType.GOLD, amount: 800 },
        isHidden: false,
        sort: 14
    },
    {
        id: "boss_1",
        name: "初斩敌将",
        desc: "击败 1 个 Boss",
        icon: "icon/ach_boss_01",
        category: AchievementType.BOSS,
        targetValue: 1,
        reward: { type: AchievementRewardType.REVIVE, amount: 1 },
        isHidden: false,
        sort: 15
    },
    {
        id: "boss_10",
        name: "Boss 杀手",
        desc: "累计击败 10 个 Boss",
        icon: "icon/ach_boss_02",
        category: AchievementType.BOSS,
        targetValue: 10,
        reward: { type: AchievementRewardType.GOLD, amount: 500 },
        isHidden: false,
        sort: 16
    },
    {
        id: "combo_50",
        name: "连杀达人",
        desc: "达成 50 连杀",
        icon: "icon/ach_combo_01",
        category: AchievementType.COMBO,
        targetValue: 50,
        reward: { type: AchievementRewardType.GOLD, amount: 400 },
        isHidden: false,
        sort: 17
    },
    {
        id: "combo_100",
        name: "无双割草",
        desc: "达成 100 连杀",
        icon: "icon/ach_combo_02",
        category: AchievementType.COMBO,
        targetValue: 100,
        reward: { type: AchievementRewardType.GOLD, amount: 800 },
        isHidden: false,
        sort: 18
    },
    {
        id: "hero_all",
        name: "英雄齐聚",
        desc: "解锁所有英雄",
        icon: "icon/ach_hero_all",
        category: AchievementType.HERO,
        targetValue: 5,
        reward: { type: AchievementRewardType.GOLD, amount: 1000 },
        isHidden: false,
        sort: 19
    },
    {
        id: "talent_10",
        name: "天赋异禀",
        desc: "升级天赋 10 次",
        icon: "icon/ach_talent_01",
        category: AchievementType.TALENT,
        targetValue: 10,
        reward: { type: AchievementRewardType.GOLD, amount: 500 },
        isHidden: false,
        sort: 20
    },
    {
        id: "level_10",
        name: "勇猛精进",
        desc: "单局升至 10 级",
        icon: "icon/ach_level_01",
        category: AchievementType.LEVEL,
        targetValue: 10,
        reward: { type: AchievementRewardType.GOLD, amount: 300 },
        isHidden: false,
        sort: 21
    },
    {
        id: "level_20",
        name: "登峰造极",
        desc: "单局升至 20 级",
        icon: "icon/ach_level_02",
        category: AchievementType.LEVEL,
        targetValue: 20,
        reward: { type: AchievementRewardType.GOLD, amount: 600 },
        isHidden: false,
        sort: 22
    },
    {
        id: "kill_100_single",
        name: "单骑破阵",
        desc: "单局击杀 100 个敌人",
        icon: "icon/ach_single_01",
        category: AchievementType.KILL,
        targetValue: 100,
        reward: { type: AchievementRewardType.GOLD, amount: 400 },
        isHidden: true,
        sort: 23
    },
    {
        id: "kill_500_single",
        name: "一战封神",
        desc: "单局击杀 500 个敌人",
        icon: "icon/ach_single_02",
        category: AchievementType.KILL,
        targetValue: 500,
        reward: { type: AchievementRewardType.GOLD, amount: 1000 },
        isHidden: true,
        sort: 24
    },
    {
        id: "hero_mastery_zhaoyun",
        name: "一身是胆",
        desc: "赵云熟练度达到无双",
        icon: "icon/ach_hero_zhaoyun",
        category: AchievementType.HERO,
        targetValue: 1,
        reward: { type: AchievementRewardType.GOLD, amount: 500 },
        isHidden: false,
        sort: 25
    },
    {
        id: "hero_mastery_guanyu",
        name: "武圣降临",
        desc: "关羽熟练度达到无双",
        icon: "icon/ach_hero_guanyu",
        category: AchievementType.HERO,
        targetValue: 1,
        reward: { type: AchievementRewardType.GOLD, amount: 500 },
        isHidden: false,
        sort: 26
    },
    {
        id: "hero_mastery_zhangfei",
        name: "万人敌",
        desc: "张飞熟练度达到无双",
        icon: "icon/ach_hero_zhangfei",
        category: AchievementType.HERO,
        targetValue: 1,
        reward: { type: AchievementRewardType.GOLD, amount: 500 },
        isHidden: false,
        sort: 27
    },
    {
        id: "hero_mastery_zhugeliang",
        name: "神机妙算",
        desc: "诸葛亮熟练度达到无双",
        icon: "icon/ach_hero_zhugeliang",
        category: AchievementType.HERO,
        targetValue: 1,
        reward: { type: AchievementRewardType.GOLD, amount: 500 },
        isHidden: false,
        sort: 28
    },
    {
        id: "hero_mastery_lvbu",
        name: "天下无双",
        desc: "吕布熟练度达到无双",
        icon: "icon/ach_hero_lvbu",
        category: AchievementType.HERO,
        targetValue: 1,
        reward: { type: AchievementRewardType.GOLD, amount: 500 },
        isHidden: false,
        sort: 29
    },
    {
        id: "hero_kill_zhaoyun_1000",
        name: "龙胆之威",
        desc: "使用赵云累计击杀 1000 个敌人",
        icon: "icon/ach_hero_kill_01",
        category: AchievementType.HERO,
        targetValue: 1000,
        reward: { type: AchievementRewardType.GOLD, amount: 600 },
        isHidden: false,
        sort: 30
    },
    {
        id: "hero_kill_guanyu_1000",
        name: "青龙偃月",
        desc: "使用关羽累计击杀 1000 个敌人",
        icon: "icon/ach_hero_kill_02",
        category: AchievementType.HERO,
        targetValue: 1000,
        reward: { type: AchievementRewardType.GOLD, amount: 600 },
        isHidden: false,
        sort: 31
    },
    {
        id: "hero_kill_zhangfei_1000",
        name: "燕人咆哮",
        desc: "使用张飞累计击杀 1000 个敌人",
        icon: "icon/ach_hero_kill_03",
        category: AchievementType.HERO,
        targetValue: 1000,
        reward: { type: AchievementRewardType.GOLD, amount: 600 },
        isHidden: false,
        sort: 32
    },
    {
        id: "hero_kill_zhugeliang_1000",
        name: "卧龙破阵",
        desc: "使用诸葛亮累计击杀 1000 个敌人",
        icon: "icon/ach_hero_kill_04",
        category: AchievementType.HERO,
        targetValue: 1000,
        reward: { type: AchievementRewardType.GOLD, amount: 600 },
        isHidden: false,
        sort: 33
    },
    {
        id: "hero_kill_lvbu_1000",
        name: "飞将无双",
        desc: "使用吕布累计击杀 1000 个敌人",
        icon: "icon/ach_hero_kill_05",
        category: AchievementType.HERO,
        targetValue: 1000,
        reward: { type: AchievementRewardType.GOLD, amount: 600 },
        isHidden: false,
        sort: 34
    },
    {
        id: "hero_survive_20min",
        name: "不死将军",
        desc: "使用任意英雄单局存活 20 分钟",
        icon: "icon/ach_hero_survive",
        category: AchievementType.HERO,
        targetValue: 1200,
        reward: { type: AchievementRewardType.GOLD, amount: 800 },
        isHidden: false,
        sort: 35
    },
    {
        id: "hero_game_50",
        name: "身经百战",
        desc: "使用英雄完成 50 场战斗",
        icon: "icon/ach_hero_game",
        category: AchievementType.HERO,
        targetValue: 50,
        reward: { type: AchievementRewardType.REVIVE, amount: 5 },
        isHidden: false,
        sort: 36
    },
    {
        id: "hero_game_100",
        name: "千锤百炼",
        desc: "使用英雄完成 100 场战斗",
        icon: "icon/ach_hero_game_02",
        category: AchievementType.HERO,
        targetValue: 100,
        reward: { type: AchievementRewardType.GOLD, amount: 1500 },
        isHidden: false,
        sort: 37
    },
    {
        id: "hero_skill_max",
        name: "技能大师",
        desc: "在战斗中把英雄技能升至满级",
        icon: "icon/ach_hero_skill",
        category: AchievementType.HERO,
        targetValue: 1,
        reward: { type: AchievementRewardType.GOLD, amount: 400 },
        isHidden: false,
        sort: 38
    }
];

export const ACHIEVEMENT_STORAGE_KEYS = {
    COMPLETED: "sgzy_ach_completed",
    CLAIMED: "sgzy_ach_claimed",
    PROGRESS: "sgzy_ach_progress",
    TOTAL_KILL: "sgzy_total_kill",
    TOTAL_GOLD: "sgzy_total_gold_earned",
    TOTAL_BOSS: "sgzy_total_boss_kill",
    TOTAL_WEAPON: "sgzy_total_weapon_unlock",
    TOTAL_TALENT: "sgzy_total_talent_upgrade",
    MAX_COMBO: "sgzy_max_combo",
    MAX_LEVEL: "sgzy_max_level",
    MAX_SURVIVE: "sgzy_max_survive_time",
    MAX_SINGLE_KILL: "sgzy_max_single_kill"
};