import { TutorialStep, TUTORIAL_STORAGE_KEY } from '../config/TutorialConfig';
import { StorageUtil } from './StorageUtil';
import { EventManager } from './EventManager';

export class TutorialManager {
    private static instance: TutorialManager;

    static get Instance(): TutorialManager {
        if (!TutorialManager.instance) {
            TutorialManager.instance = new TutorialManager();
        }
        return TutorialManager.instance;
    }

    private _doneTutorial: boolean = false;
    private _currentStep: TutorialStep | null = null;
    private _completedSteps: Set<TutorialStep> = new Set();
    private _loaded: boolean = false;

    private _onStepComplete: ((step: TutorialStep) => void) | null = null;
    private _onStepStart: ((step: TutorialStep) => void) | null = null;
    private _onTutorialEnd: (() => void) | null = null;

    load() {
        if (this._loaded) return;
        this._doneTutorial = StorageUtil.getBool(TUTORIAL_STORAGE_KEY, false);
        this._loaded = true;
    }

    private ensureLoaded() {
        if (!this._loaded) this.load();
    }

    isTutorialDone(): boolean {
        this.ensureLoaded();
        return this._doneTutorial;
    }

    hasCompletedStep(step: TutorialStep): boolean {
        this.ensureLoaded();
        return this._completedSteps.has(step);
    }

    startTutorial() {
        this.ensureLoaded();
        if (this._doneTutorial) return;

        this._completedSteps.clear();
        this._currentStep = null;
    }

    jumpToStep(step: TutorialStep): boolean {
        if (this._doneTutorial) return false;
        if (this._completedSteps.has(step)) return false;
        if (this._currentStep === step) return false;

        this._currentStep = step;
        if (this._onStepStart) {
            this._onStepStart(step);
        }
        return true;
    }

    completeStep(step: TutorialStep) {
        if (this._doneTutorial) return;
        if (this._completedSteps.has(step)) return;

        this._completedSteps.add(step);
        this._currentStep = null;

        if (this._onStepComplete) {
            this._onStepComplete(step);
        }

        const allSteps = [
            TutorialStep.MOVE,
            TutorialStep.KILL_ENEMY,
            TutorialStep.PICK_EXP,
            TutorialStep.SELECT_WEAPON
        ];

        const allDone = allSteps.every(s => this._completedSteps.has(s));
        if (allDone) {
            this.finishTutorial();
        }
    }

    finishTutorial() {
        this._doneTutorial = true;
        StorageUtil.setBool(TUTORIAL_STORAGE_KEY, true);
        this._currentStep = null;
        if (this._onTutorialEnd) {
            this._onTutorialEnd();
        }
    }

    setCallbacks(callbacks: {
        onStepStart?: (step: TutorialStep) => void;
        onStepComplete?: (step: TutorialStep) => void;
        onTutorialEnd?: () => void;
    }) {
        this._onStepStart = callbacks.onStepStart || null;
        this._onStepComplete = callbacks.onStepComplete || null;
        this._onTutorialEnd = callbacks.onTutorialEnd || null;
    }

    isActive(): boolean {
        return !this._doneTutorial && this._currentStep !== null;
    }

    getCurrentStep(): TutorialStep | null {
        return this._currentStep;
    }
}