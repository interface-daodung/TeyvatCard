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

function loadAndInitGoogleSignIn(container: HTMLElement, onCredential: (credential: string) => void): void {
    const clientId = ApiConfig.googleClientId;
    if (!clientId) {
        container.innerHTML = `<span style="color:${themeManager.getNeutral()};font-size:11px;">Google login chưa cấu hình (VITE_GOOGLE_CLIENT_ID)</span>`;
        return;
    }
    if (window.google?.accounts?.id) {
        initGoogleButton(container, clientId, onCredential);
        return;
    }
    const locale = localizationManager.currentLanguage;
    const script = document.createElement('script');
    script.src = `https://accounts.google.com/gsi/client?hl=${locale}`;
    script.async = true;
    script.defer = true;
    script.onload = () => initGoogleButton(container, clientId, onCredential);
    script.onerror = () => {
        container.innerHTML = `<span style="color:${themeManager.getError()};font-size:11px;">Không tải được Google Sign-In</span>`;
    };
    document.head.appendChild(script);
}

function initGoogleButton(container: HTMLElement, clientId: string, onCredential: (credential: string) => void): void {
    window.google?.accounts?.id?.initialize({
        client_id: clientId,
        callback: (response: { credential?: string }) => {
            if (response?.credential) onCredential(response.credential);
        }
    });
    const btnWidth = Math.min(container.offsetWidth || 320, 400);
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

export function createLoginForm(
    _scene: unknown,
    width: number,
    _height: number,
    callbacks: LoginFormCallbacks
): LoginFormResult {
    const container = document.getElementById('game-container');
    let resizeObserver: ResizeObserver | undefined;

    function removeForm(): void {
        resizeObserver?.disconnect();
        resizeObserver = undefined;
        const form = document.getElementById('login-form-overlay');
        if (form) form.remove();
    }

    function refreshGoogleButton(): void {
        const form = document.getElementById('login-form-overlay');
        const googleContainer = form?.querySelector('#google-signin-container') as HTMLElement | null;
        const clientId = ApiConfig.googleClientId;
        if (!googleContainer || !clientId || !window.google?.accounts?.id) return;
        googleContainer.innerHTML = '';
        initGoogleButton(googleContainer, clientId, callbacks.onGoogleCredential);
    }

    if (!container) return { removeForm, refreshGoogleButton };

    const primary = themeManager.getPrimary();
    const secondary = themeManager.getSecondary();
    const surface = themeManager.getSurface();
    const text = themeManager.getText();
    const accent = themeManager.getAccent();

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

    const loginBtn = document.createElement('button');
    loginBtn.textContent = localizationManager.t('login');
    loginBtn.style.cssText = `padding: clamp(6px, 1.2vw, 8px); font-size: clamp(12px, 2vw, 14px); background: ${primary}; color: ${text}; border: 1px solid ${secondary}; border-radius: 4px; cursor: pointer; margin-top: 2px; box-sizing: border-box; transition: background 0.2s, border-color 0.2s;`;
    loginBtn.onmouseover = () => { loginBtn.style.background = secondary; loginBtn.style.borderColor = text; };
    loginBtn.onmouseout = () => { loginBtn.style.background = primary; loginBtn.style.borderColor = secondary; };
    loginBtn.onclick = () => callbacks.onLogin(emailInput.value, passInput.value);
    form.appendChild(loginBtn);

    const divider = document.createElement('div');
    divider.style.cssText = 'display: flex; align-items: center; gap: 8px; margin: 4px 0;';
    divider.innerHTML = `<span style="flex:1;height:1px;background:${secondary};"></span><span style="color:${themeManager.getNeutral()};font-size:11px;">${localizationManager.t('or')}</span><span style="flex:1;height:1px;background:${secondary};"></span>`;
    form.appendChild(divider);

    const googleContainer = document.createElement('div');
    googleContainer.id = 'google-signin-container';
    googleContainer.style.cssText = 'min-height: 40px; display: flex; align-items: center; justify-content: center;';
    form.appendChild(googleContainer);
    loadAndInitGoogleSignIn(googleContainer, callbacks.onGoogleCredential);

    const registerLink = document.createElement('a');
    registerLink.textContent = localizationManager.t('register_link');
    registerLink.href = '#';
    registerLink.style.cssText = `color: ${accent}; font-size: clamp(9px, 1.6vw, 11px); text-align: center; cursor: pointer; transition: color 0.2s, text-decoration 0.2s;`;
    registerLink.onmouseover = () => { registerLink.style.color = text; registerLink.style.textDecoration = 'underline'; };
    registerLink.onmouseout = () => { registerLink.style.color = accent; registerLink.style.textDecoration = 'none'; };
    registerLink.onclick = (e) => { e.preventDefault(); callbacks.onRegister(); };
    form.appendChild(registerLink);

    container.style.position = 'relative';
    container.appendChild(form);
    updateFormWidth();

    resizeObserver = new ResizeObserver(updateFormWidth);
    resizeObserver.observe(container);

    return { removeForm, refreshGoogleButton };
}
