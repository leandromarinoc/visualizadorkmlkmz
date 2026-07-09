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

        // Normalizar destino: se ausente/undefined, tratar como 'todos'
        const destino = msg.destino || 'todos';
        const remetenteId = msg.remetenteId || '';

        console.log(`[FCM] Nova mensagem — remetenteId: "${remetenteId}", destino: "${destino}", autor: "${msg.autor || ''}"`);

        // Buscar todos os tokens FCM registrados
        const tokensSnap = await admin.firestore().collection('fcm_tokens').get();
        console.log(`[FCM] Total de docs em fcm_tokens: ${tokensSnap.size}`);

        // Determinar destinatários e coletar tokens
        const tokens = [];
        tokensSnap.forEach(doc => {
            const data = doc.data();
            // Pular o remetente (não notificar quem enviou)
            if (doc.id === remetenteId) {
                console.log(`[FCM] Pulando remetente: ${doc.id}`);
                return;
            }
            // Se mensagem privada, só enviar pro destinatário específico
            if (destino !== 'todos' && doc.id !== destino) {
                console.log(`[FCM] Pulando ${doc.id} — mensagem privada para ${destino}`);
                return;
            }
            // Coletar token(s) do documento
            const docTokens = [];
            if (data.token) docTokens.push(data.token);
            if (data.tokens && Array.isArray(data.tokens)) {
                data.tokens.forEach(t => { if (t && !docTokens.includes(t)) docTokens.push(t); });
            }
            console.log(`[FCM] Destinatário ${doc.id} (${data.autor || '?'}): ${docTokens.length} token(s)`);
            tokens.push(...docTokens);
        });

        if (tokens.length === 0) {
            console.log('[FCM] Nenhum destinatário encontrado para a mensagem.');
            return null;
        }

        // Montar corpo da notificação
        const notifTitle = msg.isSistema ? 'Inspeção Pro' : (msg.autor || 'Inspeção Pro');
        const notifBody = msg.isSistema
            ? (msg.texto || '').replace(/<[^>]*>/g, '').substring(0, 100)  // strip HTML
            : (msg.texto || '').substring(0, 100);

        // Remover tokens duplicados
        const uniqueTokens = [...new Set(tokens)];

        // Montar payload multicast — APENAS campo 'data', SEM campo 'notification'.
        // Isso força o browser a passar pelo Service Worker push handler,
        // que monta a notificação com o conteúdo correto (autor + mensagem).
        const message = {
            data: {
                title: notifTitle,
                body: notifBody,
                tipo: msg.tipo || 'chat',
                remetenteId: msg.remetenteId || '',
                destino: msg.destino || 'todos',
                isSistema: msg.isSistema ? 'true' : 'false'
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
