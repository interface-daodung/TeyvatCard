import { EventEmitter } from 'events';

declare global {
    interface Window {
        gameEvents?: GameEventsManager;
    }
}

/**
 * Global event manager cho game
 */
class GameEventsManager extends EventEmitter {
    constructor() {
        super();
        this.setMaxListeners(50); // Tăng số listener tối đa
    }

    /**
     * Emit event với data
     * Wrap trong try-catch để đảm bảo tất cả listeners đều được gọi
     */
    override emit(event: string, ...args: any[]): boolean {
        console.log(`GameEvent: ${event}`, args);
        const listeners = this.listeners(event);
        console.log(`GameEvent: ${event} - Number of listeners:`, listeners.length);
        
        // Gọi từng listener với try-catch để không làm interrupt nếu một listener có lỗi
        let hasError = false;
        listeners.forEach((listener, index) => {
            try {
                console.log(`GameEvent: ${event} - Calling listener ${index}`);
                if (typeof listener === 'function') {
                    listener(...args);
                }
            } catch (error) {
                console.error(`GameEvent: ${event} - Error in listener ${index}:`, error);
                hasError = true;
                // Tiếp tục gọi các listener khác
            }
        });
        
        return !hasError;
    }

    /**
     * Listen for event với callback
     */
    override on(event: string, callback: (...args: any[]) => void): this {
        return super.on(event, callback);
    }

    /**
     * Remove event listener
     */
    override off(event: string, callback: (...args: any[]) => void): this {
        return super.off(event, callback);
    }
}

// Global instance
const gameEvents = new GameEventsManager();
window.gameEvents = gameEvents;

export default gameEvents;
