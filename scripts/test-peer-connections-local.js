#!/usr/bin/env node

/**
 * Local Peer Connection Test Script
 * 
 * This script runs peer connection tests locally without Docker.
 * It ensures the server is running in local development mode
 * and runs Playwright tests against it.
 */

import { execSync, spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const projectRoot = process.cwd();
const serverDistPath = join(projectRoot, 'src/server/dist/index.js');

console.log('🧪 Starting Local Peer Connection Tests');
console.log('=====================================');

// Check if server build exists
if (!existsSync(serverDistPath)) {
  console.log('❌ Server build not found. Building...');
  try {
    execSync('npm run build', { stdio: 'inherit', cwd: projectRoot });
    console.log('✅ Build completed');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Set environment variables for local development
const env = {
  ...process.env,
  NODE_ENV: 'development',
  PROD: 'false',
  DOCKER: 'false',
  PORT: '3001' // Use different port to avoid conflicts
};

console.log('🔧 Environment Configuration:');
console.log(`   NODE_ENV: ${env.NODE_ENV}`);
console.log(`   PROD: ${env.PROD}`);
console.log(`   DOCKER: ${env.DOCKER}`);
console.log('');

// Start the server in the background
console.log('🚀 Starting local development server...');
const serverProcess = spawn('node', [serverDistPath], {
  env,
  stdio: 'pipe',
  cwd: projectRoot
});

// Handle server output
serverProcess.stdout.on('data', (data) => {
  const output = data.toString().trim();
  if (output) {
    console.log(`[SERVER] ${output}`);
  }
});

serverProcess.stderr.on('data', (data) => {
  const output = data.toString().trim();
  if (output) {
    console.error(`[SERVER ERROR] ${output}`);
  }
});

// Wait for server to start
const waitForServer = () => new Promise((resolve, reject) => {
  const timeout = setTimeout(() => {
    serverProcess.kill('SIGTERM');
    reject(new Error('Server startup timeout'));
  }, 30000);

  let serverReady = false;

  serverProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`[SERVER] ${output.trim()}`);
    if (output.includes('Server running on') && !serverReady) {
      serverReady = true;
      clearTimeout(timeout);
      resolve();
    }
  });

  serverProcess.stderr.on('data', (data) => {
    const output = data.toString();
    console.error(`[SERVER ERROR] ${output.trim()}`);
    if (output.includes('EADDRINUSE') && !serverReady) {
      clearTimeout(timeout);
      reject(new Error('Port 3001 is already in use. Please kill existing processes.'));
    }
  });

  serverProcess.on('error', (error) => {
    if (!serverReady) {
      clearTimeout(timeout);
      reject(error);
    }
  });

  serverProcess.on('exit', (code) => {
    if (!serverReady && code !== 0) {
      clearTimeout(timeout);
      reject(new Error(`Server exited with code ${code}`));
    }
  });
});

// Main execution
(async () => {
  try {
    await waitForServer();
    console.log('✅ Server started successfully');
    console.log('');

    // Run Playwright tests
    console.log('🎭 Running Playwright peer connection tests...');
    try {
      execSync('npx playwright test tests/peer-connections.spec.ts --config=playwright.config.ts', {
        stdio: 'inherit',
        cwd: projectRoot,
        env: {
          ...env,
          // Ensure Playwright uses the local server
          PLAYWRIGHT_BASE_URL: 'http://localhost:3001'
        }
      });
      console.log('✅ Peer connection tests completed successfully');
    } catch (error) {
      console.error('❌ Peer connection tests failed:', error.message);
      process.exit(1);
    } finally {
      // Clean up: stop the server
      console.log('');
      console.log('🧹 Stopping server...');
      serverProcess.kill('SIGTERM');
      
      // Wait for graceful shutdown
      await new Promise((resolve) => {
        serverProcess.on('exit', resolve);
        setTimeout(resolve, 5000); // Force exit after 5 seconds
      });
      
      console.log('✅ Server stopped');
      console.log('');
      console.log('🎉 Local peer connection tests completed!');
    }
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  }
})();
