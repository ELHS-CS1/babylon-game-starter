#!/usr/bin/env node

// Test script for push notifications
import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:3000';

async function testPushNotifications() {
  console.log('🧪 Testing Push Notification System...\n');

  try {
    // Test 1: Get VAPID public key
    console.log('1️⃣ Testing VAPID public key endpoint...');
    const vapidResponse = await fetch(`${API_BASE_URL}/api/push/vapid-key`);
    
    if (vapidResponse.ok) {
      const vapidData = await vapidResponse.json();
      console.log('✅ VAPID public key retrieved:', vapidData.publicKey.substring(0, 20) + '...');
    } else {
      console.log('❌ Failed to get VAPID key:', vapidResponse.statusText);
      return;
    }

    // Test 2: Send test notification
    console.log('\n2️⃣ Testing push notification endpoint...');
    const notificationResponse = await fetch(`${API_BASE_URL}/api/push/notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        payload: {
          title: '🧪 Test Notification',
          body: 'This is a test notification from the Babylon Game server!',
          icon: '/icons/sigma-logo-192.png',
          badge: '/icons/sigma-logo-64.png',
          data: {
            type: 'test',
            timestamp: Date.now()
          }
        }
      })
    });

    if (notificationResponse.ok) {
      const notificationData = await notificationResponse.json();
      console.log('✅ Test notification sent successfully');
      console.log(`📊 Sent to: ${notificationData.sentTo}/${notificationData.totalSubscribers} subscribers`);
    } else {
      console.log('❌ Failed to send test notification:', notificationResponse.statusText);
    }

    // Test 3: Check server health
    console.log('\n3️⃣ Testing server health...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Server is healthy');
      console.log(`👥 Active peers: ${healthData.peers}`);
      console.log(`🌍 Environment: ${healthData.environment}`);
    } else {
      console.log('❌ Server health check failed:', healthResponse.statusText);
    }

    console.log('\n🎉 Push notification system test completed!');
    console.log('\n📱 To test on mobile:');
    console.log('1. Open the app in a mobile browser');
    console.log('2. Install the PWA when prompted');
    console.log('3. Allow notifications when requested');
    console.log('4. Open another browser tab and join the game');
    console.log('5. You should receive a push notification on your phone!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the server is running with: npm run dev:full');
  }
}

// Run the test
testPushNotifications();
