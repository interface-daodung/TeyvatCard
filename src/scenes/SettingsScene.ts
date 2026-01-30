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

type WindowWithGameEvents = Window & {
    gameEvents?: {
        on: (event: string, callback: () => void, context?: any) => void;
        off: (event: string, callback: () => void, context?: any) => void;
    };
};

/** Thiết kế base: 720 x 1280. Tỷ lệ dùng để scale nút/panel theo màn hình. */
const DESIGN_WIDTH = 720;
const DESIGN_HEIGHT = 1280;

/** Chuyển hex "#rrggbb" sang số màu Phaser (parseInt("#rrggbb") trả về NaN). */
function hexToColorValue(hex: string): number {
    return Phaser.Display.Color.HexStringToColor(hex).color;
}

export default class SettingsScene extends Phaser.Scene {
    public titleText!: Phaser.GameObjects.Image;
    private languageButtons!: LanguageButton[];
    private themeButtons!: ThemeButton[];
    private backButtonText?: Phaser.GameObjects.Text;

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
        const topBackSize = Math.round(32 * (height / DESIGN_HEIGHT));
        const backButton = this.add.text(width * 0.1, height * 0.08, '←', {
            fontSize: `${Math.max(24, topBackSize)}px`,
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
            backButton.setTint(hexToColorValue(themeManager.getColor('buttonHover')));
        });
        backButton.on('pointerout', () => {
            backButton.setScale(1);
            backButton.clearTint();
        });
    }

    createTitle(width: number, height: number): void {
        const titleText = localizationManager.t('settings');
        const fontSize = Math.round(24 * (height / DESIGN_HEIGHT));
        this.titleText = GradientText.createGradientText(this, {
            text: titleText,
            x: width / 2,
            y: height * 0.1,
            fontSize: Math.max(20, fontSize),
            gradientColors: themeManager.getCurrentTheme().colors.gradientGold,
            strokeColor: hexToColorValue(themeManager.getColor('textGoldStroke'))
        });
    }

    createLanguagePanel(width: number, height: number): void {
        const panelY = height * 0.18;
        const labelH = Math.round(50 * (height / DESIGN_HEIGHT));
        const labelPad = labelH / 2;
        const marginX = width * 0.1;
        const panelW = width * 0.8;

        // Language label với background đẹp
        const labelBg = this.add.graphics();
        labelBg.fillStyle(hexToColorValue(themeManager.getColor('cardBackground')));
        labelBg.fillRoundedRect(marginX, panelY - labelPad, panelW, labelH, 10);
        labelBg.lineStyle(2, hexToColorValue(themeManager.getColor('cardBorder')));
        labelBg.strokeRoundedRect(marginX, panelY - labelPad, panelW, labelH, 10);

        const labelFontSize = Math.round(22 * (height / DESIGN_HEIGHT));
        this.add.text(width / 2, panelY, localizationManager.t('language'), {
            fontSize: `${Math.max(16, labelFontSize)}px`,
            color: themeManager.getColor('textPrimary'),
            fontFamily: themeManager.getFont('primary'),
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Nút language: scale theo 720x1280 (button ~172x51, spacing ~14, row gap ~58)
        const languages = localizationManager.getAvailableLanguages();
        const buttonWidth = Math.round(172 * (width / DESIGN_WIDTH));
        const buttonHeight = Math.round(51 * (height / DESIGN_HEIGHT));
        const buttonGap = Math.round(14 * (width / DESIGN_WIDTH));
        const rowGap = Math.round(58 * (height / DESIGN_HEIGHT));
        const maxButtonsPerRow = Math.max(1, Math.floor((width - 2 * marginX + buttonGap) / (buttonWidth + buttonGap)));
        const totalButtonW = maxButtonsPerRow * buttonWidth + (maxButtonsPerRow - 1) * buttonGap;
        const startX = (width - totalButtonW) / 2 + buttonWidth / 2 + buttonGap / 2;

        this.languageButtons = [];
        languages.forEach((lang, index) => {
            const row = Math.floor(index / maxButtonsPerRow);
            const col = index % maxButtonsPerRow;
            const x = startX + col * (buttonWidth + buttonGap);
            const y = panelY + labelPad + rowGap + row * (buttonHeight + rowGap);
            
            const isActive = lang === localizationManager.currentLanguage;
            
            const button = GradientButton.createGradientButton(
                this,
                localizationManager.getLanguageName(lang),
                x,
                y,
                buttonWidth,
                buttonHeight,
                isActive ? themeManager.getCurrentTheme().colors.gradientButton : ['#666666', '#444444', '#222222']
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
        const marginX = width * 0.1;
        const labelH = Math.round(50 * (height / DESIGN_HEIGHT));
        const labelPad = labelH / 2;
        const buttonWidth = Math.round(172 * (width / DESIGN_WIDTH));
        const buttonHeight = Math.round(51 * (height / DESIGN_HEIGHT));
        const buttonGap = Math.round(14 * (width / DESIGN_WIDTH));
        const rowGap = Math.round(58 * (height / DESIGN_HEIGHT));

        const languages = localizationManager.getAvailableLanguages();
        const langMaxButtonsPerRow = Math.max(1, Math.floor((width - 2 * marginX + buttonGap) / (buttonWidth + buttonGap)));
        const languageRows = Math.ceil(languages.length / langMaxButtonsPerRow);
        const sectionGap = Math.round(50 * (height / DESIGN_HEIGHT));
        const panelY = height * 0.18 + labelPad + rowGap + (buttonHeight + rowGap) * languageRows + sectionGap;

        // Theme label với background đẹp
        const labelBg = this.add.graphics();
        labelBg.fillStyle(hexToColorValue(themeManager.getColor('cardBackground')));
        labelBg.fillRoundedRect(marginX, panelY - labelPad, width * 0.8, labelH, 10);
        labelBg.lineStyle(2, hexToColorValue(themeManager.getColor('cardBorder')));
        labelBg.strokeRoundedRect(marginX, panelY - labelPad, width * 0.8, labelH, 10);

        const labelFontSize = Math.round(22 * (height / DESIGN_HEIGHT));
        this.add.text(width / 2, panelY, localizationManager.t('theme'), {
            fontSize: `${Math.max(16, labelFontSize)}px`,
            color: themeManager.getColor('textPrimary'),
            fontFamily: themeManager.getFont('primary'),
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const themeMaxButtonsPerRow = Math.max(1, Math.floor((width - 2 * marginX + buttonGap) / (buttonWidth + buttonGap)));
        const totalButtonW = themeMaxButtonsPerRow * buttonWidth + (themeMaxButtonsPerRow - 1) * buttonGap;
        const startX = (width - totalButtonW) / 2 + buttonWidth / 2 + buttonGap / 2;

        const themes = themeManager.getAvailableThemes();
        this.themeButtons = [];
        themes.forEach((theme, index) => {
            const row = Math.floor(index / themeMaxButtonsPerRow);
            const col = index % themeMaxButtonsPerRow;
            const x = startX + col * (buttonWidth + buttonGap);
            const y = panelY + labelPad + rowGap + row * (buttonHeight + rowGap);
            
            const isActive = theme.key === themeManager.currentTheme;
            
            const button = GradientButton.createGradientButton(
                this,
                theme.name,
                x,
                y,
                buttonWidth,
                buttonHeight,
                isActive ? themeManager.getCurrentTheme().colors.gradientButton : ['#666666', '#444444', '#222222']
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
        const marginX = width * 0.1;
        const labelH = Math.round(50 * (height / DESIGN_HEIGHT));
        const labelPad = labelH / 2;
        const buttonWidth = Math.round(172 * (width / DESIGN_WIDTH));
        const buttonHeight = Math.round(51 * (height / DESIGN_HEIGHT));
        const buttonGap = Math.round(14 * (width / DESIGN_WIDTH));
        const rowGap = Math.round(58 * (height / DESIGN_HEIGHT));
        const sectionGap = Math.round(50 * (height / DESIGN_HEIGHT));

        const languages = localizationManager.getAvailableLanguages();
        const themes = themeManager.getAvailableThemes();
        const langMaxPerRow = Math.max(1, Math.floor((width - 2 * marginX + buttonGap) / (buttonWidth + buttonGap)));
        const themeMaxPerRow = Math.max(1, Math.floor((width - 2 * marginX + buttonGap) / (buttonWidth + buttonGap)));
        const languageRows = Math.ceil(languages.length / langMaxPerRow);
        const themeRows = Math.ceil(themes.length / themeMaxPerRow);

        const panelYTheme = height * 0.18 + labelPad + rowGap + (buttonHeight + rowGap) * languageRows + sectionGap;
        const backButtonY = panelYTheme + labelPad + rowGap + (buttonHeight + rowGap) * themeRows + sectionGap;

        const backW = Math.round(252 * (width / DESIGN_WIDTH));
        const backH = Math.round(60 * (height / DESIGN_HEIGHT));

        const backButton = GradientButton.createGradientButton(
            this,
            localizationManager.t('back'),
            width / 2,
            backButtonY,
            backW,
            backH,
            themeManager.getCurrentTheme().colors.gradientButton
        );
        this.backButtonText = backButton.buttonText;
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
        if (this.backButtonText) {
            this.backButtonText.setText(localizationManager.t('back'));
        }
    }

    updateLanguageButtons(): void {
        this.languageButtons.forEach(({ button, lang }) => {
            const isActive = lang === localizationManager.currentLanguage;
            button.buttonText.setText(localizationManager.getLanguageName(lang));
            
            // Update button colors based on active state
            if (isActive) {
                button.setTint(hexToColorValue(themeManager.getColor('buttonPrimary')));
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
                button.setTint(hexToColorValue(themeManager.getColor('buttonPrimary')));
            } else {
                button.clearTint();
            }
        });
    }

    shutdown(): void {
        // Clean up event listeners (Scene không có destroy(), dùng shutdown khi scene dừng)
        const win = window as WindowWithGameEvents;
        if (win.gameEvents) {
            win.gameEvents.off('themeChanged', this.updateTheme, this);
            win.gameEvents.off('languageChanged', this.updateLanguage, this);
        }
    }
}
