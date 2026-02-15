import Phaser from 'phaser';
import GameManager from '../core/GameManager.js';
import { themeManager } from '../core/ThemeManager.js';
import dungeonList from '../data/dungeonList.json';
import {
    createGameUI,
    createItemButton,
    createItemButtonsFromStorage,
    showItemNotReadyToast,
    createSellWeapon,
    type ItemData,
    type ItemButton,
    type SellButton
} from '../components/GameScene/index.js';

interface SceneData {
    stageId?: string;
}

interface DungeonData {
    stageId: string;
    name: string;
}

export default class GameScene extends Phaser.Scene {
    public stageId!: string;
    public dungeonStageName!: string;
    public gameManager!: GameManager;
    public stageText!: Phaser.GameObjects.Text;
    public highScoreText!: Phaser.GameObjects.Text;
    public coinText!: Phaser.GameObjects.Text;
    public itemEquipment!: ItemButton[];
    public sellButton!: SellButton;

    constructor() {
        super({ key: 'GameScene' });
    }

    init(data?: SceneData): void {
        const { stageId } = data || {};
        this.stageId = stageId || 'dungeon_abyss_chamber';
        const dungeon = (dungeonList as DungeonData[]).find(d => d.stageId === this.stageId);
        this.dungeonStageName = dungeon?.name || '';
        this.gameManager = new GameManager(this);
    }

    create(): void {
        const { width, height } = this.scale;

        this.add.image(width / 2, height / 2, 'background');
        this.add.rectangle(width / 2, height / 2, width, height, themeManager.getBackgroundPhaser()).setAlpha(0.5);

        const uiRefs = createGameUI(
            this,
            width,
            height,
            this.dungeonStageName,
            this.gameManager.highScore,
            this.gameManager.coin,
            () => this.scene.start('MenuScene')
        );
        this.stageText = uiRefs.stageText;
        this.highScoreText = uiRefs.highScoreText;
        this.coinText = uiRefs.coinText;

        this.itemEquipment = [];
        const itemButtonsData = createItemButtonsFromStorage();
        const itemSpacing = 90;
        const startX = width * 0.18;
        itemButtonsData.forEach((item, index) => {
            this.itemEquipment.push(
                createItemButton(
                    this,
                    startX + index * itemSpacing,
                    height * 0.15,
                    item,
                    (itemData: ItemData) => itemData.effect(this.gameManager),
                    () => showItemNotReadyToast(this)
                )
            );
        });
        this.gameManager.setItemEquipment(this.itemEquipment);

        this.gameManager.cardManager.initializeCreateDeck();

        const cardCharacter = this.gameManager.cardManager.CardCharacter as any;
        this.sellButton = createSellWeapon(
            this,
            width * 0.75,
            height * 0.95,
            () => cardCharacter?.weapon,
            () => {
                const weapon = cardCharacter?.weapon;
                if (weapon?.durability > 0) {
                    this.gameManager.addCoin(weapon.durability);
                    cardCharacter.weapon = null;
                    cardCharacter.weaponDisplay?.updateText(0);
                    cardCharacter.weaponBadgeDisplay?.updateTexture('');
                    this.sellButton.hideButton();
                }
            }
        );
    }
}
