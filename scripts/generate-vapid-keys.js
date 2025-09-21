#!/usr/bin/env node

// Generate VAPID keys for push notifications
import webpush from 'web-push';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const vapidKeysPath = join(process.cwd(), 'src', 'server', 'vapid-keys.json');

function generateVapidKeys() {
  console.log('🔑 Generating VAPID keys for push notifications...');
  
  try {
    const vapidKeys = webpush.generateVAPIDKeys();
    
    const keysData = {
      publicKey: vapidKeys.publicKey,
      privateKey: vapidKeys.privateKey,
      generatedAt: new Date().toISOString(),
      subject: 'mailto:admin@babylon-game.dev'
    };
    
    // Ensure directory exists
    const dir = join(process.cwd(), 'src', 'server');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    
    // Write keys to file
    writeFileSync(vapidKeysPath, JSON.stringify(keysData, null, 2));
    
    console.log('✅ VAPID keys generated successfully!');
    console.log('📁 Keys saved to:', vapidKeysPath);
    console.log('🔑 Public Key:', vapidKeys.publicKey);
    console.log('🔐 Private Key:', vapidKeys.privateKey.substring(0, 20) + '...');
    console.log('');
    console.log('⚠️  IMPORTANT: Keep the private key secure and never commit it to version control!');
    console.log('📝 Add vapid-keys.json to your .gitignore file.');
    
    return keysData;
  } catch (error) {
    console.error('❌ Failed to generate VAPID keys:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateVapidKeys();
}

export { generateVapidKeys };
