import { _decorator, Component, Node, Button, Label, director } from 'cc';
import { WxAdHelper } from '../core/WxAdHelper';
import { StorageUtil } from '../core/StorageUtil';
import { PrivacyPanel } from './PrivacyPanel';
import { OfflineIncome } from '../utils/OfflineIncome';
const { ccclass, property } = _decorator;

export const STORAGE_KEY = {
    GOLD: "sgzy_gold",
    REVIVE_COUNT: "sgzy_revive",
    DOUBLE_BUFF: "sgzy_double_buff"
};

@ccclass('MainMenu')
export class MainMenu extends Component {
    @property(Label) labGold: Label = null!;
    @property(Button) btnStartGame: Button = null!;
    @property(Button) btnHero: Button = null!;
    @property(Button) btnTalent: Button = null!;
    @property(Button) btnWatchAdBuff: Button = null!;
    @property(Button) btnShareRevive: Button = null!;

    @property(Node) panelHero: Node = null!;
    @property(Node) panelTalent: Node = null!;
    @property(Node) privacyPanelNode: Node = null!;

    private privacyPanel: PrivacyPanel | null = null;
    private isPrivacyAgree: boolean = false;
    private goldNum: number = 0;
    private hasDoubleBuff: boolean = false;

    onLoad() {
        OfflineIncome.saveExitTime();
        this.registerWxHide();

        this.privacyPanel = this.privacyPanelNode.getComponent(PrivacyPanel);
        if (this.privacyPanel) {
            this.privacyPanel.init(this);
            this.checkPrivacyStatus();
        }

        this.initUI();
        this.registerButtonEvent();
    }

    checkPrivacyStatus() {
        this.isPrivacyAgree = StorageUtil.getBool("privacy_agree_flag", false);
        if (!this.isPrivacyAgree && this.privacyPanel) {
            this.privacyPanel.showPanel();
        }
    }

    setPrivacyAgreeState(flag: boolean) {
        this.isPrivacyAgree = flag;
    }

    initUI() {
        this.goldNum = StorageUtil.getNumber(STORAGE_KEY.GOLD, 1200);
        this.hasDoubleBuff = StorageUtil.getBool(STORAGE_KEY.DOUBLE_BUFF, false);
        this.labGold.string = `${this.goldNum}`;

        if (this.hasDoubleBuff) {
            this.btnWatchAdBuff.interactable = false;
        }
    }

    registerButtonEvent() {
        this.btnStartGame.node.on(Button.Event.CLICK, async () => {
            await this.enterBattleScene();
        });
        this.btnHero.node.on(Button.Event.CLICK, () => this.panelHero.active = true);
        this.btnTalent.node.on(Button.Event.CLICK, () => this.panelTalent.active = true);
        this.btnWatchAdBuff.node.on(Button.Event.CLICK, () => this.onWatchAdBuff());
        this.btnShareRevive.node.on(Button.Event.CLICK, () => this.onShareGetRevive());
    }

    async enterBattleScene() {
        // 将双倍Buff状态传递给战斗场景
        const hasDoubleBuff = StorageUtil.getBool(STORAGE_KEY.DOUBLE_BUFF, false);
        StorageUtil.setBool("sgzy_battle_double_buff", hasDoubleBuff);

        const wx = (window as any).wx;
        try {
            if (wx) {
                await director.loadSubpackage('battle_sub');
            }
            director.loadScene("Battle");
        } catch (err) {
            console.error("分包加载失败", err);
            if (wx) wx.showToast({ title: "资源加载失败，请重启小游戏" });
        }
    }

    onWatchAdBuff() {
        if (!this.isPrivacyAgree) {
            const wx = (window as any).wx;
            if (wx) wx.showToast({ title: "请先同意隐私政策" });
            return;
        }
        WxAdHelper.showRewardAd(() => {
            this.hasDoubleBuff = true;
            StorageUtil.setBool(STORAGE_KEY.DOUBLE_BUFF, true);
            this.btnWatchAdBuff.interactable = false;
            const wx = (window as any).wx;
            if (wx) wx.showToast({ title: "本局经验双倍生效！" });
        }, () => {
            const wx = (window as any).wx;
            if (wx) wx.showToast({ title: "广告未完整观看，无法获得奖励" });
        });
    }

    onShareGetRevive() {
        if (!this.isPrivacyAgree) {
            const wx = (window as any).wx;
            if (wx) wx.showToast({ title: "请先同意隐私政策" });
            return;
        }
        const wx = (window as any).wx;
        if (!wx) return;
        wx.shareAppMessage({
            title: "三国割草：赵云传，爽快割草！",
            query: "from=share_revive"
        });
        let revive = StorageUtil.getNumber(STORAGE_KEY.REVIVE_COUNT, 1);
        revive += 1;
        StorageUtil.setNumber(STORAGE_KEY.REVIVE_COUNT, revive);
        wx.showToast({ title: "获得额外复活机会！" });
    }

    private registerWxHide() {
        const wx = (window as any).wx;
        if (wx && wx.onHide) {
            wx.onHide(() => {
                OfflineIncome.saveExitTime();
            });
        }
    }
}