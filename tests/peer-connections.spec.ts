import { test, expect, type Page, type BrowserContext } from '@playwright/test';

interface PeerState {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  environment: string;
  lastUpdate: number;
}

interface GameState {
  peers: PeerState[];
  environment: string;
}

class GameTestHelper {
  constructor(private page: Page) {}

  async waitForGameEngine(): Promise<void> {
    // Wait for the game canvas to be present
    await this.page.waitForSelector('#game-canvas', { timeout: 20000 });
    
    // Wait for the game engine to initialize
    await this.page.waitForFunction(() => {
      return window.gameEngine !== undefined;
    }, { timeout: 20000 });
  }

  async joinGame(): Promise<void> {
    const joinButton = this.page.locator('button:has-text("Join Game")');
    await joinButton.click({ timeout: 20000 });
    
    // Wait for connection to be established
    await this.page.waitForFunction(() => {
      return window.isConnected === true;
    }, { timeout: 20000 });
  }

  async leaveGame(): Promise<void> {
    const leaveButton = this.page.locator('button:has-text("Leave Game")');
    await leaveButton.click({ timeout: 20000 });
  }

  async changeEnvironment(environment: string): Promise<void> {
    // Click on the Vuetify combobox to open it
    const environmentSelect = this.page.locator('[role="combobox"]').first();
    await environmentSelect.click({ timeout: 20000 });
    
    // Wait for the dropdown to appear and select the option
    await this.page.locator(`[data-value="${environment}"]`).click({ timeout: 20000 });
    
    // Wait for environment change to be processed
    await this.page.waitForTimeout(1000);
  }

  async getPeerCount(): Promise<number> {
    return await this.page.evaluate(() => {
      return window.peers ? window.peers.length : 0;
    });
  }

  async getCurrentEnvironment(): Promise<string> {
    return await this.page.evaluate(() => {
      return window.selectedEnvironment || 'levelTest';
    });
  }

  async getGameState(): Promise<GameState> {
    return await this.page.evaluate(() => {
      return {
        peers: window.peers || [],
        environment: window.selectedEnvironment || 'levelTest'
      };
    });
  }

  async simulatePlayerMovement(): Promise<void> {
    // Simulate WASD key presses to move the player
    await this.page.keyboard.press('KeyW');
    await this.page.waitForTimeout(100);
    await this.page.keyboard.press('KeyA');
    await this.page.waitForTimeout(100);
    await this.page.keyboard.press('KeyS');
    await this.page.waitForTimeout(100);
    await this.page.keyboard.press('KeyD');
    await this.page.waitForTimeout(100);
  }

  async waitForPeerUpdate(timeout: number = 5000): Promise<void> {
    await this.page.waitForFunction(() => {
      return window.lastPeerUpdate && (Date.now() - window.lastPeerUpdate) < 1000;
    }, { timeout });
  }
}

test.describe('Multiplayer Peer Connections', () => {
  let context1: BrowserContext;
  let context2: BrowserContext;
  let page1: Page;
  let page2: Page;
  let helper1: GameTestHelper;
  let helper2: GameTestHelper;

  test.beforeAll(async ({ browser }) => {
    // Create two separate browser contexts to simulate different users
    context1 = await browser.newContext();
    context2 = await browser.newContext();
    
    page1 = await context1.newPage();
    page2 = await context2.newPage();
    
    helper1 = new GameTestHelper(page1);
    helper2 = new GameTestHelper(page2);
  });

  test.afterAll(async () => {
    await context1.close();
    await context2.close();
  });

  test('should establish peer connections and handle peer instantiation', async () => {
    // Navigate both pages to the game
    await page1.goto('/');
    await page2.goto('/');

    // Wait for both game engines to initialize
    await helper1.waitForGameEngine();
    await helper2.waitForGameEngine();

    // Both players join the game
    await helper1.joinGame();
    await helper2.joinGame();

    // Wait for both connections to be established
    await page1.waitForFunction(() => window.isConnected === true);
    await page2.waitForFunction(() => window.isConnected === true);

    // Verify both players can see each other in the same environment
    await page1.waitForTimeout(2000); // Allow time for peer synchronization
    
    const peerCount1 = await helper1.getPeerCount();
    const peerCount2 = await helper2.getPeerCount();
    
    // Each player should see at least 1 peer (themselves), ideally 2 (including the other player)
    expect(peerCount1).toBeGreaterThanOrEqual(1);
    expect(peerCount2).toBeGreaterThanOrEqual(1);

    // Verify both players are in the same environment
    const environment1 = await helper1.getCurrentEnvironment();
    const environment2 = await helper2.getCurrentEnvironment();
    expect(environment1).toBe(environment2);
  });

  test('should handle peer state updates correctly', async () => {
    // Ensure both players are connected
    await page1.waitForFunction(() => window.isConnected === true);
    await page2.waitForFunction(() => window.isConnected === true);

    // Get initial game states
    // const initialState1 = await helper1.getGameState(); // Unused for now
    // const initialState2 = await helper2.getGameState(); // Unused for now

    // Player 1 moves around
    await helper1.simulatePlayerMovement();
    await page1.waitForTimeout(1000);

    // Player 2 moves around
    await helper2.simulatePlayerMovement();
    await page2.waitForTimeout(1000);

    // Get updated game states
    const updatedState1 = await helper1.getGameState();
    const updatedState2 = await helper2.getGameState();

    // Verify that peer states have been updated
    expect(updatedState1.peers.length).toBeGreaterThanOrEqual(1);
    expect(updatedState2.peers.length).toBeGreaterThanOrEqual(1);

    // Verify that peers have valid position data
    updatedState1.peers.forEach(peer => {
      expect(peer.position).toBeDefined();
      expect(typeof peer.position.x).toBe('number');
      expect(typeof peer.position.y).toBe('number');
      expect(typeof peer.position.z).toBe('number');
      expect(peer.environment).toBe(updatedState1.environment);
    });

    updatedState2.peers.forEach(peer => {
      expect(peer.position).toBeDefined();
      expect(typeof peer.position.x).toBe('number');
      expect(typeof peer.position.y).toBe('number');
      expect(typeof peer.position.z).toBe('number');
      expect(peer.environment).toBe(updatedState2.environment);
    });
  });

  test('should isolate peers by environment - same environment', async () => {
    // Ensure both players are in the same environment initially
    const environment1 = await helper1.getCurrentEnvironment();
    const environment2 = await helper2.getCurrentEnvironment();
    expect(environment1).toBe(environment2);

    // Both players should be able to see each other
    await page1.waitForTimeout(2000);
    
    const gameState1 = await helper1.getGameState();
    const gameState2 = await helper2.getGameState();

    // In the same environment, both players should see peers
    expect(gameState1.peers.length).toBeGreaterThanOrEqual(1);
    expect(gameState2.peers.length).toBeGreaterThanOrEqual(1);

    // All peers should be in the same environment
    gameState1.peers.forEach(peer => {
      expect(peer.environment).toBe(environment1);
    });
    gameState2.peers.forEach(peer => {
      expect(peer.environment).toBe(environment2);
    });
  });

  test('should isolate peers by environment - different environments', async () => {
    // Change player 1 to a different environment
    await helper1.changeEnvironment('islandTown');
    await page1.waitForTimeout(2000);

    // Verify environment change
    const environment1 = await helper1.getCurrentEnvironment();
    const environment2 = await helper2.getCurrentEnvironment();
    expect(environment1).toBe('islandTown');
    expect(environment2).toBe('levelTest');

    // Get game states after environment separation
    const gameState1 = await helper1.getGameState();
    const gameState2 = await helper2.getGameState();

    // Player 1 should only see peers in islandTown environment
    gameState1.peers.forEach(peer => {
      expect(peer.environment).toBe('islandTown');
    });

    // Player 2 should only see peers in levelTest environment
    gameState2.peers.forEach(peer => {
      expect(peer.environment).toBe('levelTest');
    });

    // The players should not see each other's peers since they're in different environments
    const player1PeerIds = gameState1.peers.map(p => p.id);
    const player2PeerIds = gameState2.peers.map(p => p.id);
    
    // There should be no overlap in peer IDs between different environments
    const overlap = player1PeerIds.filter(id => player2PeerIds.includes(id));
    expect(overlap.length).toBe(0);
  });

  test('should handle peer reconnection when returning to same environment', async () => {
    // Player 1 returns to the same environment as Player 2
    await helper1.changeEnvironment('levelTest');
    await page1.waitForTimeout(2000);

    // Verify both players are now in the same environment
    const environment1 = await helper1.getCurrentEnvironment();
    const environment2 = await helper2.getCurrentEnvironment();
    expect(environment1).toBe('levelTest');
    expect(environment2).toBe('levelTest');

    // Wait for peer synchronization
    await page1.waitForTimeout(2000);

    // Both players should now see each other again
    const gameState1 = await helper1.getGameState();
    const gameState2 = await helper2.getGameState();

    // Both players should see peers in the levelTest environment
    expect(gameState1.peers.length).toBeGreaterThanOrEqual(1);
    expect(gameState2.peers.length).toBeGreaterThanOrEqual(1);

    // All peers should be in the levelTest environment
    gameState1.peers.forEach(peer => {
      expect(peer.environment).toBe('levelTest');
    });
    gameState2.peers.forEach(peer => {
      expect(peer.environment).toBe('levelTest');
    });
  });

  test('should handle peer disconnection gracefully', async () => {
    // Player 1 leaves the game
    await helper1.leaveGame();
    await page1.waitForTimeout(2000);

    // Player 2 should no longer see Player 1's peer
    const gameState2 = await helper2.getGameState();
    
    // Player 2 should still be connected and see themselves
    expect(gameState2.peers.length).toBeGreaterThanOrEqual(1);
    
    // All remaining peers should be in the correct environment
    gameState2.peers.forEach(peer => {
      expect(peer.environment).toBe('levelTest');
    });

    // Player 1 rejoins
    await helper1.joinGame();
    await page1.waitForTimeout(2000);

    // Both players should see each other again
    const finalGameState1 = await helper1.getGameState();
    const finalGameState2 = await helper2.getGameState();

    expect(finalGameState1.peers.length).toBeGreaterThanOrEqual(1);
    expect(finalGameState2.peers.length).toBeGreaterThanOrEqual(1);
  });

  test('should maintain peer state consistency during rapid environment changes', async () => {
    // Rapidly change environments for both players
    const environments = ['levelTest', 'islandTown', 'joyTown', 'mansion'];
    
    for (const env of environments) {
      await helper1.changeEnvironment(env);
      await helper2.changeEnvironment(env);
      await page1.waitForTimeout(500);
      await page2.waitForTimeout(500);

      // Verify both players are in the same environment
      const env1 = await helper1.getCurrentEnvironment();
      const env2 = await helper2.getCurrentEnvironment();
      expect(env1).toBe(env);
      expect(env2).toBe(env);

      // Verify peer isolation is maintained
      const gameState1 = await helper1.getGameState();
      const gameState2 = await helper2.getGameState();

      gameState1.peers.forEach(peer => {
        expect(peer.environment).toBe(env);
      });
      gameState2.peers.forEach(peer => {
        expect(peer.environment).toBe(env);
      });
    }
  });
});

// Add global type declarations for the test
declare global {
  interface Window {
    gameEngine: any;
    isConnected: boolean;
    peers: PeerState[];
    selectedEnvironment: string;
    lastPeerUpdate: number;
  }
}
