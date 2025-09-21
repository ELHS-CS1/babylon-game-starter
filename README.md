# Babylon.js Multiplayer Game

A multiplayer 3D game built with Babylon.js, Vue 3, Vuetify, and WebSocket for real-time communication.

## Features

- **3D Multiplayer Game**: Real-time multiplayer gameplay with Babylon.js
- **Environment Switching**: Multiple game environments (levelTest, islandTown, joyTown, mansion, firefoxReality)
- **Peer Management**: Track and manage multiple players in the same environment
- **Modern UI**: Vue 3 with Vuetify for a beautiful, responsive interface
- **TypeScript**: Strict TypeScript configuration for type safety
- **Docker Ready**: Containerized for easy deployment on Render.com

## Project Structure

```
├── assets/                 # Game assets (models, textures, sounds)
├── playground.ts          # Original Babylon.js playground template
├── src/
│   ├── client/            # Vue 3 frontend application
│   │   ├── game/          # Game engine and peer management
│   │   ├── App.vue        # Main Vue component
│   │   └── main.ts        # Vue application entry point
│   └── server/            # Node.js backend server
│       └── index.ts       # WebSocket server and API
├── Dockerfile             # Docker configuration
├── render.yaml           # Render.com deployment config
└── package.json          # Dependencies and scripts
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm 9+

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Start the development server:
```bash
npm run dev
```

This will start:
- WebSocket server on port 3001
- Vite dev server on port 3000

### Building

Build for production:
```bash
npm run build
```

### Testing

Run tests:
```bash
npm test
```

## Game Controls

- **WASD** or **Arrow Keys**: Move character
- **Mouse**: Look around (click canvas to enable pointer lock)
- **Environment Selector**: Switch between different game environments

## Multiplayer Features

- **Real-time Updates**: Player positions and movements are synchronized in real-time
- **Environment Isolation**: Only players in the same environment can see each other
- **Peer Management**: Automatic peer discovery and cleanup
- **WebSocket Communication**: Low-latency real-time communication

## Deployment

### Docker

Build and run with Docker:
```bash
npm run docker:build
npm run docker:run
```

### Render.com

The project is configured for deployment on Render.com:
- Uses Docker for containerization
- Configured with `render.yaml`
- Health check endpoint at `/health`
- Environment variables for configuration

## Environment Variables

- `PORT`: Server port (default: 10000)
- `WS_PORT`: WebSocket port (default: 3001)
- `WS_HOST`: WebSocket host (default: localhost)
- `NODE_ENV`: Environment (development/production)

## Technologies Used

- **Frontend**: Vue 3, Vuetify 3.9.0, TypeScript
- **3D Engine**: Babylon.js 6.0
- **Backend**: Node.js, WebSocket
- **Build Tool**: Vite
- **Testing**: Vitest
- **Deployment**: Docker, Render.com

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - see LICENSE file for details