#!/usr/bin/env node

/**
 * Test script to demonstrate improved peer management
 * - Tracks all peers on server
 * - Only renders peers in same environment
 * - Environment switching
 * - Peer statistics
 */

import { createServer } from 'http';
import { URL } from 'url';

const SERVER_PORT = 10001; // Different port to avoid conflicts
const gameState = {
  peers: {},
  environments: ['levelTest', 'islandTown', 'joyTown', 'mansion', 'firefoxReality'],
  currentEnvironment: 'levelTest'
};

// Simulate peer data
const testPeers = [
  { id: 'peer-1', name: 'Player 1', environment: 'levelTest', position: { x: 0, y: 0, z: 0 } },
  { id: 'peer-2', name: 'Player 2', environment: 'levelTest', position: { x: 5, y: 0, z: 5 } },
  { id: 'peer-3', name: 'Player 3', environment: 'islandTown', position: { x: 10, y: 0, z: 10 } },
  { id: 'peer-4', name: 'Player 4', environment: 'joyTown', position: { x: 15, y: 0, z: 15 } },
  { id: 'peer-5', name: 'Player 5', environment: 'levelTest', position: { x: 20, y: 0, z: 20 } }
];

// Add test peers to game state
testPeers.forEach(peer => {
  gameState.peers[peer.id] = {
    ...peer,
    rotation: { x: 0, y: 0, z: 0 },
    lastUpdate: Date.now()
  };
});

function getEnvironmentStats() {
  const stats = {};
  Object.values(gameState.peers).forEach(peer => {
    const env = peer.environment;
    stats[env] = (stats[env] || 0) + 1;
  });
  return stats;
}

function getPeersInEnvironment(environment) {
  return Object.values(gameState.peers).filter(peer => peer.environment === environment);
}

function handleRequest(req, res) {
  const url = new URL(req.url, `http://localhost:${SERVER_PORT}`);
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (url.pathname === '/api/stats') {
    const stats = getEnvironmentStats();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      totalPeers: Object.keys(gameState.peers).length,
      environmentStats: stats,
      currentEnvironment: gameState.currentEnvironment,
      peersInCurrentEnvironment: getPeersInEnvironment(gameState.currentEnvironment).length
    }));
    return;
  }

  if (url.pathname === '/api/peers') {
    const environment = url.searchParams.get('environment') || gameState.currentEnvironment;
    const peers = getPeersInEnvironment(environment);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      environment,
      peers,
      count: peers.length
    }));
    return;
  }

  if (url.pathname === '/api/environment') {
    const newEnv = url.searchParams.get('env');
    if (newEnv && gameState.environments.includes(newEnv)) {
      gameState.currentEnvironment = newEnv;
      console.log(`Environment changed to: ${newEnv}`);
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      currentEnvironment: gameState.currentEnvironment,
      peersInCurrentEnvironment: getPeersInEnvironment(gameState.currentEnvironment).length,
      totalPeers: Object.keys(gameState.peers).length
    }));
    return;
  }

  // Default response
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Peer Management Test</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .stats { background: #f0f0f0; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .environment { background: #e0f0ff; padding: 10px; margin: 5px 0; border-radius: 3px; }
        button { padding: 10px 15px; margin: 5px; background: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer; }
        button:hover { background: #0056b3; }
      </style>
    </head>
    <body>
      <h1>🎮 Peer Management Test</h1>
      
      <div class="stats">
        <h3>📊 Server Statistics</h3>
        <div id="stats">Loading...</div>
      </div>
      
      <div class="stats">
        <h3>🌍 Environment Control</h3>
        <p>Current Environment: <span id="currentEnv">${gameState.currentEnvironment}</span></p>
        <p>Peers in Current Environment: <span id="currentPeers">Loading...</span></p>
        <button onclick="changeEnvironment('levelTest')">Level Test</button>
        <button onclick="changeEnvironment('islandTown')">Island Town</button>
        <button onclick="changeEnvironment('joyTown')">Joy Town</button>
        <button onclick="changeEnvironment('mansion')">Mansion</button>
        <button onclick="changeEnvironment('firefoxReality')">Firefox Reality</button>
      </div>
      
      <div class="stats">
        <h3>👥 Peers in Current Environment</h3>
        <div id="peers">Loading...</div>
      </div>

      <script>
        async function loadStats() {
          try {
            const response = await fetch('/api/stats');
            const data = await response.json();
            
            document.getElementById('stats').innerHTML = \`
              <p><strong>Total Peers:</strong> \${data.totalPeers}</p>
              <p><strong>Current Environment:</strong> \${data.currentEnvironment}</p>
              <p><strong>Peers in Current Environment:</strong> \${data.peersInCurrentEnvironment}</p>
              <p><strong>Environment Distribution:</strong></p>
              <ul>
                \${Object.entries(data.environmentStats).map(([env, count]) => 
                  \`<li>\${env}: \${count} peers</li>\`
                ).join('')}
              </ul>
            \`;
            
            document.getElementById('currentPeers').textContent = data.peersInCurrentEnvironment;
          } catch (error) {
            console.error('Error loading stats:', error);
          }
        }
        
        async function loadPeers() {
          try {
            const response = await fetch('/api/peers');
            const data = await response.json();
            
            document.getElementById('peers').innerHTML = \`
              <p><strong>Environment:</strong> \${data.environment}</p>
              <p><strong>Count:</strong> \${data.count}</p>
              <ul>
                \${data.peers.map(peer => 
                  \`<li>\${peer.name} (ID: \${peer.id}) - Position: (\${peer.position.x}, \${peer.position.y}, \${peer.position.z})</li>\`
                ).join('')}
              </ul>
            \`;
          } catch (error) {
            console.error('Error loading peers:', error);
          }
        }
        
        async function changeEnvironment(env) {
          try {
            const response = await fetch(\`/api/environment?env=\${env}\`);
            const data = await response.json();
            
            document.getElementById('currentEnv').textContent = data.currentEnvironment;
            document.getElementById('currentPeers').textContent = data.peersInCurrentEnvironment;
            
            await loadStats();
            await loadPeers();
          } catch (error) {
            console.error('Error changing environment:', error);
          }
        }
        
        // Load initial data
        loadStats();
        loadPeers();
        
        // Refresh every 5 seconds
        setInterval(() => {
          loadStats();
          loadPeers();
        }, 5000);
      </script>
    </body>
    </html>
  `);
}

const server = createServer(handleRequest);

server.listen(SERVER_PORT, () => {
  console.log(`🚀 Peer Management Test Server running on port ${SERVER_PORT}`);
  console.log(`📊 Stats: http://localhost:${SERVER_PORT}/api/stats`);
  console.log(`👥 Peers: http://localhost:${SERVER_PORT}/api/peers`);
  console.log(`🌍 Environment: http://localhost:${SERVER_PORT}/api/environment`);
  console.log(`🌐 Web Interface: http://localhost:${SERVER_PORT}`);
  console.log('');
  console.log('📋 Test Scenarios:');
  console.log('1. Open http://localhost:${SERVER_PORT} in browser');
  console.log('2. Switch between environments to see peer filtering');
  console.log('3. Observe how only peers in current environment are shown');
  console.log('4. Check that all peers are tracked on server regardless of environment');
});
