import { _decorator, Node, instantiate } from 'cc';
import { WeaponBase } from './WeaponBase';
import { WEAPON_CONFIG } from '../config/WeaponConfig';
import { Player } from '../entity/Player';
import { AchievementManager } from '../core/AchievementManager';
import { ACHIEVEMENT_STORAGE_KEYS } from '../config/AchievementConfig';
const { ccclass, property } = _decorator;

@ccclass("WeaponManager")
export class WeaponManager {
    private static instance: WeaponManager;
    static get Instance() {
        if (!WeaponManager.instance) WeaponManager.instance = new WeaponManager();
        return WeaponManager.instance;
    }

    @property({ type: Node }) knifePrefab!: Node;
    @property({ type: Node }) fireBallPrefab!: Node;
    @property({ type: Node }) boomerangPrefab!: Node;
    @property({ type: Node }) spearPrefab!: Node;
    @property({ type: Node }) summonBaiErPrefab!: Node;

    // 当前携带武器列表
    private equipWeaponList: WeaponBase[] = [];
    private player!: Player;

    init(player: Player) {
        this.player = player;
        this.equipWeaponList = [];
    }

    // 添加武器（升级选择界面调用）
    addWeapon(weaponId: string): boolean {
        const cfg = WEAPON_CONFIG[weaponId];
        if (!cfg) return false;

        // 判断是否已有该武器，有则直接升级
        const existWeapon = this.equipWeaponList.find(w => w.weaponId === weaponId);
        if (existWeapon) {
            if (existWeapon.isMaxLevel()) return false;
            return existWeapon.levelUp();
        }

        // 创建武器实例挂载到玩家节点
        let prefab: Node | null = null;
        switch (weaponId) {
            case "spear": prefab = this.spearPrefab; break;
            case "knife": prefab = this.knifePrefab; break;
            case "fireball": prefab = this.fireBallPrefab; break;
            case "boomerang": prefab = this.boomerangPrefab; break;
            case "summon_bai_er": prefab = this.summonBaiErPrefab; break;
        }
        if (!prefab) return false;

        const weaponNode = instantiate(prefab);
        weaponNode.setParent(this.player.node);
        const weaponComp = weaponNode.getComponent(WeaponBase);
        if (!weaponComp) {
            weaponNode.destroy();
            return false;
        }
        weaponComp.init(this.player, weaponId, 1);
        this.equipWeaponList.push(weaponComp);

        AchievementManager.Instance.addStat(ACHIEVEMENT_STORAGE_KEYS.TOTAL_WEAPON, 1);
        return true;
    }

    getEquipWeapons(): WeaponBase[] {
        return this.equipWeaponList;
    }

    clearAllWeapon() {
        for (const w of this.equipWeaponList) {
            w.node.destroy();
        }
        this.equipWeaponList.length = 0;
    }
}