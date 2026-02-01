import Phaser from 'phaser';
import { localizationManager, type GameLanguageCode } from '../utils/LocalizationManager.js';

/** Nút: Rectangle + Text, có setActiveState */
type LangButton = Phaser.GameObjects.Container & {
  rect?: Phaser.GameObjects.Rectangle;
  text?: Phaser.GameObjects.Text;
  setActiveState?: (active: boolean) => void;
};

export default class SettingsScene extends Phaser.Scene {
  private titleText?: Phaser.GameObjects.Text;
  private backButton?: Phaser.GameObjects.Text;
  private langButtons: LangButton[] = [];
  private boundOnLanguageChanged!: () => void;

  constructor() {
    super({ key: 'SettingsScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    this.boundOnLanguageChanged = this.onLanguageChanged.bind(this);

    // Background - tham khảo MapScenes
    this.add.image(width / 2, height / 2, 'background');
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000).setAlpha(0.5);

    // Tiêu đề - dùng GradientText như MapScenes
    this.createTitle(width, height);

    // Container cho các nút ngôn ngữ - xếp thẳng hàng dọc như MapScenes
    this.createLanguageButtons(width, height);

    // Nút Back
    this.createBackButton(width, height);

    const win = window as any;
    if (win.gameEvents?.on) {
      win.gameEvents.on('languageChanged', this.boundOnLanguageChanged);
    }
  }

  createTitle(width: number, height: number): void {
    const titleStr = localizationManager.t('settings');
    this.titleText = this.add.text(width / 2, height * 0.18, titleStr.toUpperCase(), {
      fontSize: '48px',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      color: '#cbbd1b',
      stroke: '#1f0612',
      strokeThickness: 3
    }).setOrigin(0.5);
  }

  /**
   * Tạo các nút ngôn ngữ xếp theo đường thẳng dọc (tham khảo MapScenes)
   */
  createLanguageButtons(width: number, height: number): void {
    const container = this.add.container(width / 2, height * 0.5);
    const buttonWidth = width * 0.7;
    const buttonHeight = height * 0.08;
    const buttonSpacing = 20;

    const languages = localizationManager.getAvailableLanguages();
    const n = languages.length;

    languages.forEach((lang, i) => {
      // Vị trí Y: xếp thẳng từ trên xuống, căn giữa theo chiều dọc
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

      rect.on('pointerover', () => {
        rect.setFillStyle(0x95245b);
        rect.setStrokeStyle(3, 0xffffff);
      });
      rect.on('pointerout', () => {
        const active = lang === localizationManager.currentLanguage;
        rect.setFillStyle(active ? 0x95245b : 0x622945);
        rect.setStrokeStyle(3, active ? 0xffffff : 0x96576a);
      });
      rect.on('pointerdown', () => {
        localizationManager.setLanguage(lang as GameLanguageCode);
        this.updateAllTexts();
      });

      const btnContainer = this.add.container(0, 0, [rect, text]) as LangButton;
      btnContainer.rect = rect;
      btnContainer.text = text;
      btnContainer.setActiveState = (active: boolean) => {
        rect.setFillStyle(active ? 0x95245b : 0x622945);
        rect.setStrokeStyle(3, active ? 0xffffff : 0x96576a);
      };

      this.langButtons.push(btnContainer);
      container.add(btnContainer);
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
  }

  updateAllTexts(): void {
    const titleStr = localizationManager.t('settings');
    if (this.titleText) {
      this.titleText.setText(titleStr.toUpperCase());
    }
    if (this.backButton) {
      this.backButton.setText(localizationManager.t('back'));
    }
    this.refreshLanguageButtons();
  }

  refreshLanguageButtons(): void {
    const languages = localizationManager.getAvailableLanguages();
    languages.forEach((lang, i) => {
      const btn = this.langButtons[i];
      if (btn && btn.setActiveState && btn.text) {
        const isActive = lang === localizationManager.currentLanguage;
        btn.setActiveState(isActive);
        btn.text.setText(localizationManager.getLanguageName(lang));
      }
    });
  }

  onLanguageChanged(): void {
    this.updateAllTexts();
  }

  shutdown(): void {
    const win = window as any;
    if (win.gameEvents?.off && this.boundOnLanguageChanged) {
      win.gameEvents.off('languageChanged', this.boundOnLanguageChanged);
    }
  }
}
