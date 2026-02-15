import Phaser from 'phaser';
import { GradientText } from '../utils/GradientText.js';
import { localizationManager } from '../core/LocalizationManager.js';
import { I18nText } from '../components/shared/index.js';
import { AuthManager } from '../utils/AuthManager.js';
import { ApiConfig } from '../utils/ApiConfig.js';
import { themeManager } from '../core/ThemeManager.js';
import { dataManager } from '../core/DataManager.js';
import { createPackageButton, showToast, type PackageDef } from '../components/PaymentScene/index.js';

const STARTER_PACK_KEY = 'starterPackPurchased';

const PACKAGES: PackageDef[] = [
    { priceKey: 'package_starter', coinsKey: 'package_starter_desc', priceVnd: 2000, coins: 20000, isStarter: true },
    { priceKey: 'package_small', coinsKey: 'package_small_coins', priceVnd: 10000, coins: 10000 },
    { priceKey: 'package_medium', coinsKey: 'package_medium_coins', priceVnd: 20000, coins: 25000 },
    { priceKey: 'package_large', coinsKey: 'package_large_coins', priceVnd: 50000, coins: 75000 }
];

export default class PaymentScene extends Phaser.Scene {
    private fromScene = 'MenuScene';
    private pollTimer?: number;
    private messageHandler?: (e: MessageEvent) => void;

    constructor() {
        super({ key: 'PaymentScene' });
    }

    create(): void {
        if (!AuthManager.hasJWT()) {
            this.scene.start('LoginScene', {
                fromScene: (this.scene.settings.data as { fromScene?: string })?.fromScene || 'MenuScene',
                returnTo: 'PaymentScene'
            });
            return;
        }
        const { width, height } = this.scale;
        this.fromScene = (this.scene.settings.data as { fromScene?: string })?.fromScene || 'MenuScene';

        this.add.image(width / 2, height / 2, 'background');
        this.add.rectangle(width / 2, height / 2, width, height, themeManager.getBackgroundPhaser()).setAlpha(0.5);
        GradientText.createGameTitle(this, localizationManager.t('payment'), width / 2, height * 0.12);

        const buttonWidth = width * 0.75;
        const buttonHeight = height * 0.09;
        const spacing = 16;
        const startY = height * 0.28;
        const starterPurchased = dataManager.get<string>(STARTER_PACK_KEY) === '1';

        PACKAGES.forEach((pkg, i) => {
            createPackageButton(
                this,
                width / 2,
                startY + i * (buttonHeight + spacing),
                buttonWidth,
                buttonHeight,
                pkg,
                (p) => this.purchasePackage(p),
                starterPurchased
            );
        });

        const backButton = I18nText.create(this, width / 2, height * 0.88, 'back', {
            fontSize: '36px',
            color: themeManager.getText(),
            fontFamily: 'Arial',
            stroke: themeManager.getBackground(),
            strokeThickness: 2
        }).setOrigin(0.5);
        backButton.setInteractive({ useHandCursor: true });
        backButton.on('pointerdown', () => this.scene.start(this.fromScene));
        backButton.on('pointerover', () => backButton.setStyle({ color: themeManager.getAccent() }));
        backButton.on('pointerout', () => backButton.setStyle({ color: themeManager.getText() }));
    }

    shutdown(): void {
        this.stopPolling();
        this.removeMessageListener();
    }

    private stopPolling(): void {
        if (this.pollTimer !== undefined) {
            clearTimeout(this.pollTimer);
            this.pollTimer = undefined;
        }
    }

    private removeMessageListener(): void {
        if (this.messageHandler) {
            window.removeEventListener('message', this.messageHandler);
            this.messageHandler = undefined;
        }
    }

    private async purchasePackage(pkg: PackageDef): Promise<void> {
        const jwt = AuthManager.getJWT();
        if (!jwt) {
            showToast(this, localizationManager.t('login') || 'Vui lòng đăng nhập');
            return;
        }
        try {
            const res = await fetch(ApiConfig.payosCreateLink, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
                body: JSON.stringify({ amount: pkg.priceVnd, coins: pkg.coins })
            });
            const data = await res.json();
            if (data.error !== 0 || !data.data?.checkoutUrl) {
                showToast(this, data.message || 'Tạo link thất bại');
                return;
            }
            const { checkoutUrl, orderCode, coins } = data.data;
            window.open(checkoutUrl, '_blank');
            this.startWaitingForPayment(orderCode, coins, pkg);
        } catch {
            showToast(this, 'Lỗi kết nối. Kiểm tra server.');
        }
    }

    private startWaitingForPayment(orderCode: number, coins: number, pkg: PackageDef): void {
        this.stopPolling();
        this.removeMessageListener();
        const onPaymentSuccess = () => {
            this.stopPolling();
            this.removeMessageListener();
            if (pkg.isStarter) dataManager.set(STARTER_PACK_KEY, '1');
            const current = dataManager.get<number>('totalCoin') ?? 0;
            dataManager.set('totalCoin', current + coins);
            showToast(this, `${localizationManager.t('payment') || 'Thanh toán'} thành công! +${coins} xu`);
            this.scene.restart({ fromScene: this.fromScene });
        };
        this.messageHandler = (e: MessageEvent) => {
            if (e.data?.type === 'payos_return' && e.data?.orderCode === orderCode && !e.data?.cancel) {
                onPaymentSuccess();
            }
        };
        window.addEventListener('message', this.messageHandler);
        const poll = async () => {
            const jwt = AuthManager.getJWT();
            if (!jwt) return;
            try {
                const r = await fetch(ApiConfig.getPayOrderUrl(orderCode), {
                    headers: { 'Authorization': `Bearer ${jwt}` }
                });
                const d = await r.json();
                if (d.error === 0 && d.data?.status === 'PAID') {
                    onPaymentSuccess();
                    return;
                }
            } catch {
                // ignore
            }
            this.pollTimer = window.setTimeout(poll, 3000) as unknown as number;
        };
        poll();
    }
}
