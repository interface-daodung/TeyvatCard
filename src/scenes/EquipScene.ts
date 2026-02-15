import Phaser from 'phaser';
import { dataManager } from '../core/DataManager.js';
import { localizationManager } from '../core/LocalizationManager.js';
import { GradientText } from '../utils/GradientText.js';
import { HeaderUI } from '../utils/HeaderUI.js';
import { themeManager } from '../core/ThemeManager.js';
import {
    createBackButton,
    createItemGrid,
    createEquipmentSlots,
    updateSlotDisplay,
    showItemDialog,
    type Item,
    type EquipmentSlot,
    type EquipItemData
} from '../components/EquipScene/index.js';

export default class EquipScene extends Phaser.Scene {
    public equipmentSlots: EquipmentSlot[];
    public listItems!: Map<string, EquipItemData>;
    private titleImage?: Phaser.GameObjects.Image;
    private boundOnLanguageChanged: () => void;

    constructor() {
        super({ key: 'EquipScene' });
        this.equipmentSlots = new Array(3).fill(null).map(() => ({ item: null, image: null as any }));
        this.boundOnLanguageChanged = this.onLanguageChanged.bind(this);
    }

    preload(): void {}

    create(): void {
        const { width, height } = this.scale;

        this.add.image(width / 2, height / 2, 'background');
        HeaderUI.createHeaderUI(this, width, height);
        this.titleImage = GradientText.createGameTitle(this, localizationManager.t('equip_title'), width / 2, height * 0.18);

        this.listItems = createItemGrid(this, width, height, (item: Item) => this.showItemDialog(item, false));
        createEquipmentSlots(this, width, height, this.equipmentSlots, (index: number) => {
            const slot = this.equipmentSlots[index];
            if (slot?.item) this.showItemDialog(slot.item, true);
        });

        createBackButton(this, width, height, () => {
            const validItems = this.equipmentSlots
                .filter(slot => slot?.item?.nameId)
                .map(slot => slot!.item!.nameId);
            dataManager.set('equipment', validItems.length > 0 ? validItems : null);
            this.scene.start('MenuScene');
        }, 'select');

        this.initializeEquipmentSlots();

        const win = window as any;
        if (win.gameEvents?.on) {
            win.gameEvents.on('languageChanged', this.boundOnLanguageChanged);
        }
    }

    onLanguageChanged(): void {
        if (!this.scene.isActive() || !this.scene.isVisible()) return;
        try {
            if (this.titleImage?.active) {
                const { x, y } = { x: this.titleImage.x, y: this.titleImage.y };
                this.titleImage.destroy();
                this.titleImage = GradientText.createGameTitle(this, localizationManager.t('equip_title'), x, y);
            }
        } catch (error) {
            console.error('[EquipScene] Error in onLanguageChanged:', error);
        }
    }

    shutdown(): void {
        const win = window as any;
        if (win.gameEvents?.off && this.boundOnLanguageChanged) {
            win.gameEvents.off('languageChanged', this.boundOnLanguageChanged);
        }
    }

    wake(): void {
        this.initializeEquipmentSlots();
    }

    addEquipmentSlot(item: Item): number | null {
        const index = this.equipmentSlots.findIndex(slot => slot.item === null);
        if (index !== -1) {
            updateSlotDisplay(this.equipmentSlots[index], item);
            return index;
        }
        return null;
    }

    clearEquipmentSlot(nameId: string): void {
        const index = this.equipmentSlots.findIndex(slot => slot?.item?.nameId === nameId);
        if (index !== -1) {
            updateSlotDisplay(this.equipmentSlots[index], null);
        }
    }

    isFullEquipmentSlot(): boolean {
        return this.equipmentSlots.every(slot => slot?.item !== null);
    }

    showItemDialog(item: Item, equipSlot: boolean): void {
        showItemDialog(this, item, equipSlot, {
            isFullEquipmentSlot: () => this.isFullEquipmentSlot(),
            addEquipmentSlot: (i) => this.addEquipmentSlot(i),
            clearEquipmentSlot: (id) => this.clearEquipmentSlot(id),
            listItems: this.listItems
        });
    }

    initializeEquipmentSlots(): void {
        try {
            const equipmentData = dataManager.get<string[] | null>('equipment');
            if (Array.isArray(equipmentData) && equipmentData.length > 0) {
                this.resetEquipmentSlots();
                equipmentData.forEach(nameId => {
                    if (nameId && this.listItems.has(nameId)) {
                        const itemData = this.listItems.get(nameId);
                        if (itemData?.item) {
                            this.addEquipmentSlot(itemData.item);
                            itemData.container?.setVisible(false);
                        }
                    }
                });
            } else {
                this.resetEquipmentSlots();
            }
        } catch {
            this.resetEquipmentSlots();
        }
    }

    resetEquipmentSlots(): void {
        this.listItems.forEach(itemData => {
            itemData.container?.setVisible(true);
        });
        this.equipmentSlots.forEach(slot => updateSlotDisplay(slot, null));
    }
}
