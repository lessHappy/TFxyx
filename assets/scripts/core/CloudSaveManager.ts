import { CLOUD_SAVE_KEY, CLOUD_SAVE_KEYS, TALENT_KEY_PREFIX, TALENT_TYPES, SHARE_KEY_PREFIX, SHARE_COOLDOWN_PREFIX, SHARE_TYPES, CLOUD_CONFIG } from '../config/CloudSaveConfig';
import { StorageUtil } from './StorageUtil';

export class CloudSaveManager {
    private static instance: CloudSaveManager;

    static get Instance(): CloudSaveManager {
        if (!CloudSaveManager.instance) {
            CloudSaveManager.instance = new CloudSaveManager();
        }
        return CloudSaveManager.instance;
    }

    private _isSupported: boolean = false;
    private _lastSaveTime: number = 0;
    private _isSaving: boolean = false;
    private _autoSaveTimer: any = null;

    init() {
        const wx = (window as any).wx;
        this._isSupported = !!(wx && wx.setUserCloudStorage);
    }

    get isSupported(): boolean {
        return this._isSupported;
    }

    get lastSaveTime(): number {
        return this._lastSaveTime;
    }

    startAutoSave() {
        if (!this._isSupported) return;
        this.stopAutoSave();
        this._autoSaveTimer = setInterval(() => {
            this.saveToCloud();
        }, CLOUD_CONFIG.autoSaveInterval);
    }

    stopAutoSave() {
        if (this._autoSaveTimer) {
            clearInterval(this._autoSaveTimer);
            this._autoSaveTimer = null;
        }
    }

    collectSaveData(): Record<string, any> {
        const data: Record<string, any> = {};

        for (const key of CLOUD_SAVE_KEYS) {
            const value = StorageUtil.getRaw(key);
            if (value !== null && value !== undefined) {
                data[key] = value;
            }
        }

        for (const type of TALENT_TYPES) {
            const key = TALENT_KEY_PREFIX + type;
            const value = StorageUtil.getRaw(key);
            if (value !== null && value !== undefined) {
                data[key] = value;
            }
        }

        for (const type of SHARE_TYPES) {
            const countKey = SHARE_KEY_PREFIX + type;
            const countValue = StorageUtil.getRaw(countKey);
            if (countValue !== null && countValue !== undefined) {
                data[countKey] = countValue;
            }

            const cooldownKey = SHARE_COOLDOWN_PREFIX + type;
            const cooldownValue = StorageUtil.getRaw(cooldownKey);
            if (cooldownValue !== null && cooldownValue !== undefined) {
                data[cooldownKey] = cooldownValue;
            }
        }

        data["_save_timestamp"] = Date.now();
        return data;
    }

    saveToCloud(showToast: boolean = false): Promise<boolean> {
        return new Promise((resolve) => {
            const wx = (window as any).wx;
            if (!wx || !this._isSupported) {
                resolve(false);
                return;
            }

            if (this._isSaving) {
                resolve(false);
                return;
            }

            this._isSaving = true;
            const saveData = this.collectSaveData();
            const jsonStr = JSON.stringify(saveData);

            this.trySave(wx, jsonStr, CLOUD_CONFIG.retryCount, (success: boolean) => {
                this._isSaving = false;
                if (success) {
                    this._lastSaveTime = Date.now();
                    StorageUtil.setNumber("sgzy_cloud_save_time", this._lastSaveTime);
                    if (showToast && wx.showToast) {
                        wx.showToast({ title: "云存档保存成功" });
                    }
                } else {
                    if (showToast && wx.showToast) {
                        wx.showToast({ title: "云存档保存失败", icon: "none" });
                    }
                }
                resolve(success);
            });
        });
    }

    private trySave(wx: any, jsonStr: string, retries: number, callback: (success: boolean) => void) {
        wx.setUserCloudStorage({
            KVDataList: [{ key: CLOUD_SAVE_KEY, value: jsonStr }],
            success: () => {
                callback(true);
            },
            fail: (err: any) => {
                console.warn("CloudSave: save failed", err);
                if (retries > 0) {
                    setTimeout(() => {
                        this.trySave(wx, jsonStr, retries - 1, callback);
                    }, 1000);
                } else {
                    callback(false);
                }
            }
        });
    }

    loadFromCloud(): Promise<boolean> {
        return new Promise((resolve) => {
            const wx = (window as any).wx;
            if (!wx || !this._isSupported) {
                resolve(false);
                return;
            }

            wx.getUserCloudStorage({
                keyList: [CLOUD_SAVE_KEY],
                success: (res: any) => {
                    if (!res.KVDataList || res.KVDataList.length === 0) {
                        resolve(false);
                        return;
                    }

                    const kv = res.KVDataList[0];
                    if (!kv || !kv.value) {
                        resolve(false);
                        return;
                    }

                    try {
                        const data = JSON.parse(kv.value);
                        this.restoreData(data);
                        this._lastSaveTime = data["_save_timestamp"] || 0;
                        StorageUtil.setNumber("sgzy_cloud_save_time", this._lastSaveTime);
                        resolve(true);
                    } catch (e) {
                        console.warn("CloudSave: parse failed", e);
                        resolve(false);
                    }
                },
                fail: (err: any) => {
                    console.warn("CloudSave: load failed", err);
                    resolve(false);
                }
            });
        });
    }

    private restoreData(data: Record<string, any>) {
        for (const key of Object.keys(data)) {
            if (key === "_save_timestamp") continue;

            const value = data[key];
            if (value === null || value === undefined) continue;

            if (typeof value === "boolean") {
                StorageUtil.setBool(key, value);
            } else if (typeof value === "number") {
                StorageUtil.setNumber(key, value);
            } else if (typeof value === "string") {
                StorageUtil.setString(key, value);
            } else {
                StorageUtil.setObject(key, value);
            }
        }
    }

    deleteCloudSave(): Promise<boolean> {
        return new Promise((resolve) => {
            const wx = (window as any).wx;
            if (!wx || !this._isSupported) {
                resolve(false);
                return;
            }

            wx.removeUserCloudStorage({
                keyList: [CLOUD_SAVE_KEY],
                success: () => {
                    this._lastSaveTime = 0;
                    StorageUtil.setNumber("sgzy_cloud_save_time", 0);
                    resolve(true);
                },
                fail: () => {
                    resolve(false);
                }
            });
        });
    }

    getLocalSaveTime(): number {
        return StorageUtil.getNumber("sgzy_cloud_save_time", 0);
    }

    formatTime(timestamp: number): string {
        if (timestamp <= 0) return "无存档";
        const date = new Date(timestamp);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hour = date.getHours().toString().padStart(2, '0');
        const min = date.getMinutes().toString().padStart(2, '0');
        return `${month}月${day}日 ${hour}:${min}`;
    }
}