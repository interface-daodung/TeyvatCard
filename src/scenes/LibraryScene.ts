import Phaser from 'phaser';
import { GradientText } from '../utils/GradientText.js';
import { HeaderUI } from '../utils/HeaderUI.js';
import { localizationManager } from '../core/LocalizationManager.js';
import { themeManager } from '../core/ThemeManager.js';
import {
    createBackButton,
    createCardPanel,
    showCardInfoDialog,
    createLibraryScrollPanel,
    type CardInfoDialogHandle,
    type ContainerWithCardData,
    type GameObjectWithChildren
} from '../components/LibraryScene/index.js';

export default class LibraryScene extends Phaser.Scene {
    private cardInfoDialogHandle?: CardInfoDialogHandle;
    private titleImage?: Phaser.GameObjects.Image;
    private boundOnLanguageChanged: () => void;

    constructor() {
        super({ key: 'LibraryScene' });
        this.boundOnLanguageChanged = this.onLanguageChanged.bind(this);
    }

    preload(): void {
        this.load.image('empty', 'assets/images/cards/empty.webp');
    }

    create(): void {
        const { width, height } = this.scale;

        this.add.image(width / 2, height / 2, 'background');
        this.add.rectangle(width / 2, height / 2, width, height, themeManager.getBackgroundPhaser()).setAlpha(0.5);

        this.titleImage = GradientText.createGameTitle(this, localizationManager.t('library_title'), width / 2, height * 0.12);
        HeaderUI.createHeaderUI(this, width, height);

        const cardPanel = createCardPanel(this);
        createLibraryScrollPanel(this, cardPanel as GameObjectWithChildren, (child: ContainerWithCardData) => {
            if (child.cardData) {
                this.cardInfoDialogHandle = showCardInfoDialog(this, child.cardData, () => {
                    this.cardInfoDialogHandle = undefined;
                });
            }
        });

        createBackButton(this, width, height, () => this.scene.start('MenuScene'));

        const win = window as any;
        if (win.gameEvents?.on) {
            win.gameEvents.on('languageChanged', this.boundOnLanguageChanged);
        }
    }

    onLanguageChanged(): void {
        console.log('[LibraryScene] onLanguageChanged event received');
        if (!this.scene.isActive() || !this.scene.isVisible()) {
            console.log('[LibraryScene] Scene not active/visible, skipping update');
            return;
        }
        try {
            if (this.titleImage && this.titleImage.active) {
                const { width, height } = this.scale;
                const x = this.titleImage.x;
                const y = this.titleImage.y;
                this.titleImage.destroy();
                this.titleImage = GradientText.createGameTitle(this, localizationManager.t('library_title'), x, y);
            }
            console.log('[LibraryScene] onLanguageChanged completed successfully');
        } catch (error) {
            console.error('[LibraryScene] Error in onLanguageChanged:', error);
        }
    }

    shutdown(): void {
        if (this.cardInfoDialogHandle) {
            this.cardInfoDialogHandle.hide();
            this.cardInfoDialogHandle = undefined;
        }
        const win = window as any;
        if (win.gameEvents?.off && this.boundOnLanguageChanged) {
            win.gameEvents.off('languageChanged', this.boundOnLanguageChanged);
        }
    }
}
