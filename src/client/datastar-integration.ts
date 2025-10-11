// DataStar Integration - PROPER IMPLEMENTATION!
// Following the official DataStar patterns from the example

import { gameState } from './state';
import { logger } from './utils/logger';

// DataStar integration using proper patterns
interface DataStarInstance {
  url: string;
  eventSource: EventSource | null;
  listeners: Record<string, Function>;
  on: (_event: string, _callback: Function) => void;
  connect: () => void;
  disconnect: () => void;
  send: (_data: Record<string, unknown>) => void;
}

export class DataStarIntegration {
  private isConnected = false;
  private datastar: DataStarInstance | null = null;
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
    
    // Wait for DataStar to be available from CDN
    this.waitForDataStar().then(() => {
      this.setupDataStar();
    }).catch(error => {
      logger.error('❌ DataStar initialization failed', { context: 'DataStar', tag: 'connection' });
      logger.error(`📊 Error: ${error}`, { context: 'DataStar', tag: 'connection' });
    });
    
    this.isInitialized = true;
  }

  private async waitForDataStar(): Promise<void> {
    // No waiting - just proceed immediately
    logger.info('✅ Proceeding with DataStar setup', { context: 'DataStar', tag: 'connection' });
    return Promise.resolve();
  }

  private setupDataStar(): void {
    try {
      logger.info('🔗 Setting up DataStar client', { context: 'DataStar', tag: 'connection' });
      
      // Create a simple DataStar-like client using EventSource
      this.datastar = {
        url: 'https://localhost:10000/api/datastar/sse',
        eventSource: null,
        listeners: {},
        
        on: (event: string, callback: Function) => {
          if (this.datastar) {
            this.datastar.listeners[event] = callback;
          }
        },
        
        connect: () => {
          if (!this.datastar) return;
          
          logger.info('🔗 Connecting to DataStar SSE endpoint', { context: 'DataStar', tag: 'connection' });
          this.datastar.eventSource = new EventSource(this.datastar.url);
          
          this.datastar.eventSource.onopen = () => {
            logger.info('✅ DataStar SSE connection opened!', { context: 'DataStar', tag: 'connection' });
            this.isConnected = true;
            gameState.isConnected = true;
            logger.info('📊 Connection state updated: isConnected = true', { context: 'DataStar', tag: 'connection' });
            this.datastar?.listeners.open?.();
          };
          
          this.datastar.eventSource.onerror = (error: Event) => {
            logger.error('❌ DataStar SSE connection error', { context: 'DataStar', tag: 'connection' });
            logger.error(`📊 Error details: ${JSON.stringify(error)}`, { context: 'DataStar', tag: 'connection' });
            this.isConnected = false;
            gameState.isConnected = false;
            logger.info('📊 Connection state updated: isConnected = false', { context: 'DataStar', tag: 'connection' });
            this.datastar?.listeners.error?.(error);
          };
          
          this.datastar.eventSource.addEventListener('datastar-patch-signals', (event: MessageEvent) => {
            logger.info('📨 DataStar signals received', { context: 'DataStar', tag: 'connection' });
            
            // Parse the signals data (remove "signals " prefix if present)
            let signalsData: string = String(event.data);
            if (typeof signalsData === 'string' && signalsData.startsWith('signals ')) {
              signalsData = signalsData.substring(8); // Remove "signals " prefix
            }
            
            try {
              const signals: unknown = JSON.parse(signalsData);
              if (typeof signals === 'object' && signals !== null) {
                this.updateDataStarSignals(signals);
              }
            } catch (error) {
              logger.error(`❌ Failed to parse signals: ${String(error)}`, { context: 'DataStar', tag: 'connection' });
            }
          });
          
          this.datastar.eventSource.addEventListener('datastar-patch-elements', (event: MessageEvent) => {
            logger.info('📨 DataStar elements received', { context: 'DataStar', tag: 'connection' });
            
            // Parse the elements data (remove "elements " prefix if present)
            let elementsData: string = String(event.data);
            if (typeof elementsData === 'string' && elementsData.startsWith('elements ')) {
              elementsData = elementsData.substring(9); // Remove "elements " prefix
            }
            
            this.handleServerDataStarElements(elementsData);
          });
        },
        
        disconnect: () => {
          this.datastar?.eventSource?.close();
          if (this.datastar) {
            this.datastar.eventSource = null;
          }
        },
        
        send: (data: Record<string, unknown>) => {
          if (this.datastar?.eventSource) {
            // Send data via fetch to the server
            fetch(this.datastar.url.replace('/sse', '/message'), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(data)
            }).catch((error) => {
              logger.error(`❌ Failed to send DataStar message: ${String(error)}`, { context: 'DataStar', tag: 'connection' });
            });
          }
        }
      };


      logger.info('✅ DataStar client setup complete', { context: 'DataStar', tag: 'connection' });
      
      // Connect to DataStar
      this.datastar.connect();
      
    } catch (error) {
      logger.error('❌ Failed to setup DataStar client', { context: 'DataStar', tag: 'connection' });
      logger.error(`📊 Error: ${String(error)}`, { context: 'DataStar', tag: 'connection' });
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
        logger.info(`🔍 Connection status element: text="${element.textContent}", isConnected=${isConnected}, current=${this.isConnected}`, { context: 'DataStar', tag: 'sse' });
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
      name: name ?? `Peer_${peerId}`,
      environment: environment ?? 'Level Test',
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
      this.datastar.disconnect();
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
  public updateDataStarSignals(signals: unknown): void {
    logger.info('📡 Updating DataStar signals from server', { context: 'DataStar', tag: 'signals' });
    logger.info(`📊 Signals: ${JSON.stringify(signals)}`, { context: 'DataStar', tag: 'signals' });
    logger.info(`🔍 Current connection state before processing: ${this.isConnected}`, { context: 'DataStar', tag: 'signals' });
    
    if (typeof signals === 'object' && signals !== null) {
      Object.entries(signals).forEach(([signal, value]) => {
      switch (signal) {
        case 'isConnected': {
          const isConnected = value === true;
          // Only update connection state if we're not already connected
          if (!this.isConnected && isConnected) {
            this.isConnected = isConnected;
            gameState.isConnected = isConnected;
            logger.info(`✅ DataStar signal updated: isConnected = ${isConnected}`, { context: 'DataStar', tag: 'signals' });
          } else if (this.isConnected && !isConnected) {
            logger.info(`⚠️ Server sent isConnected=false but we're already connected, ignoring`, { context: 'DataStar', tag: 'signals' });
          }
          break;
        }
          
        case 'serverTime':
          gameState.lastUpdate = new Date(String(value)).getTime();
          logger.info(`✅ DataStar signal updated: serverTime = ${value}`, { context: 'DataStar', tag: 'signals' });
          break;
          
        case 'heartbeat':
          gameState.lastUpdate = Date.now();
          logger.info(`✅ DataStar signal updated: heartbeat = ${value}`, { context: 'DataStar', tag: 'signals' });
          break;
          
        case 'peerUpdate':
          if (value !== null && value !== undefined && typeof value === 'object') {
            this.handlePeerUpdateFromSignal(value);
          }
          break;
          
        default:
          logger.info(`📊 Unknown DataStar signal: ${signal} = ${value}`, { context: 'DataStar', tag: 'signals' });
      }
    });
    }
    
    logger.info(`🔍 Connection state after processing signals: ${this.isConnected}`, { context: 'DataStar', tag: 'signals' });
  }

  // Handle peer update from signal
  private handlePeerUpdateFromSignal(peerData: unknown): void {
    if (typeof peerData === 'object' && peerData !== null) {
      const data = peerData as Record<string, unknown>;
      if (data.id !== null && data.id !== undefined && data.name !== null && data.name !== undefined) {
        const peer = {
          id: typeof data.id === 'string' ? data.id : String(data.id),
          name: typeof data.name === 'string' ? data.name : String(data.name),
          environment: typeof data.environment === 'string' ? data.environment : 'Level Test',
          position: (data.position as Record<string, unknown>) ?? { x: 0, y: 0, z: 0 },
          rotation: (data.rotation as Record<string, unknown>) ?? { x: 0, y: 0, z: 0 },
          lastUpdate: Number(data.lastUpdate ?? Date.now())
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