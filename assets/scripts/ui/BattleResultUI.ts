import { _decorator, Component, Label, Button, director } from 'cc';
import { GameManager } from '../core/GameManager';
import { EventManager, GameEvent } from '../core/EventManager';
const { ccclass, property } = _decorator;

@ccclass('BattleResultUI')
export class BattleResultUI extends Component {
    @property(Label) labKill: Label = null!;
    @property(Label) labTime: Label = null!;
    @property(Label) labGold: Label = null!;
    @property(Button) btnBackMenu: Button = null!;

    onLoad() {
        EventManager.Instance.on(GameEvent.PLAYER_DEAD, this.showResult, this);
        this.node.active = false;
        this.btnBackMenu.node.on(Button.Event.CLICK, () => {
            GameManager.Instance?.battleOver();
            director.loadScene("MainMenu");
        });
    }

    showResult() {
        const gm = GameManager.Instance!;
        this.labKill.string = `击杀数量：${gm.totalKillCount}`;
        const min = Math.floor(gm.battleTime / 60);
        const sec = Math.floor(gm.battleTime % 60);
        this.labTime.string = `生存时间：${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
        if (this.labGold) {
            this.labGold.string = `获得金币：${gm.totalGold}`;
        }
        this.node.active = true;
    }

    onDestroy() {
        EventManager.Instance.off(GameEvent.PLAYER_DEAD, this.showResult, this);
    }
}