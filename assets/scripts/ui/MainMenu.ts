import { _decorator, Component, Node, Button, Label, director, Sprite, SpriteFrame, resources } from 'cc';
import { WxAdHelper } from '../core/WxAdHelper';
import { AdRewardType } from '../config/AdConfig';
import { StorageUtil } from '../core/StorageUtil';
import { PrivacyPanel } from './PrivacyPanel';
import { OfflineIncome } from '../utils/OfflineIncome';
import { OfflineRewardUI } from './OfflineRewardUI';
import { WeaponBookUI } from './WeaponBookUI';
import { RankUI } from './RankUI';
import { TalentUI } from './TalentUI';
import { TalentManager } from '../core/TalentManager';
import { HeroUI } from './HeroUI';
import { HeroManager } from '../core/HeroManager';
import { SettingsUI } from './SettingsUI';
import { ShareUI } from './ShareUI';
import { ShareManager } from '../core/ShareManager';
import { ShareType } from '../config/ShareConfig';
import { StageAnnounceManager } from '../core/StageAnnounceManager';
import { StageAnnounceUI } from './StageAnnounceUI';
import { LoadingUI } from './LoadingUI';
import { SignInManager } from '../core/SignInManager';
import { SignInUI } from './SignInUI';
import { AchievementManager } from '../core/AchievementManager';
import { AchievementUI } from './AchievementUI';
import { OpenDataManager } from '../core/OpenDataManager';
import { OpenDataRankUI } from './OpenDataRankUI';
import { CloudSaveManager } from '../core/CloudSaveManager';
import { CloudSaveUI } from './CloudSaveUI';
import { RedeemManager } from '../core/RedeemManager';
import { RedeemUI } from './RedeemUI';
import { AudioManager, BGM_PATH } from '../core/AudioManager';
import { UpdateManager } from '../core/UpdateManager';
import { VibrateManager } from '../core/VibrateManager';
import { DailyTaskManager } from '../core/DailyTaskManager';
import { TaskType } from '../config/DailyTaskConfig';
import { DailyTaskUI } from './DailyTaskUI';
import { WeChatManager } from '../core/WeChatManager';
import { RedDotManager, RedDotType, RED_DOT_EVENT } from '../core/RedDotManager';
import { EventManager } from '../core/EventManager';
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
    @property(Button) btnBook: Button = null!;
    @property(Button) btnRank: Button = null!;
    @property(Button) btnTalent: Button = null!;
    @property(Button) btnHero: Button = null!;
    @property(Button) btnSetting: Button = null!;
    @property(Button) btnShare: Button = null!;
    @property(Button) btnSignIn: Button = null!;
    @property(Button) btnAchievement: Button = null!;
    @property(Button) btnRedeem: Button = null!;
    @property(Button) btnWatchAdBuff: Button = null!;
    @property(Button) btnShareRevive: Button = null!;
    @property(Button) btnDailyTask: Button = null!;

    @property(Node) privacyPanelNode: Node = null!;
    @property(OfflineRewardUI) offlineRewardUI: OfflineRewardUI = null!;
    @property(WeaponBookUI) weaponBookUI: WeaponBookUI = null!;
    @property(RankUI) rankUI: RankUI = null!;
    @property(TalentUI) talentUI: TalentUI = null!;
    @property(HeroUI) heroUI: HeroUI = null!;
    @property(SettingsUI) settingsUI: SettingsUI = null!;
    @property(ShareUI) shareUI: ShareUI = null!;
    @property(Sprite) heroPreviewSprite: Sprite = null!;
    @property(Label) heroPreviewName: Label = null!;
    @property(Label) heroPreviewTitle: Label = null!;
    @property(StageAnnounceUI) stageAnnounceUI: StageAnnounceUI = null!;
    @property(SignInUI) signInUI: SignInUI = null!;
    @property(AchievementUI) achievementUI: AchievementUI = null!;
    @property(OpenDataRankUI) openDataRankUI: OpenDataRankUI = null!;
    @property(CloudSaveUI) cloudSaveUI: CloudSaveUI = null!;
    @property(RedeemUI) redeemUI: RedeemUI = null!;
    @property(DailyTaskUI) dailyTaskUI: DailyTaskUI = null!;

    @property(Node) redDotAchievement: Node = null!;
    @property(Node) redDotSignIn: Node = null!;
    @property(Node) redDotTalent: Node = null!;
    @property(Node) redDotHero: Node = null!;
    @property(Node) redDotDailyTask: Node = null!;
    @property(Node) redDotShare: Node = null!;

    private privacyPanel: PrivacyPanel | null = null;
    private isPrivacyAgree: boolean = false;
    private goldNum: number = 0;
    private hasDoubleBuff: boolean = false;
    private _isFirstLoad: boolean = true;

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

        WxAdHelper.init();
        WeChatManager.Instance.init();
        TalentManager.Instance.load();
        HeroManager.Instance.load();
        DailyTaskManager.Instance.load();
        OpenDataManager.Instance.init();
        CloudSaveManager.Instance.init();
        CloudSaveManager.Instance.startAutoSave();
        UpdateManager.Instance.checkUpdate();
        VibrateManager.Instance.init();
        this.initRedDots();
        this.registerRedDotEvent();
        if (this.talentUI) {
            this.talentUI.init({
                onGoldChanged: (gold: number) => this.refreshGold(gold),
                onStatChanged: () => this.refreshHeroPreview(),
            });
        }
        if (this.heroUI) {
            this.heroUI.init({ onHeroChanged: (heroType) => this.onHeroChanged(heroType) });
        }

        EventManager.Instance.on("HERO_UNLOCKED", this.onHeroUnlocked, this);
        if (this.shareUI) {
            this.shareUI.init({ onGoldChanged: (gold: number) => this.refreshGold(gold) });
        }
        if (this.stageAnnounceUI) {
            this.stageAnnounceUI.init(() => this.enterBattleScene());
        }
        if (this.signInUI) {
            this.signInUI.init({ onGoldChanged: (gold: number) => this.refreshGold(gold) });
        }
        if (this.achievementUI) {
            this.achievementUI.init({ onGoldChanged: (gold: number) => this.refreshGold(gold) });
        }
        if (this.redeemUI) {
            this.redeemUI.init({ onGoldChanged: (gold: number) => this.refreshGold(gold) });
        }
        if (this.dailyTaskUI) {
            this.dailyTaskUI.init({ onGoldChanged: (gold: number) => this.refreshGold(gold) });
        }
        AudioManager.Instance.playBgm(BGM_PATH.MAIN, true, 0.5);
    }

    onEnable() {
        if (this._isFirstLoad) {
            this._isFirstLoad = false;
            return;
        }
        this.refreshGold();
        this.refreshRedDots();
        this.tryShowOfflineReward();
    }

    onDestroy() {
        EventManager.Instance.off("HERO_UNLOCKED", this.onHeroUnlocked, this);
        WxAdHelper.destroy();
    }

    checkPrivacyStatus() {
        this.isPrivacyAgree = StorageUtil.getBool("privacy_agree_flag", false);
        if (!this.isPrivacyAgree && this.privacyPanel) {
            this.privacyPanel.showPanel();
        }
    }

    setPrivacyAgreeState(flag: boolean) {
        this.isPrivacyAgree = flag;
        if (flag) {
            this.tryShowOfflineReward();
            this.tryShowSignIn();
        }
    }

    initUI() {
        this.refreshGold();
        this.hasDoubleBuff = StorageUtil.getBool(STORAGE_KEY.DOUBLE_BUFF, false);
        if (this.btnWatchAdBuff) {
            if (this.hasDoubleBuff) {
                this.btnWatchAdBuff.interactable = false;
            }
        }
    }

    refreshGold(gold?: number) {
        if (gold !== undefined) {
            this.goldNum = gold;
        } else {
            this.goldNum = StorageUtil.getNumber(STORAGE_KEY.GOLD, 1200);
        }
        this.labGold.string = `${this.goldNum}`;
    }

    onHeroChanged() {
        this.refreshGold();
        this.refreshHeroPreview();
    }

    private onHeroUnlocked(heroType: string) {
        this.redDotManager.setDot(RedDotType.HERO, true);
        const wx = (window as any).wx;
        if (wx) {
            const heroData = HeroManager.Instance.getHeroDataByType(heroType as any);
            if (heroData) wx.showToast({ title: `新英雄解锁：${heroData.name}` });
        }
        this.refreshHeroPreview();
    }

    private refreshHeroPreview() {
        const heroData = HeroManager.Instance.getSelectedHeroData();
        if (!heroData) return;

        if (this.heroPreviewSprite) {
            const spritePath = heroData.spriteFrame;
            if (spritePath) {
                resources.load(spritePath, SpriteFrame, (err, spriteFrame) => {
                    if (!err && this.heroPreviewSprite && this.heroPreviewSprite.isValid) {
                        this.heroPreviewSprite.spriteFrame = spriteFrame;
                    }
                });
            }
        }
        if (this.heroPreviewName) {
            this.heroPreviewName.string = heroData.name;
        }
        if (this.heroPreviewTitle) {
            this.heroPreviewTitle.string = heroData.title;
        }
    }

    tryShowOfflineReward() {
        if (this.offlineRewardUI) {
            this.offlineRewardUI.tryShowPanel();
        }
    }

    tryShowSignIn() {
        SignInManager.Instance.load();
        if (SignInManager.Instance.canClaim() && this.signInUI) {
            DailyTaskManager.Instance.addProgress(TaskType.SIGN_IN, 1);
            this.scheduleOnce(() => {
                this.signInUI?.show();
            }, 0.8);
        }
    }

    registerButtonEvent() {
        this.btnStartGame.node.on(Button.Event.CLICK, async () => {
            if (this.stageAnnounceUI) {
                this.stageAnnounceUI.show();
            } else {
                await this.enterBattleScene();
            }
        });
        if (this.btnBook) {
            this.btnBook.node.on(Button.Event.CLICK, () => this.weaponBookUI?.show());
        }
        if (this.btnRank) {
            this.btnRank.node.on(Button.Event.CLICK, () => this.rankUI?.show());
        }
        if (this.btnTalent) {
            this.btnTalent.node.on(Button.Event.CLICK, () => this.talentUI?.show());
        }
        if (this.btnHero) {
            this.btnHero.node.on(Button.Event.CLICK, () => this.heroUI?.show());
        }
        if (this.btnSetting) {
            this.btnSetting.node.on(Button.Event.CLICK, () => this.settingsUI?.show());
        }
        if (this.btnShare) {
            this.btnShare.node.on(Button.Event.CLICK, () => this.shareUI?.show());
        }
        if (this.btnSignIn) {
            this.btnSignIn.node.on(Button.Event.CLICK, () => this.signInUI?.show());
        }
        if (this.btnAchievement) {
            this.btnAchievement.node.on(Button.Event.CLICK, () => this.achievementUI?.show());
        }
        if (this.btnRedeem) {
            this.btnRedeem.node.on(Button.Event.CLICK, () => this.redeemUI?.show());
        }
        if (this.btnDailyTask) {
            this.btnDailyTask.node.on(Button.Event.CLICK, () => this.dailyTaskUI?.show());
        }
        this.btnWatchAdBuff.node.on(Button.Event.CLICK, () => this.onWatchAdBuff());
        this.btnShareRevive.node.on(Button.Event.CLICK, () => this.onShareGetRevive());
    }

    async enterBattleScene() {
        const hasDoubleBuff = StorageUtil.getBool(STORAGE_KEY.DOUBLE_BUFF, false);
        StorageUtil.setBool("sgzy_battle_double_buff", hasDoubleBuff);

        AudioManager.Instance.playSfx("audio/sfx/select");
        AudioManager.Instance.fadeOutBgm(0.5);

        const wx = (window as any).wx;
        const subPackage = wx ? "battle_sub" : undefined;

        await LoadingUI.loadSceneWithLoading("Battle", subPackage, "厉兵秣马，准备出征...");
    }

    onWatchAdBuff() {
        if (!this.isPrivacyAgree) {
            const wx = (window as any).wx;
            if (wx) wx.showToast({ title: "请先同意隐私政策" });
            return;
        }
        WxAdHelper.showRewardAd(AdRewardType.DOUBLE_BUFF, () => {
            this.hasDoubleBuff = true;
            StorageUtil.setBool(STORAGE_KEY.DOUBLE_BUFF, true);
            if (this.btnWatchAdBuff) {
                this.btnWatchAdBuff.interactable = false;
            }
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
        const success = ShareManager.Instance.share(ShareType.REVIVE);
        if (success) {
            DailyTaskManager.Instance.addProgress(TaskType.SHARE, 1);
            this.refreshGold();
        }
    }

    private registerWxHide() {
        const wx = (window as any).wx;
        if (wx && wx.onHide) {
            wx.onHide(() => {
                OfflineIncome.saveExitTime();
                CloudSaveManager.Instance.saveToCloud();
                HeroManager.Instance.cleanup();
            });
        }
    }

    private initRedDots() {
        this.initRedDot(RedDotType.ACHIEVEMENT, this.redDotAchievement);
        this.initRedDot(RedDotType.SIGN_IN, this.redDotSignIn);
        this.initRedDot(RedDotType.TALENT, this.redDotTalent);
        this.initRedDot(RedDotType.HERO, this.redDotHero);
        this.initRedDot(RedDotType.DAILY_TASK, this.redDotDailyTask);
        this.initRedDot(RedDotType.SHARE, this.redDotShare);
        this.refreshRedDots();
    }

    private initRedDot(type: RedDotType, node: Node | null) {
        if (!node) return;
        node.active = false;
    }

    private registerRedDotEvent() {
        EventManager.Instance.on(RED_DOT_EVENT, this.onRedDotChanged, this);
    }

    private onRedDotChanged(type: RedDotType, visible: boolean) {
        switch (type) {
            case RedDotType.ACHIEVEMENT:
                if (this.redDotAchievement) this.redDotAchievement.active = visible;
                break;
            case RedDotType.SIGN_IN:
                if (this.redDotSignIn) this.redDotSignIn.active = visible;
                break;
            case RedDotType.TALENT:
                if (this.redDotTalent) this.redDotTalent.active = visible;
                break;
            case RedDotType.HERO:
                if (this.redDotHero) this.redDotHero.active = visible;
                break;
            case RedDotType.DAILY_TASK:
                if (this.redDotDailyTask) this.redDotDailyTask.active = visible;
                break;
            case RedDotType.SHARE:
                if (this.redDotShare) this.redDotShare.active = visible;
                break;
        }
    }

    private refreshRedDots() {
        AchievementManager.Instance.load();
        const unclaimedAch = AchievementManager.Instance.getUnclaimedCount();
        RedDotManager.Instance.setDot(RedDotType.ACHIEVEMENT, unclaimedAch > 0);

        SignInManager.Instance.load();
        RedDotManager.Instance.setDot(RedDotType.SIGN_IN, SignInManager.Instance.canClaim());

        this.updateHeroRedDot();
        this.updateDailyTaskRedDot();
        this.updateShareRedDot();
    }

    private updateHeroRedDot() {
        RedDotManager.Instance.setDot(RedDotType.HERO, HeroManager.Instance.hasUnlockableHero());
    }

    private updateDailyTaskRedDot() {
        DailyTaskManager.Instance.load();
        const hasDaily = DailyTaskManager.Instance.hasUnclaimedReward();
        RedDotManager.Instance.setDot(RedDotType.DAILY_TASK, hasDaily);
    }

    private updateShareRedDot() {
        ShareManager.Instance.load();
        let hasShare = false;
        for (const type of Object.values(ShareType)) {
            if (ShareManager.Instance.canShare(type)) {
                hasShare = true;
                break;
            }
        }
        RedDotManager.Instance.setDot(RedDotType.SHARE, hasShare);
    }
}