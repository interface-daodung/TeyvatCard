import Phaser from 'phaser';
import rexui from 'phaser3-rex-plugins/dist/rexuiplugin.js';
import LoadingScene from './scenes/LoadingScene.js';
import GameScene from './scenes/GameScene.js';
import MenuScene from './scenes/MenuScene.js';
import EquipScene from './scenes/EquipScene.js';
import LibraryScene from './scenes/LibraryScene.js';
import MapScenes from './scenes/MapScenes.js';
import SelectCharacterScene from './scenes/SelectCharacterScene.js';
import SettingsScene from './scenes/SettingsScene.js';
import TestGraphicsRenderTexture from './scenes/TestGraphicsRenderTexture.js';
import './utils/GameEventsManager.js';

// Cấu hình game
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 720,
  height: 1280,
  parent: 'game-container',
  backgroundColor: '#000000', // Sẽ được override bởi themeManager
  scale: {
    mode: Phaser.Scale.FIT,   // tự động scale cho khớp
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  plugins: {
    scene: [
      {
        key: 'rexUI',
        plugin: rexui,
        mapping: 'rexUI'
      }
    ]
  },
  scene: [LoadingScene, MenuScene, SelectCharacterScene, EquipScene, LibraryScene, MapScenes, GameScene, SettingsScene, TestGraphicsRenderTexture]
};

// Khởi tạo game
const game = new Phaser.Game(config);

// Export để có thể truy cập từ console
(window as Window & { game?: Phaser.Game }).game = game;
