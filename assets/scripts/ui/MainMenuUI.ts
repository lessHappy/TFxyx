import { _decorator, Component, Button, Node } from 'cc';
import { director } from 'cc';
import { WeaponBookUI } from './WeaponBookUI';
import { RankUI } from './RankUI';
import { AudioManager } from '../core/AudioManager';
const { ccclass, property } = _decorator;

@ccclass("MainMenuUI")
export class MainMenuUI extends Component {
    @property(Button) startBtn: Button = null!;
    @property(Button) bookBtn: Button = null!;
    @property(Button) rankBtn: Button = null!;

    @property(WeaponBookUI) weaponBookUI: WeaponBookUI = null!;
    @property(RankUI) rankUI: RankUI = null!;

    onLoad() {
        AudioManager.Instance.playBgm("audio/bgm/main");
        this.startBtn.node.on(Button.Event.CLICK, this.onStartGame, this);
        this.bookBtn.node.on(Button.Event.CLICK, () => this.weaponBookUI.show());
        this.rankBtn.node.on(Button.Event.CLICK, () => this.rankUI.show());
    }

    onDestroy() {
        this.startBtn.node.off(Button.Event.CLICK, this.onStartGame, this);
    }

    onStartGame() {
        AudioManager.Instance.playSfx("audio/sfx/select");
        director.loadScene("Battle");
    }
}