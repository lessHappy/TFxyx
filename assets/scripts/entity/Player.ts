import { _decorator, Component, Vec2, Vec3, Color, Sprite, math, tween, SpriteFrame, resources } from 'cc';
import { GameManager } from '../core/GameManager';
import { EventManager, GameEvent } from '../core/EventManager';
import { PLAYER_CONFIG, DASH_CONFIG } from '../config/GameConfig';
import { ShakeManager } from '../core/ShakeManager';
import { AudioManager } from '../core/AudioManager';
import { VibrateManager } from '../core/VibrateManager';
import { StorageUtil } from '../core/StorageUtil';
import { STORAGE_KEY } from '../ui/MainMenu';
import { RankUI } from '../ui/RankUI';
import { OfflineIncome } from '../utils/OfflineIncome';
import { TalentManager, TalentChangeEvent } from '../core/TalentManager';
import { TalentType, TALENT_POINTS_PER_LEVEL } from '../config/TalentConfig';
import { HeroManager } from '../core/HeroManager';
import { HeroType, HERO_COLOR_CONFIG, HeroSkillEffectType, HERO_SKILL_EFFECTS } from '../config/HeroConfig';
import { TutorialManager } from '../core/TutorialManager';
import { TutorialStep } from '../config/TutorialConfig';
import { BufferManager } from '../buff/BufferManager';
import { StatusType } from '../buff/StatusEffect';
const { ccclass, property } = _decorator;

@ccclass('Player')
export class Player extends Component {
    public static Instance: Player | null = null;
    @property(Sprite) playerSprite:Sprite = null!;

    public hp: number = PLAYER_CONFIG.baseHp;
    public maxHp: number = PLAYER_CONFIG.baseHp;
    public exp: number = 0;
    public expNext: number = 100;
    public level: number = 1;

    private moveDir:Vec2 = new Vec2();
    private hurtCd:number = 0;
    private _tempPos: Vec3 = new Vec3();

    private _hpRegenTimer: number = 0;
    private _talentHpBonus: number = 0;
    private _talentMoveSpeedBonus: number = 0;
    private _talentExpBonus: number = 0;
    private _talentDamageReduction: number = 0;
    private _talentHpRegen: number = 0;
    private _talentArmor: number = 0;
    private _talentDodge: number = 0;
    private _talentLifesteal: number = 0;
    private _talentDoubleDrop: number = 0;

    private _heroHpBonus: number = 1;
    private _heroMoveSpeedBonus: number = 1;
    private _heroExpBonus: number = 1;
    private _heroType: HeroType = HeroType.ZHAO_YUN;
    private _heroSkillType: HeroSkillEffectType = HeroSkillEffectType.DASH_COOLDOWN;
    private _heroSkillParams: Record<string, number> = {};
    private _heroDashCooldownMult: number = 1;
    private _heroDamageBonus: number = 1;
    private _heroAttackSpeedBonus: number = 1;
    private _heroCritDmgBonus: number = 0;

    private _cachedDamageBonus: number = 1;
    private _damageBonusDirty: boolean = true;

    private isDashing: boolean = false;
    private dashTimer: number = 0;
    private dashCooldownTimer: number = 0;
    private dashDir: Vec2 = new Vec2();

    private _slowFactor: number = 1;
    private _slowTimer: number = 0;
    private _rooted: boolean = false;
    private _rootTimer: number = 0;

    private _killBuffTimer: number = 0;
    private _killBuffActive: boolean = false;
    private _lowHpModeActive: boolean = false;

    private _heroSkillLevel: number = 1;
    private _heroSkillMaxLevel: number = 5;
    private _heroSpriteFrames: Map<string, SpriteFrame> = new Map();
    private _loadedSpriteFrame: boolean = false;

    private bufferManager: BufferManager | null = null;

    onLoad() {
        if (Player.Instance) {
            this.node.destroy();
            return;
        }
        Player.Instance = this;

        this.bufferManager = this.node.getComponent(BufferManager);
        if (!this.bufferManager) {
            this.bufferManager = this.node.addComponent(BufferManager);
        }

        this.applyBonuses();
        EventManager.Instance.on("PLAYER_REVIVE", this.onRevive, this);
        TalentManager.Instance.addListener(this.onTalentChanged);
    }

    private onTalentChanged = (event: TalentChangeEvent) => {
        this.applyTalentBonuses();
        this.maxHp = Math.floor(PLAYER_CONFIG.baseHp * this._heroHpBonus * this._talentHpBonus);
        if (this.hp > this.maxHp) {
            this.hp = this.maxHp;
        }
    };

    private applyBonuses() {
        this.applyHeroBonuses();
        this.applyTalentBonuses();

        this.maxHp = Math.floor(PLAYER_CONFIG.baseHp * this._heroHpBonus * this._talentHpBonus);
        this.hp = this.maxHp;
    }

    private applyHeroBonuses() {
        const heroData = HeroManager.Instance.getSelectedHeroData();
        this._heroHpBonus = heroData.hpBonus;
        this._heroMoveSpeedBonus = heroData.moveSpeedBonus;
        this._heroExpBonus = heroData.expBonus;
        this._heroType = heroData.id;
        this._heroDamageBonus = heroData.damageBonus;
        this._heroAttackSpeedBonus = heroData.attackSpeedBonus;

        const masteryBonus = HeroManager.Instance.getMasteryBonus(heroData.id);
        this._heroHpBonus += masteryBonus.hp;
        this._heroDamageBonus += masteryBonus.damage;

        const skillCfg = HERO_SKILL_EFFECTS[heroData.id];
        this._heroSkillType = skillCfg.type;
        this._heroSkillParams = { ...skillCfg.params };
        this._heroDashCooldownMult = skillCfg.type === HeroSkillEffectType.DASH_COOLDOWN ? skillCfg.params.multiplier : 1;
        this._heroCritDmgBonus = skillCfg.type === HeroSkillEffectType.CRIT_DMG_BONUS ? skillCfg.params.bonus : 0;
        this._damageBonusDirty = true;

        this._killBuffTimer = 0;
        this._killBuffActive = false;
        this._lowHpModeActive = false;

        this.applySkillLevelBonuses();

        const heroColor = HERO_COLOR_CONFIG[heroData.id];
        if (heroColor) {
            const c = heroColor.baseColor;
            this._normalColor = new Color(c.r, c.g, c.b, c.a);
        } else {
            this._normalColor = new Color(255, 255, 255, 255);
        }
        if (this.playerSprite) {
            this.updateSpriteColor();
        }

        this.loadHeroSprite(heroData.spriteFrame);
    }

    private loadHeroSprite(spritePath: string) {
        if (!this.playerSprite || !spritePath) return;
        if (this._heroSpriteFrames.has(spritePath)) {
            this.playerSprite.spriteFrame = this._heroSpriteFrames.get(spritePath)!;
            this._loadedSpriteFrame = true;
            return;
        }
        resources.load(spritePath, SpriteFrame, (err, spriteFrame) => {
            if (err) {
                console.warn(`[Player] 加载英雄精灵失败: ${spritePath}`, err);
                return;
            }
            if (this.playerSprite && this.playerSprite.isValid) {
                this._heroSpriteFrames.set(spritePath, spriteFrame);
                this.playerSprite.spriteFrame = spriteFrame;
                this._loadedSpriteFrame = true;
            }
        });
    }

    getHeroSkillLevel(): number {
        return this._heroSkillLevel;
    }

    getHeroSkillMaxLevel(): number {
        return this._heroSkillMaxLevel;
    }

    upgradeHeroSkill(): boolean {
        if (this._heroSkillLevel >= this._heroSkillMaxLevel) return false;
        this._heroSkillLevel++;
        this.applySkillLevelBonuses();
        this._damageBonusDirty = true;
        this.playSkillUpgradeVFX();
        return true;
    }

    private applySkillLevelBonuses() {
        const levelBonus = (this._heroSkillLevel - 1) / (this._heroSkillMaxLevel - 1);
        switch (this._heroSkillType) {
            case HeroSkillEffectType.DASH_COOLDOWN:
                this._heroDashCooldownMult = Math.max(0.4, 0.8 - levelBonus * 0.4);
                break;
            case HeroSkillEffectType.KILL_BUFF:
                this._heroSkillParams.duration = 3 + levelBonus * 2;
                this._heroSkillParams.damageBonus = 0.3 + levelBonus * 0.2;
                break;
            case HeroSkillEffectType.LOW_HP_BERSERK:
                this._heroSkillParams.hpThreshold = 0.3 + levelBonus * 0.1;
                this._heroSkillParams.damageBonus = 0.5 + levelBonus * 0.3;
                break;
            case HeroSkillEffectType.LEVEL_UP_HEAL:
                this._heroSkillParams.healPercent = 0.2 + levelBonus * 0.15;
                break;
            case HeroSkillEffectType.CRIT_DMG_BONUS:
                this._heroCritDmgBonus = 0.5 + levelBonus * 0.5;
                break;
        }
    }

    private playSkillUpgradeVFX() {
        if (!this.node || !this.node.isValid) return;
        const origScale = this.node.scale.clone();
        tween(this.node)
            .to(0.08, { scale: new Vec3(origScale.x * 1.3, origScale.y * 1.3, 1) })
            .to(0.12, { scale: origScale })
            .start();
        AudioManager.Instance.playSfx("audio/sfx/levelup");
    }

    getHeroDamageBonus(): number {
        if (!this._damageBonusDirty) {
            return this._cachedDamageBonus;
        }

        let bonus = this._heroDamageBonus;

        if (this._heroSkillType === HeroSkillEffectType.KILL_BUFF && this._killBuffTimer > 0) {
            bonus += this._heroSkillParams.damageBonus || 0;
        }

        if (this._heroSkillType === HeroSkillEffectType.LOW_HP_BERSERK) {
            const threshold = this._heroSkillParams.hpThreshold || 0.3;
            if (this.hp < this.maxHp * threshold) {
                bonus += this._heroSkillParams.damageBonus || 0;
            }
        }

        this._cachedDamageBonus = bonus;
        this._damageBonusDirty = false;
        return bonus;
    }

    onKill() {
        HeroManager.Instance.addMasteryExp(this._heroType, 1);

        if (this._heroSkillType === HeroSkillEffectType.KILL_BUFF) {
            const wasActive = this._killBuffActive;
            this._killBuffTimer = this._heroSkillParams.duration || 3;
            this._killBuffActive = true;
            this._damageBonusDirty = true;
            this.updateSpriteColor();
            if (!wasActive) {
                this.playSkillActivateVFX();
            }
        }
    }

    private playSkillActivateVFX() {
        if (!this.node || !this.node.isValid) return;
        const origScale = this.node.scale.clone();
        const heroColor = HERO_COLOR_CONFIG[this._heroType];
        if (heroColor && this.playerSprite) {
            const c = heroColor.dashColor;
            const glowColor = new Color(c.r, c.g, c.b, c.a);
            this.playerSprite.color = glowColor;
            this.scheduleOnce(() => {
                if (this.playerSprite && this.playerSprite.isValid) {
                    this.playerSprite.color = this._normalColor;
                }
            }, 0.25);
        }
        tween(this.node)
            .to(0.1, { scale: new Vec3(origScale.x * 1.2, origScale.y * 1.2, 1) })
            .to(0.15, { scale: origScale })
            .start();
        this.playHeroSkillSfx();
    }

    private playHeroSkillSfx() {
        switch (this._heroType) {
            case HeroType.ZHAO_YUN:
                AudioManager.Instance.playSfx("audio/sfx/dash");
                VibrateManager.Instance.vibrateLight();
                break;
            case HeroType.GUAN_YU:
                AudioManager.Instance.playSfx("audio/sfx/powerup");
                break;
            case HeroType.ZHANG_FEI:
                AudioManager.Instance.playSfx("audio/sfx/berserk");
                VibrateManager.Instance.vibrateMedium();
                break;
            case HeroType.ZHUGE_LIANG:
                AudioManager.Instance.playSfx("audio/sfx/heal");
                break;
            case HeroType.LV_BU:
                AudioManager.Instance.playSfx("audio/sfx/crit");
                VibrateManager.Instance.vibrateMedium();
                break;
            default:
                AudioManager.Instance.playSfx("audio/sfx/powerup");
        }
    }

    getHeroAttackSpeedBonus(): number {
        return this._heroAttackSpeedBonus;
    }

    getHeroType(): HeroType {
        return this._heroType;
    }

    getKillBuffActive(): boolean {
        return this._killBuffActive;
    }

    getKillBuffTimer(): number {
        return this._killBuffTimer;
    }

    getDashCooldownTimer(): number {
        return this.dashCooldownTimer;
    }

    getHeroCritDmgBonus(): number {
        return this._heroCritDmgBonus;
    }

    getHeroSkillType(): HeroSkillEffectType {
        return this._heroSkillType;
    }

    getHeroLowHpDmgBonus(): number {
        if (this._heroSkillType !== HeroSkillEffectType.LOW_HP_BERSERK) return 0;

        const threshold = this._heroSkillParams.hpThreshold || 0.3;
        const isLowHp = this.hp < this.maxHp * threshold;

        if (isLowHp && !this._lowHpModeActive) {
            this._lowHpModeActive = true;
            this._damageBonusDirty = true;
            this.playSkillActivateVFX();
        } else if (!isLowHp && this._lowHpModeActive) {
            this._lowHpModeActive = false;
            this._damageBonusDirty = true;
        }

        return isLowHp ? (this._heroSkillParams.damageBonus || 0) : 0;
    }

    private applyTalentBonuses() {
        const tm = TalentManager.Instance;
        this._talentHpBonus = tm.getEffectPercentWithHero(TalentType.MAX_HP, this._heroType);
        this._talentMoveSpeedBonus = tm.getEffectPercentWithHero(TalentType.MOVE_SPEED, this._heroType);
        this._talentExpBonus = tm.getEffectPercentWithHero(TalentType.EXP_GAIN, this._heroType);
        this._talentDamageReduction = tm.getEffectValueWithHero(TalentType.DAMAGE_REDUCTION, this._heroType);
        this._talentHpRegen = tm.getEffectValueWithHero(TalentType.HP_REGEN, this._heroType);
        this._talentArmor = tm.getEffectValueWithHero(TalentType.ARMOR, this._heroType);
        this._talentDodge = tm.getEffectValueWithHero(TalentType.DODGE, this._heroType);
        this._talentLifesteal = tm.getEffectValueWithHero(TalentType.LIFESTEAL, this._heroType);
        this._talentDoubleDrop = tm.getEffectValueWithHero(TalentType.DOUBLE_DROP, this._heroType);
    }

   

    setMoveDir(dir:Vec2){
        this.moveDir = dir;
    }

    // 外部调用触发冲刺
    triggerDash() {
        if (this.isDashing) return;
        if (this.dashCooldownTimer > 0) return;
        if (this.moveDir.x === 0 && this.moveDir.y === 0) return;

        this.isDashing = true;
        this.dashTimer = DASH_CONFIG.dashDuration;
        this.dashCooldownTimer = DASH_CONFIG.dashCooldown * this._heroDashCooldownMult;
        this.dashDir.set(this.moveDir.x, this.moveDir.y);
        this.dashDir.normalize();
        this.hurtCd = Math.max(this.hurtCd, DASH_CONFIG.dashInvincibleTime);

        // 冲刺特效
        if (this.playerSprite) {
            const dashCfg = HERO_COLOR_CONFIG[this._heroType];
            const dc = dashCfg ? dashCfg.dashColor : { r: 180, g: 220, b: 255, a: 255 };
            this.playerSprite.color = new Color(dc.r, dc.g, dc.b, dc.a);
        }
        AudioManager.Instance.playSfx("audio/sfx/dash");
        TutorialManager.Instance.completeStep(TutorialStep.DASH);
    }

    update(deltaTime:number){
        if(GameManager.Instance?.battlePause || GameManager.Instance?.gameOver) return;

        if (deltaTime > 0.1) {
            deltaTime = 0.1;
        }

        if (this.bufferManager) {
            this.bufferManager.update(deltaTime);
        }

        if(this.hurtCd > 0) this.hurtCd -= deltaTime;
        if(this.dashCooldownTimer > 0) this.dashCooldownTimer -= deltaTime;

        if (this._slowTimer > 0) {
            this._slowTimer -= deltaTime;
            if (this._slowTimer <= 0) {
                this._slowFactor = 1;
            }
        }
        if (this._rootTimer > 0) {
            this._rootTimer -= deltaTime;
            if (this._rootTimer <= 0) {
                this._rooted = false;
            }
        }

        // 击杀Buff倒计时（关羽武圣等）
        if (this._killBuffTimer > 0) {
            this._killBuffTimer -= deltaTime;
            if (this._killBuffTimer <= 0) {
                this._killBuffTimer = 0;
                this._killBuffActive = false;
                this._damageBonusDirty = true;
                this.updateSpriteColor();
            }
        }

        this.updateHpRegen(deltaTime);

        // 冲刺逻辑
        if (this.isDashing) {
            this.dashTimer -= deltaTime;
            const speed = DASH_CONFIG.dashSpeed;
            const dx = this.dashDir.x * speed * deltaTime;
            const dy = this.dashDir.y * speed * deltaTime;
            this._tempPos.set(this.node.position.x + dx, this.node.position.y + dy, 0);
            this._tempPos.x = math.clamp(this._tempPos.x, PLAYER_CONFIG.boundMinX, PLAYER_CONFIG.boundMaxX);
            this._tempPos.y = math.clamp(this._tempPos.y, PLAYER_CONFIG.boundMinY, PLAYER_CONFIG.boundMaxY);
            this.node.setPosition(this._tempPos);

            if (this.dashTimer <= 0) {
                this.isDashing = false;
                this.updateSpriteColor();
            }
            return;
        }

        if (this._rooted) return;

        const buffSpeedMult = this.bufferManager ? this.bufferManager.speedMultiplier : 1;
        const speed = PLAYER_CONFIG.moveSpeed * this._heroMoveSpeedBonus * this._talentMoveSpeedBonus * this._slowFactor * buffSpeedMult;
        const dx = this.moveDir.x * speed * deltaTime;
        const dy = this.moveDir.y * speed * deltaTime;

        this._tempPos.set(this.node.position.x + dx, this.node.position.y + dy, 0);
        this._tempPos.x = math.clamp(this._tempPos.x, PLAYER_CONFIG.boundMinX, PLAYER_CONFIG.boundMaxX);
        this._tempPos.y = math.clamp(this._tempPos.y, PLAYER_CONFIG.boundMinY, PLAYER_CONFIG.boundMaxY);
        this.node.setPosition(this._tempPos);
    }

    takeDamage(dmg: number) {
        if (GameManager.Instance?.battlePause || GameManager.Instance?.gameOver) return;
        if (this.hurtCd > 0) return;
        if (this.isDashing) return;
        if (this.bufferManager && this.bufferManager.isInvincibleActive) return;

        if (this._talentDodge > 0 && Math.random() < this._talentDodge) {
            this.showDodgeEffect();
            return;
        }

        const reducedDmg = Math.max(1, Math.floor(dmg * (1 - this._talentDamageReduction)) - this._talentArmor);
        this.hp -= reducedDmg;
        this.hurtCd = PLAYER_CONFIG.hurtFlashTime;

        this.playHurtFlash();
        ShakeManager.Instance.shake(0.18, 5);
        AudioManager.Instance.playSfx("audio/sfx/hurt");
        VibrateManager.Instance.short("medium");

        if (this.hp <= 0) {
            this.hp = 0;
            EventManager.Instance.emit(GameEvent.PLAYER_DEAD);
        }
    }

    getLifestealRatio(): number {
        return this._talentLifesteal;
    }

    getDoubleDropChance(): number {
        return this._talentDoubleDrop;
    }

    applySlow(factor: number, duration: number) {
        this._slowFactor = Math.min(this._slowFactor, 1 - factor);
        this._slowTimer = Math.max(this._slowTimer, duration);
    }

    applyRoot(duration: number) {
        this._rooted = true;
        this._rootTimer = Math.max(this._rootTimer, duration);
        this.moveDir.set(0, 0);
    }

    isRooted(): boolean {
        return this._rooted;
    }

    getBufferManager(): BufferManager | null {
        return this.bufferManager;
    }

    applyBuffAtkSpeedUp(duration: number = 5, value: number = 0.3): void {
        if (this.bufferManager) {
            this.bufferManager.addEffect(StatusType.ATK_SPEED_UP, duration, value);
        }
    }

    applyBuffMoveSpeedUp(duration: number = 5, value: number = 0.3): void {
        if (this.bufferManager) {
            this.bufferManager.addEffect(StatusType.MOVE_SPEED_UP, duration, value);
        }
    }

    applyBuffDmgUp(duration: number = 5, value: number = 0.5): void {
        if (this.bufferManager) {
            this.bufferManager.addEffect(StatusType.DMG_UP, duration, value);
        }
    }

    applyBuffInvincible(duration: number = 3): void {
        if (this.bufferManager) {
            this.bufferManager.addEffect(StatusType.INVINCIBLE, duration);
        }
    }

    applyBuffMagnet(duration: number = 8, value: number = 1.5): void {
        if (this.bufferManager) {
            this.bufferManager.addEffect(StatusType.MAGNET, duration, value);
        }
    }

    getBuffDamageMultiplier(): number {
        return this.bufferManager ? this.bufferManager.damageMultiplier : 1;
    }

    getBuffAttackSpeedMultiplier(): number {
        return this.bufferManager ? this.bufferManager.attackSpeedMultiplier : 1;
    }

    getBuffMagnetMultiplier(): number {
        return this.bufferManager ? this.bufferManager.magnetMultiplier : 1;
    }

    private showDodgeEffect() {
        const color = new Color(255, 255, 255, 120);
        if (this.playerSprite) {
            this.playerSprite.color = color;
            this.scheduleOnce(() => {
                if (this.playerSprite && this.playerSprite.isValid) {
                    this.playerSprite.color = Color.WHITE;
                }
            }, 0.15);
        }
    }

    private _hurtFlashCount: number = 0;
    private _normalColor: Color = new Color(255, 255, 255, 255);

    private playHurtFlash(){
        if (!this.playerSprite) return;
        this._hurtFlashCount = 6;
        this.unschedule(this._hurtFlashTick);
        this.schedule(this._hurtFlashTick, 0.08);
    }

    private _hurtFlashTick() {
        if (!this.playerSprite || this._hurtFlashCount <= 0) {
            this.updateSpriteColor();
            this.unschedule(this._hurtFlashTick);
            return;
        }
        this._hurtFlashCount--;
        if (this._hurtFlashCount % 2 === 0) {
            const bc = HERO_COLOR_CONFIG[this._heroType].baseColor;
            this.playerSprite.color = new Color(bc.r, bc.g, bc.b, bc.a);
        } else {
            this.playerSprite.color = this._normalColor;
        }
    }

    private updateSpriteColor() {
        if (!this.playerSprite) return;
        if (this.isDashing) return;
        if (this._killBuffActive) {
            const kc = HERO_COLOR_CONFIG[this._heroType].killBuffColor;
            this.playerSprite.color = new Color(kc.r, kc.g, kc.b, kc.a);
            return;
        }
        this.playerSprite.color = this._normalColor;
    }

    clearHurtState() {
        this.hurtCd = 0;
        this._hurtFlashCount = 0;
        if (this.playerSprite) {
            this.playerSprite.color = this._normalColor;
        }
        this.unschedule(this._hurtFlashTick);
    }

    addExp(num: number) {
        const gm = GameManager.Instance;
        let finalExp = gm ? gm.getExpWithBuff(num) : num;
        finalExp = Math.floor(finalExp * this._heroExpBonus * this._talentExpBonus);
        if (this._talentDoubleDrop > 0 && Math.random() < this._talentDoubleDrop) {
            finalExp *= 2;
        }
        this.exp += finalExp;
        while (this.exp >= this.expNext) {
            this.levelUp();
        }
    }

    levelUp() {
        this.exp -= this.expNext;
        this.expNext = Math.floor(this.expNext * 1.3);
        this.level += 1;
        this.maxHp += PLAYER_CONFIG.levelHpAdd;

        TalentManager.Instance.addTalentPoints(TALENT_POINTS_PER_LEVEL);

        const isZhugeHeal = this._heroSkillType === HeroSkillEffectType.LEVEL_UP_HEAL;
        const healAmount = isZhugeHeal
            ? PLAYER_CONFIG.levelHeal + Math.floor(this.maxHp * (this._heroSkillParams.healPercent || 0))
            : PLAYER_CONFIG.levelHeal;
        this.hp = Math.min(this.hp + healAmount, this.maxHp);
        if (isZhugeHeal) {
            this.playSkillActivateVFX();
        }
        if (this.exp < this.expNext) {
            EventManager.Instance.emit(GameEvent.PLAYER_LEVEL_UP);
        }
        AudioManager.Instance.playSfx("audio/sfx/levelup");
    }

    onRevive() {
        this.hp = Math.floor(this.maxHp * 0.5);
        if (GameManager.Instance) {
            GameManager.Instance.gameOver = false;
            GameManager.Instance.battlePause = false;
        }
    }

    private updateHpRegen(dt: number) {
        if (this._talentHpRegen <= 0) return;
        this._hpRegenTimer += dt;
        if (this._hpRegenTimer >= 1.0) {
            this._hpRegenTimer -= 1.0;
            this.hp = Math.min(this.hp + this._talentHpRegen, this.maxHp);
        }
    }

    onDestroy() {
        OfflineIncome.saveExitTime();
        TalentManager.Instance.removeListener(this.onTalentChanged);
        EventManager.Instance.off("PLAYER_REVIVE", this.onRevive, this);
        if (GameManager.Instance) {
            const gm = GameManager.Instance;
            if (!gm.gameOver) {
                if (gm.totalGold > 0) {
                    const currentGold = StorageUtil.getNumber(STORAGE_KEY.GOLD, 0);
                    StorageUtil.setNumber(STORAGE_KEY.GOLD, currentGold + gm.totalGold);
                }
                if (gm.totalKillCount > 0) {
                    RankUI.saveRecord({
                        kill: gm.totalKillCount,
                        time: Math.floor(gm.battleTime),
                        gold: gm.totalGold
                    });
                }
            }
        }
        Player.Instance = null;
    }
}