import { _decorator, Component, Node, Label, Button, ScrollView, Prefab, instantiate, UIOpacity, tween, Vec3, Color, Sprite, ProgressBar, UITransform } from 'cc';
import { TalentType, TALENT_CONFIG, TALENT_TAB_CONFIG, TalentData, TalentCategory, formatTalentValue, formatTalentBonus, getTalentTypesByCategory, getTalentPrerequisiteChain, RESET_COOLDOWN_SECONDS, MAX_PRESET_SLOTS, PRESET_DEFAULT_NAMES } from '../config/TalentConfig';
import { TalentManager, TalentState, TalentPreset } from '../core/TalentManager';
import { HeroType, getHeroTalentSynergyBonus } from '../config/HeroConfig';
import { HeroManager } from '../core/HeroManager';
import { StorageUtil } from '../core/StorageUtil';
import { AudioManager } from '../core/AudioManager';
import { AchievementManager } from '../core/AchievementManager';
import { ACHIEVEMENT_STORAGE_KEYS } from '../config/AchievementConfig';
const { ccclass, property } = _decorator;

const GOLD_KEY = "sgzy_gold";
const UPGRADE_COOLDOWN = 0.12;
const LONG_PRESS_DELAY = 0.35;
const LONG_PRESS_INTERVAL = 0.08;
const BATCH_UPGRADE_ANIM_DELAY = 0.04;

const COLOR_GOLD = new Color(255, 215, 0, 255);
const COLOR_GRAY = new Color(180, 180, 180, 255);
const COLOR_GRAY_DARK = new Color(100, 100, 100, 255);
const COLOR_RED = new Color(255, 60, 60, 255);
const COLOR_WHITE = new Color(255, 255, 255, 255);
const COLOR_ORANGE = new Color(255, 165, 0, 255);
const COLOR_YELLOW = new Color(255, 255, 100, 255);
const COLOR_LIGHT_GOLD = new Color(255, 240, 180, 255);
const VEC3_ZOOM = new Vec3(1.15, 1.15, 1);

const PARTICLE_COLORS = [COLOR_GOLD, COLOR_ORANGE, COLOR_YELLOW, COLOR_LIGHT_GOLD, COLOR_WHITE];
const PARTICLE_COUNT = 8;
const PARTICLE_SIZE = 8;
const PARTICLE_RADIUS_MIN = 40;
const PARTICLE_RADIUS_MAX = 80;
const PARTICLE_DURATION = 0.5;
const FLOAT_TEXT_OFFSET_Y = 60;
const FLOAT_TEXT_DURATION = 0.7;
const TREE_INDENT_PER_DEPTH = 30;
const TREE_LINE_COLOR = new Color(120, 120, 120, 180);

const _tempVec3 = new Vec3();
const _tempVec3B = new Vec3();

export interface TalentUpgradeCallback {
    onGoldChanged: (gold: number) => void;
    onStatChanged?: () => void;
}

interface TalentItemView {
    node: Node;
    nameLabel: Label | null;
    descLabel: Label | null;
    levelLabel: Label | null;
    progressBar: ProgressBar | null;
    costLabel: Label | null;
    upgradeBtn: Button | null;
    batchLabel10: Label | null;
    batchLabelMax: Label | null;
    batchBtn10: Button | null;
    batchBtnMax: Button | null;
    iconSprite: Sprite | null;
    lockNode: Node | null;
    prerequisiteLine: Node | null;
    prerequisiteLabel: Label | null;
    talentType: TalentType;
    treeDepth: number;
    _btnBound: boolean;
    _batch10Bound: boolean;
    _batchMaxBound: boolean;
    _longPressTimer: number;
    _longPressing: boolean;
    _longPressInterval: number;
}

const ITEM_CHILD_NAMES: Record<string, number> = {
    "Name": 1, "Desc": 1, "Level": 1, "Progress": 1,
    "BtnCost": 1, "BtnUpgrade": 1, "Icon": 1, "Lock": 1,
    "BtnCost10": 1, "BtnUpgrade10": 1, "BtnCostMax": 1, "BtnUpgradeMax": 1,
    "PrereqLine": 1, "PrereqLabel": 1,
};

interface PresetSlotView {
    node: Node;
    nameLabel: Label | null;
    infoLabel: Label | null;
    applyBtn: Button | null;
    saveBtn: Button | null;
    deleteBtn: Button | null;
    slotIndex: number;
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
    @property(Button) btnBatchUpgrade: Button = null!;
    @property(Label) labBatchCost: Label = null!;
    @property(Node) detailPanel: Node = null!;
    @property(Label) labDetailName: Label = null!;
    @property(Label) labDetailDesc: Label = null!;
    @property(Label) labDetailEffect: Label = null!;
    @property(Label) labDetailCost: Label = null!;
    @property(Node) confirmPanel: Node = null!;
    @property(Label) labConfirmTitle: Label = null!;
    @property(Label) labConfirmMsg: Label = null!;
    @property(Button) btnConfirmOK: Button = null!;
    @property(Button) btnConfirmCancel: Button = null!;
    @property(Prefab) upgradeParticlePrefab: Prefab | null = null;
    @property(Prefab) floatTextPrefab: Prefab | null = null;
    @property(Node) presetPanel: Node | null = null;
    @property(Prefab) presetSlotPrefab: Prefab | null = null;
    @property(Node) presetContent: Node | null = null;

    private _currentTab: number = 0;
    private _goldNum: number = 0;
    private _itemViews: TalentItemView[] = [];
    private _tabNodes: Node[] = [];
    private _upgradeCallback: TalentUpgradeCallback | null = null;
    private _lastUpgradeTime: number = 0;
    private _panelOpacity: UIOpacity | null = null;
    private _bonusTextCache: string = "";
    private _bonusDirty: boolean = true;
    private _selectedDetailType: TalentType | null = null;
    private _batchAnimQueue: TalentType[] = [];
    private _batchAnimTimer: number = 0;
    private _batchAnimating: boolean = false;
    private _batchAnimTotalCount: number = 0;
    private _batchAnimLastNode: Node | null = null;
    private _presetSlots: PresetSlotView[] = [];
    private _presetSlotBound: boolean = false;

    onLoad() {
        if (this.panel) {
            this.panel.active = false;
            this._panelOpacity = this.panel.getComponent(UIOpacity);
            if (!this._panelOpacity) {
                this._panelOpacity = this.panel.addComponent(UIOpacity);
            }
        }
    }

    onDestroy() {
        Tween.stopAllByTarget(this.panel);
        Tween.stopAllByTarget(this.labGold);
        this.clearItems();
        this._upgradeCallback = null;
        if (this.btnBatchUpgrade) {
            this.btnBatchUpgrade.node.off(Button.Event.CLICK);
        }
        if (this.btnConfirmOK) {
            this.btnConfirmOK.node.off(Button.Event.CLICK);
        }
        if (this.btnConfirmCancel) {
            this.btnConfirmCancel.node.off(Button.Event.CLICK);
        }
        this.hideDetail();
        this.hideConfirmDialog();
        this._batchAnimating = false;
        this._batchAnimQueue = [];
        this._batchAnimTotalCount = 0;
        this._batchAnimLastNode = null;
    }

    init(callback: TalentUpgradeCallback) {
        this._upgradeCallback = callback;
        this.createTabs();
        this.initResetBtn();
        this.initBatchUpgradeBtn();
        this.initDetailPanel();
        this.initConfirmDialog();
        this.initPresetPanel();
    }

    show() {
        if (!this.panel) return;
        TalentManager.Instance.load();
        this._goldNum = StorageUtil.getNumber(GOLD_KEY, 0);
        this.refreshGoldLabel();
        this._bonusDirty = true;
        this.refreshTotalBonus();
        this.refreshTotalLevelUI();
        this._currentTab = 0;
        this.switchTab(0);
        this.hideDetail();
        this._batchAnimating = false;
        this._batchAnimQueue = [];
        this._batchAnimTotalCount = 0;
        this._batchAnimLastNode = null;
        this._resetCooldownRefreshTimer = 0;
        this.refreshResetBtnState();
        this.refreshPresetPanel();
        this.playShowAnimation();
        AudioManager.Instance.playSfx("audio/sfx/select");
    }

    hide() {
        if (!this.panel) return;
        Tween.stopAllByTarget(this.panel);
        this.panel.active = false;
        this.hideDetail();
        this.hideConfirmDialog();
        this._batchAnimating = false;
        this._batchAnimQueue = [];
        this._batchAnimTotalCount = 0;
        this._batchAnimLastNode = null;
        AudioManager.Instance.playSfx("audio/sfx/select");
    }

    update(dt: number) {
        this.updateLongPress(dt);
        this.updateBatchAnimation(dt);
        this.updateResetCooldown(dt);
    }

    private _resetCooldownRefreshTimer: number = 0;
    private updateResetCooldown(dt: number) {
        this._resetCooldownRefreshTimer += dt;
        if (this._resetCooldownRefreshTimer < 1.0) return;
        this._resetCooldownRefreshTimer = 0;
        this.refreshResetBtnState();
    }

    private refreshResetBtnState() {
        if (!this.btnReset) return;
        const tm = TalentManager.Instance;
        const canReset = tm.canReset();
        const totalLevel = tm.getTotalLevel();

        if (totalLevel === 0) {
            this.btnReset.interactable = false;
            const label = this.btnReset.node.getComponentInChildren(Label);
            if (label) label.string = "重置天赋";
            return;
        }

        if (!canReset) {
            this.btnReset.interactable = false;
            const remaining = tm.getResetCooldownRemaining();
            const minutes = Math.floor(remaining / 60);
            const seconds = Math.floor(remaining % 60);
            const label = this.btnReset.node.getComponentInChildren(Label);
            if (label) label.string = `冷却 ${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
        } else {
            this.btnReset.interactable = true;
            const label = this.btnReset.node.getComponentInChildren(Label);
            if (label) label.string = "重置天赋";
        }
    }

    private updateLongPress(dt: number) {
        for (let i = 0; i < this._itemViews.length; i++) {
            const view = this._itemViews[i];
            if (!view._longPressing) continue;
            view._longPressTimer += dt;
            if (view._longPressTimer >= LONG_PRESS_DELAY) {
                view._longPressInterval += dt;
                if (view._longPressInterval >= LONG_PRESS_INTERVAL) {
                    view._longPressInterval = 0;
                    this.onUpgrade(view.talentType, view);
                }
            }
        }
    }

    private updateBatchAnimation(dt: number) {
        if (!this._batchAnimating) return;
        this._batchAnimTimer += dt;
        if (this._batchAnimTimer >= BATCH_UPGRADE_ANIM_DELAY) {
            this._batchAnimTimer = 0;
            if (this._batchAnimQueue.length > 0) {
                const type = this._batchAnimQueue.shift()!;
                for (const view of this._itemViews) {
                    if (view.talentType === type) {
                        this.playUpgradeAnimation(view.node);
                        this._batchAnimLastNode = view.node;
                        break;
                    }
                }
            } else {
                this._batchAnimating = false;
                if (this._batchAnimTotalCount > 1 && this._batchAnimLastNode) {
                    this.playFloatText(this._batchAnimLastNode, `+${this._batchAnimTotalCount}`);
                }
                this._batchAnimTotalCount = 0;
                this._batchAnimLastNode = null;
            }
        }
    }

    private playShowAnimation() {
        if (!this.panel || !this._panelOpacity) {
            if (this.panel) this.panel.active = true;
            return;
        }
        this.panel.active = true;
        this._panelOpacity.opacity = 0;
        tween(this._panelOpacity).to(0.25, { opacity: 255 }).start();
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
        this.refreshBatchUpgradeBtn();
    }

    private updateTabHighlights() {
        for (let i = 0; i < this._tabNodes.length; i++) {
            const tabNode = this._tabNodes[i];
            const sprite = tabNode.getComponent(Sprite);
            const label = tabNode.getComponentInChildren(Label);
            const isActive = i === this._currentTab;
            if (label) {
                label.color = isActive ? COLOR_GOLD : COLOR_GRAY;
            }
            if (sprite) {
                sprite.color = isActive ? COLOR_GOLD : COLOR_GRAY_DARK;
            }
        }
    }

    private clearItems() {
        if (!this.content) return;
        for (const view of this._itemViews) {
            if (view.node && view.node.isValid) {
                const btn = view.upgradeBtn;
                if (btn) {
                    btn.node.off(Button.Event.CLICK);
                    btn.node.off(Node.EventType.TOUCH_START);
                    btn.node.off(Node.EventType.TOUCH_END);
                    btn.node.off(Node.EventType.TOUCH_CANCEL);
                }
                if (view.batchBtn10) {
                    view.batchBtn10.node.off(Button.Event.CLICK);
                }
                if (view.batchBtnMax) {
                    view.batchBtnMax.node.off(Button.Event.CLICK);
                }
                view._longPressing = false;
                view.node.destroy();
            }
        }
        this._itemViews = [];
    }

    private buildItemView(node: Node, type: TalentType): TalentItemView {
        const children = node.children;
        const childMap: Record<string, Node> = {};
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (ITEM_CHILD_NAMES[child.name]) {
                childMap[child.name] = child;
            }
        }
        return {
            node,
            nameLabel: childMap["Name"]?.getComponent(Label) || null,
            descLabel: childMap["Desc"]?.getComponent(Label) || null,
            levelLabel: childMap["Level"]?.getComponent(Label) || null,
            progressBar: childMap["Progress"]?.getComponent(ProgressBar) || null,
            costLabel: childMap["BtnCost"]?.getComponent(Label) || null,
            upgradeBtn: childMap["BtnUpgrade"]?.getComponent(Button) || null,
            batchLabel10: childMap["BtnCost10"]?.getComponent(Label) || null,
            batchLabelMax: childMap["BtnCostMax"]?.getComponent(Label) || null,
            batchBtn10: childMap["BtnUpgrade10"]?.getComponent(Button) || null,
            batchBtnMax: childMap["BtnUpgradeMax"]?.getComponent(Button) || null,
            iconSprite: childMap["Icon"]?.getComponent(Sprite) || null,
            lockNode: childMap["Lock"] || null,
            prerequisiteLine: childMap["PrereqLine"] || null,
            prerequisiteLabel: childMap["PrereqLabel"]?.getComponent(Label) || null,
            talentType: type,
            treeDepth: 0,
            _btnBound: false,
            _batch10Bound: false,
            _batchMaxBound: false,
            _longPressTimer: 0,
            _longPressing: false,
            _longPressInterval: 0,
        };
    }

    private refreshItems() {
        if (!this.content || !this.talentItemPrefab) return;

        const tabCfg = TALENT_TAB_CONFIG[this._currentTab];
        if (!tabCfg) return;

        const talentManager = TalentManager.Instance;
        const types = tabCfg.types;

        for (let i = 0; i < types.length; i++) {
            const type = types[i];
            const cfg = TALENT_CONFIG[type];
            const state = talentManager.getTalentState(type);
            const chain = getTalentPrerequisiteChain(type);

            let view = this._itemViews[i];
            if (!view || view.talentType !== type) {
                if (view) {
                    this.cleanupItemView(view);
                    if (view.node && view.node.isValid) {
                        view.node.destroy();
                    }
                }
                const itemNode = instantiate(this.talentItemPrefab);
                itemNode.setParent(this.content);
                view = this.buildItemView(itemNode, type);
                this._itemViews[i] = view;
            }

            view.treeDepth = chain.length;
            this.updateItemView(view, state, cfg);
        }

        while (this._itemViews.length > types.length) {
            const extra = this._itemViews.pop()!;
            this.cleanupItemView(extra);
            if (extra.node && extra.node.isValid) {
                extra.node.destroy();
            }
        }
    }

    private cleanupItemView(view: TalentItemView) {
        const btn = view.upgradeBtn;
        if (btn) {
            btn.node.off(Button.Event.CLICK);
            btn.node.off(Node.EventType.TOUCH_START);
            btn.node.off(Node.EventType.TOUCH_END);
            btn.node.off(Node.EventType.TOUCH_CANCEL);
        }
        if (view.batchBtn10) {
            view.batchBtn10.node.off(Button.Event.CLICK);
        }
        if (view.batchBtnMax) {
            view.batchBtnMax.node.off(Button.Event.CLICK);
        }
        view._longPressing = false;
        view._btnBound = false;
        view._batch10Bound = false;
        view._batchMaxBound = false;
    }

    private updateItemView(view: TalentItemView, state: TalentState, cfg: TalentData) {
        const talentManager = TalentManager.Instance;

        if (view.nameLabel) {
            view.nameLabel.string = cfg.name;
        }

        if (view.descLabel) {
            const curVal = state.level * cfg.effectPerLevel;
            const nextVal = (state.level + 1) * cfg.effectPerLevel;
            if (state.level >= cfg.maxLevel) {
                view.descLabel.string = `${cfg.desc}\n当前: ${formatTalentValue(curVal, cfg.displayFormat, cfg.multiplierBase)} (已满级)`;
            } else {
                view.descLabel.string = `${cfg.desc}\n${formatTalentValue(curVal, cfg.displayFormat, cfg.multiplierBase)} → ${formatTalentValue(nextVal, cfg.displayFormat, cfg.multiplierBase)}`;
            }
        }

        if (view.levelLabel) {
            view.levelLabel.string = `Lv.${state.level}/${cfg.maxLevel}`;
        }

        if (view.progressBar) {
            view.progressBar.progress = state.level / cfg.maxLevel;
        }

        const isMaxed = state.level >= cfg.maxLevel;
        const prereqMet = talentManager.isPrerequisiteMet(cfg.id);
        const totalPointsLimit = talentManager.isTotalPointsLimitReached();
        const canUpgrade = !isMaxed && prereqMet && !totalPointsLimit;

        if (view.costLabel && view.upgradeBtn) {
            const btn = view.upgradeBtn;

            if (isMaxed) {
                view.costLabel.string = "已满级";
                btn.interactable = false;
            } else if (totalPointsLimit) {
                view.costLabel.string = "天赋点不足";
                btn.interactable = false;
            } else if (!prereqMet) {
                view.costLabel.string = `需要 ${talentManager.getPrerequisiteDesc(cfg.id)}`;
                btn.interactable = false;
            } else {
                const cost = talentManager.getUpgradeCost(cfg.id);
                view.costLabel.string = `${cost}`;
                btn.interactable = this._goldNum >= cost;
            }

            if (canUpgrade && !view._btnBound) {
                btn.node.on(Button.Event.CLICK, () => {
                    this.onUpgrade(cfg.id, view);
                }, this);
                btn.node.on(Node.EventType.TOUCH_START, () => {
                    view._longPressTimer = 0;
                    view._longPressing = true;
                    view._longPressInterval = 0;
                }, this);
                btn.node.on(Node.EventType.TOUCH_END, () => {
                    view._longPressing = false;
                    view._longPressTimer = 0;
                }, this);
                btn.node.on(Node.EventType.TOUCH_CANCEL, () => {
                    view._longPressing = false;
                    view._longPressTimer = 0;
                }, this);
                view._btnBound = true;
            } else if (!canUpgrade && view._btnBound) {
                btn.node.off(Button.Event.CLICK);
                btn.node.off(Node.EventType.TOUCH_START);
                btn.node.off(Node.EventType.TOUCH_END);
                btn.node.off(Node.EventType.TOUCH_CANCEL);
                view._btnBound = false;
                view._longPressing = false;
            }
        }

        this.updateBatchButton(view, cfg, canUpgrade, isMaxed, prereqMet);

        if (view.iconSprite) {
            view.iconSprite.color = state.level > 0 ? COLOR_GOLD : COLOR_WHITE;
        }

        if (view.lockNode) {
            view.lockNode.active = state.level === 0;
        }

        this.updateTreeVisual(view, cfg, state);
    }

    private updateTreeVisual(view: TalentItemView, cfg: TalentData, state: TalentState) {
        const talentManager = TalentManager.Instance;

        if (view.prerequisiteLine) {
            view.prerequisiteLine.active = cfg.prerequisite !== undefined;
            if (cfg.prerequisite) {
                const met = talentManager.isPrerequisiteMet(cfg.id);
                const sprite = view.prerequisiteLine.getComponent(Sprite);
                if (sprite) {
                    sprite.color = met ? COLOR_GOLD : COLOR_GRAY_DARK;
                }
            }
        }

        if (view.prerequisiteLabel) {
            if (cfg.prerequisite) {
                const met = talentManager.isPrerequisiteMet(cfg.id);
                const reqCfg = TALENT_CONFIG[cfg.prerequisite.type];
                if (met) {
                    view.prerequisiteLabel.string = `← ${reqCfg.name} Lv.${cfg.prerequisite.level} ✓`;
                    view.prerequisiteLabel.color = COLOR_GOLD;
                } else {
                    view.prerequisiteLabel.string = `← 需要 ${reqCfg.name} Lv.${cfg.prerequisite.level}`;
                    view.prerequisiteLabel.color = COLOR_RED;
                }
                view.prerequisiteLabel.node.active = true;
            } else {
                view.prerequisiteLabel.node.active = false;
            }
        }

        if (view.treeDepth > 0) {
            const indent = view.treeDepth * TREE_INDENT_PER_DEPTH;
            const uiTransform = view.node.getComponent(UITransform);
            if (uiTransform) {
                const pos = view.node.position;
                const origPos = _tempVec3;
                origPos.set(pos);
                view.node.setPosition(origPos.x + indent, origPos.y, origPos.z);
            }
        }
    }

    private updateBatchButton(view: TalentItemView, cfg: TalentData, canUpgrade: boolean, isMaxed: boolean, prereqMet: boolean) {
        const talentManager = TalentManager.Instance;

        if (view.batchBtn10 && view.batchLabel10) {
            if (isMaxed || !prereqMet) {
                view.batchLabel10.string = "-";
                view.batchBtn10.interactable = false;
            } else {
                const count10 = Math.min(10, talentManager.getRemainingLevels(cfg.id));
                const cost10 = talentManager.getUpgradeCostBatch(cfg.id, count10);
                view.batchLabel10.string = `${cost10}`;
                view.batchBtn10.interactable = this._goldNum >= cost10 && cost10 > 0;
            }

            if (canUpgrade && !view._batch10Bound) {
                view.batchBtn10.node.on(Button.Event.CLICK, () => {
                    this.onBatchUpgrade(cfg.id, 10, view);
                }, this);
                view._batch10Bound = true;
            } else if (!canUpgrade && view._batch10Bound) {
                view.batchBtn10.node.off(Button.Event.CLICK);
                view._batch10Bound = false;
            }
        }

        if (view.batchBtnMax && view.batchLabelMax) {
            if (isMaxed || !prereqMet) {
                view.batchLabelMax.string = "-";
                view.batchBtnMax.interactable = false;
            } else {
                const costMax = talentManager.getCostToMaxLevel(cfg.id);
                const remaining = talentManager.getRemainingLevels(cfg.id);
                view.batchLabelMax.string = remaining > 10 ? `${costMax}` : `${costMax}`;
                view.batchBtnMax.interactable = this._goldNum >= costMax && costMax > 0;
            }

            if (canUpgrade && !view._batchMaxBound) {
                view.batchBtnMax.node.on(Button.Event.CLICK, () => {
                    this.onBatchUpgrade(cfg.id, talentManager.getRemainingLevels(cfg.id), view);
                }, this);
                view._batchMaxBound = true;
            } else if (!canUpgrade && view._batchMaxBound) {
                view.batchBtnMax.node.off(Button.Event.CLICK);
                view._batchMaxBound = false;
            }
        }
    }

    private onUpgrade(type: TalentType, view: TalentItemView) {
        const now = Date.now() / 1000;
        if (now - this._lastUpgradeTime < UPGRADE_COOLDOWN) return;
        this._lastUpgradeTime = now;

        const talentManager = TalentManager.Instance;

        if (talentManager.isMaxLevel(type)) {
            return;
        }

        if (!talentManager.isPrerequisiteMet(type)) {
            return;
        }

        const cost = talentManager.getUpgradeCost(type);
        if (this._goldNum < cost) {
            this.playShakeAnimation(view.node);
            this.playGoldFlash();
            return;
        }

        this._goldNum -= cost;
        StorageUtil.setNumber(GOLD_KEY, this._goldNum);

        talentManager.upgrade(type);

        AchievementManager.Instance.addStat(ACHIEVEMENT_STORAGE_KEYS.TOTAL_TALENT, 1);

        this.refreshGoldLabel();
        this._bonusDirty = true;
        this.refreshTotalBonus();
        this.refreshTotalLevelUI();
        this.refreshItems();
        this.refreshBatchUpgradeBtn();

        this.playUpgradeAnimation(view.node);

        if (this._upgradeCallback) {
            this._upgradeCallback.onGoldChanged(this._goldNum);
            this._upgradeCallback.onStatChanged?.();
        }

        AudioManager.Instance.playSfx("audio/sfx/levelup");
    }

    private refreshSingleItem(type: TalentType) {
        const cfg = TALENT_CONFIG[type];
        const state = TalentManager.Instance.getTalentState(type);

        for (const view of this._itemViews) {
            if (view.talentType === type) {
                this.updateItemView(view, state, cfg);
                return;
            }
        }
    }

    private playUpgradeAnimation(node: Node) {
        if (!node || !node.isValid) {
            this.playPanelFlash();
            return;
        }
        const origScale = node.scale;
        _tempVec3.set(origScale);
        tween(node)
            .to(0.1, { scale: VEC3_ZOOM })
            .to(0.15, { scale: _tempVec3 })
            .start();

        let opacity = node.getComponent(UIOpacity);
        if (!opacity) {
            opacity = node.addComponent(UIOpacity);
        }
        opacity.opacity = 255;
        tween(opacity)
            .to(0.15, { opacity: 128 })
            .to(0.15, { opacity: 255 })
            .start();

        this.playUpgradeParticles(node);
        this.playFloatText(node, "+1");
    }

    private playUpgradeParticles(targetNode: Node) {
        if (this.upgradeParticlePrefab) {
            this.playPrefabParticles(targetNode);
            return;
        }
        this.playProgrammaticParticles(targetNode);
    }

    private playPrefabParticles(targetNode: Node) {
        if (!this.upgradeParticlePrefab) return;
        const worldPos = targetNode.getWorldPosition();
        const particle = instantiate(this.upgradeParticlePrefab);
        particle.setParent(this.panel);
        particle.setWorldPosition(worldPos);
        setTimeout(() => {
            if (particle && particle.isValid) {
                particle.destroy();
            }
        }, 2000);
    }

    private playProgrammaticParticles(targetNode: Node) {
        const worldPos = targetNode.getWorldPosition();
        const parent = this.panel;

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const particleNode = new Node(`Particle_${i}`);
            particleNode.setParent(parent);
            particleNode.setWorldPosition(worldPos);

            const uiTransform = particleNode.addComponent(UITransform);
            uiTransform.setContentSize(PARTICLE_SIZE, PARTICLE_SIZE);

            const sprite = particleNode.addComponent(Sprite);
            const colorIdx = i % PARTICLE_COLORS.length;
            sprite.color = PARTICLE_COLORS[colorIdx];

            const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + (Math.random() - 0.5) * 0.4;
            const distance = PARTICLE_RADIUS_MIN + Math.random() * (PARTICLE_RADIUS_MAX - PARTICLE_RADIUS_MIN);
            const targetX = Math.cos(angle) * distance;
            const targetY = Math.sin(angle) * distance;

            const opacity = particleNode.addComponent(UIOpacity);
            opacity.opacity = 255;

            const localPos = particleNode.position.clone();
            _tempVec3B.set(localPos.x + targetX, localPos.y + targetY, localPos.z);

            const delay = Math.random() * 0.05;
            tween(particleNode)
                .delay(delay)
                .to(PARTICLE_DURATION, { position: _tempVec3B }, { easing: "cubicOut" })
                .start();
            tween(opacity)
                .delay(delay + PARTICLE_DURATION * 0.3)
                .to(PARTICLE_DURATION * 0.7, { opacity: 0 })
                .call(() => {
                    if (particleNode && particleNode.isValid) {
                        particleNode.destroy();
                    }
                })
                .start();
        }
    }

    private playFloatText(targetNode: Node, text: string) {
        if (this.floatTextPrefab) {
            const worldPos = targetNode.getWorldPosition();
            const floatNode = instantiate(this.floatTextPrefab);
            floatNode.setParent(this.panel);
            floatNode.setWorldPosition(worldPos);
            const label = floatNode.getComponentInChildren(Label);
            if (label) {
                label.string = text;
            }
            const localPos = floatNode.position.clone();
            _tempVec3.set(localPos.x, localPos.y + FLOAT_TEXT_OFFSET_Y, localPos.z);
            tween(floatNode)
                .to(FLOAT_TEXT_DURATION, { position: _tempVec3 }, { easing: "cubicOut" })
                .start();
            const opacity = floatNode.getComponent(UIOpacity) || floatNode.addComponent(UIOpacity);
            opacity.opacity = 255;
            tween(opacity)
                .delay(FLOAT_TEXT_DURATION * 0.2)
                .to(FLOAT_TEXT_DURATION * 0.8, { opacity: 0 })
                .call(() => {
                    if (floatNode && floatNode.isValid) {
                        floatNode.destroy();
                    }
                })
                .start();
            return;
        }

        const floatNode = new Node("FloatText");
        floatNode.setParent(this.panel);
        floatNode.setWorldPosition(targetNode.getWorldPosition());
        const uiTransform = floatNode.addComponent(UITransform);
        uiTransform.setContentSize(60, 30);
        const label = floatNode.addComponent(Label);
        label.string = text;
        label.fontSize = 24;
        label.color = COLOR_GOLD;
        const opacity = floatNode.addComponent(UIOpacity);
        opacity.opacity = 255;

        const localPos = floatNode.position.clone();
        _tempVec3.set(localPos.x, localPos.y + FLOAT_TEXT_OFFSET_Y, localPos.z);
        tween(floatNode)
            .to(FLOAT_TEXT_DURATION, { position: _tempVec3 }, { easing: "cubicOut" })
            .start();
        tween(opacity)
            .delay(FLOAT_TEXT_DURATION * 0.3)
            .to(FLOAT_TEXT_DURATION * 0.7, { opacity: 0 })
            .call(() => {
                if (floatNode && floatNode.isValid) {
                    floatNode.destroy();
                }
            })
            .start();
    }

    private playPanelFlash() {
        if (!this.panel || !this._panelOpacity) return;
        this._panelOpacity.opacity = 255;
        tween(this._panelOpacity)
            .to(0.1, { opacity: 180 })
            .to(0.1, { opacity: 255 })
            .start();
    }

    private playShakeAnimation(node: Node) {
        const origPos = node.position;
        const x = origPos.x;
        const shakeAmount = 5;
        _tempVec3.set(x + shakeAmount, origPos.y, origPos.z);
        _tempVec3B.set(x - shakeAmount, origPos.y, origPos.z);
        tween(node)
            .to(0.05, { position: _tempVec3 })
            .to(0.05, { position: _tempVec3B })
            .to(0.05, { position: _tempVec3 })
            .to(0.05, { position: origPos })
            .start();
    }

    private playGoldFlash() {
        if (!this.labGold) return;
        const origColor = this.labGold.color;
        tween(this.labGold)
            .to(0.15, { color: COLOR_RED })
            .to(0.15, { color: origColor })
            .start();
    }

    private initResetBtn() {
        if (!this.btnReset) return;
        this.btnReset.node.on(Button.Event.CLICK, () => {
            this.showConfirmDialog();
        }, this);
    }

    private initConfirmDialog() {
        if (!this.confirmPanel) return;
        this.confirmPanel.active = false;
        if (this.btnConfirmOK) {
            this.btnConfirmOK.node.on(Button.Event.CLICK, () => {
                this.hideConfirmDialog();
                this.doReset();
            }, this);
        }
        if (this.btnConfirmCancel) {
            this.btnConfirmCancel.node.on(Button.Event.CLICK, () => {
                this.hideConfirmDialog();
            }, this);
        }
    }

    private showConfirmDialog() {
        if (!this.confirmPanel) {
            this.doReset();
            return;
        }
        const tm = TalentManager.Instance;
        const totalLevel = tm.getTotalLevel();
        if (totalLevel === 0) return;

        if (!tm.canReset()) {
            const remaining = tm.getResetCooldownRemaining();
            const minutes = Math.floor(remaining / 60);
            const seconds = Math.floor(remaining % 60);
            if (this.labConfirmTitle) {
                this.labConfirmTitle.string = "重置冷却中";
            }
            if (this.labConfirmMsg) {
                this.labConfirmMsg.string = `重置功能冷却中，请等待 ${minutes}分${seconds}秒 后再试`;
            }
            if (this.btnConfirmOK) {
                this.btnConfirmOK.interactable = false;
            }
            this.confirmPanel.active = true;
            AudioManager.Instance.playSfx("audio/sfx/select");
            return;
        }

        const fullRefund = tm.getTotalSpentGold();
        const refundRatio = tm.getResetRefundRatio();
        const refund = Math.floor(fullRefund * refundRatio);
        const loss = fullRefund - refund;
        const resetCount = tm.getResetCount();
        const cooldownInfo = resetCount > 0 ? `\n重置后将进入${RESET_COOLDOWN_SECONDS / 60}分钟冷却` : "";
        const refundInfo = resetCount > 0
            ? `\n当前返还比例: ${Math.round(refundRatio * 100)}% (已重置${resetCount}次)`
            : "";

        if (this.labConfirmTitle) {
            this.labConfirmTitle.string = "重置天赋";
        }
        if (this.labConfirmMsg) {
            let msg = `确定要重置所有天赋吗？\n`;
            msg += `当前天赋总等级: ${totalLevel}\n`;
            msg += `将返还 ${refund} 金币`;
            if (loss > 0) {
                msg += ` (扣除${Math.round((1 - refundRatio) * 100)}%手续费: ${loss})`;
            }
            msg += refundInfo;
            msg += cooldownInfo;
            this.labConfirmMsg.string = msg;
        }
        if (this.btnConfirmOK) {
            this.btnConfirmOK.interactable = true;
        }
        this.confirmPanel.active = true;
        AudioManager.Instance.playSfx("audio/sfx/select");
    }

    private hideConfirmDialog() {
        if (!this.confirmPanel) return;
        this.confirmPanel.active = false;
    }

    private doReset() {
        const refund = TalentManager.Instance.resetAll();
        if (refund < 0) return;

        this._goldNum += refund;
        StorageUtil.setNumber(GOLD_KEY, this._goldNum);

        this.refreshGoldLabel();
        this._bonusDirty = true;
        this.refreshTotalBonus();
        this.refreshTotalLevelUI();
        this.refreshItems();
        this.refreshBatchUpgradeBtn();

        if (this._upgradeCallback) {
            this._upgradeCallback.onGoldChanged(this._goldNum);
            this._upgradeCallback.onStatChanged?.();
        }

        AudioManager.Instance.playSfx("audio/sfx/hurt");
    }

    private refreshGoldLabel() {
        if (this.labGold) {
            this.labGold.string = `金币: ${this._goldNum}`;
        }
    }

    private refreshTotalLevelUI() {
        if (!this.labTotalLevel) return;
        const tm = TalentManager.Instance;
        const total = tm.getTotalLevel();
        const max = tm.getMaxTotalLevel();
        const points = tm.getTotalPoints();
        const maxPoints = tm.getMaxTotalPoints();
        const earned = tm.getEarnedTalentPoints();
        const pointsWarn = points >= maxPoints ? " [已达上限]" : "";
        this.labTotalLevel.string = `天赋总等级: ${total}/${max} | 天赋点: ${points}/${earned}${pointsWarn}`;
    }

    private onBatchUpgrade(type: TalentType, count: number, view: TalentItemView) {
        const talentManager = TalentManager.Instance;
        if (talentManager.isMaxLevel(type) || !talentManager.isPrerequisiteMet(type)) return;

        const actualCount = Math.min(count, talentManager.getRemainingLevels(type));
        if (actualCount <= 0) return;

        const totalCost = talentManager.getUpgradeCostBatch(type, actualCount);
        if (this._goldNum < totalCost) {
            const maxAffordable = talentManager.getMaxAffordableUpgrades(type, this._goldNum);
            if (maxAffordable <= 0) {
                this.playShakeAnimation(view.node);
                this.playGoldFlash();
                return;
            }
            const affordableCost = talentManager.getUpgradeCostBatch(type, maxAffordable);
            this._goldNum -= affordableCost;
            StorageUtil.setNumber(GOLD_KEY, this._goldNum);
            talentManager.upgradeCount(type, maxAffordable);
            AchievementManager.Instance.addStat(ACHIEVEMENT_STORAGE_KEYS.TOTAL_TALENT, maxAffordable);
        } else {
            this._goldNum -= totalCost;
            StorageUtil.setNumber(GOLD_KEY, this._goldNum);
            talentManager.upgradeCount(type, actualCount);
            AchievementManager.Instance.addStat(ACHIEVEMENT_STORAGE_KEYS.TOTAL_TALENT, actualCount);
        }

        this.refreshGoldLabel();
        this._bonusDirty = true;
        this.refreshTotalBonus();
        this.refreshTotalLevelUI();
        this.refreshItems();
        this.refreshBatchUpgradeBtn();

        this.playUpgradeAnimation(view.node);

        if (this._upgradeCallback) {
            this._upgradeCallback.onGoldChanged(this._goldNum);
            this._upgradeCallback.onStatChanged?.();
        }

        AudioManager.Instance.playSfx("audio/sfx/levelup");
    }

    private initBatchUpgradeBtn() {
        if (!this.btnBatchUpgrade) return;
        this.btnBatchUpgrade.node.on(Button.Event.CLICK, () => {
            this.onBatchUpgradeAll();
        }, this);
    }

    private onBatchUpgradeAll() {
        const tabCfg = TALENT_TAB_CONFIG[this._currentTab];
        if (!tabCfg) return;

        const talentManager = TalentManager.Instance;
        const result = talentManager.upgradeBatch(tabCfg.types, this._goldNum);

        if (result.upgraded.length === 0) return;

        this._goldNum -= result.spent;
        StorageUtil.setNumber(GOLD_KEY, this._goldNum);

        AchievementManager.Instance.addStat(ACHIEVEMENT_STORAGE_KEYS.TOTAL_TALENT, result.upgraded.length);

        this.refreshGoldLabel();
        this._bonusDirty = true;
        this.refreshTotalBonus();
        this.refreshTotalLevelUI();
        this.refreshItems();
        this.refreshBatchUpgradeBtn();

        this._batchAnimQueue = result.upgraded.map(e => e.type);
        this._batchAnimTimer = 0;
        this._batchAnimTotalCount = result.upgraded.length;
        this._batchAnimating = true;

        if (this._upgradeCallback) {
            this._upgradeCallback.onGoldChanged(this._goldNum);
            this._upgradeCallback.onStatChanged?.();
        }

        AudioManager.Instance.playSfx("audio/sfx/levelup");
    }

    private refreshBatchUpgradeBtn() {
        if (!this.btnBatchUpgrade) return;
        const tabCfg = TALENT_TAB_CONFIG[this._currentTab];
        if (!tabCfg) return;

        const talentManager = TalentManager.Instance;
        let hasAffordable = false;
        let totalCost = 0;

        for (const type of tabCfg.types) {
            if (talentManager.isMaxLevel(type) || !talentManager.isPrerequisiteMet(type)) continue;
            const cost = talentManager.getUpgradeCost(type);
            if (cost <= this._goldNum) {
                hasAffordable = true;
                totalCost += cost;
            }
        }

        this.btnBatchUpgrade.interactable = hasAffordable;

        if (this.labBatchCost) {
            if (hasAffordable) {
                this.labBatchCost.string = `预计消耗: ${totalCost}`;
            } else {
                this.labBatchCost.string = "无可用升级";
            }
        }
    }

    private initPresetPanel() {
        if (!this.presetPanel || !this.presetSlotPrefab || !this.presetContent) return;
        this._presetSlotBound = false;
    }

    private ensurePresetSlots() {
        if (this._presetSlotBound || !this.presetSlotPrefab || !this.presetContent) return;
        this._presetSlotBound = true;
        this.presetContent.removeAllChildren();
        this._presetSlots = [];
        for (let i = 0; i < MAX_PRESET_SLOTS; i++) {
            const node = instantiate(this.presetSlotPrefab);
            node.parent = this.presetContent;
            const slot: PresetSlotView = {
                node,
                nameLabel: this.findChildLabel(node, "Name"),
                infoLabel: this.findChildLabel(node, "Info"),
                applyBtn: this.findChildButton(node, "BtnApply"),
                saveBtn: this.findChildButton(node, "BtnSave"),
                deleteBtn: this.findChildButton(node, "BtnDelete"),
                slotIndex: i,
            };
            const idx = i;
            if (slot.applyBtn) {
                slot.applyBtn.node.on(Button.Event.CLICK, () => this.onApplyPreset(idx), this);
            }
            if (slot.saveBtn) {
                slot.saveBtn.node.on(Button.Event.CLICK, () => this.onSavePreset(idx), this);
            }
            if (slot.deleteBtn) {
                slot.deleteBtn.node.on(Button.Event.CLICK, () => this.onDeletePreset(idx), this);
            }
            this._presetSlots.push(slot);
        }
    }

    private findChildLabel(parent: Node, childName: string): Label | null {
        const child = parent.getChildByName(childName);
        return child ? child.getComponent(Label) : null;
    }

    private findChildButton(parent: Node, childName: string): Button | null {
        const child = parent.getChildByName(childName);
        return child ? child.getComponent(Button) : null;
    }

    private refreshPresetPanel() {
        if (!this.presetPanel) return;
        this.ensurePresetSlots();
        const presets = TalentManager.Instance.getPresets();
        const tm = TalentManager.Instance;
        const currentTotalLevel = tm.getTotalLevel();
        for (let i = 0; i < this._presetSlots.length; i++) {
            const slot = this._presetSlots[i];
            const preset = presets[i] || null;
            const hasData = preset && preset.totalLevel > 0;
            if (slot.nameLabel) {
                slot.nameLabel.string = preset ? preset.name : (PRESET_DEFAULT_NAMES[i] || `方案${i + 1}`);
            }
            if (slot.infoLabel) {
                if (hasData) {
                    slot.infoLabel.string = `Lv.${preset!.totalLevel} | ${preset!.totalCost}金`;
                } else {
                    slot.infoLabel.string = "空";
                }
            }
            if (slot.applyBtn) {
                slot.applyBtn.interactable = hasData;
            }
            if (slot.saveBtn) {
                slot.saveBtn.interactable = currentTotalLevel > 0;
            }
            if (slot.deleteBtn) {
                slot.deleteBtn.interactable = hasData;
            }
        }
    }

    private onApplyPreset(slotIndex: number) {
        const presets = TalentManager.Instance.getPresets();
        const preset = presets[slotIndex];
        if (!preset || preset.totalLevel === 0) return;
        const success = TalentManager.Instance.applyPreset(slotIndex);
        if (success) {
            this._bonusDirty = true;
            this.refreshTotalBonus();
            this.refreshTotalLevelUI();
            this.refreshItems();
            this.refreshBatchUpgradeBtn();
            this.refreshPresetPanel();
            if (this._upgradeCallback) {
                this._upgradeCallback.onStatChanged?.();
            }
            AudioManager.Instance.playSfx("audio/sfx/select");
        }
    }

    private onSavePreset(slotIndex: number) {
        const tm = TalentManager.Instance;
        if (tm.getTotalLevel() === 0) return;
        const name = PRESET_DEFAULT_NAMES[slotIndex] || `方案${slotIndex + 1}`;
        const preset = TalentManager.Instance.savePreset(slotIndex, name);
        if (preset) {
            this.refreshPresetPanel();
            AudioManager.Instance.playSfx("audio/sfx/select");
        }
    }

    private onDeletePreset(slotIndex: number) {
        const success = TalentManager.Instance.deletePreset(slotIndex);
        if (success) {
            this.refreshPresetPanel();
            AudioManager.Instance.playSfx("audio/sfx/select");
        }
    }

    private initDetailPanel() {
        if (!this.detailPanel) return;
        this.detailPanel.active = false;
    }

    private showDetail(type: TalentType) {
        if (!this.detailPanel) return;
        const cfg = TALENT_CONFIG[type];
        const tm = TalentManager.Instance;
        const level = tm.getLevel(type);

        if (this.labDetailName) {
            this.labDetailName.string = cfg.name;
        }
        if (this.labDetailDesc) {
            const curVal = level * cfg.effectPerLevel;
            const maxVal = cfg.maxLevel * cfg.effectPerLevel;
            this.labDetailDesc.string = `${cfg.desc}\n当前等级: Lv.${level}/${cfg.maxLevel}`;
        }
        if (this.labDetailEffect) {
            const curVal = level * cfg.effectPerLevel;
            const nextVal = (level + 1) * cfg.effectPerLevel;
            const maxVal = cfg.maxLevel * cfg.effectPerLevel;
            let effectText = `当前效果: ${formatTalentValue(curVal, cfg.displayFormat, cfg.multiplierBase)}`;
            if (level < cfg.maxLevel) {
                effectText += `\n下一级: ${formatTalentValue(nextVal, cfg.displayFormat, cfg.multiplierBase)}`;
            }
            effectText += `\n最大效果: ${formatTalentValue(maxVal, cfg.displayFormat, cfg.multiplierBase)}`;
            if (cfg.prerequisite) {
                const reqCfg = TALENT_CONFIG[cfg.prerequisite.type];
                effectText += `\n前置条件: ${reqCfg.name} Lv.${cfg.prerequisite.level}`;
            }
            const heroType = HeroManager.Instance.getSelectedHero();
            const synergyBonus = getHeroTalentSynergyBonus(heroType, type);
            if (synergyBonus > 0) {
                const heroCfg = HeroManager.Instance.getHeroData(heroType);
                const bonusPct = Math.round(synergyBonus * 100);
                effectText += `\n${heroCfg ? heroCfg.name : ""}加成: +${bonusPct}%`;
            }
            this.labDetailEffect.string = effectText;
        }
        if (this.labDetailCost) {
            if (level >= cfg.maxLevel) {
                this.labDetailCost.string = "已满级";
            } else {
                const cost = tm.getUpgradeCost(type);
                const costToMax = tm.getCostToMaxLevel(type);
                this.labDetailCost.string = `升级费用: ${cost}\n满级总费用: ${costToMax}`;
            }
        }

        this._selectedDetailType = type;
        this.detailPanel.active = true;
        this.playPanelFlash();
    }

    private hideDetail() {
        if (!this.detailPanel) return;
        this.detailPanel.active = false;
        this._selectedDetailType = null;
    }

    private refreshTotalBonus() {
        if (!this.labTotalBonus) return;
        if (!this._bonusDirty && this._bonusTextCache) {
            this.labTotalBonus.string = this._bonusTextCache;
            return;
        }

        const tm = TalentManager.Instance;
        const categories: TalentCategory[] = [TalentCategory.ATTACK, TalentCategory.DEFENSE, TalentCategory.UTILITY];
        const categoryNames: Record<string, string> = {
            [TalentCategory.ATTACK]: "⚔攻击",
            [TalentCategory.DEFENSE]: "🛡防御",
            [TalentCategory.UTILITY]: "✨辅助",
        };
        const parts: string[] = [];

        for (let c = 0; c < categories.length; c++) {
            const cat = categories[c];
            const types = getTalentTypesByCategory(cat);
            const catParts: string[] = [];

            for (let i = 0; i < types.length; i++) {
                const cfg = TALENT_CONFIG[types[i]];
                const val = tm.getEffectValue(cfg.id);
                if (val <= 0) continue;
                catParts.push(formatTalentBonus(cfg, val));
            }

            if (catParts.length > 0) {
                parts.push(`${categoryNames[cat]}: ${catParts.join("  ")}`);
            }
        }

        this._bonusTextCache = parts.length > 0 ? parts.join("\n") : "暂无天赋加成";
        this._bonusDirty = false;
        this.labTotalBonus.string = this._bonusTextCache;
    }