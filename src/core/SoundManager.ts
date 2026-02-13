/**
 * SoundManager - Quản lý âm thanh toàn game
 * - Đọc/ghi volume từ localStorage (gameVolume)
 * - Đồng bộ volume với Phaser Sound Manager
 * - play() áp dụng volume hiện tại (qua game.sound.volume global)
 */
import Phaser from 'phaser';

const STORAGE_KEY = 'gameVolume';

export default class SoundManager {
    private static instance: SoundManager;
    private game: Phaser.Game | null = null;
    private _volume = 1;
    private _volumeBeforeMute = 1;

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
        if (this.game.sound) {
            this.game.sound.volume = this._volume;
        }
    }

    private loadVolume(): number {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved !== null ? Math.max(0, Math.min(1, parseFloat(saved))) : 1;
    }

    getVolume(): number {
        return this._volume;
    }

    getVolumeBeforeMute(): number {
        return this._volumeBeforeMute;
    }

    setVolume(v: number): void {
        this._volume = Math.max(0, Math.min(1, v));
        localStorage.setItem(STORAGE_KEY, String(this._volume));
        if (this.game?.sound) {
            this.game.sound.volume = this._volume;
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
     * Phát âm thanh (áp dụng volume global từ game.sound)
     * @param key - Key của audio trong cache (vd: 'sword-sound', 'bomb-sound')
     */
    play(key: string, config?: Phaser.Types.Sound.SoundConfig): void {
        if (!this.game?.sound) return;
        this.game.sound.play(key, config);
    }
}

export const soundManager = SoundManager.getInstance();
