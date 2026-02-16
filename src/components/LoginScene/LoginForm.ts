import Phaser from 'phaser';
import { themeManager } from '../../core/ThemeManager.js';
import { localizationManager } from '../../core/LocalizationManager.js';
import { ApiConfig } from '../../utils/ApiConfig.js';

export interface LoginFormCallbacks {
    onLogin: (email: string, password: string) => void;
    onGoogleCredential: (credential: string) => void;
    onRegister: () => void;
}

export interface LoginFormResult {
    removeForm: () => void;
    refreshGoogleButton: () => void;
}

function loadAndInitGoogleSignIn(
    container: HTMLElement,
    onCredential: (credential: string) => void,
    googleButtonScale: number
): void {
    const clientId = ApiConfig.googleClientId;
    if (!clientId) {
        container.innerHTML = `<span style="color:${themeManager.getNeutral()};font-size:11px;">Google login chưa cấu hình (VITE_GOOGLE_CLIENT_ID)</span>`;
        return;
    }
    if (window.google?.accounts?.id) {
        initGoogleButton(container, clientId, onCredential, googleButtonScale);
        return;
    }
    const locale = localizationManager.currentLanguage;
    const script = document.createElement('script');
    script.src = `https://accounts.google.com/gsi/client?hl=${locale}`;
    script.async = true;
    script.defer = true;
    script.onload = () => initGoogleButton(container, clientId, onCredential, googleButtonScale);
    script.onerror = () => {
        container.innerHTML = `<span style="color:${themeManager.getError()};font-size:11px;">Không tải được Google Sign-In</span>`;
    };
    document.head.appendChild(script);
}

function initGoogleButton(
    container: HTMLElement,
    clientId: string,
    onCredential: (credential: string) => void,
    googleButtonScale: number
): void {
    window.google?.accounts?.id?.initialize({
        client_id: clientId,
        callback: (response: { credential?: string }) => {
            if (response?.credential) onCredential(response.credential);
        }
    });
    const baseWidth = container.offsetWidth || 320;
    const btnWidth = Math.round(baseWidth * googleButtonScale);
    const locale = localizationManager.currentLanguage;
    window.google?.accounts?.id?.renderButton(container, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        width: String(btnWidth),
        text: 'signin_with',
        locale
    });
}

export interface LoginFormDisplaySize {
    displayWidth: number;
    displayHeight: number;
}

export function createLoginForm(
    scene: Phaser.Scene,
    displaySize: LoginFormDisplaySize,
    callbacks: LoginFormCallbacks
): LoginFormResult {
    const container = document.getElementById('game-container');
    let resizeObserver: ResizeObserver | undefined;

    function removeForm(): void {
        resizeObserver?.disconnect();
        resizeObserver = undefined;
        const wrapper = document.getElementById('login-form-overlay-wrapper');
        if (wrapper) wrapper.remove();
    }

    function refreshGoogleButton(): void {
        const form = document.getElementById('login-form-overlay');
        const googleContainer = form?.querySelector('#google-signin-container') as HTMLElement | null;
        const clientId = ApiConfig.googleClientId;
        if (!googleContainer || !clientId || !window.google?.accounts?.id) return;
        googleContainer.innerHTML = '';
        initGoogleButton(googleContainer, clientId, callbacks.onGoogleCredential, GOOGLE_BUTTON_SCALE);
    }

    if (!container) return { removeForm, refreshGoogleButton };

    const GAME_WIDTH = 720;
    const GAME_HEIGHT = 1280;
    const SCALE_MIN = 0.28;
    /** Một biến duy nhất điều khiển kích thước nút Google (1 = 100%, 1.5 = to hơn 50%) */
    const GOOGLE_BUTTON_SCALE = 1;

    const primary = themeManager.getPrimary();
    const secondary = themeManager.getSecondary();
    const surface = themeManager.getSurface();
    const text = themeManager.getText();
    const accent = themeManager.getAccent();

    const wrapper = document.createElement('div');
    wrapper.id = 'login-form-overlay-wrapper';

    const updateFormSize = () => {
        const canvas = container.querySelector('canvas') as HTMLCanvasElement | null;
        const cw = container.clientWidth || 0;
        const ch = container.clientHeight || 0;
        const displayW = canvas ? canvas.clientWidth : cw;
        const displayH = canvas ? canvas.clientHeight : ch;
        const rawScale = Math.min(displayW / GAME_WIDTH, displayH / GAME_HEIGHT) || 1;
        const displayScale = rawScale * 1.5;
        wrapper.style.transform = `translate(-50%, 0) scale(${displayScale})`;
        if (canvas) {
            const rect = canvas.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            const canvasLeft = rect.left - containerRect.left + container.scrollLeft;
            const canvasTop = rect.top - containerRect.top + container.scrollTop;
            wrapper.style.left = canvasLeft + canvas.clientWidth / 2 + 'px';
            wrapper.style.top = canvasTop + canvas.clientHeight * 0.24 + 'px';
            wrapper.style.right = '';
        } else {
            wrapper.style.left = '50%';
            wrapper.style.top = '24%';
            wrapper.style.right = '';
        }
    };

    wrapper.style.cssText = `
      position: absolute;
      left: 50%;
      top: 24%;
      transform-origin: center top;
      z-index: 1000;
    `;

    const form = document.createElement('div');
    form.id = 'login-form-overlay';
    form.style.cssText = `
      width: 420px;
      box-sizing: border-box;
      background: ${surface}ee;
      border: 2px solid ${primary};
      border-radius: 8px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    `;

    const emailLabel = document.createElement('label');
    emailLabel.textContent = localizationManager.t('email');
    emailLabel.style.cssText = `color: ${text}; font-size: 14px;`;
    form.appendChild(emailLabel);

    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.placeholder = 'user@example.com';
    emailInput.style.cssText = `padding: 8px; font-size: 14px; border: 1px solid ${secondary}; border-radius: 4px; background: ${surface}; color: ${text}; box-sizing: border-box;`;
    form.appendChild(emailInput);

    const passLabel = document.createElement('label');
    passLabel.textContent = localizationManager.t('password');
    passLabel.style.cssText = `color: ${text}; font-size: 14px;`;
    form.appendChild(passLabel);

    const passInput = document.createElement('input');
    passInput.type = 'password';
    passInput.placeholder = '••••••••';
    passInput.style.cssText = `padding: 8px; font-size: 14px; border: 1px solid ${secondary}; border-radius: 4px; background: ${surface}; color: ${text}; box-sizing: border-box;`;
    form.appendChild(passInput);

    const loginBtn = document.createElement('button');
    loginBtn.textContent = localizationManager.t('login');
    loginBtn.style.cssText = `padding: 10px; font-size: 16px; background: ${primary}; color: ${text}; border: 1px solid ${secondary}; border-radius: 4px; cursor: pointer; margin-top: 2px; box-sizing: border-box; transition: background 0.2s, border-color 0.2s;`;
    loginBtn.onmouseover = () => { loginBtn.style.background = secondary; loginBtn.style.borderColor = text; };
    loginBtn.onmouseout = () => { loginBtn.style.background = primary; loginBtn.style.borderColor = secondary; };
    loginBtn.onclick = () => callbacks.onLogin(emailInput.value, passInput.value);
    form.appendChild(loginBtn);

    const divider = document.createElement('div');
    divider.style.cssText = 'display: flex; align-items: center; gap: 8px; margin: 6px 0;';
    divider.innerHTML = `<span style="flex:1;height:1px;background:${secondary};"></span><span style="color:${themeManager.getNeutral()};font-size:12px;">${localizationManager.t('or')}</span><span style="flex:1;height:1px;background:${secondary};"></span>`;
    form.appendChild(divider);

    const googleContainer = document.createElement('div');
    googleContainer.id = 'google-signin-container';
    googleContainer.style.cssText = 'min-height: 44px; display: flex; align-items: center; justify-content: center;';
    form.appendChild(googleContainer);
    loadAndInitGoogleSignIn(googleContainer, callbacks.onGoogleCredential, GOOGLE_BUTTON_SCALE);

    const registerLink = document.createElement('a');
    registerLink.textContent = localizationManager.t('register_link');
    registerLink.href = '#';
    registerLink.style.cssText = `color: ${accent}; font-size: 12px; text-align: center; cursor: pointer; transition: color 0.2s, text-decoration 0.2s;`;
    registerLink.onmouseover = () => { registerLink.style.color = text; registerLink.style.textDecoration = 'underline'; };
    registerLink.onmouseout = () => { registerLink.style.color = accent; registerLink.style.textDecoration = 'none'; };
    registerLink.onclick = (e) => { e.preventDefault(); callbacks.onRegister(); };
    form.appendChild(registerLink);

    wrapper.appendChild(form);
    container.style.position = 'relative';
    container.appendChild(wrapper);
    updateFormSize();

    resizeObserver = new ResizeObserver(updateFormSize);
    resizeObserver.observe(container);

    return { removeForm, refreshGoogleButton };
}
