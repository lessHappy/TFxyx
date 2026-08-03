import { _decorator, Component, Node, Label, Sprite, UITransform, tween, UIOpacity, Vec3, Color, Graphics, view, input, Input } from 'cc';
import { TutorialStep, TUTORIAL_STEPS, TutorialStepData } from '../config/TutorialConfig';
import { TutorialManager } from '../core/TutorialManager';
const { ccclass, property } = _decorator;

@ccclass("TutorialUI")
export class TutorialUI extends Component {
    @property(Node) maskNode: Node = null!;
    @property(Node) fingerNode: Node = null!;
    @property(Label) labText: Label = null!;
    @property(Node) arrowNode: Node = null!;
    @property(Node) textBgNode: Node = null!;

    private _currentStep: TutorialStep | null = null;
    private _autoTimer: number = 0;
    private _isActive: boolean = false;

    onLoad() {
        if (this.maskNode) this.maskNode.active = false;
        if (this.fingerNode) this.fingerNode.active = false;
        if (this.textBgNode) this.textBgNode.active = false;
        if (this.arrowNode) this.arrowNode.active = false;

        TutorialManager.Instance.setCallbacks({
            onStepStart: (step) => this.showStep(step),
            onStepComplete: (step) => this.hideStep(),
            onTutorialEnd: () => this.onTutorialFinish()
        });
    }

    onDestroy() {
        TutorialManager.Instance.setCallbacks({});
    }

    update(dt: number) {
        if (!this._isActive) return;

        const stepData = this.getStepData(this._currentStep);
        if (stepData && stepData.autoNextAfter > 0) {
            this._autoTimer += dt;
            if (this._autoTimer >= stepData.autoNextAfter) {
                this.completeCurrentStep();
            }
        }
    }

    private getStepData(step: TutorialStep | null): TutorialStepData | undefined {
        if (!step) return undefined;
        return TUTORIAL_STEPS.find(s => s.id === step);
    }

    showStep(step: TutorialStep) {
        this._currentStep = step;
        this._isActive = true;
        this._autoTimer = 0;

        const stepData = this.getStepData(step);
        if (!stepData) return;

        this.refreshUI(stepData);
        this.playShowAnimation();
    }

    private refreshUI(data: TutorialStepData) {
        if (this.maskNode) {
            this.maskNode.active = true;
            const opacity = this.maskNode.getComponent(UIOpacity);
            if (opacity) opacity.opacity = 0;
        }

        if (this.fingerNode) {
            this.fingerNode.active = true;
            this.fingerNode.setPosition(data.arrowOffsetX, data.arrowOffsetY, 0);
            this.startFingerAnimation();
        }

        if (this.arrowNode) {
            this.arrowNode.active = true;
            this.arrowNode.setPosition(data.arrowOffsetX, data.arrowOffsetY, 0);
            this.arrowNode.setRotationFromEuler(0, 0, data.arrowRotation);
        }

        if (this.textBgNode) {
            this.textBgNode.active = true;
            this.textBgNode.setPosition(
                data.arrowOffsetX,
                data.arrowOffsetY + (data.arrowRotation > 0 ? 60 : -60),
                0
            );
        }

        if (this.labText) {
            this.labText.string = data.text;
        }
    }

    private startFingerAnimation() {
        if (!this.fingerNode) return;
        const startPos = this.fingerNode.position.clone();
        tween(this.fingerNode)
            .to(0.4, { position: new Vec3(startPos.x + 15, startPos.y + 15, 0) })
            .to(0.4, { position: startPos })
            .union()
            .repeatForever()
            .start();
    }

    private playShowAnimation() {
        if (this.maskNode) {
            const opacity = this.maskNode.getComponent(UIOpacity);
            if (opacity) {
                tween(opacity).to(0.3, { opacity: 128 }).start();
            }
        }
        if (this.textBgNode) {
            const scale = this.textBgNode.scale.clone();
            this.textBgNode.setScale(0.5, 0.5, 1);
            tween(this.textBgNode).to(0.3, { scale: scale }).start();
        }
    }

    hideStep() {
        this._isActive = false;
        this._autoTimer = 0;

        if (this.maskNode) {
            const opacity = this.maskNode.getComponent(UIOpacity);
            if (opacity) {
                tween(opacity).to(0.2, { opacity: 0 }).call(() => {
                    this.maskNode.active = false;
                }).start();
            } else {
                this.maskNode.active = false;
            }
        }

        if (this.fingerNode) {
            tween(this.fingerNode).stop();
            this.fingerNode.active = false;
        }
        if (this.arrowNode) {
            this.arrowNode.active = false;
        }
        if (this.textBgNode) {
            this.textBgNode.active = false;
        }
    }

    completeCurrentStep() {
        if (!this._currentStep) return;
        const step = this._currentStep;
        TutorialManager.Instance.completeStep(step);
    }

    private onTutorialFinish() {
        this.hideStep();
        this._currentStep = null;
    }
}