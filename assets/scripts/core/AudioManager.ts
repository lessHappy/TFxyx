import { _decorator, AudioSource, AudioClip, resources, tween } from 'cc';
import { StorageUtil } from './StorageUtil';
const { ccclass } = _decorator;

export enum AudioType {
    BGM = "bgm",
    SFX = "sfx"
}

export const BGM_PATH = {
    MAIN: "audio/bgm/main",
    BATTLE_NORMAL: "audio/bgm/battle_normal",
    BATTLE_BOSS: "audio/bgm/battle_boss",
    GAME_OVER: "audio/bgm/game_over",
    VICTORY: "audio/bgm/victory"
};

@ccclass("AudioManager")
export class AudioManager {
    private static instance:AudioManager;
    private audioSourceBgm:AudioSource|null = null;
    private audioSourceSfx:AudioSource|null = null;

    private bgmVolume:number = 1;
    private sfxVolume:number = 1;

    private _clipCache: Map<string, AudioClip> = new Map();
    private _currentBgmPath: string = "";
    private _isBgmPlaying: boolean = false;
    private _isFading: boolean = false;
    private _bgmPaused: boolean = false;

    private readonly DEFAULT_FADE_DURATION: number = 0.8;

    static get Instance(){
        if(!AudioManager.instance) AudioManager.instance = new AudioManager();
        return AudioManager.instance;
    }

    init(bgmSource:AudioSource, sfxSource:AudioSource){
        this.audioSourceBgm = bgmSource;
        this.audioSourceSfx = sfxSource;
        this.bgmVolume = StorageUtil.getNumber("bgmVol",1);
        this.sfxVolume = StorageUtil.getNumber("sfxVol",1);
        this.refreshVolume();
    }

    refreshVolume(){
        if(this.audioSourceBgm) this.audioSourceBgm.volume = this.bgmVolume;
        if(this.audioSourceSfx) this.audioSourceSfx.volume = this.sfxVolume;
    }

    setBgmVolume(v:number){
        this.bgmVolume = v;
        StorageUtil.setNumber("bgmVol",v);
        this.refreshVolume();
    }
    setSfxVolume(v:number){
        this.sfxVolume = v;
        StorageUtil.setNumber("sfxVol",v);
        this.refreshVolume();
    }
    getBgmVolume(): number {
        return this.bgmVolume;
    }
    getSfxVolume(): number {
        return this.sfxVolume;
    }

    playBgm(path:string, loop:boolean = true, fadeInDuration: number = 0){
        if (this._currentBgmPath === path && this._isBgmPlaying) return;
        this._currentBgmPath = path;

        const cached = this._clipCache.get(path);
        if (cached) {
            this._playBgmClip(cached, loop, fadeInDuration);
            return;
        }
        resources.load(path, AudioClip, (err, clip)=>{
            if(err) return;
            this._clipCache.set(path, clip);
            this._playBgmClip(clip, loop, fadeInDuration);
        });
    }

    private _playBgmClip(clip: AudioClip, loop: boolean, fadeInDuration: number = 0) {
        if (!this.audioSourceBgm) return;
        this.audioSourceBgm.stop();
        this.audioSourceBgm.clip = clip;
        this.audioSourceBgm.loop = loop;
        this.audioSourceBgm.volume = 0;
        this.audioSourceBgm.play();
        this._isBgmPlaying = true;
        this._bgmPaused = false;

        const duration = fadeInDuration > 0 ? fadeInDuration : this.DEFAULT_FADE_DURATION;
        this._fadeVolume(0, this.bgmVolume, duration);
    }

    crossFadeBgm(path: string, loop: boolean = true, fadeDuration: number = 0.8) {
        if (this._isFading) return;
        if (this._currentBgmPath === path && this._isBgmPlaying) return;

        const duration = fadeDuration > 0 ? fadeDuration : this.DEFAULT_FADE_DURATION;
        this._isFading = true;

        this._fadeOutBgmInternal(duration * 0.5, () => {
            this._currentBgmPath = path;
            const cached = this._clipCache.get(path);
            if (cached) {
                this._playBgmClip(cached, loop, duration * 0.5);
                this._isFading = false;
                return;
            }
            resources.load(path, AudioClip, (err, clip)=>{
                if(err) {
                    this._isFading = false;
                    return;
                }
                this._clipCache.set(path, clip);
                this._playBgmClip(clip, loop, duration * 0.5);
                this._isFading = false;
            });
        });
    }

    fadeOutBgm(fadeDuration: number = 0.8, callback?: () => void) {
        const duration = fadeDuration > 0 ? fadeDuration : this.DEFAULT_FADE_DURATION;
        this._fadeOutBgmInternal(duration, callback);
    }

    private _fadeOutBgmInternal(duration: number, callback?: () => void) {
        if (!this.audioSourceBgm || !this._isBgmPlaying) {
            if (callback) callback();
            return;
        }
        this._fadeVolume(this.bgmVolume, 0, duration, () => {
            this.audioSourceBgm?.stop();
            this._isBgmPlaying = false;
            if (callback) callback();
        });
    }

    private _fadeVolume(from: number, to: number, duration: number, callback?: () => void) {
        if (!this.audioSourceBgm) return;
        const source = this.audioSourceBgm;
        tween(source)
            .set({ volume: from })
            .to(duration, { volume: to })
            .call(() => {
                if (callback) callback();
            })
            .start();
    }

    playSfx(path:string){
        const cached = this._clipCache.get(path);
        if (cached) {
            this.audioSourceSfx?.playOneShot(cached);
            return;
        }
        resources.load(path, AudioClip, (err, clip)=>{
            if(err || !this.audioSourceSfx) return;
            this._clipCache.set(path, clip);
            this.audioSourceSfx.playOneShot(clip);
        });
    }

    stopBgm(){
        this._isBgmPlaying = false;
        this._currentBgmPath = "";
        this._bgmPaused = false;
        this.audioSourceBgm?.stop();
    }

    pauseBgm() {
        if (!this._isBgmPlaying || this._bgmPaused) return;
        this._bgmPaused = true;
        this.audioSourceBgm?.pause();
    }

    resumeBgm() {
        if (!this._bgmPaused) return;
        this._bgmPaused = false;
        this.audioSourceBgm?.play();
    }

    isBgmPlaying(): boolean {
        return this._isBgmPlaying;
    }

    getCurrentBgmPath(): string {
        return this._currentBgmPath;
    }

    clearCache() {
        this._clipCache.clear();
    }
}