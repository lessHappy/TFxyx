import { _decorator, Component, Node, Label, Slider, Toggle, Button, UIOpacity, tween } from 'cc';
import { AudioManager, BGM_PATH } from '../core/AudioManager';
import { StorageUtil } from '../core/StorageUtil';
import { CloudSaveManager } from '../core/CloudSaveManager';
import { VibrateManager } from '../core/VibrateManager';
const { ccclass, property } = _decorator;

@ccclass("SettingsUI")
export class SettingsUI extends Component {
    @property(Node) panel: Node = null!;
    @property(Label) labTitle: Label = null!;

    @property(Slider) bgmSlider: Slider = null!;
    @property(Label) labBgmValue: Label = null!;
    @property(Slider) sfxSlider: Slider = null!;
    @property(Label) labSfxValue: Label = null!;

    @property(Toggle) vibrateToggle: Toggle = null!;
    @property(Button) btnClearCache: Button = null!;
    @property(Button) btnCustomerService: Button = null!;
    @property(Button) btnCloudSave: Button = null!;
    @property(Button) btnPrivacy: Button = null!;
    @property(Button) btnClose: Button = null!;

    private _isShow: boolean = false;

    onLoad() {
        if (this.panel) {
            this.panel.active = false;
        }

        if (this.btnClose) {
            this.btnClose.node.on(Button.Event.CLICK, this.hide, this);
        }

        if (this.bgmSlider) {
            this.bgmSlider.node.on("slide", this.onBgmSlider, this);
        }
        if (this.sfxSlider) {
            this.sfxSlider.node.on("slide", this.onSfxSlider, this);
        }

        if (this.vibrateToggle) {
            this.vibrateToggle.node.on("toggle", this.onVibrateToggle, this);
        }

        if (this.btnClearCache) {
            this.btnClearCache.node.on(Button.Event.CLICK, this.onClearCache, this);
        }

        if (this.btnCustomerService) {
            this.btnCustomerService.node.on(Button.Event.CLICK, this.onOpenCustomerService, this);
        }
        if (this.btnCloudSave) {
            this.btnCloudSave.node.on(Button.Event.CLICK, this.onCloudSave, this);
        }

        if (this.btnPrivacy) {
            this.btnPrivacy.node.on(Button.Event.CLICK, this.onOpenPrivacy, this);
        }
    }

    onDestroy() {
        if (this.btnClose) {
            this.btnClose.node.off(Button.Event.CLICK, this.hide, this);
        }
        if (this.bgmSlider) {
            this.bgmSlider.node.off("slide", this.onBgmSlider, this);
        }
        if (this.sfxSlider) {
            this.sfxSlider.node.off("slide", this.onSfxSlider, this);
        }
        if (this.vibrateToggle) {
            this.vibrateToggle.node.off("toggle", this.onVibrateToggle, this);
        }
        if (this.btnClearCache) {
            this.btnClearCache.node.off(Button.Event.CLICK, this.onClearCache, this);
        }
        if (this.btnCustomerService) {
            this.btnCustomerService.node.off(Button.Event.CLICK, this.onOpenCustomerService, this);
        }
        if (this.btnPrivacy) {
            this.btnPrivacy.node.off(Button.Event.CLICK, this.onOpenPrivacy, this);
        }
    }

    show() {
        if (this._isShow) return;
        this._isShow = true;
        this.refreshValues();
        this.playShowAnimation();
    }

    hide() {
        if (!this._isShow) return;
        this._isShow = false;
        this.playHideAnimation();
    }

    toggle() {
        if (this._isShow) {
            this.hide();
        } else {
            this.show();
        }
    }

    private refreshValues() {
        const bgmVol = AudioManager.Instance ? StorageUtil.getNumber("bgmVol", 1) : 1;
        const sfxVol = AudioManager.Instance ? StorageUtil.getNumber("sfxVol", 1) : 1;
        const vibrate = StorageUtil.getBool("vibrate", true);

        if (this.bgmSlider) this.bgmSlider.progress = bgmVol;
        if (this.sfxSlider) this.sfxSlider.progress = sfxVol;
        if (this.vibrateToggle) this.vibrateToggle.isChecked = vibrate;

        this.updateBgmLabel(bgmVol);
        this.updateSfxLabel(sfxVol);
    }

    private updateBgmLabel(value: number) {
        if (this.labBgmValue) {
            this.labBgmValue.string = `${Math.round(value * 100)}%`;
        }
    }

    private updateSfxLabel(value: number) {
        if (this.labSfxValue) {
            this.labSfxValue.string = `${Math.round(value * 100)}%`;
        }
    }

    private onBgmSlider(slider: Slider) {
        const value = slider.progress;
        AudioManager.Instance.setBgmVolume(value);
        this.updateBgmLabel(value);
        if (value < 0.05) {
            AudioManager.Instance.stopBgm();
        } else if (!AudioManager.Instance.isBgmPlaying()) {
            AudioManager.Instance.playBgm(BGM_PATH.MAIN, true, 0.5);
        }
    }

    private onSfxSlider(slider: Slider) {
        const value = slider.progress;
        AudioManager.Instance.setSfxVolume(value);
        this.updateSfxLabel(value);
    }

    private onVibrateToggle(toggle: Toggle) {
        VibrateManager.Instance.setEnabled(toggle.isChecked);
        if (toggle.isChecked) {
            VibrateManager.Instance.short("light");
        }
    }

    private onClearCache() {
        const wx = (window as any).wx;
        if (wx) {
            wx.showModal({
                title: "清除缓存",
                content: "确定要清除游戏缓存吗？",
                success: (res: any) => {
                    if (res.confirm) {
                        AudioManager.Instance.clearCache();
                        wx.showToast({ title: "缓存已清除" });
                    }
                }
            });
        } else {
            AudioManager.Instance.clearCache();
        }
    }

    private onOpenPrivacy() {
        const wx = (window as any).wx;
        if (wx && wx.openPrivacyContract) {
            wx.openPrivacyContract({});
        }
    }

    private onOpenCustomerService() {
        const wx = (window as any).wx;
        if (!wx) return;
        if (wx.openCustomerServiceConversation) {
            wx.openCustomerServiceConversation({
                sessionFrom: "game_settings",
                showMessageCard: true,
                sendMessageTitle: "三国割草：赵云传 玩家反馈",
                sendMessagePath: "",
                sendMessageImg: "",
                success: () => {
                    console.log("[SettingsUI] 客服会话已打开");
                },
                fail: (err: any) => {
                    console.error("[SettingsUI] 打开客服会话失败:", err);
                    wx.showToast({ title: "打开客服失败", icon: "none" });
                }
            });
        } else {
            wx.showToast({ title: "当前版本不支持客服功能", icon: "none" });
        }
    }

    private onCloudSave() {
        CloudSaveManager.Instance.saveToCloud(true);
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

    get isShow(): boolean {
        return this._isShow;
    }
}