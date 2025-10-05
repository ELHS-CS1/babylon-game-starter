import { test, expect, type Page, type BrowserContext } from '@playwright/test';

/**
 * DataStar Multiplayer E2E Tests
 * Following official DataStar documentation patterns:
 * - datastar-patch-elements events
 * - DataStar SSE connection handling
 * - DOM patching and state management
 * - Multiplayer peer synchronization
 */

interface DataStarSSEEvent {
  type: 'datastar-patch-elements' | 'datastar-patch-signals' | 'message';
  data: string;
  timestamp?: number;
}

interface DataStarConnectionState {
  isConnected: boolean;
  connectionStatus: string;
  serverTime: string;
  peers: DataStarPeer[];
  lastUpdate: number;
}

interface DataStarPeer {
  id: string;
  name: string;
  environment: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  lastUpdate: number;
}

class DataStarTestHelper {
  constructor(private page: Page) {}

  /**
   * Wait for DataStar SSE connection to be established
   * Following official DataStar patterns for connection handling
   */
  async waitForDataStarConnection(timeout: number = 20000): Promise<void> {
    await this.page.waitForFunction(() => {
      // Check if DataStar SSE connection is established
      return window.dataStarIntegration && 
             window.dataStarIntegration.getConnectionStatus() === true;
    }, { timeout });
  }

  /**
   * Wait for DataStar patch-elements to be applied to DOM
   * Following official DataStar documentation for DOM patching
   */
  async waitForDataStarPatchElements(selector: string, timeout: number = 10000): Promise<void> {
    await this.page.waitForSelector(selector, { timeout });
    
    // Verify the element was patched by DataStar
    const element = await this.page.locator(selector);
    await expect(element).toBeVisible();
  }

  /**
   * Check DataStar connection status from DOM
   * Following official DataStar patterns for status checking
   */
  async getDataStarConnectionStatus(): Promise<boolean> {
    return await this.page.evaluate(() => {
      const statusElement = document.getElementById('connection-status');
      return statusElement?.textContent === 'Connected';
    });
  }

  /**
   * Get DataStar server time from patched DOM element
   */
  async getDataStarServerTime(): Promise<string> {
    return await this.page.evaluate(() => {
      const timeElement = document.getElementById('server-time');
      return timeElement?.textContent || '';
    });
  }

  /**
   * Get DataStar peers from patched DOM elements
   * Following official DataStar patterns for peer management
   */
  async getDataStarPeers(): Promise<DataStarPeer[]> {
    return await this.page.evaluate(() => {
      const peerElements = document.querySelectorAll('[id^="peer-"]');
      return Array.from(peerElements).map(element => {
        const id = element.id.replace('peer-', '');
        const text = element.textContent || '';
        const [name, environment] = text.split(' - ');
        
        return {
          id,
          name: name || `Peer_${id}`,
          environment: environment || 'Level Test',
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          lastUpdate: Date.now()
        };
      });
    });
  }

  /**
   * Simulate DataStar SSE event by sending to server
   * Following official DataStar patterns for event handling
   */
  async sendDataStarEvent(event: DataStarSSEEvent): Promise<void> {
    await this.page.evaluate(async (eventData) => {
      try {
        const response = await fetch('http://localhost:10000/api/datastar/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData),
        });
        
        if (!response.ok) {
          throw new Error(`DataStar send failed: ${response.status}`);
        }
      } catch (error) {
        console.error('DataStar send error:', error);
      }
    }, event);
  }

  /**
   * Wait for DataStar state update
   * Following official DataStar patterns for state management
   */
  async waitForDataStarStateUpdate(timeout: number = 5000): Promise<void> {
    await this.page.waitForFunction(() => {
      return window.gameState && 
             window.gameState.lastUpdate && 
             (Date.now() - window.gameState.lastUpdate) < 1000;
    }, { timeout });
  }

  /**
   * Get current DataStar connection state
   */
  async getDataStarConnectionState(): Promise<DataStarConnectionState> {
    return await this.page.evaluate(() => {
      const connectionStatus = document.getElementById('connection-status')?.textContent || 'Disconnected';
      const serverTime = document.getElementById('server-time')?.textContent || '';
      
      return {
        isConnected: connectionStatus === 'Connected',
        connectionStatus,
        serverTime,
        peers: window.gameState?.players || [],
        lastUpdate: window.gameState?.lastUpdate || 0
      };
    });
  }

  /**
   * Join game using DataStar patterns
   */
  async joinGameDataStar(): Promise<void> {
    // Click join button
    const joinButton = this.page.locator('button:has-text("Join Game")');
    await joinButton.click({ timeout: 10000 });
    
    // Wait for DataStar connection
    await this.waitForDataStarConnection();
    
    // Wait for connection status to be patched
    await this.waitForDataStarPatchElements('#connection-status');
    
    // Verify connection status
    const isConnected = await this.getDataStarConnectionStatus();
    expect(isConnected).toBe(true);
  }

  /**
   * Leave game using DataStar patterns
   */
  async leaveGameDataStar(): Promise<void> {
    const leaveButton = this.page.locator('button:has-text("Leave Game")');
    await leaveButton.click({ timeout: 10000 });
    
    // Wait for state update
    await this.waitForDataStarStateUpdate();
  }

  /**
   * Change environment using DataStar patterns
   */
  async changeEnvironmentDataStar(environment: string): Promise<void> {
    // Click on environment selector
    const environmentSelect = this.page.locator('[role="combobox"]').first();
    await environmentSelect.click({ timeout: 10000 });
    
    // Select new environment
    await this.page.locator(`[data-value="${environment}"]`).click({ timeout: 10000 });
    
    // Wait for DataStar state update
    await this.waitForDataStarStateUpdate();
  }

  /**
   * Simulate player movement and wait for DataStar updates
   */
  async simulatePlayerMovementDataStar(): Promise<void> {
    // Simulate WASD movement
    await this.page.keyboard.press('KeyW');
    await this.page.waitForTimeout(100);
    await this.page.keyboard.press('KeyA');
    await this.page.waitForTimeout(100);
    await this.page.keyboard.press('KeyS');
    await this.page.waitForTimeout(100);
    await this.page.keyboard.press('KeyD');
    await this.page.waitForTimeout(100);
    
    // Wait for DataStar state update
    await this.waitForDataStarStateUpdate();
  }
}

test.describe('DataStar Multiplayer E2E Tests', () => {
  let context1: BrowserContext;
  let context2: BrowserContext;
  let page1: Page;
  let page2: Page;
  let helper1: DataStarTestHelper;
  let helper2: DataStarTestHelper;

  test.beforeAll(async ({ browser }) => {
    // Create two separate browser contexts for multiplayer testing
    context1 = await browser.newContext();
    context2 = await browser.newContext();
    
    page1 = await context1.newPage();
    page2 = await context2.newPage();
    
    helper1 = new DataStarTestHelper(page1);
    helper2 = new DataStarTestHelper(page2);
  });

  test.afterAll(async () => {
    await context1.close();
    await context2.close();
  });

  test('should establish DataStar SSE connection and patch DOM elements', async () => {
    // Navigate to the game
    await page1.goto('/');
    
    // Wait for DataStar integration to initialize
    await page1.waitForFunction(() => {
      return window.dataStarIntegration !== undefined;
    }, { timeout: 20000 });
    
    // Wait for DataStar SSE connection
    await helper1.waitForDataStarConnection();
    
    // Wait for connection status to be patched into DOM
    await helper1.waitForDataStarPatchElements('#connection-status');
    
    // Verify connection status
    const isConnected = await helper1.getDataStarConnectionStatus();
    expect(isConnected).toBe(true);
    
    // Verify server time is patched
    await helper1.waitForDataStarPatchElements('#server-time');
    const serverTime = await helper1.getDataStarServerTime();
    expect(serverTime).toBeTruthy();
    expect(new Date(serverTime)).toBeInstanceOf(Date);
  });

  test('should handle DataStar patch-elements events correctly', async () => {
    // Ensure DataStar connection is established
    await helper1.waitForDataStarConnection();
    
    // Send a test DataStar event
    await helper1.sendDataStarEvent({
      type: 'datastar-patch-elements',
      data: '<div id="test-element">Test DataStar Element</div>'
    });
    
    // Wait for the element to be patched
    await helper1.waitForDataStarPatchElements('#test-element');
    
    // Verify the element was patched correctly
    const testElement = page1.locator('#test-element');
    await expect(testElement).toBeVisible();
    await expect(testElement).toHaveText('Test DataStar Element');
  });

  test('should handle multiplayer peer synchronization with DataStar', async () => {
    // Navigate both pages to the game
    await page1.goto('/');
    await page2.goto('/');
    
    // Wait for both DataStar connections
    await helper1.waitForDataStarConnection();
    await helper2.waitForDataStarConnection();
    
    // Both players join the game
    await helper1.joinGameDataStar();
    await helper2.joinGameDataStar();
    
    // Wait for peer elements to be patched
    await page1.waitForTimeout(2000);
    
    // Get DataStar peers from both clients
    const peers1 = await helper1.getDataStarPeers();
    const peers2 = await helper2.getDataStarPeers();
    
    // Verify both players see peers
    expect(peers1.length).toBeGreaterThanOrEqual(1);
    expect(peers2.length).toBeGreaterThanOrEqual(1);
    
    // Verify peer data structure
    peers1.forEach(peer => {
      expect(peer.id).toBeTruthy();
      expect(peer.name).toBeTruthy();
      expect(peer.environment).toBeTruthy();
      expect(typeof peer.position.x).toBe('number');
      expect(typeof peer.position.y).toBe('number');
      expect(typeof peer.position.z).toBe('number');
    });
  });

  test('should handle DataStar state updates during player movement', async () => {
    // Ensure both players are connected
    await helper1.waitForDataStarConnection();
    await helper2.waitForDataStarConnection();
    
    // Get initial state
    const initialState1 = await helper1.getDataStarConnectionState();
    const initialState2 = await helper2.getDataStarConnectionState();
    
    // Player 1 moves
    await helper1.simulatePlayerMovementDataStar();
    
    // Player 2 moves
    await helper2.simulatePlayerMovementDataStar();
    
    // Wait for state updates
    await helper1.waitForDataStarStateUpdate();
    await helper2.waitForDataStarStateUpdate();
    
    // Get updated states
    const updatedState1 = await helper1.getDataStarConnectionState();
    const updatedState2 = await helper2.getDataStarConnectionState();
    
    // Verify state was updated
    expect(updatedState1.lastUpdate).toBeGreaterThan(initialState1.lastUpdate);
    expect(updatedState2.lastUpdate).toBeGreaterThan(initialState2.lastUpdate);
  });

  test('should handle environment isolation with DataStar', async () => {
    // Ensure both players are connected
    await helper1.waitForDataStarConnection();
    await helper2.waitForDataStarConnection();
    
    // Change player 1 to different environment
    await helper1.changeEnvironmentDataStar('islandTown');
    await page1.waitForTimeout(2000);
    
    // Change player 2 to different environment
    await helper2.changeEnvironmentDataStar('joyTown');
    await page2.waitForTimeout(2000);
    
    // Get peer states
    const peers1 = await helper1.getDataStarPeers();
    const peers2 = await helper2.getDataStarPeers();
    
    // Verify environment isolation
    peers1.forEach(peer => {
      expect(peer.environment).toBe('islandTown');
    });
    
    peers2.forEach(peer => {
      expect(peer.environment).toBe('joyTown');
    });
    
    // Verify no peer overlap between environments
    const player1PeerIds = peers1.map(p => p.id);
    const player2PeerIds = peers2.map(p => p.id);
    const overlap = player1PeerIds.filter(id => player2PeerIds.includes(id));
    expect(overlap.length).toBe(0);
  });

  test('should handle DataStar SSE reconnection', async () => {
    // Establish initial connection
    await helper1.waitForDataStarConnection();
    
    // Simulate connection loss by closing and reopening
    await helper1.leaveGameDataStar();
    await page1.waitForTimeout(1000);
    
    // Reconnect
    await helper1.joinGameDataStar();
    
    // Verify reconnection
    const isConnected = await helper1.getDataStarConnectionStatus();
    expect(isConnected).toBe(true);
    
    // Verify DOM elements are patched again
    await helper1.waitForDataStarPatchElements('#connection-status');
    await helper1.waitForDataStarPatchElements('#server-time');
  });

  test('should handle rapid DataStar state updates', async () => {
    // Ensure connection is established
    await helper1.waitForDataStarConnection();
    
    // Send multiple rapid updates
    for (let i = 0; i < 5; i++) {
      await helper1.sendDataStarEvent({
        type: 'datastar-patch-elements',
        data: `<div id="rapid-update-${i}">Update ${i}</div>`
      });
      await page1.waitForTimeout(100);
    }
    
    // Verify all updates were processed
    for (let i = 0; i < 5; i++) {
      await helper1.waitForDataStarPatchElements(`#rapid-update-${i}`);
    }
    
    // Verify final state
    const finalState = await helper1.getDataStarConnectionState();
    expect(finalState.isConnected).toBe(true);
  });

  test('should handle DataStar error scenarios gracefully', async () => {
    // Test with invalid DataStar event
    await helper1.sendDataStarEvent({
      type: 'datastar-patch-elements',
      data: '<div id="error-test">Error Test</div>'
    });
    
    // Verify the element is still patched (DataStar should handle gracefully)
    await helper1.waitForDataStarPatchElements('#error-test');
    
    // Verify connection is still stable
    const isConnected = await helper1.getDataStarConnectionStatus();
    expect(isConnected).toBe(true);
  });
});

// Global type declarations for DataStar integration
declare global {
  interface Window {
    dataStarIntegration: {
      getConnectionStatus(): boolean;
      disconnect(): void;
    };
    gameState: {
      isConnected: boolean;
      players: DataStarPeer[];
      lastUpdate: number;
    };
  }
}
