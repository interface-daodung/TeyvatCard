import Phaser from 'phaser';
import { dataManager } from '../core/DataManager.js';
import { HeaderUI } from '../utils/HeaderUI.js';
import { soundManager } from '../core/SoundManager.js';
import { themeManager } from '../core/ThemeManager.js';
import { GameTitle } from '../components/shared/index.js';
import {
    createCardSpreadContainer,
    createMenuButton,
    type CardCharacter,
    type MenuButtonResult
} from '../components/MenuScene/index.js';
import { createTestDevButton, createTestGraphicsRenderTextureButton } from '../components/TestDevButton.js';

export default class MenuScene extends Phaser.Scene {
    private cards: CardCharacter[] = [];
    private libraryButton?: MenuButtonResult;
    private exploreButton?: MenuButtonResult;
    private equipButton?: MenuButtonResult;

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

        const devButtonX = width / 2 - 120;
        const devButtonY = height * 0.95;

        createTestDevButton(this, devButtonX, devButtonY, {
            onClick: () => {
                this.scene.stop('GameScene');
                this.scene.start('LoadingScene', { targetScene: 'GameScene' });
            }
        });

        createTestGraphicsRenderTextureButton(this, devButtonX + 240, devButtonY, {
            onClick: () => {
                this.scene.start('TestGraphicsRenderTexture');
            }
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
