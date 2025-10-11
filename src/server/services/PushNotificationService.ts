// Push notification service using VAPID keys
import webpush from 'web-push';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { IncomingMessage, ServerResponse } from 'http';

interface VapidKeys {
  publicKey: string;
  privateKey: string;
  generatedAt: string;
  subject: string;
}

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

// Type guard functions for safe data validation

function isPushSubscription(obj: unknown): obj is PushSubscription {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return false;
  }
  
  if (!('endpoint' in obj) || typeof obj['endpoint'] !== 'string') {
    return false;
  }
  
  if (!('keys' in obj) || obj['keys'] === null || typeof obj['keys'] !== 'object') {
    return false;
  }
  
  const keys = obj['keys'];
  return 'p256dh' in keys && typeof keys['p256dh'] === 'string' &&
         'auth' in keys && typeof keys['auth'] === 'string';
}

function isNotificationPayload(obj: unknown): obj is NotificationPayload {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return false;
  }
  
  if (!('title' in obj) || typeof obj['title'] !== 'string') {
    return false;
  }
  
  if (!('body' in obj) || typeof obj['body'] !== 'string') {
    return false;
  }
  
  // Optional properties
  if ('icon' in obj && obj['icon'] !== undefined && typeof obj['icon'] !== 'string') {
    return false;
  }
  
  if ('badge' in obj && obj['badge'] !== undefined && typeof obj['badge'] !== 'string') {
    return false;
  }
  
  if ('data' in obj && obj['data'] !== undefined && (obj['data'] === null || typeof obj['data'] !== 'object')) {
    return false;
  }
  
  if ('actions' in obj && obj['actions'] !== undefined && !Array.isArray(obj['actions'])) {
    return false;
  }
  
  return true;
}

class PushNotificationService {
  private vapidKeys: VapidKeys | null = null;
  private subscriptions: Map<string, PushSubscription> = new Map();

  constructor() {
    this.loadVapidKeys();
    this.setupWebPush();
  }

  private loadVapidKeys(): void {
    try {
      const vapidKeysPath = join(process.cwd(), 'src', 'server', 'vapid-keys.json');
      const keysData = readFileSync(vapidKeysPath, 'utf8');
      const keysDataParsed: unknown = JSON.parse(keysData);
      if (keysDataParsed !== null && keysDataParsed !== undefined && typeof keysDataParsed === 'object' && 'publicKey' in keysDataParsed && 'privateKey' in keysDataParsed) {
        this.vapidKeys = {
          publicKey: typeof keysDataParsed.publicKey === 'string' ? keysDataParsed.publicKey : '',
          privateKey: typeof keysDataParsed.privateKey === 'string' ? keysDataParsed.privateKey : '',
          generatedAt: new Date().toISOString(),
          subject: 'mailto:admin@example.com'
        };
      }
    } catch {
      // VAPID keys not available
    }
  }

  private setupWebPush(): void {
    if (this.vapidKeys === null) {
      return;
    }

    webpush.setVapidDetails(
      this.vapidKeys.subject,
      this.vapidKeys.publicKey,
      this.vapidKeys.privateKey
    );
  }

  public getPublicKey(): string | null {
    return this.vapidKeys?.publicKey ?? null;
  }

  public async subscribeUser(userId: string, subscription: PushSubscription): Promise<boolean> {
    try {
      this.subscriptions.set(userId, subscription);
      return true;
    } catch {
      return false;
    }
  }

  public async unsubscribeUser(userId: string): Promise<boolean> {
    try {
      const removed = this.subscriptions.delete(userId);
      return removed;
    } catch {
      return false;
    }
  }

  public async sendNotificationToUser(userId: string, payload: NotificationPayload): Promise<boolean> {
    const subscription = this.subscriptions.get(userId);
    if (!subscription) {
      return false;
    }

    try {
      const notificationPayload = JSON.stringify(payload);
      await webpush.sendNotification(subscription, notificationPayload);
      return true;
    } catch (error) {
      // Remove invalid subscription
      if (error instanceof Error && error.message.includes('410')) {
        this.subscriptions.delete(userId);
      }
      
      return false;
    }
  }

  public async sendNotificationToAll(payload: NotificationPayload): Promise<number> {
    let successCount = 0;
    const promises: Promise<boolean>[] = [];

    for (const [userId] of this.subscriptions) {
      promises.push(this.sendNotificationToUser(userId, payload));
    }

    const results = await Promise.allSettled(promises);
    
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        successCount++;
      }
    }

    return successCount;
  }

  public getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  public async handleSubscriptionRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    if (req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += String(chunk);
      });

      req.on('end', async () => {
        try {
          const data: unknown = JSON.parse(body);
          if (data === null || data === undefined || typeof data !== 'object') {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Invalid request data' }));
            return;
          }
          
          const dataObj = data as Record<string, unknown>;
          if (dataObj['userId'] === null || dataObj['userId'] === undefined || dataObj['subscription'] === null || dataObj['subscription'] === undefined) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing userId or subscription' }));
            return;
          }

          const userId = typeof dataObj['userId'] === 'string' ? dataObj['userId'] : '';
          
          if (!isPushSubscription(dataObj['subscription'] as Record<string, unknown>)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid subscription data' }));
            return;
          }
          
          const success = await this.subscribeUser(userId, dataObj['subscription'] as PushSubscription);
          res.writeHead(success ? 200 : 500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success }));
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });
    } else if (req.method === 'DELETE') {
      let body = '';
      req.on('data', (chunk) => {
        body += String(chunk);
      });

      req.on('end', async () => {
        try {
          const data: unknown = JSON.parse(body);
          if (data === null || data === undefined || typeof data !== 'object') {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid request data' }));
            return;
          }
          
          const dataObj2 = data as Record<string, unknown>;
          if (dataObj2['userId'] === null || dataObj2['userId'] === undefined || dataObj2['userId'] === '') {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing userId' }));
            return;
          }

          const userId = typeof dataObj2['userId'] === 'string' ? dataObj2['userId'] : '';
          const success = await this.unsubscribeUser(userId);
          
          res.writeHead(success ? 200 : 404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success }));
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });
    } else {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method not allowed' }));
    }
  }

  public async handleNotificationRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    let body = '';
    req.on('data', (chunk) => {
      body += String(chunk);
    });

    req.on('end', async () => {
        try {
          const data: unknown = JSON.parse(body);
          if (data === null || data === undefined || typeof data !== 'object') {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid request data' }));
            return;
          }
          
          const dataObj3 = data as Record<string, unknown>;
          if (dataObj3['payload'] === null || dataObj3['payload'] === undefined) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing payload' }));
            return;
          }

          let successCount: number;
          
          if (dataObj3['userId'] !== null && dataObj3['userId'] !== undefined && dataObj3['userId'] !== '') {
            const userId = typeof dataObj3['userId'] === 'string' ? dataObj3['userId'] : '';
            
            if (!isNotificationPayload(dataObj3['payload'] as unknown)) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Invalid payload data' }));
              return;
            }
            
            const success = await this.sendNotificationToUser(userId, dataObj3['payload'] as NotificationPayload);
            successCount = success ? 1 : 0;
          } else {
            if (!isNotificationPayload(dataObj3['payload'] as unknown)) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Invalid payload data' }));
              return;
            }

            successCount = await this.sendNotificationToAll(dataObj3['payload'] as NotificationPayload);
          }
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: true, 
            sentTo: successCount,
            totalSubscribers: this.getSubscriptionCount()
          }));
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
    });
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();
