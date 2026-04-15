---
name: Theme Texture Rebinding
overview: Cập nhật luồng đổi theme để ngoài màu sắc còn đổi asset UI (`background`, `library`, `compass`, `equip`) bằng cách load texture key riêng theo từng file và chỉ đổi binding logic trong TextureManager.
todos:
  - id: theme-manager-scene-state
    content: Thêm giữ scene trong ThemeManager và helper đọc assets của theme hiện tại
    status: completed
  - id: theme-asset-load-rebind
    content: Implement load+rebind cho background/library/compass/equip trong setThemeByName với key format theme-*
    status: completed
  - id: icon-gpu-url-resolve
    content: Thêm helper đổi URL icon theo desktop/mobile từ AssetManager static GPU variant
    status: completed
  - id: texture-fallback-api
    content: Mở API fallback key ở TextureManager để ThemeManager rebind khi load lỗi
    status: completed
  - id: verify-flow
    content: Rà logic và lint để đảm bảo không phá luồng đổi màu/theme hiện có
    status: completed
isProject: false
---

# Kế hoạch cập nhật đổi ảnh theo theme

## Mục tiêu
Khi gọi đổi theme, hệ thống sẽ:
- Load texture image mới theo URL trong `theme.json`.
- Với icon (`library`, `compass`, `equip`) tự đổi đường dẫn sang biến thể GPU (`desktop`/`mobile`).
- Không ghi đè texture cũ trong Phaser; chỉ đổi ánh xạ logical key trong `TextureManager` sang texture key mới.

## Phạm vi sửa
- [src/core/ThemeManager.ts](src/core/ThemeManager.ts)
- [src/core/TextureManager.ts](src/core/TextureManager.ts)
- (đọc/khai thác) [public/data/theme.json](public/data/theme.json)

## Thiết kế thay đổi
- Trong `ThemeManager`:
  - Thêm state giữ `scene` hiện tại (set trong `loadTheme(scene, ...)`) để dùng cho `scene.load.image(...)` khi `setThemeByName(...)` chạy.
  - Mở rộng parse/lookup theme entry để lấy `assets.background` và `assets.icons` theo theme name.
  - Tạo helper tạo texture key theo format:
    - `theme-background-<fileNameNoExt>`
    - `theme-library-<fileNameNoExt>`
    - `theme-compass-<fileNameNoExt>`
    - `theme-equip-<fileNameNoExt>`
  - Tạo helper resolve URL icon theo GPU profile:
    - `/assets/images/ui/...` -> `/assets/images/<desktop|mobile>/ui/...`
    - dùng `AssetManager.getAssetVariantByGpuProfile()`.
  - Trong `setThemeByName(...)`:
    - Giữ logic set palette + lưu `dataManager` như hiện tại.
    - Queue load 4 texture theme assets (nếu có URL hợp lệ), chờ complete.
    - Sau khi mỗi texture có trong `scene.textures`, gọi upsert binding logical key tương ứng (`background`, `library`, `compass`, `equip`) qua `TextureManager`.
    - Nếu file load lỗi/không có texture sau complete, rebind logical key sang fallback texture hệ thống.

- Trong `TextureManager`:
  - Bổ sung helper public để lấy fallback texture key theo `scene` (tái sử dụng logic hiện có, không duplicate ở `ThemeManager`).
  - Giữ nguyên cơ chế `upsertImageBinding(...)` để đổi trỏ logical key -> texture key mà không chạm texture cũ.

## Kỳ vọng hành vi
- Ví dụ theme `default`:
  - URL `/assets/images/ui/background/default.webp` -> load key `theme-background-default`.
  - `TextureManager` mapping `background` -> `theme-background-default`.
- Đổi sang `furina`:
  - URL `/assets/images/ui/background/Gejuyuan.webp` -> load key `theme-background-Gejuyuan`.
  - Mapping đổi sang `background` -> `theme-background-Gejuyuan`.
- Icon dùng URL GPU-variant, ví dụ:
  - `/assets/images/ui/compass/fontaine.webp` -> `/assets/images/desktop/ui/compass/fontaine.webp` (hoặc `mobile`).

## Kiểm tra sau khi code
- Gọi đổi theme qua UI settings:
  - `background`, `library`, `compass`, `equip` đổi đúng ảnh theo theme mới.
- Kiểm tra không có ghi đè texture key cũ trong Phaser (`theme-*` key mới được tạo riêng).
- Test case lỗi file (đổi tạm URL sai): logical key chuyển sang fallback texture thay vì crash.
- Chạy lint trên 2 file core vừa sửa.