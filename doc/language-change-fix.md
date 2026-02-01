# Fix: Language Change Not Applying Immediately in Settings Scene

## Vấn đề (Problem)

Khi người dùng nhấn nút đổi ngôn ngữ trong `SettingsScene`, ngôn ngữ không thay đổi ngay lập tức. Phải thoát ra và quay lại scene thì mới thấy thay đổi.

When users click the language button in `SettingsScene`, the language doesn't change immediately. They have to navigate away and come back to see the change.

## Nguyên nhân (Root Cause)

Có một số vấn đề cần fix:

1. **Event system chưa được setup đầy đủ**:
   - `SettingsScene` đang gọi `updateAllTexts()` ngay khi click nút, nhưng các scene khác (như `MenuScene`) không lắng nghe sự kiện `languageChanged`.
   
2. **Thiếu debug logs**:
   - Khó xác định được event có fire không, và text có update không.

3. **Return type của `createButton()`**:
   - `MenuScene.createButton()` không return reference đến text object, nên không thể update sau này.

## Giải pháp (Solution)

### 1. Thêm Debug Logs

Thêm console logs vào các điểm quan trọng để theo dõi flow:

**`LocalizationManager.ts`:**
```typescript
setLanguage(code: GameLanguageCode): void {
    console.log('[LocalizationManager] setLanguage called with:', code);
    if (this.translations[code]) {
        this.currentLanguage = code;
        localStorage.setItem('gameLanguage', code);
        console.log('[LocalizationManager] Language changed to:', code);

        const win = window as { gameEvents?: { emit: (e: string) => void } };
        if (win.gameEvents?.emit) {
            console.log('[LocalizationManager] Emitting languageChanged event');
            win.gameEvents.emit('languageChanged');
        } else {
            console.warn('[LocalizationManager] gameEvents not available');
        }
    } else {
        console.warn('[LocalizationManager] Invalid language code:', code);
    }
}
```

**`SettingsScene.ts`:**
```typescript
btn.on('pointerdown', () => {
    console.log('[SettingsScene] Language button clicked:', lang);
    localizationManager.setLanguage(lang as GameLanguageCode);
    console.log('[SettingsScene] Calling updateAllTexts()');
    this.updateAllTexts();
    console.log('[SettingsScene] updateAllTexts() completed');
});

updateAllTexts() {
    console.log('[SettingsScene] updateAllTexts() called, current language:', localizationManager.currentLanguage);
    // ... update logic with logs
}

refreshLanguageButtons() {
    console.log('[SettingsScene] refreshLanguageButtons() called');
    // ... with detailed logs per button
}
```

### 2. Cải thiện MenuScene

**Thêm properties để lưu reference:**
```typescript
export default class MenuScene extends Phaser.Scene {
    private cards: CardCharacter[];
    private libraryButton?: { text: Phaser.GameObjects.Text };
    private exploreButton?: { text: Phaser.GameObjects.Text };
    private equipButton?: { text: Phaser.GameObjects.Text };
    private testDevButton?: Phaser.GameObjects.Text;
    private boundOnLanguageChanged!: () => void;
    // ...
}
```

**Update `createButton()` để return text reference:**
```typescript
createButton(x: number, y: number, iconName: string, buttonText: string, sceneName: string): 
    { text: Phaser.GameObjects.Text; container: Phaser.GameObjects.Container } {
    // ... existing code
    return { text, container: button };
}
```

**Thêm event listener cho language change:**
```typescript
create(): void {
    // Bind language change listener
    this.boundOnLanguageChanged = this.onLanguageChanged.bind(this);
    
    // ... existing code
    
    // Listen for language changes
    const win = window as any;
    if (win.gameEvents?.on) {
        win.gameEvents.on('languageChanged', this.boundOnLanguageChanged);
    }
}

onLanguageChanged(): void {
    console.log('[MenuScene] onLanguageChanged event received');
    // Update all button texts
    if (this.libraryButton?.text) {
        this.libraryButton.text.setText(localizationManager.t('library'));
    }
    if (this.exploreButton?.text) {
        this.exploreButton.text.setText(localizationManager.t('explore'));
    }
    if (this.equipButton?.text) {
        this.equipButton.text.setText(localizationManager.t('equip'));
    }
    if (this.testDevButton) {
        this.testDevButton.setText(localizationManager.t('test_dev'));
    }
}

shutdown(): void {
    const win = window as any;
    if (win.gameEvents?.off && this.boundOnLanguageChanged) {
        win.gameEvents.off('languageChanged', this.boundOnLanguageChanged);
    }
}
```

### 3. Đơn giản hóa SettingsScene.onLanguageChanged()

Gộp logic vào `updateAllTexts()`:

```typescript
onLanguageChanged() {
    console.log('[SettingsScene] onLanguageChanged event received');
    this.updateAllTexts(); // Tái sử dụng logic đã có
}
```

## Cách test (How to Test)

1. Build project: `npm run build`
2. Chạy dev server: `npm run dev`
3. Mở browser console để xem logs
4. Vào Settings Scene
5. Click nút đổi ngôn ngữ
6. Quan sát:
   - Console logs sẽ hiển thị flow: click → setLanguage → emit event → updateAllTexts
   - UI trong SettingsScene sẽ update ngay lập tức
   - Các text element (title, labels, buttons) đều thay đổi
   - Active state của nút ngôn ngữ update đúng
7. Quay về MenuScene
8. Các nút button text (library, explore, equip) cũng đã update theo ngôn ngữ mới

## Các file đã sửa (Modified Files)

1. `src/utils/LocalizationManager.ts` - Thêm debug logs
2. `src/scenes/SettingsScene.ts` - Thêm debug logs, cải thiện updateAllTexts()
3. `src/scenes/MenuScene.ts` - Thêm event listener, update button references

## Kết luận (Conclusion)

Với các fix trên:
- Ngôn ngữ sẽ update **ngay lập tức** khi click nút trong SettingsScene
- Tất cả scene khác (như MenuScene) cũng sẽ update khi nhận event `languageChanged`
- Debug logs giúp dễ dàng theo dõi và debug nếu có vấn đề
- Code dễ bảo trì và mở rộng cho các scene khác
