import Phaser from 'phaser';
import { themeManager } from '../../core/ThemeManager.js';
import { localizationManager } from '../../core/LocalizationManager.js';

export interface RegisterFormCallbacks {
    onRegister: (email: string, password: string, confirm: string) => void;
    onLogin: () => void;
}

export interface RegisterFormResult {
    removeForm: () => void;
}

export interface RegisterFormDisplaySize {
    displayWidth: number;
    displayHeight: number;
}

export function createRegisterForm(
    scene: Phaser.Scene,
    displaySize: RegisterFormDisplaySize,
    callbacks: RegisterFormCallbacks
): RegisterFormResult {
    const container = document.getElementById('game-container');
    let resizeObserver: ResizeObserver | undefined;

    function removeForm(): void {
        resizeObserver?.disconnect();
        resizeObserver = undefined;
        const wrapper = document.getElementById('register-form-overlay-wrapper');
        if (wrapper) wrapper.remove();
    }

    if (!container) return { removeForm };

    const GAME_WIDTH = 720;
    const GAME_HEIGHT = 1280;

    const primary = themeManager.getPrimary();
    const secondary = themeManager.getSecondary();
    const surface = themeManager.getSurface();
    const text = themeManager.getText();
    const accent = themeManager.getAccent();

    const wrapper = document.createElement('div');
    wrapper.id = 'register-form-overlay-wrapper';

    const updateFormSize = () => {
        const canvas = container.querySelector('canvas') as HTMLCanvasElement | null;
        const cw = container.clientWidth || 0;
        const ch = container.clientHeight || 0;
        const displayW = canvas ? canvas.clientWidth : cw;
        const displayH = canvas ? canvas.clientHeight : ch;
        const rawScale = Math.min(displayW / GAME_WIDTH, displayH / GAME_HEIGHT) || 1;
        const displayScale = rawScale*1.5;
        wrapper.style.transform = `translate(-50%, 0) scale(${displayScale})`;
        if (canvas) {
            const rect = canvas.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            const canvasLeft = rect.left - containerRect.left + container.scrollLeft;
            const canvasTop = rect.top - containerRect.top + container.scrollTop;
            wrapper.style.left = canvasLeft + canvas.clientWidth / 2 + 'px';
            wrapper.style.top = canvasTop + canvas.clientHeight * 0.2 + 'px';
            wrapper.style.right = '';
        } else {
            wrapper.style.left = '50%';
            wrapper.style.top = '20%';
            wrapper.style.right = '';
        }
    };

    wrapper.style.cssText = `
      position: absolute;
      left: 50%;
      top: 20%;
      transform-origin: center top;
      z-index: 1000;
      pointer-events: auto;
    `;

    const form = document.createElement('div');
    form.id = 'register-form-overlay';
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

    const confirmLabel = document.createElement('label');
    confirmLabel.textContent = localizationManager.t('password_confirm');
    confirmLabel.style.cssText = `color: ${text}; font-size: 14px;`;
    form.appendChild(confirmLabel);

    const confirmInput = document.createElement('input');
    confirmInput.type = 'password';
    confirmInput.placeholder = '••••••••';
    confirmInput.style.cssText = `padding: 8px; font-size: 14px; border: 1px solid ${secondary}; border-radius: 4px; background: ${surface}; color: ${text}; box-sizing: border-box;`;
    form.appendChild(confirmInput);

    const registerBtn = document.createElement('button');
    registerBtn.type = 'button';
    registerBtn.textContent = localizationManager.t('register');
    registerBtn.style.cssText = `padding: 10px; font-size: 16px; background: ${primary}; color: ${text}; border: 1px solid ${secondary}; border-radius: 4px; cursor: pointer; margin-top: 2px; box-sizing: border-box; transition: background 0.2s, border-color 0.2s;`;
    registerBtn.onmouseover = () => { registerBtn.style.background = secondary; registerBtn.style.borderColor = text; };
    registerBtn.onmouseout = () => { registerBtn.style.background = primary; registerBtn.style.borderColor = secondary; };
    registerBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      callbacks.onRegister(emailInput.value, passInput.value, confirmInput.value);
    };
    form.appendChild(registerBtn);

    const loginLink = document.createElement('a');
    loginLink.textContent = localizationManager.t('login_link');
    loginLink.href = '#';
    loginLink.style.cssText = `color: ${accent}; font-size: 12px; text-align: center; cursor: pointer; transition: color 0.2s, text-decoration 0.2s;`;
    loginLink.onmouseover = () => { loginLink.style.color = text; loginLink.style.textDecoration = 'underline'; };
    loginLink.onmouseout = () => { loginLink.style.color = accent; loginLink.style.textDecoration = 'none'; };
    loginLink.onclick = (e) => { e.preventDefault(); callbacks.onLogin(); };
    form.appendChild(loginLink);

    wrapper.appendChild(form);
    container.style.position = 'relative';
    container.appendChild(wrapper);
    updateFormSize();

    resizeObserver = new ResizeObserver(updateFormSize);
    resizeObserver.observe(container);

    return { removeForm };
}
