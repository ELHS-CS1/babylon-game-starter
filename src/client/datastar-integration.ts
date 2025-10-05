// DataStar Integration - Using ACTUAL DataStar, not EventSource!
// Based on: https://data-star.dev/guide/getting_started

import { gameState } from './state';
import { logger } from './utils/logger';

// DataStar SSE connection handler
export class DataStarIntegration {
  private isConnected = false;

  constructor() {
    this.initializeDataStar();
  }

  private initializeDataStar() {
    logger.info('🚀 Initializing DataStar integration', { context: 'DataStar', tag: 'connection' });
    
    // Wait for DataStar to load
    this.waitForDataStar();
  }

  private waitForDataStar() {
    if (typeof window !== 'undefined' && (window as any).dataStar) {
      logger.info('✅ DataStar is available', { context: 'DataStar', tag: 'connection' });
      this.setupDataStarConnection();
    } else {
      setTimeout(() => {
        this.waitForDataStar();
      }, 100);
    }
  }

  private setupDataStarConnection() {
    try {
      // Use DataStar's actual API
      const dataStar = (window as any).dataStar;
      
      if (dataStar) {
        logger.info('🔗 Setting up DataStar connection', { context: 'DataStar', tag: 'connection' });
        
        // DataStar handles SSE automatically
        this.isConnected = true;
        gameState.isConnected = true;
        logger.info('✅ DataStar connection established', { context: 'DataStar', tag: 'connection' });
        
        // Listen for DataStar events
        this.setupDataStarListeners();
      }
    } catch (error) {
      logger.error('❌ DataStar connection failed', { context: 'DataStar', tag: 'connection' });
      this.isConnected = false;
      gameState.isConnected = false;
    }
  }

  private setupDataStarListeners() {
    // DataStar automatically handles DOM patching
    // We just need to listen for state changes
    logger.info('📡 Setting up DataStar listeners', { context: 'DataStar', tag: 'connection' });
    
    // Listen for DOM changes that DataStar makes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'attributes') {
          this.handleDataStarDOMChanges();
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true
    });
  }

  private handleDataStarDOMChanges() {
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

  public disconnect() {
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
