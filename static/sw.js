// Service Worker placeholder
// Questo file previene errori 404 per /sw.js
// PWA features possono essere implementate in futuro

self.addEventListener('install', function(event) {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function(event) {
  // Pass through - non interceptiamo fetch per ora
});