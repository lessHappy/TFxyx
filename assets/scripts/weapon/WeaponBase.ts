import { _decorator, Component, Node, Vec3 } from 'cc';
import { WeaponConfigData, WEAPON_CONFIG } from '../config/WeaponConfig';
import { Player } from '../entity/Player';
import { GameManager } from '../core/GameManager';
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

    init(player: Player, weaponId: string, lv: number = 1) {
        this.player = player;
        this.weaponId = weaponId;
        this.weaponLv = lv;
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

    getDamage(): number {
        if (!this.config) return 0;
        return this.config.baseDamage + (this.weaponLv - 1) * this.config.damageAddPerLv;
    }

    isMaxLevel(): boolean {
        return this.weaponLv >= this.config.maxLevel;
    }

    protected abstract onInit(): void;

    protected abstract attack(): void;

    update(dt: number) {
        if (!GameManager.Instance || GameManager.Instance.battlePause || GameManager.Instance.gameOver) return;
        if (!this.player || !this.config) return;

        this.attackTimer += dt;
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