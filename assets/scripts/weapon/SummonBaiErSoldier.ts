import { _decorator, Node, math } from 'cc';
import { WeaponBase } from './WeaponBase';
import { GameManager } from '../core/GameManager';
import { Enemy } from '../entity/Enemy';
import { ObjectPool } from '../core/ObjectPool';
import { MinionSoldier } from '../entity/MinionSoldier';
const { ccclass, property } = _decorator;

@ccclass('SummonBaiErSoldier')
export class SummonBaiErSoldier extends WeaponBase {
    @property(Node) soldierPrefab: Node = null!;

    private soldierList: Node[] = [];
    private orbitRadius: number = 90;
    private orbitAngle: number = 0;
    private readonly ORBIT_SPEED: number = 45;

    protected onInit(): void {
        this.addSoldier();
        this.addSoldier();
    }

    addSoldier() {
        const soldier = ObjectPool.get("soldier_minion");
        if (!soldier) return;
        soldier.setParent(this.node);
        const comp = soldier.getComponent(MinionSoldier);
        if (comp) comp.init(this.getFinalDamage());
        this.soldierList.push(soldier);
    }

    protected attack(): void {
        const target = GameManager.Instance?.getNearestEnemy(
            this.player.node.worldPosition, this.config.range
        );
        if (!target) return;
        for (const soldier of this.soldierList) {
            const comp = soldier.getComponent(MinionSoldier);
            if (comp) comp.setAttackTarget(target);
        }
    }

    update(deltaTime: number) {
        super.update(deltaTime);
        if (!GameManager.Instance || GameManager.Instance.battlePause || GameManager.Instance.gameOver) return;
        this.orbitAngle += this.ORBIT_SPEED * deltaTime;
        const angleStep = 360 / this.soldierList.length;
        for (let i = 0; i < this.soldierList.length; i++) {
            const rad = math.toRadian(this.orbitAngle + i * angleStep);
            const x = Math.cos(rad) * this.orbitRadius;
            const y = Math.sin(rad) * this.orbitRadius;
            this.soldierList[i].setPosition(x, y);
        }
    }

    levelUp(): boolean {
        if (!super.levelUp()) return false;
        if (this.soldierList.length < 4) {
            this.addSoldier();
        }
        return true;
    }
}