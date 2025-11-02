// ============================================================================
// AUDIO STATE MANAGER - CENTRALIZED AUDIO VOLUME CONTROL
// ============================================================================

import { logger } from '../utils/logger';

export interface AudioState {
  masterVolume: number; // 0-100
  sfxVolume: number;    // 0-100
  musicVolume: number;  // 0-100
}

export class AudioStateManager {
  private static instance: AudioStateManager | null = null;
  private audioState: AudioState;
  private listeners: Set<(state: AudioState) => void> = new Set();

  private constructor() {
    this.audioState = {
      masterVolume: 100,
      sfxVolume: 100,
      musicVolume: 100
    };
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): AudioStateManager {
    if (!this.instance) {
      this.instance = new AudioStateManager();
    }
    return this.instance;
  }

  /**
   * Get current audio state
   */
  public getAudioState(): AudioState {
    return { ...this.audioState };
  }

  /**
   * Update audio state and notify listeners
   */
  public updateAudioState(newState: Partial<AudioState>): void {
    const oldState = { ...this.audioState };
    this.audioState = { ...this.audioState, ...newState };
    
    console.log('AudioStateManager: State updated', {
      old: oldState,
      new: this.audioState
    });

    // Notify all listeners
    this.listeners.forEach(listener => {
      try {
        listener(this.audioState);
      } catch (error) {
        console.error('Error in audio state listener:', error);
      }
    });

    logger.info('Audio state updated', 'AudioStateManager', { state: this.audioState });
  }

  /**
   * Subscribe to audio state changes
   */
  public subscribe(listener: (state: AudioState) => void): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get effective volume for SFX (master * sfx / 10000)
   */
  public getEffectiveSFXVolume(): number {
    return (this.audioState.masterVolume * this.audioState.sfxVolume) / 10000;
  }

  /**
   * Get effective volume for Music (master * music / 10000)
   */
  public getEffectiveMusicVolume(): number {
    return (this.audioState.masterVolume * this.audioState.musicVolume) / 10000;
  }

  /**
   * Get effective volume for a specific sound type
   */
  public getEffectiveVolume(soundType: 'sfx' | 'music'): number {
    switch (soundType) {
      case 'sfx':
        return this.getEffectiveSFXVolume();
      case 'music':
        return this.getEffectiveMusicVolume();
      default:
        return this.getEffectiveSFXVolume();
    }
  }

  /**
   * Convert percentage (0-100) to decimal (0-1)
   */
  public static percentageToDecimal(percentage: number): number {
    return Math.max(0, Math.min(1, percentage / 100));
  }

  /**
   * Convert decimal (0-1) to percentage (0-100)
   */
  public static decimalToPercentage(decimal: number): number {
    return Math.max(0, Math.min(100, decimal * 100));
  }
}
