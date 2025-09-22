// ============================================================================
// CHARACTER CONTROLLER - THE WORD OF GOD FROM PLAYGROUND.TS
// ============================================================================

import { Scene, Mesh, AbstractMesh, Vector3, Sound, MeshBuilder, StandardMaterial, Color3, PhysicsCharacterController, KeyboardEventTypes, Quaternion, CharacterSupportedState, PhysicsBody } from '@babylonjs/core';
import type { IParticleSystem } from '@babylonjs/core';
import CONFIG, { ASSETS } from '../config/gameConfig';
import { AnimationController, CHARACTER_STATES } from './AnimationController';
import type { Character } from '../config/gameConfig';

// Character states are now imported from AnimationController - THE WORD OF GOD

// Input keys from THE WORD OF GOD
const INPUT_KEYS = {
  FORWARD: ['w', 'arrowup'],
  BACKWARD: ['s', 'arrowdown'],
  LEFT: ['a', 'arrowleft'],
  RIGHT: ['d', 'arrowright'],
  STRAFE_LEFT: ['q'],
  STRAFE_RIGHT: ['e'],
  JUMP: [' '],
  BOOST: ['shift'],
  DEBUG: ['f1'],
  HUD_TOGGLE: ['f2'],
  HUD_POSITION: ['f3'],
  RESET_CAMERA: ['f4']
} as const;

// Character interface is imported from gameConfig - THE WORD OF GOD

// Character state type
type CharacterState = CHARACTER_STATES;

export class CharacterController {
  private readonly scene: Scene;
  private readonly characterController: PhysicsCharacterController;
  private readonly displayCapsule: Mesh;
  private playerMesh: AbstractMesh;

  private state: CHARACTER_STATES = CHARACTER_STATES.IN_AIR;
  private wantJump = false;
  private inputDirection = new Vector3(0, 0, 0);
  private targetRotationY = 0;
  private keysDown = new Set<string>();
  private cameraController: any = null; // Will be typed properly when SmoothFollowCameraController is implemented
  private boostActive = false;
  private playerParticleSystem: IParticleSystem | null = null;
  private thrusterSound: Sound | null = null;
  public animationController: AnimationController | null = null;

  // Mobile device detection - computed once at initialization
  private readonly isMobileDevice: boolean;
  private readonly isIPadWithKeyboard: boolean;
  private readonly isIPad: boolean;
  private keyboardEventCount: number = 0;
  private keyboardDetectionTimeout: number | null = null;
  private physicsPaused: boolean = false;
  private currentCharacter: Character | null = null;

  constructor(scene: Scene) {
    this.scene = scene;

    // Enhanced device detection
    this.isMobileDevice = this.detectMobileDevice();
    this.isIPad = this.detectIPad();
    this.isIPadWithKeyboard = this.detectIPadWithKeyboard();

    // Get default character configuration from ASSETS - THE WORD OF GOD!
    const defaultCharacter = ASSETS.CHARACTERS[0];
    const defaultHeight = defaultCharacter?.height || 1.8;
    const defaultRadius = defaultCharacter?.radius || 0.6;

    // Create character physics controller with default position (will be updated when character is loaded)
    this.characterController = new PhysicsCharacterController(
      new Vector3(0, 0, 0), // Default position, will be updated
      {
        capsuleHeight: defaultHeight, // Use first character's height as default
        capsuleRadius: defaultRadius  // Use first character's radius as default
      },
      scene
    );

    // Create display capsule for debug
    this.displayCapsule = MeshBuilder.CreateCapsule(
      "CharacterDisplay",
      {
        height: defaultHeight, // Use first character's height as default
        radius: defaultRadius  // Use first character's radius as default
      },
      scene
    );
        this.displayCapsule.isVisible = false; // Hidden by default, only show with F1 key

    // Initialize player mesh (will be replaced by loaded model)
    this.playerMesh = this.displayCapsule;

    // Initialize animation controller (will be implemented later)
    this.animationController = new AnimationController(scene);

    this.initializeEventListeners();
  }

  private initializeEventListeners(): void {
    this.scene.onKeyboardObservable.add(this.handleKeyboard);
    this.scene.onBeforeRenderObservable.add(this.updateCharacter);
    this.scene.onAfterPhysicsObservable.add(this.updatePhysics);

    // Initialize mobile controls if on mobile device
    if (this.isMobileDevice) {
      // MobileInputManager.initialize(this.scene.getEngine().getRenderingCanvas()!);
    }
  }

  private detectMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      ('ontouchstart' in window) ||
      (navigator.maxTouchPoints > 0);
  }

  private detectIPad(): boolean {
    // More specific iPad detection
    return /iPad/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 0);
  }

  private detectIPadWithKeyboard(): boolean {
    if (!this.isIPad) return false;

    // Check for keyboard presence using various methods
    const hasKeyboard = this.checkForKeyboardPresence();
    const hasExternalKeyboard = this.checkForExternalKeyboard();

    return hasKeyboard || hasExternalKeyboard;
  }

  private checkForKeyboardPresence(): boolean {
    // Method 1: Check if virtual keyboard is likely present
    // This is not 100% reliable but gives us a good indication
    const viewportHeight = window.innerHeight;
    const screenHeight = window.screen.height;
    const keyboardLikelyPresent = viewportHeight < screenHeight * 0.8;

    return keyboardLikelyPresent;
  }

  private checkForExternalKeyboard(): boolean {
    // Method 2: Check for external keyboard events
    // We'll track if we receive keyboard events that suggest an external keyboard
    this.keyboardEventCount = 0;
    const keyboardThreshold = 3; // Number of events to consider keyboard present

    const checkKeyboardEvents = (event: KeyboardEvent) => {
      // Only count events that are likely from a physical keyboard
      // (not virtual keyboard events which often have different characteristics)
      if (event.key.length === 1 ||
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Shift'].includes(event.key)) {
        this.keyboardEventCount++;

        if (this.keyboardEventCount >= keyboardThreshold) {
          // Remove the listener once we've confirmed keyboard presence
          document.removeEventListener('keydown', checkKeyboardEvents);
          if (this.keyboardDetectionTimeout) {
            clearTimeout(this.keyboardDetectionTimeout);
          }
          return true;
        }
      }
      return false;
    };

    // Add listener for a short period to detect keyboard
    document.addEventListener('keydown', checkKeyboardEvents);

    // Remove listener after 5 seconds if no keyboard detected
    this.keyboardDetectionTimeout = window.setTimeout(() => {
      document.removeEventListener('keydown', checkKeyboardEvents);
    }, 5000);

    return false; // Will be updated by the event listener
  }

  private handleKeyboard = (kbInfo: any): void => {
    const key = kbInfo.event.key.toLowerCase();

    switch (kbInfo.type) {
      case KeyboardEventTypes.KEYDOWN:
        this.keysDown.add(key);
        this.handleKeyDown(key);
        break;

      case KeyboardEventTypes.KEYUP:
        this.keysDown.delete(key);
        this.handleKeyUp(key);
        break;
    }
  };

  private handleKeyDown(key: string): void {
    // Movement input
    if (INPUT_KEYS.FORWARD.includes(key as any)) {
      this.inputDirection.z = 1;

    } else if (INPUT_KEYS.BACKWARD.includes(key as any)) {
      this.inputDirection.z = -1;

    } else if (INPUT_KEYS.STRAFE_LEFT.includes(key as any)) {
      this.inputDirection.x = -1;

    } else if (INPUT_KEYS.STRAFE_RIGHT.includes(key as any)) {
      this.inputDirection.x = 1;

    } else if (INPUT_KEYS.JUMP.includes(key as any)) {
      this.wantJump = true;
    } else if (INPUT_KEYS.BOOST.includes(key as any)) {
      this.boostActive = true;
      this.updateParticleSystem();
    } else if (INPUT_KEYS.DEBUG.includes(key as any)) {
      this.toggleDebugDisplay();
    } else if (INPUT_KEYS.HUD_TOGGLE.includes(key as any)) {
      this.toggleHUD();
    } else if (INPUT_KEYS.HUD_POSITION.includes(key as any)) {
      this.cycleHUDPosition();
    } else if (INPUT_KEYS.RESET_CAMERA.includes(key as any)) {
      this.resetCameraToDefaultOffset();
    }

    // Only update mobile input for iPads with keyboards, not for regular keyboard input
    if (this.isIPadWithKeyboard) {
      this.updateMobileInput();
    }
  }

  private handleKeyUp(key: string): void {
    // Reset movement input
    if (INPUT_KEYS.FORWARD.includes(key as any) || INPUT_KEYS.BACKWARD.includes(key as any)) {
      this.inputDirection.z = 0;
    }
    if (INPUT_KEYS.LEFT.includes(key as any) || INPUT_KEYS.RIGHT.includes(key as any)) {
      this.inputDirection.x = 0;
    }
    if (INPUT_KEYS.STRAFE_LEFT.includes(key as any) || INPUT_KEYS.STRAFE_RIGHT.includes(key as any)) {
      this.inputDirection.x = 0;
    }
    if (INPUT_KEYS.JUMP.includes(key as any)) {
      this.wantJump = false;
    }
    if (INPUT_KEYS.BOOST.includes(key as any)) {
      this.boostActive = false;
      this.updateParticleSystem();
    }

    // Only update mobile input for iPads with keyboards, not for regular keyboard input
    if (this.isIPadWithKeyboard) {
      this.updateMobileInput();
    }
  }

  private updateMobileInput(): void {
    // Only update mobile input if this is a mobile device
    if (this.isMobileDevice) {
      // Get mobile input direction
      // const mobileDirection = MobileInputManager.getInputDirection();

      // For iPads with keyboards, allow both keyboard and touch input to work together
      if (this.isIPadWithKeyboard) {
        // Only allow touch input for rotation (X-axis) when not in air
        // if (this.state !== CHARACTER_STATES.IN_AIR && Math.abs(mobileDirection.x) > 0.1) {
        //   const rotationSpeed = this.currentCharacter?.rotationSpeed || 0.05;
        //   this.targetRotationY += mobileDirection.x * rotationSpeed;
        // }

        // For movement (Z-axis), use keyboard if available, otherwise use touch
        const hasKeyboardMovement = this.keysDown.has('w') || this.keysDown.has('s') ||
          this.keysDown.has('arrowup') || this.keysDown.has('arrowdown');

        // if (!hasKeyboardMovement && Math.abs(mobileDirection.z) > 0.1) {
        //   // Use touch input for forward/backward movement when no keyboard movement
        //   this.inputDirection.z = mobileDirection.z;
        // } else if (!hasKeyboardMovement) {
        //   // Reset Z movement when no input
        //   this.inputDirection.z = 0;
        // }

        // For actions (jump/boost), allow both keyboard and touch
        // const mobileWantJump = MobileInputManager.getWantJump();
        // const mobileWantBoost = MobileInputManager.getWantBoost();

        // Use keyboard input if available, otherwise use touch input
        // if (!this.keysDown.has(' ') && mobileWantJump) {
        //   this.wantJump = true;
        // } else if (!this.keysDown.has(' ') && !mobileWantJump) {
        //   this.wantJump = false;
        // }
        // if (!this.keysDown.has('shift') && mobileWantBoost) {
        //   this.boostActive = true;
        // } else if (!this.keysDown.has('shift') && !mobileWantBoost) {
        //   this.boostActive = false;
        // }
      } else {
        // Standard mobile behavior - replace keyboard input with touch input
        // this.inputDirection.copyFrom(mobileDirection);

        // Only update player rotation based on X-axis (left/right) when not in air
        // if (this.state !== CHARACTER_STATES.IN_AIR && Math.abs(mobileDirection.x) > 0.1) {
        //   const rotationSpeed = this.currentCharacter?.rotationSpeed || 0.05;
        //   this.targetRotationY += mobileDirection.x * rotationSpeed;
        // }

        // Set forward/backward movement based on Y-axis
        // if (Math.abs(mobileDirection.z) > 0.1) {
        //   this.inputDirection.z = mobileDirection.z;
        // } else {
        //   this.inputDirection.z = 0;
        // }

        // Clear X movement since we're using it for rotation
        this.inputDirection.x = 0;

        // Use mobile input for actions
        // this.wantJump = MobileInputManager.getWantJump();
        // this.boostActive = MobileInputManager.getWantBoost();
      }

      // Always update particle system to ensure proper on/off state
      this.updateParticleSystem();
    }
  }

  private toggleDebugDisplay(): void {
    this.displayCapsule.isVisible = !this.displayCapsule.isVisible;
  }

  private toggleHUD(): void {
    // This would need to be connected to HUDManager
  }

  private cycleHUDPosition(): void {
    // This would need to be connected to HUDManager
  }

  private resetCameraToDefaultOffset(): void {
    if (this.cameraController) {
      this.cameraController.resetCameraToDefaultOffset();
    }
  }

  private updateParticleSystem(): void {
    if (this.playerParticleSystem) {
      if (this.boostActive) {
        this.playerParticleSystem.start();
      } else {
        this.playerParticleSystem.stop();
      }
    }

    // Update thruster sound
    if (this.thrusterSound) {
      if (this.boostActive) {
        if (!this.thrusterSound.isPlaying) {
          this.thrusterSound.play();
        }
      } else {
        if (this.thrusterSound.isPlaying) {
          this.thrusterSound.stop();
        }
      }
    }
  }

  private updateCharacter = (): void => {
    // Update mobile input every frame
    this.updateMobileInput();

    this.updateRotation();
    this.updatePosition();
    this.updateAnimations();
  };

  private updateRotation(): void {
    // If camera is controlling rotation, don't interfere
    if (this.cameraController && this.cameraController.isRotatingCharacter) {
      // Update target rotation to match current rotation to prevent jerking
      this.targetRotationY = this.displayCapsule.rotation.y;
      return;
    }

    // Prevent rotation while in air for more realistic physics
    if (this.state === CHARACTER_STATES.IN_AIR) {
      return;
    }

    // Handle rotation based on input using active character's properties
    const rotationSpeed = this.currentCharacter?.rotationSpeed || 0.05;
    const rotationSmoothing = this.currentCharacter?.rotationSmoothing || 0.2;

    if (this.keysDown.has('a') || this.keysDown.has('arrowleft')) {
      this.targetRotationY -= rotationSpeed;
    }
    if (this.keysDown.has('d') || this.keysDown.has('arrowright')) {
      this.targetRotationY += rotationSpeed;
    }

    this.displayCapsule.rotation.y += (this.targetRotationY - this.displayCapsule.rotation.y) * rotationSmoothing;
  }

  private updatePosition(): void {
    // Update display capsule position
    this.displayCapsule.position.copyFrom(this.characterController.getPosition());

    // Update player mesh position
    this.playerMesh.position.copyFrom(this.characterController.getPosition());
    this.playerMesh.position.y += CONFIG.ANIMATION.PLAYER_Y_OFFSET;

    // Update player mesh rotation
    if (this.displayCapsule.rotationQuaternion) {
      if (!this.playerMesh.rotationQuaternion) {
        this.playerMesh.rotationQuaternion = new Quaternion();
      }
      this.playerMesh.rotationQuaternion.copyFrom(this.displayCapsule.rotationQuaternion);
    } else {
      this.playerMesh.rotationQuaternion = null;
      this.playerMesh.rotation.copyFrom(this.displayCapsule.rotation);
    }
  }

  private updateAnimations(): void {
    const isMoving = this.isAnyMovementKeyPressed();

    // Update animation controller with character state
    if (this.animationController) {
      this.animationController.updateAnimation(isMoving, this.state);
      this.animationController.updateBlend();
    }

    // Check for walk activation to trigger character rotation
    if (isMoving && this.cameraController) {
      this.cameraController.checkForWalkActivation();
    }
  }

  private isAnyMovementKeyPressed(): boolean {
    // Check keyboard input
    const keyboardMoving = INPUT_KEYS.FORWARD.some(key => this.keysDown.has(key)) ||
      INPUT_KEYS.BACKWARD.some(key => this.keysDown.has(key)) ||
      INPUT_KEYS.LEFT.some(key => this.keysDown.has(key)) ||
      INPUT_KEYS.RIGHT.some(key => this.keysDown.has(key)) ||
      INPUT_KEYS.STRAFE_LEFT.some(key => this.keysDown.has(key)) ||
      INPUT_KEYS.STRAFE_RIGHT.some(key => this.keysDown.has(key));

    // Check mobile input
    if (this.isMobileDevice) {
      // const mobileMoving = MobileInputManager.isMobileActive() &&
      //   (MobileInputManager.getInputDirection().length() > 0.1);

      // For iPads with keyboards, either input can trigger movement
      if (this.isIPadWithKeyboard) {
        return keyboardMoving; // || mobileMoving;
      } else {
        // For pure mobile, only mobile input matters
        return false; // mobileMoving;
      }
    }

    return keyboardMoving;
  }

  private updatePhysics = (): void => {
    if (!this.scene.deltaTime) return;

    const deltaTime = this.scene.deltaTime / 1000.0;
    if (deltaTime === 0) return;

    // Skip physics updates if paused
    if (this.physicsPaused) return;

    const down = Vector3.Down();
    const support = this.characterController.checkSupport(deltaTime, down);

    const characterOrientation = Quaternion.FromEulerAngles(0, this.displayCapsule.rotation.y, 0);
    const desiredVelocity = this.calculateDesiredVelocity(deltaTime, support, characterOrientation);

    this.characterController.setVelocity(desiredVelocity);
    this.characterController.integrate(deltaTime, support, CONFIG.PHYSICS.CHARACTER_GRAVITY);
  };

  private calculateDesiredVelocity(
    deltaTime: number,
    supportInfo: any, // CharacterSurfaceInfo type not available in Babylon.js 8
    characterOrientation: Quaternion
  ): Vector3 {
    const nextState = this.getNextState(supportInfo);
    if (nextState !== this.state) {
      this.state = nextState;
    }

    const upWorld = CONFIG.PHYSICS.CHARACTER_GRAVITY.normalizeToNew();
    upWorld.scaleInPlace(-1.0);

    const forwardLocalSpace = Vector3.Forward();
    const forwardWorld = forwardLocalSpace.applyRotationQuaternion(characterOrientation);
    const currentVelocity = this.characterController.getVelocity();

    switch (this.state) {
      case CHARACTER_STATES.IN_AIR:
        return this.calculateAirVelocity(deltaTime, forwardWorld, upWorld, currentVelocity, characterOrientation);

      case CHARACTER_STATES.ON_GROUND:
        return this.calculateGroundVelocity(deltaTime, forwardWorld, upWorld, currentVelocity, supportInfo, characterOrientation);

      case CHARACTER_STATES.START_JUMP:
        return this.calculateJumpVelocity(currentVelocity, upWorld);

      default:
        return Vector3.Zero();
    }
  }

  private calculateAirVelocity(
    deltaTime: number,
    forwardWorld: Vector3,
    upWorld: Vector3,
    currentVelocity: Vector3,
    characterOrientation: Quaternion
  ): Vector3 {
    // Get character-specific physics attributes
    const character = this.currentCharacter;
    if (!character) {
      console.warn("No character set for air physics calculations");
      return currentVelocity;
    }

    const characterMass = character.mass;
    let outputVelocity = currentVelocity.clone();

    // If boost is active, allow input-based velocity modification while in air
    if (this.boostActive) {
      // Character-specific air speed using active character's properties
      const baseSpeed = character.speed.inAir * character.speed.boostMultiplier;
      const massAdjustedSpeed = baseSpeed / Math.sqrt(characterMass); // Additional mass adjustment for realistic physics
      const desiredVelocity = this.inputDirection.scale(massAdjustedSpeed).applyRotationQuaternion(characterOrientation);
      outputVelocity = this.characterController.calculateMovement(
        deltaTime, forwardWorld, upWorld, currentVelocity,
        Vector3.Zero(), desiredVelocity, upWorld
      );
    } else {
      // Maintain initial jump velocity while in air - no input-based velocity modification
      // Only apply gravity and minimal air resistance to preserve realistic physics
    }

    // Character-specific air resistance based on mass
    // Heavier characters (like Zombie: 1.5) have more air resistance, lighter characters (like Tech Girl: 0.8) are more aerodynamic
    const baseAirResistance = 0.98;
    const massAdjustedAirResistance = baseAirResistance - (characterMass - 1.0) * 0.01; // Heavier = more resistance
    outputVelocity.scaleInPlace(massAdjustedAirResistance);

    // Preserve vertical velocity component from jump
    outputVelocity.addInPlace(upWorld.scale(-outputVelocity.dot(upWorld)));
    outputVelocity.addInPlace(upWorld.scale(currentVelocity.dot(upWorld)));

    // Apply gravity
    outputVelocity.addInPlace(CONFIG.PHYSICS.CHARACTER_GRAVITY.scale(deltaTime));

    return outputVelocity;
  }

  private calculateGroundVelocity(
    deltaTime: number,
    forwardWorld: Vector3,
    upWorld: Vector3,
    currentVelocity: Vector3,
    supportInfo: any, // CharacterSurfaceInfo type not available in Babylon.js 8
    characterOrientation: Quaternion
  ): Vector3 {
    // Get character-specific physics attributes
    const character = this.currentCharacter;
    if (!character) {
      console.warn("No character set for physics calculations");
      return currentVelocity;
    }

    const characterMass = character.mass;

    // Character-specific speed calculations using active character's properties
    const baseSpeed = this.boostActive ? character.speed.onGround * character.speed.boostMultiplier : character.speed.onGround;
    const massAdjustedSpeed = baseSpeed / Math.sqrt(characterMass); // Additional mass adjustment for realistic physics

    const desiredVelocity = this.inputDirection.scale(massAdjustedSpeed).applyRotationQuaternion(characterOrientation);
    const outputVelocity = this.characterController.calculateMovement(
      deltaTime, forwardWorld, supportInfo.averageSurfaceNormal, currentVelocity,
      supportInfo.averageSurfaceVelocity, desiredVelocity, upWorld
    );

    outputVelocity.subtractInPlace(supportInfo.averageSurfaceVelocity);

    // Character-specific friction based on mass
    // Heavier characters have more friction (more stable), lighter characters have less friction (more slippery)
    const baseFriction = 0.95;
    const massAdjustedFriction = baseFriction + (characterMass - 1.0) * 0.02; // Heavier = more friction
    const maxSpeed = massAdjustedSpeed * 2.0;

    // Apply character-specific friction
    outputVelocity.scaleInPlace(massAdjustedFriction);

    // Clamp velocity to prevent excessive sliding
    const currentSpeed = outputVelocity.length();
    if (currentSpeed > maxSpeed) {
      outputVelocity.normalize().scaleInPlace(maxSpeed);
    }

    // Character-specific damping when no input is detected
    // Heavier characters stop more quickly, lighter characters slide more
    if (this.inputDirection.length() < 0.1) {
      const dampingFactor = 0.9 + (characterMass - 1.0) * 0.05; // Heavier = more damping
      outputVelocity.scaleInPlace(dampingFactor);
    }

    const inv1k = 1e-3;
    if (outputVelocity.dot(upWorld) > inv1k) {
      const velLen = outputVelocity.length();
      outputVelocity.normalizeFromLength(velLen);
      const horizLen = velLen / supportInfo.averageSurfaceNormal.dot(upWorld);
      const c = supportInfo.averageSurfaceNormal.cross(outputVelocity);
      const newOutputVelocity = c.cross(upWorld);
      newOutputVelocity.scaleInPlace(horizLen);
      return newOutputVelocity;
    }

    outputVelocity.addInPlace(supportInfo.averageSurfaceVelocity);
    return outputVelocity;
  }

  private calculateJumpVelocity(currentVelocity: Vector3, upWorld: Vector3): Vector3 {
    // Get character-specific physics attributes
    const character = this.currentCharacter;
    if (!character) {
      console.warn("No character set for jump physics calculations");
      return currentVelocity;
    }

    const characterMass = character.mass;

    // Character-specific jump height using active character's properties
    const jumpHeight = this.boostActive ? 10.0 : character.jumpHeight; // Use character's jump height
    const massAdjustedJumpHeight = jumpHeight / Math.sqrt(characterMass); // Additional mass adjustment for realistic physics

    // Calculate jump velocity using physics formula: v = sqrt(2 * g * h)
    const u = Math.sqrt(2 * CONFIG.PHYSICS.CHARACTER_GRAVITY.length() * massAdjustedJumpHeight);
    const curRelVel = currentVelocity.dot(upWorld);

    return currentVelocity.add(upWorld.scale(u - curRelVel));
  }

  private getNextState(supportInfo: any): CharacterState { // CharacterSurfaceInfo type not available in Babylon.js 8
    switch (this.state) {
      case CHARACTER_STATES.IN_AIR:
        return supportInfo.supportedState === CharacterSupportedState.SUPPORTED
          ? CHARACTER_STATES.ON_GROUND
          : CHARACTER_STATES.IN_AIR;

      case CHARACTER_STATES.ON_GROUND:
        if (supportInfo.supportedState !== CharacterSupportedState.SUPPORTED) {
          return CHARACTER_STATES.IN_AIR;
        }
        return this.wantJump ? CHARACTER_STATES.START_JUMP : CHARACTER_STATES.ON_GROUND;

      case CHARACTER_STATES.START_JUMP:
        return CHARACTER_STATES.IN_AIR;

      default:
        return CHARACTER_STATES.IN_AIR;
    }
  }

  // Public methods from THE WORD OF GOD
  public setPlayerMesh(mesh: AbstractMesh): void {
    this.playerMesh = mesh;
    mesh.scaling.setAll(CONFIG.ANIMATION.PLAYER_SCALE);
  }

  public getPlayerMesh(): AbstractMesh {
    return this.playerMesh;
  }

  public getPhysicsCharacterController(): PhysicsCharacterController {
    return this.characterController;
  }

  public getCurrentCharacter(): Character | null {
    return this.currentCharacter;
  }

  public getPosition(): Vector3 {
    return this.characterController.getPosition();
  }

  public updateCharacterPhysics(character: Character, spawnPosition: Vector3): void {
    // Update character position to spawn point
    this.characterController.setPosition(spawnPosition);

    // Store current character for physics calculations
    this.currentCharacter = character;

    // Update character physics properties based on character configuration - THE WORD OF GOD!
    // Note: PhysicsCharacterController doesn't allow direct property updates after creation,
    // so we recreate it with the new character's physics properties
    // Dispose the old physics body if it exists
    if (this.characterController.getPhysicsBody()) {
      this.characterController.getPhysicsBody().dispose();
    }
    
    this.characterController = new PhysicsCharacterController(
      spawnPosition,
      {
        capsuleHeight: character.height,  // Use character's configured height
        capsuleRadius: character.radius   // Use character's configured radius
      },
      this.scene
    );

    // Update display capsule to match character configuration
    this.displayCapsule.dispose();
    this.displayCapsule = MeshBuilder.CreateCapsule(
      "CharacterDisplay",
      {
        height: character.height,  // Use character's configured height
        radius: character.radius   // Use character's configured radius
      },
      this.scene
    );
    this.displayCapsule.isVisible = CONFIG.DEBUG.CAPSULE_VISIBLE;

    console.log(`Updated character physics for ${character.name}: height=${character.height}, radius=${character.radius}, mass=${character.mass}`);
  }

  public getDisplayCapsule(): Mesh {
    return this.displayCapsule;
  }

  public setCameraController(cameraController: any): void {
    this.cameraController = cameraController;
  }

  public setPlayerParticleSystem(particleSystem: IParticleSystem | null): void {
    this.playerParticleSystem = particleSystem;
    // Start with particle system stopped if it exists
    if (particleSystem) {
      particleSystem.stop();
    }
  }

  public getPlayerParticleSystem(): IParticleSystem | null {
    return this.playerParticleSystem;
  }

  public setThrusterSound(sound: Sound): void {
    this.thrusterSound = sound;
    // Start with sound stopped
    sound.stop();
  }

  public isMoving(): boolean {
    return this.isAnyMovementKeyPressed();
  }

  public isBoosting(): boolean {
    return this.boostActive;
  }

  public getState(): CharacterState {
    return this.state;
  }

  public isOnGround(): boolean {
    return this.state === CHARACTER_STATES.ON_GROUND;
  }

  public getPhysicsBody(): PhysicsBody | null {
    // PhysicsCharacterController doesn't expose its physics body directly
    // We'll use the display capsule for collision detection instead
    return null;
  }

  public getVelocity(): Vector3 {
    return this.characterController.getVelocity();
  }

  public getPosition(): Vector3 {
    return this.characterController.getPosition();
  }

  public setPosition(position: Vector3): void {
    this.characterController.setPosition(position);
  }

  public setVelocity(velocity: Vector3): void {
    this.characterController.setVelocity(velocity);
  }

  public pausePhysics(): void {
    this.physicsPaused = true;
    // Set velocity to zero to stop movement
    this.characterController.setVelocity(new Vector3(0, 0, 0));
  }

  public resumePhysics(): void {
    this.physicsPaused = false;
  }

  public isPhysicsPaused(): boolean {
    return this.physicsPaused;
  }

  public resetToStartPosition(): void {
    // Use environment spawn point instead of character start position
    // const environment = ASSETS.ENVIRONMENTS.find(env => env.name === "Level Test");
    // const spawnPoint = environment?.spawnPoint || new Vector3(0, 0, 0);
    const spawnPoint = new Vector3(0, 0, 0); // Default spawn point
    this.characterController.setPosition(spawnPoint);
    this.characterController.setVelocity(new Vector3(0, 0, 0));
    this.inputDirection.setAll(0);
    this.wantJump = false;
    this.boostActive = false;
    this.state = CHARACTER_STATES.IN_AIR;
  }

  public dispose(): void {
    // Dispose physics body if it exists
    if (this.characterController.getPhysicsBody()) {
      this.characterController.getPhysicsBody().dispose();
    }
    
    // Dispose display capsule
    if (this.displayCapsule) {
      this.displayCapsule.dispose();
    }
    
    // Dispose animation controller
    if (this.animationController) {
      this.animationController.dispose();
    }
    
    // Dispose mobile input manager
    // MobileInputManager.dispose();
    
    console.log("CharacterController disposed");
  }
}
