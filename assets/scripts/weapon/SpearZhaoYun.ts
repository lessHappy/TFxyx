import { _decorator, Node, Vec3, math } from 'cc';
import { WeaponBase } from './WeaponBase';
import { GameManager } from '../core/GameManager';
import { Enemy } from '../entity/Enemy';
import { ObjectPool } from '../core/ObjectPool';
const { ccclass, property } = _decorator;

@ccclass('SpearZhaoYun')
export class SpearZhaoYun extends WeaponBase {
    @property(Node) spearPrefab: Node = null!;

    private spearNodes: Node[] = [];
    private rotateAngle: number = 0;
    private rotateSpeed: number = 120;
    private orbitRadius: number = 75;
    private pierceCount: number = 1;
    private hitEnemySet: Set<Enemy> = new Set();

    private _worldPos: Vec3 = new Vec3();

    protected onInit(): void {
        this.addSpear();
    }

    addSpear() {
        const spear = ObjectPool.get("spear");
        spear.setParent(this.node);
        this.spearNodes.push(spear);
    }

    protected attack(): void {
        this.hitEnemySet.clear();
    }

    update(deltaTime: number) {
        super.update(deltaTime);
        if (!this.player) return;
        this.rotateAngle += this.rotateSpeed * deltaTime;
        const angleStep = 360 / this.spearNodes.length;

        const playerPos = this.player.node.position;
        for (let i = 0; i < this.spearNodes.length; i++) {
            const angle = math.toRadian(this.rotateAngle + i * angleStep);
            const offsetX = Math.cos(angle) * this.orbitRadius;
            const offsetY = Math.sin(angle) * this.orbitRadius;
            this.spearNodes[i].setPosition(offsetX, offsetY, 0);
            this._worldPos.set(playerPos.x + offsetX, playerPos.y + offsetY, 0);
            this.checkHitEnemy(this._worldPos);
        }
    }

    private checkHitEnemy(worldPos: Vec3) {
        const enemyList = GameManager.Instance!.getEnemyInRange(worldPos, 45);
        let hitNum = 0;
        for (const enemy of enemyList) {
            if (this.hitEnemySet.has(enemy)) continue;
            if (hitNum >= this.pierceCount) break;
            enemy.takeDamage(this.getFinalDamage());
            this.hitEnemySet.add(enemy);
            hitNum++;
        }
    }

    levelUp(): boolean {
        if (!super.levelUp()) return false;
        if (this.spearNodes.length < 3) {
            this.addSpear();
        }
        this.pierceCount = Math.min(this.pierceCount + 1, this.spearNodes.length);
        this.orbitRadius += 15;
        return true;
    }
}