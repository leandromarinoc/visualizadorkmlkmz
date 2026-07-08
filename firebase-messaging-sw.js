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
    console.log('[FCM-SW] Mensagem em background recebida:', payload);

    var notification = payload.notification || {};
    var title = notification.title || 'Inspeção Pro';
    var body  = notification.body  || '';
    var icon  = notification.icon  || './icon.png';
    var tag   = notification.tag   || 'fcm-default';

    var options = {
        body: body,
        icon: icon,
        badge: './icon-192.png',
        tag: tag,
        requireInteraction: false,
        data: payload.data || {}
    };

    return self.registration.showNotification(title, options);
});
