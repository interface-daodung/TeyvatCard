import Phaser from 'phaser';
import { AuthManager } from '../utils/AuthManager.js';
import { ApiConfig } from '../utils/ApiConfig.js';
import { formatApiError } from '../utils/formatApiError.js';
import { localizationManager } from '../core/LocalizationManager.js';
import { themeManager } from '../core/ThemeManager.js';
import { createBackButton, GameTitle } from '../components/shared/index.js';
import { createRegisterForm } from '../components/RegisterScene/index.js';

export default class RegisterScene extends Phaser.Scene {
  private fromScene = 'MenuScene';
  private returnTo = 'PaymentScene';
  private removeForm!: () => void;

  constructor() {
    super({ key: 'RegisterScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    const data = this.scene.settings.data as { fromScene?: string; returnTo?: string };
    this.fromScene = data?.fromScene || 'MenuScene';
    this.returnTo = data?.returnTo || 'PaymentScene';

    this.add.image(width / 2, height / 2, 'background');
    this.add.rectangle(width / 2, height / 2, width, height, themeManager.getBackgroundPhaser()).setAlpha(0.5);

    GameTitle.create(this, width / 2, height * 0.1, 'register');

    const scale = this.scale as unknown as { displayWidth: number; displayHeight: number };
    const displayWidth = scale.displayWidth;
    const displayHeight = scale.displayHeight;
    const formApi = createRegisterForm(this, { displayWidth, displayHeight }, {
      onRegister: (email, password, confirm) => this.handleRegister(email, password, confirm),
      onLogin: () => this.goToLogin()
    });
    this.removeForm = formApi.removeForm;

    createBackButton(this, width, height, () => this.goToLogin(), 'back_short');
  }

  private async handleRegister(email: string, password: string, confirm: string): Promise<void> {
    if (!email.trim()) {
      alert('Vui lòng nhập email.');
      return;
    }
    if (password !== confirm) {
      alert('Mật khẩu xác nhận không khớp.');
      return;
    }

    const form = document.getElementById('register-form-overlay');
    const registerBtn = form?.querySelector('button');
    if (registerBtn) {
      (registerBtn as HTMLButtonElement).disabled = true;
      (registerBtn as HTMLButtonElement).textContent = '...';
    }

    try {
      const res = await fetch(ApiConfig.register, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: email.trim(),
          password,
          passwordConfirm: confirm,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(formatApiError(data?.error, 'Đăng ký thất bại'));
        return;
      }

      alert('Đăng ký thành công, vui lòng đăng nhập.');
      this.goToLogin();
    } catch {
      alert('Lỗi kết nối. Kiểm tra server đang chạy.');
    } finally {
      const f = document.getElementById('register-form-overlay');
      const btn = f?.querySelector('button');
      if (btn) {
        (btn as HTMLButtonElement).disabled = false;
        (btn as HTMLButtonElement).textContent = localizationManager.t('register');
      }
    }
  }

  private goToLogin(): void {
    this.removeForm();
    this.scene.start('LoginScene', { fromScene: this.fromScene, returnTo: this.returnTo });
  }

  shutdown(): void {
    this.removeForm();
  }
}
