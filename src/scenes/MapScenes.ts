import Phaser from 'phaser';
import { GradientText } from '../utils/GradientText.js';
import dungeonList from '../data/dungeonList.json';

interface DungeonData {
    name: string;
    stageId: string;
    [key: string]: any;
}

interface ButtonWithDungeonData extends Phaser.GameObjects.Rectangle {
    dungeonData?: DungeonData | null;
}

export default class MapScenes extends Phaser.Scene {
    private currentPage: number;
    private itemsPerPage: number;
    private dungeonButtons: Phaser.GameObjects.Container[];
    public dungeonContainer!: Phaser.GameObjects.Container;
    public prevButton!: Phaser.GameObjects.Text;
    public nextButton!: Phaser.GameObjects.Text;

    constructor() {
        super({ key: 'MapScenes' });
        this.currentPage = 0;
        this.itemsPerPage = 5;
        this.dungeonButtons = []; // Mảng lưu reference các nút
    }

    preload(): void {
        // Không cần preload gì
    }

    create(): void {
        const { width, height } = this.scale;

        // Background
        this.add.image(width / 2, height / 2, 'background');

        // Thêm overlay tối để làm nổi bật màn chơi
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000).setAlpha(0.5);

        // Tạo tiêu đề game với gradient text
        GradientText.createGameTitle(this, 'DUNGEON MAP', width / 2, height * 0.18);

        // Tạo container cho các nút dungeon
        this.dungeonContainer = this.add.container(width / 2, height * 0.5);

        // Tạo 5 nút dungeon ban đầu (ẩn)
        this.createInitialDungeonButtons(width, height);

        // Tạo nút phân trang
        this.createPaginationButtons(width, height);

        // Hiển thị trang đầu tiên
        this.showCurrentPage();

    }

    /**
     * Tạo 5 nút dungeon ban đầu (ẩn)
     */
    createInitialDungeonButtons(width: number, height: number): void {
        const buttonWidth = width * 0.7;
        const buttonHeight = height * 0.08;
        const buttonSpacing = 20;

        // Tạo 5 nút ban đầu (ẩn)
        for (let i = 0; i < 5; i++) {
            const buttonY = (i - 2) * (buttonHeight + buttonSpacing); // Vị trí cố định từ trên xuống

            // Tạo nút với text mặc định
            const button = this.add.rectangle(0, buttonY, buttonWidth, buttonHeight, 0x622945) as ButtonWithDungeonData;
            button.setAlpha(0.5);
            button.setStrokeStyle(3, 0x96576a);
            button.setInteractive(); // Thêm interactivity
            const text = this.add.text(0, buttonY, '', {
                fontSize: '32px',
                color: '#ffffff',
                fontFamily: 'Arial',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);
            // Thêm hover effects ngay từ đầu
            button.on('pointerover', () => {
                button.setFillStyle(0x95245b);
                button.setStrokeStyle(3, 0xffffff);
            });

            button.on('pointerout', () => {
                button.setFillStyle(0x622945);
                button.setStrokeStyle(3, 0x96576a);
            });
            // Lưu trữ thông tin dungeon trong button data
            button.dungeonData = null; // Sẽ được cập nhật trong updateDungeonButton
            
            // Thêm event listener
            button.on('pointerdown', () => {
                if (button.dungeonData) {
                    const { name, stageId } = button.dungeonData;
                    console.log(`MapScenes: Dungeon clicked!`);
                    console.log(`stageId: ${stageId}`);
                    console.log(`name: ${name}`);
                    // TODO: Xử lý logic khi click vào dungeon
                    console.log('TODO: Implement dungeon logic');
                    this.scene.stop('GameScene');
                    this.scene.start('LoadingScene', { targetScene: 'GameScene',
                        dataTargetScene: { stageId: stageId } });
                }
            });
            // Tạo container chứa button và text
            const buttonContainer = this.add.container(0, 0);
            buttonContainer.add([button, text]);

            // Lưu reference
            this.dungeonButtons[i] = buttonContainer;

            // Ẩn nút ban đầu
            buttonContainer.setVisible(false);

            // Thêm vào dungeonContainer
            this.dungeonContainer.add(buttonContainer);
        }

        console.log('MapScenes: Initial 5 dungeon buttons created and hidden');
    }

    /**
     * Cập nhật nút dungeon hiện có
     */
    updateDungeonButton(buttonContainer: Phaser.GameObjects.Container, newName: string, newStageId: string): void {
        // Cập nhật text
        const text = buttonContainer.getAt(1) as Phaser.GameObjects.Text; // Text là phần tử thứ 2
        text.setText(newName);
        
        // Cập nhật thông tin dungeon trong button data
        const button = buttonContainer.getAt(0) as ButtonWithDungeonData; // Button là phần tử thứ 1
        button.dungeonData = {
            name: newName,
            stageId: newStageId
        };
        
        console.log(`MapScenes: Button updated - "${newName}"`);
    }

    /**
     * Tạo nút phân trang (‹ và ›)
     */
    createPaginationButtons(width: number, height: number): void {
        const buttonSize = 50;
        const buttonY = height * 0.8;

        // Nút Previous (‹)
        this.prevButton = this.add.text(width * 0.3, buttonY, '‹', {
            fontSize: '40px',
            color: '#ffffff',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        this.prevButton.setInteractive({ useHandCursor: true });
        this.prevButton.on('pointerdown', () => {
            // Nếu text là « thì chuyển về MenuScene
            if (this.prevButton.text === '«') {
                this.scene.start('MenuScene');
            } else {
                this.previousPage();
            }
        });

        // Nút Next (›)
        this.nextButton = this.add.text(width * 0.7, buttonY, '›', {
            fontSize: '40px',
            color: '#ffffff',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        this.nextButton.setInteractive({ useHandCursor: true });
        this.nextButton.on('pointerdown', () => {
            this.nextPage();
        });

        // Hiệu ứng hover cho nút phân trang
        [this.prevButton, this.nextButton].forEach(button => {
            button.on('pointerover', () => {
                button.setStyle({ color: '#ffd700' });
            });
            button.on('pointerout', () => {
                button.setStyle({ color: '#ffffff' });
            });
        });
    }

    /**
     * Hiển thị trang hiện tại
     */
    showCurrentPage(): void {
        // Tính toán dữ liệu cho trang hiện tại
        const startIndex = this.currentPage * this.itemsPerPage;
        const endIndex = Math.min(startIndex + this.itemsPerPage, (dungeonList as DungeonData[]).length);
        const currentPageData = (dungeonList as DungeonData[]).slice(startIndex, endIndex);

        console.log(`MapScenes: Showing page ${this.currentPage + 1}, items ${startIndex + 1}-${endIndex}`);

        // Cập nhật các nút dungeon hiện có
        for (let i = 0; i < 5; i++) {
            if (i < currentPageData.length) {
                // Có dữ liệu - hiển thị và cập nhật nút
                const dungeon = currentPageData[i];
                this.updateDungeonButton(
                    this.dungeonButtons[i], 
                    dungeon.name, 
                    dungeon.stageId
                );
                this.dungeonButtons[i].setVisible(true);

                console.log(`MapScenes: Button ${i} updated with "${dungeon.name}" (baseIndex: ${startIndex + i})`);
            } else {
                // Không có dữ liệu - ẩn nút
                this.dungeonButtons[i].setVisible(false);
                console.log(`MapScenes: Button ${i} hidden (no data)`);
            }
        }

        // Cập nhật trạng thái nút phân trang
        this.updatePaginationButtons();
    }

    /**
     * Chuyển đến trang trước
     */
    previousPage(): void {
        if (this.currentPage > 0) {
            this.currentPage--;
            this.showCurrentPage();
        }
    }

    /**
     * Chuyển đến trang tiếp theo
     */
    nextPage(): void {
        const maxPage = Math.ceil((dungeonList as DungeonData[]).length / this.itemsPerPage) - 1;
        if (this.currentPage < maxPage) {
            this.currentPage++;
            this.showCurrentPage();
        }
    }

    /**
     * Cập nhật trạng thái nút phân trang
     */
    updatePaginationButtons(): void {
        // Cập nhật nút Previous
        if (this.currentPage > 0) {
            // Có trang trước - hiển thị nút Previous
            this.prevButton.setText('‹');
            this.prevButton.setStyle({ color: '#ffffff' });
            this.prevButton.setInteractive();
        } else {
            // Ở trang đầu - thay đổi thành nút Back to Menu
            this.prevButton.setText('«');
            this.prevButton.setInteractive();
        }

        // Cập nhật nút Next
        const maxPage = Math.ceil((dungeonList as DungeonData[]).length / this.itemsPerPage) - 1;
        if (this.currentPage < maxPage) {
            this.nextButton.setStyle({ color: '#ffffff' });
            this.nextButton.setInteractive();
        } else {
            this.nextButton.setStyle({ color: '#666666' });
            this.nextButton.disableInteractive();
        }
    }
}
