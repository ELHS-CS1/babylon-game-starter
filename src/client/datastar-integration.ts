// DataStar Integration - USING EVENTSOURCE FOR CLIENT-SIDE SSE!
// The DataStar SDK is for server-side SSE generation, not client-side consumption

import { gameState } from './state';
import { logger } from './utils/logger';

// DataStar integration using the official TypeScript SDK
export class DataStarIntegration {
  private isConnected = false;
  private eventSource: EventSource | null = null;

  constructor() {
    this.initializeDataStar();
  }

  private initializeDataStar(): void {
    logger.info('🚀 Initializing DataStar with TypeScript SDK', { context: 'DataStar', tag: 'connection' });
    
    // Connect to DataStar SSE endpoint
    this.connectToDataStar().catch(error => {
      logger.error('❌ DataStar connection failed', { context: 'DataStar', tag: 'connection' });
      logger.error(`📊 Error: ${error}`, { context: 'DataStar', tag: 'connection' });
    });
    
    // Set up DOM watcher
    this.setupDOMWatcher();
    
    // DataStar setup complete - ready for Vue app
    logger.info('✅ DataStar integration fully initialized and ready for Vue app', { context: 'DataStar', tag: 'connection' });
    logger.info('📊 DataStar integration provides: SSE connection, DOM patching, state management', { context: 'DataStar', tag: 'connection' });
  }

  private async connectToDataStar(): Promise<void> {
    logger.info('🔗 Connecting to DataStar SSE endpoint', { context: 'DataStar', tag: 'connection' });
    
    // Test server health first with async/await
    try {
      logger.info('🔍 Performing async server health check...', { context: 'DataStar', tag: 'connection' });
      const response = await fetch('http://localhost:10000/api/health');
      const data = await response.json();
      logger.info(`📊 Server health check: ${JSON.stringify(data)}`, { context: 'DataStar', tag: 'connection' });
      logger.info('✅ Server health check completed successfully', { context: 'DataStar', tag: 'connection' });
    } catch (error) {
      logger.error('❌ Server health check failed', { context: 'DataStar', tag: 'connection' });
      this.isConnected = false;
      gameState.isConnected = false;
      return;
    }
    
    // USE EVENTSOURCE FOR CLIENT-SIDE DATASTAR SSE CONSUMPTION!
    logger.info('🔗 Using EventSource for DataStar SSE consumption...', { context: 'DataStar', tag: 'connection' });
    
    try {
      logger.info('🔗 Creating EventSource for DataStar SSE...', { context: 'DataStar', tag: 'connection' });
      this.eventSource = new EventSource('http://localhost:10000/api/datastar/sse');
      logger.info('✅ EventSource created successfully', { context: 'DataStar', tag: 'connection' });
      
      // Check EventSource state immediately
      logger.info(`📊 EventSource readyState immediately after creation: ${this.eventSource.readyState}`, { context: 'DataStar', tag: 'connection' });
      
      this.eventSource.onopen = () => {
        logger.info('🔗 DataStar SSE connection opened - EVENT DRIVEN!', { context: 'DataStar', tag: 'connection' });
        this.isConnected = true;
        gameState.isConnected = true;
        logger.info('✅ DataStar connection established via onopen event', { context: 'DataStar', tag: 'connection' });
        logger.info('📊 Connection state updated: isConnected = true', { context: 'DataStar', tag: 'connection' });
      };

      this.eventSource.onerror = (error: Event) => {
        logger.error('❌ DataStar SSE connection error - EVENT DRIVEN!', { context: 'DataStar', tag: 'connection' });
        logger.error(`📊 Error details: ${JSON.stringify(error)}`, { context: 'DataStar', tag: 'connection' });
        logger.error(`📊 EventSource readyState: ${this.eventSource?.readyState}`, { context: 'DataStar', tag: 'connection' });
        this.isConnected = false;
        gameState.isConnected = false;
        logger.info('📊 Connection state updated: isConnected = false', { context: 'DataStar', tag: 'connection' });
      };
      
      // Handle DataStar patch-elements events
      this.eventSource.addEventListener('datastar-patch-elements', (event: MessageEvent) => {
        this.handleDataStarPatchElements(event);
      });

      // Handle DataStar patch-signals events
      this.eventSource.addEventListener('datastar-patch-signals', (event: MessageEvent) => {
        this.handleDataStarPatchSignals(event);
      });
      
    } catch (error) {
      logger.error('❌ Failed to create EventSource', { context: 'DataStar', tag: 'connection' });
      logger.error(`📊 Error: ${error}`, { context: 'DataStar', tag: 'connection' });
      this.isConnected = false;
      gameState.isConnected = false;
    }
  }

  private handleDataStarPatchElements(_event: MessageEvent): void {
    logger.info('📨 DataStar patch-elements event received', { context: 'DataStar', tag: 'sse' });
    
    // DataStar automatically patches elements into DOM
    // We just need to update our state based on the patched elements
    this.updateStateFromPatchedElements();
    
    // Force reactivity update
    this.forceStateUpdate();
  }

  private handleDataStarPatchSignals(event: MessageEvent): void {
    logger.info('📨 DataStar patch-signals event received', { context: 'DataStar', tag: 'sse' });
    
    try {
      const signals = JSON.parse(event.data);
      logger.info(`📊 DataStar signals: ${JSON.stringify(signals)}`, { context: 'DataStar', tag: 'sse' });
      
      // Update game state based on signals
      if (signals.isConnected !== undefined) {
        this.isConnected = signals.isConnected;
        gameState.isConnected = signals.isConnected;
        logger.info(`✅ DataStar connection status updated: ${signals.isConnected}`, { context: 'DataStar', tag: 'sse' });
      }
    } catch (error) {
      logger.error('❌ Failed to parse DataStar signals', { context: 'DataStar', tag: 'sse' });
    }
  }

  private updateStateFromPatchedElements(): void {
    // Check for patched elements in DOM and update state accordingly
    const connectionStatus = document.getElementById('connection-status');
    if (connectionStatus) {
      const isConnected = connectionStatus.textContent === 'Connected';
      if (isConnected !== this.isConnected) {
        this.isConnected = isConnected;
        gameState.isConnected = isConnected;
        logger.info(`✅ DataStar patched connection status: ${isConnected}`, { context: 'DataStar', tag: 'sse' });
      }
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

  private forceStateUpdate(): void {
    gameState.lastUpdate = Date.now();
    logger.info('🔄 DataStar state update triggered', { context: 'DataStar', tag: 'sse' });
  }

  private setupDOMWatcher(): void {
    logger.info('📡 Setting up DOM watcher for DataStar changes', { context: 'DataStar', tag: 'connection' });
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'attributes') {
          this.handleDataStarChanges();
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true
    });
  }

  private handleDataStarChanges(): void {
    // Check for DataStar patched elements
    const connectionStatus = document.getElementById('connection-status');
    if (connectionStatus) {
      const isConnected = connectionStatus.textContent === 'Connected';
      if (isConnected !== this.isConnected) {
        this.isConnected = isConnected;
        gameState.isConnected = isConnected;
        logger.info(`✅ DataStar connection status updated: ${isConnected}`, { context: 'DataStar', tag: 'connection' });
      }
    }
  }

  public disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    this.isConnected = false;
    gameState.isConnected = false;
    logger.info('🔌 DataStar connection closed', { context: 'DataStar', tag: 'connection' });
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

// Export singleton instance
export const dataStarIntegration = new DataStarIntegration();

// Log that DataStar integration is available for Vue app
logger.info('🎯 DataStar integration singleton created and exported for Vue app', { context: 'DataStar', tag: 'connection' });
logger.info('📊 DataStar integration instance ready for use in components', { context: 'DataStar', tag: 'connection' });
