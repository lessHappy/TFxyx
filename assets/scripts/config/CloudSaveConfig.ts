export const CLOUD_SAVE_KEY = "cloud_save_data";

export const CLOUD_SAVE_KEYS = [
    "sgzy_gold",
    "sgzy_revive",
    "sgzy_best_score",
    "sgzy_battle_double_buff",
    "sgzy_hero_selected",
    "sgzy_hero_unlocked",
    "sgzy_current_stage",
    "sgzy_unlocked_stages",
    "sgzy_highest_stage",
    "sgzy_ach_completed",
    "sgzy_ach_claimed",
    "sgzy_ach_progress",
    "sgzy_total_kill",
    "sgzy_total_gold_earned",
    "sgzy_total_boss_kill",
    "sgzy_total_weapon_unlock",
    "sgzy_total_talent_upgrade",
    "sgzy_max_combo",
    "sgzy_max_level",
    "sgzy_max_survive_time",
    "sgzy_max_single_kill",
    "sgzy_signin_last_date",
    "sgzy_signin_current_day",
    "sgzy_signin_claimed_days",
    "sgzy_tutorial_done",
    "sgzy_share_daily_date",
    "bgmVol",
    "sfxVol",
    "vibrate"
];

export const TALENT_KEY_PREFIX = "talent_";
export const TALENT_TYPES = ["attack", "defense", "speed", "luck", "regen", "crit", "coolDown", "expRate"];

export const SHARE_KEY_PREFIX = "sgzy_share_count_";
export const SHARE_COOLDOWN_PREFIX = "sgzy_share_cooldown_";
export const SHARE_TYPES = ["revive", "gold", "daily", "invite", "game_result"];

export const CLOUD_CONFIG = {
    autoSaveInterval: 30000,
    retryCount: 3
};