import { _decorator, Component, Node, Button, Label } from 'cc';
import { GameManager } from '../core/GameManager';
import { WeaponManager } from '../weapon/WeaponManager';
import { Player } from '../entity/Player';
import { HeroManager } from '../core/HeroManager';
const { ccclass, property } = _decorator;

@ccclass('LevelUpSelectUI')
export class LevelUpSelectUI extends Component {
    @property(Button) btn1: Button = null!;
    @property(Button) btn2: Button = null!;
    @property(Label) btn1Label: Label = null!;
    @property(Label) btn2Label: Label = null!;

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
        this.refreshOptions();
    }

    hideUI() {
        this.node.active = false;
        GameManager.Instance!.battlePause = false;
    }

    private refreshOptions() {
        const player = Player.Instance;
        const heroData = HeroManager.Instance.getSelectedHeroData();
        const canUpgradeSkill = player && player.getHeroSkillLevel() < player.getHeroSkillMaxLevel();

        if (canUpgradeSkill && this.btn1Label) {
            this.btn1Label.string = `强化技能: ${heroData.skillName} Lv${player.getHeroSkillLevel()}/${player.getHeroSkillMaxLevel()}`;
        }
        if (this.btn2Label) {
            this.btn2Label.string = "获得武器: 士兵符";
        }
    }
}