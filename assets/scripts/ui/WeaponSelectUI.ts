import { _decorator, Component, Node, Button, Label, instantiate } from 'cc';
import { WEAPON_CONFIG } from '../config/WeaponConfig';
import { WeaponManager } from '../weapon/WeaponManager';
import { GameManager } from '../core/GameManager';
import { Player } from '../entity/Player';
import { AudioManager } from '../core/AudioManager';
const { ccclass, property } = _decorator;

interface SelectItemData {
    id: string;
    name: string;
    desc: string;
    currentLv: number;
    maxLv: number;
}

@ccclass("WeaponSelectUI")
export class WeaponSelectUI extends Component {
    @property(Node) itemContainer: Node = null!;
    @property(Node) itemPrefab: Node = null!;

    private itemList: Node[] = [];
    private selectDataList: SelectItemData[] = [];

    onLoad() {
        this.node.active = false;
    }

    // 外部调用：弹出武器选择
    showSelectPanel() {
        this.node.active = true;
        this.generateRandomWeaponList();
        if (this.selectDataList.length === 0) {
            // 所有武器已满级，直接关闭选择面板
            this.node.active = false;
            GameManager.Instance!.battlePause = false;
            return;
        }
        this.refreshUI();
    }

    // 随机筛选3个可用武器（排除已满级的）
    private generateRandomWeaponList() {
        this.selectDataList = [];
        const playerLv = Player.Instance.level;
        const equippedWeapons = WeaponManager.Instance.getEquipWeapons();
        const equippedMap: Record<string, number> = {};
        const maxLevelMap: Record<string, boolean> = {};
        for (const w of equippedWeapons) {
            equippedMap[w.weaponId] = w.weaponLv;
            maxLevelMap[w.weaponId] = w.isMaxLevel();
        }

        // 过滤：已解锁 且 未满级
        const pool = Object.values(WEAPON_CONFIG).filter(cfg => {
            if (cfg.unlockLv > playerLv) return false;
            if (maxLevelMap[cfg.id]) return false;
            return true;
        });

        // Fisher-Yates 洗牌
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = pool[i];
            pool[i] = pool[j];
            pool[j] = tmp;
        }

        const pickCount = Math.min(3, pool.length);
        for (let i = 0; i < pickCount; i++) {
            const cfg = pool[i];
            const currentLv = equippedMap[cfg.id] || 0;
            this.selectDataList.push({
                id: cfg.id,
                name: cfg.name,
                desc: cfg.desc,
                currentLv: currentLv,
                maxLv: cfg.maxLevel
            });
        }
    }

    private refreshUI() {
        // 清空旧选项
        this.itemContainer.removeAllChildren();
        this.itemList = [];

        for (let i = 0; i < this.selectDataList.length; i++) {
            const data = this.selectDataList[i];
            const itemNode = instantiate(this.itemPrefab);
            itemNode.active = true;
            itemNode.setParent(this.itemContainer);
            this.itemList.push(itemNode);

            const nameLabel = itemNode.getChildByName("Name").getComponent(Label);
            const descLabel = itemNode.getChildByName("Desc").getComponent(Label);
            const btn = itemNode.getComponent(Button);

            nameLabel.string = data.name;
            descLabel.string = data.desc;

            const lvLabel = itemNode.getChildByName("Level")?.getComponent(Label);
            if (lvLabel) {
                if (data.currentLv > 0) {
                    const isMaxed = data.currentLv >= data.maxLv;
                    lvLabel.string = isMaxed ? `Lv.${data.currentLv}/${data.maxLv} (已满级)` : `Lv.${data.currentLv}/${data.maxLv}`;
                    lvLabel.node.active = true;
                } else {
                    lvLabel.string = "NEW";
                    lvLabel.node.active = true;
                }
            }

            btn.node.on(Button.Event.CLICK, () => {
                this.onSelectWeapon(data.id);
            }, this);
        }
    }

    // 选中武器
    private onSelectWeapon(weaponId: string) {
        AudioManager.Instance.playSfx("audio/sfx/select");
        WeaponManager.Instance.addWeapon(weaponId);
        this.node.active = false;
        GameManager.Instance!.battlePause = false;
    }
}