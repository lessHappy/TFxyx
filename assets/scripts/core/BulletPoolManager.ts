import { _decorator, Node, instantiate } from 'cc';
import { BulletComp } from '../bullet/BulletComp';
const { ccclass, property } = _decorator;

// 子弹类型标识（和武器id保持一致）
export enum BulletType {
    KNIFE = "knife",
    FIREBALL = "fireball",
    BOOMERANG = "boomerang",
    SPEAR = "spear"
}

type PoolData = {
    prefab: Node;
    cacheList: Node[];
    maxCache: number;
}

@ccclass("BulletPoolManager")
export class BulletPoolManager {
    private static instance: BulletPoolManager;
    public static get Instance() {
        if (!BulletPoolManager.instance) {
            BulletPoolManager.instance = new BulletPoolManager();
        }
        return BulletPoolManager.instance;
    }

    private poolMap: Map<string, PoolData> = new Map();
    private bulletRoot: Node | null = null;

    init(rootNode: Node) {
        this.bulletRoot = rootNode;
    }

    registerBullet(type: string, prefab: Node, maxCache = 30) {
        if (this.poolMap.has(type)) return;
        this.poolMap.set(type, {
            prefab: prefab,
            cacheList: [],
            maxCache: maxCache
        })
    }

    getBullet(type: BulletType): Node | null {
        const pool = this.poolMap.get(type);
        if (!pool || !this.bulletRoot) return null;

        let bulletNode: Node;
        if (pool.cacheList.length > 0) {
            bulletNode = pool.cacheList.pop()!;
        } else {
            bulletNode = instantiate(pool.prefab);
        }

        bulletNode.setParent(this.bulletRoot);
        bulletNode.active = true;
        bulletNode.unscheduleAllCallbacks();
        return bulletNode;
    }

    recycleBullet(type: BulletType, bulletNode: Node) {
        const pool = this.poolMap.get(type);
        if (!pool) {
            bulletNode.destroy();
            return;
        }

        if (pool.cacheList.length >= pool.maxCache) {
            bulletNode.destroy();
            return;
        }

        bulletNode.active = false;
        bulletNode.setParent(null);
        const bulletComp = bulletNode.getComponent(BulletComp);
        if (bulletComp) {
            bulletComp.hitEnemySet.clear();
            bulletComp.onHitCallback = null;
        }
        pool.cacheList.push(bulletNode);
    }

    clearAllPool() {
        for (const [_, pool] of this.poolMap) {
            for (const node of pool.cacheList) {
                node.destroy();
            }
            pool.cacheList.length = 0;
        }
        this.poolMap.clear();
    }
}