# Hướng dẫn Cấu hình Dự án (Configuration Guide)

Tài liệu này giải thích chi tiết về tác dụng và các lưu ý quan trọng của các file cấu hình trong dự án.

## 1. `tsconfig.json`
Đây là file cấu hình cho trình biên dịch **TypeScript**. Nó quy định cách TypeScript sẽ kiểm tra lỗi và biên dịch code của bạn.

*   **Tác dụng chính:**
    *   `compilerOptions`: Chứa các thiết lập biên dịch.
    *   `"target": "ES2022"`: Code sau khi biên dịch sẽ theo chuẩn JavaScript hiện đại.
    *   `"jsx": "react-jsx"`: Hỗ trợ cú pháp JSX của React.
    *   `"baseUrl": "."` & `"paths"`: Cấu hình `alias`, cho phép bạn import file gọn hơn. Ví dụ: thay vì `../../components/Button` có thể dùng `@/components/Button`.
    *   `"resolveJsonModule": true`: Cho phép import trực tiếp file JSON vào file TS (Ví dụ: `import en from './en.json'`).

*   **Lưu ý:**
    *   Nếu bạn gặp lỗi import không tìm thấy module, hãy kiểm tra lại phần `paths` và `baseUrl`.
    *   File này đã được tinh chỉnh để làm việc tốt với Vite và React (đã loại bỏ giới hạn `types: ["node"]`).

## 2. `vite.config.ts`
Đây là file cấu hình cho **Vite** (công cụ build và dev server).

*   **Tác dụng chính:**
    *   `server`: Cấu hình server chạy local. Hiện tại đang set port `3000`.
    *   `plugins`: Sử dụng plugin `react()` để hỗ trợ React.
    *   `define`: Dùng để đưa các biến môi trường vào trong code client. Code hiện tại đang đưa `GEMINI_API_KEY` từ `.env` vào `process.env`.
    *   `resolve.alias`: Đồng bộ cấu hình alias với `tsconfig.json`, giúp Vite hiểu được ký hiệu `@`.

*   **Lưu ý:**
    *   **Bảo mật**: Việc gán `process.env.GEMINI_API_KEY` trong `define` có nghĩa là key này sẽ hiển thị trong code client. Chỉ dùng cho môi trường dev hoặc nếu key này được phép public (public key).
    *   Nếu đổi port, cần đổi ở đây.

## 3. `package.json`
File "căn cước công dân" của dự án Node.js.

*   **Tác dụng chính:**
    *   `scripts`: Các lệnh chạy nhanh.
        *   `npm run dev`: Chạy server phát triển.
        *   `npm run build`: Đóng gói dự án để deploy.
    *   `dependencies`: Các thư viện cần thiết để dự án chạy (Phaser, React, ...).
    *   `devDependencies`: Các thư viện chỉ dùng lúc code/build (TypeScript, Vite, ...).
    *   `"type": "module"`: Xác định dự án dùng ES Modules (dùng `import`/`export` thay vì `require`).

*   **Lưu ý:**
    *   Khi thêm thư viện mới bằng `npm install`, file này sẽ tự động cập nhật.
    *   Luôn kiểm tra `scripts` để biết cách chạy dự án.

## 4. `.env.local`
File chứa biến môi trường cục bộ.

*   **Tác dụng chính:**
    *   Lưu trữ các bí mật (secrets) hoặc cấu hình riêng cho máy của bạn, ví dụ: API Key, Database URL.
    *   Trong dự án này, nó chứa `GEMINI_API_KEY`.

*   **Lưu ý quan trọng:**
    *   **KHÔNG BAO GIỜ** commit file này lên Git (nó đã được thêm vào `.gitignore`).
    *   Mỗi thành viên trong team sẽ cần tự tạo file này trên máy của họ.

## 5. `.gitignore`
File quy định những gì Git nên **bỏ qua**.

*   **Tác dụng chính:**
    *   Tránh commit các file rác, file sinh ra trong quá trình build (`dist`, `node_modules`).
    *   Tránh commit các file bảo mật (`.env`, `.env.local`).

*   **Lưu ý:**
    *   Nếu bạn thêm một file cấu hình nhạy cảm mới, hãy nhớ thêm tên nó vào đây.

## 6. `metadata.json`
File metadata (dữ liệu mô tả) của dự án.

*   **Tác dụng chính:**
    *   Chứa tên (`name`), mô tả (`description`) và các quyền hạn (`requestFramePermissions`).
    *   Thường dùng cho các tool quản lý project hoặc template generator.

*   **Lưu ý:**
    *   File này có thể không ảnh hưởng trực tiếp đến việc chạy code, nhưng quan trọng để mô tả dự án.








