import { _decorator } from 'cc';
import { TalentType, TALENT_CONFIG, TalentData } from '../config/TalentConfig';
import { StorageUtil } from './StorageUtil';
const { ccclass } = _decorator;

const STORAGE_PREFIX = "talent_";

export interface TalentState {
    level: number;
    data: TalentData;
}

@ccclass("TalentManager")
export class TalentManager {
    private static instance: TalentManager;

    static get Instance(): TalentManager {
        if (!TalentManager.instance) {
            TalentManager.instance = new TalentManager();
        }
        return TalentManager.instance;
    }

    private _talentLevels: Map<TalentType, number> = new Map();
    private _effectCache: Map<TalentType, number> = new Map();
    private _loaded: boolean = false;

    private invalidateCache() {
        this._effectCache.clear();
    }

    load() {
        if (this._loaded) return;
        for (const type of Object.values(TalentType)) {
            const level = StorageUtil.getNumber(STORAGE_PREFIX + type, 0);
            this._talentLevels.set(type, level);
        }
        this._loaded = true;
    }

    private ensureLoaded() {
        if (!this._loaded) this.load();
    }

    save() {
        for (const [type, level] of this._talentLevels) {
            StorageUtil.setNumber(STORAGE_PREFIX + type, level);
        }
    }

    getLevel(type: TalentType): number {
        this.ensureLoaded();
        return this._talentLevels.get(type) || 0;
    }

    getUpgradeCost(type: TalentType): number {
        const cfg = TALENT_CONFIG[type];
        if (!cfg) return 0;
        const currentLevel = this.getLevel(type);
        if (currentLevel >= cfg.maxLevel) return 0;
        return cfg.baseCost + currentLevel * cfg.costPerLevel;
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
        const reqLevel = cfg.prerequisite.level;
        const currentLevel = this.getLevel(cfg.prerequisite.type);
        return currentLevel >= reqLevel;
    }

    getPrerequisiteDesc(type: TalentType): string {
        const cfg = TALENT_CONFIG[type];
        if (!cfg || !cfg.prerequisite) return "";
        const reqCfg = TALENT_CONFIG[cfg.prerequisite.type];
        return `${reqCfg.name} Lv.${cfg.prerequisite.level}`;
    }

    upgrade(type: TalentType): boolean {
        const cfg = TALENT_CONFIG[type];
        if (!cfg) return false;
        if (this.isMaxLevel(type)) return false;

        const currentLevel = this.getLevel(type);
        this._talentLevels.set(type, currentLevel + 1);
        this.invalidateCache();
        this.save();
        return true;
    }

    getEffectValue(type: TalentType): number {
        this.ensureLoaded();
        if (this._effectCache.has(type)) {
            return this._effectCache.get(type)!;
        }
        const cfg = TALENT_CONFIG[type];
        if (!cfg) return 0;
        const level = this.getLevel(type);
        const value = level * cfg.effectPerLevel;
        this._effectCache.set(type, value);
        return value;
    }

    getEffectPercent(type: TalentType): number {
        this.ensureLoaded();
        return 1 + this.getEffectValue(type);
    }

    getTotalSpentGold(): number {
        let total = 0;
        for (const type of Object.values(TalentType)) {
            const cfg = TALENT_CONFIG[type];
            const level = this.getLevel(type);
            for (let i = 0; i < level; i++) {
                total += cfg.baseCost + i * cfg.costPerLevel;
            }
        }
        return total;
    }

    getTotalLevel(): number {
        this.ensureLoaded();
        let total = 0;
        for (const level of this._talentLevels.values()) {
            total += level;
        }
        return total;
    }

    getMaxTotalLevel(): number {
        let total = 0;
        for (const cfg of Object.values(TALENT_CONFIG)) {
            total += cfg.maxLevel;
        }
        return total;
    }

    getTalentState(type: TalentType): TalentState {
        return {
            level: this.getLevel(type),
            data: TALENT_CONFIG[type]
        };
    }

    getAllTalentStates(): TalentState[] {
        return Object.values(TalentType).map(type => this.getTalentState(type));
    }

    resetAll() {
        for (const type of Object.values(TalentType)) {
            this._talentLevels.set(type, 0);
        }
        this.invalidateCache();
        this.save();
    }
}