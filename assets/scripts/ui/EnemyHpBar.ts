import { _decorator, Component, Node, ProgressBar, Vec3 } from 'cc';
import { Enemy } from '../entity/Enemy';
const { ccclass, property } = _decorator;

@ccclass("EnemyHpBar")
export class EnemyHpBar extends Component {
    @property(ProgressBar) hpBar:ProgressBar = null!;
    @property offsetY:number = 35;

    private enemy:Enemy|null = null;

    bindEnemy(enemy:Enemy){
        this.enemy = enemy;
        this.node.active = true;
    }

    unBind(){
        this.enemy = null;
        this.node.active = false;
    }

    update(){
        if(!this.enemy || !this.enemy.node || !this.enemy.node.active) {
            this.node.active = false;
            return;
        }
        const pos = this.enemy.node.worldPosition;
        this.node.setWorldPosition(pos.x, pos.y + this.offsetY, pos.z);
        const hpPercent = this.enemy.hp / this.enemy.maxHp;
        if (this.hpBar.progress !== hpPercent) {
            this.hpBar.progress = hpPercent;
        }
    }
}