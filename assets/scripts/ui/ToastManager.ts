import { _decorator, Component, Node, Label, UITransform, Color, tween, Vec3, UIOpacity, Prefab } from 'cc';
const { ccclass, property } = _decorator;

export enum ToastType {
    INFO = "info",
    SUCCESS = "success",
    WARNING = "warning",
    ERROR = "error"
}

export interface ToastConfig {
    message: string;
    type?: ToastType;
    duration?: number;
    position?: "top" | "center" | "bottom";
}

@ccclass('ToastManager')
export class ToastManager extends Component {
    @property({ tooltip: "Toast 预制体" })
    toastPrefab: Prefab | null = null;

    @property({ tooltip: "Toast 父节点" })
    toastContainer: Node | null = null;

    private static instance: ToastManager | null = null;
    private _queue: ToastConfig[] = [];
    private _isShowing: boolean = false;
    private _defaultDuration: number = 2000;

    static get Instance(): ToastManager {
        return ToastManager.instance!;
    }

    onLoad() {
        ToastManager.instance = this;
    }

    onDestroy() {
        ToastManager.instance = null;
    }

    static show(message: string, type: ToastType = ToastType.INFO, duration?: number) {
        const inst = ToastManager.Instance;
        if (!inst) {
            console.log(`[Toast] ${message}`);
            return;
        }
        inst._queue.push({ message, type, duration });
        inst.processQueue();
    }

    static info(message: string, duration?: number) {
        ToastManager.show(message, ToastType.INFO, duration);
    }

    static success(message: string, duration?: number) {
        ToastManager.show(message, ToastType.SUCCESS, duration);
    }

    static warning(message: string, duration?: number) {
        ToastManager.show(message, ToastType.WARNING, duration);
    }

    static error(message: string, duration?: number) {
        ToastManager.show(message, ToastType.ERROR, duration);
    }

    private processQueue() {
        if (this._isShowing || this._queue.length === 0) return;
        this._isShowing = true;
        const config = this._queue.shift()!;
        this.showToast(config);
    }

    private showToast(config: ToastConfig) {
        if (!this.toastContainer) return;

        const node = new Node("Toast");
        const uiTransform = node.addComponent(UITransform);
        const uiOpacity = node.addComponent(UIOpacity);
        const label = node.addComponent(Label);

        label.string = config.message;
        label.fontSize = 28;
        label.lineHeight = 36;
        uiTransform.setContentSize(500, 60);

        switch (config.type) {
            case ToastType.SUCCESS:
                label.color = new Color(76, 217, 100);
                break;
            case ToastType.WARNING:
                label.color = new Color(255, 204, 0);
                break;
            case ToastType.ERROR:
                label.color = new Color(255, 59, 48);
                break;
            default:
                label.color = new Color(255, 255, 255);
        }

        const containerTransform = this.toastContainer.getComponent(UITransform);
        let yPos = 0;
        if (containerTransform) {
            switch (config.position) {
                case "top":
                    yPos = containerTransform.height * 0.35;
                    break;
                case "bottom":
                    yPos = -containerTransform.height * 0.35;
                    break;
                default:
                    yPos = 0;
            }
        }
        node.setPosition(new Vec3(0, yPos, 0));

        this.toastContainer.addChild(node);
        uiOpacity.opacity = 0;

        const duration = (config.duration || this._defaultDuration) / 1000;
        tween(uiOpacity)
            .to(0.2, { opacity: 255 })
            .delay(duration)
            .to(0.3, { opacity: 0 })
            .call(() => {
                node.removeFromParent();
                node.destroy();
                this._isShowing = false;
                this.processQueue();
            })
            .start();
    }
}