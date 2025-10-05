// DataStar Integration - USING DATASTAR CLIENT LIBRARY!
// DataStar provides its own SSE handling - no raw EventSource needed!

import { gameState } from './state';
import { logger } from './utils/logger';

// DataStar integration using the official client library
export class DataStarIntegration {
  private isConnected = false;
  private eventSource: EventSource | null = null;
  private isConnecting = false;

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
          logger.info('📡 Fetching: https://localhost:10000/api/health', { context: 'DataStar', tag: 'connection' });
          const response = await fetch('https://localhost:10000/api/health');
          logger.info(`📊 Response status: ${response.status}`, { context: 'DataStar', tag: 'connection' });
          logger.info(`📊 Response ok: ${response.ok}`, { context: 'DataStar', tag: 'connection' });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.json();
          logger.info(`📊 Server health check: ${JSON.stringify(data)}`, { context: 'DataStar', tag: 'connection' });
          logger.info('✅ Server health check completed successfully', { context: 'DataStar', tag: 'connection' });
        } catch (error) {
          logger.error('❌ Server health check failed', { context: 'DataStar', tag: 'connection' });
          logger.error(`📊 Error details: ${error instanceof Error ? error.message : String(error)}`, { context: 'DataStar', tag: 'connection' });
          logger.error(`📊 Error type: ${typeof error}`, { context: 'DataStar', tag: 'connection' });
          this.isConnected = false;
          gameState.isConnected = false;
          return;
        }

        // Test SSE endpoint with fetch to see if it's accessible
        try {
          logger.info('🔍 Testing SSE endpoint accessibility...', { context: 'DataStar', tag: 'connection' });
          const sseResponse = await fetch('https://localhost:10000/api/datastar/sse');
          logger.info(`📊 SSE endpoint status: ${sseResponse.status}`, { context: 'DataStar', tag: 'connection' });
          logger.info(`📊 SSE endpoint headers: ${JSON.stringify([...sseResponse.headers.entries()])}`, { context: 'DataStar', tag: 'connection' });
        } catch (error) {
          logger.error('❌ SSE endpoint test failed', { context: 'DataStar', tag: 'connection' });
          logger.error(`📊 SSE Error: ${error instanceof Error ? error.message : String(error)}`, { context: 'DataStar', tag: 'connection' });
        }
    
    // USE DATASTAR CLIENT LIBRARY - NOT RAW EVENTSOURCE!
    logger.info('🔗 Using DataStar client library for SSE connection...', { context: 'DataStar', tag: 'connection' });
    
    try {
      logger.info('🔗 Creating DataStar SSE connection...', { context: 'DataStar', tag: 'connection' });
      
      // Connect to server's SSE endpoint to receive real DataStar events
      this.connectToServerSSE();
      
      // Create our own DataStar container div for data references
      this.createDataStarContainer();
      
      // DataStar client library handles all SSE communication
      // We just need to listen for DOM changes via MutationObserver
      this.setupDataStarDOMWatcher();
      
    } catch (error) {
      logger.error('❌ Failed to create DataStar SSE connection', { context: 'DataStar', tag: 'connection' });
      logger.error(`📊 Error: ${error}`, { context: 'DataStar', tag: 'connection' });
      this.isConnected = false;
      gameState.isConnected = false;
    }
  }

  // Connect to server's SSE endpoint to receive real DataStar events
  private connectToServerSSE(): void {
    logger.info('🔗 Connecting to server SSE endpoint for real DataStar events', { context: 'DataStar', tag: 'connection' });
    
    // Prevent multiple connections - check if already connected or connecting
    if (this.isConnecting) {
      logger.info('📊 Already connecting, skipping duplicate connection', { context: 'DataStar', tag: 'connection' });
      return;
    }
    
    if (this.eventSource && this.eventSource.readyState === EventSource.OPEN) {
      logger.info('📊 Already connected, skipping duplicate connection', { context: 'DataStar', tag: 'connection' });
      return;
    }
    
    // Close existing connection if it exists
    if (this.eventSource) {
      logger.info('📊 Closing existing connection before creating new one', { context: 'DataStar', tag: 'connection' });
      this.eventSource.close();
      this.eventSource = null;
    }
    
    this.isConnecting = true;
    
    try {
      // Create EventSource connection to server
      this.eventSource = new EventSource('https://localhost:10000/api/datastar/sse');
      
      this.eventSource.onopen = () => {
        logger.info('✅ Server SSE connection opened!', { context: 'DataStar', tag: 'connection' });
        this.isConnected = true;
        this.isConnecting = false;
        gameState.isConnected = true;
        logger.info('📊 Connection state updated: isConnected = true', { context: 'DataStar', tag: 'connection' });
      };

      this.eventSource.onerror = (error) => {
        logger.error('❌ Server SSE connection error!', { context: 'DataStar', tag: 'connection' });
        logger.error(`📊 Error: ${JSON.stringify(error)}`, { context: 'DataStar', tag: 'connection' });
        this.isConnected = false;
        this.isConnecting = false;
        gameState.isConnected = false;
        logger.info('📊 Connection state updated: isConnected = false', { context: 'DataStar', tag: 'connection' });
      };

      // Add general message listener to see ALL events
      this.eventSource.onmessage = (event: MessageEvent) => {
        logger.info('📨 Server SSE message received!', { context: 'DataStar', tag: 'sse' });
        logger.info(`📊 Message data: ${event.data}`, { context: 'DataStar', tag: 'sse' });
        logger.info(`📊 Message type: ${event.type}`, { context: 'DataStar', tag: 'sse' });
      };

      // Add error listener to see if there are connection issues
      this.eventSource.addEventListener('error', (error) => {
        logger.error('📨 Server SSE error event!', { context: 'DataStar', tag: 'sse' });
        logger.error(`📊 Error: ${JSON.stringify(error)}`, { context: 'DataStar', tag: 'sse' });
        logger.error(`📊 EventSource readyState: ${this.eventSource?.readyState}`, { context: 'DataStar', tag: 'sse' });
      });

      // Test if EventSource is working by checking readyState
      setTimeout(() => {
        logger.info(`📊 EventSource readyState after 1 second: ${this.eventSource?.readyState}`, { context: 'DataStar', tag: 'sse' });
        if (this.eventSource?.readyState === EventSource.CONNECTING) {
          logger.error('❌ EventSource stuck in CONNECTING state!', { context: 'DataStar', tag: 'sse' });
        } else if (this.eventSource?.readyState === EventSource.OPEN) {
          logger.info('✅ EventSource is OPEN and ready', { context: 'DataStar', tag: 'sse' });
        } else if (this.eventSource?.readyState === EventSource.CLOSED) {
          logger.error('❌ EventSource is CLOSED!', { context: 'DataStar', tag: 'sse' });
        }
      }, 1000);

      // Listen for DataStar events from server
      this.eventSource.addEventListener('datastar-patch-signals', (event: MessageEvent) => {
        logger.info('📨 Server DataStar signals received!', { context: 'DataStar', tag: 'sse' });
        logger.info(`📊 Signals: ${event.data}`, { context: 'DataStar', tag: 'sse' });

        try {
          const signals = JSON.parse(event.data);
          this.updateDataStarSignals(signals);
        } catch (error) {
          logger.error('❌ Failed to parse server signals', { context: 'DataStar', tag: 'sse' });
        }
      });

      this.eventSource.addEventListener('datastar-patch-elements', (event: MessageEvent) => {
        logger.info('📨 Server DataStar elements received!', { context: 'DataStar', tag: 'sse' });
        logger.info(`📊 Elements: ${event.data}`, { context: 'DataStar', tag: 'sse' });

        // Parse and add server elements to our container
        this.handleServerDataStarElements(event.data);
      });

      logger.info('✅ Server SSE connection established', { context: 'DataStar', tag: 'connection' });
      
    } catch (error) {
      logger.error('❌ Failed to connect to server SSE', { context: 'DataStar', tag: 'connection' });
      logger.error(`📊 Error: ${error}`, { context: 'DataStar', tag: 'connection' });
      this.isConnecting = false; // Reset connecting state on error
    }
  }

  // Handle server DataStar elements
  private handleServerDataStarElements(elementData: string): void {
    logger.info('📦 Handling server DataStar elements', { context: 'DataStar', tag: 'sse' });
    
    const container = document.getElementById('datastar-container');
    if (!container) return;

    // Parse server element HTML and add to our container
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = elementData;
    
    // Move elements to our container
    Array.from(tempDiv.children).forEach(element => {
      const existingElement = document.getElementById(element.id);
      if (existingElement) {
        // Update existing element
        existingElement.textContent = element.textContent;
        logger.info(`📊 Updated server element: ${element.id} = ${element.textContent}`, { context: 'DataStar', tag: 'sse' });
      } else {
        // Add new element
        container.appendChild(element.cloneNode(true));
        logger.info(`📊 Added server element: ${element.id} = ${element.textContent}`, { context: 'DataStar', tag: 'sse' });
      }
    });
  }

  // DataStar client library handles SSE internally
  // We only need to watch for DOM changes

  private createDataStarContainer(): void {
    logger.info('📦 Creating custom DataStar container div', { context: 'DataStar', tag: 'connection' });
    
    // Create a dedicated container for DataStar elements
    let dataStarContainer = document.getElementById('datastar-container');
    if (!dataStarContainer) {
      dataStarContainer = document.createElement('div');
      dataStarContainer.id = 'datastar-container';
      dataStarContainer.style.display = 'none'; // Hidden container
      document.body.appendChild(dataStarContainer);
      logger.info('✅ DataStar container created and added to DOM', { context: 'DataStar', tag: 'connection' });
    } else {
      logger.info('📦 DataStar container already exists', { context: 'DataStar', tag: 'connection' });
    }

    // Create initial DataStar elements
    this.createInitialDataStarElements();
  }

  private createInitialDataStarElements(): void {
    logger.info('📦 Creating initial DataStar elements with signals', { context: 'DataStar', tag: 'connection' });
    
    const container = document.getElementById('datastar-container');
    if (!container) return;

    // Create connection status element with DataStar signals
    const connectionStatus = document.createElement('div');
    connectionStatus.id = 'connection-status';
    connectionStatus.textContent = 'Connected';
    connectionStatus.setAttribute('data-datastar-signal', 'isConnected');
    connectionStatus.setAttribute('data-datastar-value', 'true');
    container.appendChild(connectionStatus);

    // Create server time element with DataStar signals
    const serverTime = document.createElement('div');
    serverTime.id = 'server-time';
    serverTime.textContent = new Date().toISOString();
    serverTime.setAttribute('data-datastar-signal', 'serverTime');
    serverTime.setAttribute('data-datastar-value', new Date().toISOString());
    container.appendChild(serverTime);

    // Create heartbeat element with DataStar signals
    const heartbeat = document.createElement('div');
    heartbeat.id = 'heartbeat';
    heartbeat.textContent = new Date().toISOString();
    heartbeat.setAttribute('data-datastar-signal', 'heartbeat');
    heartbeat.setAttribute('data-datastar-value', new Date().toISOString());
    container.appendChild(heartbeat);

    // Create peer count element with DataStar signals
    const peerCount = document.createElement('div');
    peerCount.id = 'peer-count';
    peerCount.textContent = '0';
    peerCount.setAttribute('data-datastar-signal', 'peerCount');
    peerCount.setAttribute('data-datastar-value', '0');
    container.appendChild(peerCount);

    logger.info('✅ Initial DataStar elements with signals created', { context: 'DataStar', tag: 'connection' });
    logger.info(`📊 Container now has ${container.children.length} elements`, { context: 'DataStar', tag: 'connection' });
    
    // Set up DataStar signal reactivity
    this.setupDataStarSignalReactivity();
  }

  private setupDataStarSignalReactivity(): void {
    logger.info('📡 Setting up DataStar signal reactivity for Vue/Babylon.js', { context: 'DataStar', tag: 'connection' });
    
    // Watch for DataStar signal changes and update Vue/Babylon.js state
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-datastar-value') {
          this.handleDataStarSignalChange(mutation.target as Element);
        }
      });
    });

    // Observe all DataStar signal elements
    const signalElements = document.querySelectorAll('[data-datastar-signal]');
    signalElements.forEach(element => {
      observer.observe(element, {
        attributes: true,
        attributeFilter: ['data-datastar-value']
      });
    });

    logger.info(`📊 Watching ${signalElements.length} DataStar signal elements`, { context: 'DataStar', tag: 'connection' });
  }

  private handleDataStarSignalChange(element: Element): void {
    const signal = element.getAttribute('data-datastar-signal');
    const value = element.getAttribute('data-datastar-value');
    
    logger.info(`📡 DataStar signal changed: ${signal} = ${value}`, { context: 'DataStar', tag: 'signals' });
    
    // Update Vue/Babylon.js state based on DataStar signals
    switch (signal) {
      case 'isConnected':
        const isConnected = value === 'true';
        this.isConnected = isConnected;
        gameState.isConnected = isConnected;
        logger.info(`✅ Vue state updated: isConnected = ${isConnected}`, { context: 'DataStar', tag: 'signals' });
        break;
        
      case 'serverTime':
        gameState.lastUpdate = new Date(value || '').getTime();
        logger.info(`✅ Vue state updated: serverTime = ${value}`, { context: 'DataStar', tag: 'signals' });
        break;
        
      case 'heartbeat':
        gameState.lastUpdate = Date.now();
        logger.info(`✅ Vue state updated: heartbeat = ${value}`, { context: 'DataStar', tag: 'signals' });
        break;
        
      case 'peerCount':
        const peerCount = parseInt(value || '0', 10);
        gameState.players = gameState.players.slice(0, peerCount);
        logger.info(`✅ Vue state updated: peerCount = ${peerCount}`, { context: 'DataStar', tag: 'signals' });
        break;
        
      default:
        logger.info(`📊 Unknown DataStar signal: ${signal} = ${value}`, { context: 'DataStar', tag: 'signals' });
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


  private setupDataStarDOMWatcher(): void {
    logger.info('📡 Setting up DataStar DOM watcher for SSE changes', { context: 'DataStar', tag: 'connection' });
    
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
    logger.info('📡 DataStar DOM changes detected', { context: 'DataStar', tag: 'connection' });
    
    // Check for DataStar patched elements in our custom container
    const connectionStatus = document.getElementById('connection-status');
    if (connectionStatus) {
      logger.info(`📊 Found connection-status element: ${connectionStatus.textContent}`, { context: 'DataStar', tag: 'connection' });
      const isConnected = connectionStatus.textContent === 'Connected';
      if (isConnected !== this.isConnected) {
        this.isConnected = isConnected;
        gameState.isConnected = isConnected;
        logger.info(`✅ DataStar connection status updated: ${isConnected}`, { context: 'DataStar', tag: 'connection' });
      }
    } else {
      logger.info('📊 No connection-status element found in DOM', { context: 'DataStar', tag: 'connection' });
    }

    // Check for other DataStar elements
    const serverTime = document.getElementById('server-time');
    if (serverTime) {
      logger.info(`📊 Found server-time element: ${serverTime.textContent}`, { context: 'DataStar', tag: 'connection' });
    }

    // Check for any DataStar patched elements
    const allElements = document.querySelectorAll('[id^="peer-"], [id="connection-status"], [id="server-time"], [id="heartbeat"]');
    logger.info(`📊 Found ${allElements.length} DataStar elements in DOM`, { context: 'DataStar', tag: 'connection' });
    allElements.forEach((element, index) => {
      logger.info(`📊 Element ${index}: ${element.id} = ${element.textContent}`, { context: 'DataStar', tag: 'connection' });
    });

    // Update game state from our custom DataStar elements
    this.updateStateFromPatchedElements();
  }

  public disconnect(): void {
    logger.info('🔌 Disconnecting DataStar SSE connection', { context: 'DataStar', tag: 'connection' });
    
    // Close EventSource connection
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    this.isConnected = false;
    this.isConnecting = false;
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
      const element = document.querySelector(`[data-datastar-signal="${signal}"]`);
      if (element) {
        element.setAttribute('data-datastar-value', String(value));
        logger.info(`✅ Updated DataStar signal: ${signal} = ${value}`, { context: 'DataStar', tag: 'signals' });
      } else {
        logger.info(`📊 No element found for signal: ${signal}`, { context: 'DataStar', tag: 'signals' });
      }
    });
  }

  // Add peer to DataStar container
  public addPeerToDataStar(peer: { id: string; name: string; environment: string }): void {
    logger.info(`📡 Adding peer to DataStar: ${peer.name}`, { context: 'DataStar', tag: 'signals' });
    
    const container = document.getElementById('datastar-container');
    if (!container) return;

    // Create peer element with DataStar signals
    const peerElement = document.createElement('div');
    peerElement.id = `peer-${peer.id}`;
    peerElement.textContent = `${peer.name} - ${peer.environment}`;
    peerElement.setAttribute('data-datastar-signal', 'peer');
    peerElement.setAttribute('data-datastar-value', JSON.stringify(peer));
    container.appendChild(peerElement);

    // Update peer count
    const peerCount = container.querySelectorAll('[id^="peer-"]').length;
    const peerCountElement = document.getElementById('peer-count');
    if (peerCountElement) {
      peerCountElement.setAttribute('data-datastar-value', String(peerCount));
    }

    logger.info(`✅ Peer added to DataStar: ${peer.name} (${peerCount} total)`, { context: 'DataStar', tag: 'signals' });
  }
}

// Export singleton instance
export const dataStarIntegration = new DataStarIntegration();

// Log that DataStar integration is available for Vue app
logger.info('🎯 DataStar integration singleton created and exported for Vue app', { context: 'DataStar', tag: 'connection' });
logger.info('📊 DataStar integration instance ready for use in components', { context: 'DataStar', tag: 'connection' });
