import { OFFLINE_CONFIG } from '../config/GameConfig';
import { StorageUtil } from '../core/StorageUtil';

export class OfflineIncome {
    private static readonly KEY_LAST_EXIT = "lastExitTime";

    //游戏退出时记录时间戳
    static saveExitTime(){
        const time = Math.floor(Date.now()/1000);
        StorageUtil.setNumber(OfflineIncome.KEY_LAST_EXIT, time);
    }

    //登录结算离线金币
    static calcOfflineGold():number{
        const lastTime = StorageUtil.getNumber(OfflineIncome.KEY_LAST_EXIT,0);
        if(lastTime === 0) return 0;
        const now = Math.floor(Date.now()/1000);
        let diffSecond = now - lastTime;

        const maxSecond = OFFLINE_CONFIG.maxOfflineHour * 3600;
        if(diffSecond > maxSecond) diffSecond = maxSecond;

        const minute = diffSecond / 60;
        const gold = Math.floor(minute * OFFLINE_CONFIG.incomePerMin);
        //结算后清空，防止重复领取
        StorageUtil.setNumber(OfflineIncome.KEY_LAST_EXIT, now);
        return gold;
    }
}