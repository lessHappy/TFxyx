import { OPEN_DATA_MSG, CLOUD_STORAGE_KEYS, RankType } from '../config/OpenDataConfig';
import { StorageUtil } from './StorageUtil';

export class OpenDataManager {
    private static instance: OpenDataManager;

    static get Instance(): OpenDataManager {
        if (!OpenDataManager.instance) {
            OpenDataManager.instance = new OpenDataManager();
        }
        return OpenDataManager.instance;
    }

    private _openDataContext: any = null;
    private _sharedCanvas: any = null;
    private _initialized: boolean = false;
    private _isShowing: boolean = false;

    init() {
        if (this._initialized) return;
        this._initialized = true;

        const wx = (window as any).wx;
        if (!wx) return;

        try {
            this._openDataContext = wx.getOpenDataContext();
            if (this._openDataContext) {
                this._sharedCanvas = this._openDataContext.canvas;
            }
        } catch (e) {
            console.warn("OpenDataContext init failed:", e);
        }
    }

    get isSupported(): boolean {
        return !!this._openDataContext;
    }

    get sharedCanvas(): any {
        return this._sharedCanvas;
    }

    get isShowing(): boolean {
        return this._isShowing;
    }

    private postMessage(data: any) {
        if (this._openDataContext) {
            this._openDataContext.postMessage(data);
        }
    }

    showFriendRank() {
        if (!this._openDataContext) return;
        this._isShowing = true;
        this.postMessage({
            type: OPEN_DATA_MSG.SHOW_RANK,
            rankType: RankType.FRIEND
        });
    }

    showGroupRank(shareTicket: string) {
        if (!this._openDataContext) return;
        this._isShowing = true;
        this.postMessage({
            type: OPEN_DATA_MSG.SHOW_RANK,
            rankType: RankType.GROUP,
            shareTicket: shareTicket
        });
    }

    hideRank() {
        if (!this._openDataContext) return;
        this._isShowing = false;
        this.postMessage({
            type: OPEN_DATA_MSG.HIDE_RANK
        });
    }

    refreshRank() {
        if (!this._openDataContext) return;
        this.postMessage({
            type: OPEN_DATA_MSG.REFRESH
        });
    }

    uploadScore(kill: number, time: number, gold: number, level: number) {
        const wx = (window as any).wx;
        if (!wx) return;

        const score = this.calculateScore(kill, time, gold);
        const kvDataList = [
            { key: CLOUD_STORAGE_KEYS.SCORE, value: String(score) },
            { key: CLOUD_STORAGE_KEYS.KILL, value: String(kill) },
            { key: CLOUD_STORAGE_KEYS.TIME, value: String(time) },
            { key: CLOUD_STORAGE_KEYS.GOLD, value: String(gold) },
            { key: CLOUD_STORAGE_KEYS.LEVEL, value: String(level) },
            { key: CLOUD_STORAGE_KEYS.UPDATE_TIME, value: String(Date.now()) }
        ];

        wx.setUserCloudStorage({
            KVDataList: kvDataList,
            success: () => {
                console.log("OpenData: score uploaded, score=", score);
            },
            fail: (err: any) => {
                console.warn("OpenData: upload failed", err);
            }
        });
    }

    private calculateScore(kill: number, time: number, gold: number): number {
        return kill * 10 + Math.floor(time) * 2 + gold;
    }

    getBestScore(): number {
        return StorageUtil.getNumber("sgzy_best_score", 0);
    }

    updateBestScore(kill: number, time: number, gold: number) {
        const score = this.calculateScore(kill, time, gold);
        const best = this.getBestScore();
        if (score > best) {
            StorageUtil.setNumber("sgzy_best_score", score);
        }
    }
}