// Client-side environment configuration
interface ClientConfig {
  isProduction: boolean;
  isDocker: boolean;
  apiBaseUrl: string;
  datastarUrl: string;
  debugMode: boolean;
}

// Determine environment from window location and build-time variables
const isProduction = import.meta.env.PROD;
const isDocker = import.meta.env.VITE_DOCKER === 'true' || window.location.hostname !== 'localhost';

// Environment-specific configurations
const config: ClientConfig = {
  isProduction,
  isDocker,
  
  // API configuration
  apiBaseUrl: isProduction && isDocker
    ? '' // Same origin in production Docker
    : 'https://localhost:10000', // Local development
    
  // DataStar configuration
  datastarUrl: isProduction && isDocker
    ? `${window.location.protocol}//${window.location.host}` // Same origin in production
    : 'https://localhost:10000', // Local development
    
  // Debug mode
  debugMode: !isProduction
};

// Log configuration on startup
export const logClientConfig = (): void => {
  if (config.debugMode) {
    // Configuration logging disabled per TEN_COMMANDMENTS
  }
};

export default config;
