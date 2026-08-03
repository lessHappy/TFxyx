import { _decorator } from 'cc';
const { ccclass } = _decorator;

@ccclass("UpdateManager")
export class UpdateManager {
    private static instance: UpdateManager;
    private _hasUpdate: boolean = false;

    static get Instance() {
        if (!UpdateManager.instance) UpdateManager.instance = new UpdateManager();
        return UpdateManager.instance;
    }

    get hasUpdate(): boolean {
        return this._hasUpdate;
    }

    private getWx(): any {
        return (window as any).wx;
    }

    checkUpdate(onUpdateReady?: () => void, onUpdateFailed?: () => void) {
        const wx = this.getWx();
        if (!wx || !wx.getUpdateManager) {
            console.log("[UpdateManager] 非微信环境，跳过更新检查");
            return;
        }

        const updateManager = wx.getUpdateManager();

        updateManager.onCheckForUpdate((res: { hasUpdate: boolean }) => {
            console.log("[UpdateManager] 检查更新结果:", res.hasUpdate);
            if (res.hasUpdate) {
                this._hasUpdate = true;
            }
        });

        updateManager.onUpdateReady(() => {
            console.log("[UpdateManager] 新版本已就绪，提示用户重启");
            wx.showModal({
                title: "更新提示",
                content: "新版本已就绪，是否重启应用？",
                success: (modalRes: { confirm: boolean }) => {
                    if (modalRes.confirm) {
                        updateManager.applyUpdate();
                    }
                }
            });
            if (onUpdateReady) onUpdateReady();
        });

        updateManager.onUpdateFailed(() => {
            console.warn("[UpdateManager] 新版本下载失败");
            if (onUpdateFailed) onUpdateFailed();
        });
    }
}