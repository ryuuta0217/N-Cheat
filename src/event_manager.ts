import {NCheatEvent} from "./events";

export class EventManager {
    listeners: { [event: string]: ((event: NCheatEvent<any, any>) => Promise<void>)[]} = {};

    addEventListener(event: string, listener: (event: NCheatEvent<any, any>) => Promise<void>): void {
        if (this.listeners[event] == null) this.listeners[event] = [];
        this.listeners[event].push(listener);
    }

    removeEventListener(event: string, listener: (event: NCheatEvent<any, any>) => Promise<void>): void {
        if (this.listeners[event] == null) return;
        this.listeners[event] = this.listeners[event].filter(l => l !== listener);
    }

    async dispatchEvent(event: NCheatEvent<any, any>): Promise<void> {
        if (this.listeners[event.getType()] != null) {
            for (const listener of this.listeners[event.getType()]) {
                await listener(event);
            }
        }
    }
}