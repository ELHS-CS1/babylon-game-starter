// Client-side push notification service
import config from '../config';

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

class PushNotificationClient {
  private vapidPublicKey: string | null = null;
  private subscription: PushSubscription | null = null;
  private userId: string;

  constructor() {
    this.userId = this.generateUserId();
  }

  private generateUserId(): string {
    // Generate a unique user ID for this session
    const stored = localStorage.getItem('babylon-game-user-id');
    if (stored !== null && stored.length > 0) {
      return stored;
    }
    
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('babylon-game-user-id', userId);
    return userId;
  }

  public async initialize(): Promise<boolean> {
    try {
      // Get VAPID public key from server
      await this.fetchVapidPublicKey();
      
      // Subscribe to push notifications
      await this.subscribeToPushNotifications();
      
      return true;
    } catch {
      return false;
    }
  }

  private async fetchVapidPublicKey(): Promise<void> {
    const response = await fetch(`${config.apiBaseUrl}/api/push/vapid-key`);
    if (!response.ok) {
      throw new Error(`Failed to fetch VAPID key: ${response.statusText}`);
    }
    
    const data: unknown = await response.json();
    if (data !== null && data !== undefined && typeof data === 'object' && 'publicKey' in data && typeof data.publicKey === 'string') {
      this.vapidPublicKey = data.publicKey;
    } else {
      throw new Error('Invalid VAPID key response format');
    }
  }

  private async subscribeToPushNotifications(): Promise<void> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }

    if (this.vapidPublicKey === null || this.vapidPublicKey.length === 0) {
      throw new Error('VAPID public key not available');
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;
    
    // Check if already subscribed
    this.subscription = await registration.pushManager.getSubscription();
    
    if (this.subscription) {
      await this.sendSubscriptionToServer();
      return;
    }

    // Subscribe to push notifications
    this.subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
    });
    
    // Send subscription to server
    await this.sendSubscriptionToServer();
  }

  private async sendSubscriptionToServer(): Promise<void> {
    if (!this.subscription) {
      return;
    }

    const p256dhKey = this.subscription.getKey('p256dh');
    const authKey = this.subscription.getKey('auth');
    
    if (!p256dhKey || !authKey) {
      throw new Error('Missing subscription keys');
    }

    const subscriptionData: PushSubscriptionData = {
      endpoint: this.subscription.endpoint,
      keys: {
        p256dh: this.arrayBufferToBase64(p256dhKey),
        auth: this.arrayBufferToBase64(authKey)
      }
    };

    const response = await fetch(`${config.apiBaseUrl}/api/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: this.userId,
        subscription: subscriptionData
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to send subscription: ${response.statusText}`);
    }
  }

  public async unsubscribe(): Promise<boolean> {
    try {
      if (this.subscription) {
        await this.subscription.unsubscribe();
        this.subscription = null;
      }

      // Notify server
      const response = await fetch(`${config.apiBaseUrl}/api/push/subscribe`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: this.userId
        })
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  public getSubscriptionStatus(): {
    isSubscribed: boolean;
    userId: string;
    endpoint: string | null;
  } {
    return {
      isSubscribed: this.subscription !== null,
      userId: this.userId,
      endpoint: this.subscription?.endpoint ?? null
    };
  }

  private urlBase64ToUint8Array(base64String: string): ArrayBuffer {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray.buffer;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i] ?? 0);
    }
    return window.btoa(binary);
  }
}

// Export singleton instance
export const pushNotificationClient = new PushNotificationClient();
