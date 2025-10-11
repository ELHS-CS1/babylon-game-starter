// ============================================================================
// ANIMATION CONTROLLER - THE WORD OF GOD FROM PLAYGROUND.TS
// ============================================================================

import type { Scene } from '@babylonjs/core';
import { type Character } from '../config/gameConfig';
import { logger } from '../utils/logger';

// Character state enum - IDENTICAL TO PLAYGROUND.TS
// export enum CHARACTER_STATES { // Unused for now
//   ON_GROUND = 'ON_GROUND',
//   IN_AIR = 'IN_AIR',
//   JUMPING = 'JUMPING',
//   FALLING = 'FALLING',
//   START_JUMP = 'START_JUMP'
// }

// Character interface is now imported from gameConfig - THE WORD OF GOD

export class AnimationController {
  private scene: Scene;
  private currentCharacter: Character | null = null;
  private currentAnimation: string | null = null;
  private previousAnimation: string | null = null;
  private blendStartTime: number = 0;
  private blendDuration: number = 400; // Default blend duration in milliseconds
  private isBlending: boolean = false;
  // private weightedAnimation: AnimationGroup | null = null; // Unused for now

  // Jump delay tracking
  private jumpDelayStartTime: number = 0;
  private isJumpDelayed: boolean = false;
  private lastCharacterState: string | null = null;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  /**
   * Sets the current character and its animation blend settings
   */
  public setCharacter(character: Character): void {
    this.currentCharacter = character;
    this.blendDuration = character.animationBlend ?? 400;

    // Reset animation state when character changes
    this.currentAnimation = null;
    this.previousAnimation = null;
    this.isBlending = false;
    // this.weightedAnimation = null; // Commented out - property removed

    // Reset jump delay state
    this.isJumpDelayed = false;
    this.jumpDelayStartTime = 0;
    this.lastCharacterState = null;

    // Don't stop all animations here - let the character loading process handle it
    // The new character's animations will be set up properly in loadCharacter
  }

  /**
   * Updates the animation state based on character movement and state
   */
  public updateAnimation(isMoving: boolean, characterState?: string): void {
    if (!this.currentCharacter) return;

    // Handle jump delay logic
    this.handleJumpDelay(characterState);

    let targetAnimationName: string;

    // Determine animation based on character state first, then movement
    if (characterState === 'IN_AIR' && !this.isJumpDelayed) {
      targetAnimationName = this.currentCharacter.animations.jump;
    } else if (isMoving) {
      targetAnimationName = this.currentCharacter.animations.walk;
    } else {
      targetAnimationName = this.currentCharacter.animations.idle;
    }

    // If animation is already playing and no change needed, do nothing
    if (this.currentAnimation === targetAnimationName && !this.isBlending) {
      return;
    }

    // If no animation is currently playing, start the target animation
    if (this.currentAnimation === null) {
      this.startAnimation(targetAnimationName);
      return;
    }

    // If we're already blending, let the blend complete
    if (this.isBlending) {
      return;
    }

    // If the character has animationBlend set to 0, skip weighted blending
    if (this.currentCharacter.animationBlend === 0) {
      this.switchAnimationDirectly(targetAnimationName);
      return;
    }

    // Start weighted blending between current and target animation
    this.startWeightedBlend(targetAnimationName);
  }

  /**
   * Starts a new animation directly (no blending)
   */
  private startAnimation(animationName: string): void {
    // First try to find the animation by exact name
    let animation = this.scene.getAnimationGroupByName(animationName);

    // If not found, try to find it by partial name match
    animation ??= this.scene.animationGroups.find(anim =>
      anim.name.toLowerCase().includes(animationName.toLowerCase()) ||
      animationName.toLowerCase().includes(anim.name.toLowerCase())
    ) ?? null;

    // If still not found, try common fallbacks
    if (animation === null) {
      if (animationName.toLowerCase().includes('idle')) {
        animation = this.scene.animationGroups.find(anim =>
          anim.name.toLowerCase().includes('idle') ||
          anim.name.toLowerCase().includes('stand')
        ) ?? null;
      } else if (animationName.toLowerCase().includes('walk')) {
        animation = this.scene.animationGroups.find(anim =>
          anim.name.toLowerCase().includes('walk') ||
          anim.name.toLowerCase().includes('run') ||
          anim.name.toLowerCase().includes('move')
        ) ?? null;
      } else if (animationName.toLowerCase().includes('jump')) {
        animation = this.scene.animationGroups.find(anim =>
          anim.name.toLowerCase().includes('jump') ||
          anim.name.toLowerCase().includes('leap') ||
          anim.name.toLowerCase().includes('hop')
        ) ?? null;
      }
    }

    if (animation === null) {
      // Animation not found - handled silently
      return;
    }

    // Stop all other animation groups in the scene
    this.scene.animationGroups.forEach(anim => {
      if (anim !== animation) {
        anim.stop();
      }
    });

    // Start the new animation
    animation.start(true);
    this.currentAnimation = animation.name; // Use the actual animation name
    this.previousAnimation = null;
    this.isBlending = false;
    // this.weightedAnimation = null; // Commented out - property removed
  }

  /**
   * Switches animation directly without blending
   */
  private switchAnimationDirectly(targetAnimation: string): void {
    const currentAnim = this.scene.getAnimationGroupByName(this.currentAnimation ?? '');
    let targetAnim = this.scene.getAnimationGroupByName(targetAnimation);

    // If target animation not found, try partial match
    targetAnim ??= this.scene.animationGroups.find(anim =>
      anim.name.toLowerCase().includes(targetAnimation.toLowerCase()) ||
      targetAnimation.toLowerCase().includes(anim.name.toLowerCase())
    ) ?? null;

    // If still not found, try common fallbacks
    if (targetAnim === null) {
      if (targetAnimation.toLowerCase().includes('idle')) {
        targetAnim ??= this.scene.animationGroups.find(anim =>
          anim.name.toLowerCase().includes('idle') ||
          anim.name.toLowerCase().includes('stand')
        ) ?? null;
      } else if (targetAnimation.toLowerCase().includes('walk')) {
        targetAnim ??= this.scene.animationGroups.find(anim =>
          anim.name.toLowerCase().includes('walk') ||
          anim.name.toLowerCase().includes('run') ||
          anim.name.toLowerCase().includes('move')
        ) ?? null;
      }
    }

    if (!currentAnim || !targetAnim) {
      logger.warn(`Animation not found: current=${this.currentAnimation}, target=${targetAnimation}`, { context: 'AnimationController', tag: 'animation' });
      return;
    }

    // Stop current animation
    currentAnim.stop();

    // Start target animation
    targetAnim.start(true);

    this.previousAnimation = this.currentAnimation;
    this.currentAnimation = targetAnim.name; // Use the actual animation name
    this.isBlending = false;
    // this.weightedAnimation = null; // Commented out - property removed
  }

  /**
   * Starts weighted blending between two animations
   */
  private startWeightedBlend(targetAnimation: string): void {
    const currentAnim = this.scene.getAnimationGroupByName(this.currentAnimation ?? '');
    let targetAnim = this.scene.getAnimationGroupByName(targetAnimation);

    // If target animation not found, try partial match
    targetAnim ??= this.scene.animationGroups.find(anim =>
      anim.name.toLowerCase().includes(targetAnimation.toLowerCase()) ||
      targetAnimation.toLowerCase().includes(anim.name.toLowerCase())
    ) ?? null;

    // If still not found, try common fallbacks
    if (targetAnim === null) {
      if (targetAnimation.toLowerCase().includes('idle')) {
        targetAnim ??= this.scene.animationGroups.find(anim =>
          anim.name.toLowerCase().includes('idle') ||
          anim.name.toLowerCase().includes('stand')
        ) ?? null;
      } else if (targetAnimation.toLowerCase().includes('walk')) {
        targetAnim ??= this.scene.animationGroups.find(anim =>
          anim.name.toLowerCase().includes('walk') ||
          anim.name.toLowerCase().includes('run') ||
          anim.name.toLowerCase().includes('move')
        ) ?? null;
      } else if (targetAnimation.toLowerCase().includes('jump')) {
        targetAnim ??= this.scene.animationGroups.find(anim =>
          anim.name.toLowerCase().includes('jump') ||
          anim.name.toLowerCase().includes('leap') ||
          anim.name.toLowerCase().includes('hop')
        ) ?? null;
      }
    }

    if (!currentAnim || !targetAnim) {
      logger.warn(`Animation not found: current=${this.currentAnimation}, target=${targetAnimation}`, { context: 'AnimationController', tag: 'animation' });
      return;
    }

    // For now, use a simpler approach: start both animations with different weights
    // and gradually adjust them over time
    currentAnim.start(true);
    targetAnim.start(true);

    // Set initial weights
    currentAnim.weight = 1.0;
    targetAnim.weight = 0.0;

    // Set up blend state
    this.previousAnimation = this.currentAnimation;
    this.currentAnimation = targetAnim.name; // Use the actual animation name
    this.blendStartTime = Date.now();
    this.isBlending = true;
  }

  /**
   * Updates the weighted animation blend weights
   */
  public updateBlend(): void {
    if (!this.isBlending) return;

    const elapsedTime = Date.now() - this.blendStartTime;
    const blendProgress = Math.min(elapsedTime / this.blendDuration, 1.0);

    // Calculate weights using smooth easing
    const previousWeight = 1.0 - this.easeInOutCubic(blendProgress);
    const currentWeight = this.easeInOutCubic(blendProgress);

    // Update animation weights
    if (this.previousAnimation !== null && this.currentAnimation !== null) {
      const previousAnim = this.scene.getAnimationGroupByName(this.previousAnimation);
      const currentAnim = this.scene.getAnimationGroupByName(this.currentAnimation);

      if (previousAnim && currentAnim) {
        // Update weights directly on the animation groups
        previousAnim.weight = previousWeight;
        currentAnim.weight = currentWeight;
      }
    }

    // Check if blend is complete
    if (blendProgress >= 1.0) {
      this.completeBlend();
    }
  }

  /**
   * Completes the animation blend
   */
  private completeBlend(): void {
    if (this.currentAnimation === null) return;

    // Stop the previous animation
    if (this.previousAnimation !== null) {
      const previousAnim = this.scene.getAnimationGroupByName(this.previousAnimation);
      if (previousAnim) {
        previousAnim.stop();
      }
    }

    // Ensure the target animation is running with full weight
    const targetAnim = this.scene.getAnimationGroupByName(this.currentAnimation);
    if (targetAnim) {
      targetAnim.weight = 1.0;
    }

    // Reset blend state
    this.isBlending = false;
    // this.weightedAnimation = null; // Commented out - property removed
    this.previousAnimation = null;
  }

  /**
   * Smooth easing function for animation blending
   */
  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /**
   * Stops all animations
   */
  public stopAllAnimations(): void {
    this.scene.animationGroups.forEach(anim => {
      anim.stop();
    });

    this.currentAnimation = null;
    this.previousAnimation = null;
    this.isBlending = false;
    // this.weightedAnimation = null; // Commented out - property removed
  }

  /**
   * Handles jump delay logic to avoid awkward jump transitions
   */
  private handleJumpDelay(characterState?: string): void {
    if (this.currentCharacter === null || characterState === null || characterState === undefined) return;

    const jumpDelay = this.currentCharacter.jumpDelay ?? 100; // Default to 100ms

    // Check if we just entered IN_AIR state
    if (characterState === 'IN_AIR' && this.lastCharacterState !== null && this.lastCharacterState !== 'IN_AIR') {
      // Start jump delay
      this.isJumpDelayed = true;
      this.jumpDelayStartTime = Date.now();
    }
    // Check if we left IN_AIR state
    else if (characterState !== 'IN_AIR' && this.lastCharacterState === 'IN_AIR') {
      // Reset jump delay when leaving air state
      this.isJumpDelayed = false;
      this.jumpDelayStartTime = 0;
    }
    // Check if jump delay has expired
    else if (this.isJumpDelayed && characterState === 'IN_AIR') {
      const elapsedTime = Date.now() - this.jumpDelayStartTime;
      if (elapsedTime >= jumpDelay) {
        this.isJumpDelayed = false;
      }
    }

    // Update last character state
    this.lastCharacterState = characterState;
  }

  /**
   * Gets the current animation state
   */
  public getCurrentAnimation(): string | null {
    return this.currentAnimation;
  }

  /**
   * Checks if currently blending animations
   */
  public isCurrentlyBlending(): boolean {
    return this.isBlending;
  }

  /**
   * Disposes the animation controller
   */
  public dispose(): void {
    // Stop all animations
    this.scene.animationGroups.forEach(anim => {
      anim.stop();
    });
    
    // Clear references
    this.currentAnimation = null;
    this.previousAnimation = null;
    this.isBlending = false;
    // this.weightedAnimation = null; // Commented out - property removed
    
    logger.info("AnimationController disposed", { context: 'AnimationController', tag: 'disposal' });
  }
}
