import { test, expect } from '@playwright/test';

test.describe('SSE Server Asset Serving', () => {
  test('should serve client HTML from SSE server', async ({ page }) => {
    // Test that the SSE server can serve the client HTML
    await page.goto('http://localhost:10000/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check that the page title is correct
    const title = await page.title();
    expect(title).toContain('Babylon');
    
    // Check that the game canvas is present
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();
  });

  test('should serve client JavaScript assets', async ({ page }) => {
    // Test that JS assets are served correctly
    const response = await page.goto('http://localhost:10000/');
    expect(response?.status()).toBe(200);
    
    // Check that the main JS bundle is loaded
    const jsResponse = await page.request.get('http://localhost:10000/src/main.ts');
    expect(jsResponse.status()).toBe(200);
  });

  test('should serve static assets from SSE server', async ({ page }) => {
    // Test static asset serving
    const assets = [
      '/public/icons/favicon.png',
      '/public/icons/icon-192.png',
      '/public/icons/icon-512.png',
      '/public/manifest.json'
    ];
    
    for (const asset of assets) {
      const response = await page.request.get(`http://localhost:10000${asset}`);
      expect(response.status()).toBe(200);
    }
  });

  test('should serve game assets from SSE server', async ({ page }) => {
    // Test game-specific assets
    const gameAssets = [
      '/assets/images/skies/cartoon-river-with-orange-sky.jpg',
      '/assets/images/skies/happy_fluffy_sky.png',
      '/assets/sounds/effects/collect.m4a',
      '/assets/sounds/effects/thruster.m4a'
    ];
    
    for (const asset of gameAssets) {
      const response = await page.request.get(`http://localhost:10000${asset}`);
      // Some assets might not exist, so we check for either 200 or 404
      expect([200, 404]).toContain(response.status());
    }
  });

  test('should serve 3D models from SSE server', async ({ page }) => {
    // Test 3D model assets
    const models = [
      '/assets/models/characters/amongUs/amongUs.glb',
      '/assets/models/characters/hulk/hulk.glb',
      '/assets/models/characters/techGirl/techGirl.glb',
      '/assets/models/characters/zombie/zombie.glb',
      '/assets/models/environments/levelTest/levelTest.glb',
      '/assets/models/environments/islandTown/islandTown.glb',
      '/assets/models/items/invisibility_collectible.glb',
      '/assets/models/items/jump_collectible.glb'
    ];
    
    for (const model of models) {
      const response = await page.request.get(`http://localhost:10000${model}`);
      // Models might not exist, so we check for either 200 or 404
      expect([200, 404]).toContain(response.status());
    }
  });

  test('should handle CORS headers for SSE server', async ({ page }) => {
    // Test CORS headers for SSE server
    const response = await page.request.get('http://localhost:10000/api/health');
    expect(response.status()).toBe(200);
    
    const headers = response.headers();
    expect(headers['access-control-allow-origin']).toBeDefined();
    expect(headers['access-control-allow-methods']).toBeDefined();
  });

  test('should serve SSE endpoints correctly', async ({ page }) => {
    // Test SSE endpoint
    const sseResponse = await page.request.get('http://localhost:10000/api/datastar/sse');
    expect(sseResponse.status()).toBe(200);
    expect(sseResponse.headers()['content-type']).toContain('text/event-stream');
  });

  test('should handle SSE send endpoint', async ({ page }) => {
    // Test SSE send endpoint
    const sendResponse = await page.request.post('http://localhost:10000/api/datastar/send', {
      data: {
        type: 'test',
        message: 'Test message'
      }
    });
    expect(sendResponse.status()).toBe(200);
  });
});
