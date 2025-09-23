// ============================================================================
// THE LORD'S WORD - COMPLETE GAME CONFIGURATION
// ============================================================================

import { Vector3 } from '@babylonjs/core';
import type { CharacterController } from '../game/CharacterController';

// Configuration Type Definitions
interface CharacterSpeed {
    readonly IN_AIR: number;
    readonly ON_GROUND: number;
    readonly BOOST_MULTIPLIER: number;
}

interface CharacterConfig {
    readonly HEIGHT: number;
    readonly RADIUS: number;
    readonly SPEED: CharacterSpeed;
    readonly JUMP_HEIGHT: number;
    readonly ROTATION_SPEED: number;
    readonly ROTATION_SMOOTHING: number;
}

interface CameraConfig {
    readonly START_POSITION: Vector3;
    readonly OFFSET: Vector3;
    readonly DRAG_SENSITIVITY: number;
    readonly ZOOM_MIN: number;
    readonly ZOOM_MAX: number;
    readonly FOLLOW_SMOOTHING: number;
}

interface PhysicsConfig {
    readonly GRAVITY: Vector3;
    readonly CHARACTER_GRAVITY: Vector3;
}

interface AnimationConfig {
    readonly PLAYER_SCALE: number;
    readonly PLAYER_Y_OFFSET: number;
}

interface DebugConfig {
    readonly CAPSULE_VISIBLE: boolean;
}

type SkyType = "BOX" | "SPHERE";

interface SkyConfig {
    readonly TEXTURE_URL: string;
    readonly ROTATION_Y: number;
    readonly BLUR: number;
    readonly TYPE: SkyType;
}

interface ParticleSnippet {
    readonly name: string;
    readonly description: string;
    readonly snippetId: string;
    readonly category: "fire" | "magic" | "nature" | "tech" | "cosmic";
}

interface SoundEffect {
    readonly name: string;
    readonly url: string;
    readonly volume: number;
    readonly loop: boolean;
}

interface EffectsConfig {
    readonly PARTICLE_SNIPPETS: readonly ParticleSnippet[];
    readonly DEFAULT_PARTICLE: string;
    readonly AUTO_SPAWN: boolean;
    readonly SOUND_EFFECTS: readonly SoundEffect[];
}

interface ItemInstance {
    readonly position: Vector3;
    readonly scale: number;
    readonly rotation: Vector3;
    readonly mass: number;
}

interface ItemConfig {
    readonly name: string;
    readonly url: string;
    readonly collectible: boolean;
    readonly creditValue: number;
    readonly minImpulseForCollection: number;
    readonly instances: readonly ItemInstance[];
    readonly inventory?: boolean;
    readonly thumbnail?: string;
    readonly itemEffectKind?: ItemEffectKind;
}

interface ItemsConfig {
    readonly ITEMS: readonly ItemConfig[];
    readonly COLLECTION_RADIUS: number;
    readonly COLLECTION_SOUND: string;
    readonly SHOW_COLLECTION_EFFECTS: boolean;
}

type HUDPosition = "top" | "bottom" | "left" | "right";

interface HUDConfig {
    readonly POSITION: HUDPosition;
    readonly FONT_FAMILY: string;
    readonly PRIMARY_COLOR: string;
    readonly SECONDARY_COLOR: string;
    readonly HIGHLIGHT_COLOR: string;
    readonly BACKGROUND_COLOR: string;
    readonly BACKGROUND_OPACITY: number;
    readonly PADDING: number;
    readonly BORDER_RADIUS: number;
    readonly SHOW_COORDINATES: boolean;
    readonly SHOW_TIME: boolean;
    readonly SHOW_FPS: boolean;
    readonly SHOW_STATE: boolean;
    readonly SHOW_BOOST_STATUS: boolean;
    readonly SHOW_CREDITS: boolean;
    readonly UPDATE_INTERVAL: number;
    readonly MOBILE: {
        readonly SHOW_COORDINATES: boolean;
        readonly SHOW_TIME: boolean;
        readonly SHOW_FPS: boolean;
        readonly SHOW_STATE: boolean;
        readonly SHOW_BOOST_STATUS: boolean;
        readonly SHOW_CREDITS: boolean;
    };
}

type UIElementType = "toggle" | "dropdown";
type VisibilityType = "all" | "mobile" | "iPadWithKeyboard";

interface SettingsSection {
    readonly title: string;
    readonly uiElement: UIElementType;
    readonly visibility: VisibilityType;
    readonly defaultValue?: boolean | string;
    readonly options?: readonly string[]; // For dropdown elements
    readonly onChange?: (_value: boolean | string) => void | Promise<void>;
}

interface SettingsConfig {
    readonly HEADING_TEXT: string;
    readonly PANEL_WIDTH_RATIO: number;
    readonly FULL_SCREEN_THRESHOLD: number;
    readonly Z_INDEX: number;
    readonly BUTTON_Z_INDEX: number;
    readonly SECTIONS: readonly SettingsSection[];
}

interface AudioConfig {
    readonly MASTER_VOLUME: number;
    readonly SFX_VOLUME: number;
    readonly MUSIC_VOLUME: number;
}

interface GameConfig {
    readonly CHARACTER: CharacterConfig;
    readonly CAMERA: CameraConfig;
    readonly PHYSICS: PhysicsConfig;
    readonly ANIMATION: AnimationConfig;
    readonly DEBUG: DebugConfig;
    readonly EFFECTS: EffectsConfig;
    readonly HUD: HUDConfig;
    readonly AUDIO: AudioConfig;
    readonly SETTINGS: SettingsConfig;
    readonly INVENTORY: InventoryConfig;
}

// Inventory System Type Definitions
type ItemEffectKind = "superJump" | "invisibility";

type ItemEffect = {
    readonly [_K in ItemEffectKind]: (_characterController: CharacterController) => void;
};

interface Tile {
    readonly title: string;
    readonly thumbnail: string;
    readonly minSize: number;
    readonly maxSize: number;
    readonly count: number;
    readonly itemEffectKind: ItemEffectKind;
}

interface InventoryConfig {
    readonly HEADING_TEXT: string;
    readonly PANEL_WIDTH_RATIO: number;
    readonly FULL_SCREEN_THRESHOLD: number;
    readonly Z_INDEX: number;
    readonly BUTTON_Z_INDEX: number;
    readonly TILES: readonly Tile[];
}

// Environment Types
const OBJECT_ROLE = {
    DYNAMIC_BOX: "DYNAMIC_BOX",
    PIVOT_BEAM: "PIVOT_BEAM"
} as const;

type ObjectRole = typeof OBJECT_ROLE[keyof typeof OBJECT_ROLE];

interface LightmappedMesh {
    readonly name: string;
    readonly level: number;
}

interface PhysicsObject {
    readonly name: string;
    readonly mass: number;
    readonly scale: number;
    readonly role: ObjectRole;
}

interface Environment {
    readonly name: string;
    readonly model: string;
    readonly lightmap: string;
    readonly scale: number;
    readonly lightmappedMeshes: readonly LightmappedMesh[];
    readonly physicsObjects: readonly PhysicsObject[];
    readonly sky?: SkyConfig; // Optional sky configuration for this environment
    readonly spawnPoint: Vector3; // Spawn point for this environment
    readonly particles?: readonly EnvironmentParticle[]; // Optional environment particles
    readonly items?: readonly ItemConfig[]; // Optional items configuration for this environment
}

interface EnvironmentParticle {
    readonly name: string; // Name of the particle snippet to use
    readonly position: Vector3; // Position where the particle should be created
    readonly updateSpeed?: number; // Optional update speed for the particle system
}

// Asset Types
interface CharacterAnims {
    readonly idle: string;
    readonly walk: string;
    readonly jump: string;
}

interface Character {
    readonly name: string;
    readonly model: string;
    readonly animations: CharacterAnims;
    readonly scale: number;
    readonly mass: number; // Physics mass for different character weights
    readonly height: number; // Character capsule height
    readonly radius: number; // Character capsule radius
    readonly speed: {
        readonly inAir: number;
        readonly onGround: number;
        readonly boostMultiplier: number;
    };
    readonly jumpHeight: number; // Jump height for physics calculations
    readonly rotationSpeed: number; // Rotation speed in radians
    readonly rotationSmoothing: number; // Rotation smoothing factor
    readonly animationBlend?: number; // Animation blend time in milliseconds, defaults to 400
    readonly jumpDelay?: number; // Jump animation delay in milliseconds, defaults to 100
}

// Asset URLs
const ASSETS = {
    CHARACTERS: [
        {
            name: "Red",
            model: "https://raw.githubusercontent.com/EricEisaman/game-dev-1a/main/assets/models/characters/amongUs/red.glb",
            animations: {
                idle: "idle",
                walk: "walk",
                jump: "jump",
            },
            scale: 1,
            mass: 1.0, // Standard weight
            height: 1.8,
            radius: 0.6,
            speed: {
                inAir: 25.0,
                onGround: 25.0,
                boostMultiplier: 8.0
            },
            jumpHeight: 2.0,
            rotationSpeed: 0.05, // radians
            rotationSmoothing: 0.2,
            animationBlend: 200,
            jumpDelay: 200
        },
        {
            name: "Tech Girl",
            model: "https://raw.githubusercontent.com/EricEisaman/game-dev-1a/main/assets/models/characters/techGirl/tech_girl_2.glb",
            animations: {
                idle: "idle",
                walk: "run",
                jump: "jump"
            },
            scale: 1.3,
            mass: 0.8, // Lighter weight for agile character
            height: 1.8,
            radius: 0.6,
            speed: {
                inAir: 30.0, // Faster in air
                onGround: 30.0, // Faster on ground
                boostMultiplier: 8.0
            },
            jumpHeight: 2.5, // Higher jumps
            rotationSpeed: 0.06, // Faster rotation
            rotationSmoothing: 0.15, // Less smoothing for more responsive feel
            animationBlend: 200,
            jumpDelay: 200
        },
        {
            name: "Zombie",
            model: "https://raw.githubusercontent.com/EricEisaman/game-dev-1a/main/assets/models/characters/zombie/zombie_2.glb",
            animations: {
                idle: "Idle",
                walk: "Run_InPlace",
                jump: "Jump"
            },
            scale: 1.35,
            mass: 1.5, // Heavier weight for zombie character
            height: 2.0,
            radius: 0.6,
            speed: {
                inAir: 20.0, // Slower in air
                onGround: 20.0, // Slower on ground
                boostMultiplier: 8.0
            },
            jumpHeight: 2.5, // Lower jumps
            rotationSpeed: 0.04, // Slower rotation
            rotationSmoothing: 0.25, // More smoothing for sluggish feel
            animationBlend: 200,
            jumpDelay: 200
        },
        {
            name: "Hulk",
            model: "https://raw.githubusercontent.com/EricEisaman/game-dev-1a/main/assets/models/characters/hulk/hulk.glb",
            animations: {
                idle: "idle",
                walk: "run",
                jump: "jump"
            },
            scale: 2.0,
            mass: 2.2,
            height: 3.0,
            radius: 1.2,
            speed: {
                inAir: 30.0,
                onGround: 20.0, // Slower on ground
                boostMultiplier: 15.0
            },
            jumpHeight: 11, // Lower jumps
            rotationSpeed: 0.04, // Slower rotation
            rotationSmoothing: 0.25, // More smoothing for sluggish feel
            animationBlend: 200,
            jumpDelay: 200
        }
    ] as readonly Character[],
    ENVIRONMENTS: [
        {
            name: "Level Test",
            model: "https://raw.githubusercontent.com/EricEisaman/game-dev-1a/main/assets/models/environments/levelTest/levelTest.glb",
            lightmap: "https://raw.githubusercontent.com/EricEisaman/game-dev-1a/main/assets/models/environments/levelTest/lightmap.jpg",
            scale: 1,
            lightmappedMeshes: [
                { name: "level_primitive0", level: 1.6 },
                { name: "level_primitive1", level: 1.6 },
                { name: "level_primitive2", level: 1.6 }
            ],
            physicsObjects: [
                { name: "Cube", mass: 0.1, scale: 1, role: OBJECT_ROLE.DYNAMIC_BOX },
                { name: "Cube.001", mass: 0.1, scale: 1, role: OBJECT_ROLE.DYNAMIC_BOX },
                { name: "Cube.002", mass: 0.1, scale: 1, role: OBJECT_ROLE.DYNAMIC_BOX },
                { name: "Cube.003", mass: 0.1, scale: 1, role: OBJECT_ROLE.DYNAMIC_BOX },
                { name: "Cube.004", mass: 0.1, scale: 1, role: OBJECT_ROLE.DYNAMIC_BOX },
                { name: "Cube.005", mass: 0.1, scale: 1, role: OBJECT_ROLE.DYNAMIC_BOX },
                { name: "Cube.006", mass: 0.01, scale: 1, role: OBJECT_ROLE.PIVOT_BEAM },
                { name: "Cube.007", mass: 0, scale: 1, role: OBJECT_ROLE.DYNAMIC_BOX }
            ],
            sky: {
                TEXTURE_URL: "https://raw.githubusercontent.com/EricEisaman/game-dev-1a/main/assets/images/skies/cartoon-river-with-orange-sky.jpg",
                ROTATION_Y: 0,
                BLUR: 0.3,
                TYPE: "SPHERE" as SkyType
            },
            spawnPoint: new Vector3(3, 0.5, -8),
            particles: [
                {
                    name: "Magic Sparkles",
                    position: new Vector3(-2, 0, -8), // Left of player start
                    updateSpeed: 0.007
                }
            ],
            items: [
                {
                    name: "Crate",
                    url: "https://raw.githubusercontent.com/EricEisaman/game-dev-1a/main/assets/models/items/stylized_crate_asset.glb",
                    collectible: true,
                    creditValue: 100,
                    minImpulseForCollection: 0.5,
                    instances: [
                        {
                            position: new Vector3(1, 0.5, -8),
                            scale: 0.5,
                            rotation: new Vector3(0, 0, 0),
                            mass: 0.5
                        },
                        {
                            position: new Vector3(5, 0.5, -8),
                            scale: 0.5,
                            rotation: new Vector3(0, 0, 0),
                            mass: 0.5
                        },
                        {
                            position: new Vector3(0, 0.5, -5),
                            scale: 0.5,
                            rotation: new Vector3(0, 0, 0),
                            mass: 0.5
                        },
                        {
                            position: new Vector3(1, 0.5, -11),
                            scale: 0.5,
                            rotation: new Vector3(0, 0, 0),
                            mass: 0.5
                        },
                        {
                            position: new Vector3(5, 3.5, -11),
                            scale: 0.5,
                            rotation: new Vector3(0, 0, 0),
                            mass: 0.5
                        }
                    ]
                },
                {
                    name: "Super Jump",
                    url: "https://raw.githubusercontent.com/EricEisaman/game-dev-1a/main/assets/models/items/jump_collectible.glb",
                    collectible: true,
                    creditValue: 50,
                    minImpulseForCollection: 0.5,
                    inventory: true,
                    thumbnail: "https://raw.githubusercontent.com/EricEisaman/game-dev-1a/main/assets/images/thumbnails/jump_collectible_thumb.webp",
                    itemEffectKind: "superJump",
                    instances: [
                        {
                            position: new Vector3(-4, 0.5, -8),
                            scale: 0.01,
                            rotation: new Vector3(0, 0, 0),
                            mass: 0.5
                        }
                    ]
                },
                {
                    name: "Invisibility",
                    url: "https://raw.githubusercontent.com/EricEisaman/game-dev-1a/main/assets/models/items/invisibility_collectible.glb",
                    collectible: true,
                    creditValue: 50,
                    minImpulseForCollection: 0.5,
                    inventory: true,
                    thumbnail: "https://raw.githubusercontent.com/EricEisaman/game-dev-1a/main/assets/images/thumbnails/invisibility_collectible_thumb.webp",
                    itemEffectKind: "invisibility",
                    instances: [
                        {
                            position: new Vector3(6, 0.5, -5),
                            scale: 0.01,
                            rotation: new Vector3(0, 0, 0),
                            mass: 0.5
                        }
                    ]
                }
            ]
        },
        {
            name: "Firefox Reality",
            model: "https://raw.githubusercontent.com/EricEisaman/game-dev-1a/main/assets/models/environments/firefoxReality/firefox_reality.glb",
            lightmap: "",
            scale: 1.5,
            lightmappedMeshes: [],
            physicsObjects: [],
            sky: {
                TEXTURE_URL: "https://raw.githubusercontent.com/EricEisaman/game-dev-1a/main/assets/images/skies/orange-desert-night.png",
                ROTATION_Y: 0,
                BLUR: 0.2,
                TYPE: "SPHERE" as SkyType
            },
            spawnPoint: new Vector3(0, 5, 0) // Higher spawn point for Firefox Reality
        },
        {
            name: "Joy Town",
            model: "https://raw.githubusercontent.com/EricEisaman/game-dev-1a/main/assets/models/environments/joyTown/joy_town.glb",
            lightmap: "",
            scale: 10,
            lightmappedMeshes: [],
            physicsObjects: [],
            sky: {
                TEXTURE_URL: "https://raw.githubusercontent.com/EricEisaman/game-dev-1a/main/assets/images/skies/happy_fluffy_sky.png",
                ROTATION_Y: 0,
                BLUR: 0.2,
                TYPE: "SPHERE" as SkyType
            },
            spawnPoint: new Vector3(-15, 15, 0)
        },
        {
            name: "Mansion",
            model: "https://raw.githubusercontent.com/EricEisaman/game-dev-1a/main/assets/models/environments/mansion/mansion.glb",
            lightmap: "",
            scale: 10,
            lightmappedMeshes: [],
            physicsObjects: [],
            sky: {
                TEXTURE_URL: "https://raw.githubusercontent.com/EricEisaman/game-dev-1a/main/assets/images/skies/light-blue-sky-over-grassy-plain.png",
                ROTATION_Y: 0,
                BLUR: 0.2,
                TYPE: "SPHERE" as SkyType
            },
            spawnPoint: new Vector3(0, 15, -20)
        },
        {
            name: "Island Town",
            model: "https://raw.githubusercontent.com/EricEisaman/game-dev-1a/main/assets/models/environments/islandTown/island_town.glb",
            lightmap: "",
            scale: 5,
            lightmappedMeshes: [],
            physicsObjects: [],
            sky: {
                TEXTURE_URL: "https://raw.githubusercontent.com/EricEisaman/game-dev-1a/main/assets/images/skies/light-blue-sky-over-grassy-plain.png",
                ROTATION_Y: 0,
                BLUR: 0.2,
                TYPE: "SPHERE" as SkyType
            },
            spawnPoint: new Vector3(0, 77, -20)
        }
    ] as readonly Environment[]
} as const;

// Configuration Constants
const CONFIG = {
    // Character Settings


    // Camera Settings
    CAMERA: {
        START_POSITION: new Vector3(0, 5, -10),
        OFFSET: new Vector3(0, 1.2, -3),
        DRAG_SENSITIVITY: 0.02,
        ZOOM_MIN: -15,
        ZOOM_MAX: -2,
        FOLLOW_SMOOTHING: 0.1
    },

    // Physics Settings
    PHYSICS: {
        GRAVITY: new Vector3(0, -9.8, 0),
        CHARACTER_GRAVITY: new Vector3(0, -18, 0)
    },

    // Animation Settings
    ANIMATION: {
        PLAYER_SCALE: 0.7,
        PLAYER_Y_OFFSET: -0.9
    },

    // Debug Settings
    DEBUG: {
        CAPSULE_VISIBLE: false
    },

    // Effects Settings
    EFFECTS: {
        PARTICLE_SNIPPETS: [
            {
                name: "Fire Trail",
                description: "Realistic fire particle system with heat distortion",
                category: "fire",
                snippetId: "HYB2FR"
            },
            {
                name: "Magic Sparkles",
                description: "Enchanting sparkle effect with rainbow colors",
                category: "magic",
                snippetId: "T54JV7"
            },
            {
                name: "Dust Storm",
                description: "Atmospheric dust particles with wind effect",
                category: "nature",
                snippetId: "X8Y9Z1"
            },
            {
                name: "Energy Field",
                description: "Sci-fi energy field with electric arcs",
                category: "tech",
                snippetId: "A2B3C4"
            },
            {
                name: "Stardust",
                description: "Cosmic stardust with twinkling effect",
                category: "cosmic",
                snippetId: "D5E6F7"
            },
            {
                name: "Smoke Trail",
                description: "Realistic smoke with fade effect",
                category: "nature",
                snippetId: "G8H9I0"
            },
            {
                name: "Portal Effect",
                description: "Mystical portal with swirling particles",
                category: "magic",
                snippetId: "J1K2L3"
            },
            {
                name: "Laser Beam",
                description: "Sci-fi laser beam with energy core",
                category: "tech",
                snippetId: "M4N5O6"
            },
            {
                name: "Nebula Cloud",
                description: "Cosmic nebula with colorful gas clouds",
                category: "cosmic",
                snippetId: "P7Q8R9"
            },
            {
                name: "Explosion",
                description: "Dramatic explosion with debris",
                category: "fire",
                snippetId: "S0T1U2"
            },
            {
                name: "Thruster",
                description: "Rocket thruster particle system with blue flames",
                category: "tech",
                snippetId: "THRUSTER01"
            }
        ] as const,
        DEFAULT_PARTICLE: "Magic Sparkles",
        AUTO_SPAWN: true,
        SOUND_EFFECTS: [
            {
                name: "Thruster",
                url: "https://raw.githubusercontent.com/EricEisaman/game-dev-1a/main/assets/sounds/effects/thruster.m4a",
                volume: 0.5,
                loop: true
            }
        ] as const
    },

    // HUD Settings
    HUD: {
        POSITION: "top" as HUDPosition,
        FONT_FAMILY: "'Segoe UI', 'Roboto', 'Arial', sans-serif",
        PRIMARY_COLOR: "#ffffff",
        SECONDARY_COLOR: "#cccccc",
        HIGHLIGHT_COLOR: "#00ff88",
        BACKGROUND_COLOR: "#000000",
        BACKGROUND_OPACITY: 0.7,
        PADDING: 15,
        BORDER_RADIUS: 8,
        SHOW_COORDINATES: true,
        SHOW_TIME: true,
        SHOW_FPS: true,
        SHOW_STATE: true,
        SHOW_BOOST_STATUS: true,
        SHOW_CREDITS: true,
        UPDATE_INTERVAL: 100, // milliseconds
        MOBILE: {
            SHOW_COORDINATES: false,
            SHOW_TIME: false,
            SHOW_FPS: false,
            SHOW_STATE: true,
            SHOW_BOOST_STATUS: true,
            SHOW_CREDITS: true
        }
    },



    // Settings Panel Configuration
    SETTINGS: {
        HEADING_TEXT: "Settings",
        PANEL_WIDTH_RATIO: 1 / 3,
        FULL_SCREEN_THRESHOLD: 500,
        Z_INDEX: 1800,
        BUTTON_Z_INDEX: 2000,
        SECTIONS: [
            {
                title: "Screen Controls",
                uiElement: "toggle",
                visibility: "iPadWithKeyboard",
                defaultValue: true, // Default to showing controls
                onChange: async (value: boolean | string) => {
                    // Control mobile input visibility - placeholder for future implementation
                    console.log('Screen Controls changed:', value);
                }
            },
            {
                title: "Character",
                uiElement: "dropdown",
                visibility: "all",
                defaultValue: "Red", // Default to first character (Red)
                options: ASSETS.CHARACTERS.map((character) => character.name),
                onChange: async (value: boolean | string) => {
                    // Character change - placeholder for future implementation
                    console.log('Character changed:', value);
                }
            },
            {
                title: "Environment",
                uiElement: "dropdown",
                visibility: "all",
                defaultValue: "Level Test", // Default to first environment
                options: ASSETS.ENVIRONMENTS.map((environment) => environment.name),
                onChange: async (value: boolean | string) => {
                    // Environment change - placeholder for future implementation
                    console.log('Environment changed:', value);
                }
            }
        ]
    },

    AUDIO: {
        MASTER_VOLUME: 1.0,
        SFX_VOLUME: 1.0,
        MUSIC_VOLUME: 1.0
    },

           INVENTORY: {
               HEADING_TEXT: "Inventory",
               PANEL_WIDTH_RATIO: 1 / 3,
               FULL_SCREEN_THRESHOLD: 500,
               Z_INDEX: 1800,
               BUTTON_Z_INDEX: 2000,
               TILES: [] // Tiles will be added dynamically by InventoryManager
           },

           ITEMS: {
               ITEMS: [], // Items will be populated from environment configurations
               COLLECTION_RADIUS: 2.0,
               COLLECTION_SOUND: "https://raw.githubusercontent.com/EricEisaman/game-dev-1a/main/assets/sounds/effects/collect.wav",
               SHOW_COLLECTION_EFFECTS: true
           }
       } as const;

// Input Mapping
const INPUT_KEYS = {
    FORWARD: ['w', 'arrowup'],
    BACKWARD: ['s', 'arrowdown'],
    LEFT: ['a', 'arrowleft'],
    RIGHT: ['d', 'arrowright'],
    STRAFE_LEFT: ['q'],
    STRAFE_RIGHT: ['e'],
    JUMP: [' '],
    BOOST: ['shift'],
    DEBUG: ['0'],
    HUD_TOGGLE: ['h'],
    HUD_POSITION: ['p'],
    RESET_CAMERA: ['1']
} as const;

// Mobile Touch Controls Configuration
const MOBILE_CONTROLS = {
    JOYSTICK_RADIUS: 60,
    JOYSTICK_DEADZONE: 10,
    BUTTON_SIZE: 80,
    BUTTON_SPACING: 20,
    OPACITY: 0.7,
    COLORS: {
        JOYSTICK_BG: '#333333',
        JOYSTICK_STICK: '#ffffff',
        BUTTON_BG: '#444444',
        BUTTON_ACTIVE: '#00ff88',
        BUTTON_TEXT: '#ffffff'
    },
    POSITIONS: {
        JOYSTICK: {
            BOTTOM: 120,
            LEFT: 0
        },
        JUMP_BUTTON: {
            BOTTOM: 220, // Above boost button
            RIGHT: 0
        },
        BOOST_BUTTON: {
            BOTTOM: 120, // Bottom right
            RIGHT: 0
        }
    },
    VISIBILITY: {
        SHOW_JOYSTICK: true,
        SHOW_JUMP_BUTTON: true,
        SHOW_BOOST_BUTTON: true
    }
} as const;

// Character States
const CHARACTER_STATES = {
    IN_AIR: "IN_AIR",
    ON_GROUND: "ON_GROUND",
    START_JUMP: "START_JUMP"
} as const;

type CharacterState = typeof CHARACTER_STATES[keyof typeof CHARACTER_STATES];

// Animation Groups - unused for now
// const playerAnimations: Record<string, any> = {};

export default CONFIG;
export { ASSETS, INPUT_KEYS, MOBILE_CONTROLS, CHARACTER_STATES, OBJECT_ROLE };
export type { 
    Character, 
    Environment, 
    CharacterConfig, 
    CameraConfig, 
    PhysicsConfig, 
    AnimationConfig, 
    DebugConfig, 
    EffectsConfig, 
    HUDConfig, 
    SettingsConfig, 
    InventoryConfig,
    ItemConfig,
    ItemInstance,
    ItemEffectKind,
    ItemEffect,
    Tile,
    ObjectRole,
    LightmappedMesh,
    PhysicsObject,
    SkyConfig,
    EnvironmentParticle,
    CharacterAnims,
    CharacterState,
    CharacterSpeed,
    ParticleSnippet,
    SoundEffect,
    ItemsConfig,
    HUDPosition,
    UIElementType,
    VisibilityType,
    SettingsSection,
    SkyType,
    GameConfig
};