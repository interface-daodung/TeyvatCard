import Phaser from 'phaser';
import { localizationManager } from '../core/LocalizationManager.js';
import { HeaderUI } from '../utils/HeaderUI.js';
import { themeManager } from '../core/ThemeManager.js';
import { dataManager } from '../core/DataManager.js';
import TextureManager from '../core/TextureManager.js';
import { showToast } from '../components/PaymentScene/Toast.js';
import { SpritesheetWrapper } from '../utils/SpritesheetWrapper.js';
import {
    createBackButton,
    createInfoPanel,
    createCurrentCardDisplay,
    createNavigationButtons,
    getCharacterSpritesheetTextureKey,
    initializeCurrentCardIndex,
    type CardCharacter,
    type HighScores,
    type CharacterInfoPanelRefs,
    type CharacterCardDisplayRefs,
    type NavigationButtonsRefs
} from '../components/SelectCharacterScene/index.js';
import { GameTitle, I18nText } from '../components/shared/index.js';
import { Log } from '../utils/Log.js';
import { CHARACTER_SPRITESHEET_MIN_LEVEL } from '../modules/typeCard/character.js';

export default class SelectCharacterScene extends Phaser.Scene {
    private cards: CardCharacter[] = [];
    private currentCardIndex: number = 0;
    private HighScores!: HighScores;
    private boundOnLanguageChanged: () => void;
    private updateCoinDisplay!: (newCoin: string | number) => void;

    public cardNameText!: I18nText;
    public cardHighScoreText!: Phaser.GameObjects.Text;
    public cardLevelText!: Phaser.GameObjects.Text;
    public cardElementImage!: Phaser.GameObjects.Image;
    public cardDescriptionText!: I18nText;
    public cardHPText!: I18nText & { hp: number };
    public upgradeButton!: Phaser.GameObjects.Text;
    public currentCardContainer!: Phaser.GameObjects.Container;
    public currentCardImage!: Phaser.GameObjects.Image | Phaser.GameObjects.Container;
    public cardBorder!: Phaser.GameObjects.Graphics;
    public prevButton!: Phaser.GameObjects.Text;
    public nextButton!: Phaser.GameObjects.Text;

    constructor() {
        super({ key: 'SelectCharacterScene' });
        this.boundOnLanguageChanged = this.onLanguageChanged.bind(this);
    }

    init(): void {
        this.cards = (dataManager.getFlag<CardCharacter[]>('cardCharacterList') ?? []) as CardCharacter[];
        this.HighScores = dataManager.get<HighScores>('characterHighScores') ?? {};
        const levelData = dataManager.get<Record<string, number>>('characterLevel') ?? {};
        
        // Đồng bộ unlockedCharacters từ levelData (level > 0 là đã mở khóa thực sự)
        // Những character nào trong list levelData mà level = 0 thì coi như đã bị khóa lại
        const unlocked = Object.keys(levelData).filter(id => levelData[id] > 0);
        dataManager.set('unlockedCharacters', unlocked);

        const selectedCharacter = dataManager.get<string>('selectedCharacter');
        let idx = initializeCurrentCardIndex(this.cards, selectedCharacter);
        if (!unlocked.includes(this.cards[idx]?.id ?? '')) {
            const firstUnlocked = this.cards.findIndex(c => unlocked.includes(c.id));
            idx = firstUnlocked >= 0 ? firstUnlocked : 0;
        }
        this.currentCardIndex = idx;
    }

    create(): void {
        const { width, height } = this.scale;

        TextureManager.image(this, width / 2, height / 2, 'background').setDisplaySize(width, height);
        const headerRef = HeaderUI.createHeaderUI(this, width, height);
        this.updateCoinDisplay = headerRef.updateCoinDisplay;
        GameTitle.create(this, width / 2, height * 0.12, 'character_title');

        // Load toàn bộ thông tin từ local một lần khi vào scene, tránh cache mặc định
        const currentCard = this.cards[this.currentCardIndex];
        const levelData = dataManager.get<Record<string, number>>('characterLevel') ?? {};
        currentCard.level = levelData[currentCard.id] ?? 0;
        const level = currentCard.level;
        const isUnlocked = level > 0;
        const hp = currentCard.hp + (isUnlocked ? level : 0);
        const highScoreStr = this.HighScores[currentCard.id]
            ? localizationManager.t('high_score_label', { score: this.HighScores[currentCard.id] })
            : '';

        const initialData = {
            card: currentCard,
            hp,
            highScore: highScoreStr,
            level
        };

        const panelRefs = createInfoPanel(this, width, height, {
            onUpgradeClick: () => this.upgradeCharacter(),
            onUpgradeHover: () => {
                const card = this.cards[this.currentCardIndex];
                const level = dataManager.get<Record<string, number>>('characterLevel')?.[card.id] ?? 0;
                const maxLevel = card.maxLevel ?? 10;
                const canUnlock = level === 0;
                const canUpgrade = level > 0 && level < maxLevel;
                if (canUnlock || canUpgrade) {
                    this.upgradeButton.setScale(1.1);
                    this.upgradeButton.setStyle({ color: themeManager.getNeutral() });
                    this.cardHPText.setI18nKey('coin_amount').setI18nParams({ amount: this.upgradeCharacterPrice() });
                }
            },
            onUpgradeOut: () => {
                this.upgradeButton.clearTint();
                this.upgradeButton.setScale(1);
                this.upgradeButton.setStyle({ color: themeManager.getText() });
                this.cardHPText.setI18nKey('hp_label').setI18nParams({ hp: this.cardHPText.hp });
            }
        }, initialData);
        Object.assign(this, panelRefs as CharacterInfoPanelRefs);

        const cardRefs = createCurrentCardDisplay(this, width, height, currentCard.id);
        Object.assign(this, cardRefs as CharacterCardDisplayRefs);

        const navRefs = createNavigationButtons(this, width, height, () => this.previousCard(), () => this.nextCard());
        Object.assign(this, navRefs as NavigationButtonsRefs);

        createBackButton(this, width, height, () => {
            const card = this.cards[this.currentCardIndex];
            const levelData = dataManager.get<Record<string, number>>('characterLevel') ?? {};
            if ((levelData[card.id] ?? 0) > 0) dataManager.set('selectedCharacter', card.id);
            this.scene.start('LoadingScene', { targetScene: 'MenuScene' });
        }, 'select');

        this.updateCardDisplay();

        this.game.events.on('languageChanged', this.boundOnLanguageChanged);
    }

    onLanguageChanged(): void {
        if (!this.scene.isActive() || !this.scene.isVisible()) return;
        try {
            this.updateCardDisplay();
        } catch (error) {
            Log.error('[SelectCharacterScene] Error in onLanguageChanged:', error);
        }
    }

    shutdown(): void {
        if (this.boundOnLanguageChanged) {
            this.game.events.off('languageChanged', this.boundOnLanguageChanged);
        }
    }

    updateCardDisplay(): void {
        const currentCard = this.cards[this.currentCardIndex];
        const levelData = dataManager.get<Record<string, number>>('characterLevel') ?? {};
        currentCard.level = levelData[currentCard.id] ?? 0;
        const level = currentCard.level;
        const isUnlocked = level > 0;
        const hp = currentCard.hp + (isUnlocked ? level : 0);

        this.cardNameText.setI18nKey(`character.${currentCard.id}.name`);
        TextureManager.setImageTexture(this.cardElementImage, `${currentCard.element.toLowerCase()}`);
        this.cardDescriptionText.setI18nKey(currentCard.description);
        this.cardHPText.hp = hp;
        this.cardHPText.setI18nKey('hp_label').setI18nParams({ hp });
        (this.cardLevelText as I18nText).setI18nParams({ level });
        this.cardLevelText.setVisible(isUnlocked);
        this.cardHighScoreText.setText(
            this.HighScores[currentCard.id]
                ? localizationManager.t('high_score_label', { score: this.HighScores[currentCard.id] })
                : ''
        );

        const maxLevel = currentCard.maxLevel ?? 10;
        if (!isUnlocked) {
            (this.upgradeButton as I18nText).setI18nKey('unlock');
        } else if (level >= maxLevel) {
            (this.upgradeButton as I18nText).setI18nKey('level_max');
            this.upgradeButton.setStyle({ color: themeManager.getText() });
            this.upgradeButton.setScale(1);
        } else {
            (this.upgradeButton as I18nText).setI18nKey('upgrade');
        }

        this.currentCardContainer.remove(this.currentCardImage, true);
        if (!isUnlocked) {
            const unlockTextureKey = `unlock${currentCard.id.charAt(0).toUpperCase()}${currentCard.id.slice(1)}`;
            const lockedTextureKey = TextureManager.has(unlockTextureKey) ? unlockTextureKey : 'empty';
            this.currentCardImage = TextureManager.image(this, 0, 0, lockedTextureKey);
            this.currentCardImage.setDisplaySize(300, 514);
            this.currentCardImage.setOrigin(0.5, 0.5);
            this.currentCardContainer.add(this.currentCardImage);
            this.cardBorder.clear();
            this.cardBorder.lineStyle(4, themeManager.getTextPhaser(), 1);
            this.cardBorder.strokeRoundedRect(-152, -259, 304, 518, 28);
            this.currentCardContainer.remove(this.cardBorder, false);
            this.currentCardContainer.add(this.cardBorder);
        } else if (level >= CHARACTER_SPRITESHEET_MIN_LEVEL) {
            this.currentCardImage = SpritesheetWrapper.CharacterAnimation(this, 0, 0, currentCard.id + '-sprite', 300, 514);
            this.currentCardContainer.add(this.currentCardImage);
            this.cardBorder.clear();
            this.cardBorder.lineStyle(4, themeManager.getAccentPhaser(), 1);
            this.cardBorder.fillStyle(themeManager.getAccentPhaser(), 1);
            this.cardBorder.fillRoundedRect(-152, -259, 304, 518, 28);
            this.cardBorder.strokeRoundedRect(-152, -259, 304, 518, 28);
        } else {
            this.currentCardImage = TextureManager.image(this, 0, 0, currentCard.id);
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
        const card = this.cards[this.currentCardIndex];
        const levelData = dataManager.get<Record<string, number>>('characterLevel') ?? {};
        const level = levelData[card.id] ?? 0;
        const maxLevel = card.maxLevel ?? 10;
        if (level >= maxLevel) return 0;
        const stats = card.levelStats?.find(s => s.level === level + 1);
        if (stats) return stats.price;
        return (level + 1) * 100;
    }

    upgradeCharacter(): void {
        const currentCard = this.cards[this.currentCardIndex];
        const levelData = dataManager.get<Record<string, number>>('characterLevel') ?? {};
        const level = levelData[currentCard.id] ?? 0;
        const unlocked = dataManager.get<string[]>('unlockedCharacters') ?? [];
        const maxLevel = currentCard.maxLevel ?? 10;

        if (level >= maxLevel) return;

        const price = this.upgradeCharacterPrice();
        const totalCoin = dataManager.get<number>('totalCoin') ?? 0;
        if (totalCoin < price) {
            showToast(this, localizationManager.t('not_enough_coin'));
            return;
        }

        dataManager.set('totalCoin', totalCoin - price);
        this.updateCoinDisplay(totalCoin - price);

        const newLevel = level + 1;
        levelData[currentCard.id] = newLevel;
        currentCard.level = newLevel;
        dataManager.set('characterLevel', levelData);

        // Nếu mới nâng từ 0 lên 1 thì coi như đã mở khóa
        if (level === 0) {
            const next = Array.from(new Set([...unlocked, currentCard.id]));
            dataManager.set('unlockedCharacters', next);
        }

        const spriteKey = getCharacterSpritesheetTextureKey(currentCard.id);
        if (newLevel === CHARACTER_SPRITESHEET_MIN_LEVEL && !this.textures.exists(spriteKey)) {
            dataManager.set('selectedCharacter', currentCard.id);
            this.scene.start('LoadingScene', { targetScene: 'SelectCharacterScene' });
            return;
        }

        this.updateCardDisplay();
    }
}
