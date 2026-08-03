import { _decorator, Component, Node, Vec3 } from 'cc';
import { WeaponConfigData, WEAPON_CONFIG } from '../config/WeaponConfig';
import { Player } from '../entity/Player';
import { GameManager } from '../core/GameManager';
import { TalentManager } from '../core/TalentManager';
import { TalentType } from '../config/TalentConfig';
import { HeroType } from '../config/HeroConfig';
import { WEAPON_UPGRADE_CONFIG } from '../config/GameConfig';
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

    private _heroAtkBonus: number = 1;
    private _heroSpdBonus: number = 1;
    private _heroCritDmgBonus: number = 0;

    init(player: Player, weaponId: string, lv: number = 1) {
        this.player = player;
        this.weaponId = weaponId;
        this.weaponLv = lv;
        this.applyTalentBonuses();
        this.applyHeroBonuses();
        const cfg = WEAPON_CONFIG[weaponId];
        if (!cfg) {
            console.error(`[WeaponBase] 无效的武器ID: ${weaponId}`);
            return;
        }
        this.config = cfg;
        this.curAttackInterval = cfg.attackInterval;
        this.attackTimer = 0;
        this.onInit();
    }

    private applyTalentBonuses() {
        const tm = TalentManager.Instance;
        this._talentAtkBonus = tm.getEffectPercent(TalentType.ATTACK);
        this._talentSpdBonus = tm.getEffectPercent(TalentType.ATTACK_SPEED);
        this._talentCritRate = tm.getEffectValue(TalentType.CRIT_RATE);
        const critDmgBonus = tm.getEffectValue(TalentType.CRIT_DAMAGE);
        this._talentCritDmg = 1.5 + critDmgBonus;
    }

    private applyHeroBonuses() {
        if (!this.player) return;
        this._heroAtkBonus = this.player.getHeroDamageBonus();
        this._heroSpdBonus = this.player.getHeroAttackSpeedBonus();
        this._heroCritDmgBonus = this.player.getHeroCritDmgBonus();
    }

    getDamage(): number {
        if (!this.config) return 0;
        const baseDmg = this.config.baseDamage + (this.weaponLv - 1) * this.config.damageAddPerLv;
        return Math.floor(baseDmg * this._talentAtkBonus * this._heroAtkBonus);
    }

    getFinalDamage(): number {
        let dmg = this.getDamage();
        if (this.player) {
            dmg = Math.floor(dmg * (1 + this.player.getHeroLowHpDmgBonus()));
        }
        if (this._talentCritRate > 0 && Math.random() < this._talentCritRate) {
            return Math.floor(dmg * (this._talentCritDmg + this._heroCritDmgBonus));
        }
        return dmg;
    }

    getProjectileCount(): number {
        const extra = TalentManager.Instance.getEffectValue(TalentType.PROJECTILE_COUNT);
        return 1 + Math.floor(extra);
    }

    isMaxLevel(): boolean {
        return this.weaponLv >= this.config.maxLevel;
    }

    protected abstract onInit(): void;

    protected abstract attack(): void;

    update(dt: number) {
        if (!GameManager.Instance || GameManager.Instance.battlePause || GameManager.Instance.gameOver) return;
        if (!this.player || !this.config) return;

        this.attackTimer += dt * this._talentSpdBonus * this._heroSpdBonus;
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