import { _decorator, Component, Vec3, math } from 'cc';
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
            this.spawnTimer -= dynamicInterval;

            if (Math.random() < SPAWN_CONFIG.formationChance) {
                this.spawnFormation();
            } else {
                this.spawnEnemy();
            }
        }
    }

    spawnEnemy() {
        const gm = GameManager.Instance!;
        const playerPos = Player.Instance!.node.worldPosition;
        const angle = math.randomRange(0, Math.PI * 2);
        const dist = math.randomRange(320, 450);
        this._spawnPos.set(
            playerPos.x + Math.cos(angle) * dist,
            playerPos.y + Math.sin(angle) * dist,
            0
        );

        const type = this.getRandomEnemyType();
        this.spawnEnemyAt(type, this._spawnPos);
    }

    getRandomEnemyType(): EnemyType {
        const scale = GameManager.Instance!.difficultyScale;
        const scaleFactor = (scale - 1) * 10;

        const tankWeight = Math.min(0.4, SPAWN_CONFIG.tankWeightBase + SPAWN_CONFIG.tankWeightPerScale * scaleFactor);
        const fastWeight = Math.min(0.4, SPAWN_CONFIG.fastWeightBase + SPAWN_CONFIG.fastWeightPerScale * scaleFactor);
        const rangedWeight = Math.min(0.25, SPAWN_CONFIG.rangedWeightBase + SPAWN_CONFIG.rangedWeightPerScale * scaleFactor);
        const bomberWeight = Math.min(0.2, SPAWN_CONFIG.bomberWeightBase + SPAWN_CONFIG.bomberWeightPerScale * scaleFactor);
        const summonerWeight = Math.min(0.15, SPAWN_CONFIG.summonerWeightBase + SPAWN_CONFIG.summonerWeightPerScale * scaleFactor);
        const healerWeight = Math.min(0.15, SPAWN_CONFIG.healerWeightBase + SPAWN_CONFIG.healerWeightPerScale * scaleFactor);
        const controllerWeight = Math.min(0.15, SPAWN_CONFIG.controllerWeightBase + SPAWN_CONFIG.controllerWeightPerScale * scaleFactor);

        const totalWeight = tankWeight + fastWeight + rangedWeight + bomberWeight + summonerWeight + healerWeight + controllerWeight;
        const rand = Math.random() * totalWeight;

        let cumulative = 0;
        cumulative += tankWeight;
        if (rand < cumulative) return EnemyType.TANK;
        cumulative += fastWeight;
        if (rand < cumulative) return EnemyType.FAST;
        cumulative += rangedWeight;
        if (rand < cumulative) return EnemyType.RANGED;
        cumulative += bomberWeight;
        if (rand < cumulative) return EnemyType.BOMBER;
        cumulative += summonerWeight;
        if (rand < cumulative) return EnemyType.SUMMONER;
        cumulative += healerWeight;
        if (rand < cumulative) return EnemyType.HEALER;
        cumulative += controllerWeight;
        if (rand < cumulative) return EnemyType.CONTROLLER;

        return EnemyType.NORMAL;
    }

    spawnFormation() {
        const gm = GameManager.Instance!;
        const playerPos = Player.Instance!.node.worldPosition;
        const count = math.randomRangeInt(SPAWN_CONFIG.formationMinSize, SPAWN_CONFIG.formationMaxSize + 1);

        const angle = math.randomRange(0, Math.PI * 2);
        const dist = math.randomRange(360, 500);
        const centerX = playerPos.x + Math.cos(angle) * dist;
        const centerY = playerPos.y + Math.sin(angle) * dist;

        const formationType = math.randomRangeInt(0, 4);
        const type = this.getRandomEnemyType();

        const positions = this.getFormationPositions(centerX, centerY, count, formationType);

        for (let i = 0; i < positions.length; i++) {
            this._spawnPos.set(positions[i].x, positions[i].y, 0);
            this.spawnEnemyAt(type, this._spawnPos);
        }
    }

    getFormationPositions(cx: number, cy: number, count: number, formationType: number): { x: number; y: number }[] {
        const positions: { x: number; y: number }[] = [];
        const spacing = 50;

        switch (formationType) {
            case 0: {
                const cols = Math.ceil(Math.sqrt(count));
                const rows = Math.ceil(count / cols);
                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        if (positions.length >= count) break;
                        positions.push({
                            x: cx + (c - (cols - 1) / 2) * spacing,
                            y: cy + (r - (rows - 1) / 2) * spacing
                        });
                    }
                }
                break;
            }
            case 1: {
                for (let i = 0; i < count; i++) {
                    const a = (Math.PI * 2 * i) / count;
                    const radius = spacing * 1.2;
                    positions.push({
                        x: cx + Math.cos(a) * radius,
                        y: cy + Math.sin(a) * radius
                    });
                }
                break;
            }
            case 2: {
                for (let i = 0; i < count; i++) {
                    const row = Math.floor(i / 2);
                    const col = i % 2;
                    const offsetX = row % 2 === 0 ? 0 : spacing / 2;
                    positions.push({
                        x: cx + (col * spacing) - spacing / 2 + offsetX,
                        y: cy + row * spacing * 0.866
                    });
                }
                break;
            }
            case 3: {
                for (let i = 0; i < count; i++) {
                    const a = (Math.PI * 2 * i) / count;
                    const radius = spacing * (1 + i * 0.15);
                    positions.push({
                        x: cx + Math.cos(a) * radius,
                        y: cy + Math.sin(a) * radius
                    });
                }
                break;
            }
            case 4: {
                const half = Math.floor(count / 2);
                for (let i = 0; i < count; i++) {
                    if (i < half) {
                        positions.push({
                            x: cx - spacing * 1.5 + i * spacing * 0.5,
                            y: cy + spacing
                        });
                    } else {
                        positions.push({
                            x: cx - spacing * 1.5 + (i - half) * spacing * 0.5,
                            y: cy - spacing
                        });
                    }
                }
                break;
            }
        }

        return positions;
    }

    spawnEnemyAt(type: EnemyType, pos: Vec3) {
        const enemyNode = EnemyPoolManager.Instance.getEnemy(type);
        if (!enemyNode) return;

        enemyNode.setWorldPosition(pos);
        const enemyComp = enemyNode.getComponent(Enemy);
        if (enemyComp) enemyComp.init(type);
    }
}