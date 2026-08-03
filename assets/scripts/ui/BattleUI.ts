import { _decorator, Component, Button, director } from 'cc';
import { GameManager } from '../core/GameManager';
import { OfflineIncome } from '../utils/OfflineIncome';
const { ccclass, property } = _decorator;

@ccclass("BattleUI")
export class BattleUI extends Component {

    // 返回主菜单按钮绑定
    @property exitBtn: Button = null!;

    onLoad() {
        this.exitBtn.node.on(Button.Event.CLICK, this.onBackMenu, this);
    }

    onBackMenu() {
        OfflineIncome.saveExitTime();
        GameManager.Instance.battleOver();
        director.loadScene("MainMenu");
    }

    battleEnd() {
        GameManager.Instance.battleOver();
    }
}