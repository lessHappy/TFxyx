import { _decorator, Component, Node, Label, Button, ScrollView, Prefab, instantiate, UIOpacity, tween, Vec3, Color, Sprite, ProgressBar } from 'cc';
import { TalentType, TALENT_CONFIG, TALENT_TAB_CONFIG, TalentData } from '../config/TalentConfig';
import { TalentManager, TalentState } from '../core/TalentManager';
import { StorageUtil } from '../core/StorageUtil';
import { AudioManager } from '../core/AudioManager';
import { AchievementManager } from '../core/AchievementManager';
import { ACHIEVEMENT_STORAGE_KEYS } from '../config/AchievementConfig';
const { ccclass, property } = _decorator;

const GOLD_KEY = "sgzy_gold";
const RESET_HOLD_TIME = 1.5;

export interface TalentUpgradeCallback {
    onGoldChanged: (gold: number) => void;
}

@ccclass("TalentUI")
export class TalentUI extends Component {
    @property(Node) panel: Node = null!;
    @property(Node) tabContainer: Node = null!;
    @property(ScrollView) scrollView: ScrollView = null!;
    @property(Node) content: Node = null!;
    @property(Prefab) talentItemPrefab: Prefab = null!;
    @property(Prefab) tabBtnPrefab: Prefab = null!;
    @property(Label) labGold: Label = null!;
    @property(Label) labTotalBonus: Label = null!;
    @property(Label) labTotalLevel: Label = null!;
    @property(Button) btnReset: Button = null!;

    private _currentTab: number = 0;
    private _goldNum: number = 0;
    private _itemNodes: Node[] = [];
    private _tabNodes: Node[] = [];
    private _upgradeCallback: TalentUpgradeCallback | null = null;
    private _resetHoldTimer: number = 0;
    private _resetHolding: boolean = false;

    onLoad() {
        if (this.panel) {
            this.panel.active = false;
            const opacity = this.panel.getComponent(UIOpacity);
            if (!opacity) {
                this.panel.addComponent(UIOpacity);
            }
        }
    }

    init(callback: TalentUpgradeCallback) {
        this._upgradeCallback = callback;
        this.createTabs();
        this.initResetBtn();
    }

    show() {
        if (!this.panel) return;
        TalentManager.Instance.load();
        this._goldNum = StorageUtil.getNumber(GOLD_KEY, 0);
        this.refreshGoldLabel();
        this.refreshTotalBonus();
        this.refreshTotalLevelUI();
        this._currentTab = 0;
        this.switchTab(0);
        this.playShowAnimation();
        AudioManager.Instance.playSfx("audio/sfx/select");
    }

    hide() {
        if (!this.panel) return;
        this.panel.active = false;
        this.clearItems();
        AudioManager.Instance.playSfx("audio/sfx/select");
    }

    update(dt: number) {
        if (!this._resetHolding) return;
        this._resetHoldTimer += dt;
        if (this._resetHoldTimer >= RESET_HOLD_TIME) {
            this._resetHolding = false;
            this._resetHoldTimer = 0;
            this.doReset();
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

    private createTabs() {
        if (!this.tabContainer || !this.tabBtnPrefab) return;
        this.tabContainer.removeAllChildren();
        this._tabNodes = [];

        for (let i = 0; i < TALENT_TAB_CONFIG.length; i++) {
            const tabCfg = TALENT_TAB_CONFIG[i];
            const tabNode = instantiate(this.tabBtnPrefab);
            tabNode.setParent(this.tabContainer);
            this._tabNodes.push(tabNode);

            const label = tabNode.getComponentInChildren(Label);
            if (label) label.string = tabCfg.label;

            const idx = i;
            const btn = tabNode.getComponent(Button);
            if (btn) {
                btn.node.on(Button.Event.CLICK, () => this.switchTab(idx), this);
            }
        }
    }

    private switchTab(index: number) {
        this._currentTab = index;
        this.updateTabHighlights();
        this.refreshItems();
    }

    private updateTabHighlights() {
        for (let i = 0; i < this._tabNodes.length; i++) {
            const tabNode = this._tabNodes[i];
            const sprite = tabNode.getComponent(Sprite);
            const label = tabNode.getComponentInChildren(Label);
            if (label) {
                if (i === this._currentTab) {
                    label.color = new Color(255, 215, 0, 255);
                } else {
                    label.color = new Color(180, 180, 180, 255);
                }
            }
            if (sprite) {
                if (i === this._currentTab) {
                    sprite.color = new Color(255, 215, 0, 255);
                } else {
                    sprite.color = new Color(100, 100, 100, 255);
                }
            }
        }
    }

    private clearItems() {
        if (!this.content) return;
        for (const node of this._itemNodes) {
            node.destroy();
        }
        this._itemNodes = [];
    }

    private refreshItems() {
        const savedScrollOffset = this.scrollView ? this.scrollView.getScrollOffset() : null;
        this.clearItems();
        if (!this.content || !this.talentItemPrefab) return;

        const tabCfg = TALENT_TAB_CONFIG[this._currentTab];
        if (!tabCfg) return;

        const talentManager = TalentManager.Instance;

        for (const type of tabCfg.types) {
            const cfg = TALENT_CONFIG[type];
            const state = talentManager.getTalentState(type);
            const itemNode = instantiate(this.talentItemPrefab);
            itemNode.setParent(this.content);
            this._itemNodes.push(itemNode);
            this.setupItem(itemNode, state, cfg);
        }

        if (this.scrollView && savedScrollOffset) {
            this.scrollView.scrollToOffset(savedScrollOffset, 0);
        }
    }

    private setupItem(node: Node, state: TalentState, cfg: TalentData) {
        const nameLabel = this.findLabel(node, "Name");
        if (nameLabel) nameLabel.string = cfg.name;

        const descLabel = this.findLabel(node, "Desc");
        if (descLabel) {
            const curVal = state.level * cfg.effectPerLevel;
            const nextVal = (state.level + 1) * cfg.effectPerLevel;
            const suffix = cfg.effectSuffix;
            if (state.level >= cfg.maxLevel) {
                descLabel.string = `${cfg.desc}\n当前: ${this.formatValue(curVal, suffix)} (已满级)`;
            } else {
                descLabel.string = `${cfg.desc}\n${this.formatValue(curVal, suffix)} → ${this.formatValue(nextVal, suffix)}`;
            }
        }

        const levelLabel = this.findLabel(node, "Level");
        if (levelLabel) {
            levelLabel.string = `Lv.${state.level}/${cfg.maxLevel}`;
        }

        const progressBar = this.findProgressBar(node, "Progress");
        if (progressBar) {
            progressBar.progress = state.level / cfg.maxLevel;
        }

        const costLabel = this.findLabel(node, "BtnCost");
        const upgradeBtn = this.findButton(node, "BtnUpgrade");
        if (costLabel && upgradeBtn) {
            upgradeBtn.node.off(Button.Event.CLICK);
            if (state.level >= cfg.maxLevel) {
                costLabel.string = "已满级";
                upgradeBtn.interactable = false;
            } else if (!TalentManager.Instance.isPrerequisiteMet(cfg.id)) {
                costLabel.string = `需要 ${TalentManager.Instance.getPrerequisiteDesc(cfg.id)}`;
                upgradeBtn.interactable = false;
            } else {
                const cost = TalentManager.Instance.getUpgradeCost(cfg.id);
                costLabel.string = `${cost}`;
                upgradeBtn.interactable = this._goldNum >= cost;
                upgradeBtn.node.on(Button.Event.CLICK, () => {
                    this.onUpgrade(cfg.id, node, upgradeBtn.node);
                }, this);
            }
        }

        const iconNode = this.findNode(node, "Icon");
        if (iconNode) {
            const sprite = iconNode.getComponent("cc.Sprite" as any);
            if (sprite && state.level > 0) {
                sprite.color = this.hexToColor("#FFD700");
            }
        }

        const lockNode = this.findNode(node, "Lock");
        if (lockNode) {
            lockNode.active = state.level === 0;
        }
    }

    private onUpgrade(type: TalentType, itemNode: Node, btnNode: Node) {
        if (TalentManager.Instance.isMaxLevel(type)) {
            return;
        }

        const cost = TalentManager.Instance.getUpgradeCost(type);
        if (this._goldNum < cost) {
            this.playShakeAnimation(btnNode);
            this.playGoldFlash();
            return;
        }

        this._goldNum -= cost;
        StorageUtil.setNumber(GOLD_KEY, this._goldNum);

        TalentManager.Instance.upgrade(type);

        AchievementManager.Instance.addStat(ACHIEVEMENT_STORAGE_KEYS.TOTAL_TALENT, 1);

        this.refreshGoldLabel();
        this.refreshTotalBonus();
        this.refreshTotalLevelUI();
        this.refreshItems();

        this.playUpgradeAnimation(itemNode);

        if (this._upgradeCallback) {
            this._upgradeCallback.onGoldChanged(this._goldNum);
        }

        AudioManager.Instance.playSfx("audio/sfx/levelup");
    }

    private playUpgradeAnimation(node: Node) {
        if (!node || !node.isValid) {
            this.playPanelFlash();
            return;
        }
        const origScale = node.scale.clone();
        tween(node)
            .to(0.1, { scale: new Vec3(1.15, 1.15, 1) })
            .to(0.15, { scale: origScale })
            .start();

        const opacity = node.getComponent(UIOpacity) || node.addComponent(UIOpacity);
        opacity.opacity = 255;
        tween(opacity)
            .to(0.15, { opacity: 128 })
            .to(0.15, { opacity: 255 })
            .start();
    }

    private playPanelFlash() {
        if (!this.panel) return;
        const opacity = this.panel.getComponent(UIOpacity) || this.panel.addComponent(UIOpacity);
        opacity.opacity = 255;
        tween(opacity)
            .to(0.1, { opacity: 180 })
            .to(0.1, { opacity: 255 })
            .start();
    }

    private playShakeAnimation(node: Node) {
        const origPos = node.position.clone();
        const shakeAmount = 5;
        tween(node)
            .to(0.05, { position: new Vec3(origPos.x + shakeAmount, origPos.y, origPos.z) })
            .to(0.05, { position: new Vec3(origPos.x - shakeAmount, origPos.y, origPos.z) })
            .to(0.05, { position: new Vec3(origPos.x + shakeAmount, origPos.y, origPos.z) })
            .to(0.05, { position: origPos })
            .start();
    }

    private playGoldFlash() {
        if (!this.labGold) return;
        const origColor = this.labGold.color.clone();
        tween(this.labGold)
            .to(0.15, { color: new Color(255, 60, 60, 255) })
            .to(0.15, { color: origColor })
            .start();
    }

    private initResetBtn() {
        if (!this.btnReset) return;
        this.btnReset.node.on(Button.Event.CLICK, () => {
            this._resetHolding = true;
            this._resetHoldTimer = 0;
        }, this);
        this.btnReset.node.on('touchend' as any, () => {
            if (this._resetHolding && this._resetHoldTimer < RESET_HOLD_TIME) {
                this._resetHolding = false;
                this._resetHoldTimer = 0;
            }
        }, this);
        this.btnReset.node.on('touchcancel' as any, () => {
            this._resetHolding = false;
            this._resetHoldTimer = 0;
        }, this);
    }

    private doReset() {
        const totalLevel = TalentManager.Instance.getTotalLevel();
        if (totalLevel === 0) return;

        const refund = TalentManager.Instance.getTotalSpentGold();
        TalentManager.Instance.resetAll();

        this._goldNum += refund;
        StorageUtil.setNumber(GOLD_KEY, this._goldNum);

        this.refreshGoldLabel();
        this.refreshTotalBonus();
        this.refreshTotalLevelUI();
        this.refreshItems();

        if (this._upgradeCallback) {
            this._upgradeCallback.onGoldChanged(this._goldNum);
        }

        AudioManager.Instance.playSfx("audio/sfx/select");
    }

    private refreshGoldLabel() {
        if (this.labGold) {
            this.labGold.string = `金币: ${this._goldNum}`;
        }
    }

    private refreshTotalLevelUI() {
        if (!this.labTotalLevel) return;
        const total = TalentManager.Instance.getTotalLevel();
        const max = TalentManager.Instance.getMaxTotalLevel();
        this.labTotalLevel.string = `天赋总等级: ${total}/${max}`;
    }

    private refreshTotalBonus() {
        if (!this.labTotalBonus) return;
        const tm = TalentManager.Instance;
        const parts: string[] = [];

        const bonusItems: { type: TalentType; label: string; isPercent: boolean; isDecimal: boolean }[] = [
            { type: TalentType.ATTACK, label: "攻击", isPercent: true, isDecimal: false },
            { type: TalentType.ATTACK_SPEED, label: "攻速", isPercent: true, isDecimal: false },
            { type: TalentType.CRIT_RATE, label: "暴击率", isPercent: true, isDecimal: false },
            { type: TalentType.CRIT_DAMAGE, label: "暴伤", isPercent: false, isDecimal: true },
            { type: TalentType.MAX_HP, label: "生命", isPercent: true, isDecimal: false },
            { type: TalentType.HP_REGEN, label: "回复", isPercent: false, isDecimal: false },
            { type: TalentType.DAMAGE_REDUCTION, label: "减伤", isPercent: true, isDecimal: false },
            { type: TalentType.MOVE_SPEED, label: "移速", isPercent: true, isDecimal: false },
            { type: TalentType.EXP_GAIN, label: "经验", isPercent: true, isDecimal: false },
            { type: TalentType.GOLD_GAIN, label: "金币", isPercent: true, isDecimal: false },
            { type: TalentType.PICKUP_RANGE, label: "拾取", isPercent: true, isDecimal: false },
            { type: TalentType.PROJECTILE_COUNT, label: "弹射", isPercent: false, isDecimal: false },
        ];

        for (const item of bonusItems) {
            const val = tm.getEffectValue(item.type);
            if (val <= 0) continue;

            if (item.isPercent) {
                parts.push(`${item.label}+${(val * 100).toFixed(0)}%`);
            } else if (item.isDecimal) {
                const base = 1.5 + val;
                parts.push(`${item.label}+${base.toFixed(1)}x`);
            } else {
                parts.push(`${item.label}+${val.toFixed(0)}`);
            }

            if (parts.length % 4 === 0) {
                parts[parts.length - 1] += "\n";
            }
        }

        this.labTotalBonus.string = parts.length > 0 ? parts.join("  ") : "暂无天赋加成";
    }

    private findLabel(parent: Node, name: string): Label | null {
        const child = parent.getChildByName(name);
        return child ? child.getComponent(Label) : null;
    }

    private findButton(parent: Node, name: string): Button | null {
        const child = parent.getChildByName(name);
        return child ? child.getComponent(Button) : null;
    }

    private findNode(parent: Node, name: string): Node | null {
        return parent.getChildByName(name) || null;
    }

    private findProgressBar(parent: Node, name: string): ProgressBar | null {
        const child = parent.getChildByName(name);
        return child ? child.getComponent(ProgressBar) : null;
    }

    private formatValue(value: number, suffix: string): string {
        if (suffix === "%") {
            return `${(value * 100).toFixed(0)}%`;
        }
        if (suffix === "x") {
            const base = 1.5 + value;
            return `${base.toFixed(1)}x`;
        }
        if (suffix === "/s") {
            return `${value.toFixed(0)}/s`;
        }
        return `${value.toFixed(0)}${suffix}`;
    }

    private hexToColor(hex: string): any {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return { r, g, b, a: 255 };
    }
}