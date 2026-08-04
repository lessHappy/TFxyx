import { _decorator, Component, Label, ProgressBar, tween, UIOpacity, Button, Node, director } from 'cc';
import { Player } from '../entity/Player';
import { GameManager } from '../core/GameManager';
import { ComboManager } from '../core/ComboManager';
import { EventManager } from '../core/EventManager';
import { StorageUtil } from '../core/StorageUtil';
import { HeroManager } from '../core/HeroManager';
import { HeroType, HERO_MASTERY_CONFIG, HERO_MASTERY_REWARDS, HeroSkillEffectType } from '../config/HeroConfig';
import { TutorialUI } from './TutorialUI';
import { SettingsUI } from './SettingsUI';
import { LoadingUI } from './LoadingUI';
const { ccclass, property } = _decorator;

@ccclass('GameHUD')
export class GameHUD extends Component {
    @property(Label) labTime: Label = null!;
    @property(Label) labKillCount: Label = null!;
    @property(Label) labGold: Label = null!;
    @property(ProgressBar) barExp: ProgressBar = null!;
    @property(ProgressBar) barHP: ProgressBar = null!;
    @property(Label) labLevel: Label = null!;
    @property(Label) labCombo: Label = null!;
    @property(Label) labBossWarning: Label = null!;
    @property(Label) labHeroName: Label = null!;
    @property(TutorialUI) tutorialUI: TutorialUI = null!;
    @property(SettingsUI) settingsUI: SettingsUI = null!;

    @property(Button) btnPause: Button = null!;
    @property(Button) btnExit: Button = null!;
    @property(Button) btnSetting: Button = null!;
    @property(Node) panelPause: Node = null!;
    @property(Button) btnResume: Button = null!;

    @property(ProgressBar) barBossHP: ProgressBar = null!;
    @property(Label) labBossName: Label = null!;
    @property(Node) nodeBossHP: Node = null!;

    @property(Node) nodeBuffIndicator: Node = null!;
    @property(Label) labDifficulty: Label = null!;
    @property(Label) labHeroSkill: Label = null!;

    private _lastMin: number = -1;
    private _lastSec: number = -1;
    private _lastKill: number = -1;
    private _lastLevel: number = -1;
    private _lastGold: number = -1;
    private _lastExpRatio: number = -1;
    private _lastHpRatio: number = -1;
    private _expDirty: boolean = true;
    private _hpDirty: boolean = true;
    private _lastCombo: number = 0;
    private _isPaused: boolean = false;

    onLoad() {
        EventManager.Instance.on("BOSS_SPAWN", this.showBossWarning, this);
        EventManager.Instance.on("BOSS_HP_UPDATE", this.updateBossHP, this);
        EventManager.Instance.on("BOSS_DEAD", this.hideBossHP, this);
        EventManager.Instance.on("HERO_MASTERY_UP", this.onBattleMasteryUp, this);

        if (this.btnPause) {
            this.btnPause.node.on(Button.Event.CLICK, this.onPauseClick, this);
        }
        if (this.btnResume) {
            this.btnResume.node.on(Button.Event.CLICK, this.onResumeClick, this);
        }
        if (this.btnExit) {
            this.btnExit.node.on(Button.Event.CLICK, this.onExitClick, this);
        }
        if (this.btnSetting) {
            this.btnSetting.node.on(Button.Event.CLICK, this.onSettingClick, this);
        }
        if (this.panelPause) {
            this.panelPause.active = false;
        }
        if (this.nodeBossHP) {
            this.nodeBossHP.active = false;
        }

        if (this.nodeBuffIndicator) {
            const hasBuff = StorageUtil.getBool("sgzy_battle_double_buff", false);
            this.nodeBuffIndicator.active = hasBuff;
        }

        if (this.labHeroName) {
            const heroData = HeroManager.Instance.getSelectedHeroData();
            const mastery = HeroManager.Instance.getMasteryData(heroData.id);
            const masteryTag = mastery.level > 0 ? ` [${mastery.name}]` : "";
            this.labHeroName.string = heroData.name + masteryTag;
        }

        if (this.labHeroSkill) {
            this.labHeroSkill.node.active = false;
        }
    }

    onDestroy() {
        EventManager.Instance.off("BOSS_SPAWN", this.showBossWarning, this);
        EventManager.Instance.off("BOSS_HP_UPDATE", this.updateBossHP, this);
        EventManager.Instance.off("BOSS_DEAD", this.hideBossHP, this);
        EventManager.Instance.off("HERO_MASTERY_UP", this.onBattleMasteryUp, this);
    }

    private onBattleMasteryUp(heroType: HeroType, level: number) {
        const heroData = HeroManager.Instance.getSelectedHeroData();
        if (heroData.id === heroType && this.labHeroSkill) {
            const masteryCfg = HERO_MASTERY_CONFIG[level];
            const reward = HERO_MASTERY_REWARDS[level] || 0;
            let text = `⭐ 熟练度提升：[${masteryCfg.name}]`;
            if (reward > 0) text += ` +${reward}金币`;
            this.labHeroSkill.string = text;
            this.labHeroSkill.node.active = true;
            this.scheduleOnce(() => {
                if (this.labHeroSkill) this.labHeroSkill.node.active = false;
            }, 2);
        }
    }

    onPauseClick() {
        if (!GameManager.Instance) return;
        this._isPaused = true;
        GameManager.Instance.battlePause = true;
        if (this.panelPause) {
            this.panelPause.active = true;
        }
    }

    onResumeClick() {
        if (!GameManager.Instance) return;
        this._isPaused = false;
        GameManager.Instance.battlePause = false;
        if (this.panelPause) {
            this.panelPause.active = false;
        }
    }

    onExitClick() {
        this.onResumeClick();
        GameManager.Instance?.battleOver();
        LoadingUI.loadSceneWithLoading("MainMenu", undefined, "返回主城...");
    }

    onSettingClick() {
        if (this.settingsUI) {
            this.settingsUI.show();
        }
    }

    showBossWarning() {
        if (!this.labBossWarning) return;
        this.labBossWarning.string = "⚠ BOSS 来袭！ ⚠";
        this.labBossWarning.node.active = true;
        const uiOpacity = this.labBossWarning.node.getComponent(UIOpacity);
        if (uiOpacity) {
            uiOpacity.opacity = 255;
            tween(uiOpacity)
                .delay(1.5)
                .to(0.5, { opacity: 0 })
                .call(() => {
                    this.labBossWarning.node.active = false;
                })
                .start();
        } else {
            this.scheduleOnce(() => {
                this.labBossWarning.node.active = false;
            }, 2);
        }

        if (this.nodeBossHP) {
            this.nodeBossHP.active = true;
            if (this.labBossName) {
                this.labBossName.string = "BOSS";
            }
            if (this.barBossHP) {
                this.barBossHP.progress = 1;
            }
        }
    }

    updateBossHP(current: number, max: number) {
        if (!this.barBossHP || !this.nodeBossHP) return;
        if (!this.nodeBossHP.active) {
            this.nodeBossHP.active = true;
        }
        const ratio = max > 0 ? current / max : 0;
        this.barBossHP.progress = ratio;
    }

    hideBossHP() {
        if (this.nodeBossHP) {
            this.nodeBossHP.active = false;
        }
    }

    update(_deltaTime: number) {
        if (!GameManager.Instance || !Player.Instance) return;
        const gm = GameManager.Instance;
        if (gm.battlePause || gm.gameOver) return;

        const player = Player.Instance;

        const min = Math.floor(gm.battleTime / 60);
        const sec = Math.floor(gm.battleTime % 60);
        if (min !== this._lastMin || sec !== this._lastSec) {
            this.labTime.string = `${(min < 10 ? '0' : '') + min}:${(sec < 10 ? '0' : '') + sec}`;
            this._lastMin = min;
            this._lastSec = sec;
        }

        if (gm.totalKillCount !== this._lastKill) {
            this.labKillCount.string = `击杀：${gm.totalKillCount}`;
            this._lastKill = gm.totalKillCount;
        }

        if (gm.totalGold !== this._lastGold) {
            if (this.labGold) {
                this.labGold.string = `金币：${gm.totalGold}`;
            }
            this._lastGold = gm.totalGold;
        }

        if (player.level !== this._lastLevel) {
            this.labLevel.string = `Lv.${player.level}`;
            this._lastLevel = player.level;
            this._expDirty = true;
        }

        const combo = ComboManager.Instance.comboCount;
        if (combo !== this._lastCombo && this.labCombo) {
            if (combo >= 5) {
                this.labCombo.string = `${combo} 连杀！`;
                this.labCombo.node.active = true;
            } else {
                this.labCombo.node.active = false;
            }
            this._lastCombo = combo;
        }

        const expRatio = player.exp / player.expNext;
        if (Math.abs(expRatio - this._lastExpRatio) > 0.005 || this._expDirty) {
            this.barExp.progress = expRatio;
            this._lastExpRatio = expRatio;
            this._expDirty = false;
        }

        const hpRatio = player.hp / player.maxHp;
        if (Math.abs(hpRatio - this._lastHpRatio) > 0.005 || this._hpDirty) {
            this.barHP.progress = hpRatio;
            this._lastHpRatio = hpRatio;
            this._hpDirty = false;
        }

        if (this.labDifficulty) {
            this.labDifficulty.string = `难度 ${gm.difficultyScale.toFixed(1)}`;
        }

        if (this.labHeroSkill) {
            const heroData = HeroManager.Instance.getSelectedHeroData();
            const skillEffect = player.getHeroSkillType();
            let skillText = "";
            let skillActive = false;

            switch (skillEffect) {
                case HeroSkillEffectType.KILL_BUFF:
                    if (player.getKillBuffActive()) {
                        const timer = player.getKillBuffTimer();
                        skillText = `【${heroData.skillName} Lv${player.getHeroSkillLevel()}】攻击力提升 ${timer}s`;
                        skillActive = true;
                    }
                    break;
                case HeroSkillEffectType.LOW_HP_BERSERK:
                    if (player.hp < player.maxHp * 0.3) {
                        skillText = `【${heroData.skillName} Lv${player.getHeroSkillLevel()}】伤害+${Math.floor(player.getHeroLowHpDmgBonus() * 100)}%`;
                        skillActive = true;
                    }
                    break;
                case HeroSkillEffectType.LEVEL_UP_HEAL:
                    skillText = `【${heroData.skillName} Lv${player.getHeroSkillLevel()}】升级额外回血`;
                    skillActive = true;
                    break;
                case HeroSkillEffectType.DASH_COOLDOWN: {
                    const dashCd = player.getDashCooldownTimer();
                    if (dashCd > 0) {
                        skillText = `【${heroData.skillName} Lv${player.getHeroSkillLevel()}】冲刺冷却 ${dashCd.toFixed(1)}s`;
                    } else {
                        skillText = `【${heroData.skillName} Lv${player.getHeroSkillLevel()}】冲刺就绪`;
                    }
                    skillActive = true;
                    break;
                }
                case HeroSkillEffectType.CRIT_DMG_BONUS:
                    skillText = `【${heroData.skillName} Lv${player.getHeroSkillLevel()}】暴击伤害+${Math.floor(player.getHeroCritDmgBonus() * 100)}%`;
                    skillActive = true;
                    break;
                default:
                    break;
            }

            this.labHeroSkill.node.active = skillActive;
            if (skillActive) {
                this.labHeroSkill.string = skillText;
            }
        }
    }
}