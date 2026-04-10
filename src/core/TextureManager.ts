import Phaser from 'phaser';
import { Log } from '../utils/Log.js';

/** Cách load texture tương ứng với một logical key (sau khi đã load trong preload / AssetManager). */
type TextureBinding =
    | { kind: 'atlas'; atlasKey: string; frameName: string }
    | { kind: 'image'; textureKey: string };

function getScene(parent: Phaser.Scene | Phaser.GameObjects.Container): Phaser.Scene {
    if (parent instanceof Phaser.GameObjects.Container) {
        return parent.scene;
    }
    return parent;
}

/**
 * Đăng ký tên logic → atlas + frame hoặc texture đơn (key Phaser sau load).
 * Mỗi `keyName` chỉ đăng ký một lần; trùng tên sẽ throw.
 */
export default class TextureManager {
    private static readonly registry = new Map<string, TextureBinding>();

    /** Binding vật lý (atlas+frame hoặc texture đơn) → `keyName` logic đăng ký đầu tiên — để cảnh báo trùng. */
    private static readonly firstLogicalKeyByPhysical = new Map<string, string>();

    private static physicalKeyAtlas(atlasKey: string, frameName: string): string {
        return `atlas:${atlasKey}\x1e${frameName}`;
    }

    private static physicalKeyImage(textureKey: string): string {
        return `image:${textureKey}`;
    }

    /**
     * Hai `keyName` khác nhau trỏ cùng atlas+frame hoặc cùng texture đơn → vẫn cho phép, nhưng log warning (dev).
     */
    private static warnIfDuplicatePhysicalBinding(
        physicalKey: string,
        keyName: string,
        describe: string,
    ): void {
        const first = TextureManager.firstLogicalKeyByPhysical.get(physicalKey);
        if (first !== undefined && first !== keyName) {
            Log.warn(
                `[TextureManager] Logical key "${keyName}" maps to the same ${describe} as "${first}".`,
            );
        }
        if (first === undefined) {
            TextureManager.firstLogicalKeyByPhysical.set(physicalKey, keyName);
        }
    }

    /**
     * Frame trong atlas đã load (ví dụ `this.load.atlas('cards', ...)` → atlasKey `'cards'`).
     */
    static registerAtlas(keyName: string, atlasKey: string, frameName: string): void {
        TextureManager.assertUnique(keyName);
        TextureManager.warnIfDuplicatePhysicalBinding(
            TextureManager.physicalKeyAtlas(atlasKey, frameName),
            keyName,
            `atlas frame (atlasKey="${atlasKey}", frameName="${frameName}")`,
        );
        TextureManager.registry.set(keyName, { kind: 'atlas', atlasKey, frameName });
    }

    /**
     * Ảnh đơn đã load (ví dụ `this.load.image('logo', ...)` → textureKey `'logo'`).
     */
    static registerImage(keyName: string, textureKey: string): void {
        TextureManager.assertUnique(keyName);
        TextureManager.warnIfDuplicatePhysicalBinding(
            TextureManager.physicalKeyImage(textureKey),
            keyName,
            `image texture (textureKey="${textureKey}")`,
        );
        TextureManager.registry.set(keyName, { kind: 'image', textureKey });
    }

    /**
     * Giống `registerAtlas` nhưng gọi lại an toàn: cùng binding thì bỏ qua; khác binding thì throw.
     * Dùng khi AssetManager/AnimationManager đăng ký mặc định sau mỗi lần load atlas.
     */
    static registerAtlasDefault(keyName: string, atlasKey: string, frameName: string): void {
        const existing = TextureManager.registry.get(keyName);
        if (existing) {
            if (
                existing.kind === 'atlas' &&
                existing.atlasKey === atlasKey &&
                existing.frameName === frameName
            ) {
                return;
            }
            throw new Error(
                `TextureManager: key "${keyName}" already registered with a different binding.`,
            );
        }
        TextureManager.warnIfDuplicatePhysicalBinding(
            TextureManager.physicalKeyAtlas(atlasKey, frameName),
            keyName,
            `atlas frame (atlasKey="${atlasKey}", frameName="${frameName}")`,
        );
        TextureManager.registry.set(keyName, { kind: 'atlas', atlasKey, frameName });
    }

    /**
     * Giống `registerImage` nhưng gọi lại an toàn: cùng texture thì bỏ qua; khác binding thì throw.
     */
    static registerImageDefault(keyName: string, textureKey: string): void {
        const existing = TextureManager.registry.get(keyName);
        if (existing) {
            if (existing.kind === 'image' && existing.textureKey === textureKey) {
                return;
            }
            throw new Error(
                `TextureManager: key "${keyName}" already registered with a different binding.`,
            );
        }
        TextureManager.warnIfDuplicatePhysicalBinding(
            TextureManager.physicalKeyImage(textureKey),
            keyName,
            `image texture (textureKey="${textureKey}")`,
        );
        TextureManager.registry.set(keyName, { kind: 'image', textureKey });
    }

    private static assertUnique(keyName: string): void {
        if (TextureManager.registry.has(keyName)) {
            throw new Error(
                `TextureManager: key "${keyName}" is already registered; each logical key must be unique.`,
            );
        }
    }

    static has(keyName: string): boolean {
        return TextureManager.registry.has(keyName);
    }

    /**
     * Tạo `Image` theo tên logic đã đăng ký.
     * - `parent` là Scene: thêm image vào scene.
     * - `parent` là Container: tạo bằng scene của container rồi `container.add(image)` (tọa độ local trong container).
     */
    static image(
        parent: Phaser.Scene | Phaser.GameObjects.Container,
        x: number,
        y: number,
        keyName: string,
    ): Phaser.GameObjects.Image {
        const binding = TextureManager.registry.get(keyName);
        if (!binding) {
            throw new Error(
                `TextureManager: unknown key "${keyName}". Register with registerAtlas or registerImage first.`,
            );
        }

        const scene = getScene(parent);
        let image: Phaser.GameObjects.Image;
        if (binding.kind === 'atlas') {
            image = scene.add.image(x, y, binding.atlasKey, binding.frameName);
        } else {
            image = scene.add.image(x, y, binding.textureKey);
        }

        if (parent instanceof Phaser.GameObjects.Container) {
            parent.add(image);
        }

        return image;
    }
}
