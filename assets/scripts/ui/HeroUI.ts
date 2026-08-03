import { _decorator, Component, Node, Label, Button, Sprite, ScrollView, Prefab, instantiate, UIOpacity, tween, Color } from 'cc';
import { HeroType, HERO_CONFIG, HERO_ORDER, HeroData } from '../config/HeroConfig';
import { HeroManager } from '../core/HeroManager';
import { StorageUtil } from '../core/StorageUtil';
import { AudioManager } from '../core/AudioManager';
import { WxAdHelper } from '../core/WxAdHelper';
import { AdRewardType } from '../config/AdConfig';
const { ccclass, property } = _decorator;

export interface HeroUICallback {
    onHeroChanged: (heroType: HeroType) => void;
}

@ccclass("HeroUI")
export class HeroUI extends Component {
    @property(Node) panel: Node = null!;
    @property(ScrollView) scrollView: ScrollView = null!;
    @property(Node) content: Node = null!;
    @property(Prefab) heroItemPrefab: Prefab = null!;

    @property(Label) labSelectedName: Label = null!;
    @property(Label) labSelectedTitle: Label = null!;
    @property(Label) labSelectedDesc: Label = null!;
    @property(Label) labSelectedSkill: Label = null!;
    @property(Label) labSelectedStats: Label = null!;
    @property(Sprite) selectedHeroIcon: Sprite = null!;

    @property(Button) btnSelect: Button = null!;
    @property(Label) labBtnSelect: Label = null!;

    private _currentSelect: HeroType = HeroType.ZHAO_YUN;
    private _itemNodes: Node[] = [];
    private _callback: HeroUICallback | null = null;

    onLoad() {
        if (this.panel) {
            this.panel.active = false;
            const opacity = this.panel.getComponent(UIOpacity);
            if (!opacity) {
                this.panel.addComponent(UIOpacity);
            }
        }
    }

    init(callback: HeroUICallback) {
        this._callback = callback;
    }

    show() {
        if (!this.panel) return;
        HeroManager.Instance.load();
        this._currentSelect = HeroManager.Instance.getSelectedHero();
        this.refreshItemList();
        this.refreshDetail();
        this.playShowAnimation();
        AudioManager.Instance.playSfx("audio/sfx/select");
    }

    hide() {
        if (!this.panel) return;
        this.panel.active = false;
        this.clearItems();
        AudioManager.Instance.playSfx("audio/sfx/select");
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

    private clearItems() {
        if (!this.content) return;
        for (const node of this._itemNodes) {
            node.destroy();
        }
        this._itemNodes = [];
    }

    private refreshItemList() {
        this.clearItems();
        if (!this.content || !this.heroItemPrefab) return;

        for (const heroType of HERO_ORDER) {
            const cfg = HERO_CONFIG[heroType];
            const itemNode = instantiate(this.heroItemPrefab);
            itemNode.setParent(this.content);
            this._itemNodes.push(itemNode);
            this.setupItem(itemNode, heroType, cfg);
        }
    }

    private setupItem(node: Node, heroType: HeroType, cfg: HeroData) {
        const nameLabel = this.findLabel(node, "Name");
        if (nameLabel) nameLabel.string = cfg.name;

        const lockNode = this.findNode(node, "Lock");
        const selectNode = this.findNode(node, "Selected");
        const isUnlocked = HeroManager.Instance.isUnlocked(heroType);

        if (lockNode) lockNode.active = !isUnlocked;
        if (selectNode) {
            selectNode.active = (heroType === this._currentSelect && isUnlocked);
        }

        const icon = this.findSprite(node, "Icon");
        if (icon) {
            if (!isUnlocked) {
                icon.color = new Color(60, 60, 60, 255);
            }
        }

        const btn = node.getComponent(Button);
        if (btn) {
            btn.node.on(Button.Event.CLICK, () => {
                if (isUnlocked) {
                    this.selectHero(heroType);
                } else {
                    this.onTryUnlock(heroType);
                }
            }, this);
        }
    }

    private selectHero(heroType: HeroType) {
        if (heroType === this._currentSelect) return;
        this._currentSelect = heroType;
        this.refreshItemList();
        this.refreshDetail();
        AudioManager.Instance.playSfx("audio/sfx/select");
    }

    private onTryUnlock(heroType: HeroType) {
        const cfg = HERO_CONFIG[heroType];
        if (cfg.unlockType === "ad") {
            WxAdHelper.showRewardAd(AdRewardType.DOUBLE_BUFF, () => {
                HeroManager.Instance.unlock(heroType);
                this._currentSelect = heroType;
                this.refreshItemList();
                this.refreshDetail();
                const wx = (window as any).wx;
                if (wx) wx.showToast({ title: `解锁成功：${cfg.name}` });
            }, () => {
                const wx = (window as any).wx;
                if (wx) wx.showToast({ title: "广告未完整观看" });
            });
        } else {
            const wx = (window as any).wx;
            if (wx) {
                const needMap: Record<string, string> = {
                    kill: `累计击杀${cfg.unlockValue}只敌人`,
                    gold: `累计获得${cfg.unlockValue}金币`,
                    survive: `累计生存${Math.floor(cfg.unlockValue / 60)}分钟`
                };
                wx.showToast({ title: `解锁条件：${needMap[cfg.unlockType] || "未知"}` });
            }
        }
    }

    private refreshDetail() {
        const cfg = HERO_CONFIG[this._currentSelect];
        const isUnlocked = HeroManager.Instance.isUnlocked(this._currentSelect);
        const isSelected = this._currentSelect === HeroManager.Instance.getSelectedHero();

        if (this.labSelectedName) this.labSelectedName.string = cfg.name;
        if (this.labSelectedTitle) this.labSelectedTitle.string = cfg.title;
        if (this.labSelectedDesc) this.labSelectedDesc.string = cfg.desc;
        if (this.labSelectedSkill) {
            this.labSelectedSkill.string = `【${cfg.skillName}】${cfg.skillDesc}`;
        }

        if (this.labSelectedStats) {
            const parts: string[] = [];
            if (cfg.hpBonus !== 1.0) parts.push(`生命 ${this.formatBonus(cfg.hpBonus)}`);
            if (cfg.moveSpeedBonus !== 1.0) parts.push(`移速 ${this.formatBonus(cfg.moveSpeedBonus)}`);
            if (cfg.damageBonus !== 1.0) parts.push(`攻击 ${this.formatBonus(cfg.damageBonus)}`);
            if (cfg.attackSpeedBonus !== 1.0) parts.push(`攻速 ${this.formatBonus(cfg.attackSpeedBonus)}`);
            if (cfg.expBonus !== 1.0) parts.push(`经验 ${this.formatBonus(cfg.expBonus)}`);
            this.labSelectedStats.string = parts.length > 0 ? parts.join("  ") : "均衡属性";
        }

        if (this.btnSelect && this.labBtnSelect) {
            if (!isUnlocked) {
                this.btnSelect.interactable = true;
                if (cfg.unlockType === "ad") {
                    this.labBtnSelect.string = "看广告解锁";
                } else {
                    this.labBtnSelect.string = "未解锁";
                }
            } else if (isSelected) {
                this.btnSelect.interactable = false;
                this.labBtnSelect.string = "当前英雄";
            } else {
                this.btnSelect.interactable = true;
                this.labBtnSelect.string = "选择英雄";
            }
        }
    }

    onBtnSelectClick() {
        const isUnlocked = HeroManager.Instance.isUnlocked(this._currentSelect);
        if (!isUnlocked) {
            this.onTryUnlock(this._currentSelect);
            return;
        }
        if (this._currentSelect === HeroManager.Instance.getSelectedHero()) return;

        HeroManager.Instance.selectHero(this._currentSelect);
        this.refreshDetail();
        this.refreshItemList();

        if (this._callback) {
            this._callback.onHeroChanged(this._currentSelect);
        }

        const wx = (window as any).wx;
        if (wx) wx.showToast({ title: `已选择 ${HERO_CONFIG[this._currentSelect].name}` });
        AudioManager.Instance.playSfx("audio/sfx/levelup");
    }

    private formatBonus(value: number): string {
        const pct = Math.round((value - 1) * 100);
        return pct >= 0 ? `+${pct}%` : `${pct}%`;
    }

    private findLabel(parent: Node, name: string): Label | null {
        const child = parent.getChildByName(name);
        return child ? child.getComponent(Label) : null;
    }

    private findSprite(parent: Node, name: string): Sprite | null {
        const child = parent.getChildByName(name);
        return child ? child.getComponent(Sprite) : null;
    }

    private findNode(parent: Node, name: string): Node | null {
        return parent.getChildByName(name) || null;
    }
}