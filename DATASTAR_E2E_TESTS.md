# DataStar Multiplayer E2E Tests

This document describes the comprehensive end-to-end (e2e) test suite for the DataStar SSE multiplayer system, following official DataStar documentation patterns.

## Overview

The DataStar e2e tests verify the complete multiplayer functionality using DataStar's server-sent events (SSE) system, including:

- **DataStar SSE Connection**: Establishing and maintaining SSE connections
- **DOM Patching**: Verifying `datastar-patch-elements` events patch HTML into DOM
- **Multiplayer Synchronization**: Testing peer state updates and environment isolation
- **Real-time Updates**: Ensuring state changes are propagated correctly
- **Error Handling**: Testing graceful handling of connection issues

## Test Files

### 1. `tests/datastar-multiplayer.spec.ts`
**Primary DataStar multiplayer integration tests**

- **DataStar SSE Connection Tests**: Verify SSE connection establishment
- **DOM Patching Tests**: Test `datastar-patch-elements` event handling
- **Multiplayer Synchronization**: Test peer state updates across clients
- **Environment Isolation**: Verify peer separation by environment
- **Reconnection Tests**: Test DataStar SSE reconnection scenarios
- **Rapid Updates**: Test handling of multiple rapid state updates
- **Error Scenarios**: Test graceful error handling

### 2. `tests/peer-connections.spec.ts`
**DataStar peer connection management tests**

- **Peer Instantiation**: Test peer creation and management
- **State Updates**: Test peer state synchronization
- **Environment Isolation**: Test peer separation by environment
- **Reconnection**: Test peer reconnection scenarios
- **Rapid Environment Changes**: Test state consistency during rapid changes
- **Disconnection**: Test graceful peer disconnection

### 3. `tests/sse-server-assets.spec.ts`
**DataStar SSE server asset serving tests**

- **Asset Serving**: Test static asset delivery from SSE server
- **DataStar SSE Endpoints**: Test SSE endpoint functionality
- **CORS Headers**: Test cross-origin request handling
- **DataStar Integration**: Test DataStar client integration
- **Connection Status**: Test DataStar connection status handling

## DataStar Patterns Tested

### 1. SSE Connection Patterns
```typescript
// DataStar SSE connection establishment
await page.waitForFunction(() => {
  return window.dataStarIntegration && 
         window.dataStarIntegration.getConnectionStatus() === true;
}, { timeout: 20000 });
```

### 2. DOM Patching Patterns
```typescript
// Wait for DataStar patch-elements to be applied
await page.waitForSelector('#connection-status', { timeout: 10000 });

// Verify patched elements
const isConnected = await page.evaluate(() => {
  const statusElement = document.getElementById('connection-status');
  return statusElement?.textContent === 'Connected';
});
```

### 3. State Management Patterns
```typescript
// Wait for DataStar state updates
await page.waitForFunction(() => {
  return window.gameState && 
         window.gameState.lastUpdate && 
         (Date.now() - window.gameState.lastUpdate) < 1000;
}, { timeout: 5000 });
```

### 4. Peer Management Patterns
```typescript
// Get DataStar peers from patched DOM elements
const peers = await page.evaluate(() => {
  const peerElements = document.querySelectorAll('[id^="peer-"]');
  return Array.from(peerElements).map(element => {
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
});
```

## Test Runner

### DataStar E2E Test Runner Script
The `scripts/test-datastar-e2e.sh` script provides comprehensive test execution:

```bash
# Run all DataStar e2e tests
./scripts/test-datastar-e2e.sh

# Run specific test suites
./scripts/test-datastar-e2e.sh multiplayer
./scripts/test-datastar-e2e.sh peers
./scripts/test-datastar-e2e.sh assets

# Run tests in headed mode (visible browser)
./scripts/test-datastar-e2e.sh headed

# Run tests with debug output
./scripts/test-datastar-e2e.sh debug

# Test DataStar connection only
./scripts/test-datastar-e2e.sh connection
```

### Manual Test Execution
```bash
# Run individual test files
npx playwright test tests/datastar-multiplayer.spec.ts
npx playwright test tests/peer-connections.spec.ts
npx playwright test tests/sse-server-assets.spec.ts

# Run all DataStar tests
npx playwright test tests/datastar-multiplayer.spec.ts tests/peer-connections.spec.ts tests/sse-server-assets.spec.ts
```

## DataStar SSE Events Tested

### 1. `datastar-patch-elements`
Tests server-sent HTML elements being patched into the DOM:
```javascript
// Server sends:
event: datastar-patch-elements
data: elements <div id="connection-status">Connected</div>

// Client receives and patches into DOM
```

### 2. `datastar-patch-signals`
Tests server-sent signal updates for reactive state:
```javascript
// Server sends:
event: datastar-patch-signals
data: signals {"isConnected": true, "peerCount": 2}

// Client updates reactive state
```

### 3. Generic SSE Messages
Tests fallback message handling:
```javascript
// Server sends:
event: message
data: {"type": "connected", "timestamp": 1234567890}

// Client handles as generic message
```

## Test Scenarios

### 1. Connection Establishment
- ✅ DataStar SSE connection established
- ✅ Connection status patched into DOM
- ✅ Server time patched into DOM
- ✅ Connection status verification

### 2. Multiplayer Synchronization
- ✅ Multiple clients connect simultaneously
- ✅ Peer state updates propagate correctly
- ✅ Environment isolation maintained
- ✅ Peer disconnection handled gracefully

### 3. Real-time Updates
- ✅ Player movement updates
- ✅ Environment changes
- ✅ Peer state synchronization
- ✅ Rapid update handling

### 4. Error Scenarios
- ✅ Connection loss handling
- ✅ Reconnection scenarios
- ✅ Invalid data handling
- ✅ Network interruption recovery

## DataStar Integration Requirements

### 1. Client-Side Requirements
- DataStar script loaded from CDN
- DataStar integration initialized
- SSE connection established
- DOM patching event listeners
- State management integration

### 2. Server-Side Requirements
- DataStar SSE endpoint (`/api/datastar/sse`)
- DataStar send endpoint (`/api/datastar/send`)
- Proper SSE headers
- CORS configuration
- Event streaming

### 3. Test Environment Requirements
- DataStar SSE server running on port 10000
- Client application running on port 3003
- Browser automation (Playwright)
- Network connectivity

## Debugging DataStar Tests

### 1. Connection Issues
```bash
# Test DataStar SSE connection
curl -N http://localhost:10000/api/datastar/sse

# Test DataStar send endpoint
curl -X POST http://localhost:10000/api/datastar/send \
  -H "Content-Type: application/json" \
  -d '{"type":"datastar-patch-elements","data":"<div>Test</div>"}'
```

### 2. Browser Console Debugging
```javascript
// Check DataStar integration
console.log(window.dataStarIntegration);

// Check connection status
console.log(window.dataStarIntegration.getConnectionStatus());

// Check game state
console.log(window.gameState);

// Check patched elements
console.log(document.getElementById('connection-status'));
console.log(document.getElementById('server-time'));
```

### 3. Test Debugging
```bash
# Run tests with debug output
DEBUG=pw:api npx playwright test tests/datastar-multiplayer.spec.ts

# Run tests in headed mode
npx playwright test tests/datastar-multiplayer.spec.ts --headed

# Run specific test
npx playwright test tests/datastar-multiplayer.spec.ts -g "should establish DataStar SSE connection"
```

## Expected Test Results

### ✅ Successful Test Execution
- All DataStar SSE connections established
- DOM elements patched correctly
- Multiplayer synchronization working
- Peer state updates propagated
- Environment isolation maintained
- Error scenarios handled gracefully

### ❌ Common Test Failures
- DataStar SSE connection timeout
- DOM patching not working
- Peer synchronization issues
- Environment isolation failures
- State update propagation problems

## Maintenance

### 1. Regular Updates
- Update DataStar CDN version
- Update test patterns for new DataStar features
- Maintain compatibility with DataStar documentation
- Update test scenarios for new multiplayer features

### 2. Test Monitoring
- Monitor test execution times
- Track test failure rates
- Identify flaky tests
- Maintain test stability

### 3. Documentation Updates
- Update test documentation for new patterns
- Document new test scenarios
- Maintain DataStar integration guides
- Update debugging procedures

## Conclusion

The DataStar e2e test suite provides comprehensive coverage of the multiplayer system using official DataStar documentation patterns. The tests verify SSE connection handling, DOM patching, multiplayer synchronization, and error scenarios, ensuring the system works correctly in production environments.

For more information about DataStar, see the [official documentation](https://data-star.dev/).
