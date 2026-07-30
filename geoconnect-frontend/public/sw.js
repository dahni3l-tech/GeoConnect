self.addEventListener('push', (event) => {
  if (!event.data) {
    return
  }

  let data = {}
  try {
    data = event.data.json()
  } catch {
    data = { title: 'GeoConnect', body: event.data.text() }
  }

  const title = data.title || 'GeoConnect'
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    data: data.data || data,
    requireInteraction: true,
    tag: data.data?.requestId ? `location-request-${data.data.requestId}` : undefined,
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const data = event.notification.data || {}
  const isLocationRequest = data.type === "location_request"

  const url = isLocationRequest
    ? `/location-request?requestId=${data.requestId}&senderId=${data.senderId}&senderUsername=${encodeURIComponent(data.senderUsername || "")}`
    : data.url || "/"

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})
