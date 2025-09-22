// ============================================================================
// GAME CONFIGURATION - THE WORD OF GOD FROM PLAYGROUND.TS
// ============================================================================

import { Vector3 } from '@babylonjs/core';

// Environment Types - THE WORD OF GOD FROM PLAYGROUND.TS
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

interface SkyConfig {
  readonly TEXTURE_URL: string;
  readonly ROTATION_Y: number;
  readonly BLUR: number;
  readonly TYPE: "BOX" | "SPHERE";
}

interface EnvironmentParticle {
  readonly name: string;
  readonly position: Vector3;
  readonly updateSpeed?: number;
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
  readonly itemEffectKind?: "superJump" | "invisibility";
}

interface Environment {
  readonly name: string;
  readonly model: string;
  readonly lightmap: string;
  readonly scale: number;
  readonly lightmappedMeshes: readonly LightmappedMesh[];
  readonly physicsObjects: readonly PhysicsObject[];
  readonly sky?: SkyConfig;
  readonly spawnPoint: Vector3;
  readonly particles?: readonly EnvironmentParticle[];
  readonly items?: readonly ItemConfig[];
}

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
  readonly mass: number;
  readonly height: number;
  readonly radius: number;
  readonly speed: {
    readonly inAir: number;
    readonly onGround: number;
    readonly boostMultiplier: number;
  };
  readonly jumpHeight: number;
  readonly rotationSpeed: number;
  readonly rotationSmoothing: number;
  readonly animationBlend?: number;
  readonly jumpDelay?: number;
}

// Asset URLs - IDENTICAL TO PLAYGROUND.TS
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
      mass: 1.0,
      height: 1.8,
      radius: 0.6,
      speed: {
        inAir: 25.0,
        onGround: 25.0,
        boostMultiplier: 8.0
      },
      jumpHeight: 2.0,
      rotationSpeed: 0.05,
      rotationSmoothing: 0.2,
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
        TYPE: "SPHERE" as const
      },
      spawnPoint: new Vector3(3, 0.5, -8),
      particles: [
        {
          name: "Magic Sparkles",
          position: new Vector3(-2, 0, -8),
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
    }
  ] as readonly Environment[]
} as const;

// Configuration Constants - IDENTICAL TO PLAYGROUND.TS
const CONFIG = {
  CAMERA: {
    START_POSITION: new Vector3(0, 5, -10),
    OFFSET: new Vector3(0, 1.2, -3),
    DRAG_SENSITIVITY: 0.02,
    ZOOM_MIN: -15,
    ZOOM_MAX: -2,
    FOLLOW_SMOOTHING: 0.1
  },
  PHYSICS: {
    GRAVITY: new Vector3(0, -9.8, 0),
    CHARACTER_GRAVITY: new Vector3(0, -18, 0)
  },
  ANIMATION: {
    PLAYER_SCALE: 0.7,
    PLAYER_Y_OFFSET: -0.9
  },
  DEBUG: {
    CAPSULE_VISIBLE: false
  },
  EFFECTS: {
    PARTICLE_SNIPPETS: [
      {
        name: "Magic Sparkles",
        description: "Enchanting sparkle effect with rainbow colors",
        category: "magic" as const,
        snippetId: "T54JV7"
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
  HUD: {
    POSITION: "top" as const,
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
    UPDATE_INTERVAL: 100,
    MOBILE: {
      SHOW_COORDINATES: false,
      SHOW_TIME: false,
      SHOW_FPS: false,
      SHOW_STATE: true,
      SHOW_BOOST_STATUS: true,
      SHOW_CREDITS: true
    }
  },
  SETTINGS: {
    HEADING_TEXT: "Settings",
    PANEL_WIDTH_RATIO: 1 / 3,
    FULL_SCREEN_THRESHOLD: 500,
    Z_INDEX: 1800,
    BUTTON_Z_INDEX: 2000,
    SECTIONS: [
      {
        title: "Character",
        uiElement: "dropdown" as const,
        visibility: "all" as const,
        defaultValue: "Red",
        options: ASSETS.CHARACTERS.map((character) => character.name),
        onChange: async () => {}
      },
      {
        title: "Environment",
        uiElement: "dropdown" as const,
        visibility: "all" as const,
        defaultValue: "Level Test",
        options: ASSETS.ENVIRONMENTS.map((environment) => environment.name),
        onChange: async () => {}
      }
    ]
  },
  INVENTORY: {
    HEADING_TEXT: "Inventory",
    PANEL_WIDTH_RATIO: 1 / 3,
    FULL_SCREEN_THRESHOLD: 500,
    Z_INDEX: 1800,
    BUTTON_Z_INDEX: 2000,
    TILES: []
  }
} as const;

// Export everything - THE WORD OF GOD
export default CONFIG;
export { ASSETS, OBJECT_ROLE };
export type { 
  Character, 
  Environment, 
  ObjectRole, 
  ItemConfig,
  ItemInstance
};
