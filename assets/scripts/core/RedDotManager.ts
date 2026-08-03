import { _decorator } from 'cc';
import { EventManager } from './EventManager';
const { ccclass } = _decorator;

export enum RedDotType {
    ACHIEVEMENT = "achievement",
    SIGN_IN = "sign_in",
    REDEEM = "redeem",
    SHARE = "share",
    TALENT = "talent",
    HERO = "hero",
    DAILY_TASK = "daily_task",
    WEEKLY_TASK = "weekly_task"
}

export const RED_DOT_EVENT = "RED_DOT_CHANGED";

@ccclass("RedDotManager")
export class RedDotManager {
    private static instance: RedDotManager;
    private _dotStates: Map<string, boolean> = new Map();

    static get Instance() {
        if (!RedDotManager.instance) RedDotManager.instance = new RedDotManager();
        return RedDotManager.instance;
    }

    setDot(type: RedDotType, visible: boolean) {
        const prev = this._dotStates.get(type) || false;
        if (prev === visible) return;
        this._dotStates.set(type, visible);
        EventManager.Instance.emit(RED_DOT_EVENT, type, visible);
    }

    hasDot(type: RedDotType): boolean {
        return this._dotStates.get(type) || false;
    }

    clearAll() {
        this._dotStates.clear();
    }
}