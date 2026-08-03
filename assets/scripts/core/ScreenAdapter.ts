import { _decorator, Component, view, screen, Canvas, UITransform, Size, ResolutionPolicy } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ScreenAdapter')
export class ScreenAdapter extends Component {
    @property({ tooltip: "设计分辨率宽度" })
    designWidth: number = 750;

    @property({ tooltip: "设计分辨率高度" })
    designHeight: number = 1334;

    private _canvas: Canvas | null = null;
    private _initialized: boolean = false;

    onLoad() {
        this._canvas = this.node.getComponent(Canvas);
        if (!this._canvas) {
            this._canvas = this.node.addComponent(Canvas);
        }
        this.adapt();
        this._initialized = true;
    }

    onEnable() {
        if (this._initialized) {
            this.adapt();
        }
    }

    adapt() {
        const frameSize = screen.windowSize;
        const designRatio = this.designWidth / this.designHeight;
        const screenRatio = frameSize.width / frameSize.height;

        view.setDesignResolutionSize(this.designWidth, this.designHeight, ResolutionPolicy.FIXED_WIDTH);

        if (this._canvas) {
            this._canvas.fitWidth = true;
            this._canvas.fitHeight = true;
        }

        this.adjustSafeArea();
        this.logScreenInfo(frameSize, screenRatio, designRatio);
    }

    private adjustSafeArea() {
        const wx = (window as any).wx;
        if (!wx || !wx.getSystemInfoSync) return;

        try {
            const sysInfo = wx.getSystemInfoSync();
            const safeArea = sysInfo.safeArea;
            if (!safeArea) return;

            const uiTransform = this.node.getComponent(UITransform);
            if (!uiTransform) return;

            const screenHeight = sysInfo.screenHeight || sysInfo.windowHeight;
            const bottomInset = safeArea.bottom || 0;
            const bottomRatio = bottomInset / screenHeight;

            const designBottom = this.designHeight * bottomRatio;
            uiTransform.setContentSize(this.designWidth, this.designHeight - designBottom);
        } catch (e) {
            console.warn("[ScreenAdapter] 安全区域适配失败:", e);
        }
    }

    private logScreenInfo(frameSize: Size, screenRatio: number, designRatio: number) {
        console.log(`[ScreenAdapter] 屏幕: ${frameSize.width}x${frameSize.height}, 比例: ${screenRatio.toFixed(2)}, 设计比例: ${designRatio.toFixed(2)}`);

        if (screenRatio < 0.5) {
            console.warn("[ScreenAdapter] 极窄屏幕，注意UI布局");
        } else if (screenRatio > 2.2) {
            console.warn("[ScreenAdapter] 超宽屏幕，注意UI布局");
        }
    }

    getDesignSize(): { width: number; height: number } {
        return { width: this.designWidth, height: this.designHeight };
    }

    getScreenSize(): { width: number; height: number } {
        const frameSize = screen.windowSize;
        return { width: frameSize.width, height: frameSize.height };
    }

    getScaleFactor(): number {
        const frameSize = screen.windowSize;
        return Math.min(frameSize.width / this.designWidth, frameSize.height / this.designHeight);
    }
}