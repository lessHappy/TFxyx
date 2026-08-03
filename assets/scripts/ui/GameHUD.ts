import { _decorator, Component, Label, ProgressBar, tween, UIOpacity } from 'cc';
import { Player } from '../entity/Player';
import { GameManager } from '../core/GameManager';
import { ComboManager } from '../core/ComboManager';
import { EventManager } from '../core/EventManager';
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

    private _lastTime: string = '';
    private _lastKill: number = -1;
    private _lastLevel: number = -1;
    private _lastGold: number = -1;
    private _lastExpRatio: number = -1;
    private _lastHpRatio: number = -1;
    private _expDirty: boolean = true;
    private _hpDirty: boolean = true;
    private _lastCombo: number = 0;

    onLoad() {
        EventManager.Instance.on("BOSS_SPAWN", this.showBossWarning, this);
    }

    onDestroy() {
        EventManager.Instance.off("BOSS_SPAWN", this.showBossWarning, this);
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
    }

    update(_deltaTime: number) {
        if (!GameManager.Instance || !Player.Instance) return;
        const gm = GameManager.Instance;
        if (gm.battlePause || gm.gameOver) return;

        const player = Player.Instance;

        const min = Math.floor(gm.battleTime / 60);
        const sec = Math.floor(gm.battleTime % 60);
        const timeStr = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
        if (timeStr !== this._lastTime) {
            this.labTime.string = timeStr;
            this._lastTime = timeStr;
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

        // 连杀显示
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
    }
}