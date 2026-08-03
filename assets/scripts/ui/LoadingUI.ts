import { _decorator, Component, Node, Label, UIOpacity, tween, director, ProgressBar, Sprite } from 'cc';
import { AudioManager } from '../core/AudioManager';
const { ccclass, property } = _decorator;

const LOADING_TIPS = [
    "赵云：吾乃常山赵子龙！",
    "敌军围困万千重，我自岿然不动",
    "长坂坡上，七进七出，谁人能挡？",
    "一身是胆，单骑救主",
    "子龙一身都是胆也！",
    "敌将休走，吃我一枪！",
    "银枪白马，所向披靡",
    "血染征袍透甲红，当阳谁敢与争锋",
    "古来冲阵扶危主，只有常山赵子龙",
    "大丈夫生于天地间，岂能郁郁久居人下",
    "提示：拾取经验宝石可以升级武器",
    "提示：击杀Boss会掉落宝箱",
    "提示：连杀可获得额外经验加成",
    "提示：合理选择武器搭配是通关关键",
    "提示：升级天赋可以大幅提升战斗力"
];

@ccclass("LoadingUI")
export class LoadingUI extends Component {
    private static _instance: LoadingUI | null = null;

    static get Instance(): LoadingUI | null {
        return LoadingUI._instance;
    }

    @property(Node) panel: Node = null!;
    @property(ProgressBar) progressBar: ProgressBar = null!;
    @property(Label) labProgress: Label = null!;
    @property(Label) labTip: Label = null!;
    @property(Label) labTitle: Label = null!;
    @property(Sprite) bgSprite: Sprite = null!;

    private _isShow: boolean = false;
    private _tipTimer: number = 0;
    private _tipInterval: number = 3.0;
    private _currentTipIndex: number = 0;

    onLoad() {
        LoadingUI._instance = this;
        if (this.panel) {
            this.panel.active = false;
        }
    }

    onDestroy() {
        if (LoadingUI._instance === this) {
            LoadingUI._instance = null;
        }
    }

    update(dt: number) {
        if (!this._isShow) return;
        this._tipTimer += dt;
        if (this._tipTimer >= this._tipInterval) {
            this._tipTimer = 0;
            this.showNextTip();
        }
    }

    show(title?: string) {
        if (this._isShow) return;
        this._isShow = true;

        if (this.labTitle && title) {
            this.labTitle.string = title;
        } else if (this.labTitle) {
            this.labTitle.string = "加载中...";
        }

        this.setProgress(0);
        this._currentTipIndex = Math.floor(Math.random() * LOADING_TIPS.length);
        this.refreshTip();
        this._tipTimer = 0;

        this.playShowAnimation();
    }

    hide() {
        if (!this._isShow) return;
        this._isShow = false;
        this.playHideAnimation();
    }

    setProgress(progress: number) {
        if (this.progressBar) {
            this.progressBar.progress = Math.max(0, Math.min(1, progress));
        }
        if (this.labProgress) {
            this.labProgress.string = `${Math.floor(progress * 100)}%`;
        }
    }

    setTip(text: string) {
        if (this.labTip) {
            this.labTip.string = text;
        }
    }

    private refreshTip() {
        if (this.labTip) {
            this.labTip.string = LOADING_TIPS[this._currentTipIndex];
        }
    }

    private showNextTip() {
        this._currentTipIndex = (this._currentTipIndex + 1) % LOADING_TIPS.length;
        this.refreshTip();

        const opacity = this.labTip?.getComponent(UIOpacity);
        if (opacity) {
            opacity.opacity = 0;
            tween(opacity).to(0.4, { opacity: 255 }).start();
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
            tween(opacity).to(0.3, { opacity: 0 }).call(() => {
                this.panel.active = false;
            }).start();
        } else {
            this.panel.active = false;
        }
    }

    static async loadSceneWithLoading(
        sceneName: string,
        subPackageName?: string,
        loadingTitle?: string,
        onProgress?: (progress: number) => void
    ): Promise<void> {
        const loadingUI = LoadingUI._instance;
        if (loadingUI) {
            loadingUI.show(loadingTitle);
        }

        const wx = (window as any).wx;

        if (subPackageName && wx && wx.loadSubpackage) {
            try {
                await new Promise<void>((resolve, reject) => {
                    const task = wx.loadSubpackage({
                        name: subPackageName,
                        success: () => resolve(),
                        fail: (err: any) => reject(err)
                    });

                    if (task && task.onProgressUpdate) {
                        task.onProgressUpdate((res: any) => {
                            const progress = res.progress / 100;
                            if (loadingUI) loadingUI.setProgress(progress);
                            if (onProgress) onProgress(progress);
                        });
                    }
                });

                if (loadingUI) loadingUI.setProgress(0.5);

                await new Promise<void>(resolve => {
                    director.preloadScene(sceneName, (completed, total) => {
                        const progress = 0.5 + (completed / total) * 0.5;
                        if (loadingUI) loadingUI.setProgress(progress);
                        if (onProgress) onProgress(progress);
                    }, () => {
                        resolve();
                    });
                });
            } catch (err) {
                console.error("[LoadingUI] 分包加载失败:", err);
                if (loadingUI) loadingUI.hide();
                if (wx) wx.showToast({ title: "资源加载失败，请重启游戏", icon: "none" });
                return;
            }
        } else {
            await new Promise<void>(resolve => {
                director.preloadScene(sceneName, (completed, total) => {
                    const progress = completed / total;
                    if (loadingUI) loadingUI.setProgress(progress);
                    if (onProgress) onProgress(progress);
                }, () => {
                    resolve();
                });
            });
        }

        if (loadingUI) loadingUI.setProgress(1);
        await new Promise(r => setTimeout(r, 200));

        if (loadingUI) loadingUI.hide();
        await new Promise(r => setTimeout(r, 350));

        director.loadScene(sceneName);
    }
}