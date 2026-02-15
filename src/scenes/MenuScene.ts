import Phaser from 'phaser';
import { dataManager } from '../core/DataManager.js';
import { GradientText } from '../utils/GradientText.js';
import { HeaderUI } from '../utils/HeaderUI.js';
import { localizationManager } from '../utils/LocalizationManager.js';
import { soundManager } from '../core/SoundManager.js';
import { themeManager } from '../core/ThemeManager.js';
import cardCharacterList from '../data/cardCharacterList.json';
import {
    createCardSpreadContainer,
    createMenuButton,
    updateMenuButtonText,
    type CardCharacter,
    type MenuButtonResult
} from '../components/MenuScene/index.js';

export default class MenuScene extends Phaser.Scene {
    private cards: CardCharacter[];
    private libraryButton?: MenuButtonResult;
    private exploreButton?: MenuButtonResult;
    private equipButton?: MenuButtonResult;
    private testDevButton?: Phaser.GameObjects.Text;
    private boundOnLanguageChanged!: () => void;

    constructor() {
        super({ key: 'MenuScene' });
        this.cards = cardCharacterList as CardCharacter[];
    }

    preload(): void {
        // Assets đã được load bởi LoadingScene
    }

    create(): void {
        const { width, height } = this.scale;
        this.boundOnLanguageChanged = this.onLanguageChanged.bind(this);

        const background = this.add.image(width / 2, height / 2, 'background');
        background.setDisplaySize(width, height);

        HeaderUI.createHeaderUI(this, width, height);
        GradientText.createGameTitle(this, 'TEYVAT CARD', width / 2, height * 0.18);

        const selectedCharacter = dataManager.get<string>('selectedCharacter') ?? null;
        const characterLevel = dataManager.get<Record<string, number>>('characterLevel') ?? null;
        createCardSpreadContainer(this, width / 2, height * 0.5, this.cards, selectedCharacter, characterLevel);

        this.libraryButton = createMenuButton(
            this,
            width / 2 - width * 0.3,
            height * 0.8,
            'library',
            localizationManager.t('library'),
            'LibraryScene'
        );
        this.exploreButton = createMenuButton(
            this,
            width / 2,
            height * 0.8,
            'compass',
            localizationManager.t('explore'),
            'MapScenes'
        );
        this.equipButton = createMenuButton(
            this,
            width / 2 + width * 0.3,
            height * 0.8,
            'equip',
            localizationManager.t('equip'),
            'EquipScene'
        );

        this.testDevButton = this.add.text(width / 2, height * 0.95, localizationManager.t('test_dev'), {
            fontSize: '24px',
            color: themeManager.getNeutral(),
            fontFamily: 'Arial',
            stroke: themeManager.getSurface(),
            strokeThickness: 1
        }).setOrigin(0.5);
        this.testDevButton.on('pointerdown', () => {
            this.scene.stop('GameScene');
            this.scene.start('LoadingScene', { targetScene: 'GameScene' });
        });
        this.testDevButton.setInteractive({ useHandCursor: true });
        this.testDevButton.on('pointerover', () => {
            this.testDevButton!.setStyle({ color: themeManager.getText() });
        });
        this.testDevButton.on('pointerout', () => {
            this.testDevButton!.setStyle({ color: themeManager.getNeutral() });
        });

        const win = window as any;
        if (win.gameEvents?.on) {
            win.gameEvents.on('languageChanged', this.boundOnLanguageChanged);
        }

        if (soundManager.needsBGMOverlay()) {
            const bgmOverlay = this.add.rectangle(width / 2, height / 2, width + 100, height + 100, themeManager.getBackgroundPhaser(), 0);
            bgmOverlay.setInteractive({ useHandCursor: false });
            bgmOverlay.setDepth(1000);
            bgmOverlay.once('pointerdown', () => {
                bgmOverlay.destroy();
                soundManager.playBGM();
            });
        }
    }

    onLanguageChanged(): void {
        if (!this.scene.isActive() || !this.scene.isVisible()) return;
        try {
            if (this.libraryButton) updateMenuButtonText(this.libraryButton, 'library');
            if (this.exploreButton) updateMenuButtonText(this.exploreButton, 'explore');
            if (this.equipButton) updateMenuButtonText(this.equipButton, 'equip');
            if (this.testDevButton?.active) {
                this.testDevButton.setText(localizationManager.t('test_dev'));
            }
        } catch (error) {
            console.error('[MenuScene] Error in onLanguageChanged:', error);
        }
    }

    shutdown(): void {
        const win = window as any;
        if (win.gameEvents?.off && this.boundOnLanguageChanged) {
            win.gameEvents.off('languageChanged', this.boundOnLanguageChanged);
        }
    }
}
