import Phaser from 'phaser';
import { HeaderUI } from '../utils/HeaderUI.js';
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
import { GameTitle } from '../components/shared/index.js';
import { Log } from '../utils/Log.js';

export default class LibraryScene extends Phaser.Scene {
    private cardInfoDialogHandle?: CardInfoDialogHandle;

    constructor() {
        super({ key: 'LibraryScene' });
    }

    preload(): void {
        this.load.image('empty', 'assets/images/cards/empty.webp');
        Log.error('LibraryScene preload');
    }

    create(): void {
        const { width, height } = this.scale;

        this.add.image(width / 2, height / 2, 'background');
        this.add.rectangle(width / 2, height / 2, width, height, themeManager.getBackgroundPhaser()).setAlpha(0.5);

        GameTitle.create(this, width / 2, height * 0.12, 'library_title');
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
    }

    shutdown(): void {
        if (this.cardInfoDialogHandle) {
            this.cardInfoDialogHandle.hide();
            this.cardInfoDialogHandle = undefined;
        }
    }
}
