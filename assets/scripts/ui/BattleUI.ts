import { _decorator, Component, Button, director } from 'cc';
import { GameManager } from '../core/GameManager';
import { OfflineIncome } from '../utils/OfflineIncome';
import { StorageUtil } from '../core/StorageUtil';
import { RankUI } from './RankUI';
import { AudioManager } from '../core/AudioManager';
const { ccclass, property } = _decorator;

@ccclass("BattleUI")
export class BattleUI extends Component {
    @property exitBtn: Button = null!;

    onLoad() {
        this.exitBtn.node.on(Button.Event.CLICK, this.onBackMenu, this);
    }

    onBackMenu() {
        OfflineIncome.saveExitTime();
        AudioManager.Instance.playSfx("audio/sfx/select");

        const gm = GameManager.Instance;
        if (gm && !gm.gameOver) {
            if (gm.totalGold > 0) {
                const currentGold = StorageUtil.getNumber("sgzy_gold", 0);
                StorageUtil.setNumber("sgzy_gold", currentGold + gm.totalGold);
            }
            if (gm.totalKillCount > 0) {
                RankUI.saveRecord({
                    kill: gm.totalKillCount,
                    time: Math.floor(gm.battleTime),
                    gold: gm.totalGold
                });
            }
        }

        gm?.battleOver();
        director.loadScene("MainMenu");
    }

    battleEnd() {
        GameManager.Instance?.battleOver();
    }
}