import { _decorator, Component, Button } from 'cc';
import { StorageUtil } from '../core/StorageUtil';
import { MainMenu } from './MainMenu';
const { ccclass, property } = _decorator;

// 修改为你的公众号隐私政策链接
const PRIVACY_URL = "https://替换你的隐私政策链接";

@ccclass('PrivacyPanel')
export class PrivacyPanel extends Component {
    @property(Button) btnLink: Button = null!;
    @property(Button) btnAgree: Button = null!;
    @property(Button) btnReject: Button = null!;

    private mainMenu: MainMenu | null = null;

    init(mainMenu: MainMenu) {
        this.mainMenu = mainMenu;
        this.registerEvent();
    }

    registerEvent() {
        const wx = (window as any).wx;
        this.btnLink.node.on(Button.Event.CLICK, () => {
            if (wx) {
                wx.openOfficialAccountArticle({
                    url: PRIVACY_URL,
                    fail: () => {
                        wx.showToast({ title: "打开链接失败" });
                    }
                });
            }
        });

        this.btnAgree.node.on(Button.Event.CLICK, () => {
            StorageUtil.setBool("privacy_agree_flag", true);
            this.closePanel();
            if (this.mainMenu) this.mainMenu.setPrivacyAgreeState(true);
        });

        this.btnReject.node.on(Button.Event.CLICK, () => {
            StorageUtil.setBool("privacy_agree_flag", false);
            this.closePanel();
            if (this.mainMenu) this.mainMenu.setPrivacyAgreeState(false);
        });
    }

    closePanel() {
        this.node.active = false;
    }
    showPanel() {
        this.node.active = true;
    }
}