// ============================================================================
// HUD EVENT SYSTEM - OPTIMIZED EVENT-DRIVEN HUD UPDATES
// ============================================================================

import { logger } from './logger';

// HUD Event Types - THE WORD OF THE LORD!
export interface HUDCoordinatesEvent {
  type: 'hud:coordinates';
  data: {
    x: number;
    y: number;
    z: number;
  };
}

export interface HUDTimeEvent {
  type: 'hud:time';
  data: {
    time: string;
  };
}

export interface HUDFPSEvent {
  type: 'hud:fps';
  data: {
    fps: number;
  };
}

export interface HUDStateEvent {
  type: 'hud:state';
  data: {
    state: string;
  };
}

export interface HUDBoostEvent {
  type: 'hud:boost';
  data: {
    status: string;
  };
}

export interface HUDCreditsEvent {
  type: 'hud:credits';
  data: {
    credits: number;
  };
}

export interface HUDPeersEvent {
  type: 'hud:peers';
  data: {
    count: number;
  };
}

// Union type for all HUD events
export type HUDEvent = 
  | HUDCoordinatesEvent 
  | HUDTimeEvent 
  | HUDFPSEvent 
  | HUDStateEvent 
  | HUDBoostEvent 
  | HUDCreditsEvent 
  | HUDPeersEvent;

// Event listener type
export type HUDEventListener<T extends HUDEvent = HUDEvent> = (event: T) => void;

/**
 * Centralized HUD Event System
 * Provides optimized event-driven updates for HUD components
 */
export class HUDEventSystem {
  private static listeners: Map<string, Set<HUDEventListener>> = new Map();
  private static eventQueue: HUDEvent[] = [];
  private static isProcessing = false;
  private static frameId: number | null = null;

  /**
   * Subscribe to a specific HUD event type
   * @param eventType The type of event to listen for
   * @param listener The callback function to execute when the event is emitted
   * @returns Unsubscribe function
   */
  public static subscribe<T extends HUDEvent>(
    eventType: T['type'],
    listener: HUDEventListener<T>
  ): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    
    this.listeners.get(eventType)!.add(listener as HUDEventListener);
    
    logger.info(`Subscribed to HUD event: ${eventType}`, { context: 'HUDEventSystem', tag: 'hud' });
    
    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(eventType);
      if (eventListeners) {
        eventListeners.delete(listener as HUDEventListener);
        if (eventListeners.size === 0) {
          this.listeners.delete(eventType);
        }
      }
    };
  }

  /**
   * Emit a HUD event (queued for next frame)
   * @param event The event to emit
   */
  public static emit(event: HUDEvent): void {
    this.eventQueue.push(event);
    
    // Schedule processing if not already scheduled
    if (!this.isProcessing && this.frameId === null) {
      this.scheduleProcessing();
    }
  }

  /**
   * Emit a HUD event immediately (synchronous)
   * @param event The event to emit
   */
  public static emitSync(event: HUDEvent): void {
    const listeners = this.listeners.get(event.type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          logger.error(`Error in HUD event listener for ${event.type}:`, { context: 'HUDEventSystem', tag: 'hud' });
        }
      });
    }
  }

  /**
   * Schedule event processing for next frame
   */
  private static scheduleProcessing(): void {
    this.frameId = requestAnimationFrame(() => {
      this.processEvents();
    });
  }

  /**
   * Process all queued events
   */
  private static processEvents(): void {
    this.isProcessing = true;
    this.frameId = null;

    // Process all events in the queue
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift()!;
      this.emitSync(event);
    }

    this.isProcessing = false;
  }

  /**
   * Clear all listeners and queued events
   */
  public static clear(): void {
    this.listeners.clear();
    this.eventQueue = [];
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
    this.isProcessing = false;
    logger.info('HUD event system cleared', { context: 'HUDEventSystem', tag: 'hud' });
  }

  /**
   * Get statistics about the event system
   */
  public static getStats(): {
    listenerCount: number;
    queuedEvents: number;
    isProcessing: boolean;
  } {
    let totalListeners = 0;
    this.listeners.forEach(listeners => {
      totalListeners += listeners.size;
    });

    return {
      listenerCount: totalListeners,
      queuedEvents: this.eventQueue.length,
      isProcessing: this.isProcessing
    };
  }
}

// Convenience functions for common HUD events
export const HUDEvents = {
  /**
   * Emit coordinates update event
   */
  coordinates: (x: number, y: number, z: number) => {
    HUDEventSystem.emit({
      type: 'hud:coordinates',
      data: { x, y, z }
    });
  },

  /**
   * Emit time update event
   */
  time: (time: string) => {
    HUDEventSystem.emit({
      type: 'hud:time',
      data: { time }
    });
  },

  /**
   * Emit FPS update event
   */
  fps: (fps: number) => {
    HUDEventSystem.emit({
      type: 'hud:fps',
      data: { fps }
    });
  },

  /**
   * Emit character state update event
   */
  state: (state: string) => {
    HUDEventSystem.emit({
      type: 'hud:state',
      data: { state }
    });
  },

  /**
   * Emit boost status update event
   */
  boost: (status: string) => {
    HUDEventSystem.emit({
      type: 'hud:boost',
      data: { status }
    });
  },

  /**
   * Emit credits update event
   */
  credits: (credits: number) => {
    HUDEventSystem.emit({
      type: 'hud:credits',
      data: { credits }
    });
  },

  /**
   * Emit peers count update event
   */
  peers: (count: number) => {
    HUDEventSystem.emit({
      type: 'hud:peers',
      data: { count }
    });
  }
};
