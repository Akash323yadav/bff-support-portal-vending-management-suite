self.addEventListener('install', (event) => {
    self.skipWaiting();
    console.log('SW: Installed');
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
    console.log('SW: Activated');
});

self.addEventListener('push', function (event) {
    let data = {
        title: "BFF Support",
        body: "New message received",
        url: "/",
        icon: '/logo.png',
        badge: '/logo.png',
        image: null,
        tag: 'bff-chat'
    };

    if (event.data) {
        try {
            const receivedData = event.data.json();
            data = { ...data, ...receivedData };
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: data.icon || '/logo.png',
        badge: data.badge || '/logo.png',
        image: data.image,
        vibrate: [200, 100, 200],
        tag: data.tag || 'bff-chat',
        renotify: true,
        data: {
            url: data.url || '/'
        },
        actions: [
            { action: 'open', title: 'View Message', icon: '/logo.png' },
            { action: 'close', title: 'Dismiss' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', function (event) {
    const action = event.action;

    if (action === 'close') {
        event.notification.close();
        return;
    }

    event.notification.close();

    // Ensure we have a valid URL
    let urlToOpen = '/';
    if (event.notification.data && event.notification.data.url) {
        urlToOpen = event.notification.data.url;
    }

    // Convert relative URL to absolute
    const targetUrl = new URL(urlToOpen, self.location.origin).href;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            // Check if there is already a window open with this URL
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                // Check if current client URL matches target URL
                if (client.url === targetUrl && 'focus' in client) {
                    return client.focus();
                }
            }

            // Check if there is any window open that we can just navigate/focus
            // This is especially useful for PWAs where the root might be open
            if (windowClients.length > 0) {
                const client = windowClients[0];
                if ('focus' in client) {
                    client.focus();
                    if ('navigate' in client) {
                        return client.navigate(targetUrl);
                    }
                }
            }

            // If no window is open, open a new one
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        }).catch(err => {
            console.error("Notification click navigation failed:", err);
            // Fallback: just try to open the window if everything else fails
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
