import { _decorator, Component, Vec3, math } from 'cc';
import { StatusEffectInstance, StatusEffectData, StatusType, StackMode } from './StatusEffect';
import { STATUS_EFFECT_CONFIGS } from '../config/StatusEffectConfig';
import { GameManager } from '../core/GameManager';
const { ccclass } = _decorator;

@ccclass('BufferManager')
export class BufferManager extends Component {
    private _effects: StatusEffectInstance[] = [];
    private _statusResistance: Map<StatusType, number> = new Map();

    private _knockbackVel: Vec3 = new Vec3();
    private _knockbackDecay: number = 8;

    private _speedMult: number = 1;
    private _dmgMult: number = 1;
    private _atkSpeedMult: number = 1;
    private _magnetMult: number = 1;
    private _invincible: boolean = false;
    private _frozen: boolean = false;

    setStatusResistance(statusType: StatusType, resistance: number): void {
        this._statusResistance.set(statusType, math.clamp01(resistance));
    }

    getStatusResistance(statusType: StatusType): number {
        return this._statusResistance.get(statusType) || 0;
    }

    addEffect(statusType: StatusType, customDuration?: number, customValue?: number): boolean {
        const config = STATUS_EFFECT_CONFIGS[statusType];
        if (!config) return false;

        const resistance = this.getStatusResistance(statusType);
        if (resistance >= 1) return false;

        const data = StatusEffectInstance.createFromConfig(
            config.type,
            customDuration ?? config.duration,
            config.tickInterval,
            customValue ?? config.value,
            config.stackMode,
            config.maxStacks,
            config.iconColor,
        );
        if (resistance > 0) {
            data.duration *= (1 - resistance);
            if (data.tickInterval > 0) {
                data.value *= (1 - resistance);
            }
        }

        switch (data.stackMode) {
            case StackMode.REFRESH: {
                const existing = this.getEffect(statusType);
                if (existing) {
                    existing.refreshDuration();
                    return true;
                }
                break;
            }
            case StackMode.STACK: {
                const existing = this.getEffect(statusType);
                if (existing) {
                    return existing.addStack();
                }
                break;
            }
            case StackMode.INDEPENDENT:
                break;
        }

        const instance = new StatusEffectInstance(data);
        this._effects.push(instance);
        this.onEffectApplied(instance);
        return true;
    }

    removeEffect(statusType: StatusType): void {
        const idx = this._effects.findIndex(e => e.data.type === statusType);
        if (idx >= 0) {
            this.removeEffectAt(idx);
        }
    }

    hasEffect(statusType: StatusType): boolean {
        return this._effects.some(e => e.data.type === statusType);
    }

    getEffect(statusType: StatusType): StatusEffectInstance | null {
        return this._effects.find(e => e.data.type === statusType) || null;
    }

    getEffectStackCount(statusType: StatusType): number {
        const effect = this.getEffect(statusType);
        return effect ? effect.stacks : 0;
    }

    clearAllEffects(): void {
        while (this._effects.length > 0) {
            this.removeEffectAt(0);
        }
    }

    get speedMultiplier(): number {
        if (this._frozen) return 0;
        return this._speedMult;
    }

    get damageMultiplier(): number { return this._dmgMult; }
    get attackSpeedMultiplier(): number { return this._atkSpeedMult; }
    get magnetMultiplier(): number { return this._magnetMult; }
    get isInvincibleActive(): boolean { return this._invincible; }
    get isFrozen(): boolean { return this._frozen; }

    get knockbackVelocity(): Vec3 { return this._knockbackVel; }

    applyKnockback(dirX: number, dirY: number, force: number): void {
        const len = Math.sqrt(dirX * dirX + dirY * dirY);
        if (len < 0.001) return;
        this._knockbackVel.set(dirX / len * force, dirY / len * force, 0);
    }

    update(dt: number): void {
        if (GameManager.Instance && (GameManager.Instance.battlePause || GameManager.Instance.gameOver)) return;

        if (dt > 0.1) dt = 0.1;

        this.updateKnockback(dt);
        this.updateEffects(dt);
        this.recalculateMultipliers();
    }

    private updateKnockback(dt: number): void {
        const len = this._knockbackVel.length();
        if (len < 0.5) {
            this._knockbackVel.set(0, 0, 0);
            return;
        }
        const decay = 1 - this._knockbackDecay * dt;
        this._knockbackVel.multiplyScalar(Math.max(decay, 0));
    }

    private updateEffects(dt: number): void {
        for (let i = this._effects.length - 1; i >= 0; i--) {
            const effect = this._effects[i];
            effect.remainingTime -= dt;

            if (effect.shouldTick) {
                effect.tickTimer += dt;
                while (effect.tickTimer >= effect.data.tickInterval) {
                    effect.tickTimer -= effect.data.tickInterval;
                    this.onEffectTick(effect);
                }
            }

            if (effect.isExpired) {
                this.removeEffectAt(i);
            }
        }
    }

    private recalculateMultipliers(): void {
        this._speedMult = 1;
        this._dmgMult = 1;
        this._atkSpeedMult = 1;
        this._magnetMult = 1;
        this._invincible = false;
        this._frozen = false;

        for (const e of this._effects) {
            switch (e.data.type) {
                case StatusType.SLOW:
                    this._speedMult *= (1 - e.data.value);
                    break;
                case StatusType.FREEZE:
                    this._frozen = true;
                    this._speedMult = 0;
                    break;
                case StatusType.STUN:
                    this._frozen = true;
                    this._speedMult = 0;
                    break;
                case StatusType.MOVE_SPEED_UP:
                    this._speedMult *= (1 + e.data.value);
                    break;
                case StatusType.DMG_UP:
                    this._dmgMult *= (1 + e.data.value);
                    break;
                case StatusType.ATK_SPEED_UP:
                    this._atkSpeedMult *= (1 + e.data.value);
                    break;
                case StatusType.INVINCIBLE:
                    this._invincible = true;
                    break;
                case StatusType.MAGNET:
                    this._magnetMult *= (1 + e.data.value);
                    break;
            }
        }

        this._speedMult = Math.max(this._speedMult, 0.05);
    }

    private onEffectApplied(effect: StatusEffectInstance): void {
        if (effect.data.type === StatusType.KNOCKBACK) {
            // Knockback is handled immediately via applyKnockback
        }
    }

    private onEffectTick(effect: StatusEffectInstance): void {
        const dmg = effect.totalTickDamage;
        const node = this.node;
        const pos = node.worldPosition;
        GameManager.Instance?.showDamageNumber(
            pos,
            dmg,
            false
        );

        const enemy = this.node.getComponent('Enemy') as any;
        if (enemy && typeof enemy.takeRawDamage === 'function') {
            enemy.takeRawDamage(dmg);
        }
    }

    private removeEffectAt(index: number): void {
        this._effects.splice(index, 1);
    }

    onDestroy(): void {
        this.clearAllEffects();
    }
}