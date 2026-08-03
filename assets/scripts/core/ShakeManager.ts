import { _decorator, Node, Vec3 } from 'cc';
const { ccclass } = _decorator;

@ccclass("ShakeManager")
export class ShakeManager {
    private static instance:ShakeManager;
    private cameraNode:Node|null = null;
    private isShaking = false;
    private _shakeTime: number = 0;
    private _shakeDuration: number = 0;
    private _shakePower: number = 0;
    private _originPos: Vec3 = new Vec3();

    static get Instance(){
        if(!ShakeManager.instance) ShakeManager.instance = new ShakeManager();
        return ShakeManager.instance;
    }

    setCamera(camNode:Node){
        this.cameraNode = camNode;
    }

    shake(duration:number = 0.2, power:number = 6){
        if(!this.cameraNode || this.isShaking) return;
        this.isShaking = true;
        this._shakeTime = 0;
        this._shakeDuration = duration;
        this._shakePower = power;
        this._originPos.set(this.cameraNode.position);
    }

    update(dt: number) {
        if (!this.isShaking || !this.cameraNode) return;
        this._shakeTime += dt;
        if (this._shakeTime >= this._shakeDuration) {
            this.cameraNode.setPosition(this._originPos);
            this.isShaking = false;
            return;
        }
        const offsetX = (Math.random() - 0.5) * 2 * this._shakePower;
        const offsetY = (Math.random() - 0.5) * 2 * this._shakePower;
        this.cameraNode.setPosition(this._originPos.x + offsetX, this._originPos.y + offsetY);
    }
}