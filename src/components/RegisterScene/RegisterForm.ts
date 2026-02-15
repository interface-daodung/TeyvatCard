import { themeManager } from '../../core/ThemeManager.js';
import { localizationManager } from '../../utils/LocalizationManager.js';

export interface RegisterFormCallbacks {
    onRegister: (email: string, password: string, confirm: string) => void;
    onLogin: () => void;
}

export interface RegisterFormResult {
    removeForm: () => void;
}

export function createRegisterForm(
    _scene: unknown,
    width: number,
    _height: number,
    callbacks: RegisterFormCallbacks
): RegisterFormResult {
    const container = document.getElementById('game-container');
    let resizeObserver: ResizeObserver | undefined;

    function removeForm(): void {
        resizeObserver?.disconnect();
        resizeObserver = undefined;
        const form = document.getElementById('register-form-overlay');
        if (form) form.remove();
    }

    if (!container) return { removeForm };

    const primary = themeManager.getPrimary();
    const secondary = themeManager.getSecondary();
    const surface = themeManager.getSurface();
    const text = themeManager.getText();
    const accent = themeManager.getAccent();

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
      background: ${surface}ee;
      border: 2px solid ${primary};
      border-radius: 6px;
      padding: clamp(6px, 1.4vw, 10px);
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: clamp(4px, 1vw, 5px);
    `;

    const emailLabel = document.createElement('label');
    emailLabel.textContent = localizationManager.t('email');
    emailLabel.style.cssText = `color: ${text}; font-size: clamp(10px, 1.8vw, 12px);`;
    form.appendChild(emailLabel);

    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.placeholder = 'user@example.com';
    emailInput.style.cssText = `padding: clamp(4px, 1vw, 6px); font-size: clamp(10px, 1.8vw, 12px); border: 1px solid ${secondary}; border-radius: 4px; background: ${surface}; color: ${text}; box-sizing: border-box;`;
    form.appendChild(emailInput);

    const passLabel = document.createElement('label');
    passLabel.textContent = localizationManager.t('password');
    passLabel.style.cssText = `color: ${text}; font-size: clamp(10px, 1.8vw, 12px);`;
    form.appendChild(passLabel);

    const passInput = document.createElement('input');
    passInput.type = 'password';
    passInput.placeholder = '••••••••';
    passInput.style.cssText = `padding: clamp(4px, 1vw, 6px); font-size: clamp(10px, 1.8vw, 12px); border: 1px solid ${secondary}; border-radius: 4px; background: ${surface}; color: ${text}; box-sizing: border-box;`;
    form.appendChild(passInput);

    const confirmLabel = document.createElement('label');
    confirmLabel.textContent = localizationManager.t('password_confirm');
    confirmLabel.style.cssText = `color: ${text}; font-size: clamp(10px, 1.8vw, 12px);`;
    form.appendChild(confirmLabel);

    const confirmInput = document.createElement('input');
    confirmInput.type = 'password';
    confirmInput.placeholder = '••••••••';
    confirmInput.style.cssText = `padding: clamp(4px, 1vw, 6px); font-size: clamp(10px, 1.8vw, 12px); border: 1px solid ${secondary}; border-radius: 4px; background: ${surface}; color: ${text}; box-sizing: border-box;`;
    form.appendChild(confirmInput);

    const registerBtn = document.createElement('button');
    registerBtn.textContent = localizationManager.t('register');
    registerBtn.style.cssText = `padding: clamp(6px, 1.2vw, 8px); font-size: clamp(12px, 2vw, 14px); background: ${primary}; color: ${text}; border: 1px solid ${secondary}; border-radius: 4px; cursor: pointer; margin-top: 2px; box-sizing: border-box; transition: background 0.2s, border-color 0.2s;`;
    registerBtn.onmouseover = () => { registerBtn.style.background = secondary; registerBtn.style.borderColor = text; };
    registerBtn.onmouseout = () => { registerBtn.style.background = primary; registerBtn.style.borderColor = secondary; };
    registerBtn.onclick = () => callbacks.onRegister(emailInput.value, passInput.value, confirmInput.value);
    form.appendChild(registerBtn);

    const loginLink = document.createElement('a');
    loginLink.textContent = localizationManager.t('login_link');
    loginLink.href = '#';
    loginLink.style.cssText = `color: ${accent}; font-size: clamp(9px, 1.6vw, 11px); text-align: center; cursor: pointer; transition: color 0.2s, text-decoration 0.2s;`;
    loginLink.onmouseover = () => { loginLink.style.color = text; loginLink.style.textDecoration = 'underline'; };
    loginLink.onmouseout = () => { loginLink.style.color = accent; loginLink.style.textDecoration = 'none'; };
    loginLink.onclick = (e) => { e.preventDefault(); callbacks.onLogin(); };
    form.appendChild(loginLink);

    container.style.position = 'relative';
    container.appendChild(form);
    updateFormWidth();

    resizeObserver = new ResizeObserver(updateFormWidth);
    resizeObserver.observe(container);

    return { removeForm };
}
