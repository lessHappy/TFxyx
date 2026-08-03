import { _decorator } from 'cc';
const { ccclass } = _decorator;

export interface HttpRequestOptions {
    url: string;
    method?: "GET" | "POST" | "PUT" | "DELETE";
    data?: Record<string, any>;
    headers?: Record<string, string>;
    timeout?: number;
}

export interface HttpResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    statusCode?: number;
}

@ccclass("NetworkManager")
export class NetworkManager {
    private static instance: NetworkManager;
    private _baseUrl: string = "";
    private _defaultTimeout: number = 10000;
    private _retryCount: number = 2;
    private _isWxEnv: boolean = false;

    static get Instance(): NetworkManager {
        if (!NetworkManager.instance) {
            NetworkManager.instance = new NetworkManager();
        }
        return NetworkManager.instance;
    }

    init(baseUrl?: string) {
        this._isWxEnv = !!(typeof window !== 'undefined' && (window as any).wx);
        if (baseUrl) {
            this._baseUrl = baseUrl;
        }
    }

    setBaseUrl(url: string) {
        this._baseUrl = url;
    }

    private getWx(): any {
        return (window as any).wx;
    }

    async request<T = any>(options: HttpRequestOptions): Promise<HttpResponse<T>> {
        const url = options.url.startsWith("http") ? options.url : this._baseUrl + options.url;
        const method = options.method || "GET";
        const timeout = options.timeout || this._defaultTimeout;

        if (this._isWxEnv) {
            return this.wxRequest<T>(url, method, options.data, options.headers, timeout);
        }
        return this.webRequest<T>(url, method, options.data, options.headers, timeout);
    }

    private wxRequest<T>(url: string, method: string, data?: Record<string, any>, headers?: Record<string, string>, timeout?: number): Promise<HttpResponse<T>> {
        return new Promise((resolve) => {
            const wx = this.getWx();
            if (!wx || !wx.request) {
                resolve({ success: false, error: "wx.request 不可用" });
                return;
            }
            wx.request({
                url,
                method,
                data,
                header: headers || { "content-type": "application/json" },
                timeout: timeout || this._defaultTimeout,
                success: (res: any) => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve({ success: true, data: res.data as T, statusCode: res.statusCode });
                    } else {
                        resolve({ success: false, error: `HTTP ${res.statusCode}`, statusCode: res.statusCode });
                    }
                },
                fail: (err: any) => {
                    resolve({ success: false, error: err.errMsg || "网络请求失败" });
                }
            });
        });
    }

    private async webRequest<T>(url: string, method: string, data?: Record<string, any>, headers?: Record<string, string>, timeout?: number): Promise<HttpResponse<T>> {
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), timeout || this._defaultTimeout);
            const fetchOptions: RequestInit = {
                method,
                headers: { "Content-Type": "application/json", ...headers },
                signal: controller.signal
            };
            if (method !== "GET" && data) {
                fetchOptions.body = JSON.stringify(data);
            }
            const getUrl = method === "GET" && data
                ? url + "?" + new URLSearchParams(data as any).toString()
                : url;
            const response = await fetch(getUrl, fetchOptions);
            clearTimeout(timer);
            if (response.ok) {
                const json = await response.json();
                return { success: true, data: json as T, statusCode: response.status };
            }
            return { success: false, error: `HTTP ${response.status}`, statusCode: response.status };
        } catch (e: any) {
            return { success: false, error: e.message || "网络请求失败" };
        }
    }

    async get<T = any>(url: string, data?: Record<string, any>): Promise<HttpResponse<T>> {
        return this.request<T>({ url, method: "GET", data });
    }

    async post<T = any>(url: string, data?: Record<string, any>): Promise<HttpResponse<T>> {
        return this.request<T>({ url, method: "POST", data });
    }

    async reportAntiCheat(data: Record<string, any>): Promise<void> {
        if (!this._baseUrl) return;
        try {
            await this.post("/api/anti-cheat", data);
        } catch (e) {
            // 静默上报，不阻塞游戏
        }
    }

    async reportAnalytics(event: string, params?: Record<string, any>): Promise<void> {
        if (!this._baseUrl) return;
        try {
            await this.post("/api/analytics", { event, params, timestamp: Date.now() });
        } catch (e) {
            // 静默上报
        }
    }

    async validateRedeemCode(code: string): Promise<HttpResponse<any>> {
        return this.post("/api/redeem/validate", { code });
    }
}