import { _decorator, Component, Button, Node, Label, instantiate } from 'cc';
import { getWeaponBookList } from '../config/WeaponConfig';
import { Player } from '../entity/Player';
const { ccclass, property } = _decorator;

@ccclass("WeaponBookUI")
export class WeaponBookUI extends Component {
    @property(Node) itemPrefab: Node = null!;
    @property(Node) content: Node = null!;
    @property(Button) closeBtn: Button = null!;

    onLoad() {
        this.closeBtn.node.on(Button.Event.CLICK, () => this.node.active = false);
        this.node.active = false;
    }

    show() {
        this.node.active = true;
        this.refreshBook();
    }

    refreshBook() {
        this.content.removeAllChildren();
        const weaponList = getWeaponBookList();
        const playerLv = Player.Instance ? Player.Instance.level : 1;

        for (const info of weaponList) {
            const node = instantiate(this.itemPrefab);
            node.active = true;
            node.setParent(this.content);

            const nameLab = node.getChildByName("Name")!.getComponent(Label)!;
            const descLab = node.getChildByName("Desc")!.getComponent(Label)!;
            const lockLab = node.getChildByName("LockTip")!.getComponent(Label)!;

            nameLab.string = info.name;
            descLab.string = info.desc;

            const isUnlock = playerLv >= info.unlockLevel;
            lockLab.node.active = !isUnlock;
            if (!isUnlock) {
                lockLab.string = `等级${info.unlockLevel}解锁`;
            }
        }
    }
}