import Phaser from 'phaser';

/**
 * Quản lý theme màu sắc cho game
 */

export interface ThemeColors {
    background: string;
    textPrimary: string;
    textSecondary: string;
    textGold: string;
    textGoldStroke: string;
    buttonPrimary: string;
    buttonSecondary: string;
    buttonHover: string;
    cardBackground: string;
    cardBorder: string;
    gradientGold: string[];
    gradientButton: string[];
    electro: string;
    pyro: string;
    hydro: string;
    cryo: string;
    anemo: string;
    geo: string;
    dendro: string;
    success: string;
    warning: string;
    error: string;
    info: string;
}

export interface ThemeFonts {
    primary: string;
    secondary: string;
}

export interface Theme {
    name: string;
    colors: ThemeColors;
    fonts: ThemeFonts;
}

export type ThemesMap = Record<string, Theme>;

export class ThemeManager {
    currentTheme: string;
    themes: ThemesMap;

    constructor() {
        this.currentTheme = localStorage.getItem('gameTheme') || 'default';
        this.themes = {};
        this.loadThemes();
    }

    loadThemes(): void {
        this.themes.default = {
            name: 'Default',
            colors: {
                background: '#000000',
                textPrimary: '#ffffff',
                textSecondary: '#d1d1d1',
                textGold: '#FFD700',
                textGoldStroke: '#E69500',
                buttonPrimary: '#95245b',
                buttonSecondary: '#45162c',
                buttonHover: '#d1d1d1',
                cardBackground: '#2d0d21',
                cardBorder: '#1f0612',
                gradientGold: ['#cbbd1bff', '#c57826ff', '#8c3c0eff'],
                gradientButton: ['#ffb3d9', '#45162c', '#96576a'],
                electro: '#9d4edd',
                pyro: '#ff6b35',
                hydro: '#4cc9f0',
                cryo: '#90e0ef',
                anemo: '#80ffdb',
                geo: '#f77f00',
                dendro: '#06ffa5',
                success: '#06ffa5',
                warning: '#ffd60a',
                error: '#ff006e',
                info: '#4cc9f0'
            },
            fonts: {
                primary: 'Arial, sans-serif',
                secondary: 'Arial, sans-serif'
            }
        };

        this.themes.dark = {
            name: 'Dark',
            colors: {
                background: '#0a0a0a',
                textPrimary: '#e0e0e0',
                textSecondary: '#a0a0a0',
                textGold: '#ffd700',
                textGoldStroke: '#b8860b',
                buttonPrimary: '#2c2c2c',
                buttonSecondary: '#1a1a1a',
                buttonHover: '#404040',
                cardBackground: '#1a1a1a',
                cardBorder: '#333333',
                gradientGold: ['#ffd700', '#ff8c00', '#ff4500'],
                gradientButton: ['#404040', '#2c2c2c', '#1a1a1a'],
                electro: '#8a2be2',
                pyro: '#ff4500',
                hydro: '#00bfff',
                cryo: '#87ceeb',
                anemo: '#98fb98',
                geo: '#daa520',
                dendro: '#32cd32',
                success: '#32cd32',
                warning: '#ffa500',
                error: '#ff0000',
                info: '#00bfff'
            },
            fonts: {
                primary: 'Arial, sans-serif',
                secondary: 'Arial, sans-serif'
            }
        };

        this.themes.light = {
            name: 'Light',
            colors: {
                background: '#f5f5f5',
                textPrimary: '#333333',
                textSecondary: '#666666',
                textGold: '#b8860b',
                textGoldStroke: '#8b6914',
                buttonPrimary: '#4a90e2',
                buttonSecondary: '#357abd',
                buttonHover: '#6ba3f0',
                cardBackground: '#ffffff',
                cardBorder: '#e0e0e0',
                gradientGold: ['#ffd700', '#ff8c00', '#ff4500'],
                gradientButton: ['#4a90e2', '#357abd', '#2c5aa0'],
                electro: '#9d4edd',
                pyro: '#ff6b35',
                hydro: '#4cc9f0',
                cryo: '#90e0ef',
                anemo: '#80ffdb',
                geo: '#f77f00',
                dendro: '#06ffa5',
                success: '#28a745',
                warning: '#ffc107',
                error: '#dc3545',
                info: '#17a2b8'
            },
            fonts: {
                primary: 'Arial, sans-serif',
                secondary: 'Arial, sans-serif'
            }
        };

        this.themes.cyberpunk = {
            name: 'Cyberpunk',
            colors: {
                background: '#0d1117',
                textPrimary: '#00ff41',
                textSecondary: '#00cc33',
                textGold: '#ffff00',
                textGoldStroke: '#cccc00',
                buttonPrimary: '#ff0080',
                buttonSecondary: '#800040',
                buttonHover: '#ff3399',
                cardBackground: '#161b22',
                cardBorder: '#00ff41',
                gradientGold: ['#ffff00', '#ff8000', '#ff0000'],
                gradientButton: ['#ff0080', '#800040', '#400020'],
                electro: '#00ffff',
                pyro: '#ff0040',
                hydro: '#0080ff',
                cryo: '#80ffff',
                anemo: '#80ff80',
                geo: '#ff8000',
                dendro: '#80ff00',
                success: '#00ff00',
                warning: '#ffff00',
                error: '#ff0000',
                info: '#00ffff'
            },
            fonts: {
                primary: 'Courier New, monospace',
                secondary: 'Courier New, monospace'
            }
        };

        this.themes.genshin = {
            name: 'Genshin',
            colors: {
                background: '#1a1a2e',
                textPrimary: '#ffffff',
                textSecondary: '#e0e0e0',
                textGold: '#ffd700',
                textGoldStroke: '#b8860b',
                buttonPrimary: '#4a148c',
                buttonSecondary: '#2e1065',
                buttonHover: '#6a1b9a',
                cardBackground: '#16213e',
                cardBorder: '#0f3460',
                gradientGold: ['#ffd700', '#ff8c00', '#ff4500'],
                gradientButton: ['#4a148c', '#2e1065', '#1a0d2e'],
                electro: '#9d4edd',
                pyro: '#ff6b35',
                hydro: '#4cc9f0',
                cryo: '#90e0ef',
                anemo: '#80ffdb',
                geo: '#f77f00',
                dendro: '#06ffa5',
                success: '#06ffa5',
                warning: '#ffd60a',
                error: '#ff006e',
                info: '#4cc9f0'
            },
            fonts: {
                primary: 'Arial, sans-serif',
                secondary: 'Arial, sans-serif'
            }
        };
    }

    getColor(key: keyof ThemeColors): string {
        return this.themes[this.currentTheme]?.colors[key] ??
            this.themes.default.colors[key] ??
            '#ffffff';
    }

    getFont(key: keyof ThemeFonts): string {
        return this.themes[this.currentTheme]?.fonts[key] ??
            this.themes.default.fonts[key] ??
            'Arial, sans-serif';
    }

    getCurrentTheme(): Theme {
        return this.themes[this.currentTheme] ?? this.themes.default;
    }

    setTheme(themeName: string): void {
        if (this.themes[themeName]) {
            this.currentTheme = themeName;
            localStorage.setItem('gameTheme', themeName);

            if (typeof window !== 'undefined' && window.gameEvents) {
                window.gameEvents.emit('themeChanged', themeName);
            }
        }
    }

    getAvailableThemes(): { key: string; name: string }[] {
        return Object.keys(this.themes).map(key => ({
            key,
            name: this.themes[key].name
        }));
    }

    getTextStyle(styleType: 'title' | 'button' | 'normal' | 'secondary' | 'score'): Phaser.Types.GameObjects.Text.TextStyle {
        const styles: Record<string, Phaser.Types.GameObjects.Text.TextStyle> = {
            title: {
                fontSize: '32px',
                color: this.getColor('textGold'),
                fontFamily: this.getFont('primary'),
                fontStyle: 'bold',
                stroke: this.getColor('textGoldStroke'),
                strokeThickness: 2
            },
            button: {
                fontSize: '24px',
                color: this.getColor('textPrimary'),
                fontFamily: this.getFont('primary'),
                fontStyle: 'bold',
                backgroundColor: this.getColor('buttonPrimary'),
                padding: { x: 20, y: 10 }
            },
            normal: {
                fontSize: '20px',
                color: this.getColor('textPrimary'),
                fontFamily: this.getFont('primary')
            },
            secondary: {
                fontSize: '18px',
                color: this.getColor('textSecondary'),
                fontFamily: this.getFont('secondary')
            },
            score: {
                fontSize: '20px',
                color: this.getColor('textPrimary'),
                fontFamily: this.getFont('primary'),
                alpha: 0.8
            }
        };

        return styles[styleType] ?? styles.normal;
    }
}

// Singleton instance
export const themeManager = new ThemeManager();
