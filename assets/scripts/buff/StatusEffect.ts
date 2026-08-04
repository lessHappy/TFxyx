export enum StatusType {
    BURN = 'burn',
    POISON = 'poison',
    BLEED = 'bleed',
    SLOW = 'slow',
    FREEZE = 'freeze',
    STUN = 'stun',
    KNOCKBACK = 'knockback',
    ATK_SPEED_UP = 'atk_speed_up',
    MOVE_SPEED_UP = 'move_speed_up',
    DMG_UP = 'dmg_up',
    INVINCIBLE = 'invincible',
    MAGNET = 'magnet',
}

export enum StackMode {
    REFRESH = 'refresh',
    STACK = 'stack',
    INDEPENDENT = 'independent',
}

export interface StatusEffectData {
    type: StatusType;
    duration: number;
    tickInterval: number;
    value: number;
    stackMode: StackMode;
    maxStacks: number;
    iconColor?: string;
}

export class StatusEffectInstance {
    public data: StatusEffectData;
    public remainingTime: number;
    public tickTimer: number;
    public stacks: number;

    constructor(data: StatusEffectData) {
        this.data = { ...data };
        this.remainingTime = data.duration;
        this.tickTimer = 0;
        this.stacks = 1;
    }

    get isExpired(): boolean { return this.remainingTime <= 0; }

    get shouldTick(): boolean { return this.data.tickInterval > 0; }

    get totalTickDamage(): number { return this.data.value * this.stacks; }

    refreshDuration(): void {
        this.remainingTime = this.data.duration;
    }

    addStack(): boolean {
        if (this.stacks < this.data.maxStacks) {
            this.stacks++;
            this.refreshDuration();
            return true;
        }
        this.refreshDuration();
        return false;
    }

    static createFromConfig(
        type: StatusType,
        duration: number,
        tickInterval: number,
        value: number,
        stackMode: StackMode,
        maxStacks: number,
        iconColor?: string,
    ): StatusEffectData {
        return {
            type,
            duration,
            tickInterval,
            value,
            stackMode,
            maxStacks,
            iconColor,
        };
    }
}