// DataStar Integration - Pure SSE Implementation
// No external dependencies - just pure SSE

import { gameState } from './state';
import { logger } from './utils/logger';

export class DataStarIntegration {
  private isConnected = false;
  private eventSource: EventSource | null = null;
  private isInitialized = false;

  constructor() {
    logger.info('🚀 DataStarIntegration constructor called', { context: 'DataStar', tag: 'init' });
    this.initializeSSE();
  }

  private initializeSSE(): void {
    if (this.isInitialized) {
      logger.info('📊 SSE already initialized, skipping', { context: 'DataStar', tag: 'connection' });
      return;
    }

    try {
      logger.info('🚀 Initializing pure SSE connection...', { context: 'DataStar', tag: 'connection' });
      
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        logger.info('⏳ DOM still loading, waiting for DOMContentLoaded...', { context: 'DataStar', tag: 'connection' });
        document.addEventListener('DOMContentLoaded', () => this.createSSEConnection());
      } else {
        logger.info('✅ DOM ready, creating SSE connection immediately', { context: 'DataStar', tag: 'connection' });
        this.createSSEConnection();
      }
      
    } catch (error) {
      logger.error('❌ Failed to initialize SSE:', { context: 'DataStar', tag: 'connection', data: error });
    }
  }

  private createSSEConnection(): void {
    try {
      logger.info('🔗 Creating SSE connection to: https://localhost:10000/api/datastar/sse', { context: 'DataStar', tag: 'connection' });
      
      // Log DataStar DOM elements before connection
      this.logDataStarElements();
      
      // Create EventSource for SSE connection
      logger.info('🚀 Creating EventSource...', { context: 'DataStar', tag: 'connection' });
      this.eventSource = new EventSource('https://localhost:10000/api/datastar/sse');
      logger.info('✅ EventSource created successfully', { context: 'DataStar', tag: 'connection' });
      
      this.eventSource.onopen = () => {
        logger.info('✅ SSE connection established', { context: 'DataStar', tag: 'connection' });
        this.isConnected = true;
        gameState.isConnected = true;
        logger.info('🔄 Updated gameState.isConnected to true', { context: 'DataStar', tag: 'connection' });
        logger.info('🔍 Current gameState:', { context: 'DataStar', tag: 'connection', gameState });
      };
      
      this.eventSource.onerror = (error) => {
        logger.error('❌ SSE connection error:', { context: 'DataStar', tag: 'connection', data: error });
        logger.error('❌ EventSource readyState:', { context: 'DataStar', tag: 'connection', readyState: this.eventSource?.readyState });
        this.isConnected = false;
        gameState.isConnected = false;
      };
      
      this.setupEventHandlers();
      
      this.isInitialized = true;
      logger.info('✅ SSE initialized successfully', { context: 'DataStar', tag: 'connection' });
      
    } catch (error) {
      logger.error('❌ Failed to create SSE connection:', { context: 'DataStar', tag: 'connection', data: error });
    }
  }

  private handleSignals(signals: Record<string, unknown>): void {
    logger.info('📡 Handling signals:', { context: 'DataStar', tag: 'signals', data: signals });
    
    if (signals['isConnected'] !== undefined) {
      const wasConnected = gameState.isConnected;
      gameState.isConnected = Boolean(signals['isConnected']);
      logger.info(`🔄 Updated connection status: ${wasConnected} -> ${gameState.isConnected}`, { context: 'DataStar', tag: 'signals' });
    }
    
    if (signals['serverTime']) {
      gameState.serverTime = new Date(String(signals['serverTime'])).getTime();
      logger.info('🕐 Updated server time:', { context: 'DataStar', tag: 'signals', serverTime: gameState.serverTime });
    }
    
    if (signals['connections'] !== undefined) {
      const wasConnections = gameState.connections;
      gameState.connections = Number(signals['connections']);
      logger.info(`👥 Updated connections: ${wasConnections} -> ${gameState.connections}`, { context: 'DataStar', tag: 'signals' });
    }
  }

  private handleElements(elements: Record<string, unknown>): void {
    logger.info('📋 Processing DataStar elements:', { context: 'DataStar', tag: 'elements', data: elements });
    
    // Log all available elements
    Object.keys(elements).forEach(key => {
      logger.info(`📋 DataStar element [${key}]:`, { context: 'DataStar', tag: 'elements', key, value: elements[key] });
    });
    
    if (elements['peers']) {
      const peers = Array.isArray(elements['peers']) ? elements['peers'] : [];
      logger.info(`👥 Processing ${peers.length} peers from DataStar elements`, { context: 'DataStar', tag: 'elements' });
      
      gameState.players = peers.map(peer => ({
        id: String(peer['id'] || ''),
        name: String(peer['name'] || ''),
        position: peer['position'] || { x: 0, y: 0, z: 0 },
        rotation: peer['rotation'] || { x: 0, y: 0, z: 0 },
        health: Number(peer['health'] || 100),
        isAlive: Boolean(peer['isAlive'] ?? true),
        environment: String(peer['environment'] || 'Level Test'),
        lastUpdate: Number(peer['lastUpdate'] || Date.now())
      }));
      
      logger.info('👥 Updated gameState.players:', { context: 'DataStar', tag: 'elements', players: gameState.players });
    }
  }

  private handlePeerUpdate(peer: Record<string, unknown>): void {
    logger.info('👥 Received peer update:', { context: 'DataStar', tag: 'peer', data: peer });
    
    // Add or update the peer in the players list
      const peerData = {
        id: String(peer['id'] || ''),
        name: String(peer['name'] || ''),
        position: (peer['position'] as { x: number; y: number; z: number }) || { x: 0, y: 0, z: 0 },
        rotation: (peer['rotation'] as { x: number; y: number; z: number }) || { x: 0, y: 0, z: 0 },
        health: Number(peer['health'] || 100),
        isAlive: Boolean(peer['isAlive'] ?? true),
        environment: String(peer['environment'] || 'Level Test'),
        lastUpdate: Number(peer['lastUpdate'] || Date.now())
      };
    
    // Find existing peer or add new one
    const existingIndex = gameState.players.findIndex(p => p.id === peerData.id);
    if (existingIndex >= 0) {
      gameState.players[existingIndex] = peerData;
    } else {
      gameState.players.push(peerData);
    }
  }

  private handleMessage(messageData: Record<string, unknown>): void {
    logger.info('💬 Received message:', { context: 'DataStar', tag: 'message', data: messageData });
    
    if (messageData['type'] === 'join') {
      const playerName = String(messageData['playerName'] || '');
      logger.info(`🎮 Player joined: ${playerName}`, { context: 'DataStar', tag: 'join' });
      // The server will send a peerUpdate after this, so we don't need to do anything here
    }
  }

  public connect(): void {
    if (this.eventSource) {
      logger.info('🔗 SSE already connected', { context: 'DataStar', tag: 'connection' });
    } else {
      this.initializeSSE();
    }
  }

  public disconnect(): void {
    if (this.eventSource) {
      logger.info('🔌 Disconnecting SSE...', { context: 'DataStar', tag: 'connection' });
      this.eventSource.close();
      this.eventSource = null;
      this.isConnected = false;
      gameState.isConnected = false;
    }
  }

  public isDataStarConnected(): boolean {
    return this.isConnected;
  }


  // Send data to server
  public send(data: Record<string, unknown>): void {
    logger.info('📤 Sending data via fetch:', { context: 'DataStar', tag: 'send', data });
    
    // Send via fetch to the server's send endpoint
    fetch('https://localhost:10000/api/datastar/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }).catch(error => {
      logger.error('❌ Failed to send data:', { context: 'DataStar', tag: 'send', data: error });
    });
  }

  // Join game functionality
  public joinGame(playerName: string): void {
    logger.info('🎮 Joining game via SSE...', { context: 'DataStar', tag: 'join' });
    
    // Check if SSE connection is established
    if (!this.eventSource || this.eventSource.readyState !== EventSource.OPEN) {
      logger.warn('⚠️ SSE connection not ready, attempting to reconnect...', { context: 'DataStar', tag: 'join' });
      this.initializeSSE();
      return;
    }
    
    logger.info(`🔍 SSE connection state: ${this.eventSource.readyState}`, { context: 'DataStar', tag: 'join' });
    logger.info(`🔍 Game state connection: ${gameState.isConnected}`, { context: 'DataStar', tag: 'join' });
    
    this.send({
      type: 'join',
      playerName: playerName,
      timestamp: Date.now()
    });
  }

  // Leave game functionality
  public leaveGame(): void {
    logger.info('🚪 Leaving game via SSE...', { context: 'DataStar', tag: 'leave' });
    
    this.send({
      type: 'leave',
      timestamp: Date.now()
    });
  }

  // Send player position updates
  public updatePosition(x: number, y: number, z: number): void {
    this.send({
      type: 'position',
      position: { x, y, z },
      timestamp: Date.now()
    });
  }

  // Send player action
  public sendAction(action: string, data?: Record<string, unknown>): void {
    this.send({
      type: 'action',
      action: action,
      data: data || {},
      timestamp: Date.now()
    });
  }

  // Debug connection status
  public getConnectionStatus(): { isConnected: boolean; readyState: number; gameStateConnected: boolean } {
    return {
      isConnected: this.isConnected,
      readyState: this.eventSource?.readyState || -1,
      gameStateConnected: gameState.isConnected
    };
  }

  // Manual connection test
  public testConnection(): void {
    logger.info('🧪 Testing SSE connection...', { context: 'DataStar', tag: 'test' });
    logger.info('🔍 Current status:', { context: 'DataStar', tag: 'test', status: this.getConnectionStatus() });
    
    if (!this.eventSource) {
      logger.warn('⚠️ No EventSource, attempting to create connection...', { context: 'DataStar', tag: 'test' });
      this.createSSEConnection();
    } else {
      logger.info('🔍 EventSource exists, readyState:', { context: 'DataStar', tag: 'test', readyState: this.eventSource.readyState });
    }
  }

  // Setup EventSource event handlers
  private setupEventHandlers(): void {
    if (!this.eventSource) return;
    
    this.eventSource.onopen = () => {
      logger.info('✅ SSE connection established', { context: 'DataStar', tag: 'connection' });
      this.isConnected = true;
      gameState.isConnected = true;
      logger.info('🔄 Updated gameState.isConnected to true', { context: 'DataStar', tag: 'connection' });
      logger.info('🔍 Current gameState:', { context: 'DataStar', tag: 'connection', gameState });
    };
    
    this.eventSource.onerror = (error) => {
      logger.error('❌ SSE connection error:', { context: 'DataStar', tag: 'connection', data: error });
      logger.error('❌ EventSource readyState:', { context: 'DataStar', tag: 'connection', readyState: this.eventSource?.readyState });
      this.isConnected = false;
      gameState.isConnected = false;
    };
    
    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        logger.info('📡 Received SSE data:', { context: 'DataStar', tag: 'data', data });

        // Handle different message types from the server
        if (data.type === 'signals') {
          logger.info('🔍 Processing signals message', { context: 'DataStar', tag: 'message' });
          this.handleSignals(data.payload);
        } else if (data.type === 'elements') {
          logger.info('🔍 Processing elements message', { context: 'DataStar', tag: 'message' });
          this.handleElements(data.payload);
        } else if (data.type === 'peerUpdate') {
          logger.info('🔍 Processing peerUpdate message', { context: 'DataStar', tag: 'message' });
          this.handlePeerUpdate(data.peer);
        } else if (data.type === 'message') {
          logger.info('🔍 Processing message', { context: 'DataStar', tag: 'message' });
          this.handleMessage(data.data);
        } else if (data.isConnected !== undefined) {
          logger.info('🔍 Processing direct signals message', { context: 'DataStar', tag: 'message' });
          // Handle direct signal messages
          this.handleSignals(data);
        } else {
          logger.warn('⚠️ Unknown message type:', { context: 'DataStar', tag: 'message', type: data.type });
        }
      } catch (error) {
        logger.error('❌ Failed to parse SSE data:', { context: 'DataStar', tag: 'parse', data: error });
      }
    };
  }

  // Log DataStar DOM elements
  private logDataStarElements(): void {
    logger.info('🔍 Scanning for DataStar DOM elements...', { context: 'DataStar', tag: 'elements' });
    
    // Look for DataStar elements in the DOM
    const dataStarElements = document.querySelectorAll('[data-star], [data-datastar], [data-star-*]');
    logger.info(`📋 Found ${dataStarElements.length} DataStar DOM elements`, { context: 'DataStar', tag: 'elements' });
    
    dataStarElements.forEach((element, index) => {
      const attributes = Array.from(element.attributes).map(attr => `${attr.name}="${attr.value}"`).join(' ');
      logger.info(`📋 DataStar element ${index + 1}:`, { 
        context: 'DataStar', 
        tag: 'elements', 
        tagName: element.tagName,
        attributes,
        textContent: element.textContent?.substring(0, 100) + (element.textContent && element.textContent.length > 100 ? '...' : '')
      });
    });
    
    // Also check for any elements with DataStar-related classes or IDs
    const dataStarClasses = document.querySelectorAll('.data-star, .datastar, [class*="data-star"], [class*="datastar"]');
    logger.info(`📋 Found ${dataStarClasses.length} elements with DataStar classes`, { context: 'DataStar', tag: 'elements' });
    
    dataStarClasses.forEach((element, index) => {
      logger.info(`📋 DataStar class element ${index + 1}:`, { 
        context: 'DataStar', 
        tag: 'elements', 
        tagName: element.tagName,
        className: element.className,
        id: element.id
      });
    });
  }
}

// Export singleton instance
export const dataStarIntegration = new DataStarIntegration();