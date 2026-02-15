import Phaser from 'phaser';
import { GradientText } from '../utils/GradientText.js';
import { localizationManager } from '../utils/LocalizationManager.js';
import { AuthManager } from '../utils/AuthManager.js';
import { ApiConfig } from '../utils/ApiConfig.js';
import { themeManager } from '../core/ThemeManager.js';
import { dataManager } from '../core/DataManager.js';

const STARTER_PACK_KEY = 'starterPackPurchased';

interface PackageDef {
  priceKey: string;
  coinsKey: string;
  priceVnd: number;
  coins: number;
  isStarter?: boolean;
}

export default class PaymentScene extends Phaser.Scene {
  private backButton?: Phaser.GameObjects.Text;
  private packageButtons: Phaser.GameObjects.Container[] = [];
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

    // Background
    this.add.image(width / 2, height / 2, 'background');
    this.add.rectangle(width / 2, height / 2, width, height, themeManager.getBackgroundPhaser()).setAlpha(0.5);

    // Title
    GradientText.createGameTitle(
      this,
      localizationManager.t('payment'),
      width / 2,
      height * 0.12
    );

    const packages: PackageDef[] = [
      {
        priceKey: 'package_starter',
        coinsKey: 'package_starter_desc',
        priceVnd: 2000,
        coins: 20000,
        isStarter: true
      },
      {
        priceKey: 'package_small',
        coinsKey: 'package_small_coins',
        priceVnd: 10000,
        coins: 10000
      },
      {
        priceKey: 'package_medium',
        coinsKey: 'package_medium_coins',
        priceVnd: 20000,
        coins: 25000
      },
      {
        priceKey: 'package_large',
        coinsKey: 'package_large_coins',
        priceVnd: 50000,
        coins: 75000
      }
    ];

    const buttonWidth = width * 0.75;
    const buttonHeight = height * 0.09;
    const spacing = 16;
    const startY = height * 0.28;

    packages.forEach((pkg, i) => {
      const btn = this.createPackageButton(
        width / 2,
        startY + i * (buttonHeight + spacing),
        buttonWidth,
        buttonHeight,
        pkg
      );
      this.packageButtons.push(btn);
    });

    // Nút Quay lại
    this.backButton = this.add.text(width / 2, height * 0.88, localizationManager.t('back'), {
      fontSize: '36px',
      color: themeManager.getText(),
      fontFamily: 'Arial',
      stroke: themeManager.getBackground(),
      strokeThickness: 2
    }).setOrigin(0.5);

    this.backButton.setInteractive({ useHandCursor: true });
    this.backButton.on('pointerdown', () => {
      this.scene.start(this.fromScene);
    });
    this.backButton.on('pointerover', () => this.backButton!.setStyle({ color: themeManager.getAccent() }));
    this.backButton.on('pointerout', () => this.backButton!.setStyle({ color: themeManager.getText() }));
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

  private createPackageButton(
    x: number,
    y: number,
    w: number,
    h: number,
    pkg: PackageDef
  ): Phaser.GameObjects.Container {
    const isStarter = pkg.isStarter === true;
    const starterPurchased = dataManager.get<string>(STARTER_PACK_KEY) === '1';
    const isDisabled = isStarter && starterPurchased;

    const fillColor = themeManager.getPrimaryPhaser(); // Tất cả nút dùng Primary
    const strokeColor = isDisabled ? themeManager.getNeutralPhaser() : (isStarter ? themeManager.getTextPhaser() : themeManager.getSecondaryPhaser());

    const rect = this.add.rectangle(x, y, w, h, fillColor);
    rect.setStrokeStyle(3, strokeColor);
    if (!isDisabled) rect.setInteractive({ useHandCursor: true });

    const titleText = isStarter
      ? localizationManager.t('package_starter')
      : localizationManager.t(pkg.priceKey);
    const descText = isStarter
      ? localizationManager.t('package_starter_desc')
      : localizationManager.t(pkg.coinsKey);

    const title = this.add.text(x, y - 12, titleText, {
      fontSize: '26px',
      color: isDisabled ? themeManager.getNeutral() : themeManager.getText(),
      fontFamily: 'Arial',
      stroke: themeManager.getBackground(),
      strokeThickness: 2
    }).setOrigin(0.5);

    const desc = this.add.text(x, y + 12, descText, {
      fontSize: '20px',
      color: isDisabled ? themeManager.getNeutral() : themeManager.getText(),
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    if (isDisabled) {
      const soldOut = this.add.text(x, y + 12, localizationManager.t('package_sold_out'), {
        fontSize: '20px',
        color: themeManager.getAccent(),
        fontFamily: 'Arial',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      return this.add.container(0, 0, [rect, title, soldOut]);
    }

    rect.on('pointerover', () => {
      rect.setFillStyle(isStarter ? themeManager.getSecondaryPhaser() : themeManager.getPrimaryPhaser());
      rect.setStrokeStyle(3, themeManager.getTextPhaser());
    });
    rect.on('pointerout', () => {
      rect.setFillStyle(fillColor);
      rect.setStrokeStyle(3, strokeColor);
    });
    rect.on('pointerdown', () => {
      this.purchasePackage(pkg);
    });

    return this.add.container(0, 0, [rect, title, desc]);
  }

  private async purchasePackage(pkg: PackageDef): Promise<void> {
    const jwt = AuthManager.getJWT();
    if (!jwt) {
      this.showToast(localizationManager.t('login') || 'Vui lòng đăng nhập');
      return;
    }

    try {
      const res = await fetch(ApiConfig.payosCreateLink, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`,
        },
        body: JSON.stringify({ amount: pkg.priceVnd, coins: pkg.coins }),
      });

      const data = await res.json();
      if (data.error !== 0 || !data.data?.checkoutUrl) {
        const msg = data.message || 'Tạo link thất bại';
        this.showToast(msg);
        return;
      }

      const { checkoutUrl, orderCode, coins } = data.data;
      window.open(checkoutUrl, '_blank');

      this.startWaitingForPayment(orderCode, coins, pkg);
    } catch (err) {
      this.showToast('Lỗi kết nối. Kiểm tra server.');
    }
  }

  private startWaitingForPayment(orderCode: number, coins: number, pkg: PackageDef): void {
    this.stopPolling();
    this.removeMessageListener();

    const onPaymentSuccess = () => {
      this.stopPolling();
      this.removeMessageListener();
      if (pkg.isStarter) {
        dataManager.set(STARTER_PACK_KEY, '1');
      }
      const current = dataManager.get<number>('totalCoin') ?? 0;
      const newTotal = current + coins;
      dataManager.set('totalCoin', newTotal);
      this.showToast(`${localizationManager.t('payment') || 'Thanh toán'} thành công! +${coins} xu`);
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
          headers: { 'Authorization': `Bearer ${jwt}` },
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

  private showToast(msg: string): void {
    const { width, height } = this.scale;
    const t = this.add.text(width / 2, height * 0.5, msg, {
      fontSize: '22px',
      color: themeManager.getText(),
      backgroundColor: themeManager.getBackground(),
    }).setOrigin(0.5).setScrollFactor(0).setPadding(16, 8);

    this.time.delayedCall(2500, () => t.destroy());
  }
}
