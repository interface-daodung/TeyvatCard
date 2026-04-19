import Phaser from 'phaser';
import { localizationManager } from '../core/LocalizationManager.js';
import { soundManager } from '../core/SoundManager.js';
import { themeManager } from '../core/ThemeManager.js';
import TextureManager from '../core/TextureManager.js';
import {
    createBackButton,
    createRectTextButton,
    createVolumeSlider,
    createLanguagePopup,
    createGameSettingPopup,
    createAboutPopup,
    SETTINGS_UI_Y
} from '../components/SettingsScene/index.js';
import { GameTitle } from '../components/shared/index.js';

export default class SettingsScene extends Phaser.Scene {
    private backButton?: Phaser.GameObjects.Text;
    private mainUIContainer!: Phaser.GameObjects.Container;
    private languageButton!: Phaser.GameObjects.Container;
    private gameSettingButton!: Phaser.GameObjects.Container;
    private aboutButton!: Phaser.GameObjects.Container;
    private volumeSliderContainer!: Phaser.GameObjects.Container;
    private bgmVolumeSliderContainer!: Phaser.GameObjects.Container;
    private langPopupContainer!: Phaser.GameObjects.Container;
    private gameSettingPopupContainer!: Phaser.GameObjects.Container;
    private aboutPopupContainer!: Phaser.GameObjects.Container;
    private refreshLanguageButtons!: () => void;
    private setLangPopupTitle!: (text: string) => void;
    private boundOnLanguageChanged!: () => void;

    constructor() {
        super({ key: 'SettingsScene' });
    }

    create(): void {
        const { width, height } = this.scale;
        this.boundOnLanguageChanged = this.onLanguageChanged.bind(this);

        TextureManager.image(this, width / 2, height / 2, 'background').setDisplaySize(width, height);
        this.add.rectangle(width / 2, height / 2, width, height, themeManager.getBackgroundPhaser()).setAlpha(0.5);

        this.mainUIContainer = this.add.container(0, 0);
        this.mainUIContainer.setDepth(100);

        const titleObj = GameTitle.create(this, width / 2, height * SETTINGS_UI_Y.TITLE, 'settings');
        this.mainUIContainer.add(titleObj);

        this.languageButton = createRectTextButton(this, width, height, SETTINGS_UI_Y.LANGUAGE, 'language', () => this.showLanguagePopup());
        this.mainUIContainer.add(this.languageButton);

        this.gameSettingButton = createRectTextButton(this, width, height, SETTINGS_UI_Y.GAME_SETTING, 'gameSetting', () => this.showGameSettingPopup());
        this.mainUIContainer.add(this.gameSettingButton);

        this.aboutButton = createRectTextButton(this, width, height, SETTINGS_UI_Y.ABOUT, 'about', () => this.showAboutPopup());
        this.mainUIContainer.add(this.aboutButton);

        this.volumeSliderContainer = createVolumeSlider(
            this,
            width,
            height,
            SETTINGS_UI_Y.VOLUME_SE,
            'SE',
            () => soundManager.getVolume(),
            (v) => soundManager.setVolume(v),
            () => soundManager.toggleMute()
        );
        this.mainUIContainer.add(this.volumeSliderContainer);

        this.bgmVolumeSliderContainer = createVolumeSlider(
            this,
            width,
            height,
            SETTINGS_UI_Y.VOLUME_BGM,
            'BGM',
            () => soundManager.getBGMVolume(),
            (v) => soundManager.setBGMVolume(v),
            () => soundManager.toggleBGMMute()
        );
        this.mainUIContainer.add(this.bgmVolumeSliderContainer);

        this.backButton = createBackButton(
            this,
            width,
            height,
            () => this.scene.start('LoadingScene', { targetScene: 'MenuScene' }),
            'back_short',
            this.mainUIContainer
        );

        const langResult = createLanguagePopup(this, width, height, () => this.hideLanguagePopup());
        this.langPopupContainer = langResult.container;
        this.refreshLanguageButtons = langResult.refreshLanguageButtons;
        this.setLangPopupTitle = langResult.setTitleText;

        this.gameSettingPopupContainer = createGameSettingPopup(this, width, height, () => this.hideGameSettingPopup());
        this.aboutPopupContainer = createAboutPopup(this, width, height, () => this.hideAboutPopup());

        this.game.events.on('languageChanged', this.boundOnLanguageChanged);
    }

    private hideMainUI(): void {
        this.languageButton.setVisible(false);
        this.gameSettingButton.setVisible(false);
        this.aboutButton.setVisible(false);
        this.volumeSliderContainer.setVisible(false);
        this.bgmVolumeSliderContainer.setVisible(false);
    }

    private showMainUI(): void {
        this.languageButton.setVisible(true);
        this.gameSettingButton.setVisible(true);
        this.aboutButton.setVisible(true);
        this.volumeSliderContainer.setVisible(true);
        this.bgmVolumeSliderContainer.setVisible(true);
    }

    showLanguagePopup(): void {
        this.hideMainUI();
        this.langPopupContainer.setVisible(true);
    }

    hideLanguagePopup(): void {
        this.showMainUI();
        this.langPopupContainer.setVisible(false);
    }

    showGameSettingPopup(): void {
        this.hideMainUI();
        this.gameSettingPopupContainer.setVisible(true);
    }

    hideGameSettingPopup(): void {
        this.showMainUI();
        this.gameSettingPopupContainer.setVisible(false);
    }

    showAboutPopup(): void {
        this.hideMainUI();
        this.aboutPopupContainer.setVisible(true);
    }

    hideAboutPopup(): void {
        this.showMainUI();
        this.aboutPopupContainer.setVisible(false);
    }

    updateAllTexts(): void {
        this.setLangPopupTitle(localizationManager.t('language'));
        this.refreshLanguageButtons();
    }

    onLanguageChanged(): void {
        if (!this.scene.isActive() || !this.scene.isVisible()) return;
        try {
            this.updateAllTexts();
        } catch {
            // ignore
        }
    }

    shutdown(): void {
        if (this.boundOnLanguageChanged) {
            this.game.events.off('languageChanged', this.boundOnLanguageChanged);
        }
    }
}
