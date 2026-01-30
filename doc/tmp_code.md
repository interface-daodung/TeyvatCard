import Phaser from 'phaser';
// @ts-ignore
import rexui from 'phaser3-rex-plugins/templates/ui/ui-plugin.js';
import { MainScene } from './src/TranslationsDemoScene';

// Cấu hình game
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 720,
  height: 1280,
  parent: 'game-container',
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.FIT,
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
  scene: [MainScene]
};

new Phaser.Game(config);
