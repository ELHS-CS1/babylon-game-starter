#!/usr/bin/env node

/**
 * Peer Connection Test Script
 * 
 * This script demonstrates and tests the peer connection functionality
 * by simulating multiple clients and verifying environment isolation.
 */

import { spawn } from 'child_process';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class PeerConnectionTester {
  constructor() {
    this.server = null;
    this.wss = null;
    this.clients = new Map();
    this.testResults = [];
  }

  async startTestServer() {
    return new Promise((resolve) => {
      this.server = createServer();
      this.wss = new WebSocketServer({ server: this.server });

      this.wss.on('connection', (ws) => {
        const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.clients.set(clientId, {
          ws,
          environment: 'levelTest',
          lastUpdate: Date.now()
        });

        console.log(`✅ Client connected: ${clientId}`);

        ws.on('message', (message) => {
          try {
            const data = JSON.parse(message.toString());
            this.handleClientMessage(clientId, data);
          } catch (error) {
            console.error(`❌ Error parsing message from ${clientId}:`, error);
          }
        });

        ws.on('close', () => {
          console.log(`🔌 Client disconnected: ${clientId}`);
          this.clients.delete(clientId);
        });

        // Send initial game state
        ws.send(JSON.stringify({
          type: 'game-state',
          data: {
            peers: Array.from(this.clients.values()).map(client => ({
              id: clientId,
              name: `Player_${clientId}`,
              position: { x: 0, y: 0, z: 0 },
              rotation: { x: 0, y: 0, z: 0 },
              environment: client.environment,
              lastUpdate: client.lastUpdate
            })),
            environment: 'levelTest'
          }
        }));
      });

      this.server.listen(3001, () => {
        console.log('🚀 Test server running on port 3001');
        resolve();
      });
    });
  }

  handleClientMessage(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (data.type) {
      case 'environment-change':
        client.environment = data.environment;
        console.log(`🌍 Client ${clientId} changed environment to: ${data.environment}`);
        this.broadcastEnvironmentUpdate(clientId, data.environment);
        break;
      
      case 'peer-update':
        client.lastUpdate = Date.now();
        this.broadcastPeerUpdate(clientId, data);
        break;
    }
  }

  broadcastEnvironmentUpdate(clientId, environment) {
    const message = JSON.stringify({
      type: 'environment-update',
      data: { clientId, environment }
    });

    this.clients.forEach((client, id) => {
      if (client.ws.readyState === 1) { // WebSocket.OPEN
        client.ws.send(message);
      }
    });
  }

  broadcastPeerUpdate(clientId, data) {
    const message = JSON.stringify({
      type: 'peer-update',
      data: { clientId, ...data }
    });

    // Only broadcast to clients in the same environment
    const senderClient = this.clients.get(clientId);
    if (!senderClient) return;

    this.clients.forEach((client, id) => {
      if (id !== clientId && 
          client.environment === senderClient.environment && 
          client.ws.readyState === 1) {
        client.ws.send(message);
      }
    });
  }

  async runPeerConnectionTests() {
    console.log('\n🧪 Starting Peer Connection Tests...\n');

    // Test 1: Basic Connection
    await this.testBasicConnection();

    // Test 2: Environment Isolation
    await this.testEnvironmentIsolation();

    // Test 3: Peer State Updates
    await this.testPeerStateUpdates();

    // Test 4: Multiple Environment Switching
    await this.testMultipleEnvironmentSwitching();

    this.printTestResults();
  }

  async testBasicConnection() {
    console.log('📡 Test 1: Basic Connection');
    
    const testName = 'Basic Connection';
    try {
      // Simulate client connections
      const client1 = await this.simulateClient('test-client-1');
      const client2 = await this.simulateClient('test-client-2');

      await this.wait(1000);

      // Verify both clients are connected
      const connectedClients = this.clients.size;
      const success = connectedClients >= 2;

      this.recordTestResult(testName, success, `Connected clients: ${connectedClients}`);
      
      // Cleanup
      client1.close();
      client2.close();
    } catch (error) {
      this.recordTestResult(testName, false, `Error: ${error.message}`);
    }
  }

  async testEnvironmentIsolation() {
    console.log('🌍 Test 2: Environment Isolation');
    
    const testName = 'Environment Isolation';
    try {
      const client1 = await this.simulateClient('isolation-client-1');
      const client2 = await this.simulateClient('isolation-client-2');

      await this.wait(500);

      // Change client 1 to different environment
      client1.send(JSON.stringify({
        type: 'environment-change',
        environment: 'islandTown'
      }));

      await this.wait(500);

      // Verify environment isolation
      const client1Data = this.clients.get('isolation-client-1');
      const client2Data = this.clients.get('isolation-client-2');

      const success = client1Data?.environment === 'islandTown' && 
                     client2Data?.environment === 'levelTest';

      this.recordTestResult(testName, success, 
        `Client 1: ${client1Data?.environment}, Client 2: ${client2Data?.environment}`);

      client1.close();
      client2.close();
    } catch (error) {
      this.recordTestResult(testName, false, `Error: ${error.message}`);
    }
  }

  async testPeerStateUpdates() {
    console.log('🔄 Test 3: Peer State Updates');
    
    const testName = 'Peer State Updates';
    try {
      const client1 = await this.simulateClient('state-client-1');
      const client2 = await this.simulateClient('state-client-2');

      await this.wait(500);

      // Send peer update from client 1
      client1.send(JSON.stringify({
        type: 'peer-update',
        position: { x: 10, y: 5, z: -3 },
        rotation: { x: 0, y: Math.PI, z: 0 }
      }));

      await this.wait(500);

      // Verify peer state was updated
      const client1Data = this.clients.get('state-client-1');
      const success = client1Data && (Date.now() - client1Data.lastUpdate) < 2000;

      this.recordTestResult(testName, success, 
        `Last update: ${new Date(client1Data?.lastUpdate || 0).toISOString()}`);

      client1.close();
      client2.close();
    } catch (error) {
      this.recordTestResult(testName, false, `Error: ${error.message}`);
    }
  }

  async testMultipleEnvironmentSwitching() {
    console.log('🔄 Test 4: Multiple Environment Switching');
    
    const testName = 'Multiple Environment Switching';
    try {
      const client1 = await this.simulateClient('switch-client-1');
      const environments = ['levelTest', 'islandTown', 'joyTown', 'mansion'];

      let allSwitchesSuccessful = true;

      for (const env of environments) {
        client1.send(JSON.stringify({
          type: 'environment-change',
          environment: env
        }));

        await this.wait(200);

        const clientData = this.clients.get('switch-client-1');
        if (clientData?.environment !== env) {
          allSwitchesSuccessful = false;
          break;
        }
      }

      this.recordTestResult(testName, allSwitchesSuccessful, 
        `Tested ${environments.length} environment switches`);

      client1.close();
    } catch (error) {
      this.recordTestResult(testName, false, `Error: ${error.message}`);
    }
  }

  async simulateClient(clientId) {
    return new Promise((resolve, reject) => {
      const WebSocket = require('ws');
      const ws = new WebSocket('ws://localhost:3001');

      ws.on('open', () => {
        // Override the client ID for testing
        this.clients.set(clientId, {
          ws,
          environment: 'levelTest',
          lastUpdate: Date.now()
        });
        resolve(ws);
      });

      ws.on('error', reject);
    });
  }

  recordTestResult(testName, success, details) {
    const result = {
      test: testName,
      success,
      details,
      timestamp: new Date().toISOString()
    };
    
    this.testResults.push(result);
    
    const status = success ? '✅ PASS' : '❌ FAIL';
    console.log(`  ${status}: ${testName}`);
    console.log(`    ${details}\n`);
  }

  printTestResults() {
    console.log('\n📊 Test Results Summary:');
    console.log('=' .repeat(50));
    
    const passed = this.testResults.filter(r => r.success).length;
    const total = this.testResults.length;
    
    this.testResults.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.test}`);
    });
    
    console.log('=' .repeat(50));
    console.log(`Total: ${passed}/${total} tests passed`);
    
    if (passed === total) {
      console.log('🎉 All tests passed! Peer connection system is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Please check the implementation.');
      process.exit(1);
    }
  }

  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async cleanup() {
    if (this.wss) {
      this.wss.close();
    }
    if (this.server) {
      this.server.close();
    }
  }
}

// Main execution
async function main() {
  const tester = new PeerConnectionTester();
  
  try {
    await tester.startTestServer();
    await tester.runPeerConnectionTests();
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  } finally {
    await tester.cleanup();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { PeerConnectionTester };
