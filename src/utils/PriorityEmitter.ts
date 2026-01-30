/**
 * PriorityEmitter - Bộ phát sự kiện với thứ tự ưu tiên
 * Cho phép đăng ký các hàm lắng nghe sự kiện với mức độ ưu tiên và thực thi theo thứ tự
 */

interface ListenerObj {
    listener: (...args: any[]) => void;
    priority: number;
    id: number;
}

export default class PriorityEmitter {
    static DEFAULT_PRIORITY = 0;
    private events: Map<string, ListenerObj[]>;

    constructor() {
        this.events = new Map(); // Lưu trữ các sự kiện và hàm lắng nghe
    }

    /**
     * Đăng ký hàm lắng nghe sự kiện với mức ưu tiên
     * @param eventName - Tên sự kiện
     * @param listener - Hàm sẽ được thực thi khi sự kiện được phát ra
     * @param priority - Mức độ ưu tiên (số nhỏ hơn = ưu tiên cao hơn, mặc định: 0)
     * @returns Hàm hủy đăng ký
     */
    on(eventName: string, listener: (...args: any[]) => void, priority: number = PriorityEmitter.DEFAULT_PRIORITY): () => void {
        if (!this.events.has(eventName)) {
            this.events.set(eventName, []);
        }

        const eventListeners = this.events.get(eventName)!;
        const listenerObj: ListenerObj = { listener, priority, id: Date.now() + Math.random() };

        // Thêm hàm lắng nghe và sắp xếp theo thứ tự ưu tiên (tăng dần)
        eventListeners.push(listenerObj);
        eventListeners.sort((a, b) => a.priority - b.priority);

        // Trả về hàm hủy đăng ký
        return () => this.off(eventName, listenerObj.id);
    }

    /**
     * Đăng ký hàm lắng nghe sự kiện một lần với mức ưu tiên
     */
    once(eventName: string, listener: (...args: any[]) => void, priority: number = PriorityEmitter.DEFAULT_PRIORITY): () => void {
        const onceWrapper = (...args: any[]) => {
            listener(...args);
            this.off(eventName, onceWrapper);
        };

        return this.on(eventName, onceWrapper, priority);
    }

    /**
     * Hủy đăng ký hàm lắng nghe sự kiện
     * @param eventName - Tên sự kiện
     * @param listenerOrId - Hàm lắng nghe hoặc ID của hàm lắng nghe
     */
    off(eventName: string, listenerOrId: ((...args: any[]) => void) | number): void {
        if (!this.events.has(eventName)) return;

        const eventListeners = this.events.get(eventName)!;
        const index = eventListeners.findIndex(item =>
            item.listener === listenerOrId || item.id === listenerOrId
        );

        if (index !== -1) {
            eventListeners.splice(index, 1);

            // Xóa sự kiện nếu không còn hàm lắng nghe nào
            if (eventListeners.length === 0) {
                this.events.delete(eventName);
            }
        }
    }

    /**
     * Xóa tất cả hàm lắng nghe cho một sự kiện cụ thể
     * @param eventName - Tên sự kiện (nếu không có thì xóa tất cả)
     */
    removeAllListeners(eventName?: string): void {
        if (eventName) {
            this.events.delete(eventName);
        } else {
            this.events.clear();
        }
    }

    /**
     * Phát ra sự kiện đến tất cả hàm lắng nghe đã đăng ký theo thứ tự ưu tiên
     */
    emit(eventName: string, ...args: any[]): boolean {
        if (!this.events.has(eventName)) {
            return false;
        }

        const eventListeners = this.events.get(eventName)!;

        // Thực thi các hàm lắng nghe theo thứ tự ưu tiên (đã được sắp xếp)
        for (const { listener } of eventListeners) {
            try {
                listener(...args);
            } catch (error) {
                console.error(`Lỗi trong hàm lắng nghe sự kiện ${eventName}:`, error);
            }
        }

        return true;
    }

    /**
     * Lấy số lượng hàm lắng nghe cho một sự kiện cụ thể
     */
    listenerCount(eventName: string): number {
        return this.events.has(eventName) ? this.events.get(eventName)!.length : 0;
    }

    /**
     * Lấy tất cả tên sự kiện đã đăng ký
     */
    eventNames(): string[] {
        return Array.from(this.events.keys());
    }

    /**
     * Kiểm tra xem một sự kiện có hàm lắng nghe nào không
     */
    hasListeners(eventName: string): boolean {
        return this.listenerCount(eventName) > 0;
    }
}
