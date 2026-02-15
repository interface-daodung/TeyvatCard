import Phaser from 'phaser';
import { localizationManager } from '../core/LocalizationManager.js';
import { HeaderUI } from '../utils/HeaderUI.js';
import { themeManager } from '../core/ThemeManager.js';
import { dataManager } from '../core/DataManager.js';
import cardCharacterList from '../data/cardCharacterList.json';
import { SpritesheetWrapper } from '../utils/SpritesheetWrapper.js';
import {
    createBackButton,
    createInfoPanel,
    createCurrentCardDisplay,
    createNavigationButtons,
    initializeCurrentCardIndex,
    type CardCharacter,
    type HighScores,
    type CharacterInfoPanelRefs,
    type CharacterCardDisplayRefs,
    type NavigationButtonsRefs
} from '../components/SelectCharacterScene/index.js';
import { GameTitle, I18nText } from '../components/shared/index.js';

export default class SelectCharacterScene extends Phaser.Scene {
    private cards: CardCharacter[];
    private currentCardIndex: number;
    private HighScores!: HighScores;
    private boundOnLanguageChanged: () => void;

    public cardNameText!: Phaser.GameObjects.Text;
    public cardHighScoreText!: Phaser.GameObjects.Text;
    public cardLevelText!: Phaser.GameObjects.Text;
    public cardElementImage!: Phaser.GameObjects.Image;
    public cardDescriptionText!: Phaser.GameObjects.Text;
    public cardHPText!: I18nText & { hp: number };
    public upgradeButton!: Phaser.GameObjects.Text;
    public currentCardContainer!: Phaser.GameObjects.Container;
    public currentCardImage!: Phaser.GameObjects.Image | Phaser.GameObjects.Container;
    public cardBorder!: Phaser.GameObjects.Graphics;
    public prevButton!: Phaser.GameObjects.Text;
    public nextButton!: Phaser.GameObjects.Text;

    constructor() {
        super({ key: 'SelectCharacterScene' });
        this.cards = cardCharacterList as CardCharacter[];
        this.currentCardIndex = initializeCurrentCardIndex(
            this.cards,
            dataManager.get<string>('selectedCharacter')
        );
        this.boundOnLanguageChanged = this.onLanguageChanged.bind(this);
    }

    init(): void {
        this.HighScores = dataManager.get<HighScores>('characterHighScores') ?? {};
    }

    create(): void {
        const { width, height } = this.scale;

        this.add.image(width / 2, height / 2, 'background').setDisplaySize(width, height);
        HeaderUI.createHeaderUI(this, width, height);
        GameTitle.create(this, width / 2, height * 0.12, 'character_title');

        const panelRefs = createInfoPanel(this, width, height, {
            onUpgradeClick: () => this.upgradeCharacter(),
            onUpgradeHover: () => {
                if ((this.cards[this.currentCardIndex].level ?? 1) < 9) {
                    this.upgradeButton.setTint(themeManager.getNeutralPhaser());
                    this.upgradeButton.setScale(1.1);
                    this.upgradeButton.setStyle({ color: themeManager.getAccent() });
                    this.cardHPText.setI18nKey('coin_amount').setI18nParams({ amount: this.upgradeCharacterPrice() });
                }
            },
            onUpgradeOut: () => {
                this.upgradeButton.clearTint();
                this.upgradeButton.setScale(1);
                this.upgradeButton.setStyle({ color: themeManager.getText() });
                this.cardHPText.setI18nKey('hp_label').setI18nParams({ hp: this.cardHPText.hp });
            }
        });
        Object.assign(this, panelRefs as CharacterInfoPanelRefs);

        const cardRefs = createCurrentCardDisplay(this, width, height);
        Object.assign(this, cardRefs as CharacterCardDisplayRefs);

        const navRefs = createNavigationButtons(this, width, height, () => this.previousCard(), () => this.nextCard());
        Object.assign(this, navRefs as NavigationButtonsRefs);

        createBackButton(this, width, height, () => {
            dataManager.set('selectedCharacter', this.cards[this.currentCardIndex].id);
            this.scene.start('MenuScene');
        }, 'select');

        this.updateCardDisplay();

        this.game.events.on('languageChanged', this.boundOnLanguageChanged);
    }

    onLanguageChanged(): void {
        if (!this.scene.isActive() || !this.scene.isVisible()) return;
        try {
            this.updateCardDisplay();
        } catch (error) {
            console.error('[SelectCharacterScene] Error in onLanguageChanged:', error);
        }
    }

    shutdown(): void {
        if (this.boundOnLanguageChanged) {
            this.game.events.off('languageChanged', this.boundOnLanguageChanged);
        }
    }

    updateCardDisplay(): void {
        const currentCard = this.cards[this.currentCardIndex];
        const levelData = dataManager.get<Record<string, number>>('characterLevel');
        currentCard.level = levelData?.[currentCard.id] ?? 1;

        this.cardNameText.setText(currentCard.name);
        this.cardElementImage.setTexture('element', `element-${currentCard.element.toLowerCase()}`);
        this.cardDescriptionText.setText(currentCard.description);
        const hp = currentCard.hp + (currentCard.level ?? 1) - 1;
        this.cardHPText.hp = hp;
        this.cardHPText.setI18nKey('hp_label').setI18nParams({ hp });
        (this.cardLevelText as I18nText).setI18nParams({ level: currentCard.level ?? 1 });
        this.cardHighScoreText.setText(
            this.HighScores[currentCard.id]
                ? localizationManager.t('high_score_label', { score: this.HighScores[currentCard.id] })
                : ''
        );

        if ((currentCard.level ?? 1) >= 9) {
            (this.upgradeButton as I18nText).setI18nKey('level_max');
            this.upgradeButton.setStyle({ color: themeManager.getText() });
            this.upgradeButton.setScale(1);
        } else {
            (this.upgradeButton as I18nText).setI18nKey('upgrade');
        }

        if ((currentCard.level ?? 1) > 2) {
            this.currentCardContainer.remove(this.currentCardImage, true);
            this.currentCardImage = SpritesheetWrapper.CharacterAnimation(this, 0, 0, currentCard.id + '-sprite', 300, 514);
            this.currentCardContainer.add(this.currentCardImage);
            this.cardBorder.clear();
            this.cardBorder.lineStyle(4, themeManager.getAccentPhaser(), 1);
            this.cardBorder.fillStyle(themeManager.getAccentPhaser(), 1);
            this.cardBorder.fillRoundedRect(-152, -259, 304, 518, 28);
            this.cardBorder.strokeRoundedRect(-152, -259, 304, 518, 28);
        } else {
            this.currentCardContainer.remove(this.currentCardImage, true);
            this.currentCardImage = this.add.image(0, 0, 'character', currentCard.id);
            this.currentCardImage.setDisplaySize(300, 514);
            this.currentCardContainer.add(this.currentCardImage);
            this.cardBorder.clear();
            this.cardBorder.lineStyle(4, themeManager.getTextPhaser(), 1);
            this.cardBorder.fillStyle(themeManager.getTextPhaser(), 1);
            this.cardBorder.fillRoundedRect(-152, -259, 304, 518, 28);
            this.cardBorder.strokeRoundedRect(-152, -259, 304, 518, 28);
        }

        this.prevButton.setAlpha(this.currentCardIndex === 0 ? 0.5 : 1);
        this.nextButton.setAlpha(this.currentCardIndex === this.cards.length - 1 ? 0.5 : 1);
    }

    previousCard(): void {
        if (this.currentCardIndex > 0) {
            this.currentCardIndex--;
            this.updateCardDisplay();
        }
    }

    nextCard(): void {
        if (this.currentCardIndex < this.cards.length - 1) {
            this.currentCardIndex++;
            this.updateCardDisplay();
        }
    }

    upgradeCharacterPrice(): number {
        return (this.cards[this.currentCardIndex].level ?? 1) * 100;
    }

    upgradeCharacter(): void {
        const currentCard = this.cards[this.currentCardIndex];
        if ((currentCard.level ?? 1) >= 9) return;
        const levelData = dataManager.get<Record<string, number>>('characterLevel') ?? {};
        currentCard.level = (currentCard.level ?? 1) + 1;
        levelData[currentCard.id] = currentCard.level;
        dataManager.set('characterLevel', levelData);
        this.updateCardDisplay();
    }
}
