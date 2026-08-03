import { _decorator } from 'cc';
import { NetworkManager } from './NetworkManager';
import { StorageUtil } from './StorageUtil';
const { ccclass } = _decorator;

export interface ConfigLoadResult {
    success: boolean;
    version: string;
    data?: Record<string, any>;
    error?: string;
}

@ccclass("ConfigManager")
export class ConfigManager {
    private static instance: ConfigManager;
    private _configCache: Map<string, any> = new Map();
    private _remoteUrl: string = "";
    private _localVersion: string = "1.0.0";
    private _loaded: boolean = false;

    static get Instance(): ConfigManager {
        if (!ConfigManager.instance) {
            ConfigManager.instance = new ConfigManager();
        }
        return ConfigManager.instance;
    }

    init(remoteUrl?: string) {
        if (remoteUrl) {
            this._remoteUrl = remoteUrl;
        }
        this._localVersion = StorageUtil.getString("config_version", "1.0.0");
    }

    get version(): string {
        return this._localVersion;
    }

    async loadRemoteConfig(): Promise<ConfigLoadResult> {
        if (!this._remoteUrl) {
            return { success: false, version: this._localVersion, error: "未配置远程地址" };
        }

        const response = await NetworkManager.Instance.get<{ version: string; config: Record<string, any> }>(
            this._remoteUrl,
            { localVersion: this._localVersion }
        );

        if (!response.success || !response.data) {
            return { success: false, version: this._localVersion, error: response.error || "加载失败" };
        }

        const { version, config } = response.data;
        if (config) {
            for (const key of Object.keys(config)) {
                this._configCache.set(key, config[key]);
            }
            StorageUtil.setString("config_version", version);
            StorageUtil.setObject("config_cache", config);
            this._localVersion = version;
        }

        this._loaded = true;
        return { success: true, version: this._localVersion, data: config };
    }

    loadLocalCache() {
        const cached = StorageUtil.getObject("config_cache", null);
        if (cached) {
            for (const key of Object.keys(cached)) {
                this._configCache.set(key, cached[key]);
            }
        }
        this._loaded = true;
    }

    get<T = any>(key: string, defaultValue?: T): T {
        if (this._configCache.has(key)) {
            return this._configCache.get(key) as T;
        }
        return defaultValue as T;
    }

    set(key: string, value: any) {
        this._configCache.set(key, value);
    }

    getNumber(key: string, defaultValue: number = 0): number {
        const value = this.get(key);
        return value !== undefined ? Number(value) : defaultValue;
    }

    getString(key: string, defaultValue: string = ""): string {
        const value = this.get(key);
        return value !== undefined ? String(value) : defaultValue;
    }

    getBool(key: string, defaultValue: boolean = false): boolean {
        const value = this.get(key);
        if (value === undefined) return defaultValue;
        if (typeof value === "boolean") return value;
        if (typeof value === "number") return value !== 0;
        if (typeof value === "string") return value === "true" || value === "1";
        return defaultValue;
    }

    hasKey(key: string): boolean {
        return this._configCache.has(key);
    }

    clear() {
        this._configCache.clear();
        this._loaded = false;
    }
}