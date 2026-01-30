import Phaser from 'phaser';
import itemFactory from '../modules/ItemFactory.js';
import { GradientText } from '../utils/GradientText.js';
import { HeaderUI } from '../utils/HeaderUI.js';

interface Item {
    name: string;
    nameId: string;
    image: string;
    level: number;
    power: number;
    cooldown: number;
    description: string;
    isUpgrade: () => boolean;
    upgrade: () => boolean;
    getPrice: () => number;
}

interface EquipmentSlot {
    item: Item | null;
    image: Phaser.GameObjects.Image;
}

interface ItemData {
    item: Item;
    container: Phaser.GameObjects.Container | null;
}

export default class EquipScene extends Phaser.Scene {
    public equipmentSlots: EquipmentSlot[];
    public headerUI!: any;
    public listItems!: Map<string, ItemData>;

    constructor() {
        super({ key: 'EquipScene' });
        // Tạo mảng cố định 3 phần tử, ban đầu tất cả đều null
        this.equipmentSlots = new Array(3).fill(null).map(() => ({
            item: null,
            image: null as any
        }));
    }

    preload(): void {
        // Không cần preload gì vì assets đã được load bởi LoadingScene
    }

    create(): void {
        const { width, height } = this.scale;

        // Background
        this.add.image(width / 2, height / 2, 'background');

        // Tạo UI header (coin và settings)
        this.headerUI = HeaderUI.createHeaderUI(this, width, height);

        // Tiêu đề "TRANG BỊ" Tạo hiệu ứng gradient cho viền bằng cách thêm nhiều layer text
        GradientText.createGameTitle(this, 'TRANG BỊ', width / 2, height * 0.18);

        // Tạo lưới 4x3 các item
        this.createItemGrid(width, height);

        // Tạo 3 Equipment Slots
        this.createEquipmentSlots(width, height);

        // Nút quay về Menu
        this.createBackButton(width, height);

        // Khởi tạo equipment slots từ localStorage
        this.initializeEquipmentSlots();

    }

    /**
     * Được gọi khi Scene được kích hoạt lại (wake up)
     */
    wake(): void {
        console.log('EquipScene woke up - reinitializing equipment slots');
        // Khởi tạo lại equipment slots khi quay lại scene
        this.initializeEquipmentSlots();
    }

    createItemGrid(width: number, height: number): void {
        const gridWidth = 4;  // 4 cột
        const gridHeight = 3; // 3 hàng
        const itemSize = 120;  // Kích thước mỗi item
        const spacing = 20;   // Khoảng cách giữa các item

        // Lấy danh sách items từ ItemFactory và tạo Map lưu trữ item objects và containers
        const itemKeys = itemFactory.getItemKeys();
        this.listItems = new Map<string, ItemData>(); // Lưu trữ {item: item, container: null} để dùng chung

        // Tạo item objects và lưu vào Map với container = null ban đầu
        itemKeys.forEach(itemKey => {
            const item = itemFactory.createItem(itemKey) as Item;
            if (item) {
                this.listItems.set(itemKey, {
                    item: item,
                    container: null
                });
            }
        });

        // Tính toán vị trí bắt đầu để căn giữa lưới
        const startX = width / 2 - (gridWidth * (itemSize + spacing) - spacing) / 2;
        const startY = height * 0.25;

        // Tạo background cho toàn bộ grid
        const gridBgWidth = gridWidth * itemSize + (gridWidth - 1) * spacing + 40; // Thêm padding 20px mỗi bên
        const gridBgHeight = gridHeight * itemSize + (gridHeight - 1) * spacing + 40;
        const gridBgX = width / 2;
        const gridBgY = startY + (gridHeight * (itemSize + spacing) - spacing) / 2;

        // Background đen trong suốt 50% với bo tròn sử dụng graphics
        const gridBackground = this.add.graphics();
        gridBackground.fillStyle(0x000000, 0.5); // Đen với alpha 0.5
        gridBackground.fillRoundedRect(-gridBgWidth / 2, -gridBgHeight / 2, gridBgWidth, gridBgHeight, 20); // Bo tròn 20px
        gridBackground.strokeRoundedRect(-gridBgWidth / 2, -gridBgHeight / 2, gridBgWidth, gridBgHeight, 20);
        // Tạo container cho toàn bộ grid
        const gridContainer = this.add.container(gridBgX, gridBgY);
        gridContainer.add(gridBackground);

        // Tạo lưới items
        for (let row = 0; row < gridHeight; row++) {
            for (let col = 0; col < gridWidth; col++) {
                const index = row * gridWidth + col;
                const itemKey = itemKeys[index];

                if (!itemKey) continue;

                // Tính toán vị trí tương đối so với gridContainer (0,0)
                const relativeX = (col - (gridWidth - 1) / 2) * (itemSize + spacing);
                const relativeY = (row - (gridHeight - 1) / 2) * (itemSize + spacing);

                // Tạo item container với vị trí tương đối so với gridContainer
                const itemContainer = this.add.container(relativeX, relativeY);

                // Background của item với bo tròn sử dụng graphics
                const itemBg = this.add.graphics();
                itemBg.fillStyle(0x808080, 0.3); // Xám với alpha 30%
                itemBg.fillRoundedRect(-itemSize / 2, -itemSize / 2, itemSize, itemSize, 15); // Bo tròn 15px
                itemBg.strokeRoundedRect(-itemSize / 2, -itemSize / 2, itemSize, itemSize, 15);

                // Icon item từ assets thật
                const itemIcon = this.add.image(0, 0, 'item', itemKey);
                itemIcon.setDisplaySize(itemSize, itemSize); // Tăng tỉ lệ lên 80% (từ 60%)
                itemIcon.setOrigin(0.5);

                // Thêm vào item container
                itemContainer.add([itemBg, itemIcon]);

                // Thêm item container vào grid container
                gridContainer.add(itemContainer);

                // Lưu container vào listItems để có thể ẩn/hiện sau này
                const itemData = this.listItems.get(itemKey);
                if (itemData) {
                    itemData.container = itemContainer;
                }

                // Làm cho item có thể click
                itemContainer.setInteractive(new Phaser.Geom.Rectangle(-itemSize / 2, -itemSize / 2, itemSize, itemSize), Phaser.Geom.Rectangle.Contains);

                // Hiệu ứng hover
                itemContainer.on('pointerover', () => {
                    itemContainer.setScale(1.1);
                });

                itemContainer.on('pointerout', () => {
                    itemContainer.setScale(1);
                });

                // Event click
                itemContainer.on('pointerdown', () => {
                    console.log(`Item clicked: ${itemKey} at Row ${row}, Col ${col}`);
                    // Lấy item object từ Map thay vì tạo mới
                    const itemData = this.listItems.get(itemKey);
                    if (itemData && itemData.item) {
                        this.showItemDialog(itemData.item, false);
                    }
                });
            }
        }
    }

    createEquipmentSlots(width: number, height: number): void {
        const slotWidth = 3;  // 3 cột
        const slotSize = 120; // Kích thước mỗi slot (nhỏ hơn item)
        const slotSpacing = 30; // Khoảng cách giữa các slot
        //x ≈ 158.18px, spacing' ≈ 26.36px
        // Tính toán vị trí bắt đầu để căn giữa
        const startSlotY = height * 0.7; // Đặt ở 70% height, dưới item grid

        const slotBgX = width / 2;
        const slotBgY = startSlotY;

        // Tạo container cho equipment slots
        const slotGridContainer = this.add.container(slotBgX, slotBgY);

        // Tạo 3 equipment slots
        for (let col = 0; col < slotWidth; col++) {
            // Tính toán vị trí tương đối so với slotGridContainer
            const relativeSlotX = (col - (slotWidth - 1) / 2) * (slotSize + slotSpacing);

            // Tạo slot container
            const slotContainer = this.add.container(relativeSlotX, 0);

            // Background của slot
            const slotBg = this.add.graphics();
            slotBg.fillStyle(0x808080, 0.5); // Xám đậm với alpha 50%
            slotBg.lineStyle(2, 0x000000, 0.5); // Viền đen
            slotBg.fillRoundedRect(-slotSize / 2, -slotSize / 2, slotSize, slotSize, 10);
            slotBg.strokeRoundedRect(-slotSize / 2, -slotSize / 2, slotSize, slotSize, 10);

            // Tạo slot image dựa trên item trong slot
            let slotImage: Phaser.GameObjects.Image;
            if (this.equipmentSlots[col] && this.equipmentSlots[col].item) {
                // Nếu có item, hiển thị item icon
                slotImage = this.add.image(0, 0, 'item', this.equipmentSlots[col].item!.image);
                slotImage.setDisplaySize(slotSize, slotSize); // Kích thước đầy đủ
            } else {
                // Nếu không có item, hiển thị equipment-slot placeholder
                slotImage = this.add.image(0, 0, 'item', 'equipment-slot');
                slotImage.setDisplaySize(slotSize * 0.8, slotSize * 0.8); // Kích thước 80%
                slotImage.setAlpha(0.3); // Làm ảnh trong suốt 50%
            }
            slotImage.setOrigin(0.5);

            // Thêm vào slot container
            slotContainer.add([slotBg, slotImage]);

            // Thêm slot container vào slot grid container
            slotGridContainer.add(slotContainer);

            // Lưu slot container vào equipmentSlots để có thể ẩn/hiện sau này
            this.equipmentSlots[col] = {
                item: null,
                image: slotImage // Lưu reference đến image để có thể thay đổi sau này
            };

            // Làm cho slot có thể click
            slotContainer.setInteractive(new Phaser.Geom.Rectangle(-slotSize / 2, -slotSize / 2, slotSize, slotSize), Phaser.Geom.Rectangle.Contains);

            // Hiệu ứng hover - chỉ khi có item
            slotContainer.on('pointerover', () => {
                if (this.equipmentSlots[col] && this.equipmentSlots[col].item) {
                    slotContainer.setScale(1.1);
                }
            });

            slotContainer.on('pointerout', () => {
                if (this.equipmentSlots[col] && this.equipmentSlots[col].item) {
                    slotContainer.setScale(1);
                }
            });

            // Event click - chỉ khi có item
            slotContainer.on('pointerdown', () => {
                console.log(`Equipment slot clicked: Column ${col}`);
                if (this.equipmentSlots[col] && this.equipmentSlots[col].item) {
                    this.showItemDialog(this.equipmentSlots[col].item!, true);
                }
            });
        }
    }

    // Phương thức tiện ích để thao tác với equipment slots
    addEquipmentSlot(item: Item): number | null {
        const index = this.equipmentSlots.findIndex(slot => slot.item === null);
        if (index !== -1) {
            this.equipmentSlots[index].item = item;

            // Cập nhật image trong slot
            const slotData = this.equipmentSlots[index];
            if (slotData.image) {
                // Tái sử dụng image cũ, chỉ cập nhật texture và thuộc tính
                slotData.image.setTexture('item', item.image);
                slotData.image.setDisplaySize(120, 120); // slotSize
                slotData.image.setAlpha(1); // Hiển thị đầy đủ
            }

            return index;
        }
        return null;
    }

    getEquipmentSlot(index: number): EquipmentSlot | null {
        if (index >= 0 && index < 3) {
            return this.equipmentSlots[index];
        }
        console.warn('Equipment slot index out of bounds');
        return null;
    }

    clearEquipmentSlot(nameId: string): void {
        // Tìm index của slot có item với nameId tương ứng
        const index = this.equipmentSlots.findIndex(slot => slot && slot.item && slot.item.nameId === nameId);

        if (index !== -1) {
            const slotData = this.equipmentSlots[index];
            if (slotData) {
                // Xóa item
                slotData.item = null;

                // Cập nhật image về equipment-slot placeholder
                if (slotData.image) {
                    // Tái sử dụng image cũ, chỉ cập nhật texture và thuộc tính
                    slotData.image.setTexture('item', 'equipment-slot');
                    slotData.image.setDisplaySize(120 * 0.8, 120 * 0.8); // slotSize * 0.8
                    slotData.image.setAlpha(0.3); // Làm ảnh trong suốt
                }
            }
        } else {
            console.warn(`Item with nameId '${nameId}' not found in equipment slots`);
        }
    }

    /**
     * Kiểm tra xem tất cả equipment slots đã đầy chưa
     */
    isFullEquipmentSlot(): boolean {
        return this.equipmentSlots.every(slot => slot && slot.item !== null);
    }

    /**
     * Tạo dialog hiển thị thông tin item
     */
    showItemDialog(item: Item, equipSlot = false): void {
        const { width, height } = this.scale;

        // Tạo background overlay
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.8); // #1f0614 với alpha 0.9
        overlay.fillRect(0, 0, width, height);

        // Tạo dialog container - 90% width
        const dialogWidth = Math.floor(width * 0.9);
        const dialogHeight = 500;
        const dialogX = width / 2;
        const dialogY = height / 2;

        const dialogContainer = this.add.container(dialogX, dialogY);

        // Background dialog
        const dialogBg = this.add.graphics();
        dialogBg.fillStyle(0x2d0d21, 0.98); // #2d0d21 với alpha 0.98
        dialogBg.lineStyle(3, 0x96576a, 1); // #96576a làm viền
        dialogBg.fillRoundedRect(-dialogWidth / 2, -dialogHeight / 2, dialogWidth, dialogHeight, 20);
        dialogBg.strokeRoundedRect(-dialogWidth / 2, -dialogHeight / 2, dialogWidth, dialogHeight, 20);

        // Tiêu đề dialog
        const titleText = this.add.text(0, -dialogHeight / 2 + 30,
            `${item.name}`, {
            fontSize: '32px', // Tăng font size
            color: '#ffffff', // Chữ trắng
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Tiêu đề levelText
        const levelText = this.add.text(0, -dialogHeight / 2 + 60,
            `Level: ${item.level}`, {
            fontSize: '16px', // Tăng font size
            color: '#ffffff', // Chữ trắng
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Icon item - căn giữa theo chiều ngang
        const itemIcon = this.add.image(0, -120, 'item', item.image);
        itemIcon.setDisplaySize(180, 180); // Tăng kích thước icon
        itemIcon.setOrigin(0.5);

        // Thông tin item - tách thành 2 phần riêng biệt

        // 1. Description - text bình thường
        const descriptionText = this.add.text(0, 0, item.description, {
            fontSize: '24px',
            color: '#ffffff', // Chữ trắng
            fontFamily: 'Arial, sans-serif',
            lineSpacing: 10
        }).setOrigin(0.5);

        // 2. Power và Cooldown - có background riêng biệt

        // Power background và text
        const powerBg = this.add.graphics();
        const powerWidth = 180;
        const powerHeight = 40;
        const powerX = -120;
        const powerY = 80;

        // Vẽ background cho Power
        powerBg.fillStyle(0x96576a, 0.9); // Màu nền #96576a
        powerBg.lineStyle(2, 0x1f0614, 1); // Viền màu #1f0614
        powerBg.fillRoundedRect(powerX - powerWidth / 2, powerY - powerHeight / 2, powerWidth, powerHeight, 10);
        powerBg.strokeRoundedRect(powerX - powerWidth / 2, powerY - powerHeight / 2, powerWidth, powerHeight, 10);

        // Text cho Power
        const powerText = this.add.text(powerX, powerY, `Power⚔️ : ${item.power}`, {
            fontSize: '18px',
            color: '#ffffff', // Chữ trắng
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Cooldown background và text
        const cooldownBg = this.add.graphics();
        const cooldownWidth = 180;
        const cooldownHeight = 40;
        const cooldownX = 120;
        const cooldownY = 80;

        // Vẽ background cho Cooldown
        cooldownBg.fillStyle(0x96576a, 0.9); // Màu nền #96576a
        cooldownBg.lineStyle(2, 0x1f0614, 1); // Viền màu #1f0614
        cooldownBg.fillRoundedRect(cooldownX - cooldownWidth / 2, cooldownY - cooldownHeight / 2, cooldownWidth, cooldownHeight, 10);
        cooldownBg.strokeRoundedRect(cooldownX - cooldownWidth / 2, cooldownY - cooldownHeight / 2, cooldownWidth, cooldownHeight, 10);

        // Text cho Cooldown
        const cooldownText = this.add.text(cooldownX, cooldownY, `Cooldown⏱️ : ${item.cooldown}`, {
            fontSize: '18px',
            color: '#ffffff', // Chữ trắng
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Tạo container cho các nút để đặt cùng hàng
        const buttonContainer = this.add.container(0, dialogHeight / 2 - 50);

        // Tạo priceText ở cùng tầng với upgradeButton
        const priceText = this.add.text(-200, -42, `🪙${item.getPrice()}`, {
            fontSize: '20px',
            color: '#ffffff',
            fontStyle: 'bold',
            fontFamily: 'Arial, sans-serif',
        }).setOrigin(0.5);

        // Ẩn priceText ban đầu bằng alpha
        priceText.setAlpha(0);

        // Nút Upgrade - luôn hiển thị, thay đổi trạng thái theo level
        const upgradeButton = this.add.text(-200, 0, item.level === 0
            ? 'UNLOCK'
            : item.isUpgrade()
                ? 'UPGRADE'
                : 'LEVEL MAX', {
            fontSize: '20px', // Tăng font size thêm
            color: '#ffffff', // Chữ trắng
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold',
            backgroundColor: item.isUpgrade() ? '#622945' : '#45162c', // Màu khác nhau theo trạng thái
            padding: { x: 25, y: 12 } // Tăng padding thêm
        }).setOrigin(0.5);

        // Thêm viền cho nút upgrade
        upgradeButton.setStroke('#45162c', 2); // Viền màu #45162c

        // Chỉ cho phép tương tác nếu có thể upgrade
        if (item.isUpgrade()) {
            upgradeButton.setInteractive({ useHandCursor: true });

            upgradeButton.on('pointerover', () => {
                upgradeButton.setScale(1.1);
                // Hiển thị priceText bằng alpha
                priceText.setAlpha(1);
            });

            upgradeButton.on('pointerout', () => {
                upgradeButton.setScale(1);
                // Ẩn priceText bằng alpha
                priceText.setAlpha(0);
            });

            upgradeButton.on('pointerdown', () => {
                if (item.upgrade()) {
                    // Cập nhật thông tin hiển thị
                    descriptionText.setText(item.description);
                    powerText.setText(`Power⚔️ : ${item.power}`);
                    cooldownText.setText(`Cooldown⏱️ : ${item.cooldown}`);
                    levelText.setText(`Level: ${item.level}`);

                    // Cập nhật priceText sau khi upgrade
                    priceText.setText(`🪙${item.getPrice()}`);

                    // Cập nhật nút upgrade sau khi upgrade
                    if (!item.isUpgrade()) {
                        // Đã max level - đổi text và màu, không cho tương tác
                        upgradeButton.setText('LEVEL MAX');
                        upgradeButton.setStyle({ backgroundColor: '#45162c' });
                        upgradeButton.disableInteractive();
                        upgradeButton.off('pointerover');
                        upgradeButton.off('pointerout');
                        upgradeButton.off('pointerdown');

                        // Ẩn priceText khi đã max level
                        priceText.setAlpha(0);
                    } else {
                        if (item.level > 0) {
                            upgradeButton.setText('UPGRADE');
                        }
                    }
                }
            });
        } else {
            // Đã max level - không cho tương tác
            upgradeButton.disableInteractive();
        }

        // Nút Select (ở giữa)
        const selectButton = this.add.text(0, 0, equipSlot ? 'DESELECT' : 'SELECT', {
            fontSize: '20px', // Tăng font size thêm
            color: '#ffffff', // Chữ trắng
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold',
            backgroundColor: '#622945', // Cùng màu nền #622945
            padding: { x: 25, y: 12 } // Tăng padding thêm
        }).setOrigin(0.5);

        // Thêm viền cho nút select
        selectButton.setStroke('#45162c', 2); // Viền màu #45162c

        // Kiểm tra nếu equipment slots đã đầy và không phải equipSlot thì ẩn nút SELECT
        if (!equipSlot && this.isFullEquipmentSlot()) {
            selectButton.setVisible(false);
        } else {
            // Làm cho nút select có thể click
            selectButton.setInteractive({ useHandCursor: true });
            selectButton.on('pointerover', () => selectButton.setScale(1.1));
            selectButton.on('pointerout', () => selectButton.setScale(1));
            selectButton.on('pointerdown', () => {
                console.log(`Select item: ${item.name}`);
                // TODO: Thêm logic xử lý select item
                if (equipSlot) {
                    this.clearEquipmentSlot(item.nameId);
                    const itemData = this.listItems.get(item.nameId);
                    if (itemData && itemData.container) {
                        itemData.container.setVisible(true);
                    }
                    overlay.destroy();
                    dialogContainer.destroy();
                    this.input.keyboard.off('keydown-ESC');
                } else {
                    this.addEquipmentSlot(item);
                    const itemData = this.listItems.get(item.nameId);
                    if (itemData && itemData.container) {
                        itemData.container.setVisible(false);
                    }
                    overlay.destroy();
                    dialogContainer.destroy();
                    this.input.keyboard.off('keydown-ESC');
                }
            });
        }

        // Nút Close
        const closeButton = this.add.text(200, 0, 'CLOSE', {
            fontSize: '20px', // Tăng font size thêm
            color: '#ffffff', // Chữ trắng
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold',
            backgroundColor: '#622945', // Cùng màu nền #622945
            padding: { x: 25, y: 12 } // Tăng padding thêm
        }).setOrigin(0.5);

        // Thêm viền cho nút close
        closeButton.setStroke('#45162c', 2); // Viền màu #45162c

        closeButton.setInteractive({ useHandCursor: true });
        closeButton.on('pointerover', () => closeButton.setScale(1.1));
        closeButton.on('pointerout', () => closeButton.setScale(1));
        closeButton.on('pointerdown', () => {
            // Xóa dialog
            overlay.destroy();
            dialogContainer.destroy();
            // Xóa event listener ESC
            this.input.keyboard.off('keydown-ESC');
        });

        // Thêm buttons vào button container
        if (upgradeButton) {
            buttonContainer.add(upgradeButton);
            // Thêm priceText vào buttonContainer
            buttonContainer.add(priceText);
        }
        buttonContainer.add(selectButton);
        buttonContainer.add(closeButton);

        // Thêm tất cả vào dialog container
        const dialogElements = [dialogBg, titleText, levelText, itemIcon, descriptionText, powerBg, powerText, cooldownBg, cooldownText, buttonContainer];
        dialogContainer.add(dialogElements);

        // Làm cho overlay có thể tương tác để chặn click vào bên dưới
        overlay.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);
        // Không thêm event listener để overlay không làm gì khi click

        // Thêm event listener cho phím ESC
        this.input.keyboard.on('keydown-ESC', () => {
            overlay.destroy();
            dialogContainer.destroy();
            // Xóa event listener để tránh memory leak
            this.input.keyboard.off('keydown-ESC');
        });
    }

    createBackButton(width: number, height: number): void {
        // Nút quay về Menu
        const backButton = this.add.text(width * 0.5, height * 0.9, 'SELECT', {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold',
            backgroundColor: '#622945',
            padding: { x: 25, y: 12 }
        }).setOrigin(0.5);

        // Làm cho nút có thể click
        backButton.setInteractive({ useHandCursor: true });

        // Hiệu ứng hover
        backButton.on('pointerover', () => {
            backButton.setScale(1.1);
            backButton.setTint(0xd1d1d1);
        });

        backButton.on('pointerout', () => {
            backButton.setScale(1);
            backButton.clearTint();
        });

        // Event click
        backButton.on('pointerdown', () => {
            // Lọc ra những item có ý nghĩa từ equipmentSlots
            const validItems = this.equipmentSlots
                .filter(slot => slot && slot.item && slot.item.nameId)
                .map(slot => slot.item!.nameId);

            // Nếu không có item nào có ý nghĩa thì lưu null, ngược lại lưu array các nameId
            const equipmentData = validItems.length > 0 ? validItems : null;
            localStorage.setItem('equipment', JSON.stringify(equipmentData));

            // Chuyển về MenuScene
            this.scene.start('MenuScene');
        });
    }

    /**
     * Khởi tạo equipment slots từ localStorage
     * Nếu có dữ liệu đã lưu thì khôi phục các item vào slots
     */
    initializeEquipmentSlots(): void {
        try {
            const savedEquipment = localStorage.getItem('equipment');
            if (savedEquipment && savedEquipment !== 'null') {
                const equipmentData = JSON.parse(savedEquipment) as string[];

                // Kiểm tra nếu equipmentData là array và có dữ liệu
                if (Array.isArray(equipmentData) && equipmentData.length > 0) {
                    // Reset trước khi khôi phục
                    this.resetEquipmentSlots();

                    equipmentData.forEach(nameId => {
                        if (nameId && this.listItems.has(nameId)) {
                            // Lấy item từ listItems
                            const itemData = this.listItems.get(nameId);
                            if (itemData && itemData.item) {
                                // Thêm item vào equipment slot
                                this.addEquipmentSlot(itemData.item);
                                // Ẩn item trong grid
                                if (itemData.container) {
                                    itemData.container.setVisible(false);
                                }
                            }
                        }
                    });
                    console.log('Equipment slots initialized from localStorage:', equipmentData);
                } else {
                    // Nếu không có dữ liệu, chỉ reset về trạng thái ban đầu
                    this.resetEquipmentSlots();
                }
            } else {
                // Nếu localStorage rỗng, reset về trạng thái ban đầu
                this.resetEquipmentSlots();
            }
        } catch (error) {
            console.error('Error initializing equipment slots:', error);
            // Nếu có lỗi, reset về trạng thái ban đầu
            this.resetEquipmentSlots();
        }
    }

    /**
     * Reset equipment slots về trạng thái ban đầu
     */
    resetEquipmentSlots(): void {
        // Hiển thị lại tất cả items trong grid
        this.listItems.forEach((itemData) => {
            if (itemData.container) {
                itemData.container.setVisible(true);
            }
        });

        // Reset từng equipment slot về trạng thái ban đầu
        // (giữ nguyên container, chỉ reset data và texture)
        for (let i = 0; i < this.equipmentSlots.length; i++) {
            if (this.equipmentSlots[i] && this.equipmentSlots[i].image) {
                // Reset item data
                this.equipmentSlots[i].item = null;

                // Reset image về placeholder
                this.equipmentSlots[i].image.setTexture('item', 'equipment-slot');
                this.equipmentSlots[i].image.setDisplaySize(120 * 0.8, 120 * 0.8);
                this.equipmentSlots[i].image.setAlpha(0.3);
            }
        }
    }
}
