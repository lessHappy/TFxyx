import { _decorator } from 'cc';
import { HeroType, HERO_CONFIG, HeroData, HERO_MASTERY_CONFIG, HERO_MASTERY_REWARDS, HERO_MASTERY_MAX_LEVEL, HeroUnlockType, HERO_ALL_TYPES } from '../config/HeroConfig';
import { StorageUtil } from './StorageUtil';
import { EventManager } from './EventManager';

const STORAGE_KEY_HERO_DATA = "sgzy_hero_data";
const STORAGE_KEY_GOLD = "sgzy_gold";
const STORAGE_KEY_TOTAL_KILL = "sgzy_total_kill";
const STORAGE_KEY_BATTLE_TIME = "sgzy_total_battle_time";

const SAVE_DEBOUNCE_MS = 3000;

export interface HeroStats {
    heroType: HeroType;
    name: string;
    kills: number;
    mastery: number;
    games: number;
    bestKills: number;
    bestSurvive: number;
    avgSurvive: number;
    avgKills: number;
    isUnlocked: boolean;
}

interface HeroSaveData {
    selected: string;
    unlocked: string[];
    masteryExp: Record<string, number>;
    kills: Record<string, number>;
    maxSingleKill: Record<string, number>;
    gameCounts: Record<string, number>;
    bestSurvive: Record<string, number>;
    totalSurvive: Record<string, number>;
}

const DEFAULT_HERO = HeroType.ZHAO_YUN;

function validateHeroType(value: string): HeroType | null {
    if (Object.values(HeroType).includes(value as HeroType)) {
        return value as HeroType;
    }
    return null;
}

function loadMapFromRecord(data: Record<string, number> | undefined, map: Map<HeroType, number>) {
    if (!data) return;
    for (const key of Object.keys(data)) {
        const vt = validateHeroType(key);
        if (vt && typeof data[key] === 'number' && data[key] >= 0) {
            map.set(vt, data[key]);
        }
    }
}

@ccclass("HeroManager")
export class HeroManager {
    private static instance: HeroManager;

    static get Instance(): HeroManager {
        if (!HeroManager.instance) {
            HeroManager.instance = new HeroManager();
        }
        return HeroManager.instance;
    }

    private _selectedHero: HeroType = DEFAULT_HERO;
    private _selectedHeroData: HeroData = HERO_CONFIG[DEFAULT_HERO];
    private _unlockedHeroes: Set<HeroType> = new Set([DEFAULT_HERO]);
    private _loaded: boolean = false;
    private _dirty: boolean = false;
    private _saveTimerId: any = null;
    private _masteryExp: Map<HeroType, number> = new Map();
    private _heroKills: Map<HeroType, number> = new Map();
    private _heroMaxSingleKill: Map<HeroType, number> = new Map();

    private _masteryLevelCache: Map<HeroType, number> = new Map();
    private _masteryLevelDirty: Set<HeroType> = new Set();
    private _heroGameCounts: Map<HeroType, number> = new Map();
    private _heroBestSurvive: Map<HeroType, number> = new Map();
    private _heroTotalSurvive: Map<HeroType, number> = new Map();

    load() {
        if (this._loaded) return;

        const raw = StorageUtil.getString(STORAGE_KEY_HERO_DATA);
        let data: HeroSaveData | null = null;

        if (raw) {
            try {
                const parsed = JSON.parse(raw) as HeroSaveData;
                if (parsed && typeof parsed.selected === 'string' && Array.isArray(parsed.unlocked)) {
                    data = parsed;
                }
            } catch (e) {
                console.warn('[HeroManager] load: invalid save data, using defaults');
            }
        }

        if (data) {
            const validSelected = validateHeroType(data.selected);
            if (validSelected) {
                this._selectedHero = validSelected;
                this._selectedHeroData = HERO_CONFIG[validSelected];
            }

            this._unlockedHeroes = new Set([DEFAULT_HERO]);
            if (data.unlocked) {
                for (const t of data.unlocked) {
                    const vt = validateHeroType(t);
                    if (vt) this._unlockedHeroes.add(vt);
                }
            }

            loadMapFromRecord(data.masteryExp, this._masteryExp);
            loadMapFromRecord(data.kills, this._heroKills);
            loadMapFromRecord(data.maxSingleKill, this._heroMaxSingleKill);
            loadMapFromRecord(data.gameCounts, this._heroGameCounts);
            loadMapFromRecord(data.bestSurvive, this._heroBestSurvive);
            loadMapFromRecord(data.totalSurvive, this._heroTotalSurvive);
        }

        if (!this._unlockedHeroes.has(DEFAULT_HERO)) {
            this._unlockedHeroes.add(DEFAULT_HERO);
        }

        this._loaded = true;
        this._dirty = false;
    }

    private ensureLoaded() {
        if (!this._loaded) this.load();
    }

    private markDirty() {
        this._dirty = true;
    }

    private scheduleSave() {
        if (this._saveTimerId !== null) return;
        this._saveTimerId = setTimeout(() => {
            this._saveTimerId = null;
            this.save();
        }, SAVE_DEBOUNCE_MS);
    }

    save() {
        if (!this._dirty) return;
        if (this._saveTimerId !== null) {
            clearTimeout(this._saveTimerId);
            this._saveTimerId = null;
        }

        const data: HeroSaveData = {
            selected: this._selectedHero,
            unlocked: [...this._unlockedHeroes],
            masteryExp: this.mapToRecord(this._masteryExp),
            kills: this.mapToRecord(this._heroKills),
            maxSingleKill: this.mapToRecord(this._heroMaxSingleKill),
            gameCounts: this.mapToRecord(this._heroGameCounts),
            bestSurvive: this.mapToRecord(this._heroBestSurvive),
            totalSurvive: this.mapToRecord(this._heroTotalSurvive),
        };

        StorageUtil.setString(STORAGE_KEY_HERO_DATA, JSON.stringify(data));
        this._dirty = false;
    }

    flushSave() {
        this.save();
    }

    private mapToRecord(map: Map<HeroType, number>): Record<string, number> {
        const obj: Record<string, number> = {};
        map.forEach((value, key) => { obj[key] = value; });
        return obj;
    }

    getSelectedHero(): HeroType {
        this.ensureLoaded();
        return this._selectedHero;
    }

    getSelectedHeroData(): HeroData {
        this.ensureLoaded();
        return this._selectedHeroData;
    }

    getHeroDataByType(type: HeroType): HeroData | undefined {
        return HERO_CONFIG[type];
    }

    selectHero(type: HeroType): boolean {
        if (!this.isUnlocked(type)) return false;
        if (this._selectedHero === type) return true;
        this._selectedHero = type;
        this._selectedHeroData = HERO_CONFIG[type];
        this.markDirty();
        this.save();
        return true;
    }

    isUnlocked(type: HeroType): boolean {
        this.ensureLoaded();
        return this._unlockedHeroes.has(type);
    }

    unlock(type: HeroType): boolean {
        this.ensureLoaded();
        if (this._unlockedHeroes.has(type)) return false;
        this._unlockedHeroes.add(type);
        this.markDirty();
        this.save();
        EventManager.Instance.emit("HERO_UNLOCKED", type);
        return true;
    }

    getUnlockedHeroes(): HeroType[] {
        this.ensureLoaded();
        return [...this._unlockedHeroes];
    }

    getHeroData(type: HeroType): HeroData {
        return HERO_CONFIG[type];
    }

    getUnlockProgress(type: HeroType): { current: number; target: number; type: HeroUnlockType } {
        const cfg = HERO_CONFIG[type];
        let current = 0;
        switch (cfg.unlockType) {
            case "kill":
                current = StorageUtil.getNumber(STORAGE_KEY_TOTAL_KILL, 0);
                break;
            case "gold":
                current = StorageUtil.getNumber(STORAGE_KEY_GOLD, 0);
                break;
            case "survive":
                current = StorageUtil.getNumber(STORAGE_KEY_BATTLE_TIME, 0);
                break;
            default:
                break;
        }
        return {
            current,
            target: cfg.unlockValue,
            type: cfg.unlockType,
        };
    }

    checkAndUnlock(type: HeroType, currentValue: number): boolean {
        this.ensureLoaded();
        if (this._unlockedHeroes.has(type)) return false;
        const cfg = HERO_CONFIG[type];
        if (cfg.unlockType === "default" || cfg.unlockType === "ad") return false;
        if (currentValue >= cfg.unlockValue) {
            this._unlockedHeroes.add(type);
            this.markDirty();
            this.save();
            return true;
        }
        return false;
    }

    checkAllUnlockConditions(progressMap: Record<string, number>): HeroType[] {
        this.ensureLoaded();
        const unlocked: HeroType[] = [];
        for (const heroType of HERO_ALL_TYPES) {
            if (this._unlockedHeroes.has(heroType)) continue;
            const cfg = HERO_CONFIG[heroType];
            if (cfg.unlockType === "ad" || cfg.unlockType === "default") continue;
            const current = progressMap[cfg.unlockType] || 0;
            if (current >= cfg.unlockValue) {
                this._unlockedHeroes.add(heroType);
                unlocked.push(heroType);
            }
        }
        if (unlocked.length > 0) {
            this.markDirty();
            this.save();
            for (const ht of unlocked) {
                EventManager.Instance.emit("HERO_UNLOCKED", ht);
            }
        }
        return unlocked;
    }

    addMasteryExp(type: HeroType, exp: number) {
        this.ensureLoaded();
        const current = this._masteryExp.get(type) || 0;
        const oldLevel = this.getMasteryLevel(type);
        const newExp = current + exp;
        this._masteryExp.set(type, newExp);
        this._masteryLevelDirty.add(type);
        this.markDirty();
        this.scheduleSave();

        const newLevel = this.getMasteryLevel(type);
        if (newLevel > oldLevel) {
            const reward = HERO_MASTERY_REWARDS[newLevel] || 0;
            if (reward > 0) {
                const gold = StorageUtil.getNumber(STORAGE_KEY_GOLD, 0);
                StorageUtil.setNumber(STORAGE_KEY_GOLD, gold + reward);
            }
            EventManager.Instance.emit("HERO_MASTERY_UP", type, newLevel);
        }
    }

    getMasteryLevel(type: HeroType): number {
        if (!this._masteryLevelDirty.has(type)) {
            const cached = this._masteryLevelCache.get(type);
            if (cached !== undefined) return cached;
        }

        const exp = this._masteryExp.get(type) || 0;
        let level = 0;
        for (let i = HERO_MASTERY_CONFIG.length - 1; i >= 0; i--) {
            if (exp >= HERO_MASTERY_CONFIG[i].expRequired) {
                level = HERO_MASTERY_CONFIG[i].level;
                break;
            }
        }

        this._masteryLevelCache.set(type, level);
        this._masteryLevelDirty.delete(type);
        return level;
    }

    getMasteryData(type: HeroType) {
        const level = this.getMasteryLevel(type);
        const exp = this._masteryExp.get(type) || 0;
        const nextIdx = Math.min(level + 1, HERO_MASTERY_MAX_LEVEL);
        const nextExp = HERO_MASTERY_CONFIG[nextIdx].expRequired;
        return {
            level,
            name: HERO_MASTERY_CONFIG[level].name,
            bonus: HERO_MASTERY_CONFIG[level].bonus,
            exp,
            nextExp,
        };
    }

    getMasteryBonus(type: HeroType): { hp: number; damage: number } {
        const level = this.getMasteryLevel(type);
        return HERO_MASTERY_CONFIG[level].bonus;
    }

    addHeroKill(type: HeroType, count: number = 1) {
        this.ensureLoaded();
        const prev = this._heroKills.get(type) || 0;
        this._heroKills.set(type, prev + count);
        this.markDirty();
        this.scheduleSave();
    }

    recordHeroSingleGameKill(type: HeroType, kills: number) {
        this.ensureLoaded();
        const prev = this._heroMaxSingleKill.get(type) || 0;
        if (kills > prev) {
            this._heroMaxSingleKill.set(type, kills);
            this.markDirty();
            this.scheduleSave();
        }
    }

    getHeroTotalKills(type: HeroType): number {
        this.ensureLoaded();
        return this._heroKills.get(type) || 0;
    }

    getHeroMaxSingleKill(type: HeroType): number {
        this.ensureLoaded();
        return this._heroMaxSingleKill.get(type) || 0;
    }

    hasUnlockableHero(): boolean {
        this.ensureLoaded();
        for (const heroType of HERO_ALL_TYPES) {
            if (this._unlockedHeroes.has(heroType)) continue;
            const cfg = HERO_CONFIG[heroType];
            if (cfg.unlockType === "ad" || cfg.unlockType === "default") continue;
            let current = 0;
            switch (cfg.unlockType) {
                case "kill": current = StorageUtil.getNumber(STORAGE_KEY_TOTAL_KILL, 0); break;
                case "gold": current = StorageUtil.getNumber(STORAGE_KEY_GOLD, 0); break;
                case "survive": current = StorageUtil.getNumber(STORAGE_KEY_BATTLE_TIME, 0); break;
            }
            if (current >= cfg.unlockValue) return true;
        }
        return false;
    }

    getAllHeroStats(): HeroStats[] {
        this.ensureLoaded();
        const stats: HeroStats[] = [];
        for (const heroType of HERO_ALL_TYPES) {
            const data = HERO_CONFIG[heroType];
            const kills = this._heroKills.get(heroType) || 0;
            const mastery = this.getMasteryLevel(heroType);
            const games = this._heroGameCounts.get(heroType) || 0;
            const bestKills = this._heroMaxSingleKill.get(heroType) || 0;
            const bestSurvive = this._heroBestSurvive.get(heroType) || 0;
            const totalSurvive = this._heroTotalSurvive.get(heroType) || 0;
            stats.push({
                heroType,
                name: data.name,
                kills,
                mastery,
                games,
                bestKills,
                bestSurvive,
                avgSurvive: games > 0 ? Math.floor(totalSurvive / games) : 0,
                avgKills: games > 0 ? Math.floor(kills / games) : 0,
                isUnlocked: this._unlockedHeroes.has(heroType),
            });
        }
        return stats;
    }

    recordHeroGameResult(heroType: HeroType, kills: number, surviveTime: number) {
        this.ensureLoaded();
        const prevGames = this._heroGameCounts.get(heroType) || 0;
        this._heroGameCounts.set(heroType, prevGames + 1);

        if (!this._heroBestSurvive.has(heroType) || surviveTime > (this._heroBestSurvive.get(heroType) || 0)) {
            this._heroBestSurvive.set(heroType, surviveTime);
        }
        const prevTotalSurvive = this._heroTotalSurvive.get(heroType) || 0;
        this._heroTotalSurvive.set(heroType, prevTotalSurvive + surviveTime);

        this.markDirty();
        this.scheduleSave();
    }

    cleanup() {
        if (this._saveTimerId !== null) {
            clearTimeout(this._saveTimerId);
            this._saveTimerId = null;
        }
        this.flushSave();
    }
}