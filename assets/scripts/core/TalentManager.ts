import { TalentType, TALENT_CONFIG, TalentData, getMaxTotalLevel, RESET_BASE_REFUND_RATIO, RESET_REFUND_DECAY_PER_RESET, RESET_MIN_REFUND_RATIO, RESET_COOLDOWN_SECONDS, RESET_MAX_FREE_COUNT, MAX_TOTAL_TALENT_POINTS, TALENT_POINTS_PER_LEVEL, INITIAL_TALENT_POINTS, MAX_PRESET_SLOTS, PRESET_DEFAULT_NAMES } from '../config/TalentConfig';
import { HeroType, getHeroTalentSynergyBonus } from '../config/HeroConfig';
import { StorageUtil } from './StorageUtil';

const STORAGE_PREFIX = "talent_";
const STORAGE_KEY_EARNED_POINTS = "talent_earned_points";
const STORAGE_KEY_RESET_COUNT = "talent_reset_count";
const STORAGE_KEY_LAST_RESET_TIME = "talent_last_reset_time";
const STORAGE_KEY_PRESETS = "talent_presets";

export interface TalentState {
    level: number;
    data: TalentData;
}

export interface TalentPreset {
    name: string;
    levels: Record<string, number>;
    totalLevel: number;
    totalCost: number;
    createdAt: number;
    updatedAt: number;
}

export interface TalentChangeEvent {
    type: TalentType;
    oldLevel: number;
    newLevel: number;
}

export type TalentChangeCallback = (event: TalentChangeEvent) => void;
export type TalentBatchChangeCallback = (events: TalentChangeEvent[]) => void;

const ALL_TALENT_TYPES = Object.values(TalentType) as TalentType[];

function calcUpgradeCost(cfg: TalentData, currentLevel: number, count: number): number {
    if (count <= 0 || currentLevel >= cfg.maxLevel) return 0;
    const actualCount = Math.min(count, cfg.maxLevel - currentLevel);
    return actualCount * cfg.baseCost + cfg.costPerLevel * (currentLevel * actualCount + (actualCount - 1) * actualCount / 2);
}

function calcTotalSpentForLevel(cfg: TalentData, level: number): number {
    if (level <= 0) return 0;
    return level * cfg.baseCost + cfg.costPerLevel * (level - 1) * level / 2;
}

export class TalentManager {
    private static _instance: TalentManager | null = null;

    static get Instance(): TalentManager {
        if (!TalentManager._instance) {
            TalentManager._instance = new TalentManager();
        }
        return TalentManager._instance;
    }

    private _talentLevels: Map<TalentType, number> = new Map();
    private _effectCache: Map<TalentType, number> = new Map();
    private _totalLevelCache: number = -1;
    private _loaded: boolean = false;
    private _listeners: TalentChangeCallback[] = [];
    private _batchListeners: TalentBatchChangeCallback[] = [];
    private _saveDirty: boolean = false;
    private _saveTimer: ReturnType<typeof setTimeout> | null = null;
    private static readonly SAVE_DEBOUNCE_MS = 500;

    private _earnedTalentPoints: number = 0;
    private _resetCount: number = 0;
    private _lastResetTime: number = 0;

    private invalidateCache() {
        this._effectCache.clear();
        this._totalLevelCache = -1;
    }

    load() {
        if (this._loaded) return;
        for (const type of ALL_TALENT_TYPES) {
            const level = StorageUtil.getNumber(STORAGE_PREFIX + type, 0);
            this._talentLevels.set(type, level);
        }
        this._earnedTalentPoints = StorageUtil.getNumber(STORAGE_KEY_EARNED_POINTS, INITIAL_TALENT_POINTS);
        this._resetCount = StorageUtil.getNumber(STORAGE_KEY_RESET_COUNT, 0);
        this._lastResetTime = StorageUtil.getNumber(STORAGE_KEY_LAST_RESET_TIME, 0);
        this._loaded = true;
    }

    private ensureLoaded() {
        if (!this._loaded) this.load();
    }

    save() {
        for (const [type, level] of this._talentLevels) {
            StorageUtil.setNumber(STORAGE_PREFIX + type, level);
        }
        StorageUtil.setNumber(STORAGE_KEY_EARNED_POINTS, this._earnedTalentPoints);
        StorageUtil.setNumber(STORAGE_KEY_RESET_COUNT, this._resetCount);
        StorageUtil.setNumber(STORAGE_KEY_LAST_RESET_TIME, this._lastResetTime);
    }

    private markSaveDirty() {
        this._saveDirty = true;
        if (this._saveTimer === null) {
            this._saveTimer = setTimeout(() => {
                this._saveTimer = null;
                if (this._saveDirty) {
                    this._saveDirty = false;
                    this.save();
                }
            }, TalentManager.SAVE_DEBOUNCE_MS);
        }
    }

    private flushSave() {
        if (this._saveTimer !== null) {
            clearTimeout(this._saveTimer);
            this._saveTimer = null;
        }
        if (this._saveDirty) {
            this._saveDirty = false;
            this.save();
        }
    }

    addListener(callback: TalentChangeCallback): void {
        if (this._listeners.indexOf(callback) < 0) {
            this._listeners.push(callback);
        }
    }

    removeListener(callback: TalentChangeCallback): void {
        const idx = this._listeners.indexOf(callback);
        if (idx >= 0) {
            this._listeners.splice(idx, 1);
        }
    }

    addBatchListener(callback: TalentBatchChangeCallback): void {
        if (this._batchListeners.indexOf(callback) < 0) {
            this._batchListeners.push(callback);
        }
    }

    removeBatchListener(callback: TalentBatchChangeCallback): void {
        const idx = this._batchListeners.indexOf(callback);
        if (idx >= 0) {
            this._batchListeners.splice(idx, 1);
        }
    }

    private notifyListeners(event: TalentChangeEvent) {
        for (let i = this._listeners.length - 1; i >= 0; i--) {
            this._listeners[i](event);
        }
    }

    private notifyBatchListeners(events: TalentChangeEvent[]) {
        if (events.length === 0) return;
        for (let i = this._batchListeners.length - 1; i >= 0; i--) {
            this._batchListeners[i](events);
        }
    }

    getLevel(type: TalentType): number {
        this.ensureLoaded();
        return this._talentLevels.get(type) || 0;
    }

    getUpgradeCost(type: TalentType): number {
        const cfg = TALENT_CONFIG[type];
        if (!cfg) return 0;
        return calcUpgradeCost(cfg, this.getLevel(type), 1);
    }

    getUpgradeCostForLevel(type: TalentType, targetLevel: number): number {
        const cfg = TALENT_CONFIG[type];
        if (!cfg) return 0;
        const currentLevel = this.getLevel(type);
        if (targetLevel <= currentLevel || targetLevel > cfg.maxLevel) return 0;
        return calcUpgradeCost(cfg, currentLevel, targetLevel - currentLevel);
    }

    getUpgradeCostBatch(type: TalentType, count: number): number {
        const cfg = TALENT_CONFIG[type];
        if (!cfg) return 0;
        return calcUpgradeCost(cfg, this.getLevel(type), count);
    }

    getCostToMaxLevel(type: TalentType): number {
        const cfg = TALENT_CONFIG[type];
        if (!cfg) return 0;
        const currentLevel = this.getLevel(type);
        if (currentLevel >= cfg.maxLevel) return 0;
        return calcUpgradeCost(cfg, currentLevel, cfg.maxLevel - currentLevel);
    }

    getRemainingLevels(type: TalentType): number {
        const cfg = TALENT_CONFIG[type];
        if (!cfg) return 0;
        return Math.max(0, cfg.maxLevel - this.getLevel(type));
    }

    getMaxAffordableUpgrades(type: TalentType, availableGold: number): number {
        const cfg = TALENT_CONFIG[type];
        if (!cfg) return 0;
        const currentLevel = this.getLevel(type);
        if (currentLevel >= cfg.maxLevel || !this.isPrerequisiteMet(type)) return 0;

        let lo = 0;
        let hi = cfg.maxLevel - currentLevel;
        while (lo < hi) {
            const mid = lo + Math.floor((hi - lo + 1) / 2);
            const cost = calcUpgradeCost(cfg, currentLevel, mid);
            if (cost <= availableGold) {
                lo = mid;
            } else {
                hi = mid - 1;
            }
        }
        return lo;
    }

    isMaxLevel(type: TalentType): boolean {
        const cfg = TALENT_CONFIG[type];
        if (!cfg) return true;
        return this.getLevel(type) >= cfg.maxLevel;
    }

    isPrerequisiteMet(type: TalentType): boolean {
        this.ensureLoaded();
        const cfg = TALENT_CONFIG[type];
        if (!cfg) return false;
        if (!cfg.prerequisite) return true;
        return this.getLevel(cfg.prerequisite.type) >= cfg.prerequisite.level;
    }

    getPrerequisiteDesc(type: TalentType): string {
        const cfg = TALENT_CONFIG[type];
        if (!cfg || !cfg.prerequisite) return "";
        const reqCfg = TALENT_CONFIG[cfg.prerequisite.type];
        return `${reqCfg.name} Lv.${cfg.prerequisite.level}`;
    }

    upgrade(type: TalentType): boolean {
        return this.upgradeCount(type, 1) > 0;
    }

    upgradeCount(type: TalentType, count: number): number {
        if (count <= 0) return 0;
        const cfg = TALENT_CONFIG[type];
        if (!cfg) return 0;
        if (!this.isPrerequisiteMet(type)) return 0;

        const currentLevel = this.getLevel(type);
        const maxAllowed = cfg.maxLevel - currentLevel;
        let actual = Math.min(count, maxAllowed);
        if (actual <= 0) return 0;

        const pointsCap = this.getEarnedTalentPoints();
        const remainingTotal = pointsCap - this.getTotalLevel();
        if (remainingTotal <= 0) return 0;
        actual = Math.min(actual, remainingTotal);

        this._talentLevels.set(type, currentLevel + actual);
        this.invalidateCache();
        this.markSaveDirty();
        this.notifyListeners({ type, oldLevel: currentLevel, newLevel: currentLevel + actual });
        return actual;
    }

    getEffectValue(type: TalentType): number {
        this.ensureLoaded();
        const cached = this._effectCache.get(type);
        if (cached !== undefined) return cached;

        const cfg = TALENT_CONFIG[type];
        if (!cfg) return 0;
        const level = this.getLevel(type);
        const value = level * cfg.effectPerLevel;
        this._effectCache.set(type, value);
        return value;
    }

    getEffectPercent(type: TalentType): number {
        return 1 + this.getEffectValue(type);
    }

    getEffectValueWithHero(type: TalentType, heroType: HeroType): number {
        const baseValue = this.getEffectValue(type);
        const synergyBonus = getHeroTalentSynergyBonus(heroType, type);
        return baseValue * (1 + synergyBonus);
    }

    getEffectPercentWithHero(type: TalentType, heroType: HeroType): number {
        const baseValue = this.getEffectValue(type);
        const synergyBonus = getHeroTalentSynergyBonus(heroType, type);
        return 1 + baseValue * (1 + synergyBonus);
    }

    getAllEffectValues(): ReadonlyMap<TalentType, number> {
        this.ensureLoaded();
        for (const type of ALL_TALENT_TYPES) {
            if (!this._effectCache.has(type)) {
                const cfg = TALENT_CONFIG[type];
                const level = this.getLevel(type);
                this._effectCache.set(type, level * cfg.effectPerLevel);
            }
        }
        return this._effectCache;
    }

    getTotalSpentGold(): number {
        let total = 0;
        for (const type of ALL_TALENT_TYPES) {
            const cfg = TALENT_CONFIG[type];
            const level = this.getLevel(type);
            if (level > 0) {
                total += calcTotalSpentForLevel(cfg, level);
            }
        }
        return total;
    }

    getTotalLevel(): number {
        this.ensureLoaded();
        if (this._totalLevelCache >= 0) return this._totalLevelCache;
        let total = 0;
        for (const level of this._talentLevels.values()) {
            total += level;
        }
        this._totalLevelCache = total;
        return total;
    }

    getMaxTotalLevel(): number {
        return getMaxTotalLevel();
    }

    getTotalPoints(): number {
        return this.getTotalLevel();
    }

    getEarnedTalentPoints(): number {
        this.ensureLoaded();
        return Math.min(this._earnedTalentPoints, MAX_TOTAL_TALENT_POINTS);
    }

    addTalentPoints(count: number): number {
        this.ensureLoaded();
        if (count <= 0) return this._earnedTalentPoints;
        const before = this._earnedTalentPoints;
        this._earnedTalentPoints = Math.min(this._earnedTalentPoints + count, MAX_TOTAL_TALENT_POINTS);
        this.markSaveDirty();
        return this._earnedTalentPoints - before;
    }

    getMaxTotalPoints(): number {
        return this.getEarnedTalentPoints();
    }

    getRemainingTotalPoints(): number {
        return Math.max(0, this.getEarnedTalentPoints() - this.getTotalPoints());
    }

    isTotalPointsLimitReached(): boolean {
        return this.getTotalPoints() >= this.getEarnedTalentPoints();
    }

    getTalentState(type: TalentType): TalentState {
        return {
            level: this.getLevel(type),
            data: TALENT_CONFIG[type]
        };
    }

    getAllTalentStates(): TalentState[] {
        return ALL_TALENT_TYPES.map(type => this.getTalentState(type));
    }

    hasActiveTalents(): boolean {
        this.ensureLoaded();
        for (const level of this._talentLevels.values()) {
            if (level > 0) return true;
        }
        return false;
    }

    upgradeBatch(types: TalentType[], availableGold: number): { upgraded: TalentChangeEvent[]; spent: number } {
        const events: TalentChangeEvent[] = [];
        let remainingGold = availableGold;

        const MAX_ITERATIONS = 200;
        let iterations = 0;

        while (remainingGold > 0 && iterations < MAX_ITERATIONS) {
            iterations++;
            let bestType: TalentType | null = null;
            let bestCost = Infinity;

            for (let i = 0; i < types.length; i++) {
                const type = types[i];
                if (this.isMaxLevel(type) || !this.isPrerequisiteMet(type)) continue;
                const cost = this.getUpgradeCost(type);
                if (cost <= remainingGold && cost < bestCost) {
                    bestCost = cost;
                    bestType = type;
                }
            }

            if (bestType === null) break;

            const oldLevel = this.getLevel(bestType);
            const actual = this.upgradeCount(bestType, 1);
            if (actual > 0) {
                remainingGold -= bestCost;
                events.push({ type: bestType, oldLevel, newLevel: oldLevel + actual });
            }
        }

        return { upgraded: events, spent: availableGold - remainingGold };
    }

    getResetCount(): number {
        this.ensureLoaded();
        return this._resetCount;
    }

    getResetRefundRatio(): number {
        const decay = this._resetCount * RESET_REFUND_DECAY_PER_RESET;
        return Math.max(RESET_MIN_REFUND_RATIO, RESET_BASE_REFUND_RATIO - decay);
    }

    canReset(): boolean {
        if (this.getTotalLevel() === 0) return false;
        const now = Date.now() / 1000;
        if (this._resetCount <= RESET_MAX_FREE_COUNT) return true;
        return (now - this._lastResetTime) >= RESET_COOLDOWN_SECONDS;
    }

    getResetCooldownRemaining(): number {
        const now = Date.now() / 1000;
        if (this._resetCount <= RESET_MAX_FREE_COUNT) return 0;
        const elapsed = now - this._lastResetTime;
        return Math.max(0, RESET_COOLDOWN_SECONDS - elapsed);
    }

    resetAll(): number {
        if (!this.canReset()) return -1;
        const fullRefund = this.getTotalSpentGold();
        const refundRatio = this.getResetRefundRatio();
        const refund = Math.floor(fullRefund * refundRatio);
        const events: TalentChangeEvent[] = [];
        for (const type of ALL_TALENT_TYPES) {
            const oldLevel = this._talentLevels.get(type) || 0;
            if (oldLevel > 0) {
                this._talentLevels.set(type, 0);
                events.push({ type, oldLevel, newLevel: 0 });
            }
        }
        this._resetCount++;
        this._lastResetTime = Date.now() / 1000;
        this.invalidateCache();
        this.markSaveDirty();
        for (const event of events) {
            this.notifyListeners(event);
        }
        this.notifyBatchListeners(events);
        return refund;
    }

    getPresets(): TalentPreset[] {
        this.ensureLoaded();
        const raw = StorageUtil.getString(STORAGE_KEY_PRESETS);
        if (!raw) {
            const defaults: TalentPreset[] = [];
            for (let i = 0; i < MAX_PRESET_SLOTS; i++) {
                defaults.push({
                    name: PRESET_DEFAULT_NAMES[i] || `方案${i + 1}`,
                    levels: {},
                    totalLevel: 0,
                    totalCost: 0,
                    createdAt: 0,
                    updatedAt: 0,
                });
            }
            return defaults;
        }
        try {
            const presets: TalentPreset[] = JSON.parse(raw);
            for (let i = 0; i < MAX_PRESET_SLOTS; i++) {
                if (!presets[i]) {
                    presets[i] = {
                        name: PRESET_DEFAULT_NAMES[i] || `方案${i + 1}`,
                        levels: {},
                        totalLevel: 0,
                        totalCost: 0,
                        createdAt: 0,
                        updatedAt: 0,
                    };
                }
            }
            return presets.slice(0, MAX_PRESET_SLOTS);
        } catch (e) {
            console.warn('[TalentManager] getPresets: invalid data, using defaults');
            return [];
        }
    }

    savePreset(slotIndex: number, name: string): TalentPreset | null {
        if (slotIndex < 0 || slotIndex >= MAX_PRESET_SLOTS) return null;
        this.ensureLoaded();
        const presets = this.getPresets();
        const now = Date.now();
        const levels: Record<string, number> = {};
        let totalLevel = 0;
        let totalCost = 0;
        for (const type of ALL_TALENT_TYPES) {
            const level = this._talentLevels.get(type) || 0;
            if (level > 0) {
                levels[type] = level;
                totalLevel += level;
                totalCost += this.calculateCostForSlot(type, level);
            }
        }
        const preset: TalentPreset = {
            name: name || PRESET_DEFAULT_NAMES[slotIndex] || `方案${slotIndex + 1}`,
            levels,
            totalLevel,
            totalCost,
            createdAt: presets[slotIndex]?.createdAt || now,
            updatedAt: now,
        };
        presets[slotIndex] = preset;
        StorageUtil.setString(STORAGE_KEY_PRESETS, JSON.stringify(presets));
        return preset;
    }

    deletePreset(slotIndex: number): boolean {
        if (slotIndex < 0 || slotIndex >= MAX_PRESET_SLOTS) return false;
        const presets = this.getPresets();
        presets[slotIndex] = {
            name: PRESET_DEFAULT_NAMES[slotIndex] || `方案${slotIndex + 1}`,
            levels: {},
            totalLevel: 0,
            totalCost: 0,
            createdAt: 0,
            updatedAt: 0,
        };
        StorageUtil.setString(STORAGE_KEY_PRESETS, JSON.stringify(presets));
        return true;
    }

    renamePreset(slotIndex: number, name: string): boolean {
        if (slotIndex < 0 || slotIndex >= MAX_PRESET_SLOTS) return false;
        const presets = this.getPresets();
        if (!presets[slotIndex] || presets[slotIndex].totalLevel === 0) return false;
        presets[slotIndex].name = name;
        presets[slotIndex].updatedAt = Date.now();
        StorageUtil.setString(STORAGE_KEY_PRESETS, JSON.stringify(presets));
        return true;
    }

    applyPreset(slotIndex: number): boolean {
        if (slotIndex < 0 || slotIndex >= MAX_PRESET_SLOTS) return false;
        const presets = this.getPresets();
        const preset = presets[slotIndex];
        if (!preset || preset.totalLevel === 0) return false;
        this.ensureLoaded();
        const events: TalentChangeEvent[] = [];
        for (const type of ALL_TALENT_TYPES) {
            const oldLevel = this._talentLevels.get(type) || 0;
            const newLevel = preset.levels[type] || 0;
            if (oldLevel !== newLevel) {
                this._talentLevels.set(type, newLevel);
                events.push({ type, oldLevel, newLevel });
            }
        }
        this.invalidateCache();
        this.markSaveDirty();
        for (const event of events) {
            this.notifyListeners(event);
        }
        if (events.length > 0) {
            this.notifyBatchListeners(events);
        }
        return true;
    }

    private calculateCostForSlot(type: TalentType, level: number): number {
        const cfg = TALENT_CONFIG[type];
        if (!cfg) return 0;
        let total = 0;
        for (let i = 1; i <= level; i++) {
            total += cfg.baseCost + (i - 1) * cfg.costPerLevel;
        }
        return total;
    }
}