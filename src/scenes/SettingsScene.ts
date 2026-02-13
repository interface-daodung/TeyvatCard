import Phaser from 'phaser';
import { GradientText } from '../utils/GradientText.js';
import { localizationManager, type GameLanguageCode } from '../utils/LocalizationManager.js';
import { soundManager } from '../core/SoundManager.js';
import aboutData from '../data/About.json';

interface AboutBlock {
  type: string;
  size?: number;
  text: string;
}

interface AboutJson {
  blocks: AboutBlock[];
}

/** Nút: Rectangle + Text, có setActiveState */
type LangButton = Phaser.GameObjects.Container & {
  rect?: Phaser.GameObjects.Rectangle;
  text?: Phaser.GameObjects.Text;
  setActiveState?: (active: boolean) => void;
  lang?: string;
};

/** Vị trí bắt đầu vẽ từng thành phần (tỉ lệ theo height, 0–1). Chỉnh tại đây để tránh trồng lên nhau. */
const SETTINGS_UI_Y = {
  TITLE: 0.18,           // tiêu đề "Cài đặt"
  LANGUAGE: 0.4,         // nút Ngôn ngữ
  GAME_SETTING: 0.5,     // nút Cài đặt game
  ABOUT: 0.6,            // nút Thông tin
  VOLUME_BGM: 0.7,      // thanh kéo BGM (dưới About)
  VOLUME_SE: 0.75,       // thanh kéo SE (dưới BGM)
  BACK: 0.84             // nút Quay lại
} as const;

export default class SettingsScene extends Phaser.Scene {
  private titleImage?: Phaser.GameObjects.Image;
  private backButton?: Phaser.GameObjects.Text;
  private languageButton?: Phaser.GameObjects.Container;
  private gameSettingButton?: Phaser.GameObjects.Container;
  private aboutButton?: Phaser.GameObjects.Container;
  private volumeSliderContainer?: Phaser.GameObjects.Container;
  private bgmVolumeSliderContainer?: Phaser.GameObjects.Container;
  private langPopupTitle?: Phaser.GameObjects.Text;
  private mainUIContainer?: Phaser.GameObjects.Container;
  private langPopupContainer?: Phaser.GameObjects.Container;
  private gameSettingPopupContainer?: Phaser.GameObjects.Container;
  private aboutPopupContainer?: Phaser.GameObjects.Container;
  private langButtons: LangButton[] = [];
  private boundOnLanguageChanged!: () => void;
  private volumeValue: number = 1;
  private volumeThumb?: Phaser.GameObjects.Rectangle;
  private volumeIconRight?: Phaser.GameObjects.Text;
  private volumeTrackWidth: number = 0;
  private volumeTrackX: number = 0;
  private volumeTrackY: number = 0;
  private volumeHoldMoveHandler = (ptr: Phaser.Input.Pointer) => {
    if (ptr.isDown) this.updateVolumeFromPointer(ptr.worldX);
  };
  private volumeHoldUpHandler = () => this.stopVolumeTrackHold();
  private bgmVolumeValue: number = 1;
  private bgmVolumeThumb?: Phaser.GameObjects.Rectangle;
  private bgmVolumeIconRight?: Phaser.GameObjects.Text;
  private bgmVolumeTrackWidth: number = 0;
  private bgmVolumeTrackX: number = 0;
  private bgmVolumeTrackY: number = 0;
  private bgmVolumeHoldMoveHandler = (ptr: Phaser.Input.Pointer) => {
    if (ptr.isDown) this.updateBGMVolumeFromPointer(ptr.worldX);
  };
  private bgmVolumeHoldUpHandler = () => this.stopBGMVolumeTrackHold();

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
    this.createGameSettingButton(width, height);
    this.createAboutButton(width, height);
    this.createVolumeSlider(width, height);
    this.createBGMVolumeSlider(width, height);
    this.createBackButton(width, height);

    // Popup chọn ngôn ngữ (ẩn ban đầu) - depth thấp hơn title và back button
    this.createLanguagePopup(width, height);
    this.createGameSettingPopup(width, height);
    this.createAboutPopup(width, height);

    const win = window as any;
    if (win.gameEvents?.on) {
      win.gameEvents.on('languageChanged', this.boundOnLanguageChanged);
    }
  }

  createTitle(width: number, height: number): void {
    this.titleImage = GradientText.createGameTitle(this, localizationManager.t('settings'), width / 2, height * SETTINGS_UI_Y.TITLE);
    this.mainUIContainer!.add(this.titleImage);
  }

  /** Nút Language - bấm vào mở popup chọn ngôn ngữ */
  createLanguageButton(width: number, height: number): void {
    const buttonWidth = width * 0.6;
    const buttonHeight = height * 0.08;
    const buttonY = height * SETTINGS_UI_Y.LANGUAGE;

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

  /** Nút Game Setting - bấm vào mở popup cài đặt game */
  createGameSettingButton(width: number, height: number): void {
    const buttonWidth = width * 0.6;
    const buttonHeight = height * 0.08;
    const buttonY = height * SETTINGS_UI_Y.GAME_SETTING;

    const rect = this.add.rectangle(width / 2, buttonY, buttonWidth, buttonHeight, 0x622945);
    rect.setStrokeStyle(3, 0x96576a);
    rect.setInteractive({ useHandCursor: true });

    const text = this.add.text(width / 2, buttonY, localizationManager.t('gameSetting'), {
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
      this.showGameSettingPopup();
    });

    this.gameSettingButton = this.add.container(0, 0, [rect, text]);
    this.mainUIContainer!.add(this.gameSettingButton);
  }

  /** Nút About - bấm vào mở popup thông tin */
  createAboutButton(width: number, height: number): void {
    const buttonWidth = width * 0.6;
    const buttonHeight = height * 0.08;
    const buttonY = height * SETTINGS_UI_Y.ABOUT;

    const rect = this.add.rectangle(width / 2, buttonY, buttonWidth, buttonHeight, 0x622945);
    rect.setStrokeStyle(3, 0x96576a);
    rect.setInteractive({ useHandCursor: true });

    const text = this.add.text(width / 2, buttonY, localizationManager.t('about'), {
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
      this.showAboutPopup();
    });

    this.aboutButton = this.add.container(0, 0, [rect, text]);
    this.mainUIContainer!.add(this.aboutButton);
  }

  /** Thanh âm lượng SE = 1 khối tổng thể (icon + track) – đặt dưới BGM */
  createVolumeSlider(width: number, height: number): void {
    const sliderY = height * SETTINGS_UI_Y.VOLUME_SE;
    const totalWidth = width * 0.6;
    const iconZone = 52;
    const trackWidth = (totalWidth - iconZone) * 0.92;
    const trackHeight = 18;
    const thumbRadius = 18;
    const centerX = width / 2;
    const leftEdge = centerX - totalWidth / 2;
    const trackLeft = leftEdge + iconZone + 10;
    const trackCenterX = trackLeft + trackWidth / 2;
    this.volumeValue = soundManager.getVolume();
    this.volumeTrackWidth = trackWidth;
    this.volumeTrackX = trackLeft;
    this.volumeTrackY = sliderY;

    const container = this.add.container(0, 0);

    const labelSE = this.add.text(leftEdge + iconZone / 2, sliderY - 14, 'SE', {
      fontSize: '14px',
      color: '#888888',
      fontFamily: 'Arial'
    }).setOrigin(0.5).setAlpha(0.85);
    container.add(labelSE);

    const iconLeft = this.add.text(leftEdge + iconZone / 2, sliderY, this.volumeValue === 0 ? '🔇' : '🔊', {
      fontSize: '32px',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    iconLeft.setInteractive({ useHandCursor: true });
    iconLeft.on('pointerdown', () => this.toggleVolumeMute());
    container.add(iconLeft);
    this.volumeIconRight = iconLeft;

    const track = this.add.rectangle(trackCenterX, sliderY, trackWidth, trackHeight, 0x333333);
    track.setStrokeStyle(2, 0x96576a);
    track.setInteractive({ useHandCursor: true });
    track.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      this.updateVolumeFromPointer(ptr.worldX);
      this.startVolumeTrackHold();
    });
    container.add(track);

    const fillWidth = trackWidth * this.volumeValue;
    const fill = this.add.rectangle(trackLeft, sliderY, fillWidth, trackHeight - 4, 0x95245b).setOrigin(0, 0.5);
    fill.setPosition(trackLeft, sliderY);
    fill.setSize(fillWidth, trackHeight - 4);
    fill.setOrigin(0, 0.5);
    container.add(fill);

    const thumbX = trackLeft + this.volumeValue * trackWidth;
    const thumbSize = thumbRadius * 2;
    const thumb = this.add.rectangle(thumbX, sliderY, thumbSize, thumbSize, 0xffffff);
    thumb.setStrokeStyle(2, 0x95245b);
    thumb.setInteractive({ useHandCursor: true });
    this.volumeThumb = thumb;
    this.input.setDraggable(thumb);
    thumb.on('drag', (_ptr: Phaser.Input.Pointer, _go: Phaser.GameObjects.GameObject, dragX: number) => {
      this.updateVolumeFromPointer(dragX);
    });
    thumb.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      this.updateVolumeFromPointer(ptr.worldX);
    });
    container.add(thumb);

    this.volumeSliderContainer = container;
    this.mainUIContainer!.add(container);
    this.syncVolumeUI();
  }

  private startVolumeTrackHold(): void {
    this.input.on('pointermove', this.volumeHoldMoveHandler);
    this.input.once('pointerup', this.volumeHoldUpHandler);
  }

  private stopVolumeTrackHold(): void {
    this.input.off('pointermove', this.volumeHoldMoveHandler);
    this.input.off('pointerup', this.volumeHoldUpHandler);
  }

  private toggleVolumeMute(): void {
    soundManager.toggleMute();
    this.volumeValue = soundManager.getVolume();
    this.syncVolumeUI();
  }

  private updateVolumeFromPointer(worldX: number): void {
    const left = this.volumeTrackX;
    this.volumeValue = Math.max(0, Math.min(1, (worldX - left) / this.volumeTrackWidth));
    soundManager.setVolume(this.volumeValue);
    this.syncVolumeUI();
  }

  private syncVolumeUI(): void {
    if (!this.volumeThumb || !this.volumeSliderContainer) return;
    const trackWidth = this.volumeTrackWidth;
    const left = this.volumeTrackX;
    const thumbX = left + this.volumeValue * trackWidth;
    this.volumeThumb.setPosition(thumbX, this.volumeTrackY);
    const fill = this.volumeSliderContainer.getAt(3) as Phaser.GameObjects.Rectangle; // labelSE=0, icon=1, track=2, fill=3, thumb=4
    if (fill) {
      const fillWidth = trackWidth * this.volumeValue;
      fill.setSize(fillWidth, fill.height);
      fill.setPosition(left, this.volumeTrackY);
      fill.setOrigin(0, 0.5);
    }
    if (this.volumeIconRight) {
      this.volumeIconRight.setText(this.volumeValue === 0 ? '🔇' : '🔊');
    }
  }

  /** Thanh âm lượng BGM (riêng) – layout giống SE, đặt trên SE */
  createBGMVolumeSlider(width: number, height: number): void {
    const sliderY = height * SETTINGS_UI_Y.VOLUME_BGM;
    const totalWidth = width * 0.6;
    const iconZone = 52;
    const trackWidth = (totalWidth - iconZone) * 0.92;
    const trackHeight = 18;
    const thumbRadius = 18;
    const centerX = width / 2;
    const leftEdge = centerX - totalWidth / 2;
    const trackLeft = leftEdge + iconZone + 10;
    const trackCenterX = trackLeft + trackWidth / 2;
    this.bgmVolumeValue = soundManager.getBGMVolume();
    this.bgmVolumeTrackWidth = trackWidth;
    this.bgmVolumeTrackX = trackLeft;
    this.bgmVolumeTrackY = sliderY;

    const container = this.add.container(0, 0);

    const labelBGM = this.add.text(leftEdge + iconZone / 2, sliderY - 14, 'BGM', {
      fontSize: '14px',
      color: '#888888',
      fontFamily: 'Arial'
    }).setOrigin(0.5).setAlpha(0.85);
    container.add(labelBGM);

    const iconLeft = this.add.text(leftEdge + iconZone / 2, sliderY, this.bgmVolumeValue === 0 ? '🔇' : '🔊', {
      fontSize: '32px',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    iconLeft.setInteractive({ useHandCursor: true });
    iconLeft.on('pointerdown', () => this.toggleBGMMute());
    container.add(iconLeft);
    this.bgmVolumeIconRight = iconLeft;

    const track = this.add.rectangle(trackCenterX, sliderY, trackWidth, trackHeight, 0x333333);
    track.setStrokeStyle(2, 0x96576a);
    track.setInteractive({ useHandCursor: true });
    track.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      this.updateBGMVolumeFromPointer(ptr.worldX);
      this.startBGMVolumeTrackHold();
    });
    container.add(track);

    const fillWidth = trackWidth * this.bgmVolumeValue;
    const fill = this.add.rectangle(trackLeft, sliderY, fillWidth, trackHeight - 4, 0x95245b).setOrigin(0, 0.5);
    fill.setPosition(trackLeft, sliderY);
    fill.setSize(fillWidth, trackHeight - 4);
    fill.setOrigin(0, 0.5);
    container.add(fill);

    const thumbX = trackLeft + this.bgmVolumeValue * trackWidth;
    const thumbSize = thumbRadius * 2;
    const thumb = this.add.rectangle(thumbX, sliderY, thumbSize, thumbSize, 0xffffff);
    thumb.setStrokeStyle(2, 0x95245b);
    thumb.setInteractive({ useHandCursor: true });
    this.bgmVolumeThumb = thumb;
    this.input.setDraggable(thumb);
    thumb.on('drag', (_ptr: Phaser.Input.Pointer, _go: Phaser.GameObjects.GameObject, dragX: number) => {
      this.updateBGMVolumeFromPointer(dragX);
    });
    thumb.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      this.updateBGMVolumeFromPointer(ptr.worldX);
    });
    container.add(thumb);

    this.bgmVolumeSliderContainer = container;
    this.mainUIContainer!.add(container);
    this.syncBGMVolumeUI();
  }

  private startBGMVolumeTrackHold(): void {
    this.input.on('pointermove', this.bgmVolumeHoldMoveHandler);
    this.input.once('pointerup', this.bgmVolumeHoldUpHandler);
  }

  private stopBGMVolumeTrackHold(): void {
    this.input.off('pointermove', this.bgmVolumeHoldMoveHandler);
    this.input.off('pointerup', this.bgmVolumeHoldUpHandler);
  }

  private toggleBGMMute(): void {
    soundManager.toggleBGMMute();
    this.bgmVolumeValue = soundManager.getBGMVolume();
    this.syncBGMVolumeUI();
  }

  private updateBGMVolumeFromPointer(worldX: number): void {
    const left = this.bgmVolumeTrackX;
    this.bgmVolumeValue = Math.max(0, Math.min(1, (worldX - left) / this.bgmVolumeTrackWidth));
    soundManager.setBGMVolume(this.bgmVolumeValue);
    this.syncBGMVolumeUI();
  }

  private syncBGMVolumeUI(): void {
    if (!this.bgmVolumeThumb || !this.bgmVolumeSliderContainer) return;
    const trackWidth = this.bgmVolumeTrackWidth;
    const left = this.bgmVolumeTrackX;
    const thumbX = left + this.bgmVolumeValue * trackWidth;
    this.bgmVolumeThumb.setPosition(thumbX, this.bgmVolumeTrackY);
    const fill = this.bgmVolumeSliderContainer.getAt(3) as Phaser.GameObjects.Rectangle;
    if (fill) {
      const fillWidth = trackWidth * this.bgmVolumeValue;
      fill.setSize(fillWidth, fill.height);
      fill.setPosition(left, this.bgmVolumeTrackY);
      fill.setOrigin(0, 0.5);
    }
    if (this.bgmVolumeIconRight) {
      this.bgmVolumeIconRight.setText(this.bgmVolumeValue === 0 ? '🔇' : '🔊');
    }
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

  /** Tạo popup Game Setting */
  createGameSettingPopup(width: number, height: number): void {
    this.gameSettingPopupContainer = this.add.container(width / 2, height / 2);
    this.gameSettingPopupContainer.setDepth(50);

    const overlay = this.add.rectangle(0, 0, width + 100, height + 100, 0x000000, 0.25);
    overlay.setInteractive({ useHandCursor: false });

    const panelWidth = width * 0.75;
    const panelHeight = height * 0.5;
    const radius = Math.min(panelWidth, panelHeight) * 0.04;
    const panel = this.add.graphics();
    panel.fillStyle(0x1a1a2e, 0.7);
    panel.lineStyle(3, 0x95245b);
    panel.fillRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, radius);
    panel.strokeRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, radius);

    const title = this.add.text(0, -panelHeight / 2 + 80, localizationManager.t('gameSetting'), {
      fontSize: '36px',
      color: '#cbbd1b',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#1f0612',
      strokeThickness: 2
    }).setOrigin(0.5);

    const closeBtn = this.add.text(panelWidth / 2 - 35, -panelHeight / 2 + 30, '✕', {
      fontSize: '32px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.hideGameSettingPopup());
    closeBtn.on('pointerover', () => closeBtn.setStyle({ color: '#ff6b6b' }));
    closeBtn.on('pointerout', () => closeBtn.setStyle({ color: '#ffffff' }));

    const placeholder = this.add.text(0, 0, localizationManager.t('settings'), {
      fontSize: '20px',
      color: '#aaaaaa',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    placeholder.setAlpha(0.7);

    this.gameSettingPopupContainer.add([overlay, panel, title, closeBtn, placeholder]);
    this.gameSettingPopupContainer.setVisible(false);
    overlay.on('pointerdown', () => this.hideGameSettingPopup());
  }

  /** Xử lý text block: /n → xuống dòng, /tab → tab */
  private formatParagraphText(raw: string): string {
    return raw
      .replace(/\/n/g, '\n')
      .replace(/\/tab/g, '\t')
      .toLowerCase();
  }

  /** Font size cho heading theo size (1 = lớn, 2 = nhỏ hơn, ...) */
  private getHeadingFontSize(size?: number): number {
    if (size === 1) return 28;
    if (size === 2) return 24;
    return size && size > 0 ? Math.max(18, 32 - size * 4) : 28;
  }

  /** Tạo popup About - hiển thị nội dung từ About.json */
  createAboutPopup(width: number, height: number): void {
    this.aboutPopupContainer = this.add.container(width / 2, height / 2);
    this.aboutPopupContainer.setDepth(50);

    const overlay = this.add.rectangle(0, 0, width + 100, height + 100, 0x000000, 0.25);
    overlay.setInteractive({ useHandCursor: false });

    const panelWidth = width * 0.85;
    const panelHeight = height * 0.75;
    const radius = Math.min(panelWidth, panelHeight) * 0.04;
    const panel = this.add.graphics();
    panel.fillStyle(0x1a1a2e, 0.7);
    panel.lineStyle(3, 0x95245b);
    panel.fillRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, radius);
    panel.strokeRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, radius);

    const title = this.add.text(0, -panelHeight / 2 + 120, localizationManager.t('about'), {
      fontSize: '36px',
      color: '#cbbd1b',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#1f0612',
      strokeThickness: 2
    }).setOrigin(0.5);

    const closeBtn = this.add.text(panelWidth / 2 - 35, -panelHeight / 2 + 30, '✕', {
      fontSize: '32px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.hideAboutPopup());
    closeBtn.on('pointerover', () => closeBtn.setStyle({ color: '#ff6b6b' }));
    closeBtn.on('pointerout', () => closeBtn.setStyle({ color: '#ffffff' }));

    const contentContainer = this.add.container(0, -panelHeight / 2 + 180);
    const data = aboutData as AboutJson;
    let currentY = 0;
    const lineSpacing = 20;
    const blockSpacing = 35;

    data.blocks.forEach((block) => {
      const isParagraph = block.type === 'paragraph';
      const displayText = isParagraph
        ? this.formatParagraphText(block.text)
        : (block.text || '').toUpperCase();
      const fontSize = isParagraph ? 18 : this.getHeadingFontSize(block.size);

      const textObj = this.add.text(0, currentY, displayText, {
        fontSize: `${fontSize}px`,
        color: '#ffffff',
        fontFamily: 'Arial',
        wordWrap: { width: panelWidth - 80 },
        align: 'center'
      }).setOrigin(0.5, 0);

      contentContainer.add(textObj);
      currentY += textObj.height + (isParagraph ? lineSpacing : blockSpacing);
    });

    this.aboutPopupContainer.add([overlay, panel, title, closeBtn, contentContainer]);
    this.aboutPopupContainer.setVisible(false);

    overlay.on('pointerdown', () => this.hideAboutPopup());
  }

  showAboutPopup(): void {
    this.languageButton?.setVisible(false);
    this.gameSettingButton?.setVisible(false);
    this.aboutButton?.setVisible(false);
    this.volumeSliderContainer?.setVisible(false);
    this.bgmVolumeSliderContainer?.setVisible(false);
    this.aboutPopupContainer?.setVisible(true);
  }

  hideAboutPopup(): void {
    this.languageButton?.setVisible(true);
    this.gameSettingButton?.setVisible(true);
    this.aboutButton?.setVisible(true);
    this.volumeSliderContainer?.setVisible(true);
    this.bgmVolumeSliderContainer?.setVisible(true);
    this.aboutPopupContainer?.setVisible(false);
  }

  showLanguagePopup(): void {
    this.languageButton?.setVisible(false);
    this.gameSettingButton?.setVisible(false);
    this.aboutButton?.setVisible(false);
    this.volumeSliderContainer?.setVisible(false);
    this.bgmVolumeSliderContainer?.setVisible(false);
    this.langPopupContainer?.setVisible(true);
  }

  hideLanguagePopup(): void {
    this.languageButton?.setVisible(true);
    this.gameSettingButton?.setVisible(true);
    this.aboutButton?.setVisible(true);
    this.volumeSliderContainer?.setVisible(true);
    this.bgmVolumeSliderContainer?.setVisible(true);
    this.langPopupContainer?.setVisible(false);
  }

  showGameSettingPopup(): void {
    this.languageButton?.setVisible(false);
    this.gameSettingButton?.setVisible(false);
    this.aboutButton?.setVisible(false);
    this.volumeSliderContainer?.setVisible(false);
    this.bgmVolumeSliderContainer?.setVisible(false);
    this.gameSettingPopupContainer?.setVisible(true);
  }

  hideGameSettingPopup(): void {
    this.languageButton?.setVisible(true);
    this.gameSettingButton?.setVisible(true);
    this.aboutButton?.setVisible(true);
    this.volumeSliderContainer?.setVisible(true);
    this.bgmVolumeSliderContainer?.setVisible(true);
    this.gameSettingPopupContainer?.setVisible(false);
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
    const buttonY = height * SETTINGS_UI_Y.BACK;
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
    const gameSettingBtnText = this.gameSettingButton?.getAt(1) as Phaser.GameObjects.Text | undefined;
    if (gameSettingBtnText) {
      gameSettingBtnText.setText(localizationManager.t('gameSetting'));
    }
    // Update about button text
    const aboutBtnText = this.aboutButton?.getAt(1) as Phaser.GameObjects.Text | undefined;
    if (aboutBtnText) {
      aboutBtnText.setText(localizationManager.t('about'));
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
    this.stopVolumeTrackHold();
    this.stopBGMVolumeTrackHold();
    const win = window as any;
    if (win.gameEvents?.off && this.boundOnLanguageChanged) {
      win.gameEvents.off('languageChanged', this.boundOnLanguageChanged);
    }
  }
}
