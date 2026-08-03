import { _decorator, Component, Node, Label, Button, UIOpacity, tween, Sprite, UITransform, Texture2D, SpriteFrame } from 'cc';
import { OpenDataManager } from '../core/OpenDataManager';
import { AudioManager } from '../core/AudioManager';
const { ccclass, property } = _decorator;

@ccclass("OpenDataRankUI")
export class OpenDataRankUI extends Component {
    @property(Node) panel: Node = null!;
    @property(Label) labTitle: Label = null!;
    @property(Node) sharedCanvasNode: Node = null!;
    @property(Button) btnFriend: Button = null!;
    @property(Button) btnGroup: Button = null!;
    @property(Button) btnClose: Button = null!;

    private _isShow: boolean = false;

    onLoad() {
        if (this.panel) {
            this.panel.active = false;
        }

        if (this.btnClose) {
            this.btnClose.node.on(Button.Event.CLICK, this.hide, this);
        }
        if (this.btnFriend) {
            this.btnFriend.node.on(Button.Event.CLICK, this.onFriendRank, this);
        }
        if (this.btnGroup) {
            this.btnGroup.node.on(Button.Event.CLICK, this.onGroupRank, this);
        }
    }

    onDestroy() {
        if (this.btnClose) {
            this.btnClose.node.off(Button.Event.CLICK, this.hide, this);
        }
        if (this.btnFriend) {
            this.btnFriend.node.off(Button.Event.CLICK, this.onFriendRank, this);
        }
        if (this.btnGroup) {
            this.btnGroup.node.off(Button.Event.CLICK, this.onGroupRank, this);
        }
    }

    show() {
        if (this._isShow) return;
        this._isShow = true;

        const wx = (window as any).wx;
        if (!wx || !OpenDataManager.Instance.isSupported) {
            this.showFallback();
            return;
        }

        this.playShowAnimation();
        this.onFriendRank();
    }

    hide() {
        if (!this._isShow) return;
        this._isShow = false;
        OpenDataManager.Instance.hideRank();
        this.playHideAnimation();
    }

    private onFriendRank() {
        if (!OpenDataManager.Instance.isSupported) return;
        OpenDataManager.Instance.showFriendRank();
        this.updateSharedCanvas();
        if (this.labTitle) this.labTitle.string = "好友排行榜";
    }

    private onGroupRank() {
        const wx = (window as any).wx;
        if (!wx || !OpenDataManager.Instance.isSupported) return;

        if (wx.getShareInfo) {
            wx.getShareInfo({
                shareTicket: "",
                success: (res: any) => {
                    console.log("OpenData: getShareInfo success", res);
                },
                fail: () => {
                    this.shareToGetGroupRank();
                }
            });
        } else {
            this.shareToGetGroupRank();
        }
    }

    private shareToGetGroupRank() {
        const wx = (window as any).wx;
        if (!wx) return;

        wx.shareAppMessage({
            title: "来看看谁在排行榜上最强！",
            withShareTicket: true,
            success: () => {
                if (wx.showToast) {
                    wx.showToast({ title: "分享成功，可查看群排行" });
                }
            }
        });
    }

    private updateSharedCanvas() {
        if (!this.sharedCanvasNode) return;

        const sharedCanvas = OpenDataManager.Instance.sharedCanvas;
        if (!sharedCanvas) return;

        this.schedule(() => {
            if (!this._isShow) return;

            const sprite = this.sharedCanvasNode.getComponent(Sprite);
            if (sprite) {
                try {
                    const texture = new Texture2D();
                    texture.reset({
                        width: sharedCanvas.width,
                        height: sharedCanvas.height,
                    });
                    texture.uploadData(sharedCanvas);
                    const sf = new SpriteFrame();
                    sf.texture = texture;
                    sprite.spriteFrame = sf;

                    const uiTransform = this.sharedCanvasNode.getComponent(UITransform);
                    if (uiTransform) {
                        uiTransform.setContentSize(sharedCanvas.width, sharedCanvas.height);
                    }
                } catch (e) {
                    // Textures may fail in some environments
                }
            }
        }, 0.1);
    }

    private showFallback() {
        const wx = (window as any).wx;
        if (wx && wx.showModal) {
            wx.showModal({
                title: "提示",
                content: "当前环境不支持好友排行榜",
                showCancel: false
            });
        }
    }

    private playShowAnimation() {
        if (!this.panel) return;
        this.panel.active = true;
        const opacity = this.panel.getComponent(UIOpacity);
        if (opacity) {
            opacity.opacity = 0;
            tween(opacity).to(0.25, { opacity: 255 }).start();
        }
    }

    private playHideAnimation() {
        if (!this.panel) return;
        const opacity = this.panel.getComponent(UIOpacity);
        if (opacity) {
            tween(opacity).to(0.2, { opacity: 0 }).call(() => {
                this.panel.active = false;
            }).start();
        } else {
            this.panel.active = false;
        }
    }
}