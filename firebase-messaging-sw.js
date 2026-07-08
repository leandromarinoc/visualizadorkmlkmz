// firebase-messaging-sw.js
// Service Worker dedicado ao Firebase Cloud Messaging (FCM)
// Recebe push notifications quando o app está em background ou fechado

importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: 'AIzaSyDPNVb9FK5rlUtYt0OVb6PXU-APYmp99aw',
    authDomain: 'inspecaopro-1989.firebaseapp.com',
    projectId: 'inspecaopro-1989',
    storageBucket: 'inspecaopro-1989.firebasestorage.app',
    messagingSenderId: '826135664752',
    appId: '1:826135664752:web:e530bb43feac9c29b23cb5'
});

const messaging = firebase.messaging();

// Receber mensagens em background (app fechado ou em segundo plano)
messaging.onBackgroundMessage(function(payload) {
    console.log('[FCM-SW] Mensagem em background recebida:', JSON.stringify(payload));

    var notif = payload.notification || {};
    var data  = payload.data || {};

    // Suporte a mensagens data-only (sem campo notification)
    var title = notif.title || data.title || 'Inspeção Pro';
    var body  = notif.body  || data.body  || data.texto || '';
    var icon  = notif.icon  || './icon.png';
    var tag   = notif.tag   || data.tipo  || 'fcm-bg';

    if (!body) {
        console.log('[FCM-SW] Mensagem sem body — notificação suprimida.');
        return;
    }

    var options = {
        body: body,
        icon: icon,
        badge: './icon-192.png',
        tag: tag,
        requireInteraction: false,
        renotify: true,
        data: data
    };

    console.log('[FCM-SW] Exibindo notificação:', title, body);
    return self.registration.showNotification(title, options);
});

// Handler de clique na notificação background
self.addEventListener('notificationclick', function(event) {
    console.log('[FCM-SW] Notificação clicada:', event.notification.tag);
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            for (var i = 0; i < clientList.length; i++) {
                var client = clientList[i];
                if (client.url.indexOf(self.registration.scope) === 0 && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('./');
            }
        })
    );
});
