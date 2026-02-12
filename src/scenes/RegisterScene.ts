import Phaser from 'phaser';
import { GradientText } from '../utils/GradientText.js';
import { localizationManager } from '../utils/LocalizationManager.js';
import { AuthManager } from '../utils/AuthManager.js';

export default class RegisterScene extends Phaser.Scene {
  private backButton?: Phaser.GameObjects.Text;
  private fromScene = 'MenuScene';
  private returnTo = 'PaymentScene';
  private resizeObserver?: ResizeObserver;

  constructor() {
    super({ key: 'RegisterScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    const data = this.scene.settings.data as { fromScene?: string; returnTo?: string };
    this.fromScene = data?.fromScene || 'MenuScene';
    this.returnTo = data?.returnTo || 'PaymentScene';

    // Background
    this.add.image(width / 2, height / 2, 'background');
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000).setAlpha(0.5);

    // Title
    GradientText.createGameTitle(
      this,
      localizationManager.t('register'),
      width / 2,
      height * 0.1
    );

    // Form HTML overlay
    this.createRegisterForm(width, height);

    // Nút Quay lại
    this.backButton = this.add.text(width / 2, height * 0.9, localizationManager.t('back'), {
      fontSize: '36px',
      color: '#ffffff',
      fontFamily: 'Arial',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    this.backButton.setInteractive({ useHandCursor: true });
    this.backButton.on('pointerdown', () => {
      this.goToLogin();
    });
    this.backButton.on('pointerover', () => this.backButton!.setStyle({ color: '#ffd700' }));
    this.backButton.on('pointerout', () => this.backButton!.setStyle({ color: '#ffffff' }));
  }

  private createRegisterForm(width: number, height: number): void {
    const container = document.getElementById('game-container');
    if (!container) return;

    const form = document.createElement('div');
    form.id = 'register-form-overlay';
    const updateFormWidth = () => {
      const w = container.clientWidth || width;
      form.style.width = Math.min(w * 0.47, 380) + 'px';
    };
    form.style.cssText = `
      position: absolute;
      left: 50%;
      top: 20%;
      transform: translate(-50%, 0);
      max-width: 90%;
      min-width: 200px;
      box-sizing: border-box;
      background: rgba(26, 26, 46, 0.9);
      border: 2px solid #95245b;
      border-radius: 6px;
      padding: clamp(6px, 1.4vw, 10px);
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: clamp(4px, 1vw, 5px);
    `;

    const emailLabel = document.createElement('label');
    emailLabel.textContent = localizationManager.t('email');
    emailLabel.style.cssText = 'color: #fff; font-size: clamp(10px, 1.8vw, 12px);';
    form.appendChild(emailLabel);

    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.placeholder = 'user@example.com';
    emailInput.style.cssText = `
      padding: clamp(4px, 1vw, 6px);
      font-size: clamp(10px, 1.8vw, 12px);
      border: 1px solid #96576a;
      border-radius: 4px;
      background: #1a1a2e;
      color: #fff;
      box-sizing: border-box;
    `;
    form.appendChild(emailInput);

    const passLabel = document.createElement('label');
    passLabel.textContent = localizationManager.t('password');
    passLabel.style.cssText = 'color: #fff; font-size: clamp(10px, 1.8vw, 12px);';
    form.appendChild(passLabel);

    const passInput = document.createElement('input');
    passInput.type = 'password';
    passInput.placeholder = '••••••••';
    passInput.style.cssText = `
      padding: clamp(4px, 1vw, 6px);
      font-size: clamp(10px, 1.8vw, 12px);
      border: 1px solid #96576a;
      border-radius: 4px;
      background: #1a1a2e;
      color: #fff;
      box-sizing: border-box;
    `;
    form.appendChild(passInput);

    const confirmLabel = document.createElement('label');
    confirmLabel.textContent = localizationManager.t('password_confirm');
    confirmLabel.style.cssText = 'color: #fff; font-size: clamp(10px, 1.8vw, 12px);';
    form.appendChild(confirmLabel);

    const confirmInput = document.createElement('input');
    confirmInput.type = 'password';
    confirmInput.placeholder = '••••••••';
    confirmInput.style.cssText = `
      padding: clamp(4px, 1vw, 6px);
      font-size: clamp(10px, 1.8vw, 12px);
      border: 1px solid #96576a;
      border-radius: 4px;
      background: #1a1a2e;
      color: #fff;
      box-sizing: border-box;
    `;
    form.appendChild(confirmInput);

    const registerBtn = document.createElement('button');
    registerBtn.textContent = localizationManager.t('register');
    registerBtn.style.cssText = `
      padding: clamp(6px, 1.2vw, 8px);
      font-size: clamp(12px, 2vw, 14px);
      background: #95245b;
      color: #fff;
      border: 1px solid #96576a;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 2px;
      box-sizing: border-box;
      transition: background 0.2s, border-color 0.2s;
    `;
    registerBtn.onmouseover = () => { registerBtn.style.background = '#b52d6b'; registerBtn.style.borderColor = '#fff'; };
    registerBtn.onmouseout = () => { registerBtn.style.background = '#95245b'; registerBtn.style.borderColor = '#96576a'; };
    registerBtn.onclick = () => this.handleRegister(emailInput.value, passInput.value, confirmInput.value);
    form.appendChild(registerBtn);

    const loginLink = document.createElement('a');
    loginLink.textContent = localizationManager.t('login_link');
    loginLink.href = '#';
    loginLink.style.cssText = 'color: #cbbd1b; font-size: clamp(9px, 1.6vw, 11px); text-align: center; cursor: pointer; transition: color 0.2s, text-decoration 0.2s;';
    loginLink.onmouseover = () => { loginLink.style.color = '#ffd700'; loginLink.style.textDecoration = 'underline'; };
    loginLink.onmouseout = () => { loginLink.style.color = '#cbbd1b'; loginLink.style.textDecoration = 'none'; };
    loginLink.onclick = (e) => {
      e.preventDefault();
      this.goToLogin();
    };
    form.appendChild(loginLink);

    container.style.position = 'relative';
    container.appendChild(form);
    updateFormWidth();

    this.resizeObserver = new ResizeObserver(updateFormWidth);
    this.resizeObserver.observe(container);
  }

  private handleRegister(email: string, password: string, confirm: string): void {
    if (!email.trim()) return;
    if (password !== confirm) return;
    // Demo: đăng ký xong tự động đăng nhập
    const mockToken = 'mock_jwt_' + Date.now();
    AuthManager.setJWT(mockToken);
    this.removeForm();
    this.scene.start(this.returnTo, { fromScene: this.fromScene });
  }

  private goToLogin(): void {
    this.removeForm();
    this.scene.start('LoginScene', {
      fromScene: this.fromScene,
      returnTo: this.returnTo
    });
  }

  private removeForm(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    const form = document.getElementById('register-form-overlay');
    if (form) form.remove();
  }

  shutdown(): void {
    this.removeForm();
  }
}
