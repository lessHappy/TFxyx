import { _decorator } from 'cc';
import { HeroType, HERO_CONFIG, HeroData } from '../config/HeroConfig';
import { StorageUtil } from './StorageUtil';

const STORAGE_KEY_HERO = "sgzy_hero_selected";
const STORAGE_KEY_UNLOCKED = "sgzy_hero_unlocked";

@ccclass("HeroManager")
export class HeroManager {
    private static instance: HeroManager;

    static get Instance(): HeroManager {
        if (!HeroManager.instance) {
            HeroManager.instance = new HeroManager();
        }
        return HeroManager.instance;
    }

    private _selectedHero: HeroType = HeroType.ZHAO_YUN;
    private _unlockedHeroes: Set<HeroType> = new Set([HeroType.ZHAO_YUN]);
    private _loaded: boolean = false;

    load() {
        if (this._loaded) return;
        const selected = StorageUtil.getString(STORAGE_KEY_HERO);
        if (selected && Object.values(HeroType).includes(selected as HeroType)) {
            this._selectedHero = selected as HeroType;
        }
        const unlockedStr = StorageUtil.getString(STORAGE_KEY_UNLOCKED);
        if (unlockedStr) {
            try {
                const arr = JSON.parse(unlockedStr) as string[];
                this._unlockedHeroes = new Set(arr as HeroType[]);
            } catch (e) {
                this._unlockedHeroes = new Set([HeroType.ZHAO_YUN]);
            }
        }
        if (!this._unlockedHeroes.has(HeroType.ZHAO_YUN)) {
            this._unlockedHeroes.add(HeroType.ZHAO_YUN);
        }
        this._loaded = true;
    }

    private ensureLoaded() {
        if (!this._loaded) this.load();
    }

    private save() {
        StorageUtil.setString(STORAGE_KEY_HERO, this._selectedHero);
        StorageUtil.setString(STORAGE_KEY_UNLOCKED, JSON.stringify([...this._unlockedHeroes]));
    }

    getSelectedHero(): HeroType {
        this.ensureLoaded();
        return this._selectedHero;
    }

    getSelectedHeroData(): HeroData {
        return HERO_CONFIG[this.getSelectedHero()];
    }

    selectHero(type: HeroType) {
        if (!this.isUnlocked(type)) return false;
        this._selectedHero = type;
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
        this.save();
        return true;
    }

    getUnlockedHeroes(): HeroType[] {
        this.ensureLoaded();
        return [...this._unlockedHeroes];
    }

    getHeroData(type: HeroType): HeroData {
        return HERO_CONFIG[type];
    }

    checkAndUnlock(type: HeroType, currentValue: number): boolean {
        this.ensureLoaded();
        if (this._unlockedHeroes.has(type)) return false;
        const cfg = HERO_CONFIG[type];
        if (cfg.unlockType === "default") return false;
        if (currentValue >= cfg.unlockValue) {
            this._unlockedHeroes.add(type);
            this.save();
            return true;
        }
        return false;
    }

    getUnlockProgress(type: HeroType): { current: number; target: number; type: string } {
        const cfg = HERO_CONFIG[type];
        return {
            current: 0,
            target: cfg.unlockValue,
            type: cfg.unlockType
        };
    }
}