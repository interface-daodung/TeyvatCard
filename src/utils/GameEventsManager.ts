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
     */
    override emit(event: string, ...args: any[]): boolean {
        console.log(`GameEvent: ${event}`, args);
        return super.emit(event, ...args);
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
