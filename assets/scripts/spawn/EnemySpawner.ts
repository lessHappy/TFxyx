import { _decorator, Component, Vec3, randomRange } from 'cc';
import { GameManager } from '../core/GameManager';
import { Enemy } from '../entity/Enemy';
import { EnemyPoolManager, EnemyType } from '../core/EnemyPoolManager';
import { SPAWN_CONFIG } from '../config/GameConfig';
import { Player } from '../entity/Player';
const { ccclass, property } = _decorator;

@ccclass('EnemySpawner')
export class EnemySpawner extends Component {
    private spawnTimer: number = 0;
    private _spawnPos: Vec3 = new Vec3();

    update(deltaTime: number) {
        if (!GameManager.Instance || GameManager.Instance.battlePause || GameManager.Instance.gameOver || !Player.Instance) return;
        const gm = GameManager.Instance;
        if (gm.enemyList.length >= SPAWN_CONFIG.maxEnemyTotal) return;

        const dynamicInterval = Math.max(
            SPAWN_CONFIG.minSpawnInterval,
            SPAWN_CONFIG.spawnInterval / gm.difficultyScale
        );
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= dynamicInterval) {
            this.spawnEnemy();
            this.spawnTimer = 0;
        }
    }

    spawnEnemy() {
        const gm = GameManager.Instance!;
        const playerPos = Player.Instance!.node.worldPosition;
        const angle = randomRange(0, Math.PI * 2);
        const dist = randomRange(320, 450);
        this._spawnPos.set(
            playerPos.x + Math.cos(angle) * dist,
            playerPos.y + Math.sin(angle) * dist,
            0
        );

        // 动态权重：难度越高，精英怪占比越大
        const scale = gm.difficultyScale;
        const tankWeight = Math.min(0.4, SPAWN_CONFIG.tankWeightBase + SPAWN_CONFIG.tankWeightPerScale * (scale - 1) * 10);
        const fastWeight = Math.min(0.4, SPAWN_CONFIG.fastWeightBase + SPAWN_CONFIG.fastWeightPerScale * (scale - 1) * 10);

        let type: EnemyType = EnemyType.NORMAL;
        const rand = Math.random();
        if (rand < tankWeight) {
            type = EnemyType.TANK;
        } else if (rand < tankWeight + fastWeight) {
            type = EnemyType.FAST;
        }

        const enemyNode = EnemyPoolManager.Instance.getEnemy(type);
        if (!enemyNode) return;

        enemyNode.setWorldPosition(this._spawnPos);
        const enemyComp = enemyNode.getComponent(Enemy);
        if (enemyComp) enemyComp.init(type);
    }
}