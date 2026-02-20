import Phaser from 'phaser';
import { localizationManager } from '../core/LocalizationManager.js';
import { AuthManager } from '../utils/AuthManager.js';
import { ApiConfig } from '../utils/ApiConfig.js';
import { formatApiError } from '../utils/formatApiError.js';
import { themeManager } from '../core/ThemeManager.js';
import { createBackButton, GameTitle } from '../components/shared/index.js';
import { createLoginForm } from '../components/LoginScene/index.js';

export default class LoginScene extends Phaser.Scene {
  private fromScene = 'MenuScene';
  private returnTo = 'PaymentScene';
  private removeForm!: () => void;
  private refreshGoogleButton!: () => void;
  private boundOnLanguageChanged!: () => void;

  constructor() {
    super({ key: 'LoginScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    const data = this.scene.settings.data as { fromScene?: string; returnTo?: string };
    this.fromScene = data?.fromScene || 'MenuScene';
    this.returnTo = data?.returnTo || 'PaymentScene';

    this.add.image(width / 2, height / 2, 'background');
    this.add.rectangle(width / 2, height / 2, width, height, themeManager.getBackgroundPhaser()).setAlpha(0.5);

    GameTitle.create(this, width / 2, height * 0.12, 'login');

    const scale = this.scale as unknown as { displayWidth: number; displayHeight: number };
    const displayWidth = scale.displayWidth;
    const displayHeight = scale.displayHeight;
    const formApi = createLoginForm(this, { displayWidth, displayHeight }, {
      onLogin: (email, password) => this.handleLogin(email, password),
      onGoogleCredential: (credential) => this.handleGoogleCredential(credential),
      onRegister: () => this.goToRegister()
    });
    this.removeForm = formApi.removeForm;
    this.refreshGoogleButton = formApi.refreshGoogleButton;

    createBackButton(this, width, height, () => {
      this.removeForm();
      this.scene.start(this.fromScene);
    }, 'back_short');

    this.boundOnLanguageChanged = this.onLanguageChanged.bind(this);
    this.game.events.on('languageChanged', this.boundOnLanguageChanged);
  }

  private onLanguageChanged(): void {
    if (!this.scene.isActive() || !this.scene.isVisible()) return;
    this.refreshGoogleButton();
  }

  private async handleGoogleCredential(credential: string): Promise<void> {
    const form = document.getElementById('login-form-overlay');
    const container = form?.querySelector('#google-signin-container');
    if (container) {
      (container as HTMLElement).innerHTML = `<span style="color:${themeManager.getNeutral()};font-size:12px;">Đang xử lý...</span>`;
    }

    try {
      const res = await fetch(ApiConfig.googleLogin, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ credential })
      });
      const data = await res.json();

      if (!res.ok) {
        alert(formatApiError(data?.error, 'Đăng nhập Google thất bại'));
        this.refreshGoogleButton();
        return;
      }

      if (data?.user) AuthManager.setCachedUser(data.user);
      this.removeForm();
      this.scene.start(this.returnTo, { fromScene: this.fromScene });
    } catch {
      alert('Lỗi kết nối. Kiểm tra server đang chạy.');
      this.refreshGoogleButton();
    }
  }

  private async handleLogin(email: string, password: string): Promise<void> {
    if (!email.trim() || !password.trim()) return;

    const form = document.getElementById('login-form-overlay');
    const loginBtn = form?.querySelector('button');
    if (loginBtn) {
      (loginBtn as HTMLButtonElement).disabled = true;
      (loginBtn as HTMLButtonElement).textContent = '...';
    }

    try {
      const res = await fetch(ApiConfig.loginUser, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim(), password })
      });
      const data = await res.json();

      if (!res.ok) {
        alert(formatApiError(data?.error, 'Đăng nhập thất bại'));
        return;
      }

      if (data?.user) AuthManager.setCachedUser(data.user);
      this.removeForm();
      this.scene.start(this.returnTo, { fromScene: this.fromScene });
    } catch {
      alert('Lỗi kết nối. Kiểm tra server đang chạy.');
    } finally {
      const f = document.getElementById('login-form-overlay');
      const btn = f?.querySelector('button');
      if (btn) {
        (btn as HTMLButtonElement).disabled = false;
        (btn as HTMLButtonElement).textContent = localizationManager.t('login');
      }
    }
  }

  private goToRegister(): void {
    this.removeForm();
    this.scene.start('RegisterScene', { fromScene: this.fromScene, returnTo: this.returnTo });
  }

  shutdown(): void {
    if (this.boundOnLanguageChanged) {
      this.game.events.off('languageChanged', this.boundOnLanguageChanged);
    }
    this.removeForm();
  }
}
