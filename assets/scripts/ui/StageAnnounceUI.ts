import { _decorator, Component, Node, Label, Button, Sprite, UIOpacity, tween, Color, director } from 'cc';
import { StageAnnounceManager } from '../core/StageAnnounceManager';
import { StageData, STAGE_LIST } from '../config/StageAnnounceConfig';
import { StorageUtil } from '../core/StorageUtil';
import { AudioManager, BGM_PATH } from '../core/AudioManager';
const { ccclass, property } = _decorator;

@ccclass("StageAnnounceUI")
export class StageAnnounceUI extends Component {
    @property(Node) panel: Node = null!;
    @property(Label) labStageName: Label = null!;
    @property(Label) labStageDesc: Label = null!;
    @property(Label) labStageIndex: Label = null!;
    @property(Label) labDifficulty: Label = null!;
    @property(Label) labUnlockTip: Label = null!;

    @property(Button) btnPrev: Button = null!;
    @property(Button) btnNext: Button = null!;
    @property(Button) btnStart: Button = null!;
    @property(Button) btnUnlock: Button = null!;
    @property(Button) btnClose: Button = null!;

    @property(Node) lockIcon: Node = null!;

    private _currentIndex: number = 0;
    private _isShow: boolean = false;
    private _onStartBattle: (() => void) | null = null;

    onLoad() {
        if (this.panel) {
            this.panel.active = false;
        }

        if (this.btnPrev) {
            this.btnPrev.node.on(Button.Event.CLICK, this.onPrev, this);
        }
        if (this.btnNext) {
            this.btnNext.node.on(Button.Event.CLICK, this.onNext, this);
        }
        if (this.btnStart) {
            this.btnStart.node.on(Button.Event.CLICK, this.onStartBattle, this);
        }
        if (this.btnUnlock) {
            this.btnUnlock.node.on(Button.Event.CLICK, this.onUnlockStage, this);
        }
        if (this.btnClose) {
            this.btnClose.node.on(Button.Event.CLICK, this.hide, this);
        }
    }

    init(onStartBattle: () => void) {
        this._onStartBattle = onStartBattle;
    }

    show() {
        if (this._isShow) return;
        this._isShow = true;
        StageAnnounceManager.Instance.load();
        this._currentIndex = StageAnnounceManager.Instance.getCurrentStage() - 1;
        this.refreshStage();
        this.playShowAnimation();
    }

    hide() {
        if (!this._isShow) return;
        this._isShow = false;
        this.playHideAnimation();
    }

    private onPrev() {
        if (this._currentIndex <= 0) return;
        this._currentIndex--;
        this.refreshStage();
        AudioManager.Instance.playSfx("audio/sfx/select");
    }

    private onNext() {
        if (this._currentIndex >= STAGE_LIST.length - 1) return;
        this._currentIndex++;
        this.refreshStage();
        AudioManager.Instance.playSfx("audio/sfx/select");
    }

    private refreshStage() {
        const stage = STAGE_LIST[this._currentIndex];
        if (!stage) return;

        const unlocked = StageAnnounceManager.Instance.isStageUnlocked(stage.id);
        const currentStage = StageAnnounceManager.Instance.getCurrentStage();

        if (this.labStageName) {
            this.labStageName.string = stage.name;
        }
        if (this.labStageDesc) {
            this.labStageDesc.string = stage.desc;
        }
        if (this.labStageIndex) {
            this.labStageIndex.string = `${this._currentIndex + 1} / ${STAGE_LIST.length}`;
        }
        if (this.labDifficulty) {
            this.labDifficulty.string = this.getDifficultyText(stage.difficultyMultiplier);
        }

        if (this.btnStart) {
            this.btnStart.node.active = unlocked;
        }
        if (this.btnUnlock) {
            this.btnUnlock.node.active = !unlocked;
        }
        if (this.lockIcon) {
            this.lockIcon.active = !unlocked;
        }
        if (this.labUnlockTip) {
            if (unlocked) {
                this.labUnlockTip.string = "";
            } else {
                this.labUnlockTip.string = this.getUnlockTip(stage);
            }
        }

        if (this.btnPrev) {
            this.btnPrev.interactable = this._currentIndex > 0;
        }
        if (this.btnNext) {
            this.btnNext.interactable = this._currentIndex < STAGE_LIST.length - 1;
        }
    }

    private getDifficultyText(multiplier: number): string {
        if (multiplier <= 1.0) return "简单";
        if (multiplier <= 1.3) return "普通";
        if (multiplier <= 1.6) return "困难";
        if (multiplier <= 2.0) return "噩梦";
        return "地狱";
    }

    private getUnlockTip(stage: StageData): string {
        const tips: string[] = [];
        if (stage.unlockKillCount > 0) {
            const totalKill = StorageUtil.getNumber("sgzy_total_kill", 0);
            tips.push(`累计击杀 ${totalKill}/${stage.unlockKillCount}`);
        }
        if (stage.unlockGold > 0) {
            const gold = StorageUtil.getNumber("sgzy_gold", 0);
            tips.push(`消耗 ${stage.unlockGold} 金币`);
        }
        return tips.join("，");
    }

    private onStartBattle() {
        const stage = STAGE_LIST[this._currentIndex];
        if (!stage) return;

        StageAnnounceManager.Instance.setCurrentStage(stage.id);
        StorageUtil.setNumber("sgzy_current_stage", stage.id);
        StorageUtil.setNumber("sgzy_stage_difficulty", stage.difficultyMultiplier);

        this.hide();
        AudioManager.Instance.playSfx("audio/sfx/select");

        if (this._onStartBattle) {
            this._onStartBattle();
        } else {
            const wx = (window as any).wx;
            if (wx) {
                wx.showToast({ title: `进入 ${stage.name}` });
            }
            director.loadScene("Battle");
        }
    }

    private onUnlockStage() {
        const stage = STAGE_LIST[this._currentIndex];
        if (!stage) return;

        const success = StageAnnounceManager.Instance.unlockStage(stage.id);
        if (success) {
            const wx = (window as any).wx;
            if (wx) {
                wx.showToast({ title: `${stage.name} 已解锁！` });
            }
            this.refreshStage();
        } else {
            const wx = (window as any).wx;
            if (wx) {
                wx.showToast({ title: "条件不足，无法解锁", icon: "none" });
            }
        }
    }

    private playShowAnimation() {
        if (!this.panel) return;
        this.panel.active = true;
        const opacity = this.panel.getComponent(UIOpacity);
        if (opacity) {
            opacity.opacity = 0;
            tween(opacity).to(0.3, { opacity: 255 }).start();
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