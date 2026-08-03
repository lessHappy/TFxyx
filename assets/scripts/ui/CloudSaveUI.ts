import { _decorator, Component, Node, Label, Button, UIOpacity, tween, Color } from 'cc';
import { CloudSaveManager } from '../core/CloudSaveManager';
import { AudioManager } from '../core/AudioManager';
const { ccclass, property } = _decorator;

@ccclass("CloudSaveUI")
export class CloudSaveUI extends Component {
    @property(Node) panel: Node = null!;
    @property(Label) labTitle: Label = null!;
    @property(Label) labCloudTime: Label = null!;
    @property(Label) labLocalTime: Label = null!;
    @property(Label) labStatus: Label = null!;
    @property(Button) btnUpload: Button = null!;
    @property(Button) btnDownload: Button = null!;
    @property(Button) btnDelete: Button = null!;
    @property(Button) btnClose: Button = null!;

    private _isShow: boolean = false;
    private _isOperating: boolean = false;

    onLoad() {
        if (this.panel) {
            this.panel.active = false;
        }

        if (this.btnClose) {
            this.btnClose.node.on(Button.Event.CLICK, this.hide, this);
        }
        if (this.btnUpload) {
            this.btnUpload.node.on(Button.Event.CLICK, this.onUpload, this);
        }
        if (this.btnDownload) {
            this.btnDownload.node.on(Button.Event.CLICK, this.onDownload, this);
        }
        if (this.btnDelete) {
            this.btnDelete.node.on(Button.Event.CLICK, this.onDelete, this);
        }
    }

    show() {
        if (this._isShow) return;
        this._isShow = true;
        this.refreshInfo();
        this.playShowAnimation();
    }

    hide() {
        if (!this._isShow) return;
        this._isShow = false;
        this.playHideAnimation();
    }

    private refreshInfo() {
        const cloudTime = CloudSaveManager.Instance.getLocalSaveTime();
        const wx = (window as any).wx;

        if (this.labCloudTime) {
            this.labCloudTime.string = CloudSaveManager.Instance.formatTime(cloudTime);
        }

        if (this.labLocalTime) {
            const now = Date.now();
            this.labLocalTime.string = CloudSaveManager.Instance.formatTime(now);
        }

        if (this.labStatus) {
            if (!CloudSaveManager.Instance.isSupported) {
                this.labStatus.string = "当前环境不支持云存档";
                this.labStatus.color = new Color(255, 100, 100, 255);
            } else {
                this.labStatus.string = "云存档就绪";
                this.labStatus.color = new Color(100, 255, 100, 255);
            }
        }

        if (this.btnUpload) this.btnUpload.interactable = CloudSaveManager.Instance.isSupported && !this._isOperating;
        if (this.btnDownload) this.btnDownload.interactable = CloudSaveManager.Instance.isSupported && !this._isOperating;
        if (this.btnDelete) this.btnDelete.interactable = CloudSaveManager.Instance.isSupported && cloudTime > 0 && !this._isOperating;
    }

    private async onUpload() {
        if (this._isOperating) return;
        this._isOperating = true;
        this.refreshInfo();

        AudioManager.Instance.playSfx("audio/sfx/select");
        if (this.labStatus) this.labStatus.string = "正在上传...";

        await CloudSaveManager.Instance.saveToCloud(true);

        this._isOperating = false;
        this.refreshInfo();
    }

    private async onDownload() {
        if (this._isOperating) return;
        this._isOperating = true;
        this.refreshInfo();

        const wx = (window as any).wx;
        if (wx) {
            wx.showModal({
                title: "下载云存档",
                content: "下载云存档会覆盖当前本地进度，确定继续吗？",
                success: async (res: any) => {
                    if (res.confirm) {
                        AudioManager.Instance.playSfx("audio/sfx/select");
                        if (this.labStatus) this.labStatus.string = "正在下载...";

                        const success = await CloudSaveManager.Instance.loadFromCloud();
                        if (success) {
                            if (wx.showToast) wx.showToast({ title: "云存档下载成功，即将重启" });
                            this.scheduleOnce(() => {
                                const wxRestart = (window as any).wx;
                                if (wxRestart && wxRestart.restartMiniProgram) {
                                    wxRestart.restartMiniProgram({});
                                }
                            }, 1.5);
                        } else {
                            if (wx.showToast) wx.showToast({ title: "下载失败，请重试", icon: "none" });
                        }
                    }
                    this._isOperating = false;
                    this.refreshInfo();
                },
                fail: () => {
                    this._isOperating = false;
                    this.refreshInfo();
                }
            });
        }
    }

    private async onDelete() {
        if (this._isOperating) return;
        this._isOperating = true;
        this.refreshInfo();

        const wx = (window as any).wx;
        if (wx) {
            wx.showModal({
                title: "删除云存档",
                content: "删除后无法恢复，确定要删除云存档吗？",
                success: async (res: any) => {
                    if (res.confirm) {
                        AudioManager.Instance.playSfx("audio/sfx/select");
                        await CloudSaveManager.Instance.deleteCloudSave();
                        if (wx.showToast) wx.showToast({ title: "云存档已删除" });
                    }
                    this._isOperating = false;
                    this.refreshInfo();
                },
                fail: () => {
                    this._isOperating = false;
                    this.refreshInfo();
                }
            });
        }
    }

    private playShowAnimation() {
        if (!this.panel) return;
        this.panel.active = true;
        const opacity = this.panel.getComponent(UIOpacity);
        if (opacity) {
            opacity.opacity = 0;
            tween(opacity).to(0.25, { opacity: 255 }).start();
        }
    }

    private playHideAnimation() {
        if (!this.panel) return;
        const opacity = this.panel.getComponent(UIOpacity);
        if (opacity) {
            tween(opacity).to(0.2, { opacity: 0 }).call(() => {
                this.panel.active = false;
            }).start();
        } else {
            this.panel.active = false;
        }
    }
}