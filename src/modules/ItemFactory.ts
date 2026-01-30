import type Item from './Item.js';
import BlackHole from '../models/items/BlackHole.js';
import Catalyst from '../models/items/Catalyst.js';
import Claw from '../models/items/Claw.js';
import Cooldown from '../models/items/Cooldown.js';
import Corruption from '../models/items/Corruption.js';
import HealingPotion from '../models/items/HealingPotion.js';
import Refinement from '../models/items/Refinement.js';
import Repair from '../models/items/Repair.js';
import Seasoning from '../models/items/Seasoning.js';
import Sword from '../models/items/Sword.js';
import TaxWaiver from '../models/items/TaxWaiver.js';
import Toxic from '../models/items/Toxic.js';

type ItemConstructor = new () => Item;

/**
 * Class ItemFactory - Singleton factory để tạo và quản lý các item trong game
 */
class ItemFactory {
    static instance: ItemFactory | null = null;
    items: Map<string, ItemConstructor>;

    constructor() {
        if (ItemFactory.instance) {
            return ItemFactory.instance;
        }

        this.items = new Map();
        this.initializeItems();

        ItemFactory.instance = this;
    }

    static getInstance(): ItemFactory {
        if (!ItemFactory.instance) {
            ItemFactory.instance = new ItemFactory();
        }
        return ItemFactory.instance;
    }

    initializeItems(): void {
        this.items.set('healing-potion', HealingPotion as ItemConstructor);
        this.items.set('toxic', Toxic as ItemConstructor);
        this.items.set('claw', Claw as ItemConstructor);
        this.items.set('cooldown', Cooldown as ItemConstructor);
        this.items.set('sword', Sword as ItemConstructor);
        this.items.set('catalyst', Catalyst as ItemConstructor);
        this.items.set('refinement', Refinement as ItemConstructor);
        this.items.set('seasoning', Seasoning as ItemConstructor);
        this.items.set('repair', Repair as ItemConstructor);
        this.items.set('black-hole', BlackHole as ItemConstructor);
        this.items.set('tax-waiver', TaxWaiver as ItemConstructor);
        this.items.set('corruption', Corruption as ItemConstructor);
    }

    createItem(itemKey: string): Item | null {
        const ItemClass = this.items.get(itemKey);
        if (ItemClass) {
            return new ItemClass();
        }
        return null;
    }

    getItemKeys(): string[] {
        return Array.from(this.items.keys());
    }
}

const itemFactory = ItemFactory.getInstance();
export default itemFactory;
