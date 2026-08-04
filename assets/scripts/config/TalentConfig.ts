export enum TalentType {
    ATTACK = "attack",
    ATTACK_SPEED = "attack_speed",
    CRIT_RATE = "crit_rate",
    CRIT_DAMAGE = "crit_damage",
    LIFESTEAL = "lifesteal",
    MAX_HP = "max_hp",
    HP_REGEN = "hp_regen",
    ARMOR = "armor",
    DODGE = "dodge",
    MOVE_SPEED = "move_speed",
    EXP_GAIN = "exp_gain",
    GOLD_GAIN = "gold_gain",
    PICKUP_RANGE = "pickup_range",
    PROJECTILE_COUNT = "projectile_count",
    DAMAGE_REDUCTION = "damage_reduction",
    DOUBLE_DROP = "double_drop"
}

export enum TalentCategory {
    ATTACK = "攻击",
    DEFENSE = "防御",
    UTILITY = "辅助"
}

export enum DisplayFormat {
    PERCENT = "percent",
    MULTIPLIER = "multiplier",
    INTEGER = "integer",
    PER_SECOND = "per_second"
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
    displayFormat: DisplayFormat;
    category: TalentCategory;
    bonusLabel: string;
    prerequisite?: { type: TalentType; level: number };
    multiplierBase?: number;
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
        displayFormat: DisplayFormat.PERCENT,
        category: TalentCategory.ATTACK,
        bonusLabel: "攻击"
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
        displayFormat: DisplayFormat.PERCENT,
        category: TalentCategory.ATTACK,
        bonusLabel: "攻速"
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
        displayFormat: DisplayFormat.PERCENT,
        category: TalentCategory.ATTACK,
        bonusLabel: "暴击率",
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
        displayFormat: DisplayFormat.MULTIPLIER,
        category: TalentCategory.ATTACK,
        bonusLabel: "暴伤",
        multiplierBase: 1.5,
        prerequisite: { type: TalentType.CRIT_RATE, level: 3 }
    },
    [TalentType.LIFESTEAL]: {
        id: TalentType.LIFESTEAL,
        name: "吸血",
        desc: "造成伤害时回复生命",
        icon: "icon_lifesteal",
        maxLevel: 10,
        baseCost: 150,
        costPerLevel: 100,
        effectPerLevel: 0.02,
        displayFormat: DisplayFormat.PERCENT,
        category: TalentCategory.ATTACK,
        bonusLabel: "吸血",
        prerequisite: { type: TalentType.CRIT_RATE, level: 5 }
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
        displayFormat: DisplayFormat.PERCENT,
        category: TalentCategory.DEFENSE,
        bonusLabel: "生命"
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
        displayFormat: DisplayFormat.PER_SECOND,
        category: TalentCategory.DEFENSE,
        bonusLabel: "回复",
        prerequisite: { type: TalentType.MAX_HP, level: 5 }
    },
    [TalentType.ARMOR]: {
        id: TalentType.ARMOR,
        name: "护甲",
        desc: "每次受击减少固定伤害",
        icon: "icon_armor",
        maxLevel: 15,
        baseCost: 80,
        costPerLevel: 50,
        effectPerLevel: 2,
        displayFormat: DisplayFormat.INTEGER,
        category: TalentCategory.DEFENSE,
        bonusLabel: "护甲"
    },
    [TalentType.DODGE]: {
        id: TalentType.DODGE,
        name: "闪避",
        desc: "概率完全闪避敌方攻击",
        icon: "icon_dodge",
        maxLevel: 10,
        baseCost: 120,
        costPerLevel: 80,
        effectPerLevel: 0.04,
        displayFormat: DisplayFormat.PERCENT,
        category: TalentCategory.DEFENSE,
        bonusLabel: "闪避",
        prerequisite: { type: TalentType.MOVE_SPEED, level: 5 }
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
        displayFormat: DisplayFormat.PERCENT,
        category: TalentCategory.UTILITY,
        bonusLabel: "移速"
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
        displayFormat: DisplayFormat.PERCENT,
        category: TalentCategory.UTILITY,
        bonusLabel: "经验"
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
        displayFormat: DisplayFormat.PERCENT,
        category: TalentCategory.UTILITY,
        bonusLabel: "金币"
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
        displayFormat: DisplayFormat.PERCENT,
        category: TalentCategory.UTILITY,
        bonusLabel: "拾取"
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
        displayFormat: DisplayFormat.INTEGER,
        category: TalentCategory.UTILITY,
        bonusLabel: "弹射",
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
        displayFormat: DisplayFormat.PERCENT,
        category: TalentCategory.DEFENSE,
        bonusLabel: "减伤",
        prerequisite: { type: TalentType.MAX_HP, level: 5 }
    },
    [TalentType.DOUBLE_DROP]: {
        id: TalentType.DOUBLE_DROP,
        name: "双倍掉落",
        desc: "概率获得双倍经验与金币",
        icon: "icon_double",
        maxLevel: 10,
        baseCost: 140,
        costPerLevel: 90,
        effectPerLevel: 0.05,
        displayFormat: DisplayFormat.PERCENT,
        category: TalentCategory.UTILITY,
        bonusLabel: "双倍",
        prerequisite: { type: TalentType.EXP_GAIN, level: 5 }
    }
};

export const MAX_TOTAL_TALENT_POINTS = 100;
export const TALENT_POINTS_PER_LEVEL = 2;
export const INITIAL_TALENT_POINTS = 5;

export const RESET_BASE_REFUND_RATIO = 0.8;
export const RESET_REFUND_DECAY_PER_RESET = 0.05;
export const RESET_MIN_REFUND_RATIO = 0.5;
export const RESET_COOLDOWN_SECONDS = 300;
export const RESET_MAX_FREE_COUNT = 0;

export const MAX_PRESET_SLOTS = 5;
export const PRESET_DEFAULT_NAMES = ["方案一", "方案二", "方案三", "方案四", "方案五"];

const ALL_TALENT_TYPES = Object.values(TalentType) as TalentType[];
export const ALL_TALENT_CONFIGS = Object.values(TALENT_CONFIG);

let _maxTotalLevelCache: number = -1;
export function getMaxTotalLevel(): number {
    if (_maxTotalLevelCache < 0) {
        _maxTotalLevelCache = ALL_TALENT_CONFIGS.reduce((sum, cfg) => sum + cfg.maxLevel, 0);
    }
    return _maxTotalLevelCache;
}

let _talentTypesByCategory: Map<TalentCategory, TalentType[]> | null = null;
export function getTalentTypesByCategory(category: TalentCategory): TalentType[] {
    if (!_talentTypesByCategory) {
        _talentTypesByCategory = new Map();
        for (const type of ALL_TALENT_TYPES) {
            const cfg = TALENT_CONFIG[type];
            const arr = _talentTypesByCategory.get(cfg.category);
            if (arr) {
                arr.push(type);
            } else {
                _talentTypesByCategory.set(cfg.category, [type]);
            }
        }
        for (const [, types] of _talentTypesByCategory) {
            sortTypesByTreeOrder(types);
        }
    }
    return _talentTypesByCategory.get(category) || [];
}

function sortTypesByTreeOrder(types: TalentType[]): void {
    types.sort((a, b) => {
        const cfgA = TALENT_CONFIG[a];
        const cfgB = TALENT_CONFIG[b];
        const depthA = getPrerequisiteDepth(cfgA);
        const depthB = getPrerequisiteDepth(cfgB);
        return depthA - depthB;
    });
}

function getPrerequisiteDepth(cfg: TalentData): number {
    let depth = 0;
    let current: TalentData | undefined = cfg;
    while (current && current.prerequisite) {
        depth++;
        current = TALENT_CONFIG[current.prerequisite.type];
    }
    return depth;
}

export function getTalentPrerequisiteChain(type: TalentType): TalentType[] {
    const chain: TalentType[] = [];
    const cfg = TALENT_CONFIG[type];
    if (!cfg) return chain;
    let current: TalentData | undefined = cfg;
    while (current && current.prerequisite) {
        chain.unshift(current.prerequisite.type);
        current = TALENT_CONFIG[current.prerequisite.type];
    }
    return chain;
}

export const TALENT_TAB_CONFIG = [
    { label: TalentCategory.ATTACK, types: getTalentTypesByCategory(TalentCategory.ATTACK) },
    { label: TalentCategory.DEFENSE, types: getTalentTypesByCategory(TalentCategory.DEFENSE) },
    { label: TalentCategory.UTILITY, types: getTalentTypesByCategory(TalentCategory.UTILITY) }
];

type FormatFn = (value: number, multiplierBase?: number) => string;

const FORMATTERS: Record<DisplayFormat, FormatFn> = {
    [DisplayFormat.PERCENT]: (v) => `${(v * 100).toFixed(0)}%`,
    [DisplayFormat.MULTIPLIER]: (v, base) => `${(base || 1.5) + v}x`,
    [DisplayFormat.PER_SECOND]: (v) => `${v.toFixed(0)}/s`,
    [DisplayFormat.INTEGER]: (v) => `${v.toFixed(0)}`,
};

function formatDisplayValue(value: number, format: DisplayFormat, multiplierBase?: number): string {
    return FORMATTERS[format](value, multiplierBase);
}

export function formatTalentValue(value: number, format: DisplayFormat, multiplierBase?: number): string {
    return formatDisplayValue(value, format, multiplierBase);
}

export function formatTalentBonus(cfg: TalentData, value: number): string {
    const formatted = formatDisplayValue(value, cfg.displayFormat, cfg.multiplierBase);
    return `${cfg.bonusLabel}+${formatted}`;
}