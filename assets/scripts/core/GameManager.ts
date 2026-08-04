import { _decorator, Node, Vec3, math } from 'cc';
import { Player } from '../entity/Player';
import { Enemy } from '../entity/Enemy';
import { BossEnemy } from '../entity/BossEnemy';
import { BulletComp } from '../bullet/BulletComp';
import { BulletPoolManager, BulletType } from './BulletPoolManager';
import { EnemyPoolManager, EnemyType } from './EnemyPoolManager';
import { WeaponManager } from '../weapon/WeaponManager';
import { WeaponSelectUI } from '../ui/WeaponSelectUI';
import { EventManager, GameEvent } from './EventManager';
import { ComboManager } from './ComboManager';
import { ObjectPool } from './ObjectPool';
import { StorageUtil } from './StorageUtil';
import { TalentManager } from './TalentManager';
import { TalentType } from '../config/TalentConfig';
import { BOSS_CONFIG, DOUBLE_BUFF_CONFIG, KNOCKBACK_CONFIG, ENEMY_COLLISION_CONFIG } from '../config/GameConfig';
import { DamageNumber } from '../entity/DamageNumber';
import { AudioManager, BGM_PATH } from './AudioManager';
import { VibrateManager } from './VibrateManager';
import { TutorialManager } from './TutorialManager';
import { TutorialStep } from '../config/TutorialConfig';
import { ExpDrop } from '../entity/ExpDrop';
import { AchievementManager } from './AchievementManager';
import { ACHIEVEMENT_STORAGE_KEYS } from '../config/AchievementConfig';
import { DailyTaskManager } from './DailyTaskManager';
import { TaskType } from '../config/DailyTaskConfig';
import { HeroManager } from './HeroManager';
import { HeroType } from '../config/HeroConfig';
import { RangedEnemy } from '../entity/RangedEnemy';
import { BomberEnemy } from '../entity/BomberEnemy';
import { SummonerEnemy } from '../entity/SummonerEnemy';
import { HealerEnemy } from '../entity/HealerEnemy';
import { ControllerEnemy } from '../entity/ControllerEnemy';
import { EnemyBullet } from '../entity/EnemyBullet';
const { ccclass, property } = _decorator;

const MAX_DELTA_TIME = 0.1;

const STORAGE_KEY_TOTAL_KILL = "sgzy_total_kill";
const STORAGE_KEY_GOLD = "sgzy_gold";
const STORAGE_KEY_BATTLE_TIME = "sgzy_total_battle_time";

@ccclass('GameManager')
export class GameManager {
    public static Instance: GameManager | null = null;

    @property({ type: Node }) public bulletRoot: Node = null!;
    @property({ type: Node }) public enemyContainer: Node = null!;
    @property({ type: Node }) public dropContainer: Node = null!;
    @property({ type: Node }) public damageNumberRoot: Node = null!;

    @property({ type: Node }) knifeBulletPrefab: Node = null!;
    @property({ type: Node }) fireBallBulletPrefab: Node = null!;
    @property({ type: Node }) boomerangPrefab: Node = null!;
    @property({ type: Node }) spearBulletPrefab: Node = null!;

    // Boss 预制体
    @property({ type: Node }) bossPrefab: Node = null!;

    @property({ type: WeaponSelectUI }) weaponSelectUI: WeaponSelectUI = null!;
    @property({ type: Player }) player: Player = null!;

    @property(Node) enemyNormalPrefab: Node = null!;
    @property(Node) enemyFastPrefab: Node = null!;
    @property(Node) enemyTankPrefab: Node = null!;
    @property(Node) enemyRangedPrefab: Node = null!;
    @property(Node) enemyBomberPrefab: Node = null!;
    @property(Node) enemySummonerPrefab: Node = null!;
    @property(Node) enemyHealerPrefab: Node = null!;
    @property(Node) enemyControllerPrefab: Node = null!;
    @property(Node) enemyBulletPrefab: Node = null!;

    public enemyList: Enemy[] = [];
    public totalKillCount: number = 0;
    public totalGold: number = 0;
    public difficultyScale: number = 1;
    public battlePause: boolean = false;
    public gameOver: boolean = false;
    public battleTime: number = 0;

    // 双倍Buff
    public hasDoubleBuff: boolean = false;
    // Boss 系统
    private bossTimer: number = 0;
    private bossAlive: boolean = false;
    private _heroDamageDealt: number = 0;

    // 标记Boss状态
    setBossAlive(alive: boolean) {
        this.bossAlive = alive;
    }

    addHeroDamage(damage: number) {
        this._heroDamageDealt += damage;
    }

    getHeroDamageDealt(): number {
        return this._heroDamageDealt;
    }

    onLoad() {
        if (GameManager.Instance) {
            this.node.destroy();
            return;
        }
        GameManager.Instance = this;
    }

    start() {
        // 读取双倍Buff状态
        this.hasDoubleBuff = StorageUtil.getBool("sgzy_battle_double_buff", false);
        this.initBattleLogic();
    }

    initBattleLogic() {
        EnemyPoolManager.Instance.init(this.enemyContainer);
        EnemyPoolManager.Instance.registerEnemy(EnemyType.NORMAL, this.enemyNormalPrefab, 40);
        EnemyPoolManager.Instance.registerEnemy(EnemyType.FAST, this.enemyFastPrefab, 30);
        EnemyPoolManager.Instance.registerEnemy(EnemyType.TANK, this.enemyTankPrefab, 30);
        if (this.bossPrefab) {
            EnemyPoolManager.Instance.registerEnemy(EnemyType.BOSS, this.bossPrefab, 3);
        }
        if (this.enemyRangedPrefab) {
            EnemyPoolManager.Instance.registerEnemy(EnemyType.RANGED, this.enemyRangedPrefab, 15);
        }
        if (this.enemyBomberPrefab) {
            EnemyPoolManager.Instance.registerEnemy(EnemyType.BOMBER, this.enemyBomberPrefab, 15);
        }
        if (this.enemySummonerPrefab) {
            EnemyPoolManager.Instance.registerEnemy(EnemyType.SUMMONER, this.enemySummonerPrefab, 10);
        }
        if (this.enemyHealerPrefab) {
            EnemyPoolManager.Instance.registerEnemy(EnemyType.HEALER, this.enemyHealerPrefab, 10);
        }
        if (this.enemyControllerPrefab) {
            EnemyPoolManager.Instance.registerEnemy(EnemyType.CONTROLLER, this.enemyControllerPrefab, 10);
        }
        if (this.enemyBulletPrefab) {
            EnemyBullet.setPoolPrefab(this.enemyBulletPrefab);
        }
        this.initBulletPool();
        WeaponManager.Instance.init(this.player);
        this.registerGameEvent();
        ComboManager.Instance.reset();
        this.bossTimer = BOSS_CONFIG.spawnInterval;
        this.bossAlive = false;

        AudioManager.Instance.crossFadeBgm(BGM_PATH.BATTLE_NORMAL, true, 1.0);

        TutorialManager.Instance.load();
        if (!TutorialManager.Instance.isTutorialDone()) {
            TutorialManager.Instance.startTutorial();
            TutorialManager.Instance.jumpToStep(TutorialStep.MOVE);
        }
    }

    initBulletPool() {
        BulletPoolManager.Instance.init(this.bulletRoot);
        BulletPoolManager.Instance.registerBullet(BulletType.KNIFE, this.knifeBulletPrefab, 35);
        BulletPoolManager.Instance.registerBullet(BulletType.FIREBALL, this.fireBallBulletPrefab, 25);
        BulletPoolManager.Instance.registerBullet(BulletType.BOOMERANG, this.boomerangPrefab, 20);
        BulletPoolManager.Instance.registerBullet(BulletType.SPEAR, this.spearBulletPrefab, 30);
    }

    registerGameEvent() {
        EventManager.Instance.on(GameEvent.PLAYER_LEVEL_UP, this.onPlayerLevelUp, this);
        EventManager.Instance.on(GameEvent.PLAYER_DEAD, this.onPlayerDead, this);
        EventManager.Instance.on("BOSS_DEAD", this.onBossDead, this);
        EventManager.Instance.on("FIRST_EXP_PICKUP", this.onFirstExpPickup, this);
    }

    onFirstExpPickup() {
        TutorialManager.Instance.completeStep(TutorialStep.KILL_ENEMY);
        TutorialManager.Instance.jumpToStep(TutorialStep.PICK_EXP);
    }

    onPlayerLevelUp() {
        this.battlePause = true;
        this.weaponSelectUI.showSelectPanel();
        DailyTaskManager.Instance.addProgress(TaskType.LEVEL_UP, 1);
        TutorialManager.Instance.completeStep(TutorialStep.PICK_EXP);
        TutorialManager.Instance.jumpToStep(TutorialStep.SELECT_WEAPON);

        if (this.player && this.player.level >= 3) {
            TutorialManager.Instance.jumpToStep(TutorialStep.DASH);
        }
    }

    onPlayerDead() {
        this.battlePause = true;
        this.gameOver = true;
        AudioManager.Instance.crossFadeBgm(BGM_PATH.GAME_OVER, false, 0.8);
    }

    onBossDead() {
        AchievementManager.Instance.addStat(ACHIEVEMENT_STORAGE_KEYS.TOTAL_BOSS, 1);
        DailyTaskManager.Instance.addProgress(TaskType.KILL_BOSS, 1);
        if (!this.gameOver) {
            AudioManager.Instance.crossFadeBgm(BGM_PATH.BATTLE_NORMAL, true, 0.6);
        }
    }

    onPlayerRevive() {
        if (!this.player) return;
        this.battlePause = false;
        this.gameOver = false;
        this.player.hp = this.player.maxHp;
        this.player.clearHurtState();
        AudioManager.Instance.crossFadeBgm(BGM_PATH.BATTLE_NORMAL, true, 0.5);
    }

    onEnemyDead(enemy: Enemy) {
        const idx = this.enemyList.indexOf(enemy);
        if (idx > -1) {
            this.enemyList.splice(idx, 1);
        }
        this.totalKillCount += 1;

        // 每日任务进度
        DailyTaskManager.Instance.addProgress(TaskType.KILL_ENEMY, 1);

        if (this.totalKillCount === 1) {
            TutorialManager.Instance.completeStep(TutorialStep.MOVE);
            TutorialManager.Instance.jumpToStep(TutorialStep.KILL_ENEMY);
        }

        // 关羽击杀Buff
        if (this.player) {
            this.player.onKill();
        }

        const comboBonus = ComboManager.Instance.onKill();
        if (comboBonus > 0 && enemy.expReward > 0) {
            const bonusExp = Math.floor(enemy.expReward * comboBonus);
            if (this.player) {
                this.player.addExp(bonusExp);
            }
        }

        // 连杀上报（仅上报连杀事件）
        if (ComboManager.Instance.comboCount >= 5) {
            DailyTaskManager.Instance.addProgress(TaskType.COMBO, 1);
        }
    }

    // 展示伤害数字
    showDamageNumber(worldPos: Vec3, dmg: number, isCrit: boolean = false) {
        if (!this.damageNumberRoot) return;
        const node = ObjectPool.get("dmg_number");
        if (!node) return;
        node.setParent(this.damageNumberRoot);
        const comp = node.getComponent(DamageNumber);
        if (comp) comp.show(dmg, worldPos, isCrit);
    }

    addGold(amount: number) {
        const heroType = this.player ? this.player.getHeroType() : HeroType.ZHAO_YUN;
        const goldTalentBonus = TalentManager.Instance.getEffectPercentWithHero(TalentType.GOLD_GAIN, heroType);
        let finalAmount = this.hasDoubleBuff
            ? amount * DOUBLE_BUFF_CONFIG.goldMultiplier
            : amount;
        finalAmount = Math.floor(finalAmount * goldTalentBonus);
        if (this.player && this.player.getDoubleDropChance() > 0 && Math.random() < this.player.getDoubleDropChance()) {
            finalAmount *= 2;
        }
        this.totalGold += finalAmount;
        DailyTaskManager.Instance.addProgress(TaskType.COLLECT_GOLD, finalAmount);
    }

    // 获取双倍Buff后的经验值
    getExpWithBuff(baseExp: number): number {
        return this.hasDoubleBuff
            ? baseExp * DOUBLE_BUFF_CONFIG.expMultiplier
            : baseExp;
    }

    // 生成 Boss
    spawnBoss() {
        if (this.bossAlive) return;
        if (!this.player) return;

        const playerPos = this.player.node.worldPosition;
        const angle = math.randomRange(0, Math.PI * 2);
        const dist = math.randomRange(350, 480);
        const spawnPos = new Vec3(
            playerPos.x + Math.cos(angle) * dist,
            playerPos.y + Math.sin(angle) * dist,
            0
        );

        const bossNode = EnemyPoolManager.Instance.getEnemy(EnemyType.BOSS);
        if (!bossNode) return;

        bossNode.setWorldPosition(spawnPos);
        const bossComp = bossNode.getComponent(BossEnemy);
        if (bossComp) {
            bossComp.init(EnemyType.BOSS);
        }

        this.bossAlive = true;
        EventManager.Instance.emit("BOSS_SPAWN");
        AudioManager.Instance.crossFadeBgm(BGM_PATH.BATTLE_BOSS, true, 0.6);
        VibrateManager.Instance.long();
        TutorialManager.Instance.jumpToStep(TutorialStep.BOSS_WARNING);
    }

    update(deltaTime: number) {
        if (this.battlePause || this.gameOver) return;

        if (deltaTime > MAX_DELTA_TIME) {
            deltaTime = MAX_DELTA_TIME;
        }

        this.battleTime += deltaTime;

        // 连杀计时器
        ComboManager.Instance.update(deltaTime);

        // 敌人碰撞处理
        this.processEnemyCollisions(deltaTime);

        // Boss 计时器
        this.bossTimer -= deltaTime;
        if (this.bossTimer <= 0) {
            this.spawnBoss();
            this.bossTimer = BOSS_CONFIG.spawnInterval;
        }

        const level = Math.floor(this.battleTime / 60);
        this.difficultyScale = 1 + level * 0.15;
    }

    getNearestEnemy(origin: Vec3, range: number): Enemy | null {
        let minDistSq = Infinity;
        const rangeSq = range * range;
        let target: Enemy | null = null;

        const list = this.enemyList;
        const len = list.length;
        for (let i = 0; i < len; i++) {
            const enemy = list[i];
            if (!enemy.node.active) continue;
            const distSq = Vec3.distanceSquared(origin, enemy.node.worldPosition);
            if (distSq < rangeSq && distSq < minDistSq) {
                minDistSq = distSq;
                target = enemy;
            }
        }
        return target;
    }

    createAoeDamage(center: Vec3, radius: number, damage: number) {
        const radiusSq = radius * radius;
        const list = this.enemyList;
        const len = list.length;
        for (let i = 0; i < len; i++) {
            const enemy = list[i];
            if (!enemy.node.active) continue;
            const distSq = Vec3.distanceSquared(center, enemy.node.worldPosition);
            if (distSq <= radiusSq) {
                enemy.takeDamage(damage);
            }
        }
    }

    createAoeDamageWithKnockback(center: Vec3, radius: number, damage: number, knockbackForce: number = 0) {
        const radiusSq = radius * radius;
        const list = this.enemyList;
        const len = list.length;
        for (let i = 0; i < len; i++) {
            const enemy = list[i];
            if (!enemy.node.active) continue;
            const enemyPos = enemy.node.worldPosition;
            const distSq = Vec3.distanceSquared(center, enemyPos);
            if (distSq <= radiusSq) {
                enemy.takeDamage(damage);
                if (knockbackForce > 0) {
                    const dirX = enemyPos.x - center.x;
                    const dirY = enemyPos.y - center.y;
                    enemy.applyKnockback(dirX, dirY, knockbackForce);
                }
            }
        }
    }

    processEnemyCollisions(dt: number) {
        if (!ENEMY_COLLISION_CONFIG.enabled) return;
        const list = this.enemyList;
        const len = list.length;
        if (len < 2) return;

        const collisionRadius = ENEMY_COLLISION_CONFIG.collisionRadius;
        const collisionRadiusSq = collisionRadius * collisionRadius * 4;
        const pushForce = ENEMY_COLLISION_CONFIG.pushForce;
        const maxCheck = Math.min(ENEMY_COLLISION_CONFIG.maxEnemiesCheck, len);

        for (let i = 0; i < maxCheck; i++) {
            const enemyA = list[i];
            if (!enemyA || !enemyA.node.active || enemyA['isDead']) continue;

            const checkCount = Math.min(i + 8, len);
            for (let j = i + 1; j < checkCount; j++) {
                const enemyB = list[j];
                if (!enemyB || !enemyB.node.active || enemyB['isDead']) continue;

                const posA = enemyA.node.worldPosition;
                const posB = enemyB.node.worldPosition;
                const dx = posA.x - posB.x;
                const dy = posA.y - posB.y;
                const distSq = dx * dx + dy * dy;

                if (distSq < collisionRadiusSq && distSq > 0.01) {
                    const dist = Math.sqrt(distSq);
                    const overlap = collisionRadius * 2 - dist;
                    const nx = dx / dist;
                    const ny = dy / dist;
                    const push = overlap * 0.5 * pushForce * dt;

                    const posANew = enemyA.node.position;
                    const posBNew = enemyB.node.position;
                    enemyA.node.setPosition(posANew.x + nx * push, posANew.y + ny * push, posANew.z);
                    enemyB.node.setPosition(posBNew.x - nx * push, posBNew.y - ny * push, posBNew.z);
                }
            }
        }
    }

    private _enemyRangeResult: Enemy[] = [];
    getEnemyInRange(center: Vec3, radius: number): Enemy[] {
        this._enemyRangeResult.length = 0;
        const radiusSq = radius * radius;
        const list = this.enemyList;
        const len = list.length;
        for (let i = 0; i < len; i++) {
            const enemy = list[i];
            if (!enemy.node.active) continue;
            const distSq = Vec3.distanceSquared(center, enemy.node.worldPosition);
            if (distSq <= radiusSq) {
                this._enemyRangeResult.push(enemy);
            }
        }
        return this._enemyRangeResult;
    }

    registerBullet(bullet: Node, bulletComp: BulletComp) {
        // 预留2D碰撞逻辑入口
    }

    private recordAchievementStats() {
        const ach = AchievementManager.Instance;
        ach.load();

        ach.addStat(ACHIEVEMENT_STORAGE_KEYS.TOTAL_KILL, this.totalKillCount);
        ach.addStat(ACHIEVEMENT_STORAGE_KEYS.TOTAL_GOLD, this.totalGold);
        ach.updateStat(ACHIEVEMENT_STORAGE_KEYS.MAX_SINGLE_KILL, this.totalKillCount);
        ach.updateStat(ACHIEVEMENT_STORAGE_KEYS.MAX_SURVIVE, Math.floor(this.battleTime));

        const playerLevel = this.player ? this.player.level : 0;
        ach.updateStat(ACHIEVEMENT_STORAGE_KEYS.MAX_LEVEL, playerLevel);

        const maxCombo = ComboManager.Instance ? ComboManager.Instance.maxComboCount : 0;
        ach.updateStat(ACHIEVEMENT_STORAGE_KEYS.MAX_COMBO, maxCombo);

        const heroType = HeroManager.Instance.getSelectedHero();
        HeroManager.Instance.addHeroKill(heroType, this.totalKillCount);
        HeroManager.Instance.recordHeroSingleGameKill(heroType, this.totalKillCount);
    }

    battleOver() {
        this.recordAchievementStats();

        // 每日任务进度
        DailyTaskManager.Instance.addProgress(TaskType.PLAY_GAME, 1);
        DailyTaskManager.Instance.addProgress(TaskType.SURVIVE_TIME, Math.floor(this.battleTime));

        // 英雄解锁检测
        this.checkHeroUnlock();

        if (this.dropContainer) {
            this.dropContainer.removeAllChildren();
        }
        BulletPoolManager.Instance.clearAllPool();
        WeaponManager.Instance.clearAllWeapon();
        EnemyPoolManager.Instance.clearAll();
        EnemyBullet.clearPool();
        this.enemyList.length = 0;
        this.totalKillCount = 0;
        this.totalGold = 0;
        this.difficultyScale = 1;
        this.battleTime = 0;
        this.battlePause = false;
        this.gameOver = false;
        this.bossTimer = BOSS_CONFIG.spawnInterval;
        this.bossAlive = false;
        this._heroDamageDealt = 0;
        ComboManager.Instance.reset();
        EventManager.Instance.off(GameEvent.PLAYER_LEVEL_UP, this.onPlayerLevelUp, this);
        EventManager.Instance.off(GameEvent.PLAYER_DEAD, this.onPlayerDead, this);
        EventManager.Instance.off("PLAYER_REVIVE", this.onPlayerRevive, this);
        EventManager.Instance.off("BOSS_DEAD", this.onBossDead, this);
        EventManager.Instance.off("FIRST_EXP_PICKUP", this.onFirstExpPickup, this);
        AudioManager.Instance.stopBgm();
        ExpDrop.resetFirstPick();
    }

    private checkHeroUnlock() {
        const heroManager = HeroManager.Instance;
        const totalKill = StorageUtil.getNumber(STORAGE_KEY_TOTAL_KILL, 0);
        const totalGold = StorageUtil.getNumber(STORAGE_KEY_GOLD, 0);
        const totalBattleTime = StorageUtil.getNumber(STORAGE_KEY_BATTLE_TIME, 0);

        const progressMap: Record<string, number> = {
            kill: totalKill + this.totalKillCount,
            gold: totalGold + this.totalGold,
            survive: totalBattleTime + Math.floor(this.battleTime),
        };

        heroManager.checkAllUnlockConditions(progressMap);
    }

    onDestroy() {
        GameManager.Instance = null;
    }
}