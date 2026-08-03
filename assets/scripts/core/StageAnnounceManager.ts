import { StageData, STAGE_LIST, STAGE_STORAGE_KEYS } from '../config/StageAnnounceConfig';
import { StorageUtil } from './StorageUtil';

export class StageAnnounceManager {
    private static instance: StageAnnounceManager;

    static get Instance(): StageAnnounceManager {
        if (!StageAnnounceManager.instance) {
            StageAnnounceManager.instance = new StageAnnounceManager();
        }
        return StageAnnounceManager.instance;
    }

    private _currentStage: number = 1;
    private _loaded: boolean = false;

    load() {
        if (this._loaded) return;
        this._loaded = true;
        this._currentStage = StorageUtil.getNumber(STAGE_STORAGE_KEYS.CURRENT_STAGE, 1);
        this.checkUnlock();
    }

    private ensureLoaded() {
        if (!this._loaded) this.load();
    }

    getCurrentStage(): number {
        this.ensureLoaded();
        return this._currentStage;
    }

    getCurrentStageData(): StageData {
        return this.getStageData(this._currentStage);
    }

    getStageData(stageId: number): StageData {
        const data = STAGE_LIST.find(s => s.id === stageId);
        return data || STAGE_LIST[0];
    }

    setCurrentStage(stageId: number) {
        this.ensureLoaded();
        if (stageId < 1 || stageId > STAGE_LIST.length) return;
        if (!this.isStageUnlocked(stageId)) return;
        this._currentStage = stageId;
        StorageUtil.setNumber(STAGE_STORAGE_KEYS.CURRENT_STAGE, stageId);
    }

    isStageUnlocked(stageId: number): boolean {
        const stage = this.getStageData(stageId);
        if (!stage) return false;

        if (stage.unlockKillCount <= 0 && stage.unlockGold <= 0) return true;

        const unlockedStages = StorageUtil.getObject(STAGE_STORAGE_KEYS.UNLOCKED_STAGES, [1]);
        if (unlockedStages.indexOf(stageId) !== -1) return true;

        const totalKill = StorageUtil.getNumber("sgzy_total_kill", 0);
        const gold = StorageUtil.getNumber("sgzy_gold", 0);

        return totalKill >= stage.unlockKillCount && gold >= stage.unlockGold;
    }

    unlockStage(stageId: number): boolean {
        const stage = this.getStageData(stageId);
        if (!stage) return false;

        const totalKill = StorageUtil.getNumber("sgzy_total_kill", 0);
        const gold = StorageUtil.getNumber("sgzy_gold", 0);

        if (totalKill < stage.unlockKillCount) return false;
        if (gold < stage.unlockGold) return false;

        const unlockedStages = StorageUtil.getObject(STAGE_STORAGE_KEYS.UNLOCKED_STAGES, [1]);
        if (unlockedStages.indexOf(stageId) !== -1) return true;

        if (stage.unlockGold > 0) {
            StorageUtil.setNumber("sgzy_gold", gold - stage.unlockGold);
        }

        unlockedStages.push(stageId);
        StorageUtil.setObject(STAGE_STORAGE_KEYS.UNLOCKED_STAGES, unlockedStages);

        const highestStage = StorageUtil.getNumber(STAGE_STORAGE_KEYS.HIGHEST_STAGE, 1);
        if (stageId > highestStage) {
            StorageUtil.setNumber(STAGE_STORAGE_KEYS.HIGHEST_STAGE, stageId);
        }

        return true;
    }

    checkUnlock() {
        if (this._loaded) return;
        for (const stage of STAGE_LIST) {
            if (stage.id === 1) continue;
            const totalKill = StorageUtil.getNumber("sgzy_total_kill", 0);
            const gold = StorageUtil.getNumber("sgzy_gold", 0);
            if (totalKill >= stage.unlockKillCount && gold >= stage.unlockGold) {
                const unlockedStages = StorageUtil.getObject(STAGE_STORAGE_KEYS.UNLOCKED_STAGES, [1]);
                if (unlockedStages.indexOf(stage.id) === -1) {
                    unlockedStages.push(stage.id);
                    StorageUtil.setObject(STAGE_STORAGE_KEYS.UNLOCKED_STAGES, unlockedStages);
                }
            }
        }
    }

    getUnlockedStages(): number[] {
        this.ensureLoaded();
        return StorageUtil.getObject(STAGE_STORAGE_KEYS.UNLOCKED_STAGES, [1]);
    }

    getHighestStage(): number {
        this.ensureLoaded();
        return StorageUtil.getNumber(STAGE_STORAGE_KEYS.HIGHEST_STAGE, 1);
    }

    getAllStages(): StageData[] {
        return STAGE_LIST;
    }
}