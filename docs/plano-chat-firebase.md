# Plano Técnico — Integração Firestore + FCM no Chat do Inspeção Pro

**Data:** 2026-07-08  
**Arquivo principal:** `index.html` (~25.720 linhas)  
**Projeto:** `D:\inspeçãoproparaogithub`

---

## 1. Lista Completa de Funções de Chat (com números de linha)

| Função | Linha | Descrição |
|--------|-------|-----------|
| `carregarChatLocal()` | 3579 | Carrega histórico do `localStorage`, filtra mensagens com mais de 24h |
| `_escHtml(s)` | 3588 | Sanitiza HTML para exibição segura de texto de terceiros |
| `renderizarChat()` | 3590 | Renderiza todas as mensagens no `#listaMensagensChat`; filtra privadas por `meuID` |
| `chatInputAutoResize(el)` | 3615 | Redimensiona o textarea do input até 120px |
| `chatInputKeyDown(event)` | 3620 | Captura Enter (sem Shift) e chama `enviarMensagemChat()` |
| `enviarMensagemChat()` | 3627 | **Ponto de envio principal** — cria objeto mensagem, salva no localStorage, renderiza e publica via MQTT |
| `enviarMensagemSistemaChat(textoHtml)` | 3641 | **Ponto de envio de sistema** — cria mensagem com `isSistema: true`, salva e publica via MQTT |
| `limparChat()` | 3648 | Limpa histórico local (apenas no dispositivo do usuário) |
| `enviarNotificacaoSistema(titulo, corpo)` | 3789 | Exibe notificação nativa via Service Worker (se permissão concedida) |
| `enviarNotificacaoSistemaForcada(titulo, corpo, tag)` | 3801 | Notificação nativa com `requireInteraction: true`; solicita permissão se necessário |
| `atualizarListaChatPrivado()` | 4841 | Atualiza o `<select #chatDestinatario>` com colegas online (últimos 5 min) |
| `toggleChat()` | 10081 | Abre/fecha o painel `#panelChat`; chama `renderizarChat()` ao abrir |

### Chamadas a `enviarMensagemSistemaChat` (ações automáticas)

| Linha | Contexto |
|-------|----------|
| 5054 | Nova poda registrada |
| 5163 | Poda resolvida (com cidade) |
| 5221 | Poda resolvida (sem cidade) |
| 11022 | Chave editada |
| 11060 | Chave removida |
| 11315 | Chave adicionada/editada (função genérica) |
| 11367 | Chave apagada definitivamente |
| 12876–12877 | Comentário adicionado em chave |
| 13206 | Interligação criada |
| 13265 | Interligação removida |
| 13318 | Cor de interligação alterada |
| 25695–25696 | Arquivo KML/KMZ compartilhado apagado |
| 24888 | Defeito na rede apagado (via `clienteMQTT.publish` direto) |
| 25036 | Defeito na rede marcado (via `clienteMQTT.publish` direto) |

---

## 2. Estrutura das Mensagens MQTT (campos JSON)

### Mensagem de Chat (ação `NOVA_MENSAGEM_CHAT`)

```json
{
  "acao": "NOVA_MENSAGEM_CHAT",
  "mensagem": {
    "remetenteId": "abc12345",
    "autor": "Equipe João",
    "texto": "Texto da mensagem (plain text para usuário, HTML para sistema)",
    "timestamp": 1720000000000,
    "destino": "todos | <remetenteId_do_destinatário>",
    "isSistema": false
  }
}
```

**Campos do objeto `mensagem`:**

| Campo | Tipo | Valores | Descrição |
|-------|------|---------|-----------|
| `remetenteId` | string | ID aleatório por sessão | Gerado em `Math.random().toString(36).substring(2, 10)` — **não persiste entre sessões** |
| `autor` | string | `"Equipe X"` ou `"X"` ou `"🤖 AVISO DO SISTEMA"` | Formatado por `getAutorFormatado()` |
| `texto` | string | Plain text (usuário) ou HTML (sistema) | Mensagens de sistema contêm HTML com emojis e tags `<b>`, `<span>` |
| `timestamp` | number | Unix ms (`Date.now()`) | Usado para ordenação e filtragem (24h) |
| `destino` | string | `"todos"` ou `remetenteId` do destinatário | `"todos"` = pública; ID específico = privada |
| `isSistema` | boolean | `true` / `false` | Controla estilo visual e lógica de notificação |

### Outras ações MQTT relevantes (não-chat)

| Ação | Campos principais |
|------|-------------------|
| `PRESENCA_ONLINE` | `remetente`, `autor`, `lng`, `lat`, `cidade` |
| `PRESENCA_APP` | `remetente`, `autor` |
| `SAIU_APP` | `remetente` |
| `PING_SCAN` | `remetente`, `autor` |
| `PONG_SCAN` | `remetente`, `destinatario`, `autor`, `lng`, `lat` |
| `ATUALIZAR_GPS` | `remetente`, `autor`, `lng`, `lat` |
| `NOVA_PODA_V2` | `remetente`, `autor`, `trecho`, `features[]` |
| `RESOLVER_PODA` | `remetente`, `autor`, `podaId` |
| `NOVA_CHAVE` / `EDITAR_CHAVE` | `remetente`, `feature`, `msgChat` |
| `REMOVER_CHAVE` | `remetente`, `nome`, `chaveId`, `alimRef`, `msgChat` |

---

## 3. Topics MQTT Usados para Chat

```
TEMA_MQTT = 'inspecao_pro_podas_bebedouro_oficial'
```

| Tópico | QoS | Retain | Uso |
|--------|-----|--------|-----|
| `inspecao_pro_podas_bebedouro_oficial` | 1 | Não | **Tópico principal** — todas as ações de chat, presença, podas, chaves |
| `inspecao_pro_podas_bebedouro_oficial/poda/#` | 1 | Sim | Podas individuais (retain para novos clientes) |
| `inspecao_pro_podas_bebedouro_oficial/chave/#` | 1 | Sim | Chaves individuais (retain) |
| `inspecao_pro_podas_bebedouro_oficial/comentario/+` | 1 | Sim | Comentários por chave |
| `inspecao_pro_podas_bebedouro_oficial/interligacao/+` | 1 | Sim | Interligações |
| `inspecao_pro_podas_bebedouro_oficial/defeito_rede/+` | 1 | Sim | Defeitos de rede |
| `inspecao_pro_podas_bebedouro_oficial/sistema/bancocap_import` | 1 | Não | Import de bancocap.kmz |

**Broker:** `wss://broker.hivemq.com:8884/mqtt` (público, sem autenticação)

> **Problema crítico:** O broker HiveMQ público é compartilhado com o mundo inteiro. Qualquer pessoa que conheça o tópico pode ler e publicar mensagens. Não há autenticação nem criptografia de payload.

---

## 4. Schema Proposto para Firestore — Collection `chat_mensagens`

### Collection: `chat_mensagens`

```
chat_mensagens/{docId}
```

| Campo | Tipo Firestore | Obrigatório | Descrição |
|-------|---------------|-------------|-----------|
| `remetenteId` | `string` | Sim | ID de sessão do remetente (gerado no cliente) |
| `remetenteUid` | `string` | Não* | UID do Firebase Auth (quando Auth for integrado) |
| `autor` | `string` | Sim | Nome formatado do remetente |
| `texto` | `string` | Sim | Conteúdo da mensagem (plain text ou HTML para sistema) |
| `timestamp` | `Timestamp` | Sim | `firebase.firestore.FieldValue.serverTimestamp()` |
| `timestampCliente` | `number` | Sim | `Date.now()` — para deduplicação MQTT vs Firestore |
| `destino` | `string` | Sim | `"todos"` ou `remetenteId` do destinatário |
| `isSistema` | `boolean` | Sim | `true` para avisos automáticos |
| `mqttDedupeKey` | `string` | Sim | `remetenteId + "_" + timestampCliente` — chave de deduplicação |
| `lido` | `map<string, boolean>` | Não | `{ "userId1": true }` — para marcar leitura futura |
| `tipo` | `string` | Não | `"chat"` / `"sistema"` / `"privada"` — facilita queries |

### Indexes Necessários (Firestore Composite Indexes)

```
Collection: chat_mensagens
Index 1: destino ASC + timestamp ASC   (para buscar mensagens públicas ordenadas)
Index 2: destino ASC + timestamp DESC  (para buscar as N mais recentes)
Index 3: isSistema ASC + timestamp ASC (para filtrar apenas avisos de sistema)
```

### Regras de Segurança Firestore (Firestore Rules)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /chat_mensagens/{docId} {
      // Leitura: qualquer usuário autenticado (ou anônimo por enquanto)
      allow read: if true;
      // Escrita: apenas criar (não editar/apagar mensagens alheias)
      allow create: if request.resource.data.keys().hasAll(['remetenteId', 'autor', 'texto', 'timestamp', 'destino', 'isSistema']);
      allow update, delete: if false;
    }
    // KML files (já existente)
    match /kml_files/{docId} {
      allow read, write: if true;
    }
  }
}
```

---

## 5. Pontos Exatos de Integração — Onde Adicionar `Firestore.add()`

### 5.1 Função `enviarMensagemChat()` — linha 3627

**Localização:** `index.html:3627–3639`

```javascript
// ANTES (atual):
function enviarMensagemChat() {
    const input = document.getElementById('inputChatMsg');
    const texto = input.value.trim();
    if (!texto) return;

    const destino = document.getElementById('chatDestinatario').value;
    const autorNome = getAutorFormatado();
    const novaMensagem = {
        remetenteId: meuID, autor: autorNome, texto: texto,
        timestamp: Date.now(), destino: destino, isSistema: false
    };

    chatMessages.push(novaMensagem);
    localStorage.setItem('inspecao_chat_historico', JSON.stringify(chatMessages));
    renderizarChat();
    if (clienteMQTT && clienteMQTT.connected)
        mqttPublish(TEMA_MQTT, { acao: "NOVA_MENSAGEM_CHAT", mensagem: novaMensagem });
    input.value = '';
    input.style.height = 'auto';
}
```

**Adicionar após `mqttPublish(...)` (linha 3636):**

```javascript
// INTEGRAÇÃO FIRESTORE — salvar mensagem na nuvem
if (window._kmlFirestore) {
    const db = window._kmlFirestore;
    db.collection('chat_mensagens').add({
        remetenteId: novaMensagem.remetenteId,
        autor: novaMensagem.autor,
        texto: novaMensagem.texto,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        timestampCliente: novaMensagem.timestamp,
        destino: novaMensagem.destino,
        isSistema: false,
        tipo: novaMensagem.destino === 'todos' ? 'chat' : 'privada',
        mqttDedupeKey: novaMensagem.remetenteId + '_' + novaMensagem.timestamp
    }).catch(e => console.warn('[Chat-Firestore] erro ao salvar:', e));
}
```

---

### 5.2 Função `enviarMensagemSistemaChat(textoHtml)` — linha 3641

**Localização:** `index.html:3641–3646`

**Adicionar após `mqttPublish(...)` (linha 3645):**

```javascript
// INTEGRAÇÃO FIRESTORE — salvar aviso de sistema na nuvem
if (window._kmlFirestore) {
    const db = window._kmlFirestore;
    db.collection('chat_mensagens').add({
        remetenteId: novaMensagem.remetenteId,
        autor: novaMensagem.autor,
        texto: novaMensagem.texto,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        timestampCliente: novaMensagem.timestamp,
        destino: 'todos',
        isSistema: true,
        tipo: 'sistema',
        mqttDedupeKey: novaMensagem.remetenteId + '_' + novaMensagem.timestamp
    }).catch(e => console.warn('[Chat-Firestore] erro ao salvar sistema:', e));
}
```

---

### 5.3 Defeitos de Rede — linhas 24888 e 25036

Estas duas linhas usam `window.clienteMQTT.publish(...)` diretamente (não passam por `enviarMensagemSistemaChat`). Precisam de integração separada:

- **Linha 24888** — defeito apagado
- **Linha 25036** — defeito marcado

**Padrão a adicionar após cada `window.clienteMQTT.publish(...)` nessas linhas:**

```javascript
if (window._kmlFirestore) {
    window._kmlFirestore.collection('chat_mensagens').add({
        remetenteId: msgChat.remetenteId,
        autor: msgChat.autor,
        texto: msgChat.texto,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        timestampCliente: msgChat.timestamp,
        destino: 'todos',
        isSistema: true,
        tipo: 'sistema',
        mqttDedupeKey: msgChat.remetenteId + '_' + msgChat.timestamp
    }).catch(e => console.warn('[Chat-Firestore] erro defeito:', e));
}
```

---

## 6. Plano para FCM (Firebase Cloud Messaging)

### 6.1 Estado Atual

- **Firebase SDK:** versão `9.23.0` (compat) já carregada — `firebase-app-compat.js`, `firebase-firestore-compat.js`, `firebase-storage-compat.js`
- **Faltando:** `firebase-messaging-compat.js` não está incluído
- **Service Workers:** `sw.js` e `sw-mobile.js` — ambos **obfuscados** (JavaScript ofuscado com array de strings codificadas em base64). Contêm handlers para `push` e `notificationclick` (identificados no código ofuscado pelos padrões de string), mas **não têm suporte a FCM** (sem `importScripts` do Firebase Messaging)
- **Notificações nativas:** já funcionam via `Notification API` e `ServiceWorkerRegistration.showNotification()` — mas apenas quando o app está em primeiro plano ou o SW está ativo

### 6.2 Configuração FCM — Passos

#### Passo 1: Adicionar SDK de Messaging no `index.html`

Após a linha 28 (após `firebase-storage-compat.js`):

```html
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js"></script>
```

#### Passo 2: Inicializar Messaging e Registrar Token

No bloco de inicialização Firebase (após linha 43, dentro do IIFE):

```javascript
// Inicializar FCM
const messaging = firebase.messaging();
window._fcmMessaging = messaging;

// Registrar token FCM (requer VAPID key do Firebase Console)
const VAPID_KEY = 'BG...'; // Obter em: Firebase Console > Project Settings > Cloud Messaging > Web Push certificates

async function registrarTokenFCM() {
    try {
        const token = await messaging.getToken({ vapidKey: VAPID_KEY });
        if (token) {
            console.log('[FCM] Token registrado:', token);
            // Salvar token no Firestore associado ao usuário
            if (window._kmlFirestore) {
                window._kmlFirestore.collection('fcm_tokens').doc(window.meuID || 'anonimo').set({
                    token: token,
                    autor: localStorage.getItem('usuarioIdentificacao') || 'Desconhecido',
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            }
        }
    } catch(e) {
        console.warn('[FCM] Erro ao registrar token:', e);
    }
}

// Solicitar permissão e registrar token
Notification.requestPermission().then(permission => {
    if (permission === 'granted') registrarTokenFCM();
});

// Receber mensagens em primeiro plano
messaging.onMessage((payload) => {
    console.log('[FCM] Mensagem em primeiro plano:', payload);
    const { title, body } = payload.notification || {};
    if (title) enviarNotificacaoSistema(title, body || '');
});
```

#### Passo 3: Atualizar o Service Worker para FCM

O `sw.js` atual é obfuscado e **não pode ser editado diretamente** sem o código-fonte. Criar um novo arquivo `firebase-messaging-sw.js` na raiz do projeto:

```javascript
// firebase-messaging-sw.js
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

// Receber mensagens em background
messaging.onBackgroundMessage((payload) => {
    console.log('[FCM-SW] Mensagem em background:', payload);
    const { title, body, icon, tag } = payload.notification || {};
    return self.registration.showNotification(title || 'Inspeção Pro', {
        body: body || '',
        icon: icon || './icon.png',
        badge: './icon-192.png',
        tag: tag || 'fcm-default',
        requireInteraction: false,
        data: payload.data || {}
    });
});
```

#### Passo 4: Registrar o SW de Messaging

No `index.html`, após o registro do SW atual (buscar por `serviceWorker.register`):

```javascript
// Registrar SW do Firebase Messaging (separado do SW principal)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./firebase-messaging-sw.js', { scope: './' })
        .then(reg => console.log('[FCM-SW] Registrado:', reg.scope))
        .catch(e => console.warn('[FCM-SW] Erro:', e));
}
```

#### Passo 5: Obter VAPID Key

1. Acessar [Firebase Console](https://console.firebase.google.com/project/inspecaopro-1989/settings/cloudmessaging)
2. Ir em **Project Settings > Cloud Messaging > Web Push certificates**
3. Clicar em **Generate key pair** (ou usar existente)
4. Copiar a chave pública (começa com `BG...`)

#### Passo 6: Collection `fcm_tokens` no Firestore

```
fcm_tokens/{userId}
  - token: string (FCM registration token)
  - autor: string (nome do usuário)
  - updatedAt: Timestamp
```

**Regra de segurança adicional:**

```javascript
match /fcm_tokens/{userId} {
    allow read, write: if true; // Simplificado — restringir com Auth futuramente
}
```

---

## 7. Estratégia de Deduplicação MQTT vs FCM

### Problema

Quando um usuário envia uma mensagem:
1. MQTT publica imediatamente para todos online
2. Firestore salva a mensagem
3. FCM pode disparar push para usuários offline
4. Quando o usuário offline volta online, pode receber a mensagem via MQTT **e** via Firestore listener → **duplicata**

### Solução: Campo `mqttDedupeKey`

O campo `mqttDedupeKey = remetenteId + "_" + timestampCliente` é único por mensagem enviada.

#### No receptor MQTT (linha 4466–4504)

Antes de fazer `chatMessages.push(msgSegura)`, verificar se já existe no array local:

```javascript
// Deduplicação: ignorar se já temos esta mensagem (veio do Firestore antes)
const dedupeKey = msg.mensagem.remetenteId + '_' + msg.mensagem.timestamp;
const jaExiste = chatMessages.some(m => 
    m.remetenteId === msg.mensagem.remetenteId && 
    m.timestamp === msg.mensagem.timestamp
);
if (jaExiste) return; // Já processada via Firestore
```

#### No listener Firestore (a criar)

```javascript
// Listener em tempo real do Firestore
window._kmlFirestore.collection('chat_mensagens')
    .where('timestamp', '>', firebase.firestore.Timestamp.fromMillis(Date.now() - 86400000))
    .orderBy('timestamp', 'asc')
    .onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
            if (change.type === 'added') {
                const msg = change.doc.data();
                // Ignorar mensagens próprias (já estão no array local)
                if (msg.remetenteId === meuID) return;
                // Ignorar privadas para outros
                if (msg.destino !== 'todos' && msg.destino !== meuID) return;
                // Deduplicação: verificar se já chegou via MQTT
                const jaExiste = chatMessages.some(m => 
                    m.remetenteId === msg.remetenteId && 
                    m.timestampCliente === msg.timestampCliente
                );
                if (jaExiste) return;
                // Adicionar ao array local
                chatMessages.push({
                    remetenteId: msg.remetenteId,
                    autor: msg.autor,
                    texto: msg.texto,
                    timestamp: msg.timestampCliente || Date.now(),
                    destino: msg.destino,
                    isSistema: msg.isSistema
                });
                localStorage.setItem('inspecao_chat_historico', JSON.stringify(chatMessages));
                renderizarChat();
            }
        });
    });
```

### Fluxo Completo com Deduplicação

```
Usuário A envia mensagem
    │
    ├─► MQTT publish (imediato, para usuários online)
    │       └─► Usuário B (online) recebe via MQTT
    │               └─► Verifica dedupeKey → não existe → adiciona
    │
    ├─► Firestore.add() (assíncrono, ~100-500ms)
    │       └─► Usuário B (online) recebe via onSnapshot
    │               └─► Verifica dedupeKey → JÁ EXISTE → ignora (deduplicado!)
    │
    └─► FCM push (para usuários offline/background)
            └─► Usuário C (offline) recebe push notification
                    └─► Ao abrir o app, Firestore onSnapshot carrega histórico
                            └─► Mensagem aparece normalmente
```

---

## 8. Estado Atual do Firebase no Projeto

| Serviço | Status | Uso Atual |
|---------|--------|-----------|
| Firebase App | ✅ Ativo | Inicializado em `index.html:39-44` |
| Firestore | ✅ Ativo | Collection `kml_files` — metadados de arquivos KML/KMZ compartilhados |
| Storage | ✅ Ativo | Bucket `kml-compartilhados/` — arquivos KML/KMZ |
| Auth | ❌ Não configurado | Não há autenticação — `meuID` é gerado aleatoriamente por sessão |
| Messaging (FCM) | ❌ Não configurado | SDK não incluído, SW sem suporte FCM |
| RTDB | ❌ Não configurado | Não utilizado |

**Configuração Firebase:**
```javascript
apiKey: 'AIzaSyDPNVb9FK5rlUtYt0OVb6PXU-APYmp99aw'
authDomain: 'inspecaopro-1989.firebaseapp.com'
projectId: 'inspecaopro-1989'
storageBucket: 'inspecaopro-1989.firebasestorage.app'
messagingSenderId: '826135664752'
appId: '1:826135664752:web:e530bb43feac9c29b23cb5'
```

---

## 9. Observações Importantes e Riscos

### 9.1 `meuID` não é persistente

O `meuID` é gerado com `Math.random()` a cada sessão (linha 4070). Isso significa:
- Mensagens privadas enviadas para um `remetenteId` específico **não funcionarão** se o destinatário recarregar a página
- Para FCM funcionar corretamente com mensagens privadas, é necessário implementar **Firebase Auth** (pelo menos anônimo) para ter um UID estável

### 9.2 Service Workers Obfuscados

Os arquivos `sw.js` e `sw-mobile.js` estão ofuscados. O código-fonte original não está disponível no repositório. Para adicionar suporte FCM:
- **Opção A (recomendada):** Criar `firebase-messaging-sw.js` separado (conforme Passo 3 acima)
- **Opção B:** Desofuscar e reescrever os SWs (trabalhoso e arriscado)

### 9.3 Broker MQTT Público

O broker `broker.hivemq.com` é público e gratuito. Qualquer pessoa pode:
- Ler todas as mensagens do tópico `inspecao_pro_podas_bebedouro_oficial`
- Publicar mensagens falsas

O Firestore com regras de segurança adequadas resolve parcialmente este problema para o histórico persistido.

### 9.4 Custo Firestore

Com o plano gratuito (Spark):
- 50.000 leituras/dia
- 20.000 escritas/dia
- 20.000 exclusões/dia

Para uma equipe pequena (5-20 usuários), o plano gratuito é suficiente. O listener `onSnapshot` conta como 1 leitura por documento alterado.

---

## 10. Resumo dos Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `index.html` | Modificar | Adicionar SDK FCM (linha ~28), inicializar Messaging, adicionar `Firestore.add()` em `enviarMensagemChat` (linha 3636) e `enviarMensagemSistemaChat` (linha 3645), adicionar listener Firestore |
| `firebase-messaging-sw.js` | Criar (novo) | Service Worker dedicado ao FCM para receber push em background |
| `docs/plano-chat-firebase.md` | Criar | Este documento |

**Linhas de código a modificar no `index.html`:**
- Linha 28: adicionar `<script>` do firebase-messaging-compat
- Linha 43: adicionar inicialização do Messaging
- Linha 3636: adicionar `Firestore.add()` após `mqttPublish` em `enviarMensagemChat`
- Linha 3645: adicionar `Firestore.add()` após `mqttPublish` em `enviarMensagemSistemaChat`
- Linha 24888: adicionar `Firestore.add()` após `clienteMQTT.publish` (defeito apagado)
- Linha 25036: adicionar `Firestore.add()` após `clienteMQTT.publish` (defeito marcado)
- Após `carregarChatLocal()` (linha ~3586): adicionar listener Firestore `onSnapshot`
