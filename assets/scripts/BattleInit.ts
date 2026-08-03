import { _decorator, Component, Node } from 'cc';
import { ObjectPool } from './core/ObjectPool';
const { ccclass, property } = _decorator;

@ccclass('BattleInit')
export class BattleInit extends Component {
    @property(Node) expPrefab: Node = null!;
    @property(Node) spearPrefab: Node = null!;
    @property(Node) soldierPrefab: Node = null!;
    @property(Node) damageNumberPrefab: Node = null!;
    @property(Node) chestPrefab: Node = null!;

    onLoad() {
        ObjectPool.register("exp", this.expPrefab, 15);
        ObjectPool.register("spear", this.spearPrefab, 4);
        ObjectPool.register("soldier_minion", this.soldierPrefab, 5);
        if (this.damageNumberPrefab) {
            ObjectPool.register("dmg_number", this.damageNumberPrefab, 20);
        }
        if (this.chestPrefab) {
            ObjectPool.register("chest", this.chestPrefab, 5);
        }
    }
}