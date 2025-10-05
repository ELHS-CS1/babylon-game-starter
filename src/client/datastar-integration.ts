// DataStar Integration - PROPER IMPLEMENTATION!
// Following the official DataStar patterns from the example

import { gameState } from './state';
import { logger } from './utils/logger';

// DataStar integration using proper patterns
export class DataStarIntegration {
  private isConnected = false;
  private datastar: any = null;
  private isInitialized = false;

  constructor() {
    this.initializeDataStar();
  }

  private initializeDataStar(): void {
    if (this.isInitialized) {
      logger.info('📊 DataStar already initialized, skipping', { context: 'DataStar', tag: 'connection' });
      return;
    }

    logger.info('🚀 Initializing DataStar with proper patterns', { context: 'DataStar', tag: 'connection' });
    
    // Wait for DataStar to be available
    this.waitForDataStar().then(() => {
      this.setupDataStar();
    }).catch(error => {
      logger.error('❌ DataStar initialization failed', { context: 'DataStar', tag: 'connection' });
      logger.error(`📊 Error: ${error}`, { context: 'DataStar', tag: 'connection' });
    });
    
    this.isInitialized = true;
  }

  private async waitForDataStar(): Promise<void> {
    return new Promise((resolve) => {
      const checkDataStar = () => {
        if (typeof window !== 'undefined' && (window as any).dataStar) {
          logger.info('✅ DataStar client library found', { context: 'DataStar', tag: 'connection' });
          resolve();
        } else {
          logger.info('⏳ Waiting for DataStar client library...', { context: 'DataStar', tag: 'connection' });
          setTimeout(checkDataStar, 100);
        }
      };
      checkDataStar();
    });
  }

  private setupDataStar(): void {
    try {
      logger.info('🔗 Setting up DataStar client', { context: 'DataStar', tag: 'connection' });
      
      // Initialize DataStar client with SSE endpoint
      this.datastar = new (window as any).dataStar({
        url: 'https://localhost:10000/api/datastar/sse'
      });

      // Set up event listeners
      this.datastar.on('open', () => {
        logger.info('✅ DataStar connection opened!', { context: 'DataStar', tag: 'connection' });
        this.isConnected = true;
        gameState.isConnected = true;
        logger.info('📊 Connection state updated: isConnected = true', { context: 'DataStar', tag: 'connection' });
      });

      this.datastar.on('error', (error: any) => {
        logger.error('❌ DataStar connection error!', { context: 'DataStar', tag: 'connection' });
        logger.error(`📊 Error: ${JSON.stringify(error)}`, { context: 'DataStar', tag: 'connection' });
        this.isConnected = false;
        gameState.isConnected = false;
        logger.info('📊 Connection state updated: isConnected = false', { context: 'DataStar', tag: 'connection' });
      });

      // Listen for DataStar events
      this.datastar.on('datastar-patch-signals', (data: string) => {
        logger.info('📨 DataStar signals received!', { context: 'DataStar', tag: 'sse' });
        logger.info(`📊 Signals: ${data}`, { context: 'DataStar', tag: 'sse' });

        try {
          const signals = JSON.parse(data);
          this.updateDataStarSignals(signals);
        } catch (error) {
          logger.error('❌ Failed to parse DataStar signals', { context: 'DataStar', tag: 'sse' });
        }
      });

      this.datastar.on('datastar-patch-elements', (data: string) => {
        logger.info('📨 DataStar elements received!', { context: 'DataStar', tag: 'sse' });
        logger.info(`📊 Elements: ${data}`, { context: 'DataStar', tag: 'sse' });

        // Handle server elements
        this.handleServerDataStarElements(data);
      });

      // Listen for general messages
      this.datastar.on('message', (data: string) => {
        logger.info('📨 DataStar message received!', { context: 'DataStar', tag: 'sse' });
        logger.info(`📊 Message: ${data}`, { context: 'DataStar', tag: 'sse' });
      });

      logger.info('✅ DataStar client setup complete', { context: 'DataStar', tag: 'connection' });
      
    } catch (error) {
      logger.error('❌ Failed to setup DataStar client', { context: 'DataStar', tag: 'connection' });
      logger.error(`📊 Error: ${error}`, { context: 'DataStar', tag: 'connection' });
    }
  }

  // Handle server DataStar elements
  private handleServerDataStarElements(elementData: string): void {
    logger.info('📦 Handling server DataStar elements', { context: 'DataStar', tag: 'sse' });
    
    // Parse server element HTML and update our state
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = elementData;
    
    // Update game state based on server elements
    Array.from(tempDiv.children).forEach(element => {
      if (element.id === 'connection-status') {
        const isConnected = element.textContent === 'Connected';
        if (isConnected !== this.isConnected) {
          this.isConnected = isConnected;
          gameState.isConnected = isConnected;
          logger.info(`✅ DataStar connection status updated: ${isConnected}`, { context: 'DataStar', tag: 'sse' });
        }
      } else if (element.id === 'server-time') {
        gameState.lastUpdate = new Date(element.textContent || '').getTime();
        logger.info(`⏰ DataStar server time updated: ${element.textContent}`, { context: 'DataStar', tag: 'sse' });
      } else if (element.id?.startsWith('peer-')) {
        // Handle peer updates
        this.handlePeerUpdate(element);
      }
    });
  }

  // Handle peer updates from server
  private handlePeerUpdate(element: Element): void {
    const peerId = element.id.replace('peer-', '');
    const text = element.textContent || '';
    const [name, environment] = text.split(' - ');
    
    const peer = {
      id: peerId,
      name: name || `Peer_${peerId}`,
      environment: environment || 'Level Test',
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      lastUpdate: Date.now()
    };

    // Add or update peer in game state
    const existingIndex = gameState.players.findIndex(p => p.id === peerId);
    if (existingIndex >= 0) {
      gameState.players[existingIndex] = peer;
    } else {
      gameState.players.push(peer);
    }

    logger.info(`👥 DataStar peer updated: ${peer.name}`, { context: 'DataStar', tag: 'sse' });
  }

  public disconnect(): void {
    logger.info('🔌 Disconnecting DataStar connection', { context: 'DataStar', tag: 'connection' });
    
    if (this.datastar) {
      this.datastar.close();
      this.datastar = null;
    }
    
    this.isConnected = false;
    gameState.isConnected = false;
    logger.info('🔌 DataStar connection closed', { context: 'DataStar', tag: 'connection' });
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Update DataStar signals from server data
  public updateDataStarSignals(signals: Record<string, unknown>): void {
    logger.info('📡 Updating DataStar signals from server', { context: 'DataStar', tag: 'signals' });
    logger.info(`📊 Signals: ${JSON.stringify(signals)}`, { context: 'DataStar', tag: 'signals' });
    
    Object.entries(signals).forEach(([signal, value]) => {
      switch (signal) {
        case 'isConnected':
          const isConnected = value === true;
          this.isConnected = isConnected;
          gameState.isConnected = isConnected;
          logger.info(`✅ DataStar signal updated: isConnected = ${isConnected}`, { context: 'DataStar', tag: 'signals' });
          break;
          
        case 'serverTime':
          gameState.lastUpdate = new Date(value as string).getTime();
          logger.info(`✅ DataStar signal updated: serverTime = ${value}`, { context: 'DataStar', tag: 'signals' });
          break;
          
        case 'heartbeat':
          gameState.lastUpdate = Date.now();
          logger.info(`✅ DataStar signal updated: heartbeat = ${value}`, { context: 'DataStar', tag: 'signals' });
          break;
          
        case 'peerUpdate':
          if (value && typeof value === 'object') {
            this.handlePeerUpdateFromSignal(value);
          }
          break;
          
        default:
          logger.info(`📊 Unknown DataStar signal: ${signal} = ${value}`, { context: 'DataStar', tag: 'signals' });
      }
    });
  }

  // Handle peer update from signal
  private handlePeerUpdateFromSignal(peerData: any): void {
    if (peerData.id && peerData.name) {
      const peer = {
        id: peerData.id,
        name: peerData.name,
        environment: peerData.environment || 'Level Test',
        position: peerData.position || { x: 0, y: 0, z: 0 },
        rotation: peerData.rotation || { x: 0, y: 0, z: 0 },
        lastUpdate: peerData.lastUpdate || Date.now()
      };

      // Add or update peer in game state
      const existingIndex = gameState.players.findIndex(p => p.id === peer.id);
      if (existingIndex >= 0) {
        gameState.players[existingIndex] = peer;
      } else {
        gameState.players.push(peer);
      }

      logger.info(`👥 DataStar peer signal updated: ${peer.name}`, { context: 'DataStar', tag: 'signals' });
    }
  }

  // Send data to server
  public send(data: Record<string, unknown>): void {
    if (this.datastar) {
      logger.info('📤 Sending data to server via DataStar', { context: 'DataStar', tag: 'send' });
      logger.info(`📊 Data: ${JSON.stringify(data)}`, { context: 'DataStar', tag: 'send' });
      
      // Send via fetch to the server's send endpoint
      fetch('https://localhost:10000/api/datastar/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      }).catch(error => {
        logger.error('❌ Failed to send data to server', { context: 'DataStar', tag: 'send' });
        logger.error(`📊 Error: ${error}`, { context: 'DataStar', tag: 'send' });
      });
    } else {
      logger.error('❌ DataStar not connected, cannot send data', { context: 'DataStar', tag: 'send' });
    }
  }
}

// Export singleton instance
export const dataStarIntegration = new DataStarIntegration();

// Log that DataStar integration is available for Vue app
logger.info('🎯 DataStar integration singleton created and exported for Vue app', { context: 'DataStar', tag: 'connection' });
logger.info('📊 DataStar integration instance ready for use in components', { context: 'DataStar', tag: 'connection' });