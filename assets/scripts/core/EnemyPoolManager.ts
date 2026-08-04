import { _decorator, Node, instantiate } from 'cc';
import { Enemy } from '../entity/Enemy';
const { ccclass } = _decorator;

export enum EnemyType {
    NORMAL = "normal",
    FAST = "fast",
    TANK = "tank",
    BOSS = "boss",
    RANGED = "ranged",
    BOMBER = "bomber",
    SUMMONER = "summoner",
    HEALER = "healer",
    CONTROLLER = "controller"
}

type EnemyPoolData = {
    prefab: Node;
    cacheList: Node[];
    maxCache: number;
}

@ccclass("EnemyPoolManager")
export class EnemyPoolManager {
    private static instance: EnemyPoolManager;
    public static get Instance() {
        if (!EnemyPoolManager.instance) EnemyPoolManager.instance = new EnemyPoolManager();
        return EnemyPoolManager.instance;
    }

    private poolMap: Map<string, EnemyPoolData> = new Map();
    private enemyRoot: Node | null = null;

    init(rootNode: Node) {
        this.enemyRoot = rootNode;
    }

    // 注册怪物预制体
    registerEnemy(type: EnemyType, prefab: Node, maxCache = 40) {
        if (this.poolMap.has(type)) return;
        this.poolMap.set(type, {
            prefab: prefab,
            cacheList: [],
            maxCache
        });
    }

    // 取出怪物
    getEnemy(type: EnemyType): Node | null {
        const pool = this.poolMap.get(type);
        if (!pool || !this.enemyRoot) return null;

        let enemyNode: Node;
        if (pool.cacheList.length > 0) {
            enemyNode = pool.cacheList.pop()!;
        } else {
            enemyNode = instantiate(pool.prefab);
        }
        enemyNode.active = true;
        enemyNode.setParent(this.enemyRoot);
        enemyNode.unscheduleAllCallbacks();
        return enemyNode;
    }

    // 回收怪物（代替destroy）
    recycleEnemy(type: EnemyType, enemyNode: Node) {
        const pool = this.poolMap.get(type);
        if (!pool) {
            enemyNode.destroy();
            return;
        }
        if (pool.cacheList.length >= pool.maxCache) {
            enemyNode.destroy();
            return;
        }
        enemyNode.active = false;
        enemyNode.setParent(null);
        pool.cacheList.push(enemyNode);
    }

    // 清空所有怪物缓存（战斗结束调用）
    clearAll() {
        for (const pool of this.poolMap.values()) {
            for (const node of pool.cacheList) node.destroy();
            pool.cacheList.length = 0;
        }
        this.poolMap.clear();
    }
}