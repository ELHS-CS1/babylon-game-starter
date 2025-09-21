import { test, expect, Page } from '@playwright/test';

/**
 * Canvas Rendering E2E Tests
 * 
 * These tests verify that the Babylon.js canvas is rendering correctly
 * by sampling pixel colors at specific coordinates and comparing them
 * against expected values for different environments and scenes.
 */

class CanvasTestHelper {
  constructor(private page: Page) {}

  async waitForCanvasReady(): Promise<void> {
    // Wait for the canvas element to be present and have content
    await this.page.waitForSelector('canvas', { timeout: 20000 });
    
    // Wait for the game engine to be initialized
    await this.page.waitForFunction(() => {
      return window.gameEngine !== null && window.gameEngine !== undefined;
    }, { timeout: 20000 });

    // Wait for the scene to be fully loaded
    await this.page.waitForFunction(() => {
      return window.gameEngine && window.gameEngine.scene && window.gameEngine.scene.isReady();
    }, { timeout: 20000 });
  }

  async getCanvasElement(): Promise<HTMLCanvasElement> {
    return await this.page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) {
        throw new Error('Canvas element not found');
      }
      return canvas;
    });
  }

  async samplePixelColor(x: number, y: number): Promise<{ r: number; g: number; b: number; a: number }> {
    return await this.page.evaluate(({ x, y }) => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) {
        throw new Error('Canvas not found');
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas 2D context not available');
      }

      // Get image data for the specific pixel
      const imageData = ctx.getImageData(x, y, 1, 1);
      const data = imageData.data;

      return {
        r: data[0],
        g: data[1],
        b: data[2],
        a: data[3]
      };
    }, { x, y });
  }

  async sampleMultiplePixels(coordinates: Array<{ x: number; y: number; name: string }>): Promise<Record<string, { r: number; g: number; b: number; a: number }>> {
    const results: Record<string, { r: number; g: number; b: number; a: number }> = {};
    
    for (const coord of coordinates) {
      results[coord.name] = await this.samplePixelColor(coord.x, coord.y);
    }
    
    return results;
  }

  async changeEnvironment(environment: string): Promise<void> {
    // Click on the Vuetify combobox to open it
    const environmentSelect = this.page.locator('[role="combobox"]').first();
    await environmentSelect.click({ timeout: 20000 });
    
    // Wait for the dropdown to appear and select the option
    await this.page.locator(`[data-value="${environment}"]`).click({ timeout: 20000 });
    
    // Wait for environment change to be processed
    await this.page.waitForTimeout(2000);
    
    // Wait for new scene to be ready
    await this.page.waitForFunction(() => {
      return window.gameEngine && window.gameEngine.scene && window.gameEngine.scene.isReady();
    }, { timeout: 20000 });
  }

  async joinGame(): Promise<void> {
    const joinButton = this.page.locator('button:has-text("Join Game")');
    await joinButton.click({ timeout: 20000 });
    
    // Wait for player to be created
    await this.page.waitForTimeout(1000);
  }
}

// Expected color values for different environments
const EXPECTED_COLORS = {
  levelTest: {
    sky: { r: 135, g: 206, b: 235, tolerance: 30 }, // Sky blue
    ground: { r: 34, g: 139, b: 34, tolerance: 30 }, // Forest green
    ambient: { r: 50, g: 50, b: 50, tolerance: 20 }  // Dark gray
  },
  islandTown: {
    sky: { r: 135, g: 206, b: 250, tolerance: 30 }, // Light sky blue
    ground: { r: 160, g: 82, b: 45, tolerance: 30 }, // Saddle brown
    ambient: { r: 60, g: 60, b: 60, tolerance: 20 }  // Dark gray
  },
  joyTown: {
    sky: { r: 255, g: 192, b: 203, tolerance: 30 }, // Pink
    ground: { r: 255, g: 215, b: 0, tolerance: 30 }, // Gold
    ambient: { r: 70, g: 70, b: 70, tolerance: 20 }  // Dark gray
  },
  mansion: {
    sky: { r: 25, g: 25, b: 112, tolerance: 30 }, // Midnight blue
    ground: { r: 139, g: 69, b: 19, tolerance: 30 }, // Saddle brown
    ambient: { r: 20, g: 20, b: 20, tolerance: 20 }  // Very dark gray
  },
  firefoxReality: {
    sky: { r: 70, g: 130, b: 180, tolerance: 30 }, // Steel blue
    ground: { r: 105, g: 105, b: 105, tolerance: 30 }, // Dim gray
    ambient: { r: 40, g: 40, b: 40, tolerance: 20 }  // Dark gray
  }
};

// Helper function to check if color is within tolerance
function isColorWithinTolerance(
  actual: { r: number; g: number; b: number },
  expected: { r: number; g: number; b: number; tolerance: number }
): boolean {
  const rDiff = Math.abs(actual.r - expected.r);
  const gDiff = Math.abs(actual.g - expected.g);
  const bDiff = Math.abs(actual.b - expected.b);
  
  return rDiff <= expected.tolerance && gDiff <= expected.tolerance && bDiff <= expected.tolerance;
}

test.describe('Canvas Rendering Tests', () => {
  let helper: CanvasTestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new CanvasTestHelper(page);
    await page.goto('/');
    await helper.waitForCanvasReady();
  });

  test('should render levelTest environment with correct colors', async () => {
    // Ensure we're in the levelTest environment
    await helper.changeEnvironment('levelTest');
    await helper.joinGame();

    // Sample pixels at different locations
    const pixelSamples = await helper.sampleMultiplePixels([
      { x: 100, y: 50, name: 'sky_top' },
      { x: 200, y: 100, name: 'sky_mid' },
      { x: 300, y: 200, name: 'ground_area' },
      { x: 150, y: 150, name: 'mid_scene' }
    ]);

    // Check sky colors (top and middle areas)
    expect(isColorWithinTolerance(pixelSamples.sky_top, EXPECTED_COLORS.levelTest.sky)).toBe(true);
    expect(isColorWithinTolerance(pixelSamples.sky_mid, EXPECTED_COLORS.levelTest.sky)).toBe(true);

    // Check ground color
    expect(isColorWithinTolerance(pixelSamples.ground_area, EXPECTED_COLORS.levelTest.ground)).toBe(true);

    // Log actual colors for debugging
    console.log('LevelTest Environment Colors:', pixelSamples);
  });

  test('should render islandTown environment with correct colors', async () => {
    await helper.changeEnvironment('islandTown');
    await helper.joinGame();

    const pixelSamples = await helper.sampleMultiplePixels([
      { x: 100, y: 50, name: 'sky_top' },
      { x: 200, y: 100, name: 'sky_mid' },
      { x: 300, y: 200, name: 'ground_area' }
    ]);

    expect(isColorWithinTolerance(pixelSamples.sky_top, EXPECTED_COLORS.islandTown.sky)).toBe(true);
    expect(isColorWithinTolerance(pixelSamples.ground_area, EXPECTED_COLORS.islandTown.ground)).toBe(true);

    console.log('IslandTown Environment Colors:', pixelSamples);
  });

  test('should render joyTown environment with correct colors', async () => {
    await helper.changeEnvironment('joyTown');
    await helper.joinGame();

    const pixelSamples = await helper.sampleMultiplePixels([
      { x: 100, y: 50, name: 'sky_top' },
      { x: 200, y: 100, name: 'sky_mid' },
      { x: 300, y: 200, name: 'ground_area' }
    ]);

    expect(isColorWithinTolerance(pixelSamples.sky_top, EXPECTED_COLORS.joyTown.sky)).toBe(true);
    expect(isColorWithinTolerance(pixelSamples.ground_area, EXPECTED_COLORS.joyTown.ground)).toBe(true);

    console.log('JoyTown Environment Colors:', pixelSamples);
  });

  test('should render mansion environment with correct colors', async () => {
    await helper.changeEnvironment('mansion');
    await helper.joinGame();

    const pixelSamples = await helper.sampleMultiplePixels([
      { x: 100, y: 50, name: 'sky_top' },
      { x: 200, y: 100, name: 'sky_mid' },
      { x: 300, y: 200, name: 'ground_area' }
    ]);

    expect(isColorWithinTolerance(pixelSamples.sky_top, EXPECTED_COLORS.mansion.sky)).toBe(true);
    expect(isColorWithinTolerance(pixelSamples.ground_area, EXPECTED_COLORS.mansion.ground)).toBe(true);

    console.log('Mansion Environment Colors:', pixelSamples);
  });

  test('should render firefoxReality environment with correct colors', async () => {
    await helper.changeEnvironment('firefoxReality');
    await helper.joinGame();

    const pixelSamples = await helper.sampleMultiplePixels([
      { x: 100, y: 50, name: 'sky_top' },
      { x: 200, y: 100, name: 'sky_mid' },
      { x: 300, y: 200, name: 'ground_area' }
    ]);

    expect(isColorWithinTolerance(pixelSamples.sky_top, EXPECTED_COLORS.firefoxReality.sky)).toBe(true);
    expect(isColorWithinTolerance(pixelSamples.ground_area, EXPECTED_COLORS.firefoxReality.ground)).toBe(true);

    console.log('FirefoxReality Environment Colors:', pixelSamples);
  });

  test('should maintain consistent colors after environment switching', async () => {
    // Start with levelTest
    await helper.changeEnvironment('levelTest');
    await helper.joinGame();
    
    const levelTestColors = await helper.sampleMultiplePixels([
      { x: 100, y: 50, name: 'sky' },
      { x: 300, y: 200, name: 'ground' }
    ]);

    // Switch to joyTown
    await helper.changeEnvironment('joyTown');
    
    const joyTownColors = await helper.sampleMultiplePixels([
      { x: 100, y: 50, name: 'sky' },
      { x: 300, y: 200, name: 'ground' }
    ]);

    // Switch back to levelTest
    await helper.changeEnvironment('levelTest');
    
    const levelTestColorsAgain = await helper.sampleMultiplePixels([
      { x: 100, y: 50, name: 'sky' },
      { x: 300, y: 200, name: 'ground' }
    ]);

    // Colors should be consistent when returning to the same environment
    expect(isColorWithinTolerance(levelTestColors.sky, levelTestColorsAgain.sky)).toBe(true);
    expect(isColorWithinTolerance(levelTestColors.ground, levelTestColorsAgain.ground)).toBe(true);

    // Colors should be different between environments
    expect(isColorWithinTolerance(levelTestColors.sky, joyTownColors.sky)).toBe(false);
    expect(isColorWithinTolerance(levelTestColors.ground, joyTownColors.ground)).toBe(false);

    console.log('Environment Switching Colors:', {
      levelTest: levelTestColors,
      joyTown: joyTownColors,
      levelTestAgain: levelTestColorsAgain
    });
  });

  test('should render character with visible colors when player joins', async () => {
    await helper.changeEnvironment('levelTest');
    
    // Sample colors before joining
    const beforeJoin = await helper.sampleMultiplePixels([
      { x: 400, y: 300, name: 'character_area' },
      { x: 450, y: 350, name: 'character_center' }
    ]);

    // Join the game
    await helper.joinGame();
    
    // Wait for character to be rendered
    await helper.page.waitForTimeout(2000);
    
    // Sample colors after joining
    const afterJoin = await helper.sampleMultiplePixels([
      { x: 400, y: 300, name: 'character_area' },
      { x: 450, y: 350, name: 'character_center' }
    ]);

    // Character should be visible (colors should change)
    const characterVisible = 
      beforeJoin.character_area.r !== afterJoin.character_area.r ||
      beforeJoin.character_area.g !== afterJoin.character_area.g ||
      beforeJoin.character_area.b !== afterJoin.character_area.b;

    expect(characterVisible).toBe(true);

    console.log('Character Rendering Colors:', {
      beforeJoin,
      afterJoin,
      characterVisible
    });
  });

  test('should handle canvas resize without color corruption', async () => {
    await helper.changeEnvironment('levelTest');
    await helper.joinGame();

    // Get initial colors
    const initialColors = await helper.sampleMultiplePixels([
      { x: 100, y: 50, name: 'sky' },
      { x: 300, y: 200, name: 'ground' }
    ]);

    // Resize the browser window
    await helper.page.setViewportSize({ width: 1200, height: 800 });
    await helper.page.waitForTimeout(1000);

    // Get colors after resize
    const resizedColors = await helper.sampleMultiplePixels([
      { x: 100, y: 50, name: 'sky' },
      { x: 300, y: 200, name: 'ground' }
    ]);

    // Colors should remain consistent after resize
    expect(isColorWithinTolerance(initialColors.sky, resizedColors.sky)).toBe(true);
    expect(isColorWithinTolerance(initialColors.ground, resizedColors.ground)).toBe(true);

    console.log('Canvas Resize Colors:', {
      initial: initialColors,
      resized: resizedColors
    });
  });
});
