export enum HeroType {
    ZHAO_YUN = "zhao_yun",
    GUAN_YU = "guan_yu",
    ZHANG_FEI = "zhang_fei",
    ZHUGE_LIANG = "zhuge_liang",
    LV_BU = "lv_bu"
}

export interface HeroData {
    id: HeroType;
    name: string;
    title: string;
    desc: string;
    skillName: string;
    skillDesc: string;
    icon: string;

    hpBonus: number;
    moveSpeedBonus: number;
    damageBonus: number;
    attackSpeedBonus: number;
    expBonus: number;

    unlockType: "default" | "kill" | "gold" | "survive" | "ad";
    unlockValue: number;
}

export const HERO_CONFIG: Record<HeroType, HeroData> = {
    [HeroType.ZHAO_YUN]: {
        id: HeroType.ZHAO_YUN,
        name: "赵云",
        title: "常山赵子龙",
        desc: "七进七出，纵横沙场",
        skillName: "龙胆",
        skillDesc: "冲刺冷却时间减少20%",
        icon: "hero_zhaoyun",
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