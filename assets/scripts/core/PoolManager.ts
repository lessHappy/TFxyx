import { _decorator, Node, Prefab, instantiate, NodePool } from 'cc';
const { ccclass } = _decorator;

export interface PoolConfig {
    name: string;
    prefab: Prefab;
    initSize: number;
    maxSize: number;
}

class TypedPool {
    private _pool: NodePool;
    private _prefab: Prefab;
    private _maxSize: number;
    private _activeCount: number = 0;

    constructor(prefab: Prefab, initSize: number, maxSize: number) {
        this._prefab = prefab;
        this._maxSize = maxSize;
        this._pool = new NodePool();
        for (let i = 0; i < initSize; i++) {
            const node = instantiate(prefab);
            this._pool.put(node);
        }
    }

    get(): Node | null {
        if (this._activeCount >= this._maxSize) {
            console.warn(`[PoolManager] 对象池已达上限: ${this._maxSize}`);
            return null;
        }
        let node: Node;
        if (this._pool.size() > 0) {
            node = this._pool.get()!;
        } else {
            node = instantiate(this._prefab);
        }
        this._activeCount++;
        return node;
    }

    put(node: Node) {
        this._activeCount = Math.max(0, this._activeCount - 1);
        this._pool.put(node);
    }

    clear() {
        this._pool.clear();
        this._activeCount = 0;
    }

    get activeCount(): number {
        return this._activeCount;
    }

    get poolSize(): number {
        return this._pool.size();
    }
}

@ccclass("PoolManager")
export class PoolManager {
    private static instance: PoolManager;
    private _pools: Map<string, TypedPool> = new Map();

    static get Instance(): PoolManager {
        if (!PoolManager.instance) {
            PoolManager.instance = new PoolManager();
        }
        return PoolManager.instance;
    }

    registerPool(config: PoolConfig) {
        if (this._pools.has(config.name)) {
            console.warn(`[PoolManager] 对象池已存在: ${config.name}`);
            return;
        }
        const pool = new TypedPool(config.prefab, config.initSize, config.maxSize);
        this._pools.set(config.name, pool);
    }

    get(name: string): Node | null {
        const pool = this._pools.get(name);
        if (!pool) {
            console.warn(`[PoolManager] 对象池不存在: ${name}`);
            return null;
        }
        return pool.get();
    }

    put(name: string, node: Node) {
        const pool = this._pools.get(name);
        if (!pool) {
            console.warn(`[PoolManager] 对象池不存在: ${name}，销毁节点`);
            node.destroy();
            return;
        }
        pool.put(node);
    }

    getPoolInfo(name: string): { active: number; poolSize: number } | null {
        const pool = this._pools.get(name);
        if (!pool) return null;
        return { active: pool.activeCount, poolSize: pool.poolSize };
    }

    clearPool(name: string) {
        const pool = this._pools.get(name);
        if (pool) {
            pool.clear();
        }
    }

    clearAll() {
        for (const pool of this._pools.values()) {
            pool.clear();
        }
        this._pools.clear();
    }

    hasPool(name: string): boolean {
        return this._pools.has(name);
    }

    getPoolNames(): string[] {
        return Array.from(this._pools.keys());
    }

    getTotalActiveCount(): number {
        let total = 0;
        for (const pool of this._pools.values()) {
            total += pool.activeCount;
        }
        return total;
    }
}