import { _decorator, Component, Vec2, Vec3, Color, Sprite, math } from 'cc';
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
import { TalentManager } from '../core/TalentManager';
import { TalentType } from '../config/TalentConfig';
import { HeroManager } from '../core/HeroManager';
import { HeroType } from '../config/HeroConfig';
import { TutorialManager } from '../core/TutorialManager';
import { TutorialStep } from '../config/TutorialConfig';
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

    private _heroHpBonus: number = 1;
    private _heroMoveSpeedBonus: number = 1;
    private _heroExpBonus: number = 1;
    private _heroType: HeroType = HeroType.ZHAO_YUN;
    private _heroDashCooldownMult: number = 1;

    // 冲刺系统
    private isDashing: boolean = false;
    private dashTimer: number = 0;
    private dashCooldownTimer: number = 0;
    private dashDir: Vec2 = new Vec2();
    private _dashColor: Color = new Color(180, 220, 255, 255);

    // 关羽击杀Buff：击杀后3秒内攻击力+30%
    private _killBuffTimer: number = 0;
    private _killBuffSpriteColor: Color = new Color(255, 180, 60, 255);

    onLoad() {
        if (Player.Instance) {
            this.node.destroy();
            return;
        }
        Player.Instance = this;
        this.applyBonuses();
        EventManager.Instance.on("PLAYER_REVIVE", this.onRevive, this);
    }

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

        if (heroData.id === HeroType.ZHAO_YUN) {
            this._heroDashCooldownMult = 0.8;
        } else {
            this._heroDashCooldownMult = 1;
        }
    }

    getHeroDamageBonus(): number {
        const heroData = HeroManager.Instance.getSelectedHeroData();
        let bonus = heroData.damageBonus;
        if (this._heroType === HeroType.GUAN_YU && this._killBuffTimer > 0) {
            bonus += 0.3;
        }
        return bonus;
    }

    onKill() {
        if (this._heroType === HeroType.GUAN_YU) {
            this._killBuffTimer = 3;
            if (this.playerSprite) {
                this.playerSprite.color = this._killBuffSpriteColor;
            }
        }
    }

    getHeroAttackSpeedBonus(): number {
        const heroData = HeroManager.Instance.getSelectedHeroData();
        return heroData.attackSpeedBonus;
    }

    getHeroCritDmgBonus(): number {
        if (this._heroType === HeroType.LV_BU) return 0.5;
        return 0;
    }

    getHeroLowHpDmgBonus(): number {
        if (this._heroType === HeroType.ZHANG_FEI && this.hp < this.maxHp * 0.3) {
            return 0.5;
        }
        return 0;
    }

    private applyTalentBonuses() {
        const tm = TalentManager.Instance;
        this._talentHpBonus = tm.getEffectPercent(TalentType.MAX_HP);
        this._talentMoveSpeedBonus = tm.getEffectPercent(TalentType.MOVE_SPEED);
        this._talentExpBonus = tm.getEffectPercent(TalentType.EXP_GAIN);
        this._talentDamageReduction = tm.getEffectValue(TalentType.DAMAGE_REDUCTION);
        this._talentHpRegen = tm.getEffectValue(TalentType.HP_REGEN);
    }

    getHeroType(): HeroType {
        return this._heroType;
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
            this.playerSprite.color = this._dashColor;
        }
        AudioManager.Instance.playSfx("audio/sfx/dash");
        TutorialManager.Instance.completeStep(TutorialStep.DASH);
    }

    update(deltaTime:number){
        if(GameManager.Instance?.battlePause || GameManager.Instance?.gameOver) return;

        if (deltaTime > 0.1) {
            deltaTime = 0.1;
        }

        if(this.hurtCd > 0) this.hurtCd -= deltaTime;
        if(this.dashCooldownTimer > 0) this.dashCooldownTimer -= deltaTime;

        // 关羽击杀Buff倒计时
        if (this._killBuffTimer > 0) {
            this._killBuffTimer -= deltaTime;
            if (this._killBuffTimer <= 0) {
                this._killBuffTimer = 0;
                if (this.playerSprite && !this.isDashing && this._hurtFlashCount <= 0) {
                    this.playerSprite.color = this._normalColor;
                }
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
                if (this.playerSprite) {
                    this.playerSprite.color = this._normalColor;
                }
            }
            return;
        }

        const speed = PLAYER_CONFIG.moveSpeed * this._heroMoveSpeedBonus * this._talentMoveSpeedBonus;
        const dx = this.moveDir.x * speed * deltaTime;
        const dy = this.moveDir.y * speed * deltaTime;

        this._tempPos.set(this.node.position.x + dx, this.node.position.y + dy, 0);
        this._tempPos.x = math.clamp(this._tempPos.x, PLAYER_CONFIG.boundMinX, PLAYER_CONFIG.boundMaxX);
        this._tempPos.y = math.clamp(this._tempPos.y, PLAYER_CONFIG.boundMinY, PLAYER_CONFIG.boundMaxY);
        this.node.setPosition(this._tempPos);
    }

    takeDamage(dmg: number) {
        if (GameManager.Instance?.battlePause || GameManager.Instance?.gameOver) return;
        if(this.hurtCd > 0) return;
        if (this.isDashing) return;

        const reducedDmg = Math.max(1, Math.floor(dmg * (1 - this._talentDamageReduction)));
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

    private _hurtFlashCount: number = 0;
    private _hurtColor: Color = new Color(255, 80, 80, 255);
    private _normalColor: Color = new Color(255, 255, 255, 255);

    private playHurtFlash(){
        if (!this.playerSprite) return;
        this._hurtFlashCount = 6;
        this.unschedule(this._hurtFlashTick);
        this.schedule(this._hurtFlashTick, 0.08);
    }

    private _hurtFlashTick() {
        if (!this.playerSprite || this._hurtFlashCount <= 0) {
            if (this.playerSprite) this.playerSprite.color = this._normalColor;
            this.unschedule(this._hurtFlashTick);
            return;
        }
        this._hurtFlashCount--;
        this.playerSprite.color = (this._hurtFlashCount % 2 === 0)
            ? this._hurtColor
            : this._normalColor;
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
        const healAmount = this._heroType === HeroType.ZHUGE_LIANG
            ? PLAYER_CONFIG.levelHeal + Math.floor(this.maxHp * 0.2)
            : PLAYER_CONFIG.levelHeal;
        this.hp = Math.min(this.hp + healAmount, this.maxHp);
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