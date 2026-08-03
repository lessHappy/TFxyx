export enum TalentType {
    ATTACK = "attack",
    ATTACK_SPEED = "attack_speed",
    CRIT_RATE = "crit_rate",
    CRIT_DAMAGE = "crit_damage",
    MAX_HP = "max_hp",
    HP_REGEN = "hp_regen",
    MOVE_SPEED = "move_speed",
    EXP_GAIN = "exp_gain",
    GOLD_GAIN = "gold_gain",
    PICKUP_RANGE = "pickup_range",
    PROJECTILE_COUNT = "projectile_count",
    DAMAGE_REDUCTION = "damage_reduction"
}

export interface TalentData {
    id: TalentType;
    name: string;
    desc: string;
    icon: string;
    maxLevel: number;
    baseCost: number;
    costPerLevel: number;
    effectPerLevel: number;
    effectSuffix: string;
    prerequisite?: { type: TalentType; level: number };
}

export const TALENT_CONFIG: Record<TalentType, TalentData> = {
    [TalentType.ATTACK]: {
        id: TalentType.ATTACK,
        name: "攻击力",
        desc: "提升所有武器伤害",
        icon: "icon_attack",
        maxLevel: 20,
        baseCost: 50,
        costPerLevel: 35,
        effectPerLevel: 0.05,
        effectSuffix: "%"
    },
    [TalentType.ATTACK_SPEED]: {
        id: TalentType.ATTACK_SPEED,
        name: "攻击速度",
        desc: "减少武器攻击间隔",
        icon: "icon_attack_speed",
        maxLevel: 15,
        baseCost: 60,
        costPerLevel: 40,
        effectPerLevel: 0.04,
        effectSuffix: "%"
    },
    [TalentType.CRIT_RATE]: {
        id: TalentType.CRIT_RATE,
        name: "暴击率",
        desc: "增加造成暴击的概率",
        icon: "icon_crit",
        maxLevel: 20,
        baseCost: 80,
        costPerLevel: 50,
        effectPerLevel: 0.03,
        effectSuffix: "%",
        prerequisite: { type: TalentType.ATTACK, level: 5 }
    },
    [TalentType.CRIT_DAMAGE]: {
        id: TalentType.CRIT_DAMAGE,
        name: "暴击伤害",
        desc: "增加暴击时的伤害倍率",
        icon: "icon_crit_dmg",
        maxLevel: 15,
        baseCost: 100,
        costPerLevel: 60,
        effectPerLevel: 0.1,
        effectSuffix: "x",
        prerequisite: { type: TalentType.CRIT_RATE, level: 3 }
    },
    [TalentType.MAX_HP]: {
        id: TalentType.MAX_HP,
        name: "最大生命",
        desc: "增加生命值上限",
        icon: "icon_hp",
        maxLevel: 20,
        baseCost: 40,
        costPerLevel: 25,
        effectPerLevel: 0.06,
        effectSuffix: "%"
    },
    [TalentType.HP_REGEN]: {
        id: TalentType.HP_REGEN,
        name: "生命恢复",
        desc: "每秒恢复生命值",
        icon: "icon_regen",
        maxLevel: 10,
        baseCost: 120,
        costPerLevel: 80,
        effectPerLevel: 1,
        effectSuffix: "/s",
        prerequisite: { type: TalentType.MAX_HP, level: 5 }
    },
    [TalentType.MOVE_SPEED]: {
        id: TalentType.MOVE_SPEED,
        name: "移动速度",
        desc: "增加角色移动速度",
        icon: "icon_speed",
        maxLevel: 10,
        baseCost: 70,
        costPerLevel: 45,
        effectPerLevel: 0.05,
        effectSuffix: "%"
    },
    [TalentType.EXP_GAIN]: {
        id: TalentType.EXP_GAIN,
        name: "经验获取",
        desc: "增加击败敌人获得经验",
        icon: "icon_exp",
        maxLevel: 15,
        baseCost: 55,
        costPerLevel: 35,
        effectPerLevel: 0.06,
        effectSuffix: "%"
    },
    [TalentType.GOLD_GAIN]: {
        id: TalentType.GOLD_GAIN,
        name: "金币获取",
        desc: "增加击败敌人获得金币",
        icon: "icon_gold",
        maxLevel: 15,
        baseCost: 65,
        costPerLevel: 40,
        effectPerLevel: 0.06,
        effectSuffix: "%"
    },
    [TalentType.PICKUP_RANGE]: {
        id: TalentType.PICKUP_RANGE,
        name: "拾取范围",
        desc: "增加自动拾取经验范围",
        icon: "icon_pickup",
        maxLevel: 10,
        baseCost: 45,
        costPerLevel: 30,
        effectPerLevel: 0.08,
        effectSuffix: "%"
    },
    [TalentType.PROJECTILE_COUNT]: {
        id: TalentType.PROJECTILE_COUNT,
        name: "额外弹射",
        desc: "增加子弹数量",
        icon: "icon_projectile",
        maxLevel: 5,
        baseCost: 300,
        costPerLevel: 250,
        effectPerLevel: 1,
        effectSuffix: "",
        prerequisite: { type: TalentType.ATTACK, level: 10 }
    },
    [TalentType.DAMAGE_REDUCTION]: {
        id: TalentType.DAMAGE_REDUCTION,
        name: "伤害减免",
        desc: "减少受到的伤害",
        icon: "icon_defense",
        maxLevel: 15,
        baseCost: 90,
        costPerLevel: 55,
        effectPerLevel: 0.03,
        effectSuffix: "%",
        prerequisite: { type: TalentType.MAX_HP, level: 5 }
    }
};

export const TALENT_TAB_CONFIG = [
    { label: "攻击", types: [TalentType.ATTACK, TalentType.ATTACK_SPEED, TalentType.CRIT_RATE, TalentType.CRIT_DAMAGE] },
    { label: "防御", types: [TalentType.MAX_HP, TalentType.HP_REGEN, TalentType.DAMAGE_REDUCTION] },
    { label: "辅助", types: [TalentType.MOVE_SPEED, TalentType.EXP_GAIN, TalentType.GOLD_GAIN, TalentType.PICKUP_RANGE, TalentType.PROJECTILE_COUNT] }
];