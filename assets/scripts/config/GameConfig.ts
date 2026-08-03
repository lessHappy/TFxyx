export const ENEMY_CONFIG: Record<string, { hp: number; speed: number; exp: number; damage: number; gold:number }> = {
    normal: { hp: 60, speed: 80, exp: 8, damage: 5, gold:1 },
    fast: { hp: 35, speed: 130, exp: 12, damage: 4, gold:2 },
    tank: { hp: 180, speed: 45, exp: 25, damage: 10, gold:4 },
    boss: { hp: 500, speed: 45, exp: 80, damage: 15, gold:25 }
};

export const EXP_DROP_CONFIG = {
    magnetRange: 180,
    pickUpRange: 25,
    maxDropCount: 120,
    attractSpeed: 320
};

export const SPAWN_CONFIG = {
    spawnInterval: 1.8,
    minSpawnInterval: 0.6,
    maxEnemyTotal: 60,
    // 怪物类型权重随难度变化
    tankWeightBase: 0.15,
    fastWeightBase: 0.25,
    tankWeightPerScale: 0.03,
    fastWeightPerScale: 0.02
};

export const PLAYER_CONFIG = {
    baseHp: 100,
    levelHpAdd: 8,
    levelHeal: 15,
    moveSpeed: 160,
    hurtFlashTime: 0.35,
    // 玩家移动边界（世界坐标）
    boundMinX: -600,
    boundMaxX: 600,
    boundMinY: -400,
    boundMaxY: 400
};

//摇杆配置
export const JOYSTICK_CONFIG = {
    maxRadius:60
};

//帧率自适应配置
export const FRAME_CONFIG = {
    normalFps:60,
    lowFps:30,
    heavyThreshold:45
};

//离线收益
export const OFFLINE_CONFIG = {
    maxOfflineHour:8,
    incomePerMin:3
};

//武器升级通用配置
export const WEAPON_UPGRADE_CONFIG = {
    intervalReducePerLv: 0.05,
    minIntervalRatio: 0.4
};

// Boss 配置
export const BOSS_CONFIG = {
    spawnInterval: 60,
    hpBase: 500,
    hpPerScale: 200,
    damageBase: 15,
    damagePerScale: 5,
    speedBase: 45,
    expReward: 80,
    goldReward: 25,
    scale: 2.0
};

// 连杀配置
export const COMBO_CONFIG = {
    maxComboTime: 2.0,
    comboThreshold: [5, 15, 30, 50, 100],
    comboExpBonus: [0.15, 0.3, 0.5, 0.75, 1.0]
};

// 玩家冲刺配置
export const DASH_CONFIG = {
    dashSpeed: 600,
    dashDuration: 0.15,
    dashCooldown: 3.0,
    dashInvincibleTime: 0.2
};

// 宝藏宝箱配置
export const CHEST_CONFIG = {
    dropChanceOnBoss: 1.0,
    goldRange: [10, 30],
    openDuration: 0.5
};

// 双倍Buff配置
export const DOUBLE_BUFF_CONFIG = {
    expMultiplier: 2,
    goldMultiplier: 2
};