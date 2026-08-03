export class StorageUtil {
    private static getWx(): any {
        return (window as any).wx;
    }

    static setNumber(key: string, value: number) {
        try {
            const wx = this.getWx();
            if (wx) {
                wx.setStorageSync(key, value);
            } else {
                localStorage.setItem(key, String(value));
            }
        } catch (e) {
            console.warn(`StorageUtil.setNumber failed: ${key}`, e);
        }
    }
    static getNumber(key: string, defaultValue: number = 0): number {
        try {
            let res: any;
            const wx = this.getWx();
            if (wx) {
                res = wx.getStorageSync(key);
            } else {
                res = localStorage.getItem(key);
            }
            if (res === "" || res === null || res === undefined) return defaultValue;
            return Number(res);
        } catch (e) {
            console.warn(`StorageUtil.getNumber failed: ${key}`, e);
            return defaultValue;
        }
    }

    static setBool(key: string, value: boolean) {
        this.setNumber(key, value ? 1 : 0);
    }
    static getBool(key: string, defaultValue: boolean = false): boolean {
        const num = this.getNumber(key, defaultValue ? 1 : 0);
        return num === 1;
    }

    static setString(key: string, str: string) {
        try {
            const wx = this.getWx();
            if (wx) wx.setStorageSync(key, str);
            else localStorage.setItem(key, str);
        } catch (e) {
            console.warn(`StorageUtil.setString failed: ${key}`, e);
        }
    }
    static getString(key: string, def = ""): string {
        try {
            const wx = this.getWx();
            const val = wx ? wx.getStorageSync(key) : localStorage.getItem(key);
            return val ?? def;
        } catch (e) {
            console.warn(`StorageUtil.getString failed: ${key}`, e);
            return def;
        }
    }

    static setObject<T>(key: string, obj: T) {
        this.setString(key, JSON.stringify(obj));
    }
    static getObject<T>(key: string, defaultObj: T): T {
        const str = this.getString(key);
        try {
            return JSON.parse(str) as T;
        } catch {
            return defaultObj;
        }
    }

    static remove(key: string) {
        try {
            const wx = this.getWx();
            if (wx) {
                wx.removeStorageSync(key);
            } else {
                localStorage.removeItem(key);
            }
        } catch (e) {
            console.warn(`StorageUtil.remove failed: ${key}`, e);
        }
    }

    static getRaw(key: string): any {
        try {
            const wx = this.getWx();
            if (wx) {
                const val = wx.getStorageSync(key);
                if (val === "" || val === null || val === undefined) return null;
                try {
                    return JSON.parse(val);
                } catch {
                    return val;
                }
            } else {
                const val = localStorage.getItem(key);
                if (val === null) return null;
                try {
                    return JSON.parse(val);
                } catch {
                    const num = Number(val);
                    return isNaN(num) ? val : num;
                }
            }
        } catch (e) {
            console.warn(`StorageUtil.getRaw failed: ${key}`, e);
            return null;
        }
    }
}