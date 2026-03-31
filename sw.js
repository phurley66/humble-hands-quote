/* ============================================
   HUMBLE HANDS — SERVICE WORKER
   Makes the PWA installable and provides
   basic offline caching
   ============================================ */

// Version number — change this when you update your app
// so the browser knows to download fresh files
const CACHE_NAME = "humble-hands-quote-v1";

// List of files to cache for offline use
const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./style.css",
    "./script.js",
    "./manifest.json",
    "./images/logo.png",
    "./images/icon-192.png",
    "./images/icon-512.png"
];

// =============================================
// INSTALL EVENT
// Runs when the service worker is first installed
// Downloads and caches all the files listed above
// =============================================
self.addEventListener("install", function(event) {
    console.log("[Service Worker] Installing...");
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(function(cache) {
            console.log("[Service Worker] Caching app files");
            return cache.addAll(FILES_TO_CACHE);
        })
        .then(function() {
            // Force the new service worker to activate immediately
            return self.skipWaiting();
        })
    );
});

// =============================================
// ACTIVATE EVENT
// Runs when the service worker takes control
// Cleans up old caches from previous versions
// =============================================
self.addEventListener("activate", function(event) {
    console.log("[Service Worker] Activating...");
    event.waitUntil(
        caches.keys()
        .then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    // Delete any caches that don't match the current version
                    if (cacheName !== CACHE_NAME) {
                        console.log("[Service Worker] Deleting old cache:", cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
        .then(function() {
            // Take control of all pages immediately
            return self.clients.claim();
        })
    );
});

// =============================================
// FETCH EVENT
// Intercepts network requests
// Tries network first, falls back to cache
// =============================================
self.addEventListener("fetch", function(event) {
    // Don't cache the Google Apps Script requests
    // Those MUST go to the network to write to your sheet
    if (event.request.url.includes("script.google.com")) {
        event.respondWith(fetch(event.request));
        return;
    }

    // For everything else: try network first, fall back to cache
    event.respondWith(
        fetch(event.request)
        .then(function(response) {
            // If we got a good response, cache it for later
            if (response.status === 200) {
                var responseClone = response.clone();
                caches.open(CACHE_NAME)
                .then(function(cache) {
                    cache.put(event.request, responseClone);
                });
            }
            return response;
        })
        .catch(function() {
            // Network failed — try to serve from cache
            return caches.match(event.request);
        })
    );
});