# 🎮 Teyvat Card

<div align="center">

![Teyvat Card](https://img.shields.io/badge/Game-Teyvat%20Card-blue?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Phaser](https://img.shields.io/badge/Phaser-3.87.0-green?style=for-the-badge)
![Vite](https://img.shields.io/badge/Vite-6.2.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)

**A card-based combat game built with Phaser 3 and TypeScript**

[🎮 Play Demo](https://your-username.github.io/TeyvatCard/) • [📖 Documentation](#-features) • [🐛 Report Bug](https://github.com/your-username/TeyvatCard/issues)

</div>

---

## 📖 Giới thiệu

**Teyvat Card** là một game chiến đấu theo lượt sử dụng hệ thống thẻ bài, được xây dựng với Phaser 3 và TypeScript. Game mang đến trải nghiệm chiến đấu chiến thuật với hệ thống progression phong phú, giao diện hiện đại và tối ưu hóa hiệu suất.

### 🎯 Tính năng chính

- 🃏 **Card-based Combat System**: Sử dụng các lá bài để tấn công, phòng thủ và sử dụng phép thuật
- ⏱️ **Turn-based Gameplay**: Lối chơi theo lượt với hệ thống thẻ bài chiến thuật
- 📈 **Player Progression**: Hệ thống level, score và stats chi tiết
- 🎨 **Modern UI**: Giao diện đẹp mắt với animations và effects sử dụng RexUI
- 📱 **Responsive Design**: Tương thích với nhiều kích thước màn hình
- 🖼️ **Sprite Sheet Optimization**: Tối ưu hóa tài nguyên với sprite sheet tự động
- 📦 **Advanced Asset Management**: Quản lý tài nguyên hiệu quả với AssetManager
- ✨ **Animation System**: Hệ thống animation mạnh mẽ với AnimationManager
- ⚔️ **Weapon Trading System**: Hệ thống bán vũ khí thông minh với giá trị dựa trên độ bền
- 🌍 **Multi-language Support**: Hỗ trợ đa ngôn ngữ (English, Tiếng Việt, 日本語)

---

## 🚀 Deploy Status

Website luôn được cập nhật tự động! 🎉

[![Deploy Status](https://github.com/your-username/TeyvatCard/workflows/Deploy%20to%20GitHub%20Pages/badge.svg)](https://github.com/your-username/TeyvatCard/actions)

### ✅ Tính năng tự động:
- ✅ Auto-deploy mỗi khi push code lên main branch
- ✅ Build tự động trên GitHub servers
- ✅ Không cần build local hay upload thủ công
- ✅ Deploy ngay lập tức sau khi push

### 🔧 Workflow hoạt động:
1. **Push code** → GitHub Actions tự động kích hoạt
2. **Build dự án** → Sử dụng Node.js và npm
3. **Deploy lên Pages** → Tự động tạo website

### 📁 Cấu trúc deployment:
```
.github/workflows/deploy.yml  # GitHub Actions workflow
dist/                        # Build output (auto-generated)
```

---

## 🛠️ Công nghệ sử dụng

### Core Technologies
- **TypeScript** - Type-safe JavaScript
- **Node.js** - Runtime environment
- **Phaser 3.87.0** - Game framework
- **Vite 6.2.0** - Build tool và dev server
- **RexUI** - Advanced UI components
- **ES6 Modules** - Module system

### Additional Tools
- **Sharp** - Image processing cho sprite sheets
- **HTML5 Canvas** - Rendering engine
- **CSS3** - Styling và animations
- **GitHub Actions** - Auto-deployment

---

## 🎮 Hướng dẫn chơi

### Menu Navigation
- **Menu**: Chọn "START GAME" để bắt đầu
- **Character Selection**: Chọn nhân vật yêu thích từ danh sách
- **Equipment**: Tùy chỉnh trang bị và vũ khí
- **Library**: Xem thư viện thẻ và thông tin
- **Map**: Chọn dungeon để khám phá

### Combat System
- **Click vào enemy** để chọn mục tiêu
- **Click vào card** để sử dụng
- Sử dụng chiến thuật để chiến thắng!

### Weapon Trading
- 🪙 **Sell Weapon**: Bán vũ khí để nhận tiền dựa trên độ bền
- Nút bán vũ khí xuất hiện khi có vũ khí với độ bền > 0
- Giá trị bán = độ bền hiện tại của vũ khí
- Vũ khí mới chỉ được nhận nếu có độ bền cao hơn vũ khí hiện tại

---

## 📦 Cài đặt và Chạy

### Yêu cầu
- Node.js >= 18
- npm hoặc yarn

### Cài đặt

```bash
# Clone repository
git clone https://github.com/your-username/TeyvatCard.git
cd TeyvatCard

# Install dependencies
npm install
```

### Development

```bash
# Chạy dev server
npm run dev

# Server sẽ chạy tại http://localhost:3000
```

### Build

```bash
# Build cho production
npm run build

# Preview build
npm run preview
```

---

## 📁 Cấu trúc dự án

```
TeyvatCard/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions workflow
├── dist/                        # Build output (auto-generated)
├── doc/                         # Documentation
├── i18n/                        # Internationalization
│   └── locales/                 # Translation files
├── public/                      # Static assets
│   └── assets/                  # Images, sounds, etc.
├── src/
│   ├── core/                    # Core game systems
│   │   ├── AnimationManager.ts
│   │   ├── AssetManager.ts
│   │   ├── CardManager.ts
│   │   └── GameManager.ts
│   ├── data/                    # Game data
│   ├── models/                  # Game models
│   ├── modules/                 # Game modules
│   ├── scenes/                  # Phaser scenes
│   └── utils/                   # Utility functions
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🌟 Tính năng nổi bật

### 🎨 Giao diện người dùng
- Gradient text effects
- Smooth animations
- Responsive layout
- Modern UI components với RexUI

### 🎯 Gameplay
- Turn-based combat system
- Card collection và management
- Character progression
- Weapon system với durability

### 🔧 Technical
- Type-safe codebase với TypeScript
- Optimized asset loading
- Sprite sheet management
- Event-driven architecture

---

## 🤝 Đóng góp

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the ISC License.

---

## 👨‍💻 Tác giả

**Đào Mạnh Dũng**

- GitHub: [interface-daodung](https://github.com/interface-daodung)
- Email: interface.daodung@gmail.com

---

## 🙏 Lời cảm ơn

- [Phaser](https://phaser.io/) - Amazing game framework
- [RexUI](https://github.com/rexrainbow/phaser3-rex-plugins) - Powerful UI plugins
- [Vite](https://vitejs.dev/) - Next generation frontend tooling

---

<div align="center">

Made with ❤️ by Đào Mạnh Dũng

⭐ Star this repo if you find it helpful!

</div>
