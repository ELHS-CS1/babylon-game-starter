// DataStar Integration - Following official DataStar patterns
// Based on: https://data-star.dev/guide/getting_started

import { gameState } from './state';
import { logger } from './utils/logger';

// DataStar SSE connection handler
export class DataStarIntegration {
  private eventSource: EventSource | null = null;
  private isConnected = false;

  constructor() {
    this.initializeDataStar();
  }

  private initializeDataStar() {
    logger.info('🚀 Initializing DataStar integration', { context: 'DataStar', tag: 'connection' });
    
    // Create DataStar SSE connection
    this.eventSource = new EventSource('http://localhost:10000/api/datastar/sse');
    
    // DataStar SSE event handlers
    this.eventSource.onopen = () => {
      logger.info('🔗 DataStar SSE connection opened', { context: 'DataStar', tag: 'connection' });
      this.isConnected = true;
    };

    this.eventSource.onerror = (error) => {
      logger.error('❌ DataStar SSE connection error', { context: 'DataStar', tag: 'connection' });
      this.isConnected = false;
    };

    // Handle DataStar patch-elements events
    this.eventSource.addEventListener('datastar-patch-elements', (event) => {
      this.handleDataStarPatchElements(event);
    });

    // Handle generic SSE messages (fallback)
    this.eventSource.onmessage = (event) => {
      this.handleDataStarMessage(event);
    };
  }

  private handleDataStarPatchElements(event: MessageEvent) {
    logger.info('📨 DataStar patch-elements event received', { context: 'DataStar', tag: 'sse' });
    
    // DataStar automatically patches elements into DOM
    // We just need to update our state based on the patched elements
    this.updateStateFromPatchedElements();
    
    // Force reactivity update
    this.forceStateUpdate();
  }

  private handleDataStarMessage(event: MessageEvent) {
    const data = event.data;
    logger.info(`📨 DataStar SSE message: ${data}`, { context: 'DataStar', tag: 'sse' });
    
    // Handle any additional DataStar messages
    try {
      const parsed = JSON.parse(data);
      if (parsed.type === 'connected') {
        gameState.isConnected = true;
        logger.info('✅ DataStar backend confirmed connection', { context: 'DataStar', tag: 'sse' });
      }
    } catch (error) {
      // Not JSON, might be HTML elements
      logger.info('📨 DataStar sent HTML elements', { context: 'DataStar', tag: 'sse' });
    }
  }

  private updateStateFromPatchedElements() {
    // Check for patched elements in DOM and update state accordingly
    const connectionStatus = document.getElementById('connection-status');
    if (connectionStatus) {
      gameState.isConnected = connectionStatus.textContent === 'Connected';
      logger.info(`✅ DataStar patched connection status: ${gameState.isConnected}`, { context: 'DataStar', tag: 'sse' });
    }

    const serverTime = document.getElementById('server-time');
    if (serverTime) {
      gameState.lastUpdate = new Date(serverTime.textContent || '').getTime();
      logger.info(`⏰ DataStar patched server time: ${serverTime.textContent}`, { context: 'DataStar', tag: 'sse' });
    }

    // Check for peer elements
    const peerElements = document.querySelectorAll('[id^="peer-"]');
    gameState.players = Array.from(peerElements).map(element => {
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

    logger.info(`👥 DataStar patched ${gameState.players.length} peers`, { context: 'DataStar', tag: 'sse' });
  }

  private forceStateUpdate() {
    // Force reactivity update by triggering a state change
    gameState.lastUpdate = Date.now();
    logger.info('🔄 DataStar state update triggered', { context: 'DataStar', tag: 'sse' });
  }

  public disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.isConnected = false;
      logger.info('🔌 DataStar SSE connection closed', { context: 'DataStar', tag: 'connection' });
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

// Export singleton instance
export const dataStarIntegration = new DataStarIntegration();
