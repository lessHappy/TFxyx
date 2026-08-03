import { _decorator } from 'cc';
import { COMBO_CONFIG } from '../config/GameConfig';
const { ccclass } = _decorator;

@ccclass('ComboManager')
export class ComboManager {
    public static Instance: ComboManager = new ComboManager();

    public comboCount: number = 0;
    public maxComboCount: number = 0;
    public comboLevel: number = 0;
    private comboTimer: number = 0;
    private isActive: boolean = false;

    reset() {
        this.comboCount = 0;
        this.maxComboCount = 0;
        this.comboLevel = 0;
        this.comboTimer = 0;
        this.isActive = false;
    }

    // 每次击杀调用
    onKill(): number {
        this.comboCount++;
        this.comboTimer = COMBO_CONFIG.maxComboTime;
        this.isActive = true;

        if (this.comboCount > this.maxComboCount) {
            this.maxComboCount = this.comboCount;
        }

        // 检查连杀等级
        let newLevel = 0;
        for (let i = COMBO_CONFIG.comboThreshold.length - 1; i >= 0; i--) {
            if (this.comboCount >= COMBO_CONFIG.comboThreshold[i]) {
                newLevel = i + 1;
                break;
            }
        }
        this.comboLevel = newLevel;

        // 返回经验加成倍率
        if (this.comboLevel > 0) {
            return COMBO_CONFIG.comboExpBonus[this.comboLevel - 1];
        }
        return 0;
    }

    // 获取当前连杀等级加成倍率
    getExpBonus(): number {
        if (this.comboLevel > 0) {
            return COMBO_CONFIG.comboExpBonus[this.comboLevel - 1];
        }
        return 0;
    }

    update(dt: number) {
        if (!this.isActive) return;
        this.comboTimer -= dt;
        if (this.comboTimer <= 0) {
            this.comboCount = 0;
            this.comboLevel = 0;
            this.isActive = false;
        }
    }
}