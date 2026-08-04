import { _decorator, Component, Node, Vec3 } from 'cc';
import { Player } from './Player';
import { ObjectPool } from '../core/ObjectPool';
const { ccclass } = _decorator;

const ENEMY_BULLET_POOL_KEY = "enemy_bullet";

@ccclass('EnemyBullet')
export class EnemyBullet extends Component {
    public damage: number = 5;
    public speed: number = 200;
    public lifeTime: number = 3;
    public aoeRadius: number = 0;
    public isHoming: boolean = false;

    private _dir: Vec3 = new Vec3();
    private _timer: number = 0;
    private _tempDir: Vec3 = new Vec3();

    static setPoolPrefab(prefab: Node) {
        ObjectPool.register(ENEMY_BULLET_POOL_KEY, prefab, 30);
    }

    static clearPool() {
        ObjectPool.clear(ENEMY_BULLET_POOL_KEY);
    }

    static spawn(pos: Vec3, dir: Vec3, damage: number, speed: number = 200, lifeTime: number = 3, aoeRadius: number = 0, isHoming: boolean = false): EnemyBullet | null {
        const node = ObjectPool.get(ENEMY_BULLET_POOL_KEY);
        if (!node) return null;
        node.setWorldPosition(pos);
        const comp = node.getComponent(EnemyBullet);
        if (comp) {
            comp.init(dir, damage, speed, lifeTime, aoeRadius, isHoming);
        }
        return comp;
    }

    init(dir: Vec3, damage: number, speed: number, lifeTime: number, aoeRadius: number, isHoming: boolean) {
        this._dir.set(dir);
        this._dir.normalize();
        this.damage = damage;
        this.speed = speed;
        this.lifeTime = lifeTime;
        this.aoeRadius = aoeRadius;
        this.isHoming = isHoming;
        this._timer = 0;
    }

    update(deltaTime: number) {
        this._timer += deltaTime;
        if (this._timer >= this.lifeTime) {
            this.recycle();
            return;
        }

        if (this.isHoming && Player.Instance) {
            const playerPos = Player.Instance.node.worldPosition;
            const selfPos = this.node.worldPosition;
            Vec3.subtract(this._tempDir, playerPos, selfPos);
            this._tempDir.normalize();
            Vec3.lerp(this._dir, this._dir, this._tempDir, deltaTime * 3);
            this._dir.normalize();
        }

        const pos = this.node.position;
        this.node.setPosition(
            pos.x + this._dir.x * this.speed * deltaTime,
            pos.y + this._dir.y * this.speed * deltaTime,
            pos.z
        );

        if (Player.Instance) {
            const playerPos = Player.Instance.node.worldPosition;
            const distSq = Vec3.distanceSquared(this.node.worldPosition, playerPos);
            const hitRange = 35 * 35;

            if (distSq < hitRange) {
                this.onHitPlayer();
            }
        }
    }

    onHitPlayer() {
        if (!Player.Instance) return;

        if (this.aoeRadius > 0) {
            Player.Instance.takeDamage(this.damage);
        } else {
            Player.Instance.takeDamage(this.damage);
        }

        this.recycle();
    }

    recycle() {
        ObjectPool.put(ENEMY_BULLET_POOL_KEY, this.node);
    }
}