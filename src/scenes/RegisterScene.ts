import Phaser from 'phaser';
import { AuthManager } from '../utils/AuthManager.js';
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

    const formApi = createRegisterForm(this, width, height, {
      onRegister: (email, password, confirm) => this.handleRegister(email, password, confirm),
      onLogin: () => this.goToLogin()
    });
    this.removeForm = formApi.removeForm;

    createBackButton(this, width, height, () => this.goToLogin(), 'back_short');
  }

  private handleRegister(email: string, password: string, confirm: string): void {
    if (!email.trim()) return;
    if (password !== confirm) return;
    const mockToken = 'mock_jwt_' + Date.now();
    AuthManager.setJWT(mockToken);
    this.removeForm();
    this.scene.start(this.returnTo, { fromScene: this.fromScene });
  }

  private goToLogin(): void {
    this.removeForm();
    this.scene.start('LoginScene', { fromScene: this.fromScene, returnTo: this.returnTo });
  }

  shutdown(): void {
    this.removeForm();
  }
}
