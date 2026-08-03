import { _decorator, Component, Node, Button } from 'cc';
import { GameManager } from '../core/GameManager';
import { WeaponManager } from '../weapon/WeaponManager';
const { ccclass, property } = _decorator;

@ccclass('LevelUpSelectUI')
export class LevelUpSelectUI extends Component {
    @property(Button) btn1: Button = null!;
    @property(Button) btn2: Button = null!;

    onLoad() {
        this.node.active = false;
        this.registerBtn();
    }

    registerBtn() {
        this.btn1.node.on(Button.Event.CLICK, this.onBtn1Click, this);
        this.btn2.node.on(Button.Event.CLICK, this.onBtn2Click, this);
    }

    onDestroy() {
        this.btn1.node.off(Button.Event.CLICK, this.onBtn1Click, this);
        this.btn2.node.off(Button.Event.CLICK, this.onBtn2Click, this);
    }

    private onBtn1Click() {
        WeaponManager.Instance.addWeapon("spear");
        this.hideUI();
    }

    private onBtn2Click() {
        WeaponManager.Instance.addWeapon("summon_bai_er");
        this.hideUI();
    }

    showUI() {
        GameManager.Instance!.battlePause = true;
        this.node.active = true;
    }

    hideUI() {
        this.node.active = false;
        GameManager.Instance!.battlePause = false;
    }
}