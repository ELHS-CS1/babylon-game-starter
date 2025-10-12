// ============================================================================
// PROCEDURAL SOUND MANAGER - INSPIRED BY V2 AUDIO ENGINE
// ============================================================================

import type { Sound, Scene } from '@babylonjs/core';
import { logger } from '../utils/logger';
import { AudioStateManager } from './AudioStateManager';

export interface ProceduralSoundConfig {
  name: string;
  frequency: number;
  duration: number;
  volume?: number;
  loop?: boolean;
  type?: 'sine' | 'square' | 'sawtooth' | 'triangle';
}

export class ProceduralSoundManager {
  private static scene: Scene | null = null;
  private static audioContext: AudioContext | null = null;
  private static activeSounds: Map<string, Sound> = new Map();
  private static audioStateManager: AudioStateManager | null = null;

  /**
   * Initialize the procedural sound manager
   * @param scene Babylon.js scene
   */
  public static initialize(scene: Scene): void {
    this.scene = scene;
    this.audioContext = new AudioContext();
    this.audioStateManager = AudioStateManager.getInstance();
    
    console.log('ProceduralSoundManager initialized with AudioContext state:', this.audioContext.state);
    logger.info('ProceduralSoundManager initialized', 'ProceduralSoundManager');
  }

  /**
   * Generate a procedural sine wave buffer
   * @param freq Frequency in Hz
   * @param durationSeconds Duration in seconds
   * @param type Wave type
   * @returns AudioBuffer
   */
  private static createWaveBuffer(
    freq: number, 
    durationSeconds: number, 
    type: 'sine' | 'square' | 'sawtooth' | 'triangle' = 'sine'
  ): AudioBuffer | null {
    if (!this.audioContext) {
      logger.error('AudioContext not initialized', 'ProceduralSoundManager');
      return null;
    }

    const sampleRate = this.audioContext.sampleRate;
    const frameCount = sampleRate * durationSeconds;
    const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate;
      const angle = 2 * Math.PI * freq * t;
      
      switch (type) {
        case 'sine':
          data[i] = Math.sin(angle);
          break;
        case 'square':
          data[i] = Math.sin(angle) > 0 ? 1 : -1;
          break;
        case 'sawtooth':
          data[i] = 2 * (t * freq - Math.floor(t * freq + 0.5));
          break;
        case 'triangle':
          data[i] = 2 * Math.abs(2 * (t * freq - Math.floor(t * freq + 0.5))) - 1;
          break;
      }
    }

    return buffer;
  }

  /**
   * Generate a white noise buffer using proper audio engine v2 techniques
   * @param durationSeconds Duration in seconds
   * @param volume Volume level (0.0 to 1.0)
   * @returns AudioBuffer
   */
  private static createWhiteNoiseBuffer(
    durationSeconds: number,
    volume: number = 0.3
  ): AudioBuffer | null {
    if (!this.audioContext) {
      logger.error('AudioContext not initialized', 'ProceduralSoundManager');
      return null;
    }

    const sampleRate = this.audioContext.sampleRate;
    const frameCount = sampleRate * durationSeconds;
    const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);

    // Generate white noise using proper random distribution
    // White noise has equal energy at all frequencies
    for (let i = 0; i < frameCount; i++) {
      // Generate random values between -1 and 1
      // Using Box-Muller transform for better distribution
      const u1 = Math.random();
      const u2 = Math.random();
      const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      
      // Clamp to prevent clipping and apply volume
      data[i] = Math.max(-1, Math.min(1, z0 * volume));
    }

    return buffer;
  }

  /**
   * Generate a smoothed brown noise buffer using proper audio engine v2 techniques
   * Brown noise has more energy in lower frequencies, creating a smoother sound
   * @param durationSeconds Duration in seconds
   * @param volume Volume level (0.0 to 1.0)
   * @returns AudioBuffer
   */
  private static createBrownNoiseBuffer(
    durationSeconds: number,
    volume: number = 0.3
  ): AudioBuffer | null {
    if (!this.audioContext) {
      logger.error('AudioContext not initialized', 'ProceduralSoundManager');
      return null;
    }

    const sampleRate = this.audioContext.sampleRate;
    const frameCount = sampleRate * durationSeconds;
    const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);

    // Generate brown noise using random walk (integrated white noise)
    // Brown noise has energy proportional to 1/f^2
    let lastValue = 0;
    const smoothingFactor = 0.02; // Controls the smoothness (lower = smoother)
    
    for (let i = 0; i < frameCount; i++) {
      // Generate random step
      const randomStep = (Math.random() - 0.5) * 2; // -1 to 1
      
      // Apply random walk with smoothing
      lastValue += randomStep * smoothingFactor;
      
      // Apply exponential decay to prevent drift
      lastValue *= 0.995;
      
      // Clamp to prevent clipping and apply volume
      data[i] = Math.max(-1, Math.min(1, lastValue * volume));
    }

    return buffer;
  }

  /**
   * Create a procedural sound
   * @param config Sound configuration
   * @returns Created sound or null
   */
  public static async createProceduralSound(config: ProceduralSoundConfig): Promise<Sound | null> {
    console.log('createProceduralSound called with config:', config);
    
    if (!this.scene || !this.audioContext) {
      console.error('ProceduralSoundManager not initialized - scene:', !!this.scene, 'audioContext:', !!this.audioContext);
      logger.error('ProceduralSoundManager not initialized', 'ProceduralSoundManager');
      return null;
    }

    try {
      console.log('Generating wave buffer...');
      // Generate the wave buffer
      const buffer = this.createWaveBuffer(
        config.frequency, 
        config.duration, 
        config.type || 'sine'
      );

      if (!buffer) {
        console.error('Failed to create wave buffer');
        logger.error('Failed to create wave buffer', 'ProceduralSoundManager');
        return null;
      }

      console.log('Wave buffer created successfully, length:', buffer.length, 'duration:', buffer.duration);

      // Create direct Web Audio API sound (bypass Babylon.js Sound for now)
      const bufferSource = this.audioContext.createBufferSource();
      bufferSource.buffer = buffer;
      bufferSource.loop = config.loop || false;
      
      // Create gain node for volume control
      const gainNode = this.audioContext.createGain();
      const baseVolume = config.volume || 0.5;
      const effectiveVolume = this.audioStateManager ? 
        baseVolume * this.audioStateManager.getEffectiveSFXVolume() : 
        baseVolume;
      gainNode.gain.value = effectiveVolume;
      
      console.log('Volume calculation:', {
        baseVolume,
        effectiveVolume,
        audioState: this.audioStateManager?.getAudioState()
      });
      
      // Connect: bufferSource -> gainNode -> destination
      bufferSource.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      console.log('Audio graph connected for:', config.name);
      
      // Create a simple wrapper object that mimics Babylon.js Sound interface
      const sound = {
        name: config.name,
        play: () => {
          console.log('Starting buffer source for:', config.name);
          bufferSource.start();
        },
        stop: () => {
          console.log('Stopping buffer source for:', config.name);
          bufferSource.stop();
        },
        dispose: () => {
          console.log('Disposing buffer source for:', config.name);
          bufferSource.disconnect();
          gainNode.disconnect();
        }
      } as any;

      this.activeSounds.set(config.name, sound);
      console.log('Sound created and stored:', config.name);
      logger.info(`Created procedural sound: ${config.name} (${config.frequency}Hz, ${config.type})`, 'ProceduralSoundManager');
      
      return sound;
    } catch (error) {
      console.error('Error creating procedural sound:', error);
      logger.error(`Failed to create procedural sound: ${error}`, 'ProceduralSoundManager');
      return null;
    }
  }

  /**
   * Play a procedural sound by name
   * @param name Sound name
   */
  public static playProceduralSound(name: string): void {
    const sound = this.activeSounds.get(name);
    if (sound) {
      sound.play();
      logger.info(`Playing procedural sound: ${name}`, 'ProceduralSoundManager');
    } else {
      logger.warn(`Procedural sound not found: ${name}`, 'ProceduralSoundManager');
    }
  }

  /**
   * Stop a procedural sound by name
   * @param name Sound name
   */
  public static stopProceduralSound(name: string): void {
    const sound = this.activeSounds.get(name);
    if (sound) {
      sound.stop();
      logger.info(`Stopped procedural sound: ${name}`, 'ProceduralSoundManager');
    } else {
      logger.warn(`Procedural sound not found: ${name}`, 'ProceduralSoundManager');
    }
  }

  /**
   * Create and play a test tone (440Hz A note)
   */
  public static async playTestTone(): Promise<void> {
    console.log('ProceduralSoundManager.playTestTone called');
    
    if (!this.scene) {
      console.error('ProceduralSoundManager not initialized - no scene');
      return;
    }
    
    if (!this.audioContext) {
      console.error('ProceduralSoundManager not initialized - no audio context');
      return;
    }

    // Ensure AudioContext is running (might be suspended)
    if (this.audioContext.state === 'suspended') {
      console.log('AudioContext is suspended, attempting to resume...');
      try {
        await this.audioContext.resume();
        console.log('AudioContext resumed successfully, state:', this.audioContext.state);
      } catch (error) {
        console.error('Failed to resume AudioContext:', error);
        return;
      }
    }

    const testConfig: ProceduralSoundConfig = {
      name: 'TestTone',
      frequency: 440, // A4 note
      duration: 2,
      volume: 0.3,
      type: 'sine'
    };

    console.log('Creating procedural sound with config:', testConfig);
    const sound = await this.createProceduralSound(testConfig);
    
    if (sound) {
      console.log('Sound created successfully, attempting to play...');
      sound.play();
      logger.info('Playing test tone (440Hz A note)', 'ProceduralSoundManager');
    } else {
      console.error('Failed to create procedural sound');
    }
  }

  /**
   * Create a chord progression
   */
  public static async playChordProgression(): Promise<void> {
    const chordFrequencies = [261.63, 329.63, 392.00]; // C major chord (C4, E4, G4)
    
    for (let i = 0; i < chordFrequencies.length; i++) {
      const config: ProceduralSoundConfig = {
        name: `ChordNote${i}`,
        frequency: chordFrequencies[i],
        duration: 3,
        volume: 0.2,
        type: 'sine'
      };

      const sound = await this.createProceduralSound(config);
      if (sound) {
        // Stagger the notes slightly for a chord effect
        setTimeout(() => {
          sound.play();
        }, i * 100);
      }
    }
  }

  /**
   * Create and play white noise using proper audio engine v2 techniques
   */
  public static async playWhiteNoise(): Promise<void> {
    console.log('ProceduralSoundManager.playWhiteNoise called');
    
    if (!this.scene) {
      console.error('ProceduralSoundManager not initialized - no scene');
      return;
    }
    
    if (!this.audioContext) {
      console.error('ProceduralSoundManager not initialized - no audio context');
      return;
    }

    // Ensure AudioContext is running (might be suspended)
    if (this.audioContext.state === 'suspended') {
      console.log('AudioContext is suspended, attempting to resume...');
      try {
        await this.audioContext.resume();
        console.log('AudioContext resumed successfully, state:', this.audioContext.state);
      } catch (error) {
        console.error('Failed to resume AudioContext:', error);
        return;
      }
    }

    try {
      console.log('Generating white noise buffer...');
      // Generate the white noise buffer
      const buffer = this.createWhiteNoiseBuffer(3, 0.2); // 3 seconds, 20% volume

      if (!buffer) {
        console.error('Failed to create white noise buffer');
        logger.error('Failed to create white noise buffer', 'ProceduralSoundManager');
        return;
      }

      console.log('White noise buffer created successfully, length:', buffer.length, 'duration:', buffer.duration);

      // Create direct Web Audio API sound (bypass Babylon.js Sound for now)
      const bufferSource = this.audioContext.createBufferSource();
      bufferSource.buffer = buffer;
      bufferSource.loop = false; // Don't loop white noise
      
      // Create gain node for volume control
      const gainNode = this.audioContext.createGain();
      const baseVolume = 0.2; // 20% volume for white noise
      const effectiveVolume = this.audioStateManager ? 
        baseVolume * this.audioStateManager.getEffectiveSFXVolume() : 
        baseVolume;
      gainNode.gain.value = effectiveVolume;
      
      console.log('White noise volume calculation:', {
        baseVolume,
        effectiveVolume,
        audioState: this.audioStateManager?.getAudioState()
      });
      
      // Connect: bufferSource -> gainNode -> destination
      bufferSource.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      console.log('White noise audio graph connected');
      
      // Create a simple wrapper object that mimics Babylon.js Sound interface
      const sound = {
        name: 'WhiteNoise',
        play: () => {
          console.log('Starting white noise buffer source');
          bufferSource.start();
        },
        stop: () => {
          console.log('Stopping white noise buffer source');
          bufferSource.stop();
        },
        dispose: () => {
          console.log('Disposing white noise buffer source');
          bufferSource.disconnect();
          gainNode.disconnect();
        }
      } as any;

      this.activeSounds.set('WhiteNoise', sound);
      console.log('White noise sound created and stored');
      logger.info('Created white noise sound (3s, 20% volume)', 'ProceduralSoundManager');
      
      // Play the white noise
      sound.play();
      logger.info('Playing white noise test', 'ProceduralSoundManager');
      
    } catch (error) {
      console.error('Error creating white noise:', error);
      logger.error(`Failed to create white noise: ${error}`, 'ProceduralSoundManager');
    }
  }

  /**
   * Create and play a collect effect sound using dual oscillators
   * Triangle wave for bright melodic tone, sine wave for harmonic overtone
   * Quick attack and smooth decay envelope for satisfying "ping" sound
   */
  public static async playCollectSound(): Promise<void> {
    console.log('ProceduralSoundManager.playCollectSound called');
    
    if (!this.scene) {
      console.error('ProceduralSoundManager not initialized - no scene');
      return;
    }
    
    if (!this.audioContext) {
      console.error('ProceduralSoundManager not initialized - no audio context');
      return;
    }

    // Ensure AudioContext is running (might be suspended)
    if (this.audioContext.state === 'suspended') {
      console.log('AudioContext is suspended, attempting to resume...');
      try {
        await this.audioContext.resume();
        console.log('AudioContext resumed successfully, state:', this.audioContext.state);
      } catch (error) {
        console.error('Failed to resume AudioContext:', error);
        return;
      }
    }

    try {
      console.log('Creating collect effect sound with dual oscillators...');
      
      // Create triangle oscillator for bright melodic tone
      const triangleOsc = this.audioContext.createOscillator();
      triangleOsc.type = 'triangle';
      triangleOsc.frequency.setValueAtTime(400, this.audioContext.currentTime); // Reduced from 800Hz to 400Hz
      
      // Create sine oscillator for harmonic overtone
      const sineOsc = this.audioContext.createOscillator();
      sineOsc.type = 'sine';
      sineOsc.frequency.setValueAtTime(600, this.audioContext.currentTime); // Reduced from 1200Hz to 600Hz
      
      // Create gain node for envelope control
      const gainNode = this.audioContext.createGain();
      const baseVolume = 0.4; // 40% volume for collect sound
      const effectiveVolume = this.audioStateManager ? 
        baseVolume * this.audioStateManager.getEffectiveSFXVolume() : 
        baseVolume;
      
      // Quick attack and smooth decay envelope
      const now = this.audioContext.currentTime;
      gainNode.gain.setValueAtTime(0, now); // Start at 0
      gainNode.gain.linearRampToValueAtTime(effectiveVolume, now + 0.01); // Quick attack (10ms)
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3); // Smooth decay (300ms)
      
      console.log('Collect sound volume calculation:', {
        baseVolume,
        effectiveVolume,
        audioState: this.audioStateManager?.getAudioState()
      });
      
      // Connect oscillators to gain node
      triangleOsc.connect(gainNode);
      sineOsc.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      console.log('Collect sound audio graph connected');
      
      // Start both oscillators
      triangleOsc.start(now);
      sineOsc.start(now);
      
      // Stop oscillators after envelope completes
      triangleOsc.stop(now + 0.3);
      sineOsc.stop(now + 0.3);
      
      // Clean up after sound completes
      setTimeout(() => {
        triangleOsc.disconnect();
        sineOsc.disconnect();
        gainNode.disconnect();
      }, 350); // Slightly longer than sound duration
      
      console.log('Collect effect sound played successfully');
      logger.info('Playing collect effect sound (dual oscillators, 300ms)', 'ProceduralSoundManager');
      
    } catch (error) {
      console.error('Error creating collect sound:', error);
      logger.error(`Failed to create collect sound: ${error}`, 'ProceduralSoundManager');
    }
  }

  /**
   * Create and play smoothed brown noise using proper audio engine v2 techniques
   */
  public static async playBrownNoise(): Promise<void> {
    console.log('ProceduralSoundManager.playBrownNoise called');
    
    if (!this.scene) {
      console.error('ProceduralSoundManager not initialized - no scene');
      return;
    }
    
    if (!this.audioContext) {
      console.error('ProceduralSoundManager not initialized - no audio context');
      return;
    }

    // Ensure AudioContext is running (might be suspended)
    if (this.audioContext.state === 'suspended') {
      console.log('AudioContext is suspended, attempting to resume...');
      try {
        await this.audioContext.resume();
        console.log('AudioContext resumed successfully, state:', this.audioContext.state);
      } catch (error) {
        console.error('Failed to resume AudioContext:', error);
        return;
      }
    }

    try {
      console.log('Generating brown noise buffer...');
      // Generate the brown noise buffer
      const buffer = this.createBrownNoiseBuffer(3, 0.25); // 3 seconds, 25% volume (slightly louder than white noise)

      if (!buffer) {
        console.error('Failed to create brown noise buffer');
        logger.error('Failed to create brown noise buffer', 'ProceduralSoundManager');
        return;
      }

      console.log('Brown noise buffer created successfully, length:', buffer.length, 'duration:', buffer.duration);

      // Create direct Web Audio API sound (bypass Babylon.js Sound for now)
      const bufferSource = this.audioContext.createBufferSource();
      bufferSource.buffer = buffer;
      bufferSource.loop = false; // Don't loop brown noise
      
      // Create gain node for volume control
      const gainNode = this.audioContext.createGain();
      const baseVolume = 0.25; // 25% volume for brown noise (slightly louder)
      const effectiveVolume = this.audioStateManager ? 
        baseVolume * this.audioStateManager.getEffectiveSFXVolume() : 
        baseVolume;
      gainNode.gain.value = effectiveVolume;
      
      console.log('Brown noise volume calculation:', {
        baseVolume,
        effectiveVolume,
        audioState: this.audioStateManager?.getAudioState()
      });
      
      // Connect: bufferSource -> gainNode -> destination
      bufferSource.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      console.log('Brown noise audio graph connected');
      
      // Create a simple wrapper object that mimics Babylon.js Sound interface
      const sound = {
        name: 'BrownNoise',
        play: () => {
          console.log('Starting brown noise buffer source');
          bufferSource.start();
        },
        stop: () => {
          console.log('Stopping brown noise buffer source');
          bufferSource.stop();
        },
        dispose: () => {
          console.log('Disposing brown noise buffer source');
          bufferSource.disconnect();
          gainNode.disconnect();
        }
      } as any;

      this.activeSounds.set('BrownNoise', sound);
      console.log('Brown noise sound created and stored');
      logger.info('Created brown noise sound (3s, 25% volume)', 'ProceduralSoundManager');
      
      // Play the brown noise
      sound.play();
      logger.info('Playing brown noise test', 'ProceduralSoundManager');
      
    } catch (error) {
      console.error('Error creating brown noise:', error);
      logger.error(`Failed to create brown noise: ${error}`, 'ProceduralSoundManager');
    }
  }

  /**
   * Clean up all procedural sounds
   */
  public static dispose(): void {
    this.activeSounds.forEach((sound) => {
      sound.dispose();
    });
    this.activeSounds.clear();
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    logger.info('ProceduralSoundManager disposed', 'ProceduralSoundManager');
  }
}
