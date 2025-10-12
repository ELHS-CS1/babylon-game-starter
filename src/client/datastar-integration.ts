// DataStar Integration - Pure SSE Implementation
// No external dependencies - just pure SSE

import { gameState } from './state';
import { logger } from './utils/logger';

export class DataStarIntegration {
  private isConnected = false;
  private eventSource: EventSource | null = null;
  private isInitialized = false;

  private getServerUrl(): string {
    if (typeof window === 'undefined') {
      return 'http://localhost:10000';
    }
    
    const { protocol, hostname } = window.location;
    
    // For production (Render.com), use the current host
    if (hostname.includes('onrender.com')) {
      return `${protocol}//${hostname}`;
    }
    
    // For local development, use localhost:10000 with HTTPS
    return 'https://localhost:10000';
  }

  constructor() {
    logger.info('🚀 DataStarIntegration constructor called', { context: 'init' });
    this.initializeSSE();
  }

  private initializeSSE(): void {
    if (this.isInitialized) {
      logger.info('📊 SSE already initialized, skipping', { context: 'connection' });
      return;
    }

    try {
      logger.info('🚀 Initializing pure SSE connection...', { context: 'connection' });
      
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        logger.info('⏳ DOM still loading, waiting for DOMContentLoaded...', { context: 'connection' });
        document.addEventListener('DOMContentLoaded', () => { this.createSSEConnection(); });
      } else {
        logger.info('✅ DOM ready, creating SSE connection immediately', { context: 'connection' });
        this.createSSEConnection();
      }
      
    } catch (error) {
      logger.error('❌ Failed to initialize SSE:', { context: 'connection', data: error });
    }
  }

  private createSSEConnection(): void {
    try {
      logger.info('🔗 Creating DataStar SSE connection...', { context: 'connection' });
      
      // Log DataStar DOM elements before connection
      this.logDataStarElements();
      
      // Check if DataStar is available globally
      if (typeof window !== 'undefined' && (window as any).DataStar) {
        logger.info('🚀 DataStar client found, using DataStar API...', { context: 'connection' });
        this.initializeDataStarClient();
      } else {
        logger.warn('⚠️ DataStar client not found, falling back to EventSource...', { context: 'connection' });
        this.initializeEventSource();
      }
      
    } catch (error) {
      logger.error('❌ Failed to create SSE connection:', { context: 'connection', data: error });
    }
  }

  private initializeDataStarClient(): void {
    try {
      logger.info('🚀 Initializing DataStar client...', { context: 'connection' });
      
      // Use DataStar's proper client API
      const dataStar = (window as any).DataStar;
      
        // Get server URL from current location
        const serverUrl = this.getServerUrl();
        
        // Initialize DataStar client with proper configuration
        dataStar.createClient({
          url: `${serverUrl}/api/datastar/sse`,
        onConnect: () => {
          logger.info('✅ DataStar client connected', { context: 'connection' });
            this.isConnected = true;
            gameState.isConnected = true;
        },
        onDisconnect: () => {
          logger.warn('⚠️ DataStar client disconnected', { context: 'connection' });
          this.isConnected = false;
          gameState.isConnected = false;
        },
        onError: (error: any) => {
          logger.error('❌ DataStar client error:', { context: 'connection', data: error });
            this.isConnected = false;
            gameState.isConnected = false;
        },
        onMessage: (data: any) => {
          this.handleDataStarMessage(data);
        }
      });
      
      logger.info('✅ DataStar client initialized successfully', { context: 'connection' });
      
    } catch (error) {
      logger.error('❌ Failed to initialize DataStar client:', { context: 'connection', data: error });
      // Fallback to EventSource
      this.initializeEventSource();
    }
  }

  private initializeEventSource(): void {
    try {
      logger.info('🚀 Creating EventSource...', { context: 'connection' });
      const serverUrl = this.getServerUrl();
      this.eventSource = new EventSource(`${serverUrl}/api/datastar/sse`);
      logger.info('✅ EventSource created successfully', { context: 'connection' });
      
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
        environment: String(peer['environment'] || 'Level Test'),
        character: String(peer['character'] || 'Red'),
        boostActive: Boolean(peer['boostActive'] ?? false),
        state: String(peer['state'] || 'idle'),
        lastUpdate: Number(peer['lastUpdate'] || Date.now())
      }));
      
      logger.info('👥 Updated gameState.players:', { context: 'DataStar', tag: 'elements', players: gameState.players });
    }
  }

  private handlePeerUpdate(peer: Record<string, unknown>): void {
    logger.info('👥 Received peer update:', { context: 'DataStar', tag: 'peer', data: peer });
    logger.info('👥 Current gameState.players before update:', { context: 'DataStar', tag: 'peer', count: gameState.players.length });
    
    // Add or update the peer in the players list
      const peerData = {
        id: String(peer['id'] || ''),
        name: String(peer['name'] || ''),
        position: (peer['position'] as { x: number; y: number; z: number }) || { x: 0, y: 0, z: 0 },
        rotation: (peer['rotation'] as { x: number; y: number; z: number }) || { x: 0, y: 0, z: 0 },
        environment: String(peer['environment'] || 'Level Test'),
        character: String(peer['character'] || 'Red'),
        boostActive: Boolean(peer['boostActive'] ?? false),
        state: String(peer['state'] || 'idle'),
        lastUpdate: Number(peer['lastUpdate'] || Date.now())
      };
    
    // Find existing peer or add new one
    const existingIndex = gameState.players.findIndex(p => p.id === peerData.id);
    if (existingIndex >= 0) {
      gameState.players[existingIndex] = peerData;
      logger.info('👥 Updated existing peer:', { context: 'DataStar', tag: 'peer', peerId: peerData.id });
    } else {
      gameState.players.push(peerData);
      logger.info('👥 Added new peer:', { context: 'DataStar', tag: 'peer', peerId: peerData.id });
    }
    
    logger.info('👥 Current gameState.players after update:', { context: 'DataStar', tag: 'peer', count: gameState.players.length });
  }

  private handleMessage(messageData: Record<string, unknown>): void {
    logger.info('💬 Received message:', { context: 'DataStar', tag: 'message', data: messageData });
    
    if (messageData['type'] === 'join') {
      const playerName = String(messageData['playerName'] || '');
      logger.info(`🎮 Player joined: ${playerName}`, { context: 'DataStar', tag: 'join' });
      // The server will send a peerUpdate after this, so we don't need to do anything here
    }
  }

  private handleJoinResponse(data: any): void {
    logger.info('🎮 Handling join response:', { context: 'DataStar', tag: 'join', data });
    
    if (data.success && data.player) {
      logger.info('✅ Successfully joined game!', { context: 'DataStar', tag: 'join' });
      logger.info('👤 Player info:', { context: 'DataStar', tag: 'join', player: data.player });
      logger.info('🎯 Game state:', { context: 'DataStar', tag: 'join', gameState: data.gameState });
      
      // Add existing peers to game state
      if (data.existingPeers && Array.isArray(data.existingPeers)) {
        logger.info(`👥 Received ${data.existingPeers.length} existing peers`, { context: 'DataStar', tag: 'join' });
        
        gameState.players = data.existingPeers.map((peer: any) => ({
          id: String(peer.id || ''),
          name: String(peer.name || ''),
          position: peer.position || { x: 0, y: 0, z: 0 },
          rotation: peer.rotation || { x: 0, y: 0, z: 0 },
          environment: String(peer.environment || 'Level Test'),
          character: String(peer.character || 'Red'),
          boostActive: Boolean(peer.boostActive ?? false),
          state: String(peer.state || 'idle'),
          lastUpdate: Number(peer.lastUpdate || Date.now())
        }));
        
        logger.info(`✅ Added ${gameState.players.length} existing peers to game state`, { context: 'DataStar', tag: 'join' });
      }
      
      // Update the game state with the new player info
      if (data.gameState) {
        // The game state will be updated via the peerUpdate message
        logger.info('🔄 Game state will be updated via peerUpdate', { context: 'DataStar', tag: 'join' });
      }
    } else {
      logger.error('❌ Failed to join game:', { context: 'DataStar', tag: 'join', data });
    }
  }

  private handlePeersResponse(data: any): void {
    logger.info('👥 Handling peers response:', { context: 'DataStar', tag: 'peers', data });
    
    if (data.peers && Array.isArray(data.peers)) {
      logger.info(`📋 Received ${data.peers.length} peers for environment ${data.environment}`, { context: 'DataStar', tag: 'peers' });
      
      // Log the discovered peers
      data.peers.forEach((peer: any) => {
        logger.info(`👤 Found peer: ${peer.name} (${peer.id}) in ${peer.environment}`, { context: 'DataStar', tag: 'peers' });
      });
      
      // Update game state with the discovered peers
      gameState.players = data.peers.map((peer: any) => ({
        id: String(peer.id || ''),
        name: String(peer.name || ''),
        position: peer.position || { x: 0, y: 0, z: 0 },
        rotation: peer.rotation || { x: 0, y: 0, z: 0 },
        environment: String(peer.environment || 'Level Test'),
        character: String(peer.character || 'Red'),
        boostActive: Boolean(peer.boostActive ?? false),
        state: String(peer.state || 'idle'),
        lastUpdate: Number(peer.lastUpdate || Date.now())
      }));
      
      logger.info(`✅ Updated gameState.players with ${gameState.players.length} peers`, { context: 'DataStar', tag: 'peers' });
    } else {
      logger.warn('⚠️ Invalid peers response format:', { context: 'DataStar', tag: 'peers', data });
    }
  }

  private handleEnvironmentChange(data: any): void {
    logger.info('🌍 Handling environment change:', { context: 'DataStar', tag: 'environment', data });
    
    if (data.environment) {
      // Update the current environment in game state
      gameState.environment = String(data.environment);
      gameState.lastUpdate = Date.now();
      
      logger.info('🌍 Environment updated in gameState:', { context: 'DataStar', tag: 'environment', environment: gameState.environment });
      
      // Clear peers from old environment and request new ones for this environment
      const oldEnvironment = gameState.players.find(p => p.environment !== data.environment)?.environment;
      if (oldEnvironment) {
        logger.info(`🧹 Clearing peers from old environment: ${oldEnvironment}`, { context: 'DataStar', tag: 'environment' });
        
        // Clear peer character meshes from old environment
        // Access GameEngine instance to clear all peer characters
        if (typeof window !== 'undefined' && (window as any).gameEngine) {
          const gameEngine = (window as any).gameEngine;
          if (gameEngine?.clearAllPeers) {
            gameEngine.clearAllPeers();
            logger.info('🧹 Cleared all peer character meshes from old environment', { context: 'DataStar', tag: 'environment' });
          } else {
            logger.warn('⚠️ GameEngine or clearAllPeers method not available for peer cleanup', { context: 'DataStar', tag: 'environment' });
          }
        } else {
          logger.warn('⚠️ Window or GameEngine not available for peer cleanup', { context: 'DataStar', tag: 'environment' });
        }
        
        gameState.players = gameState.players.filter(p => p.environment === data.environment);
      }
      
      this.requestPeersForEnvironment(data.environment);
      
      // Log the game state update
      if (data.gameState) {
        logger.info('🌍 Game state from server:', { context: 'DataStar', tag: 'environment', gameState: data.gameState });
      }
    }
  }

  private requestPeersForEnvironment(environment: string): void {
    logger.info(`📋 Requesting peers for environment: ${environment}`, { context: 'DataStar', tag: 'peers' });
    
    this.send({
      type: 'requestPeers',
      environment: environment,
      timestamp: Date.now()
    });
  }

  private handlePositionUpdate(data: any): void {
    logger.info('📍 Handling position update:', { context: 'DataStar', tag: 'position', data });
    
    if (data.peerId && data.position && data.rotation) {
      // Update the peer's position in gameState
      const peerIndex = gameState.players.findIndex(p => p.id === data.peerId);
      if (peerIndex >= 0 && gameState.players[peerIndex]) {
        gameState.players[peerIndex].position = data.position;
        gameState.players[peerIndex].rotation = data.rotation;
        gameState.players[peerIndex].lastUpdate = data.timestamp || Date.now();
        
        // Process boost state and character state
        if (typeof data.boostActive === 'boolean') {
          gameState.players[peerIndex].boostActive = data.boostActive;
          logger.info(`📍 Updated peer ${data.peerId} boost state:`, { context: 'DataStar', tag: 'position', boostActive: data.boostActive });
        }
        
        if (typeof data.state === 'string') {
          gameState.players[peerIndex].state = data.state;
          logger.info(`📍 Updated peer ${data.peerId} character state:`, { context: 'DataStar', tag: 'position', state: data.state });
        }
        
        logger.info(`📍 Updated peer ${data.peerId} position:`, { context: 'DataStar', tag: 'position', position: data.position });
      }
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
    logger.info('📤 ===== SENDING DATA =====', { context: 'send' });
    logger.info('📤 Sending data via fetch:', { context: 'send', data });
    const serverUrl = this.getServerUrl();
    logger.info(`📤 URL: ${serverUrl}/api/datastar/send`, { context: 'send' });
    logger.info('📤 Method: POST', { context: 'send' });
    logger.info('📤 Headers: Content-Type: application/json', { context: 'send' });
    
    // Send via fetch to the server's send endpoint
    fetch(`${serverUrl}/api/datastar/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    .then(response => {
      logger.info('📤 Fetch response received:', { context: 'send', status: response.status, ok: response.ok, statusText: response.statusText });
      if (!response.ok) {
        logger.error('❌ Fetch response not OK:', { context: 'send', status: response.status, statusText: response.statusText });
      } else {
        logger.info('✅ Fetch request successful!', { context: 'send' });
      }
      return response;
    })
    .catch(error => {
      logger.error('❌ Failed to send data:', { context: 'send', data: error });
      logger.error('❌ Error details:', { context: 'send', message: error.message, stack: error.stack });
      logger.error('❌ Error type:', { context: 'send', type: error.constructor.name });
    });
  }

  // Join game functionality
  public joinGame(playerName: string): void {
    logger.info('🎮 ===== JOIN GAME CALLED =====', { context: 'join' });
    logger.info(`🎮 Player name: ${playerName}`, { context: 'join' });
    logger.info('🎮 Joining game via SSE...', { context: 'join' });
    
    // Check if SSE connection is established
    logger.info(`🔍 EventSource exists: ${!!this.eventSource}`, { context: 'join' });
    if (this.eventSource) {
      logger.info(`🔍 EventSource readyState: ${this.eventSource.readyState}`, { context: 'join' });
      logger.info(`🔍 EventSource URL: ${this.eventSource.url}`, { context: 'join' });
    }
    
    if (!this.eventSource || this.eventSource.readyState !== EventSource.OPEN) {
      logger.warn('⚠️ SSE connection not ready, attempting to reconnect...', { context: 'join' });
      logger.warn(`⚠️ Current connection status: ${this.getConnectionStatus()}`, { context: 'join' });
      this.initializeSSE();
      return;
    }
    
    logger.info(`🔍 SSE connection state: ${this.eventSource.readyState}`, { context: 'join' });
    logger.info(`🔍 Game state connection: ${gameState.isConnected}`, { context: 'join' });
    logger.info(`🔍 Current players count: ${gameState.players.length}`, { context: 'join' });
    
    const joinData = {
      type: 'join',
      playerName: playerName,
      timestamp: Date.now()
    };
    
    logger.info('📤 Sending join data:', { context: 'join', data: joinData });
    
    this.send(joinData);
    
    logger.info('✅ Join request sent successfully', { context: 'join' });
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
        logger.info('📡 Raw SSE message received:', { context: 'DataStar', tag: 'raw', data: event.data });
        const data = JSON.parse(event.data);
        logger.info('📡 Parsed SSE data:', { context: 'DataStar', tag: 'data', data });
        logger.info('📡 Processing message type:', { context: 'DataStar', tag: 'data', type: data.type });

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
        } else if (data.type === 'joinResponse') {
          logger.info('🔍 Processing joinResponse', { context: 'DataStar', tag: 'join' });
          this.handleJoinResponse(data);
        } else if (data.type === 'peersResponse') {
          logger.info('🔍 Processing peersResponse', { context: 'DataStar', tag: 'peers' });
          this.handlePeersResponse(data);
        } else if (data.type === 'environmentChange') {
          logger.info('🔍 Processing environmentChange', { context: 'DataStar', tag: 'environment' });
          this.handleEnvironmentChange(data);
        } else if (data.type === 'positionUpdate') {
          logger.info('🔍 Processing positionUpdate', { context: 'DataStar', tag: 'position' });
          this.handlePositionUpdate(data);
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

  // Handle DataStar client messages
  private handleDataStarMessage(data: any): void {
    logger.info('📡 Received DataStar message:', { context: 'connection', data });
    
    try {
      // Handle different message types from DataStar
      if (data.type === 'signals') {
        this.handleSignals(data.payload);
      } else if (data.type === 'elements') {
        this.handleElements(data.payload);
      } else if (data.type === 'peerUpdate') {
        this.handlePeerUpdate(data.peer);
      } else if (data.type === 'message') {
        this.handleMessage(data.data);
      } else if (data.isConnected !== undefined) {
        this.handleSignals(data);
      } else {
        logger.warn('⚠️ Unknown DataStar message type:', { context: 'connection', type: data.type });
      }
    } catch (error) {
      logger.error('❌ Failed to handle DataStar message:', { context: 'connection', data: error });
    }
  }

  // Log DataStar DOM elements
  private logDataStarElements(): void {
    logger.info('🔍 Scanning for DataStar DOM elements...', { context: 'DataStar', tag: 'elements' });
    
    // Look for DataStar elements in the DOM
    const dataStarElements = document.querySelectorAll('[data-star], [data-datastar]');
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