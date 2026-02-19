import Phaser from 'phaser';
import { dataManager } from '../core/DataManager.js';
import { HeaderUI } from '../utils/HeaderUI.js';
import { soundManager } from '../core/SoundManager.js';
import { themeManager } from '../core/ThemeManager.js';
import { GameTitle, I18nText } from '../components/shared/index.js';
import {
    createCardSpreadContainer,
    createMenuButton,
    type CardCharacter,
    type MenuButtonResult
} from '../components/MenuScene/index.js';

export default class MenuScene extends Phaser.Scene {
    private cards: CardCharacter[] = [];
    private libraryButton?: MenuButtonResult;
    private exploreButton?: MenuButtonResult;
    private equipButton?: MenuButtonResult;
    private testDevButton?: I18nText;

    constructor() {
        super({ key: 'MenuScene' });
    }

    init(): void {
        this.cards = (dataManager.getFlag<CardCharacter[]>('cardCharacterList') ?? []) as CardCharacter[];
    }

    preload(): void {
        // Assets đã được load bởi LoadingScene
    }

    create(): void {
        const { width, height } = this.scale;

        const background = this.add.image(width / 2, height / 2, 'background');
        background.setDisplaySize(width, height);

        HeaderUI.createHeaderUI(this, width, height);
        GameTitle.create(this, width / 2, height * 0.18, 'menu_title');

        const selectedCharacter = dataManager.get<string>('selectedCharacter') ?? null;
        const characterLevel = dataManager.get<Record<string, number>>('characterLevel') ?? null;
        createCardSpreadContainer(this, width / 2, height * 0.5, this.cards, selectedCharacter, characterLevel);

        this.libraryButton = createMenuButton(this, width / 2 - width * 0.3, height * 0.8, 'library', 'library', 'LibraryScene');
        this.exploreButton = createMenuButton(this, width / 2, height * 0.8, 'compass', 'explore', 'MapScenes');
        this.equipButton = createMenuButton(this, width / 2 + width * 0.3, height * 0.8, 'equip', 'equip', 'EquipScene');

        this.testDevButton = I18nText.create(this, width / 2, height * 0.95, 'test_dev', {
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

    shutdown(): void {}
}
