---
name: Game Over Modal Refactor
overview: Thay hành vi chuyển thẳng về menu trong GameScene bằng modal điều hướng dùng icon+tooltip, đồng thời tách logic lưu kỷ lục khỏi animation/dialog trong GameManager để có thể tái sử dụng cho nút chơi lại.
todos:
  - id: inspect-game-scene-hook
    content: Xác định điểm gắn callback menu trong GameScene/GameUI và vị trí thêm openNavigationModal.
    status: completed
  - id: build-navigation-modal
    content: Tạo modal điều hướng icon-only + tooltip i18n, tô màu theo ThemeManager.
    status: completed
  - id: refactor-gameover-persist
    content: Tách logic lưu kỷ lục trong GameManager thành hàm riêng có thể tái dùng.
    status: completed
  - id: add-gameover-options
    content: Bổ sung option cho gameOver để bật/tắt animation và dialog, giữ default tương thích.
    status: completed
  - id: wire-replay-menu-continue
    content: Nối 3 hành động replay/menu/continue từ modal vào GameScene và GameManager.
    status: completed
  - id: verify-i18n-theme-flow
    content: Rà soát key i18n và kiểm thử luồng game over cũ + luồng modal mới.
    status: completed
isProject: false
---

# Kế hoạch refactor modal điều hướng và game over

## Mục tiêu
- Thay callback `() => this.scene.start('MenuScene')` trong [c:\Users\inter\OneDrive\Documents\GitHub\TeyvatCardGameBackend\TeyvatCard\src\scenes\GameScene.ts](c:\Users\inter\OneDrive\Documents\GitHub\TeyvatCardGameBackend\TeyvatCard\src\scenes\GameScene.ts) thành mở modal điều hướng.
- Modal có 3 hành động bằng icon (không chữ trên nút): **chơi lại**, **về menu**, **tiếp tục**; tooltip dùng `I18nText`.
- Màu sắc modal/nút lấy từ [c:\Users\inter\OneDrive\Documents\GitHub\TeyvatCardGameBackend\TeyvatCard\src\core\ThemeManager.ts](c:\Users\inter\OneDrive\Documents\GitHub\TeyvatCardGameBackend\TeyvatCard\src\core\ThemeManager.ts).
- Tách logic lưu kỷ lục khỏi `gameOver()` để dùng lại khi cần, và cho luồng “chơi lại” chạy `gameOver()` nhưng bỏ qua animation + `showGameOverDialog()` (đoạn `GameManager.ts` hiện tại gọi ở `228-230`).

## Cách thực hiện
- Tạo/điều chỉnh component modal trong vùng `GameScene` (ưu tiên tái dùng pattern popup từ Settings + pattern icon tooltip từ MenuButton):
  - Dùng overlay + panel theo phong cách hiện có.
  - Mỗi nút là icon-only; tooltip hiển thị khi hover bằng `I18nText`.
  - Các hành vi:
    - **Continue**: đóng modal, tiếp tục game.
    - **Menu**: đóng modal rồi `scene.start('MenuScene')`.
    - **Replay**: gọi luồng game over có lưu kỷ lục nhưng bỏ animation/dialog, sau đó restart scene.

- Refactor [c:\Users\inter\OneDrive\Documents\GitHub\TeyvatCardGameBackend\TeyvatCard\src\core\GameManager.ts](c:\Users\inter\OneDrive\Documents\GitHub\TeyvatCardGameBackend\TeyvatCard\src\core\GameManager.ts):
  - Tách phần lưu dữ liệu/kỷ lục thành hàm riêng (vd: `persistGameOverStats()`), hiện đang nằm lẫn trong `gameOver()`.
  - Đổi `gameOver()` để hỗ trợ option điều khiển hậu xử lý, ví dụ:
    - `withAnimation: boolean`
    - `withDialog: boolean`
  - Mặc định giữ hành vi cũ (animation + dialog) để tránh regression.
  - Nút replay từ modal gọi `gameOver({ withAnimation: false, withDialog: false })`.

- Nối lại ở [c:\Users\inter\OneDrive\Documents\GitHub\TeyvatCardGameBackend\TeyvatCard\src\scenes\GameScene.ts](c:\Users\inter\OneDrive\Documents\GitHub\TeyvatCardGameBackend\TeyvatCard\src\scenes\GameScene.ts):
  - Thay callback menu cũ bằng `openNavigationModal()`.
  - Quản lý lock input/close bằng click ngoài hoặc nút continue.

- Cập nhật i18n keys cho tooltip (nếu thiếu) trong các file locale đang dùng (`en/ja/vi`) để tránh fallback.

## Điểm cần giữ tương thích
- Luồng chết nhân vật tự nhiên (`Character.takeDamage -> gameManager.gameOver()`) vẫn hiển thị animation + dialog như hiện tại.
- Chỉ luồng “chơi lại” từ modal mới skip đoạn gọi:
  - `GameOverAnimation.runAsync(...)`
  - `this.showGameOverDialog()`

## Kiểm thử dự kiến
- Mở menu trong GameScene -> modal hiện đúng màu theo theme.
- Hover từng icon -> tooltip i18n hiển thị đúng ngôn ngữ.
- Continue: đóng modal, gameplay tiếp tục.
- Menu: về `MenuScene`.
- Replay: lưu kỷ lục vẫn cập nhật, không chạy animation/dialog game over, scene restart thành công.
- Luồng game over do chết nhân vật vẫn giữ behavior cũ.