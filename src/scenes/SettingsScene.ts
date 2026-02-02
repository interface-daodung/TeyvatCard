import Phaser from 'phaser';
import { GradientText } from '../utils/GradientText.js';
import { localizationManager, type GameLanguageCode } from '../utils/LocalizationManager.js';

/** Nút: Rectangle + Text, có setActiveState */
type LangButton = Phaser.GameObjects.Container & {
  rect?: Phaser.GameObjects.Rectangle;
  text?: Phaser.GameObjects.Text;
  setActiveState?: (active: boolean) => void;
  lang?: string; // Lưu mã ngôn ngữ để dễ truy cập
};

export default class SettingsScene extends Phaser.Scene {
  private titleImage?: Phaser.GameObjects.Image;
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
    this.titleImage = GradientText.createGameTitle(this, localizationManager.t('settings'), width / 2, height * 0.18);
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

      // Lưu reference đến lang để dùng trong callbacks
      const currentLang = lang;
      
      rect.on('pointerover', () => {
        // Kiểm tra lại active state mỗi lần hover (vì có thể đã thay đổi)
        const isActive = currentLang === localizationManager.currentLanguage;
        // Chỉ apply hover style nếu không phải nút đang active
        if (!isActive) {
          rect.setFillStyle(0x95245b);
          rect.setStrokeStyle(3, 0xffffff);
        }
      });
      rect.on('pointerout', () => {
        // Kiểm tra lại active state khi pointer out
        const isActive = currentLang === localizationManager.currentLanguage;
        rect.setFillStyle(isActive ? 0x95245b : 0x622945);
        rect.setStrokeStyle(3, isActive ? 0xffffff : 0x96576a);
      });
      rect.on('pointerdown', () => {
        // Reset tất cả nút về trạng thái đúng trước khi đổi ngôn ngữ
        this.resetAllButtonHoverStates();
        
        // Đổi ngôn ngữ - sẽ tự động trigger 'languageChanged' event
        // onLanguageChanged() sẽ gọi updateAllTexts() để update UI
        localizationManager.setLanguage(currentLang as GameLanguageCode);
      });

      const btnContainer = this.add.container(0, 0, [rect, text]) as LangButton;
      btnContainer.rect = rect;
      btnContainer.text = text;
      btnContainer.lang = lang; // Lưu mã ngôn ngữ
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
    // Update title
    if (this.titleImage && this.titleImage.active) {
      const x = this.titleImage.x;
      const y = this.titleImage.y;
      this.titleImage.destroy();
      this.titleImage = GradientText.createGameTitle(this, localizationManager.t('settings'), x, y);
    }
    if (this.backButton) {
      this.backButton.setText(localizationManager.t('back'));
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
