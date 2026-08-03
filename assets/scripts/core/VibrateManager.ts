import { _decorator } from 'cc';
import { StorageUtil } from './StorageUtil';
const { ccclass } = _decorator;

@ccclass("VibrateManager")
export class VibrateManager {
    private static instance: VibrateManager;
    private _enabled: boolean = true;

    static get Instance() {
        if (!VibrateManager.instance) VibrateManager.instance = new VibrateManager();
        return VibrateManager.instance;
    }

    init() {
        this._enabled = StorageUtil.getBool("vibrate", true);
    }

    get enabled(): boolean {
        return this._enabled;
    }

    setEnabled(value: boolean) {
        this._enabled = value;
        StorageUtil.setBool("vibrate", value);
    }

    private getWx(): any {
        return (window as any).wx;
    }

    short(type: "light" | "medium" | "heavy" = "light") {
        if (!this._enabled) return;
        try {
            const wx = this.getWx();
            if (wx && wx.vibrateShort) {
                wx.vibrateShort({ type });
            }
        } catch (e) {
            // ignore
        }
    }

    long() {
        if (!this._enabled) return;
        try {
            const wx = this.getWx();
            if (wx && wx.vibrateLong) {
                wx.vibrateLong();
            }
        } catch (e) {
            // ignore
        }
    }
}