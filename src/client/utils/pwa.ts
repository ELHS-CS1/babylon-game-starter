// PWA registration and management utilities
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Type guard function for BeforeInstallPromptEvent
function isBeforeInstallPromptEvent(event: unknown): event is BeforeInstallPromptEvent {
  if (event === null || event === undefined || typeof event !== 'object') {
    return false;
  }
  
  // Check if event has the required properties
  if (!('prompt' in event) || !('userChoice' in event)) {
    return false;
  }
  
  // Use Object.prototype.hasOwnProperty to safely access properties
  const eventObj = Object.prototype.hasOwnProperty.call(event, 'prompt') && Object.prototype.hasOwnProperty.call(event, 'userChoice') ? event : null;
  
  if (eventObj === null) {
    return false;
  }
  
  // Check if prompt is a function using bracket notation
  const promptValue = eventObj['prompt'];
  if (typeof promptValue !== 'function') {
    return false;
  }
  
  // Check if userChoice exists and is not null/undefined
  const userChoiceValue = eventObj['userChoice'];
  if (userChoiceValue === null || userChoiceValue === undefined) {
    return false;
  }
  
  return true;
}



class PWAManager {
  private registration: ServiceWorkerRegistration | null = null;
  private isInstalled = false;
  private isOnline = true;

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Listen for beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      Object.assign(window, { deferredPrompt: event });
    });

    // Listen for appinstalled
    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      Object.assign(window, { deferredPrompt: null });
    });
  }

  public async registerServiceWorker(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      // Handle updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.showUpdateNotification();
            }
          });
        }
      });

      return true;
    } catch {
      return false;
    }
  }

  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch {
      return 'denied';
    }
  }

  public async showInstallPrompt(): Promise<boolean> {
    const deferredPrompt: unknown = Object.getOwnPropertyDescriptor(window, 'deferredPrompt')?.value;
    
    if (!isBeforeInstallPromptEvent(deferredPrompt)) {
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      return choiceResult.outcome === 'accepted';
    } catch {
      return false;
    }
  }

  public async sendNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (Notification.permission !== 'granted') {
      return;
    }

    try {
      const notification = new Notification(title, {
        icon: '/icons/sigma-logo-192.png',
        badge: '/icons/sigma-logo-64.png',
        ...options
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch {
      // Notification failed
    }
  }

  public async updateServiceWorker(): Promise<void> {
    if (!this.registration) {
      return;
    }

    try {
      await this.registration.update();
    } catch {
      // Update failed
    }
  }

  public getInstallabilityStatus(): {
    canInstall: boolean;
    isInstalled: boolean;
    isOnline: boolean;
  } {
    const deferredPrompt: unknown = Object.getOwnPropertyDescriptor(window, 'deferredPrompt')?.value;
    return {
      canInstall: isBeforeInstallPromptEvent(deferredPrompt),
      isInstalled: this.isInstalled,
      isOnline: this.isOnline
    };
  }

  private showUpdateNotification(): void {
    // For now, just reload. In a real app, you might show a toast or modal
    if (window.confirm('A new version of the app is available. Refresh to update?')) {
      window.location.reload();
    }
  }

  public async subscribeToPushNotifications(vapidPublicKey: string): Promise<PushSubscription | null> {
    if (!this.registration) {
      return null;
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
      });

      return subscription;
    } catch {
      return null;
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

// Export singleton instance
export const pwaManager = new PWAManager();

// Export types for use in other files
export type { BeforeInstallPromptEvent, ServiceWorkerRegistration };
