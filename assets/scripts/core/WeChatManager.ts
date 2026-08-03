import { _decorator } from 'cc';
const { ccclass } = _decorator;

export interface WeChatSystemInfo {
    brand: string;
    model: string;
    pixelRatio: number;
    screenWidth: number;
    screenHeight: number;
    windowWidth: number;
    windowHeight: number;
    statusBarHeight: number;
    language: string;
    version: string;
    system: string;
    platform: string;
    fontSizeSetting: number;
    SDKVersion: string;
    benchmarkLevel: number;
    batteryLevel: number;
}

@ccclass("WeChatManager")
export class WeChatManager {
    private static instance: WeChatManager;
    private _isWxEnv: boolean = false;
    private _systemInfo: WeChatSystemInfo | null = null;

    static get Instance(): WeChatManager {
        if (!WeChatManager.instance) {
            WeChatManager.instance = new WeChatManager();
        }
        return WeChatManager.instance;
    }

    init() {
        this._isWxEnv = !!(typeof window !== 'undefined' && (window as any).wx);
        if (this._isWxEnv) {
            this._systemInfo = this.getWx().getSystemInfoSync() as WeChatSystemInfo;
        }
    }

    get isWxEnv(): boolean {
        return this._isWxEnv;
    }

    get systemInfo(): WeChatSystemInfo | null {
        return this._systemInfo;
    }

    private getWx(): any {
        return (window as any).wx;
    }

    showToast(title: string, icon: "success" | "error" | "loading" | "none" = "none", duration: number = 2000) {
        if (!this._isWxEnv) {
            console.log(`[Toast] ${title}`);
            return;
        }
        try {
            this.getWx().showToast({ title, icon, duration });
        } catch (e) {
            // ignore
        }
    }

    showLoading(title: string = "加载中...", mask: boolean = true) {
        if (!this._isWxEnv) return;
        try {
            this.getWx().showLoading({ title, mask });
        } catch (e) {
            // ignore
        }
    }

    hideLoading() {
        if (!this._isWxEnv) return;
        try {
            this.getWx().hideLoading();
        } catch (e) {
            // ignore
        }
    }

    showModal(title: string, content: string): Promise<boolean> {
        return new Promise((resolve) => {
            if (!this._isWxEnv) {
                const confirmed = confirm(`${title}\n${content}`);
                resolve(confirmed);
                return;
            }
            try {
                this.getWx().showModal({
                    title,
                    content,
                    success: (res: { confirm: boolean }) => resolve(res.confirm),
                    fail: () => resolve(false)
                });
            } catch (e) {
                resolve(false);
            }
        });
    }

    shareAppMessage(title: string, query?: string, imageUrl?: string): Promise<boolean> {
        return new Promise((resolve) => {
            if (!this._isWxEnv) {
                console.log(`[Share] ${title}`);
                resolve(true);
                return;
            }
            try {
                this.getWx().shareAppMessage({
                    title,
                    query: query || "",
                    imageUrl: imageUrl || "",
                    success: () => resolve(true),
                    fail: () => resolve(false)
                });
            } catch (e) {
                resolve(false);
            }
        });
    }

    setClipboardData(text: string): Promise<boolean> {
        return new Promise((resolve) => {
            if (!this._isWxEnv) {
                navigator.clipboard?.writeText(text).then(() => resolve(true)).catch(() => resolve(false));
                return;
            }
            try {
                this.getWx().setClipboardData({
                    data: text,
                    success: () => resolve(true),
                    fail: () => resolve(false)
                });
            } catch (e) {
                resolve(false);
            }
        });
    }

    vibrateShort(type: "light" | "medium" | "heavy" = "light"): boolean {
        if (!this._isWxEnv) return false;
        try {
            this.getWx().vibrateShort({ type });
            return true;
        } catch (e) {
            return false;
        }
    }

    vibrateLong(): boolean {
        if (!this._isWxEnv) return false;
        try {
            this.getWx().vibrateLong();
            return true;
        } catch (e) {
            return false;
        }
    }

    getLaunchOptionsSync(): any {
        if (!this._isWxEnv) return null;
        try {
            return this.getWx().getLaunchOptionsSync();
        } catch (e) {
            return null;
        }
    }

    getEnterOptionsSync(): any {
        if (!this._isWxEnv) return null;
        try {
            return this.getWx().getEnterOptionsSync();
        } catch (e) {
            return null;
        }
    }

    onShow(callback: (res: any) => void) {
        if (!this._isWxEnv) return;
        try {
            this.getWx().onShow(callback);
        } catch (e) {
            // ignore
        }
    }

    onHide(callback: () => void) {
        if (!this._isWxEnv) return;
        try {
            this.getWx().onHide(callback);
        } catch (e) {
            // ignore
        }
    }

    getNetworkType(): Promise<string> {
        return new Promise((resolve) => {
            if (!this._isWxEnv) {
                resolve("unknown");
                return;
            }
            try {
                this.getWx().getNetworkType({
                    success: (res: { networkType: string }) => resolve(res.networkType),
                    fail: () => resolve("unknown")
                });
            } catch (e) {
                resolve("unknown");
            }
        });
    }

    isLowEndDevice(): boolean {
        if (!this._systemInfo) return false;
        return this._systemInfo.benchmarkLevel < 20;
    }
}