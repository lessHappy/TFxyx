import { _decorator, Component, Node, Button, Label } from 'cc';
import { OfflineIncome } from '../utils/OfflineIncome';
import { AudioManager } from '../core/AudioManager';
import { StorageUtil } from '../core/StorageUtil';
import { STORAGE_KEY } from './MainMenu';
import { DOUBLE_BUFF_CONFIG } from '../config/GameConfig';
const { ccclass, property } = _decorator;

@ccclass("OfflineRewardUI")
export class OfflineRewardUI extends Component {
    @property(Label) goldLabel: Label = null!;
    @property(Button) claimBtn: Button = null!;

    private rewardGold = 0;

    onLoad() {
        this.node.active = false;
        this.claimBtn.node.on(Button.Event.CLICK, this.onClaim, this);
    }

    tryShowPanel() {
        this.rewardGold = OfflineIncome.calcOfflineGold();
        if (this.rewardGold <= 0) return;

        // 双倍Buff生效
        const hasDoubleBuff = StorageUtil.getBool(STORAGE_KEY.DOUBLE_BUFF, false);
        if (hasDoubleBuff) {
            this.rewardGold *= DOUBLE_BUFF_CONFIG.goldMultiplier;
        }

        this.node.active = true;
        this.goldLabel.string = `离线收益：${this.rewardGold} 金币${hasDoubleBuff ? ' (双倍)' : ''}`;
    }

    private onClaim() {
        AudioManager.Instance.playSfx("audio/sfx/gold");
        const currentGold = StorageUtil.getNumber(STORAGE_KEY.GOLD, 0);
        StorageUtil.setNumber(STORAGE_KEY.GOLD, currentGold + this.rewardGold);
        this.node.active = false;
    }
}