// Minimal placeholder service worker to satisfy requests to /firebase-messaging-sw.js
// This file intentionally keeps behaviour small — replace with your FCM service worker if you use push.

self.addEventListener('install', (event) => {
  // Activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Optional: basic push handler (no-op)
self.addEventListener('push', (event) => {
  // If your project uses Firebase Cloud Messaging, replace this with your notification display logic.
  const data = event.data ? event.data.text() : 'QOOA notification';
  const title = 'QOOA';
  event.waitUntil(self.registration.showNotification(title, { body: data }));
});
