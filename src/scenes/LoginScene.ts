import Phaser from 'phaser';
import { GradientText } from '../utils/GradientText.js';
import { localizationManager } from '../utils/LocalizationManager.js';
import { AuthManager } from '../utils/AuthManager.js';
import { ApiConfig } from '../utils/ApiConfig.js';

export default class LoginScene extends Phaser.Scene {
  private backButton?: Phaser.GameObjects.Text;
  private fromScene = 'MenuScene';
  private returnTo = 'PaymentScene';
  private resizeObserver?: ResizeObserver;
  private boundOnLanguageChanged!: () => void;

  constructor() {
    super({ key: 'LoginScene' });
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
      localizationManager.t('login'),
      width / 2,
      height * 0.12
    );

    // Form HTML overlay
    this.createLoginForm(width, height);

    // Nút Quay lại
    this.backButton = this.add.text(width / 2, height * 0.88, localizationManager.t('back'), {
      fontSize: '36px',
      color: '#ffffff',
      fontFamily: 'Arial',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    this.backButton.setInteractive({ useHandCursor: true });
    this.backButton.on('pointerdown', () => {
      this.removeForm();
      this.scene.start(this.fromScene);
    });
    this.backButton.on('pointerover', () => this.backButton!.setStyle({ color: '#ffd700' }));
    this.backButton.on('pointerout', () => this.backButton!.setStyle({ color: '#ffffff' }));

    this.boundOnLanguageChanged = this.onLanguageChanged.bind(this);
    const win = window as { gameEvents?: { on: (e: string, fn: () => void) => void } };
    if (win.gameEvents?.on) {
      win.gameEvents.on('languageChanged', this.boundOnLanguageChanged);
    }
  }

  private onLanguageChanged(): void {
    if (!this.scene.isActive() || !this.scene.isVisible()) return;
    const form = document.getElementById('login-form-overlay');
    const container = form?.querySelector('#google-signin-container') as HTMLElement | null;
    const clientId = ApiConfig.googleClientId;
    if (!container || !clientId || !window.google?.accounts?.id) return;
    container.innerHTML = '';
    this.initGoogleButton(container, clientId);
  }

  private createLoginForm(width: number, height: number): void {
    const container = document.getElementById('game-container');
    if (!container) return;

    const form = document.createElement('div');
    form.id = 'login-form-overlay';
    const updateFormWidth = () => {
      const w = container.clientWidth || width;
      form.style.width = Math.min(w * 0.47, 380) + 'px';
    };
    form.style.cssText = `
      position: absolute;
      left: 50%;
      top: 24%;
      transform: translate(-50%, 0);
      max-width: 92%;
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

    const loginBtn = document.createElement('button');
    loginBtn.textContent = localizationManager.t('login');
    loginBtn.style.cssText = `
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
    loginBtn.onmouseover = () => { loginBtn.style.background = '#b52d6b'; loginBtn.style.borderColor = '#fff'; };
    loginBtn.onmouseout = () => { loginBtn.style.background = '#95245b'; loginBtn.style.borderColor = '#96576a'; };
    loginBtn.onclick = () => this.handleLogin(emailInput.value, passInput.value);
    form.appendChild(loginBtn);

    const divider = document.createElement('div');
    divider.style.cssText = 'display: flex; align-items: center; gap: 8px; margin: 4px 0;';
    divider.innerHTML = '<span style="flex:1;height:1px;background:#96576a;"></span><span style="color:#999;font-size:11px;">' + localizationManager.t('or') + '</span><span style="flex:1;height:1px;background:#96576a;"></span>';
    form.appendChild(divider);

    const googleContainer = document.createElement('div');
    googleContainer.id = 'google-signin-container';
    googleContainer.style.cssText = 'min-height: 40px; display: flex; align-items: center; justify-content: center;';
    form.appendChild(googleContainer);
    this.loadAndInitGoogleSignIn(googleContainer);

    const registerLink = document.createElement('a');
    registerLink.textContent = localizationManager.t('register_link');
    registerLink.href = '#';
    registerLink.style.cssText = 'color: #cbbd1b; font-size: clamp(9px, 1.6vw, 11px); text-align: center; cursor: pointer; transition: color 0.2s, text-decoration 0.2s;';
    registerLink.onmouseover = () => { registerLink.style.color = '#ffd700'; registerLink.style.textDecoration = 'underline'; };
    registerLink.onmouseout = () => { registerLink.style.color = '#cbbd1b'; registerLink.style.textDecoration = 'none'; };
    registerLink.onclick = (e) => {
      e.preventDefault();
      this.goToRegister();
    };
    form.appendChild(registerLink);

    container.style.position = 'relative';
    container.appendChild(form);
    updateFormWidth();

    this.resizeObserver = new ResizeObserver(updateFormWidth);
    this.resizeObserver.observe(container);
  }

  private loadAndInitGoogleSignIn(container: HTMLElement): void {
    const clientId = ApiConfig.googleClientId;
    if (!clientId) {
      container.innerHTML = '<span style="color:#999;font-size:11px;">Google login chưa cấu hình (VITE_GOOGLE_CLIENT_ID)</span>';
      return;
    }

    if (window.google?.accounts?.id) {
      this.initGoogleButton(container, clientId);
      return;
    }

    const locale = localizationManager.currentLanguage;
    const script = document.createElement('script');
    script.src = `https://accounts.google.com/gsi/client?hl=${locale}`;
    script.async = true;
    script.defer = true;
    script.onload = () => this.initGoogleButton(container, clientId);
    script.onerror = () => {
      container.innerHTML = '<span style="color:#e74c3c;font-size:11px;">Không tải được Google Sign-In</span>';
    };
    document.head.appendChild(script);
  }

  private initGoogleButton(container: HTMLElement, clientId: string): void {
    const scene = this;
    window.google?.accounts?.id?.initialize({
      client_id: clientId,
      callback: (response: { credential?: string }) => {
        if (!response?.credential) return;
        scene.handleGoogleCredential(response.credential);
      },
    });
    const btnWidth = Math.min(container.offsetWidth || 320, 400);
    const locale = localizationManager.currentLanguage;
    window.google?.accounts?.id?.renderButton(container, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      width: String(btnWidth),
      text: 'signin_with',
      locale,
    });
  }

  private async handleGoogleCredential(credential: string): Promise<void> {
    const form = document.getElementById('login-form-overlay');
    const container = form?.querySelector('#google-signin-container');
    if (container) {
      container.innerHTML = '<span style="color:#aaa;font-size:12px;">Đang xử lý...</span>';
    }

    try {
      const res = await fetch(ApiConfig.googleLogin, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ credential }),
      });
      const data = await res.json();

      if (!res.ok) {
        const msg = data?.error || 'Đăng nhập Google thất bại';
        alert(msg);
        if (container) this.loadAndInitGoogleSignIn(container as HTMLElement);
        return;
      }

      const token = data?.accessToken;
      if (token) {
        AuthManager.setJWT(token);
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
      }
      this.removeForm();
      this.scene.start(this.returnTo, { fromScene: this.fromScene });
    } catch (err) {
      alert('Lỗi kết nối. Kiểm tra server đang chạy.');
      if (container) this.loadAndInitGoogleSignIn(container as HTMLElement);
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
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();

      if (!res.ok) {
        const msg = data?.error || 'Đăng nhập thất bại';
        alert(msg);
        return;
      }

      const token = data?.accessToken;
      if (token) {
        AuthManager.setJWT(token);
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
      }
      this.removeForm();
      this.scene.start(this.returnTo, { fromScene: this.fromScene });
    } catch (err) {
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
    this.scene.start('RegisterScene', {
      fromScene: this.fromScene,
      returnTo: this.returnTo
    });
  }

  private removeForm(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    const form = document.getElementById('login-form-overlay');
    if (form) form.remove();
  }

  shutdown(): void {
    const win = window as { gameEvents?: { off: (e: string, fn: () => void) => void } };
    if (win.gameEvents?.off && this.boundOnLanguageChanged) {
      win.gameEvents.off('languageChanged', this.boundOnLanguageChanged);
    }
    this.removeForm();
  }
}
