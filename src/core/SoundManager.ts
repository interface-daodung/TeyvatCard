/**
 * SoundManager - Quản lý âm thanh toàn game
 * - SE (hiệu ứng): volume riêng gameVolume, áp dụng khi play(key) qua config.volume
 * - BGM: volume riêng gameBGMVolume, không bị SE volume ảnh hưởng (master = 1)
 */
import Phaser from 'phaser';
import { dataManager } from './DataManager.js';

const STORAGE_KEY = 'gameVolume';
const STORAGE_BGM_KEY = 'gameBGMVolume';
const BGM_KEY = 'bgm-ormos';

export default class SoundManager {
    private static instance: SoundManager;
    private game: Phaser.Game | null = null;
    private _volume = 1;
    private _volumeBeforeMute = 1;
    private _bgmVolume = 1;
    private _bgmVolumeBeforeMute = 1;
    private _bgm: Phaser.Sound.BaseSound | null = null;
    /** Cờ in-memory: đã phát BGM thành công trong session này. Không lưu localStorage (sau reload web mất quyền phát). */
    private _bgmUnlockedThisSession = false;

    private constructor() {}

    static getInstance(): SoundManager {
        if (!SoundManager.instance) {
            SoundManager.instance = new SoundManager();
        }
        return SoundManager.instance;
    }

    /**
     * Gắn game reference (gọi 1 lần sau khi game khởi tạo)
     */
    setGame(game: Phaser.Game): void {
        this.game = game;
        this._volume = this.loadVolume();
        this._bgmVolume = this.loadBGMVolume();
        if (this.game.sound) {
            this.game.sound.volume = 1;
        }
    }

    private loadVolume(): number {
        const saved = dataManager.get<number>(STORAGE_KEY);
        return saved !== null && saved !== undefined ? Math.max(0, Math.min(1, saved)) : 1;
    }

    private loadBGMVolume(): number {
        const saved = dataManager.get<number>(STORAGE_BGM_KEY);
        return saved !== null && saved !== undefined ? Math.max(0, Math.min(1, saved)) : 1;
    }

    getVolume(): number {
        return this._volume;
    }

    getVolumeBeforeMute(): number {
        return this._volumeBeforeMute;
    }

    setVolume(v: number): void {
        this._volume = Math.max(0, Math.min(1, v));
        dataManager.set(STORAGE_KEY, this._volume);
    }

    getBGMVolume(): number {
        return this._bgmVolume;
    }

    setBGMVolume(v: number): void {
        this._bgmVolume = Math.max(0, Math.min(1, v));
        dataManager.set(STORAGE_BGM_KEY, this._bgmVolume);
        if (this._bgm && typeof (this._bgm as any).setVolume === 'function') {
            (this._bgm as any).setVolume(this._bgmVolume);
        }
    }

    toggleBGMMute(): { volume: number; isMuted: boolean } {
        if (this._bgmVolume > 0) {
            this._bgmVolumeBeforeMute = this._bgmVolume;
            this.setBGMVolume(0);
            return { volume: 0, isMuted: true };
        } else {
            const v = this._bgmVolumeBeforeMute > 0 ? this._bgmVolumeBeforeMute : 1;
            this.setBGMVolume(v);
            return { volume: v, isMuted: false };
        }
    }

    toggleMute(): { volume: number; isMuted: boolean } {
        if (this._volume > 0) {
            this._volumeBeforeMute = this._volume;
            this.setVolume(0);
            return { volume: 0, isMuted: true };
        } else {
            const v = this._volumeBeforeMute > 0 ? this._volumeBeforeMute : 1;
            this.setVolume(v);
            return { volume: v, isMuted: false };
        }
    }

    /**
     * Phát âm thanh SE – áp dụng _volume (không ảnh hưởng BGM).
     */
    play(key: string, config?: Phaser.Types.Sound.SoundConfig): void {
        if (!this.game?.sound) return;
        const opts = { ...config, volume: this._volume };
        this.game.sound.play(key, opts);
    }

    /**
     * Trả về true nếu cần hiện lớp phủ để user bấm mới được phát BGM (chưa phát thành công trong session).
     * Không dùng localStorage — sau reload trình duyệt thu hồi quyền phát nên cần lớp phủ lại.
     */
    needsBGMOverlay(): boolean {
        return !this._bgmUnlockedThisSession;
    }

    /**
     * Phát nhạc nền (loop). Gọi sau user gesture (vd: bấm lớp phủ menu).
     */
    playBGM(): void {
        if (!this.game?.sound) return;
        if (this._bgm && (this._bgm as any).isPlaying) return;
        this.stopBGM();
        this._bgm = this.game.sound.add(BGM_KEY, { loop: true, volume: this._bgmVolume });
        this._bgm.play();
        this._bgmUnlockedThisSession = true;
    }

    /**
     * Dừng nhạc nền
     */
    stopBGM(): void {
        if (this._bgm) {
            this._bgm.stop();
            this._bgm.destroy();
            this._bgm = null;
        }
    }
}

export const soundManager = SoundManager.getInstance();
