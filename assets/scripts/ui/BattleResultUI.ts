import { _decorator, Component, Label, Button, director, tween, UIOpacity } from 'cc';
import { GameManager } from '../core/GameManager';
import { EventManager, GameEvent } from '../core/EventManager';
import { WxAdHelper } from '../core/WxAdHelper';
import { AdRewardType } from '../config/AdConfig';
import { StorageUtil } from '../core/StorageUtil';
import { RankUI } from './RankUI';
import { AudioManager } from '../core/AudioManager';
import { ShareManager } from '../core/ShareManager';
import { ShareType } from '../config/ShareConfig';
import { LoadingUI } from './LoadingUI';
import { OpenDataManager } from '../core/OpenDataManager';
import { HeroManager } from '../core/HeroManager';
const { ccclass, property } = _decorator;

@ccclass('BattleResultUI')
export class BattleResultUI extends Component {
    @property(Label) labKill: Label = null!;
    @property(Label) labTime: Label = null!;
    @property(Label) labGold: Label = null!;
    @property(Label) labRank: Label = null!;
    @property(Button) btnBackMenu: Button = null!;
    @property(Button) btnRevive: Button = null!;
    @property(Button) btnDoubleGold: Button = null!;
    @property(Button) btnShare: Button = null!;
    @property(Label) labHero: Label = null!;

    private _reviveUsed: boolean = false;
    private _doubleGoldUsed: boolean = false;
    private _buttonsEnabled: boolean = false;
    private _pendingGold: number = 0;

    onLoad() {
        EventManager.Instance.on(GameEvent.PLAYER_DEAD, this.showResult, this);
        this.node.active = false;
        this.btnBackMenu.node.on(Button.Event.CLICK, () => {
            this.saveAndExit();
        });
        if (this.btnRevive) {
            this.btnRevive.node.on(Button.Event.CLICK, this.onReviveClick, this);
        }
        if (this.btnDoubleGold) {
            this.btnDoubleGold.node.on(Button.Event.CLICK, this.onDoubleGoldClick, this);
        }
        if (this.btnShare) {
            this.btnShare.node.on(Button.Event.CLICK, this.onShareClick, this);
        }
    }

    onEnable() {
        this._reviveUsed = false;
        this._doubleGoldUsed = false;
        this._buttonsEnabled = false;
    }

    showResult() {
        this._reviveUsed = false;
        this._doubleGoldUsed = false;
        this._buttonsEnabled = false;
        const gm = GameManager.Instance!;

        this.labKill.string = `击杀数量：${gm.totalKillCount}`;
        const min = Math.floor(gm.battleTime / 60);
        const sec = Math.floor(gm.battleTime % 60);
        this.labTime.string = `生存时间：${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;

        this._pendingGold = gm.totalGold;
        if (this.labGold) {
            this.labGold.string = `获得金币：${this._pendingGold}`;
        }

        if (this.labHero) {
            const heroData = HeroManager.Instance.getSelectedHeroData();
            const mastery = HeroManager.Instance.getMasteryData(heroData.id);
            const masteryTag = mastery.level > 0 ? ` [${mastery.name}]` : "";
            const heroDmg = gm.getHeroDamageDealt();
            this.labHero.string = `英雄：${heroData.name}${masteryTag} | 输出：${heroDmg}`;
        }

        if (this.labRank) {
            const rank = this.getBestRank(gm.totalKillCount, Math.floor(gm.battleTime));
            if (rank > 0) {
                this.labRank.string = `🏆 历史最佳第 ${rank} 名！`;
                this.labRank.node.active = true;
            } else {
                this.labRank.node.active = false;
            }
        }

        if (this.btnRevive) {
            const reviveCount = StorageUtil.getNumber("sgzy_revive", 0);
            this.btnRevive.node.active = reviveCount > 0;
        }

        if (this.btnDoubleGold) {
            this.btnDoubleGold.node.active = this._pendingGold > 0;
        }

        this.btnBackMenu.interactable = false;
        if (this.btnRevive) this.btnRevive.interactable = false;
        if (this.btnDoubleGold) this.btnDoubleGold.interactable = false;

        this.node.active = true;
        this.playShowAnimation();
    }

    private playShowAnimation() {
        const uiOpacity = this.node.getComponent(UIOpacity);
        if (uiOpacity) {
            uiOpacity.opacity = 0;
            tween(uiOpacity)
                .to(0.3, { opacity: 255 })
                .call(() => {
                    this.enableButtons();
                })
                .start();
        } else {
            this.scheduleOnce(() => {
                this.enableButtons();
            }, 0.5);
        }
    }

    private enableButtons() {
        this._buttonsEnabled = true;
        this.btnBackMenu.interactable = true;
        if (this.btnRevive) this.btnRevive.interactable = true;
        if (this.btnDoubleGold) this.btnDoubleGold.interactable = true;
    }

    private getBestRank(kill: number, time: number): number {
        const list = StorageUtil.getObject("game_rank_data", []);
        if (list.length === 0) return 1;

        const newRecord = { kill, time, gold: this._pendingGold };
        const sorted = [...list, newRecord].sort((a: any, b: any) => b.time - a.time);

        const idx = sorted.findIndex((r: any) => r.time === time && r.kill === kill);
        return idx >= 0 ? idx + 1 : 0;
    }

    onReviveClick() {
        if (!this._buttonsEnabled || this._reviveUsed) return;
        this._reviveUsed = true;

        WxAdHelper.showRewardAd(AdRewardType.REVIVE, () => {
            const reviveCount = StorageUtil.getNumber("sgzy_revive", 0);
            if (reviveCount > 0) {
                StorageUtil.setNumber("sgzy_revive", reviveCount - 1);
            }
            EventManager.Instance.emit("PLAYER_REVIVE");
            this.node.active = false;
        }, () => {
            this._reviveUsed = false;
            const wx = (window as any).wx;
            if (wx) wx.showToast({ title: "广告未完整观看，无法复活" });
        });
    }

    onDoubleGoldClick() {
        if (!this._buttonsEnabled || this._doubleGoldUsed) return;
        this._doubleGoldUsed = true;

        WxAdHelper.showRewardAd(AdRewardType.GOLD_BONUS, () => {
            const doubled = this._pendingGold * 2;
            this._pendingGold = doubled;
            if (this.labGold) {
                this.labGold.string = `获得金币：${doubled} (双倍!)`;
            }
            const wx = (window as any).wx;
            if (wx) wx.showToast({ title: "金币已翻倍！" });
            if (this.btnDoubleGold) {
                this.btnDoubleGold.interactable = false;
            }
        }, () => {
            this._doubleGoldUsed = false;
            const wx = (window as any).wx;
            if (wx) wx.showToast({ title: "广告未完整观看" });
        });
    }

    onShareClick() {
        const gm = GameManager.Instance!;
        const title = ShareManager.Instance.generateResultShareText(
            gm.totalKillCount,
            Math.floor(gm.battleTime),
            this._pendingGold
        );
        ShareManager.Instance.share(ShareType.GAME_RESULT, title);
    }

    private saveAndExit() {
        AudioManager.Instance.playSfx("audio/sfx/select");
        const gm = GameManager.Instance;
        if (gm) {
            if (this._pendingGold > 0) {
                const currentGold = StorageUtil.getNumber("sgzy_gold", 0);
                StorageUtil.setNumber("sgzy_gold", currentGold + this._pendingGold);
            }
            if (gm.totalKillCount > 0) {
                RankUI.saveRecord({
                    kill: gm.totalKillCount,
                    time: Math.floor(gm.battleTime),
                    gold: this._pendingGold
                });
                const playerLevel = gm.player ? gm.player.level : 0;
                OpenDataManager.Instance.uploadScore(
                    gm.totalKillCount,
                    Math.floor(gm.battleTime),
                    this._pendingGold,
                    playerLevel
                );
                OpenDataManager.Instance.updateBestScore(
                    gm.totalKillCount,
                    Math.floor(gm.battleTime),
                    this._pendingGold
                );
            }

            const heroType = HeroManager.Instance.getSelectedHero();
            HeroManager.Instance.recordHeroGameResult(
                heroType,
                gm.totalKillCount,
                Math.floor(gm.battleTime)
            );
            HeroManager.Instance.recordHeroSingleGameKill(heroType, gm.totalKillCount);

            if (gm.player && gm.player.getHeroSkillLevel() >= gm.player.getHeroSkillMaxLevel()) {
                const current = StorageUtil.getNumber("sgzy_hero_skill_max", 0);
                StorageUtil.setNumber("sgzy_hero_skill_max", current + 1);
            }

            gm.battleOver();
        }
        LoadingUI.loadSceneWithLoading("MainMenu", undefined, "返回主城...");
    }

    onDestroy() {
        EventManager.Instance.off(GameEvent.PLAYER_DEAD, this.showResult, this);
    }
}