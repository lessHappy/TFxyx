import { _decorator, Component, Label, ProgressBar, tween, UIOpacity, Button, Node, director } from 'cc';
import { Player } from '../entity/Player';
import { GameManager } from '../core/GameManager';
import { ComboManager } from '../core/ComboManager';
import { EventManager } from '../core/EventManager';
import { StorageUtil } from '../core/StorageUtil';
import { HeroManager } from '../core/HeroManager';
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
            this.labHeroName.string = heroData.name;
        }
    }

    onDestroy() {
        EventManager.Instance.off("BOSS_SPAWN", this.showBossWarning, this);
        EventManager.Instance.off("BOSS_HP_UPDATE", this.updateBossHP, this);
        EventManager.Instance.off("BOSS_DEAD", this.hideBossHP, this);
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
    }
}