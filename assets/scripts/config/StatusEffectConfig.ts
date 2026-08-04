import { StatusType, StackMode } from '../buff/StatusEffect';

export interface StatusEffectConfig {
    type: StatusType;
    duration: number;
    tickInterval: number;
    value: number;
    stackMode: StackMode;
    maxStacks: number;
    iconColor?: string;
}

export const STATUS_EFFECT_CONFIGS: Record<StatusType, StatusEffectConfig> = {
    [StatusType.BURN]: {
        type: StatusType.BURN,
        duration: 3,
        tickInterval: 0.5,
        value: 10,
        stackMode: StackMode.REFRESH,
        maxStacks: 1,
        iconColor: '#FF6600',
    },
    [StatusType.POISON]: {
        type: StatusType.POISON,
        duration: 4,
        tickInterval: 0.5,
        value: 8,
        stackMode: StackMode.STACK,
        maxStacks: 5,
        iconColor: '#00CC00',
    },
    [StatusType.BLEED]: {
        type: StatusType.BLEED,
        duration: 5,
        tickInterval: 1.0,
        value: 12,
        stackMode: StackMode.STACK,
        maxStacks: 3,
        iconColor: '#CC0000',
    },
    [StatusType.SLOW]: {
        type: StatusType.SLOW,
        duration: 2,
        tickInterval: 0,
        value: 0.4,
        stackMode: StackMode.REFRESH,
        maxStacks: 1,
        iconColor: '#8888FF',
    },
    [StatusType.FREEZE]: {
        type: StatusType.FREEZE,
        duration: 1.5,
        tickInterval: 0,
        value: 0,
        stackMode: StackMode.REFRESH,
        maxStacks: 1,
        iconColor: '#66CCFF',
    },
    [StatusType.STUN]: {
        type: StatusType.STUN,
        duration: 1.0,
        tickInterval: 0,
        value: 0,
        stackMode: StackMode.REFRESH,
        maxStacks: 1,
        iconColor: '#FFCC00',
    },
    [StatusType.KNOCKBACK]: {
        type: StatusType.KNOCKBACK,
        duration: 0.12,
        tickInterval: 0,
        value: 250,
        stackMode: StackMode.INDEPENDENT,
        maxStacks: 99,
    },
    [StatusType.ATK_SPEED_UP]: {
        type: StatusType.ATK_SPEED_UP,
        duration: 5,
        tickInterval: 0,
        value: 0.3,
        stackMode: StackMode.REFRESH,
        maxStacks: 1,
        iconColor: '#FFDD00',
    },
    [StatusType.MOVE_SPEED_UP]: {
        type: StatusType.MOVE_SPEED_UP,
        duration: 5,
        tickInterval: 0,
        value: 0.3,
        stackMode: StackMode.REFRESH,
        maxStacks: 1,
        iconColor: '#00FF88',
    },
    [StatusType.DMG_UP]: {
        type: StatusType.DMG_UP,
        duration: 5,
        tickInterval: 0,
        value: 0.5,
        stackMode: StackMode.REFRESH,
        maxStacks: 1,
        iconColor: '#FF4444',
    },
    [StatusType.INVINCIBLE]: {
        type: StatusType.INVINCIBLE,
        duration: 3,
        tickInterval: 0,
        value: 0,
        stackMode: StackMode.REFRESH,
        maxStacks: 1,
        iconColor: '#FFD700',
    },
    [StatusType.MAGNET]: {
        type: StatusType.MAGNET,
        duration: 8,
        tickInterval: 0,
        value: 1.5,
        stackMode: StackMode.REFRESH,
        maxStacks: 1,
        iconColor: '#AA66FF',
    },
};

export const STATUS_IMMUNITY_CONFIG: Record<string, Partial<Record<StatusType, number>>> = {
    boss: {
        [StatusType.STUN]: 0.8,
        [StatusType.FREEZE]: 0.8,
        [StatusType.SLOW]: 0.6,
    },
    tank: {
        [StatusType.KNOCKBACK]: 0.5,
        [StatusType.SLOW]: 0.3,
    },
    fast: {
        [StatusType.SLOW]: 0.2,
    },
    controller: {
        [StatusType.STUN]: 0.5,
        [StatusType.FREEZE]: 0.5,
    },
};