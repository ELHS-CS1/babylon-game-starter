// Import path utilities
import { join } from 'path';

// Environment configuration for local vs production deployment
interface ServerConfig {
  port: number;
  host: string;
  corsOrigin: string;
  isProduction: boolean;
  isDocker: boolean;
  clientPath: string;
  assetsPath: string;
  healthCheckPath: string;
}

// Determine environment
const isProduction = process.env['NODE_ENV'] === 'production';
const isDocker = process.env['DOCKER'] === 'true' || process.env['PROD'] === 'true';

// Environment-specific configurations
const config: ServerConfig = {
  port: parseInt(process.env['PORT'] ?? '10000'),
  host: process.env['HOST'] ?? '0.0.0.0',
  corsOrigin: process.env['CORS_ORIGIN'] ?? '*',
  isProduction,
  isDocker,
  
  // Path configurations based on environment
  clientPath: isDocker 
    ? '/app/dist/client'           // Docker container path
    : join(process.cwd(), 'dist/client'), // Local development path
    
  assetsPath: isDocker
    ? '/app/assets'                // Docker container path
    : join(process.cwd(), 'assets'), // Local development path
    
  healthCheckPath: '/health'
};

// Log configuration on startup
export const logConfig = (): void => {
  // Configuration logging disabled per TEN_COMMANDMENTS
  // All console statements must be removed
};

export default config;
