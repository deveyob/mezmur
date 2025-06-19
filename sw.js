const CACHE_NAME = "humble-melody-v1"
const urlsToCache = ["/", "/index.html", "/manifest.json", "/icon-192x192.png", "/icon-512x512.png"]

// Install event - cache resources
self.addEventListener("install", (event) => {
  console.log("Humble Melody: Install event")
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Humble Melody: Caching files")
        return cache.addAll(urlsToCache)
      })
      .then(() => {
        console.log("Humble Melody: All files cached")
        return self.skipWaiting()
      }),
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Humble Melody: Activate event")
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("Humble Melody: Deleting old cache:", cacheName)
              return caches.delete(cacheName)
            }
          }),
        )
      })
      .then(() => {
        console.log("Humble Melody: Claiming clients")
        return self.clients.claim()
      }),
  )
})

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  console.log("Humble Melody: Fetch event for:", event.request.url)

  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          console.log("Humble Melody: Serving from cache:", event.request.url)
          return response
        }

        console.log("Humble Melody: Fetching from network:", event.request.url)
        return fetch(event.request).then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response
          }

          // Clone the response
          const responseToCache = response.clone()

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })

          return response
        })
      })
      .catch(() => {
        // Return offline page or default response
        console.log("Humble Melody: Network request failed, serving offline content")
        if (event.request.destination === "document") {
          return caches.match("/index.html")
        }
      }),
  )
})

// Push notification event
self.addEventListener("push", (event) => {
  console.log("Humble Melody: Push event received")

  const options = {
    body: event.data ? event.data.text() : "Default notification body",
    icon: "/icon-192x192.png",
    badge: "/icon-72x72.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "Open App",
        icon: "/icon-192x192.png",
      },
      {
        action: "close",
        title: "Close",
        icon: "/icon-192x192.png",
      },
    ],
  }

  event.waitUntil(self.registration.showNotification("Humble Melody Notification", options))
})

// Notification click event
self.addEventListener("notificationclick", (event) => {
  console.log("Humble Melody: Notification click received")

  event.notification.close()

  if (event.action === "explore") {
    event.waitUntil(
      clients.matchAll().then((clientList) => {
        if (clientList.length > 0) {
          return clientList[0]
            .focus()
            .then(() => {
              return clientList[0].navigate("https://humblemelody.com/")
            })
            .catch(() => {
              return clients.openWindow("https://humblemelody.com/")
            })
        } else {
          return clients.openWindow("https://humblemelody.com/")
        }
      }),
    )
  } else if (event.action === "close") {
    console.log("Humble Melody: Notification closed by user")
  } else {
    // Default action - open the main website
    event.waitUntil(
      clients.matchAll().then((clientList) => {
        if (clientList.length > 0) {
          return clientList[0]
            .focus()
            .then(() => {
              return clientList[0].navigate("https://humblemelody.com/")
            })
            .catch(() => {
              return clients.openWindow("https://humblemelody.com/")
            })
        } else {
          return clients.openWindow("https://humblemelody.com/")
        }
      }),
    )
  }
})

// Background sync event (for future use)
self.addEventListener("sync", (event) => {
  console.log("Humble Melody: Background sync event")

  if (event.tag === "background-sync") {
    event.waitUntil(
      // Perform background sync operations
      console.log("Humble Melody: Performing background sync"),
    )
  }
})

// Message event - communication with main thread
self.addEventListener("message", (event) => {
  console.log("Humble Melody: Message received:", event.data)

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})
