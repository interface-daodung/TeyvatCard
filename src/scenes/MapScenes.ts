import Phaser from 'phaser';
import { GradientText } from '../utils/GradientText.js';
import { localizationManager } from '../utils/LocalizationManager.js';
import { themeManager } from '../core/ThemeManager.js';
import dungeonList from '../data/dungeonList.json';
import { createDungeonButtons, createPaginationButtons } from '../components/MapScene/index.js';
import type { DungeonData } from '../components/MapScene/index.js';

export default class MapScenes extends Phaser.Scene {
    private currentPage: number;
    private readonly itemsPerPage = 5;
    private dungeonButtons: Phaser.GameObjects.Container[] = [];
    private dungeonContainer!: Phaser.GameObjects.Container;
    private prevButton!: Phaser.GameObjects.Text;
    private nextButton!: Phaser.GameObjects.Text;
    private updateDungeonButton!: (buttonContainer: Phaser.GameObjects.Container, newName: string, newStageId: string) => void;
    private updatePaginationButtons!: (currentPage: number, maxPage: number) => void;
    private readonly dungeonList = dungeonList as DungeonData[];

    constructor() {
        super({ key: 'MapScenes' });
        this.currentPage = 0;
    }

    preload(): void {}

    create(): void {
        const { width, height } = this.scale;

        this.add.image(width / 2, height / 2, 'background');
        this.add.rectangle(width / 2, height / 2, width, height, themeManager.getBackgroundPhaser()).setAlpha(0.5);
        GradientText.createGameTitle(this, localizationManager.t('dungeon_map'), width / 2, height * 0.18);

        const dungeonResult = createDungeonButtons(this, width, height, this.itemsPerPage, (stageId: string) => {
            this.scene.stop('GameScene');
            this.scene.start('LoadingScene', { targetScene: 'GameScene', dataTargetScene: { stageId } });
        });
        this.dungeonContainer = dungeonResult.dungeonContainer;
        this.dungeonButtons = dungeonResult.dungeonButtons;
        this.updateDungeonButton = dungeonResult.updateDungeonButton;

        const paginationResult = createPaginationButtons(this, width, height);
        this.prevButton = paginationResult.prevButton;
        this.nextButton = paginationResult.nextButton;
        this.updatePaginationButtons = paginationResult.updatePaginationButtons;

        this.prevButton.on('pointerdown', () => {
            if (this.prevButton.text === '«') {
                this.scene.start('MenuScene');
            } else {
                this.previousPage();
            }
        });
        this.nextButton.on('pointerdown', () => this.nextPage());

        this.showCurrentPage();
    }

    showCurrentPage(): void {
        const startIndex = this.currentPage * this.itemsPerPage;
        const endIndex = Math.min(startIndex + this.itemsPerPage, this.dungeonList.length);
        const currentPageData = this.dungeonList.slice(startIndex, endIndex);

        for (let i = 0; i < this.itemsPerPage; i++) {
            if (i < currentPageData.length) {
                const dungeon = currentPageData[i];
                this.updateDungeonButton(this.dungeonButtons[i], dungeon.name, dungeon.stageId);
                this.dungeonButtons[i].setVisible(true);
            } else {
                this.dungeonButtons[i].setVisible(false);
            }
        }

        const maxPage = Math.ceil(this.dungeonList.length / this.itemsPerPage) - 1;
        this.updatePaginationButtons(this.currentPage, maxPage);
    }

    previousPage(): void {
        if (this.currentPage > 0) {
            this.currentPage--;
            this.showCurrentPage();
        }
    }

    nextPage(): void {
        const maxPage = Math.ceil(this.dungeonList.length / this.itemsPerPage) - 1;
        if (this.currentPage < maxPage) {
            this.currentPage++;
            this.showCurrentPage();
        }
    }
}
