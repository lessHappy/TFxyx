import { _decorator, Component, Node, Vec2, input, Input, EventTouch } from 'cc';
import { JOYSTICK_CONFIG } from '../config/GameConfig';
import { Player } from '../entity/Player';
const { ccclass, property } = _decorator;

@ccclass("JoystickUI")
export class JoystickUI extends Component {
    @property(Node) stickBg:Node = null!;
    @property(Node) stickKnob:Node = null!;

    private originPos:Vec2 = new Vec2();
    private dir:Vec2 = new Vec2(0,0);
    private isTouch:boolean = false;
    private lastTapTime: number = 0;
    private readonly DOUBLE_TAP_TIME = 0.3;

    onLoad(){
        this.originPos = this.stickKnob.position as Vec2;
        this.node.on(Input.EventTouchStart, this.onTouchStart, this);
        this.node.on(Input.EventTouchMove, this.onTouchMove, this);
        this.node.on(Input.EventTouchEnd, this.onTouchEnd, this);
        this.node.on(Input.EventTouchCancel, this.onTouchEnd, this);
    }

    onDestroy() {
        this.node.off(Input.EventTouchStart, this.onTouchStart, this);
        this.node.off(Input.EventTouchMove, this.onTouchMove, this);
        this.node.off(Input.EventTouchEnd, this.onTouchEnd, this);
        this.node.off(Input.EventTouchCancel, this.onTouchEnd, this);
    }

    onTouchStart(event:EventTouch){
        // 双击检测 → 触发冲刺
        const now = Date.now() / 1000;
        if (now - this.lastTapTime < this.DOUBLE_TAP_TIME && Player.Instance) {
            Player.Instance.triggerDash();
        }
        this.lastTapTime = now;

        this.isTouch = true;
        this.onTouchMove(event);
    }

    onTouchMove(event:EventTouch){
        if (!this.isTouch) return;
        const touchPos = event.getUILocation();
        const bgPos = this.stickBg.getWorldPosition();
        let deltaX = touchPos.x - bgPos.x;
        let deltaY = touchPos.y - bgPos.y;

        const distance = Math.sqrt(deltaX*deltaX + deltaY*deltaY);
        const radius = JOYSTICK_CONFIG.maxRadius;

        if(distance > radius){
            const scale = radius / distance;
            deltaX *= scale;
            deltaY *= scale;
        }
        this.stickKnob.setPosition(deltaX, deltaY);
        this.dir.set(deltaX, deltaY).normalize();
    }

    onTouchEnd(){
        this.isTouch = false;
        this.dir.set(0,0);
        this.stickKnob.setPosition(this.originPos);
    }

    getMoveDir():Vec2{
        return this.dir;
    }

    update(deltaTime:number){
        if(!Player.Instance || !this.isTouch) return;
        Player.Instance.setMoveDir(this.dir);
    }
}