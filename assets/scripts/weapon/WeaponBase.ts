import { _decorator, Component, Node, Vec3 } from 'cc';
import { WeaponConfigData, WEAPON_CONFIG } from '../config/WeaponConfig';
import { Player } from '../entity/Player';
import { GameManager } from '../core/GameManager';
import { TalentManager, TalentChangeEvent } from '../core/TalentManager';
import { TalentType } from '../config/TalentConfig';
import { WEAPON_UPGRADE_CONFIG } from '../config/GameConfig';
import { getHeroSynergyBonus, HeroSynergyData, HeroType } from '../config/HeroConfig';
import { StatusType } from '../buff/StatusEffect';
const { ccclass, property } = _decorator;

@ccclass("WeaponBase")
export abstract class WeaponBase extends Component {
    public weaponId: string = "";
    public config!: WeaponConfigData;
    public weaponLv: number = 1;
    protected attackTimer: number = 0;
    protected curAttackInterval: number = 0;

    protected player!: Player;
    protected tempVec: Vec3 = new Vec3();
    protected bulletDir: Vec3 = new Vec3();

    private _talentAtkBonus: number = 1;
    private _talentSpdBonus: number = 1;
    private _talentCritRate: number = 0;
    private _talentCritDmg: number = 1.5;

    private _heroSpdBonus: number = 1;
    private _heroCritDmgBonus: number = 0;
    private _synergyData: HeroSynergyData | null = null;
    private _synergyDmgBonus: number = 0;
    private _synergyRangeBonus: number = 0;
    private _synergySpdBonus: number = 0;
    private _synergyCritRateBonus: number = 0;
    private _synergyCritDmgBonus: number = 0;

    protected debuffType: StatusType | null = null;
    protected debuffChance: number = 0;
    protected debuffDuration: number = 0;
    protected debuffValue: number = 0;

    init(player: Player, weaponId: string, lv: number = 1) {
        this.player = player;
        this.weaponId = weaponId;
        this.weaponLv = lv;
        this.applyTalentBonuses();
        this.applyHeroBonuses();
        this.applySynergyBonuses();
        const cfg = WEAPON_CONFIG[weaponId];
        if (!cfg) {
            console.error(`[WeaponBase] 无效的武器ID: ${weaponId}`);
            return;
        }
        this.config = cfg;
        this.curAttackInterval = cfg.attackInterval;
        this.attackTimer = 0;
        this.onInit();
        TalentManager.Instance.addListener(this.onTalentChanged);
    }

    onDestroy() {
        TalentManager.Instance.removeListener(this.onTalentChanged);
    }

    private onTalentChanged = (event: TalentChangeEvent) => {
        this.applyTalentBonuses();
    };

    private applyTalentBonuses() {
        const tm = TalentManager.Instance;
        const heroType = this.player ? this.player.getHeroType() : HeroType.ZHAO_YUN;
        this._talentAtkBonus = tm.getEffectPercentWithHero(TalentType.ATTACK, heroType);
        this._talentSpdBonus = tm.getEffectPercentWithHero(TalentType.ATTACK_SPEED, heroType);
        this._talentCritRate = tm.getEffectValueWithHero(TalentType.CRIT_RATE, heroType);
        const critDmgBonus = tm.getEffectValueWithHero(TalentType.CRIT_DAMAGE, heroType);
        this._talentCritDmg = 1.5 + critDmgBonus;
    }

    private applyHeroBonuses() {
        if (!this.player) return;
        this._heroSpdBonus = this.player.getHeroAttackSpeedBonus();
        this._heroCritDmgBonus = this.player.getHeroCritDmgBonus();
    }

    private applySynergyBonuses() {
        if (!this.player) return;
        const heroType = this.player.getHeroType();
        this._synergyData = getHeroSynergyBonus(heroType, this.weaponId);
        if (this._synergyData) {
            this._synergyDmgBonus = this._synergyData.damageBonus || 0;
            this._synergyRangeBonus = this._synergyData.rangeBonus || 0;
            this._synergySpdBonus = this._synergyData.attackSpeedBonus || 0;
            this._synergyCritRateBonus = this._synergyData.critRateBonus || 0;
            this._synergyCritDmgBonus = this._synergyData.critDmgBonus || 0;
        } else {
            this._synergyDmgBonus = 0;
            this._synergyRangeBonus = 0;
            this._synergySpdBonus = 0;
            this._synergyCritRateBonus = 0;
            this._synergyCritDmgBonus = 0;
        }
    }

    getSynergyData(): HeroSynergyData | null {
        return this._synergyData;
    }

    refreshHeroBonuses() {
        this.applyHeroBonuses();
        this.applySynergyBonuses();
    }

    getDamage(): number {
        if (!this.config) return 0;
        const baseDmg = this.config.baseDamage + (this.weaponLv - 1) * this.config.damageAddPerLv;
        const heroAtkBonus = this.player ? this.player.getHeroDamageBonus() : 1;
        const buffDmgMult = this.player ? this.player.getBuffDamageMultiplier() : 1;
        return Math.floor(baseDmg * this._talentAtkBonus * heroAtkBonus * buffDmgMult * (1 + this._synergyDmgBonus));
    }

    getFinalDamage(): number {
        let dmg = this.getDamage();
        if (this.player) {
            dmg = Math.floor(dmg * (1 + this.player.getHeroLowHpDmgBonus()));
        }
        const totalCritRate = this._talentCritRate + this._synergyCritRateBonus;
        if (totalCritRate > 0 && Math.random() < totalCritRate) {
            return Math.floor(dmg * (this._talentCritDmg + this._heroCritDmgBonus + this._synergyCritDmgBonus));
        }
        return dmg;
    }

    getProjectileCount(): number {
        const heroType = this.player ? this.player.getHeroType() : HeroType.ZHAO_YUN;
        const extra = TalentManager.Instance.getEffectValueWithHero(TalentType.PROJECTILE_COUNT, heroType);
        return 1 + Math.floor(extra);
    }

    isMaxLevel(): boolean {
        return this.weaponLv >= this.config.maxLevel;
    }

    setDebuff(type: StatusType, chance: number, duration: number, value: number = 0): void {
        this.debuffType = type;
        this.debuffChance = chance;
        this.debuffDuration = duration;
        this.debuffValue = value;
    }

    getDebuffData(): { type: StatusType; duration: number; value: number } | null {
        if (!this.debuffType || this.debuffChance <= 0) return null;
        if (Math.random() >= this.debuffChance) return null;
        return {
            type: this.debuffType,
            duration: this.debuffDuration,
            value: this.debuffValue,
        };
    }

    protected abstract onInit(): void;

    protected abstract attack(): void;

    update(dt: number) {
        if (!GameManager.Instance || GameManager.Instance.battlePause || GameManager.Instance.gameOver) return;
        if (!this.player || !this.config) return;

        const buffAtkSpdMult = this.player ? this.player.getBuffAttackSpeedMultiplier() : 1;
        this.attackTimer += dt * this._talentSpdBonus * this._heroSpdBonus * buffAtkSpdMult * (1 + this._synergySpdBonus);
        if (this.attackTimer >= this.curAttackInterval) {
            this.attackTimer = 0;
            this.attack();
        }
    }

    levelUp(): boolean {
        if (this.isMaxLevel()) return false;
        this.weaponLv++;

        // 攻击间隔随等级减少
        const reduceRatio = this.config.intervalReducePerLv || WEAPON_UPGRADE_CONFIG.intervalReducePerLv;
        const minRatio = WEAPON_UPGRADE_CONFIG.minIntervalRatio;
        this.curAttackInterval = Math.max(
            this.config.attackInterval * minRatio,
            this.config.attackInterval * (1 - (this.weaponLv - 1) * reduceRatio)
        );

        return true;
    }
}