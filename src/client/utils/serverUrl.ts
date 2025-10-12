// ============================================================================
// SERVER URL UTILITY - Best Practice Environment Detection
// ============================================================================

/**
 * Get the correct server URL based on environment
 * Best practice: Use build-time environment variables and runtime detection
 */
export function getServerUrl(): string {
  // Build-time environment detection
  const isProduction = import.meta.env.PROD;
  const isDocker = import.meta.env.VITE_DOCKER === 'true';
  
  // Runtime environment detection
  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  
  const isRender = typeof window !== 'undefined' && 
    window.location.hostname.includes('onrender.com');
  
  // Production Docker deployment (Render.com)
  if (isProduction && (isDocker || isRender)) {
    return `${window.location.protocol}//${window.location.host}`;
  }
  
  // Local development
  if (isLocalhost) {
    return 'https://localhost:10000';
  }
  
  // Fallback for other environments
  return typeof window !== 'undefined' 
    ? `${window.location.protocol}//${window.location.host}`
    : 'http://localhost:10000';
}

/**
 * Get the SSE endpoint URL
 */
export function getSSEUrl(): string {
  return `${getServerUrl()}/api/datastar/sse`;
}

/**
 * Get the send endpoint URL
 */
export function getSendUrl(): string {
  return `${getServerUrl()}/api/datastar/send`;
}

/**
 * Log the current server configuration (for debugging)
 */
export function logServerConfig(): void {
  if (import.meta.env.DEV) {
    console.log('🌐 Server Configuration:', {
      serverUrl: getServerUrl(),
      sseUrl: getSSEUrl(),
      sendUrl: getSendUrl(),
      isProduction: import.meta.env.PROD,
      isDocker: import.meta.env.VITE_DOCKER === 'true',
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'undefined'
    });
  }
}
