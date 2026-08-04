import { StatusType } from '../buff/StatusEffect';

export interface WeaponConfigData {
    id: string;
    name: string;
    desc: string;
    unlockLv: number;
    baseDamage: number;
    attackInterval: number;
    range: number;
    projectileSpeed: number;
    maxLevel: number;
    damageAddPerLv: number;
    intervalReducePerLv: number;
    debuffType?: StatusType;
    debuffChance?: number;
    debuffDuration?: number;
    debuffValue?: number;
    knockbackForce?: number;
}

export const WEAPON_CONFIG: Record<string, WeaponConfigData> = {
    spear: {
        id: "spear",
        name: "长枪",
        desc: "近距离环绕穿刺敌人",
        unlockLv: 1,
        baseDamage: 12,
        attackInterval: 0.7,
        range: 90,
        projectileSpeed: 0,
        maxLevel: 10,
        damageAddPerLv: 4,
        intervalReducePerLv: 0.03,
        knockbackForce: 80,
    },
    knife: {
        id: "knife",
        name: "飞刀",
        desc: "向前投掷穿透飞刀，贯穿多个敌人",
        unlockLv: 2,
        baseDamage: 9,
        attackInterval: 0.55,
        range: 320,
        projectileSpeed: 420,
        maxLevel: 10,
        damageAddPerLv: 3,
        intervalReducePerLv: 0.04,
        debuffType: StatusType.BLEED,
        debuffChance: 0.25,
        debuffDuration: 4,
        debuffValue: 10,
        knockbackForce: 60,
    },
    fireball: {
        id: "fireball",
        name: "火球术",
        desc: "发射火球，命中敌人造成范围爆炸伤害",
        unlockLv: 4,
        baseDamage: 18,
        attackInterval: 1.1,
        range: 280,
        projectileSpeed: 260,
        maxLevel: 10,
        damageAddPerLv: 6,
        intervalReducePerLv: 0.03,
        debuffType: StatusType.BURN,
        debuffChance: 0.4,
        debuffDuration: 3,
        debuffValue: 10,
        knockbackForce: 120,
    },
    boomerang: {
        id: "boomerang",
        name: "回旋刃",
        desc: "飞出后折返，来回切割沿途敌人",
        unlockLv: 6,
        baseDamage: 7,
        attackInterval: 0.65,
        range: 220,
        projectileSpeed: 300,
        maxLevel: 10,
        damageAddPerLv: 2,
        intervalReducePerLv: 0.03,
        knockbackForce: 40,
    },
    summon_bai_er: {
        id: "summon_bai_er",
        name: "百二士兵",
        desc: "召唤百二士兵环绕助战，自动攻击附近敌人",
        unlockLv: 8,
        baseDamage: 10,
        attackInterval: 0.5,
        range: 200,
        projectileSpeed: 0,
        maxLevel: 8,
        damageAddPerLv: 3,
        intervalReducePerLv: 0.02,
        knockbackForce: 50,
    },
};

// 同步更新图鉴数据源，替换 WeaponBookUI 内 WEAPON_DATA
export function getWeaponBookList() {
    const list = [];
    for (const key in WEAPON_CONFIG) {
        const cfg = WEAPON_CONFIG[key];
        list.push({
            id: cfg.id,
            name: cfg.name,
            desc: cfg.desc,
            unlockLevel: cfg.unlockLv
        })
    }
    return list;
}