export enum TutorialStep {
    MOVE = "move",
    KILL_ENEMY = "kill_enemy",
    PICK_EXP = "pick_exp",
    SELECT_WEAPON = "select_weapon",
    BOSS_WARNING = "boss_warning",
    DASH = "dash"
}

export interface TutorialStepData {
    id: TutorialStep;
    text: string;
    arrowOffsetX: number;
    arrowOffsetY: number;
    arrowRotation: number;
    delay: number;
    autoNextAfter: number;
    highlightTarget: string;
}

export const TUTORIAL_STEPS: TutorialStepData[] = [
    {
        id: TutorialStep.MOVE,
        text: "拖动摇杆移动角色",
        arrowOffsetX: -60,
        arrowOffsetY: -60,
        arrowRotation: 45,
        delay: 0.5,
        autoNextAfter: 4,
        highlightTarget: "Joystick"
    },
    {
        id: TutorialStep.KILL_ENEMY,
        text: "靠近敌人自动攻击\n击杀敌人获取经验",
        arrowOffsetX: 0,
        arrowOffsetY: 80,
        arrowRotation: -90,
        delay: 0.3,
        autoNextAfter: 5,
        highlightTarget: "Enemy"
    },
    {
        id: TutorialStep.PICK_EXP,
        text: "拾取经验球升级",
        arrowOffsetX: 0,
        arrowOffsetY: 60,
        arrowRotation: -90,
        delay: 0.3,
        autoNextAfter: 5,
        highlightTarget: "ExpDrop"
    },
    {
        id: TutorialStep.SELECT_WEAPON,
        text: "选择新武器强化自己",
        arrowOffsetX: 0,
        arrowOffsetY: -80,
        arrowRotation: 90,
        delay: 0.5,
        autoNextAfter: 0,
        highlightTarget: "WeaponSelect"
    },
    {
        id: TutorialStep.BOSS_WARNING,
        text: "Boss 出现了！\n注意躲避攻击",
        arrowOffsetX: 0,
        arrowOffsetY: 100,
        arrowRotation: -90,
        delay: 0.3,
        autoNextAfter: 3,
        highlightTarget: "Boss"
    },
    {
        id: TutorialStep.DASH,
        text: "点击冲刺按钮\n快速躲避敌人",
        arrowOffsetX: 60,
        arrowOffsetY: -60,
        arrowRotation: -135,
        delay: 0.3,
        autoNextAfter: 4,
        highlightTarget: "DashBtn"
    }
];

export const TUTORIAL_STORAGE_KEY = "sgzy_tutorial_done";