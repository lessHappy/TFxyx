import { _decorator, Component, Node, Button } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SimplePanel')
export class SimplePanel extends Component {
    @property(Button) btnClose: Button = null!;

    onLoad() {
        if (this.btnClose) {
            this.btnClose.node.on(Button.Event.CLICK, () => {
                this.node.active = false;
            });
        }
    }
}