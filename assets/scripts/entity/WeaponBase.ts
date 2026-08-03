import { _decorator, Component } from 'cc';
import { Player } from './Player';
import { GameManager } from '../core/GameManager';
import { Enemy } from './Enemy';
const { ccclass, property } = _decorator;

export interface WeaponStats {
    damage: number;
    range: number;
    cooldown: number;
}

@ccclass('WeaponBase')
export abstract class WeaponBase extends Component {
    protected player: Player | null = null;
    protected stats: WeaponStats = {
        damage: 20,
        range: 120,
        cooldown: 0.6
    };
    protected cdTimer: number = 0;

    onLoad() {
        this.player = Player.Instance;
    }

    update(deltaTime: number) {
        if (!this.player || !GameManager.Instance || GameManager.Instance.battlePause || GameManager.Instance.gameOver) return;
        this.cdTimer += deltaTime;
        if (this.cdTimer >= this.stats.cooldown) {
            const target = GameManager.Instance.getNearestEnemy(this.player.node.position, this.stats.range);
            if (target) {
                this.onAttack(target);
                this.cdTimer = 0;
            }
        }
    }

    protected abstract onAttack(target: Enemy): void;

    public upgradeWeapon(newStats: Partial<WeaponStats>) {
        this.stats = { ...this.stats, ...newStats };
        this.onUpgradeEffect();
    }

    protected onUpgradeEffect() { }
}