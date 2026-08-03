import { _decorator, AudioSource, AudioClip, resources } from 'cc';
import { StorageUtil } from './StorageUtil';
const { ccclass } = _decorator;

export enum AudioType {
    BGM = "bgm",
    SFX = "sfx"
}

@ccclass("AudioManager")
export class AudioManager {
    private static instance:AudioManager;
    private audioSourceBgm:AudioSource|null = null;
    private audioSourceSfx:AudioSource|null = null;

    private bgmVolume:number = 1;
    private sfxVolume:number = 1;

    // 音频缓存
    private _clipCache: Map<string, AudioClip> = new Map();

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

    playBgm(path:string, loop:boolean = true){
        const cached = this._clipCache.get(path);
        if (cached) {
            this._playBgmClip(cached, loop);
            return;
        }
        resources.load(path, AudioClip, (err, clip)=>{
            if(err || !this.audioSourceBgm) return;
            this._clipCache.set(path, clip);
            this._playBgmClip(clip, loop);
        });
    }

    private _playBgmClip(clip: AudioClip, loop: boolean) {
        if (!this.audioSourceBgm) return;
        this.audioSourceBgm.clip = clip;
        this.audioSourceBgm.loop = loop;
        this.audioSourceBgm.play();
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
        this.audioSourceBgm?.stop();
    }

    clearCache() {
        this._clipCache.clear();
    }
}