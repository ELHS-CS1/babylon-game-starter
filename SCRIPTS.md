# Babylon.js Multiplayer Game - Scripts Documentation

This document provides a comprehensive overview of all available npm scripts, inspired by the sigma-sockets project structure.

## 🚀 Core Workflow Scripts

### Development
```bash
npm run dev              # Start Vite dev server (client only)
npm run dev:client       # Start Vite dev server
npm run dev:server       # Start server with watch mode
npm run dev:full         # Start both client and server concurrently
```

### Building
```bash
npm run build            # Build both client and server
npm run build:client     # Build client with Vite
npm run build:server     # Build server with TypeScript
```

### Production
```bash
npm run start            # Build and start production server
npm run start:prod       # Start with NODE_ENV=production
```

## 🧪 Testing Scripts

### Unit Testing (Vitest)
```bash
npm run test:unit        # Run unit tests in watch mode
npm run test:unit:ui     # Run unit tests with UI
npm run test:unit:run    # Run unit tests once
npm run test:unit:coverage # Run unit tests with coverage
```

### End-to-End Testing (Playwright)
```bash
npm run test:e2e         # Run E2E tests
npm run test:e2e:ui      # Run E2E tests with UI
npm run test:e2e:headed  # Run E2E tests in headed mode
npm run test:e2e:debug   # Run E2E tests in debug mode
npm run test:e2e:report  # Show E2E test report
```

### Combined Testing
```bash
npm run test             # Run both unit and E2E tests
npm run test:all         # Run both unit and E2E tests
npm run test:integration # Run peer connection tests + E2E tests
```

### Custom Peer Testing
```bash
npm run test:peers       # Run custom peer connection tests
npm run game:test:peers  # Alias for peer connection tests
```

## 🔍 Quality Assurance

### Linting & Type Checking
```bash
npm run lint             # Run ESLint
npm run lint:fix         # Run ESLint with auto-fix
npm run type-check       # Run TypeScript type checking
npm run type-check:watch # Run TypeScript type checking in watch mode
```

### Quality Assurance Workflows
```bash
npm run qa               # Quick QA: type-check + lint + unit tests
npm run qa:full          # Full QA: clean + install + qa + E2E tests
npm run ci               # CI workflow (same as qa:full)
```

## 🧹 Cleanup & Utilities

### Cleanup
```bash
npm run clean            # Clean build artifacts and dependencies
npm run clean:build      # Clean build artifacts only
npm run clean:deps       # Clean dependencies only
npm run fresh            # Clean everything and reinstall
```

### Dependencies
```bash
npm run deps:check       # Check for outdated dependencies
npm run deps:update      # Update dependencies
npm run deps:audit       # Audit dependencies for vulnerabilities
npm run deps:fix         # Fix dependency vulnerabilities
```

### Project Information
```bash
npm run size             # Show build size
npm run info             # Show project information
npm run info:project     # Show project details
npm run info:deps        # Show dependency information
```

## 🐳 Docker & Deployment

### Docker
```bash
npm run docker           # Build Docker image
npm run docker:build     # Build Docker image
npm run docker:run       # Run Docker container
npm run docker:test      # Build and run Docker container
```

### Deployment
```bash
npm run deploy           # Build and test for deployment
npm run deploy:render    # Prepare for Render.com deployment
```

## 🎮 Game-Specific Scripts

```bash
npm run game:dev         # Start full development environment
npm run game:test        # Run E2E tests
npm run game:build       # Build the game
npm run game:start       # Start the game
```

## 📚 Help & Information

```bash
npm run help             # Show available scripts
npm run help:scripts     # Show first 20 scripts
npm run help:all         # Show all available scripts
```

## 🏗️ Project Structure

The scripts are organized following the sigma-sockets project pattern:

```
├── Core Workflow Scripts    # Development, building, production
├── Testing Scripts          # Unit tests, E2E tests, custom tests
├── Quality Assurance        # Linting, type checking, QA workflows
├── Cleanup & Utilities      # Cleanup, dependencies, information
├── Docker & Deployment      # Containerization and deployment
├── Game-Specific Scripts    # Game-focused commands
└── Help & Information       # Documentation and help
```

## 🧪 Testing Strategy

### Unit Tests (Vitest)
- **Location**: `src/**/*.test.ts`, `src/**/*.spec.ts`
- **Coverage**: 80% threshold for branches, functions, lines, statements
- **Environment**: jsdom with mocked WebSocket and Canvas APIs

### End-to-End Tests (Playwright)
- **Location**: `tests/*.spec.ts`
- **Browsers**: Chromium, Firefox, WebKit
- **Focus**: Peer connections, environment isolation, multiplayer functionality

### Custom Peer Tests
- **Location**: `scripts/test-peer-connections.js`
- **Purpose**: Test WebSocket connections, environment switching, peer state management
- **Features**: Simulates multiple clients, verifies environment isolation

## 🔧 Configuration Files

- **Vite**: `vite.config.ts` - Build and dev server configuration
- **Vitest**: `vitest.config.ts` - Unit testing configuration
- **Playwright**: `playwright.config.ts` - E2E testing configuration
- **ESLint**: `eslint.config.js` - Linting rules for TypeScript and Vue
- **TypeScript**: `tsconfig.json` - Strict TypeScript configuration

## 🚀 Quick Start

1. **Development**:
   ```bash
   npm run dev:full
   ```

2. **Testing**:
   ```bash
   npm run test:all
   ```

3. **Production**:
   ```bash
   npm run build
   npm run start
   ```

4. **Docker**:
   ```bash
   npm run docker:test
   ```

## 📝 Notes

- All scripts follow the sigma-sockets project conventions
- TypeScript is configured with maximum strictness
- Tests include both unit tests and comprehensive E2E tests
- Peer connection testing ensures environment isolation
- Docker configuration is ready for Render.com deployment
- Scripts are organized with clear categories and comments
