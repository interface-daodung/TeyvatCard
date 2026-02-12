import Phaser from 'phaser';
import { GradientText } from '../utils/GradientText.js';
import { localizationManager, type GameLanguageCode } from '../utils/LocalizationManager.js';

/** Nút: Rectangle + Text, có setActiveState */
type LangButton = Phaser.GameObjects.Container & {
  rect?: Phaser.GameObjects.Rectangle;
  text?: Phaser.GameObjects.Text;
  setActiveState?: (active: boolean) => void;
  lang?: string;
};

export default class SettingsScene extends Phaser.Scene {
  private titleImage?: Phaser.GameObjects.Image;
  private backButton?: Phaser.GameObjects.Text;
  private languageButton?: Phaser.GameObjects.Container;
  private langPopupTitle?: Phaser.GameObjects.Text;
  private mainUIContainer?: Phaser.GameObjects.Container;
  private langPopupContainer?: Phaser.GameObjects.Container;
  private langButtons: LangButton[] = [];
  private boundOnLanguageChanged!: () => void;

  constructor() {
    super({ key: 'SettingsScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    this.boundOnLanguageChanged = this.onLanguageChanged.bind(this);

    // Background
    this.add.image(width / 2, height / 2, 'background');
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000).setAlpha(0.5);

    // Main UI container (title, language button, back button) - depth cao để luôn trên popup
    this.mainUIContainer = this.add.container(0, 0);
    this.mainUIContainer.setDepth(100);
    this.createTitle(width, height);
    this.createLanguageButton(width, height);
    this.createBackButton(width, height);

    // Popup chọn ngôn ngữ (ẩn ban đầu) - depth thấp hơn title và back button
    this.createLanguagePopup(width, height);

    const win = window as any;
    if (win.gameEvents?.on) {
      win.gameEvents.on('languageChanged', this.boundOnLanguageChanged);
    }
  }

  createTitle(width: number, height: number): void {
    this.titleImage = GradientText.createGameTitle(this, localizationManager.t('settings'), width / 2, height * 0.18);
    this.mainUIContainer!.add(this.titleImage);
  }

  /** Nút Language - bấm vào mở popup chọn ngôn ngữ */
  createLanguageButton(width: number, height: number): void {
    const buttonWidth = width * 0.6;
    const buttonHeight = height * 0.08;
    const buttonY = height * 0.45;

    const rect = this.add.rectangle(width / 2, buttonY, buttonWidth, buttonHeight, 0x622945);
    rect.setStrokeStyle(3, 0x96576a);
    rect.setInteractive({ useHandCursor: true });

    const text = this.add.text(width / 2, buttonY, localizationManager.t('language'), {
      fontSize: '32px',
      color: '#ffffff',
      fontFamily: 'Arial',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    rect.on('pointerover', () => {
      rect.setFillStyle(0x95245b);
      rect.setStrokeStyle(3, 0xffffff);
    });
    rect.on('pointerout', () => {
      rect.setFillStyle(0x622945);
      rect.setStrokeStyle(3, 0x96576a);
    });
    rect.on('pointerdown', () => {
      this.showLanguagePopup();
    });

    this.languageButton = this.add.container(0, 0, [rect, text]);
    this.mainUIContainer!.add(this.languageButton);
  }

  /** Tạo popup chọn ngôn ngữ - chiếm gần hết màn hình */
  createLanguagePopup(width: number, height: number): void {
    this.langPopupContainer = this.add.container(width / 2, height / 2);
    this.langPopupContainer.setDepth(50);

    // Overlay trong suốt nhẹ - vẫn thấy background
    const overlay = this.add.rectangle(0, 0, width + 100, height + 100, 0x000000, 0.25);
    overlay.setInteractive({ useHandCursor: false });

    // Panel chính - bo góc như LibraryScene, trong suốt để thấy background
    const panelWidth = width * 0.85;
    const panelHeight = height * 0.75;
    const radius = Math.min(panelWidth, panelHeight) * 0.04; // Bo góc scale theo kích thước
    const panel = this.add.graphics();
    panel.fillStyle(0x1a1a2e, 0.7);
    panel.lineStyle(3, 0x95245b);
    panel.fillRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, radius);
    panel.strokeRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, radius);

    // Tiêu đề popup
    this.langPopupTitle = this.add.text(0, -panelHeight / 2 + 120, localizationManager.t('language'), {
      fontSize: '36px',
      color: '#cbbd1b',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#1f0612',
      strokeThickness: 2
    }).setOrigin(0.5);

    // Nút đóng (X)
    const closeBtn = this.add.text(panelWidth / 2 - 35, -panelHeight / 2 + 30, '✕', {
      fontSize: '32px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.hideLanguagePopup());
    closeBtn.on('pointerover', () => closeBtn.setStyle({ color: '#ff6b6b' }));
    closeBtn.on('pointerout', () => closeBtn.setStyle({ color: '#ffffff' }));

    // Container cho các nút ngôn ngữ
    const langButtonsContainer = this.add.container(0, 0);
    this.createLanguageButtonsInContainer(langButtonsContainer, width, height);

    this.langPopupContainer.add([overlay, panel, this.langPopupTitle, closeBtn, langButtonsContainer]);
    this.langPopupContainer.setVisible(false);

    // Click overlay để đóng (không đóng khi click panel)
    overlay.on('pointerdown', () => this.hideLanguagePopup());
  }

  showLanguagePopup(): void {
    this.languageButton?.setVisible(false);
    this.langPopupContainer?.setVisible(true);
  }

  hideLanguagePopup(): void {
    this.languageButton?.setVisible(true);
    this.langPopupContainer?.setVisible(false);
  }

  /** Tạo các nút ngôn ngữ trong container (dùng cho popup) */
  createLanguageButtonsInContainer(parentContainer: Phaser.GameObjects.Container, width: number, height: number): void {
    const buttonWidth = width * 0.65;
    const buttonHeight = height * 0.08;
    const buttonSpacing = 20;

    const languages = localizationManager.getAvailableLanguages();
    const n = languages.length;

    languages.forEach((lang, i) => {
      const buttonY = (i - (n - 1) / 2) * (buttonHeight + buttonSpacing);

      const isActive = lang === localizationManager.currentLanguage;
      const fillColor = isActive ? 0x95245b : 0x622945;
      const strokeColor = isActive ? 0xffffff : 0x96576a;

      const rect = this.add.rectangle(0, buttonY, buttonWidth, buttonHeight, fillColor);
      rect.setStrokeStyle(3, strokeColor);
      rect.setInteractive();

      const label = localizationManager.getLanguageName(lang);
      const text = this.add.text(0, buttonY, label, {
        fontSize: '32px',
        color: '#ffffff',
        fontFamily: 'Arial',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);

      const currentLang = lang;

      rect.on('pointerover', () => {
        const isActiveNow = currentLang === localizationManager.currentLanguage;
        if (!isActiveNow) {
          rect.setFillStyle(0x95245b);
          rect.setStrokeStyle(3, 0xffffff);
        }
      });
      rect.on('pointerout', () => {
        const isActiveNow = currentLang === localizationManager.currentLanguage;
        rect.setFillStyle(isActiveNow ? 0x95245b : 0x622945);
        rect.setStrokeStyle(3, isActiveNow ? 0xffffff : 0x96576a);
      });
      rect.on('pointerdown', () => {
        this.resetAllButtonHoverStates();
        localizationManager.setLanguage(currentLang as GameLanguageCode);
      });

      const btnContainer = this.add.container(0, 0, [rect, text]) as LangButton;
      btnContainer.rect = rect;
      btnContainer.text = text;
      btnContainer.lang = lang;
      btnContainer.setActiveState = (active: boolean) => {
        rect.setFillStyle(active ? 0x95245b : 0x622945);
        rect.setStrokeStyle(3, active ? 0xffffff : 0x96576a);
      };

      this.langButtons.push(btnContainer);
      parentContainer.add(btnContainer);
    });
  }

  createBackButton(width: number, height: number): void {
    const buttonY = height * 0.8;
    this.backButton = this.add.text(width / 2, buttonY, localizationManager.t('back'), {
      fontSize: '36px',
      color: '#ffffff',
      fontFamily: 'Arial',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    this.backButton.setInteractive({ useHandCursor: true });
    this.backButton.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });
    this.backButton.on('pointerover', () => this.backButton!.setStyle({ color: '#ffd700' }));
    this.backButton.on('pointerout', () => this.backButton!.setStyle({ color: '#ffffff' }));
    this.mainUIContainer!.add(this.backButton);
  }

  updateAllTexts(): void {
    // Update title
    if (this.titleImage && this.titleImage.active) {
      const x = this.titleImage.x;
      const y = this.titleImage.y;
      this.titleImage.destroy();
      this.titleImage = GradientText.createGameTitle(this, localizationManager.t('settings'), x, y);
      this.mainUIContainer?.add(this.titleImage);
    }
    if (this.backButton) {
      this.backButton.setText(localizationManager.t('back'));
    }
    // Update language button text
    const langBtnText = this.languageButton?.getAt(1) as Phaser.GameObjects.Text | undefined;
    if (langBtnText) {
      langBtnText.setText(localizationManager.t('language'));
    }
    if (this.langPopupTitle) {
      this.langPopupTitle.setText(localizationManager.t('language'));
    }
    this.refreshLanguageButtons();
  }

  /**
   * Reset tất cả nút về trạng thái không hover (loại bỏ hover style)
   * Đơn giản chỉ set lại style dựa trên active state
   */
  resetAllButtonHoverStates(): void {
    this.langButtons.forEach((btn, index) => {
      if (btn && btn.rect && btn.lang) {
        const isActive = btn.lang === localizationManager.currentLanguage;
        // Force reset về style đúng dựa trên active state
        btn.rect.setFillStyle(isActive ? 0x95245b : 0x622945);
        btn.rect.setStrokeStyle(3, isActive ? 0xffffff : 0x96576a);
      }
    });
  }

  refreshLanguageButtons(): void {
    this.langButtons.forEach((btn, index) => {
      if (btn && btn.setActiveState && btn.text && btn.lang) {
        const isActive = btn.lang === localizationManager.currentLanguage;
        btn.setActiveState(isActive);
        const langName = localizationManager.getLanguageName(btn.lang);
        btn.text.setText(langName);
      }
    });
    // Reset hover states sau khi update
    this.resetAllButtonHoverStates();
  }

  onLanguageChanged(): void {
    // Chỉ update nếu scene đang active và visible
    if (!this.scene.isActive() || !this.scene.isVisible()) {
      return;
    }
    
    try {
      // Update UI khi ngôn ngữ thay đổi (từ event hoặc từ nơi khác)
      this.updateAllTexts();
      // Reset hover states sau khi update để đảm bảo không còn hover style
      this.resetAllButtonHoverStates();
    } catch (error) {
      // Không throw error để không làm interrupt event chain
    }
  }

  shutdown(): void {
    const win = window as any;
    if (win.gameEvents?.off && this.boundOnLanguageChanged) {
      win.gameEvents.off('languageChanged', this.boundOnLanguageChanged);
    }
  }
}
