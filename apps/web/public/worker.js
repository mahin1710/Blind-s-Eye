self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  /** @type {Request} */
  const request = event.request;
  if (request.method === "GET" && request.url.includes("/speak")) {
    const originalUrl = request.url;
    const url = new URL(request.url);
    
    event.respondWith(
      fetch(url.toString(), {
        method: "POST",
      }).then((networkResponse) => {
        if (
          !networkResponse ||
          !networkResponse.ok ||
          request.headers.get("range") === "bytes=0-1"
        ) {
          return networkResponse;
        }

        const responseClone = networkResponse.clone();

        self.clients.matchAll({ includeUncontrolled: true }).then((clients) => {
          responseClone.blob().then((blob) => {
            clients.forEach((client) => {
              client.postMessage({
                type: "ADD_TO_CACHE",
                url: originalUrl,
                blob: blob,
              });
            });
          });
        });

        return networkResponse;
      })
    );
  }
});