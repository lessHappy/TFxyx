export enum HeroType {
    ZHAO_YUN = "zhao_yun",
    GUAN_YU = "guan_yu",
    ZHANG_FEI = "zhang_fei",
    ZHUGE_LIANG = "zhuge_liang",
    LV_BU = "lv_bu"
}

export type HeroUnlockType = "default" | "kill" | "gold" | "survive" | "ad";

export interface HeroData {
    id: HeroType;
    name: string;
    title: string;
    desc: string;
    skillName: string;
    skillDesc: string;
    icon: string;
    spriteFrame: string;

    hpBonus: number;
    moveSpeedBonus: number;
    damageBonus: number;
    attackSpeedBonus: number;
    expBonus: number;

    unlockType: HeroUnlockType;
    unlockValue: number;
}

export interface HeroColorConfig {
    baseColor: { r: number; g: number; b: number; a: number };
    dashColor: { r: number; g: number; b: number; a: number };
    killBuffColor: { r: number; g: number; b: number; a: number };
}

export const HERO_COLOR_CONFIG: Record<HeroType, HeroColorConfig> = {
    [HeroType.ZHAO_YUN]: {
        baseColor: { r: 180, g: 220, b: 255, a: 255 },
        dashColor: { r: 100, g: 180, b: 255, a: 255 },
        killBuffColor: { r: 255, g: 180, b: 60, a: 255 },
    },
    [HeroType.GUAN_YU]: {
        baseColor: { r: 255, g: 200, b: 100, a: 255 },
        dashColor: { r: 255, g: 220, b: 80, a: 255 },
        killBuffColor: { r: 255, g: 180, b: 60, a: 255 },
    },
    [HeroType.ZHANG_FEI]: {
        baseColor: { r: 255, g: 150, b: 100, a: 255 },
        dashColor: { r: 255, g: 120, b: 60, a: 255 },
        killBuffColor: { r: 255, g: 180, b: 60, a: 255 },
    },
    [HeroType.ZHUGE_LIANG]: {
        baseColor: { r: 160, g: 255, b: 200, a: 255 },
        dashColor: { r: 100, g: 255, b: 180, a: 255 },
        killBuffColor: { r: 255, g: 180, b: 60, a: 255 },
    },
    [HeroType.LV_BU]: {
        baseColor: { r: 255, g: 100, b: 100, a: 255 },
        dashColor: { r: 255, g: 60, b: 60, a: 255 },
        killBuffColor: { r: 255, g: 180, b: 60, a: 255 },
    },
};

export const HERO_CONFIG: Record<HeroType, HeroData> = {
    [HeroType.ZHAO_YUN]: {
        id: HeroType.ZHAO_YUN,
        name: "赵云",
        title: "常山赵子龙",
        desc: "七进七出，纵横沙场",
        skillName: "龙胆",
        skillDesc: "冲刺冷却时间减少20%",
        icon: "hero_zhaoyun",
        spriteFrame: "hero/hero_zhaoyun",
        hpBonus: 1.0,
        moveSpeedBonus: 1.0,
        damageBonus: 1.0,
        attackSpeedBonus: 1.0,
        expBonus: 1.0,
        unlockType: "default",
        unlockValue: 0
    },
    [HeroType.GUAN_YU]: {
        id: HeroType.GUAN_YU,
        name: "关羽",
        title: "武圣",
        desc: "青龙偃月，威震华夏",
        skillName: "武圣",
        skillDesc: "击杀敌人后3秒内攻击力+30%",
        icon: "hero_guanyu",
        spriteFrame: "hero/hero_guanyu",
        hpBonus: 1.2,
        moveSpeedBonus: 0.94,
        damageBonus: 1.2,
        attackSpeedBonus: 0.85,
        expBonus: 1.0,
        unlockType: "kill",
        unlockValue: 800
    },
    [HeroType.ZHANG_FEI]: {
        id: HeroType.ZHANG_FEI,
        name: "张飞",
        title: "燕人张翼德",
        desc: "万夫不当之勇",
        skillName: "怒吼",
        skillDesc: "生命低于30%时伤害+50%",
        icon: "hero_zhangfei",
        spriteFrame: "hero/hero_zhangfei",
        hpBonus: 1.6,
        moveSpeedBonus: 0.88,
        damageBonus: 0.9,
        attackSpeedBonus: 1.0,
        expBonus: 1.0,
        unlockType: "gold",
        unlockValue: 10000
    },
    [HeroType.ZHUGE_LIANG]: {
        id: HeroType.ZHUGE_LIANG,
        name: "诸葛亮",
        title: "卧龙",
        desc: "运筹帷幄，决胜千里",
        skillName: "智谋",
        skillDesc: "升级时额外恢复20%生命值",
        icon: "hero_zhugeliang",
        spriteFrame: "hero/hero_zhugeliang",
        hpBonus: 0.8,
        moveSpeedBonus: 0.94,
        damageBonus: 1.0,
        attackSpeedBonus: 1.15,
        expBonus: 1.3,
        unlockType: "survive",
        unlockValue: 1800
    },
    [HeroType.LV_BU]: {
        id: HeroType.LV_BU,
        name: "吕布",
        title: "飞将",
        desc: "人中吕布，马中赤兔",
        skillName: "无双",
        skillDesc: "暴击伤害额外+0.5倍",
        icon: "hero_lvbu",
        spriteFrame: "hero/hero_lvbu",
        hpBonus: 1.3,
        moveSpeedBonus: 0.97,
        damageBonus: 1.35,
        attackSpeedBonus: 0.9,
        expBonus: 0.8,
        unlockType: "ad",
        unlockValue: 2000
    }
};

export const HERO_ORDER: HeroType[] = [
    HeroType.ZHAO_YUN,
    HeroType.GUAN_YU,
    HeroType.ZHANG_FEI,
    HeroType.ZHUGE_LIANG,
    HeroType.LV_BU
];

export const UNLOCK_HINT_MAP: Record<HeroUnlockType, (value: number) => string> = {
    kill: (v) => `累计击杀${v}只敌人`,
    gold: (v) => `累计获得${v}金币`,
    survive: (v) => `累计生存${Math.floor(v / 60)}分钟`,
    ad: () => `观看广告即可解锁`,
    default: () => `默认解锁`
};

export interface HeroMasteryData {
    level: number;
    name: string;
    expRequired: number;
    bonus: { hp: number; damage: number };
}

export const HERO_MASTERY_CONFIG: HeroMasteryData[] = [
    { level: 0, name: "初学", expRequired: 0, bonus: { hp: 0, damage: 0 } },
    { level: 1, name: "熟练", expRequired: 50, bonus: { hp: 0.02, damage: 0.02 } },
    { level: 2, name: "精通", expRequired: 200, bonus: { hp: 0.05, damage: 0.05 } },
    { level: 3, name: "大师", expRequired: 800, bonus: { hp: 0.1, damage: 0.1 } },
    { level: 4, name: "无双", expRequired: 3000, bonus: { hp: 0.2, damage: 0.2 } },
];

export const HERO_MASTERY_MAX_LEVEL = HERO_MASTERY_CONFIG.length - 1;

export const HERO_MASTERY_REWARDS: Record<number, number> = {
    1: 200,
    2: 500,
    3: 1000,
    4: 3000,
};

export enum HeroSkillEffectType {
    DASH_COOLDOWN = "dash_cooldown",
    KILL_BUFF = "kill_buff",
    LOW_HP_BERSERK = "low_hp_berserk",
    LEVEL_UP_HEAL = "level_up_heal",
    CRIT_DMG_BONUS = "crit_dmg_bonus",
}

export interface HeroSkillEffectConfig {
    type: HeroSkillEffectType;
    params: Record<string, number>;
}

export const HERO_SKILL_EFFECTS: Record<HeroType, HeroSkillEffectConfig> = {
    [HeroType.ZHAO_YUN]: {
        type: HeroSkillEffectType.DASH_COOLDOWN,
        params: { multiplier: 0.8 },
    },
    [HeroType.GUAN_YU]: {
        type: HeroSkillEffectType.KILL_BUFF,
        params: { duration: 3, damageBonus: 0.3 },
    },
    [HeroType.ZHANG_FEI]: {
        type: HeroSkillEffectType.LOW_HP_BERSERK,
        params: { hpThreshold: 0.3, damageBonus: 0.5 },
    },
    [HeroType.ZHUGE_LIANG]: {
        type: HeroSkillEffectType.LEVEL_UP_HEAL,
        params: { healPercent: 0.2 },
    },
    [HeroType.LV_BU]: {
        type: HeroSkillEffectType.CRIT_DMG_BONUS,
        params: { bonus: 0.5 },
    },
};

export const HERO_ALL_TYPES: HeroType[] = [
    HeroType.ZHAO_YUN,
    HeroType.GUAN_YU,
    HeroType.ZHANG_FEI,
    HeroType.ZHUGE_LIANG,
    HeroType.LV_BU,
];

export interface HeroSynergyData {
    weaponId: string;
    description: string;
    damageBonus?: number;
    rangeBonus?: number;
    attackSpeedBonus?: number;
    critRateBonus?: number;
    critDmgBonus?: number;
    expBonus?: number;
}

export const HERO_SYNERGY: Record<HeroType, HeroSynergyData[]> = {
    [HeroType.ZHAO_YUN]: [
        { weaponId: "spear", description: "长枪系武器伤害+15%", damageBonus: 0.15 },
        { weaponId: "boomerang", description: "冲刺后回旋刃伤害+10%", damageBonus: 0.1 },
    ],
    [HeroType.GUAN_YU]: [
        { weaponId: "knife", description: "飞刀系武器攻击范围+20%", rangeBonus: 0.2 },
        { weaponId: "fireball", description: "击杀后火焰伤害+10%", damageBonus: 0.1 },
    ],
    [HeroType.ZHANG_FEI]: [
        { weaponId: "spear", description: "低血量时武器伤害+30%", damageBonus: 0.3 },
        { weaponId: "summon_bai_er", description: "士兵攻击速度+15%", attackSpeedBonus: 0.15 },
    ],
    [HeroType.ZHUGE_LIANG]: [
        { weaponId: "fireball", description: "法术系武器经验+20%", expBonus: 0.2 },
        { weaponId: "boomerang", description: "武器冷却-15%", attackSpeedBonus: 0.15 },
    ],
    [HeroType.LV_BU]: [
        { weaponId: "knife", description: "暴击伤害额外+25%", critDmgBonus: 0.25 },
        { weaponId: "spear", description: "暴击率+10%", critRateBonus: 0.1 },
    ],
};

import { TalentType } from './TalentConfig';

export interface HeroTalentSynergyEntry {
    talentType: TalentType;
    bonus: number;
    description: string;
}

export const HERO_TALENT_SYNERGY: Record<HeroType, HeroTalentSynergyEntry[]> = {
    [HeroType.ZHAO_YUN]: [
        { talentType: TalentType.ATTACK_SPEED, bonus: 0.25, description: "攻击速度天赋+25%" },
        { talentType: TalentType.MOVE_SPEED, bonus: 0.15, description: "移动速度天赋+15%" },
        { talentType: TalentType.DODGE, bonus: 0.20, description: "闪避天赋+20%" },
    ],
    [HeroType.GUAN_YU]: [
        { talentType: TalentType.ATTACK, bonus: 0.20, description: "攻击力天赋+20%" },
        { talentType: TalentType.CRIT_RATE, bonus: 0.15, description: "暴击率天赋+15%" },
        { talentType: TalentType.LIFESTEAL, bonus: 0.15, description: "吸血天赋+15%" },
    ],
    [HeroType.ZHANG_FEI]: [
        { talentType: TalentType.MAX_HP, bonus: 0.30, description: "生命值天赋+30%" },
        { talentType: TalentType.DAMAGE_REDUCTION, bonus: 0.20, description: "伤害减免天赋+20%" },
        { talentType: TalentType.ARMOR, bonus: 0.25, description: "护甲天赋+25%" },
    ],
    [HeroType.ZHUGE_LIANG]: [
        { talentType: TalentType.EXP_GAIN, bonus: 0.25, description: "经验获取天赋+25%" },
        { talentType: TalentType.PICKUP_RANGE, bonus: 0.20, description: "拾取范围天赋+20%" },
        { talentType: TalentType.DOUBLE_DROP, bonus: 0.20, description: "双倍掉落天赋+20%" },
    ],
    [HeroType.LV_BU]: [
        { talentType: TalentType.CRIT_DAMAGE, bonus: 0.30, description: "暴击伤害天赋+30%" },
        { talentType: TalentType.ATTACK, bonus: 0.15, description: "攻击力天赋+15%" },
        { talentType: TalentType.PROJECTILE_COUNT, bonus: 0.20, description: "弹射数天赋+20%" },
    ],
};

export function getHeroTalentSynergyBonus(heroType: HeroType, talentType: TalentType): number {
    const entries = HERO_TALENT_SYNERGY[heroType];
    if (!entries) return 0;
    const entry = entries.find(e => e.talentType === talentType);
    return entry ? entry.bonus : 0;
}

export function getHeroTalentSynergyEntries(heroType: HeroType): HeroTalentSynergyEntry[] {
    return HERO_TALENT_SYNERGY[heroType] || [];
}

export function getHeroSynergyBonus(heroType: HeroType, weaponId: string): HeroSynergyData | null {
    const synergies = HERO_SYNERGY[heroType];
    if (!synergies) return null;
    return synergies.find(s => s.weaponId === weaponId) || null;
}