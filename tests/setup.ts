import { beforeEach, afterEach } from 'vitest';

// Mock WebSocket for unit tests
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  url: string;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    // Simulate connection after a short delay
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 10);
  }

  send(data: string) {
    // Mock send functionality
    console.log('Mock WebSocket send:', data);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }
}

// Mock fetch for API calls
(global as any).fetch = (global as any).vi.fn();

// Mock WebSocket
(global as any).WebSocket = MockWebSocket as any;

// Mock Canvas and WebGL for Babylon.js
const mockCanvas = {
  getContext: (global as any).vi.fn(() => ({
    fillRect: (global as any).vi.fn(),
    clearRect: (global as any).vi.fn(),
    getImageData: (global as any).vi.fn(() => ({ data: new Array(4) })),
    putImageData: (global as any).vi.fn(),
    createImageData: (global as any).vi.fn(() => ({ data: new Array(4) })),
    setTransform: (global as any).vi.fn(),
    drawImage: (global as any).vi.fn(),
    save: (global as any).vi.fn(),
    fillText: (global as any).vi.fn(),
    restore: (global as any).vi.fn(),
    beginPath: (global as any).vi.fn(),
    moveTo: (global as any).vi.fn(),
    lineTo: (global as any).vi.fn(),
    closePath: (global as any).vi.fn(),
    stroke: (global as any).vi.fn(),
    translate: (global as any).vi.fn(),
    scale: (global as any).vi.fn(),
    rotate: (global as any).vi.fn(),
    arc: (global as any).vi.fn(),
    fill: (global as any).vi.fn(),
    measureText: (global as any).vi.fn(() => ({ width: 0 })),
    transform: (global as any).vi.fn(),
    rect: (global as any).vi.fn(),
    clip: (global as any).vi.fn(),
  })),
  width: 800,
  height: 600,
  style: {},
  addEventListener: (global as any).vi.fn(),
  removeEventListener: (global as any).vi.fn(),
  dispatchEvent: (global as any).vi.fn(),
};

// Mock HTMLCanvasElement
Object.defineProperty(global, 'HTMLCanvasElement', {
  value: class HTMLCanvasElement {
    constructor() {
      return mockCanvas;
    }
  },
});

// Mock requestAnimationFrame
(global as any).requestAnimationFrame = (global as any).vi.fn((cb: any) => {
  return setTimeout(cb, 16);
});

(global as any).cancelAnimationFrame = (global as any).vi.fn((id: any) => {
  clearTimeout(id);
});

// Mock performance
(global as any).performance = {
  now: (global as any).vi.fn(() => Date.now()),
} as any;

// Mock ResizeObserver
(global as any).ResizeObserver = (global as any).vi.fn().mockImplementation(() => ({
  observe: (global as any).vi.fn(),
  unobserve: (global as any).vi.fn(),
  disconnect: (global as any).vi.fn(),
}));

// Mock IntersectionObserver
(global as any).IntersectionObserver = (global as any).vi.fn().mockImplementation(() => ({
  observe: (global as any).vi.fn(),
  unobserve: (global as any).vi.fn(),
  disconnect: (global as any).vi.fn(),
}));

// Setup and teardown for each test
beforeEach(() => {
  // Clear all mocks before each test
  (global as any).vi.clearAllMocks();
  
  // Reset fetch mock
  (global.fetch as any).mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  });
});

afterEach(() => {
  // Clean up after each test
  (global as any).vi.clearAllTimers();
});
