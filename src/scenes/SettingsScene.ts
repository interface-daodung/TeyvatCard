import Phaser from 'phaser';
import { GradientButton } from '../utils/GradientButton.js';
import { GradientText } from '../utils/GradientText.js';
import { localizationManager } from '../utils/LocalizationManager.js';
import { themeManager } from '../utils/ThemeManager.js';

interface LanguageButton {
    button: any;
    lang: string;
}

interface ThemeButton {
    button: any;
    theme: string;
}

interface WindowWithGameEvents extends Window {
    gameEvents?: {
        on: (event: string, callback: () => void, context?: any) => void;
        off: (event: string, callback: () => void, context?: any) => void;
    };
}

export default class SettingsScene extends Phaser.Scene {
    public titleText!: Phaser.GameObjects.Text;
    private languageButtons!: LanguageButton[];
    private themeButtons!: ThemeButton[];

    constructor() {
        super({ key: 'SettingsScene' });
    }

    create(): void {
        const { width, height } = this.scale;
        
        // Background với gradient
        this.createBackground(width, height);
        
        // Back button ở góc trên trái
        this.createTopBackButton(width, height);
        
        // Title
        this.createTitle(width, height);
        
        // Settings panels
        this.createLanguagePanel(width, height);
        this.createThemePanel(width, height);
        
        // Bottom back button
        this.createBackButton(width, height);
        
        // Listen for theme changes
        const win = window as WindowWithGameEvents;
        if (win.gameEvents) {
            win.gameEvents.on('themeChanged', this.updateTheme, this);
            win.gameEvents.on('languageChanged', this.updateLanguage, this);
        }
    }

    createBackground(width: number, height: number): void {
        // Tạo background gradient đẹp
        const bg = this.add.graphics();
        bg.fillGradientStyle(
            Phaser.Display.Color.HexStringToColor(themeManager.getColor('background')).color,
            Phaser.Display.Color.HexStringToColor(themeManager.getColor('cardBackground')).color,
            Phaser.Display.Color.HexStringToColor(themeManager.getColor('background')).color,
            Phaser.Display.Color.HexStringToColor(themeManager.getColor('cardBackground')).color
        );
        bg.fillRect(0, 0, width, height);
    }

    createTopBackButton(width: number, height: number): void {
        // Nút quay lại ở góc trên trái
        const backButton = this.add.text(width * 0.1, height * 0.08, '←', {
            fontSize: '32px',
            color: themeManager.getColor('textPrimary'),
            fontFamily: themeManager.getFont('primary'),
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        backButton.setInteractive({ useHandCursor: true });
        backButton.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });
        
        // Thêm hiệu ứng hover
        backButton.on('pointerover', () => {
            backButton.setScale(1.2);
            backButton.setTint(parseInt(themeManager.getColor('buttonHover')));
        });
        backButton.on('pointerout', () => {
            backButton.setScale(1);
            backButton.clearTint();
        });
    }

    createTitle(width: number, height: number): void {
        const titleText = localizationManager.t('settings');
        this.titleText = GradientText.createGradientText(this, {
            text: titleText,
            x: width / 2,
            y: height * 0.1,
            fontSize: '24px', // Giảm từ default xuống 24px
            gradientColors: themeManager.getCurrentTheme().colors.gradientGold,
            strokeColor: themeManager.getColor('textGoldStroke')
        });
    }

    createLanguagePanel(width: number, height: number): void {
        const panelY = height * 0.2;
        
        // Language label với background đẹp
        const labelBg = this.add.graphics();
        labelBg.fillStyle(parseInt(themeManager.getColor('cardBackground')));
        labelBg.fillRoundedRect(width * 0.1, panelY - 25, width * 0.8, 50, 10);
        labelBg.lineStyle(2, parseInt(themeManager.getColor('cardBorder')));
        labelBg.strokeRoundedRect(width * 0.1, panelY - 25, width * 0.8, 50, 10);
        
        this.add.text(width / 2, panelY, localizationManager.t('language'), {
            fontSize: '22px', // Giảm từ 28px xuống 22px
            color: themeManager.getColor('textPrimary'),
            fontFamily: themeManager.getFont('primary'),
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Language buttons với auto-layout
        const languages = localizationManager.getAvailableLanguages();
        const buttonWidth = Math.min(100, width * 0.25); // Responsive width
        const buttonHeight = 45;
        const maxButtonsPerRow = Math.floor(width / (buttonWidth + 20)); // Tính số nút tối đa trên 1 hàng
        const spacing = width / (maxButtonsPerRow + 1); // Spacing tự động
        
        this.languageButtons = [];
        languages.forEach((lang, index) => {
            const row = Math.floor(index / maxButtonsPerRow);
            const col = index % maxButtonsPerRow;
            const x = spacing * (col + 1) - buttonWidth / 2;
            const y = panelY + 80 + (row * 60); // Mỗi hàng cách nhau 60px
            
            const isActive = lang === localizationManager.currentLanguage;
            
            const button = GradientButton.createGradientButton(
                this,
                localizationManager.getLanguageName(lang),
                x,
                y,
                buttonWidth,
                buttonHeight,
                isActive ? themeManager.getColor('gradientButton') : ['#666666', '#444444', '#222222']
            );
            
            button.setInteractive({ useHandCursor: true });
            button.on('pointerdown', () => {
                localizationManager.setLanguage(lang);
                this.updateLanguageButtons();
            });
            
            this.languageButtons.push({ button, lang });
        });
    }

    createThemePanel(width: number, height: number): void {
        // Tính toán vị trí dựa trên số lượng nút language
        const languages = localizationManager.getAvailableLanguages();
        const langButtonWidth = Math.min(100, width * 0.25);
        const langMaxButtonsPerRow = Math.floor(width / (langButtonWidth + 20));
        const languageRows = Math.ceil(languages.length / langMaxButtonsPerRow);
        const panelY = height * 0.2 + 80 + (languageRows * 60) + 50; // Dynamic positioning
        
        // Theme label với background đẹp
        const labelBg = this.add.graphics();
        labelBg.fillStyle(parseInt(themeManager.getColor('cardBackground')));
        labelBg.fillRoundedRect(width * 0.1, panelY - 25, width * 0.8, 50, 10);
        labelBg.lineStyle(2, parseInt(themeManager.getColor('cardBorder')));
        labelBg.strokeRoundedRect(width * 0.1, panelY - 25, width * 0.8, 50, 10);
        
        this.add.text(width / 2, panelY, localizationManager.t('theme'), {
            fontSize: '22px', // Giảm từ 28px xuống 22px
            color: themeManager.getColor('textPrimary'),
            fontFamily: themeManager.getFont('primary'),
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Theme buttons với auto-layout
        const themes = themeManager.getAvailableThemes();
        const themeButtonWidth = Math.min(100, width * 0.25); // Responsive width
        const themeButtonHeight = 45;
        const themeMaxButtonsPerRow = Math.floor(width / (themeButtonWidth + 20)); // Tính số nút tối đa trên 1 hàng
        const themeSpacing = width / (themeMaxButtonsPerRow + 1); // Spacing tự động
        
        this.themeButtons = [];
        themes.forEach((theme, index) => {
            const row = Math.floor(index / themeMaxButtonsPerRow);
            const col = index % themeMaxButtonsPerRow;
            const x = themeSpacing * (col + 1) - themeButtonWidth / 2;
            const y = panelY + 80 + (row * 60); // Mỗi hàng cách nhau 60px
            
            const isActive = theme.key === themeManager.currentTheme;
            
            const button = GradientButton.createGradientButton(
                this,
                theme.name,
                x,
                y,
                themeButtonWidth,
                themeButtonHeight,
                isActive ? themeManager.getColor('gradientButton') : ['#666666', '#444444', '#222222']
            );
            
            button.setInteractive({ useHandCursor: true });
            button.on('pointerdown', () => {
                themeManager.setTheme(theme.key);
                this.updateThemeButtons();
            });
            
            this.themeButtons.push({ button, theme: theme.key });
        });
    }


    createBackButton(width: number, height: number): void {
        // Tính toán vị trí dựa trên số lượng nút theme
        const themes = themeManager.getAvailableThemes();
        const backButtonWidth = Math.min(100, width * 0.25);
        const backMaxButtonsPerRow = Math.floor(width / (backButtonWidth + 20));
        const themeRows = Math.ceil(themes.length / backMaxButtonsPerRow);
        const languageRows = Math.ceil(localizationManager.getAvailableLanguages().length / backMaxButtonsPerRow);
        
        // Vị trí back button = vị trí theme panel + chiều cao theme buttons + khoảng cách
        const backButtonY = height * 0.2 + 80 + (languageRows * 60) + 50 + 80 + (themeRows * 60) + 50;
        
        const backButton = GradientButton.createGradientButton(
            this,
            localizationManager.t('back'),
            width / 2,
            backButtonY,
            250,
            60,
            themeManager.getColor('gradientButton')
        );
        
        backButton.setInteractive({ useHandCursor: true });
        backButton.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });
        
        // Thêm hiệu ứng hover
        backButton.on('pointerover', () => {
            backButton.setScale(1.05);
        });
        backButton.on('pointerout', () => {
            backButton.setScale(1);
        });
    }

    updateTheme(): void {
        const { width, height } = this.scale;
        
        // Recreate background
        this.children.list.forEach(child => {
            if (child.type === 'Graphics') {
                child.destroy();
            }
        });
        this.createBackground(width, height);
        
        // Update title
        if (this.titleText) {
            this.titleText.destroy();
            this.createTitle(width, height);
        }
        
        // Update buttons
        this.updateLanguageButtons();
        this.updateThemeButtons();
    }

    updateLanguage(): void {
        const { width, height } = this.scale;
        
        // Recreate title with new language
        if (this.titleText) {
            this.titleText.destroy();
            this.createTitle(width, height);
        }
        
        // Update button texts
        this.updateLanguageButtons();
        this.updateThemeButtons();
        
        // Update back button
        this.children.list.forEach(child => {
            if ((child as any).buttonText && (child as any).buttonText.text === localizationManager.t('back')) {
                (child as any).buttonText.setText(localizationManager.t('back'));
            }
        });
    }

    updateLanguageButtons(): void {
        this.languageButtons.forEach(({ button, lang }) => {
            const isActive = lang === localizationManager.currentLanguage;
            button.buttonText.setText(localizationManager.getLanguageName(lang));
            
            // Update button colors based on active state
            if (isActive) {
                button.setTint(parseInt(themeManager.getColor('buttonPrimary')));
            } else {
                button.clearTint();
            }
        });
    }

    updateThemeButtons(): void {
        this.themeButtons.forEach(({ button, theme }) => {
            const isActive = theme === themeManager.currentTheme;
            
            // Update button colors based on active state
            if (isActive) {
                button.setTint(parseInt(themeManager.getColor('buttonPrimary')));
            } else {
                button.clearTint();
            }
        });
    }

    destroy(): void {
        // Clean up event listeners
        const win = window as WindowWithGameEvents;
        if (win.gameEvents) {
            win.gameEvents.off('themeChanged', this.updateTheme, this);
            win.gameEvents.off('languageChanged', this.updateLanguage, this);
        }
        super.destroy();
    }
}
