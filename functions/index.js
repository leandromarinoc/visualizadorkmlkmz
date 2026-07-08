const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

/**
 * onChatMessage — disparado quando um novo documento é criado em chat_mensagens.
 * Envia push FCM para todos os destinatários relevantes.
 */
exports.onChatMessage = functions.firestore
    .document('chat_mensagens/{messageId}')
    .onCreate(async (snap, context) => {
        const msg = snap.data();

        // Buscar todos os tokens FCM registrados
        const tokensSnap = await admin.firestore().collection('fcm_tokens').get();

        // Determinar destinatários e coletar tokens
        const tokens = [];
        tokensSnap.forEach(doc => {
            const data = doc.data();
            // Pular o remetente (não notificar quem enviou)
            if (doc.id === msg.remetenteId) return;
            // Se mensagem privada, só enviar pro destinatário específico
            if (msg.destino !== 'todos' && doc.id !== msg.destino) return;
            // Coletar token(s) do documento
            if (data.token) tokens.push(data.token);
            if (data.tokens && Array.isArray(data.tokens)) {
                tokens.push(...data.tokens);
            }
        });

        if (tokens.length === 0) {
            console.log('[FCM] Nenhum destinatário encontrado para a mensagem.');
            return null;
        }

        // Montar notificação
        const notification = {
            title: msg.isSistema ? 'Inspeção Pro' : `${msg.autor}`,
            body: msg.isSistema
                ? (msg.texto || '').replace(/<[^>]*>/g, '').substring(0, 100)  // strip HTML
                : (msg.texto || '').substring(0, 100)
        };

        // Remover tokens duplicados
        const uniqueTokens = [...new Set(tokens)];

        // Montar payload multicast
        const message = {
            notification: notification,
            data: {
                tipo: msg.tipo || 'chat',
                remetenteId: msg.remetenteId || '',
                destino: msg.destino || 'todos'
            },
            tokens: uniqueTokens
        };

        // Enviar para todos os tokens
        const response = await admin.messaging().sendEachForMulticast(message);

        // Identificar tokens inválidos para limpeza
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
            if (!resp.success && resp.error) {
                const code = resp.error.code;
                if (
                    code === 'messaging/invalid-registration-token' ||
                    code === 'messaging/registration-token-not-registered'
                ) {
                    failedTokens.push(uniqueTokens[idx]);
                }
            }
        });

        // Remover tokens inválidos do Firestore (cleanup automático)
        if (failedTokens.length > 0) {
            console.log(`[FCM] Removendo ${failedTokens.length} token(s) inválido(s).`);
            const batch = admin.firestore().batch();
            tokensSnap.forEach(doc => {
                const data = doc.data();
                if (data.token && failedTokens.includes(data.token)) {
                    batch.delete(doc.ref);
                }
            });
            await batch.commit();
        }

        console.log(`[FCM] Enviado para ${response.successCount}/${uniqueTokens.length} dispositivo(s). Falhas: ${response.failureCount}`);
        return null;
    });
