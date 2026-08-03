export interface StageData {
    id: number;
    name: string;
    desc: string;
    icon: string;
    enemyTypes: string[];
    difficultyMultiplier: number;
    bossId: string;
    unlockKillCount: number;
    unlockGold: number;
    bgPath: string;
    bgColor: string;
}

export const STAGE_LIST: StageData[] = [
    {
        id: 1,
        name: "长坂坡",
        desc: "赵云单骑救主，于长坂坡七进七出，杀得曹军闻风丧胆。",
        icon: "stage/stage_01",
        enemyTypes: ["normal", "fast"],
        difficultyMultiplier: 1.0,
        bossId: "boss_normal",
        unlockKillCount: 0,
        unlockGold: 0,
        bgPath: "bg/battle_01",
        bgColor: "#2d5016"
    },
    {
        id: 2,
        name: "赤壁之战",
        desc: "东风不与周郎便，铜雀春深锁二乔。火攻曹营，大破敌军。",
        icon: "stage/stage_02",
        enemyTypes: ["normal", "fast", "tank"],
        difficultyMultiplier: 1.3,
        bossId: "boss_elite",
        unlockKillCount: 500,
        unlockGold: 0,
        bgPath: "bg/battle_02",
        bgColor: "#8b4513"
    },
    {
        id: 3,
        name: "汉水之战",
        desc: "赵云据汉水，以寡敌众，偃旗息鼓大破曹军。",
        icon: "stage/stage_03",
        enemyTypes: ["normal", "fast", "tank"],
        difficultyMultiplier: 1.6,
        bossId: "boss_elite",
        unlockKillCount: 1200,
        unlockGold: 500,
        bgPath: "bg/battle_03",
        bgColor: "#1a5276"
    },
    {
        id: 4,
        name: "定军山",
        desc: "老将黄忠斩夏侯渊于定军山，蜀军士气大振。",
        icon: "stage/stage_04",
        enemyTypes: ["normal", "fast", "tank", "elite"],
        difficultyMultiplier: 2.0,
        bossId: "boss_legend",
        unlockKillCount: 2500,
        unlockGold: 1000,
        bgPath: "bg/battle_04",
        bgColor: "#6c3483"
    },
    {
        id: 5,
        name: "五丈原",
        desc: "出师未捷身先死，长使英雄泪满襟。最终决战，直面天命。",
        icon: "stage/stage_05",
        enemyTypes: ["normal", "fast", "tank", "elite"],
        difficultyMultiplier: 2.5,
        bossId: "boss_final",
        unlockKillCount: 5000,
        unlockGold: 2000,
        bgPath: "bg/battle_05",
        bgColor: "#922b21"
    }
];

export const STAGE_STORAGE_KEYS = {
    CURRENT_STAGE: "sgzy_current_stage",
    UNLOCKED_STAGES: "sgzy_unlocked_stages",
    HIGHEST_STAGE: "sgzy_highest_stage"
};