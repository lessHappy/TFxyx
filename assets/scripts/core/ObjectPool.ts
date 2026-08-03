import { _decorator, Node, instantiate, Prefab } from 'cc';
const { ccclass } = _decorator;

interface PoolInfo {
    prefab: Node;
    stack: Node[];
    maxSize: number;
}

export class ObjectPool {
    private static poolMap = new Map<string, PoolInfo>();

    static register(key: string, prefab: Node, cap: number) {
        if (this.poolMap.has(key)) return;
        const poolInfo: PoolInfo = {
            prefab: prefab,
            stack: [],
            maxSize: cap
        };
        for (let i = 0; i < cap; i++) {
            const node = instantiate(prefab);
            node.active = false;
            node.setParent(prefab.parent);
            poolInfo.stack.push(node);
        }
        this.poolMap.set(key, poolInfo);
    }

    static get(key: string): Node | null {
        const poolInfo = this.poolMap.get(key);
        if (!poolInfo) return null;
        if (poolInfo.stack.length > 0) {
            const node = poolInfo.stack.pop()!;
            node.active = true;
            return node;
        }
        const node = instantiate(poolInfo.prefab);
        node.setParent(poolInfo.prefab.parent);
        node.active = true;
        return node;
    }

    static put(key: string, node: Node) {
        const poolInfo = this.poolMap.get(key);
        if (!poolInfo) {
            node.destroy();
            return;
        }
        node.active = false;
        if (poolInfo.stack.length < poolInfo.maxSize) {
            node.setParent(poolInfo.prefab.parent);
            poolInfo.stack.push(node);
        } else {
            node.destroy();
        }
    }

    static clear(key: string) {
        const poolInfo = this.poolMap.get(key);
        if (!poolInfo) return;
        for (const node of poolInfo.stack) {
            node.destroy();
        }
        poolInfo.stack.length = 0;
    }

    static clearAll() {
        for (const [key] of this.poolMap) {
            this.clear(key);
        }
        this.poolMap.clear();
    }
}