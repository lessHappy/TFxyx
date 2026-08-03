import { _decorator, resources, assetManager, Asset, Prefab, SpriteFrame, AudioClip, SpriteAtlas, JsonAsset, Texture2D, AssetManager } from 'cc';
const { ccclass } = _decorator;

export interface LoadTask {
    path: string;
    type: typeof Asset;
    onProgress?: (finished: number, total: number) => void;
}

@ccclass("ResourcesManager")
export class ResourcesManager {
    private static instance: ResourcesManager;
    private _assetCache: Map<string, Asset> = new Map();
    private _loadingMap: Map<string, Promise<Asset>> = new Map();
    private _debug: boolean = false;

    static get Instance(): ResourcesManager {
        if (!ResourcesManager.instance) {
            ResourcesManager.instance = new ResourcesManager();
        }
        return ResourcesManager.instance;
    }

    setDebug(enabled: boolean) {
        this._debug = enabled;
    }

    private log(msg: string) {
        if (this._debug) {
            console.log(`[ResourcesManager] ${msg}`);
        }
    }

    async loadPrefab(path: string, cache: boolean = true): Promise<Prefab | null> {
        return this.loadAsset<Prefab>(path, Prefab, cache);
    }

    async loadSpriteFrame(path: string, cache: boolean = true): Promise<SpriteFrame | null> {
        return this.loadAsset<SpriteFrame>(path, SpriteFrame, cache);
    }

    async loadAudioClip(path: string, cache: boolean = true): Promise<AudioClip | null> {
        return this.loadAsset<AudioClip>(path, AudioClip, cache);
    }

    async loadTexture2D(path: string, cache: boolean = true): Promise<Texture2D | null> {
        return this.loadAsset<Texture2D>(path, Texture2D, cache);
    }

    async loadJsonAsset(path: string, cache: boolean = true): Promise<JsonAsset | null> {
        return this.loadAsset<JsonAsset>(path, JsonAsset, cache);
    }

    async loadSpriteAtlas(path: string, cache: boolean = true): Promise<SpriteAtlas | null> {
        return this.loadAsset<SpriteAtlas>(path, SpriteAtlas, cache);
    }

    private async loadAsset<T extends Asset>(path: string, type: new (...args: any[]) => T, cache: boolean = true): Promise<T | null> {
        if (cache && this._assetCache.has(path)) {
            this.log(`命中缓存: ${path}`);
            return this._assetCache.get(path) as T;
        }

        if (this._loadingMap.has(path)) {
            this.log(`等待加载中: ${path}`);
            return this._loadingMap.get(path) as Promise<T>;
        }

        const promise = new Promise<T>((resolve) => {
            resources.load(path, type, (err, asset) => {
                if (err) {
                    console.error(`[ResourcesManager] 加载失败: ${path}`, err);
                    this._loadingMap.delete(path);
                    resolve(null as any);
                    return;
                }
                if (cache && asset) {
                    this._assetCache.set(path, asset);
                }
                this._loadingMap.delete(path);
                this.log(`加载成功: ${path}`);
                resolve(asset);
            });
        });

        this._loadingMap.set(path, promise as Promise<Asset>);
        return promise;
    }

    async preloadAssets(tasks: LoadTask[]): Promise<{ success: number; failed: number }> {
        let success = 0;
        let failed = 0;
        const total = tasks.length;

        for (let i = 0; i < total; i++) {
            const task = tasks[i];
            const asset = await this.loadAsset(task.path, task.type, true);
            if (asset) {
                success++;
            } else {
                failed++;
            }
            if (task.onProgress) {
                task.onProgress(success + failed, total);
            }
        }

        return { success, failed };
    }

    async loadBundle(bundleName: string): Promise<AssetManager.Bundle | null> {
        return new Promise((resolve) => {
            assetManager.loadBundle(bundleName, (err, bundle) => {
                if (err) {
                    console.error(`[ResourcesManager] 加载Bundle失败: ${bundleName}`, err);
                    resolve(null);
                    return;
                }
                resolve(bundle);
            });
        });
    }

    releaseAsset(path: string) {
        if (this._assetCache.has(path)) {
            const asset = this._assetCache.get(path)!;
            asset.decRef();
            this._assetCache.delete(path);
            this.log(`释放资源: ${path}`);
        }
    }

    releaseAll() {
        for (const [path, asset] of this._assetCache) {
            asset.decRef();
        }
        this._assetCache.clear();
        this._loadingMap.clear();
        this.log("释放全部资源");
    }

    getCacheSize(): number {
        return this._assetCache.size;
    }

    hasCache(path: string): boolean {
        return this._assetCache.has(path);
    }
}