$fcmCode = @"

// === FCM Background Handler ===
try {
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

    var fcmMessaging = firebase.messaging();

    fcmMessaging.onBackgroundMessage(function(payload) {
        console.log('[FCM-SW] Background message:', payload);
        var n = payload.notification || {};
        var d = payload.data || {};
        var title = n.title || d.title || 'Inspeção Pro';
        var body = n.body || d.body || '';
        return self.registration.showNotification(title, {
            body: body,
            icon: './icon.png',
            badge: './icon-192.png',
            tag: 'fcm-chat-' + Date.now(),
            renotify: true,
            data: d
        });
    });
    console.log('[FCM-SW] Firebase Messaging integrado ao SW principal');
} catch(e) {
    console.warn('[FCM-SW] Erro ao inicializar FCM no SW:', e);
}
"@

Add-Content -Path 'D:\inspeçãoproparaogithub\sw.js' -Value $fcmCode -Encoding UTF8
Write-Host "FCM code appended to sw.js"
