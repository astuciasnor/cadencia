const CACHE_NAME = "cadencia-shell-v12";
const APP_SHELL = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/app.js",
  "./js/app-events.js",
  "./js/app-helpers.js",
  "./js/focus-model.js",
  "./js/phase-sound.js",
  "./js/pwa.js",
  "./js/render-day-plan.js",
  "./js/render-day-progress.js",
  "./js/render-execution.js",
  "./js/render-projects.js",
  "./js/render-summary.js",
  "./js/render-task-rhythm.js",
  "./js/render-tasks.js",
  "./js/storage.js",
  "./js/tasks.js",
  "./js/task-model.js",
  "./js/timer.js",
  "./js/ui-feedback.js",
  "./js/utils.js",
  "./manifest.json",
  "./assets/icon.png",
  "./assets/icon-192.png",
  "./assets/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(handleNavigationRequest(event.request));
    return;
  }

  event.respondWith(handleAssetRequest(event.request, requestUrl));
});

async function handleNavigationRequest(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put("./index.html", response.clone());
    return response;
  } catch (error) {
    const cachedPage = await caches.match("./index.html");
    return cachedPage || Response.error();
  }
}

async function handleAssetRequest(request, requestUrl) {
  if (shouldRefreshFromNetwork(requestUrl)) {
    try {
      const response = await fetch(request);
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
      return response;
    } catch (error) {
      const cachedResponse = await caches.match(request);
      return cachedResponse || Response.error();
    }
  }

  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  return fetch(request);
}

function shouldRefreshFromNetwork(requestUrl) {
  const pathname = requestUrl.pathname || "";

  return pathname.endsWith(".js") ||
    pathname.endsWith(".css") ||
    pathname.endsWith(".json");
}
