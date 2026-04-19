---
name: Stage Card Asset Pipeline
overview: Bổ sung pipeline preload card theo `stageId` trong `AssetManager.preloadGameSceneAssets`, gom queue ảnh theo `libraryCards` + `dungeonList`, rồi chọn load ảnh lẻ hoặc atlas theo ngưỡng số lượng.
todos:
  - id: add-queue-model
    content: Thêm model và helper build queue từ dungeonList + libraryCards, dedupe theo entry.id
    status: completed
  - id: add-load-strategy
    content: Triển khai chiến lược load đơn hoặc atlas theo ngưỡng 10 và fallback khi atlas fail
    status: completed
  - id: wire-gamescene
    content: Tích hợp loadCardsByMaps vào preloadGameSceneAssets và giữ callback/load flow ổn định
    status: completed
  - id: verify-runtime
    content: Kiểm thử nhanh các stage tiêu biểu (<=10, >10, atlas-missing, treasure.contents)
    status: completed
isProject: false
---

# Implement loadCardsByMaps Pipeline

## Mục tiêu
Thêm luồng preload card cho `GameScene` trong [`C:/Users/inter/OneDrive/Documents/GitHub/TeyvatCardGameBackend/TeyvatCard/src/core/AssetManager.ts`](C:/Users/inter/OneDrive/Documents/GitHub/TeyvatCardGameBackend/TeyvatCard/src/core/AssetManager.ts) để:
- Đọc `availableCards` của map theo `stageId` từ [`C:/Users/inter/OneDrive/Documents/GitHub/TeyvatCardGameBackend/TeyvatCard/public/data/dungeonList.json`](C:/Users/inter/OneDrive/Documents/GitHub/TeyvatCardGameBackend/TeyvatCard/public/data/dungeonList.json).
- Mapping từng `className` sang entry trong [`C:/Users/inter/OneDrive/Documents/GitHub/TeyvatCardGameBackend/TeyvatCard/public/data/libraryCards.json`](C:/Users/inter/OneDrive/Documents/GitHub/TeyvatCardGameBackend/TeyvatCard/public/data/libraryCards.json).
- Dùng `entry.id` làm key duy nhất để kiểm tra đã có binding/frame và chống trùng queue.

## Cách triển khai
- Tạo kiểu dữ liệu nội bộ cho queue item: `{ id, path, attached? }`.
- Thêm helper trong `AssetManager`:
  - Flatten `libraryCards` thành map `className -> cardEntry`.
  - Tìm dungeon theo `stageId` và lấy danh sách className từ toàn bộ nhóm trong `availableCards`.
  - Hàm add vào queue dạng `Map<string, QueueItem>` (key = `id`) để loại trùng.
  - Khi thêm 1 card:
    - Bỏ qua nếu thiếu `id` hoặc `image`.
    - Bỏ qua nếu đã có texture/binding sẵn cho `id` (ưu tiên guard bằng `TextureManager.has(id)` và/hoặc `scene.textures.exists(id)`).
    - Nếu chưa có thì add `{ id, path: image, attached }` vào queue.
    - Nếu `type === 'treasure'` và `contents` có dữ liệu, duyệt từng className trong `contents` rồi add queue tương tự (chỉ 1 lần mỗi `id`).

## Quyết định load
- Nếu `queue.size <= 10`:
  - Load ảnh đơn qua `loadImage(id, path)`.
  - Sau khi load mỗi card chính, load tiếp mọi `attached` tương ứng bằng ảnh đơn.
- Nếu `queue.size > 10`:
  - Thử atlas JSON theo variant: `/assets/images/{variant}/atlas/{stageId}.json`.
  - Nếu atlas JSON không tồn tại/invalid/fail load thì fallback toàn bộ sang ảnh đơn.
  - Nếu atlas load thành công:
    - Đăng ký binding frame bằng `entry.id` (frame trong atlas dùng kebab-case id).
    - Với mỗi item trong queue có frame atlas thành công thì xử lý `attached` bằng ảnh đơn.

## Tích hợp vào luồng preload hiện tại
- Gọi `loadCardsByMaps(stageId)` trong `preloadGameSceneAssets` trước `scene.load.start()` để toàn bộ assets vào cùng một queue preload.
- Giữ nguyên load background + character asset hiện tại.
- Đảm bảo callback `preloadGameSceneAssets` vẫn chạy đúng một lần khi complete.

## Kiểm thử sau khi code
- Stage có ít card (<=10) xác nhận chỉ load ảnh đơn.
- Stage `babel_tower` xác nhận ưu tiên atlas nếu file tồn tại, và `attached` vẫn load ảnh đơn.
- Tạm đổi `stageId` sang giá trị không có atlas để xác nhận fallback chạy đúng.
- Đảm bảo không queue trùng khi card xuất hiện cả ở `availableCards` và `treasure.contents`.