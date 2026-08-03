import { _decorator, director } from 'cc';
import { FRAME_CONFIG } from '../config/GameConfig';
import { GameManager } from './GameManager';
const { ccclass } = _decorator;

@ccclass("FrameRateManager")
export class FrameRateManager {
    private static instance:FrameRateManager;
    private checkTimer:number = 0;
    private static readonly CHECK_INTERVAL = 2.0;
    private _currentFps: number = FRAME_CONFIG.normalFps;

    static get Instance(){
        if(!FrameRateManager.instance) FrameRateManager.instance = new FrameRateManager();
        return FrameRateManager.instance;
    }

    update(dt:number){
        this.checkTimer += dt;
        if(this.checkTimer < FrameRateManager.CHECK_INTERVAL) return;
        this.checkTimer = 0;

        if(!GameManager.Instance) return;
        const enemyCount = GameManager.Instance.enemyList.length;

        const targetFps = enemyCount >= FRAME_CONFIG.heavyThreshold
            ? FRAME_CONFIG.lowFps
            : FRAME_CONFIG.normalFps;

        if (targetFps !== this._currentFps) {
            this._currentFps = targetFps;
            director.setFrameRate(targetFps);
        }
    }

    //切场景恢复标准帧率
    reset(){
        this._currentFps = FRAME_CONFIG.normalFps;
        director.setFrameRate(FRAME_CONFIG.normalFps);
        this.checkTimer = 0;
    }
}