import type { SceneWithGameManager } from './Card.js';

export type CardShieldStack = {
    nameIdOfShield: string;
    amount: number;
    turnsRemaining: number;
};

export type CardShieldStackManagerOptions = {
    getScene: () => SceneWithGameManager;
    getDestroyed: () => boolean;
    getUnsubscribeList: () => Array<() => void>;
    applyShieldTotal: (total: number) => void;
    /** Ưu tiên listener `completeMove` (mặc định 8). */
    expirePriority?: number;
};

/**
 * Stack khiên + hết hạn theo `completeMove` (dùng chung Enemy / Character).
 */
export class CardShieldStackManager {
    private stacks: CardShieldStack[] = [];
    private unsubShieldExpire: (() => void) | undefined;
    private readonly expirePriority: number;

    constructor(private readonly opts: CardShieldStackManagerOptions) {
        this.expirePriority = opts.expirePriority ?? 8;
    }

    getTotal(): number {
        return this.stacks.reduce((s, st) => s + st.amount, 0);
    }

    private sync(): void {
        this.opts.applyShieldTotal(this.getTotal());
    }

    private clearUnsubIfNoStacks(): void {
        if (this.stacks.length > 0 || !this.unsubShieldExpire) return;
        this.unsubShieldExpire();
        this.unsubShieldExpire = undefined;
    }

    private ensureSubscription(): void {
        if (this.unsubShieldExpire) return;
        const gm = this.opts.getScene().gameManager;
        if (!gm) return;
        const unsub = gm.emitter.on('completeMove', () => this.expireShield(), this.expirePriority);
        if (unsub && typeof unsub === 'function') {
            this.unsubShieldExpire = unsub;
            this.opts.getUnsubscribeList().push(unsub);
        }
    }

    expireShield(): void {
        if (this.opts.getDestroyed()) return;
        if (this.stacks.length === 0) {
            this.clearUnsubIfNoStacks();
            return;
        }
        for (const st of this.stacks) {
            st.turnsRemaining -= 1;
        }
        this.stacks = this.stacks.filter(st => st.turnsRemaining > 0 && st.amount > 0);
        this.sync();
        this.clearUnsubIfNoStacks();
    }

    absorb(amount: number): void {
        if (amount <= 0) return;
        let left = amount;
        const next: CardShieldStack[] = [];
        for (const st of this.stacks) {
            if (left <= 0) {
                next.push(st);
                continue;
            }
            const take = Math.min(st.amount, left);
            const rest = st.amount - take;
            left -= take;
            if (rest > 0) {
                next.push({ ...st, amount: rest });
            }
        }
        this.stacks = next;
        this.sync();
        this.clearUnsubIfNoStacks();
    }

    addShield(amount: number, turnsToExpire: number = 1, nameIdOfShield: string = 'default'): boolean {
        if (amount <= 0 || turnsToExpire <= 0) return false;
        const idx = this.stacks.findIndex(s => s.nameIdOfShield === nameIdOfShield);
        if (idx >= 0) {
            const cur = this.stacks[idx]!;
            if (amount <= cur.amount) return false;
            cur.amount = amount;
            cur.turnsRemaining = turnsToExpire;
        } else {
            this.stacks.push({
                nameIdOfShield,
                amount,
                turnsRemaining: turnsToExpire
            });
        }
        this.sync();
        this.ensureSubscription();
        return true;
    }
}
