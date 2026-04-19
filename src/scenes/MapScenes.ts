import Phaser from 'phaser';
import { dataManager } from '../core/DataManager.js';
import { themeManager } from '../core/ThemeManager.js';
import { localizationManager } from '../core/LocalizationManager.js';
import TextureManager from '../core/TextureManager.js';
import { createDungeonButtons, createPaginationButtons } from '../components/MapScene/index.js';
import { GameTitle } from '../components/shared/index.js';
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
    private dungeonList: DungeonData[] = [];
    private boundOnLanguageChanged = (): void => {
        this.showCurrentPage();
    };

    constructor() {
        super({ key: 'MapScenes' });
        this.currentPage = 0;
    }

    init(): void {
        this.dungeonList = dataManager.getFlag<DungeonData[]>('dungeonList') ?? [];
    }

    preload(): void {}

    create(): void {
        const { width, height } = this.scale;

        TextureManager.image(this, width / 2, height / 2, 'background').setDisplaySize(width, height);
        this.add.rectangle(width / 2, height / 2, width, height, themeManager.getBackgroundPhaser()).setAlpha(0.5);
        GameTitle.create(this, width / 2, height * 0.18, 'dungeon_map');

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

        this.game.events.on('languageChanged', this.boundOnLanguageChanged);

        // Đảm bảo gỡ listener khi scene shutdown/destroy để không bị gọi trên scene đã hủy
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
        this.events.once(Phaser.Scenes.Events.DESTROY, this.shutdown, this);

        this.showCurrentPage();
    }

    private getDungeonDisplayName(dungeon: DungeonData): string {
        const i18nKey = `map.${dungeon.stageId}.name`;
        const translated = localizationManager.t(i18nKey);
        return translated === i18nKey ? dungeon.name : translated;
    }

    showCurrentPage(): void {
        const startIndex = this.currentPage * this.itemsPerPage;
        const endIndex = Math.min(startIndex + this.itemsPerPage, this.dungeonList.length);
        const currentPageData = this.dungeonList.slice(startIndex, endIndex);

        for (let i = 0; i < this.itemsPerPage; i++) {
            if (i < currentPageData.length) {
                const dungeon = currentPageData[i];
                this.updateDungeonButton(this.dungeonButtons[i], this.getDungeonDisplayName(dungeon), dungeon.stageId);
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

    shutdown(): void {
        this.game.events.off('languageChanged', this.boundOnLanguageChanged);
    }
}
