import { _decorator } from 'cc';
import { EventTarget } from 'cc';
const { ccclass } = _decorator;

export enum GameEvent {
    PLAYER_LEVEL_UP = "PLAYER_LEVEL_UP",
    PLAYER_DEAD = "PLAYER_DEAD",
    ENEMY_DIE = "ENEMY_DIE",
    BATTLE_OVER = "BATTLE_OVER"
}

@ccclass('EventManager')
export class EventManager {
    private static instance: EventManager;
    public static get Instance() {
        if (!EventManager.instance) {
            EventManager.instance = new EventManager();
        }
        return EventManager.instance;
    }

    private emitter: EventTarget = new EventTarget();

    on(event: string, callback: Function, target?: any) {
        this.emitter.on(event, callback, target);
    }

    off(event: string, callback: Function, target?: any) {
        this.emitter.off(event, callback, target);
    }

    emit(event: string, ...args: any[]) {
        this.emitter.emit(event, ...args);
    }
}