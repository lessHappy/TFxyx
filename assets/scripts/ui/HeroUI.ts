import { _decorator, Component, Node, Label, Button, Sprite, ScrollView, Prefab, instantiate, UIOpacity, tween, Color, ProgressBar, Vec3 } from 'cc';
import { HeroType, HERO_CONFIG, HERO_ORDER, HeroData, UNLOCK_HINT_MAP, HERO_MASTERY_CONFIG, HERO_SYNERGY, HERO_MASTERY_MAX_LEVEL, HERO_TALENT_SYNERGY, getHeroTalentSynergyEntries } from '../config/HeroConfig';
import { HeroManager } from '../core/HeroManager';
import { AudioManager } from '../core/AudioManager';
import { WxAdHelper } from '../core/WxAdHelper';
import { AdRewardType } from '../config/AdConfig';
import { EventManager } from '../core/EventManager';
const { ccclass, property } = _decorator;

export interface HeroUICallback {
    onHeroChanged: (heroType: HeroType) => void;
}

const HERO_AD_TYPE_MAP: Partial<Record<HeroType, AdRewardType>> = {
    [HeroType.ZHAO_YUN]: AdRewardType.HERO_ZHAO_YUN,
    [HeroType.GUAN_YU]: AdRewardType.HERO_GUAN_YU,
    [HeroType.ZHANG_FEI]: AdRewardType.HERO_ZHANG_FEI,
    [HeroType.ZHUGE_LIANG]: AdRewardType.HERO_ZHUGE_LIANG,
    [HeroType.LV_BU]: AdRewardType.HERO_LV_BU,
};

const UNLOCK_TYPE_LABEL: Record<string, string> = { kill: "击杀", gold: "金币", survive: "生存" };

const COLOR_LOCKED = new Color(60, 60, 60, 255);
const COLOR_NORMAL = new Color(255, 255, 255, 255);

interface HeroItemCache {
    node: Node;
    nameLabel: Label | null;
    lockNode: Node | null;
    selectNode: Node | null;
    icon: Sprite | null;
    progressBar: ProgressBar | null;
    progressLabel: Label | null;
    masteryBar: ProgressBar | null;
    masteryLabel: Label | null;
    btn: Button | null;
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
    @property(Label) labMasteryInfo: Label = null!;
    @property(Sprite) selectedHeroIcon: Sprite = null!;

    @property(Button) btnSelect: Button = null!;
    @property(Label) labBtnSelect: Label = null!;

    private _currentSelect: HeroType = HeroType.ZHAO_YUN;
    private _itemCaches: HeroItemCache[] = [];
    private _callback: HeroUICallback | null = null;
    private _isVisible: boolean = false;

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
        this._isVisible = true;
        this.ensureItemPool();
        this.refreshItemList();
        this.refreshDetail();
        this.playShowAnimation();
        EventManager.Instance.on("HERO_MASTERY_UP", this.onMasteryUp, this);
        AudioManager.Instance.playSfx("audio/sfx/select");
    }

    hide() {
        if (!this.panel) return;
        this._isVisible = false;
        EventManager.Instance.off("HERO_MASTERY_UP", this.onMasteryUp, this);
        this.panel.active = false;
        AudioManager.Instance.playSfx("audio/sfx/select");
    }

    private onMasteryUp(heroType: HeroType, level: number) {
        if (level < HERO_MASTERY_CONFIG.length) {
            const cfg = HERO_CONFIG[heroType];
            const masteryCfg = HERO_MASTERY_CONFIG[level];
            const wx = (window as any).wx;
            if (wx) wx.showToast({ title: `${cfg.name} 熟练度提升：[${masteryCfg.name}]` });
        }
        if (this._isVisible) {
            this.refreshItemList();
            this.refreshDetail();
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

    private ensureItemPool() {
        const required = HERO_ORDER.length;
        while (this._itemCaches.length < required) {
            if (!this.heroItemPrefab || !this.content) break;
            const node = instantiate(this.heroItemPrefab);
            node.setParent(this.content);
            node.active = true;
            const cache = this.buildItemCache(node);
            this._itemCaches.push(cache);
            this.bindItemClick(cache);
        }
    }

    private buildItemCache(node: Node): HeroItemCache {
        return {
            node,
            nameLabel: this.getChildComponent(node, "Name", Label),
            lockNode: node.getChildByName("Lock"),
            selectNode: node.getChildByName("Selected"),
            icon: this.getChildComponent(node, "Icon", Sprite),
            progressBar: this.getChildComponent(node, "Progress", ProgressBar),
            progressLabel: this.getChildComponent(node, "ProgressLabel", Label),
            masteryBar: this.getChildComponent(node, "MasteryBar", ProgressBar),
            masteryLabel: this.getChildComponent(node, "MasteryLabel", Label),
            btn: node.getComponent(Button),
        };
    }

    private bindItemClick(cache: HeroItemCache) {
        if (!cache.btn) return;
        cache.btn.node.off(Button.Event.CLICK);
        cache.btn.node.on(Button.Event.CLICK, () => {
            const heroType = (cache.node as any).__heroType as HeroType;
            if (!heroType) return;
            if (HeroManager.Instance.isUnlocked(heroType)) {
                this.selectHero(heroType);
            } else {
                this.onTryUnlock(heroType);
            }
        }, this);
    }

    private refreshItemList() {
        if (!this.content) return;
        const savedScrollOffset = this.scrollView ? this.scrollView.getScrollOffset() : null;

        for (let i = 0; i < HERO_ORDER.length; i++) {
            const heroType = HERO_ORDER[i];
            const cfg = HERO_CONFIG[heroType];
            const cache = this._itemCaches[i];
            if (!cache) continue;
            (cache.node as any).__heroType = heroType;
            this.updateItemCache(cache, heroType, cfg);
        }

        if (this.scrollView && savedScrollOffset) {
            this.scrollView.scrollToOffset(savedScrollOffset, 0);
        }
    }

    private updateItemCache(cache: HeroItemCache, heroType: HeroType, cfg: HeroData) {
        const isUnlocked = HeroManager.Instance.isUnlocked(heroType);

        if (cache.nameLabel) cache.nameLabel.string = cfg.name;
        if (cache.lockNode) cache.lockNode.active = !isUnlocked;
        if (cache.selectNode) {
            cache.selectNode.active = (heroType === this._currentSelect && isUnlocked);
        }
        if (cache.icon) {
            cache.icon.color = isUnlocked ? COLOR_NORMAL : COLOR_LOCKED;
        }

        if (!isUnlocked && cfg.unlockType !== "default" && cfg.unlockType !== "ad") {
            const progress = HeroManager.Instance.getUnlockProgress(heroType);
            if (cache.progressBar) {
                cache.progressBar.node.active = true;
                cache.progressBar.progress = Math.min(progress.current / progress.target, 1);
            }
            if (cache.progressLabel) {
                const typeLabel = UNLOCK_TYPE_LABEL[progress.type] || "";
                cache.progressLabel.node.active = true;
                cache.progressLabel.string = `${typeLabel} ${progress.current}/${progress.target}`;
            }
        } else {
            if (cache.progressBar) cache.progressBar.node.active = false;
            if (cache.progressLabel) cache.progressLabel.node.active = false;
        }

        if (isUnlocked) {
            const mastery = HeroManager.Instance.getMasteryData(heroType);
            if (cache.masteryBar) {
                cache.masteryBar.node.active = true;
                cache.masteryBar.progress = mastery.level >= HERO_MASTERY_MAX_LEVEL
                    ? 1
                    : Math.min(mastery.exp / mastery.nextExp, 1);
            }
            if (cache.masteryLabel) {
                cache.masteryLabel.node.active = true;
                if (mastery.level >= HERO_MASTERY_MAX_LEVEL) {
                    cache.masteryLabel.string = `[${mastery.name}] 满级`;
                } else {
                    cache.masteryLabel.string = `[${mastery.name}] ${mastery.exp}/${mastery.nextExp}`;
                }
            }
        } else {
            if (cache.masteryBar) cache.masteryBar.node.active = false;
            if (cache.masteryLabel) cache.masteryLabel.node.active = false;
        }
    }

    private selectHero(heroType: HeroType) {
        if (heroType === this._currentSelect) return;
        this._currentSelect = heroType;
        this.refreshItemList();
        this.refreshDetail();
        this.playSelectAnimation(heroType);
        AudioManager.Instance.playSfx("audio/sfx/select");
    }

    private playSelectAnimation(heroType: HeroType) {
        for (const cache of this._itemCaches) {
            if (!cache.node || !cache.node.isValid) continue;
            if (cache.selectNode && cache.selectNode.active) {
                const origScale = cache.node.scale.clone();
                tween(cache.node)
                    .to(0.1, { scale: new Vec3(1.1, 1.1, 1) })
                    .to(0.15, { scale: origScale })
                    .start();
                break;
            }
        }
    }

    private onTryUnlock(heroType: HeroType) {
        const cfg = HERO_CONFIG[heroType];
        if (cfg.unlockType === "ad") {
            const adType = HERO_AD_TYPE_MAP[heroType] || AdRewardType.HERO_LV_BU;
            WxAdHelper.showRewardAd(adType, () => {
                HeroManager.Instance.unlock(heroType);
                this._currentSelect = heroType;
                this.refreshItemList();
                this.refreshDetail();
                this.playUnlockCelebration();
                const wx = (window as any).wx;
                if (wx) wx.showToast({ title: `解锁成功：${cfg.name}` });
            }, () => {
                const wx = (window as any).wx;
                if (wx) wx.showToast({ title: "广告未完整观看" });
            });
        } else {
            const wx = (window as any).wx;
            if (wx) {
                const fn = UNLOCK_HINT_MAP[cfg.unlockType];
                const hint = fn ? fn(cfg.unlockValue) : "未知";
                wx.showToast({ title: `解锁条件：${hint}` });
            }
        }
    }

    private playUnlockCelebration() {
        AudioManager.Instance.playSfx("audio/sfx/unlock");
        if (this.node.isValid) {
            const uiOpacity = this.node.getComponent(UIOpacity);
            if (uiOpacity) {
                uiOpacity.opacity = 255;
                tween(uiOpacity)
                    .to(0.1, { opacity: 128 })
                    .to(0.1, { opacity: 255 })
                    .to(0.1, { opacity: 128 })
                    .to(0.1, { opacity: 255 })
                    .start();
            }
        }
        if (this.selectedHeroIcon && this.selectedHeroIcon.isValid) {
            const origScale = this.selectedHeroIcon.node.scale.clone();
            tween(this.selectedHeroIcon.node)
                .to(0.15, { scale: new Vec3(origScale.x * 1.5, origScale.y * 1.5, 1) }, { easing: "backOut" })
                .to(0.3, { scale: origScale }, { easing: "elasticOut" })
                .start();
        }
        if (this.labSelectedName && this.labSelectedName.isValid) {
            const origPos = this.labSelectedName.node.position.clone();
            this.labSelectedName.string = "新英雄解锁！";
            this.labSelectedName.color = new Color(255, 215, 0, 255);
            tween(this.labSelectedName.node)
                .to(0.2, { position: new Vec3(origPos.x, origPos.y + 10, origPos.z) })
                .to(0.2, { position: origPos })
                .start();
        }
        this.scheduleOnce(() => {
            this.refreshUI();
        }, 0.8);
    }

    private refreshDetail() {
        const cfg = HERO_CONFIG[this._currentSelect];
        const isUnlocked = HeroManager.Instance.isUnlocked(this._currentSelect);
        const isSelected = this._currentSelect === HeroManager.Instance.getSelectedHero();
        const mastery = HeroManager.Instance.getMasteryData(this._currentSelect);

        if (this.labSelectedName) {
            const masteryName = mastery.level > 0 ? `[${mastery.name}]` : "";
            this.labSelectedName.string = masteryName ? `${cfg.name} ${masteryName}` : cfg.name;
        }
        if (this.labSelectedTitle) this.labSelectedTitle.string = cfg.title;
        if (this.labSelectedDesc) this.labSelectedDesc.string = cfg.desc;
        if (this.labSelectedSkill) {
            this.labSelectedSkill.string = `【${cfg.skillName}】${cfg.skillDesc}`;
        }

        if (this.labSelectedStats) {
            const parts: string[] = [];
            const masteryBonus = HeroManager.Instance.getMasteryBonus(this._currentSelect);
            const currentHeroData = HeroManager.Instance.getSelectedHeroData();
            const isDifferent = this._currentSelect !== currentHeroData.id;

            this.appendStat(parts, "生命", cfg.hpBonus + masteryBonus.hp, currentHeroData.hpBonus, isDifferent);
            this.appendStat(parts, "攻击", cfg.damageBonus + masteryBonus.damage, currentHeroData.damageBonus, isDifferent);
            this.appendStat(parts, "攻速", cfg.attackSpeedBonus, currentHeroData.attackSpeedBonus, isDifferent);
            this.appendStat(parts, "移速", cfg.moveSpeedBonus, currentHeroData.moveSpeedBonus, isDifferent);
            this.appendStat(parts, "经验", cfg.expBonus, currentHeroData.expBonus, isDifferent);
            this.labSelectedStats.string = parts.join("  ");
        }

        if (this.labMasteryInfo) {
            if (isUnlocked) {
                const totalKills = HeroManager.Instance.getHeroTotalKills(this._currentSelect);
                const maxSingleKill = HeroManager.Instance.getHeroMaxSingleKill(this._currentSelect);
                let info = "";
                if (mastery.level >= HERO_MASTERY_MAX_LEVEL) {
                    info = `熟练度: [${mastery.name}] 已达上限`;
                } else {
                    const nextCfg = HERO_MASTERY_CONFIG[Math.min(mastery.level + 1, HERO_MASTERY_MAX_LEVEL)];
                    info = `熟练度: [${mastery.name}] ${mastery.exp}/${mastery.nextExp} → ${nextCfg.name}`;
                }
                info += ` | 总击杀: ${totalKills}`;
                if (maxSingleKill > 0) info += ` | 最高单局: ${maxSingleKill}`;
                this.labMasteryInfo.string = info;
                this.labMasteryInfo.node.active = true;
            } else {
                this.labMasteryInfo.node.active = false;
            }
        }

        if (this.btnSelect && this.labBtnSelect) {
            if (!isUnlocked) {
                this.btnSelect.interactable = true;
                this.labBtnSelect.string = cfg.unlockType === "ad" ? "看广告解锁" : "未解锁";
            } else if (isSelected) {
                this.btnSelect.interactable = false;
                this.labBtnSelect.string = "当前英雄";
            } else {
                this.btnSelect.interactable = true;
                this.labBtnSelect.string = "选择英雄";
            }
        }

        if (this.labSelectedSkill) {
            const synergies = HERO_SYNERGY[this._currentSelect];
            const talentSynergies = getHeroTalentSynergyEntries(this._currentSelect);
            let skillText = `【${cfg.skillName}】${cfg.skillDesc}`;
            if (synergies && synergies.length > 0) {
                const synergyText = synergies.map(s => s.description).join(" | ");
                skillText += `\n推荐武器：${synergyText}`;
            }
            if (talentSynergies.length > 0) {
                const talentSynergyText = talentSynergies.map(s => s.description).join(" | ");
                skillText += `\n天赋加成：${talentSynergyText}`;
            }
            this.labSelectedSkill.string = skillText;
        }
    }

    private appendStat(parts: string[], label: string, val: number, currentVal: number, isDifferent: boolean) {
        const pct = Math.round((val - 1) * 100);
        const sign = pct >= 0 ? "+" : "";
        if (isDifferent) {
            const curPct = Math.round((currentVal - 1) * 100);
            const curSign = curPct >= 0 ? "+" : "";
            const arrow = pct > curPct ? "▲" : pct < curPct ? "▼" : "─";
            parts.push(`${label} ${sign}${pct}% ${arrow}(${curSign}${curPct}%)`);
        } else {
            parts.push(`${label} ${sign}${pct}%`);
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

    onDestroy() {
        this._isVisible = false;
        EventManager.Instance.off("HERO_MASTERY_UP", this.onMasteryUp, this);
    }

    private getChildComponent<T extends Component>(parent: Node, name: string, componentType: new (...args: any[]) => T): T | null {
        const child = parent.getChildByName(name);
        return child ? child.getComponent(componentType) : null;
    }
}