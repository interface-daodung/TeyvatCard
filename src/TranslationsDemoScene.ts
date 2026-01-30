import Phaser from 'phaser';
import { LanguageCode } from '../types';
import { translations } from '../i18n/translations';

export class MainScene extends Phaser.Scene {
  private currentLanguage: LanguageCode = LanguageCode.ENGLISH;
  private messageText!: Phaser.GameObjects.Text;
  private langButton!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'MainScene' });
  }

  create() {
    const { width, height } = this.scale;

    // 1. Dòng chữ (Message)
    this.messageText = this.add.text(width / 2, height * 0.4, '', {
      fontSize: '48px',
      color: '#ffffff',
      fontFamily: 'Arial',
      align: 'center',
      wordWrap: { width: width * 0.9 }
    }).setOrigin(0.5);

    // 2. Nút bấm (Button) - Đơn giản là Text có viền
    this.langButton = this.add.text(width / 2, height * 0.6, '', {
      fontSize: '36px',
      color: '#00ff00',
      backgroundColor: '#333333',
      padding: { x: 30, y: 15 },
      fontFamily: 'Arial'
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.toggleLanguage())
      .on('pointerover', () => this.langButton.setStyle({ color: '#ffff00' }))
      .on('pointerout', () => this.langButton.setStyle({ color: '#00ff00' }));

    // Cập nhật nội dung ban đầu
    this.updateContent();
  }

  private toggleLanguage() {
    this.currentLanguage = this.currentLanguage === LanguageCode.ENGLISH
      ? LanguageCode.VIETNAMESE
      : LanguageCode.ENGLISH;
    this.updateContent();
  }

  private updateContent() {
    const t = translations[this.currentLanguage];

    // Hiển thị 1 dòng chữ (ví dụ welcomeMessage)
    this.messageText.setText(t.welcomeMessage);

    // Hiển thị nút (changeLanguage)
    this.langButton.setText(t.changeLanguage);
  }
}
