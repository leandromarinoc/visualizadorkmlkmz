# Manual do Usuário - Inspeção Pro

## Sobre o Sistema

O **Inspeção Pro** é um sistema web/PWA desenvolvido para apoiar técnicos e equipes de campo na localização e inspeção de equipamentos elétricos, chaves de manobra, rotas e pontos de poda em redes de distribuição de energia.

### Objetivo Principal
Facilitar o trabalho em campo através de:
- Visualização em mapa de todos os equipamentos
- Localização precisa via GPS
- Comunicação em tempo real entre equipes (radar)
- Cadastro e edição de equipamentos
- Geração de relatórios e documentação

---

## Descrição dos Botões

### 🔄 ATUALIZAR (btnReset)
**Função:** Recarrega o sistema para atualizar para a versão mais recente.

**Quando usar:** Quando houver uma nova versão disponível ou quando precisar limpar o cache do navegador.

---

### 👁️ VISÍVEL (btnVisibilidade)
**Função:** Ativa/desativa o radar de localização em tempo real.

**Quando usar:** - Ative para que sua equipe possa ver sua localização no mapa
- Desative quando não quiser ser rastreado
- Necessário para ver a localização dos colegas

---

### ⚡ ALIM (btnAbreAlim)
**Função:** Abre o painel de filtros de alimentadores.

**Quando usar:** Para filtrar visualização por circuitos específicos, mostrando apenas os equipamentos de determinado alimentador.

---

### 📏 VÃO (btnMedir)
**Função:** Ativa a ferramenta de medição de distâncias no mapa.

**Quando usar:** Para medir distâncias entre pontos, calcular extensão de redes ou verificar vãos.

---

### 📋 LISTAS (btnListaPoda)
**Função:** Abre o painel de pendências de poda.

**Quando usar:** Para visualizar, filtrar e gerenciar todos os pontos de poda cadastrados no sistema.

---

### ⚙️ AJUSTES (btnConfig)
**Função:** Abre as configurações do sistema.

**Quando usar:** Para configurar preferências de visibilidade, chat, notificações e outros ajustes.

---

### 📄 ARQUIVOS (btnAbreArq)
**Função:** Abre o painel de gerenciamento de arquivos.

**Quando usar:** Para importar ou exportar dados em formato GeoJSON, KML, KMZ ou Shapefile.

---

### ✏️ MELHORIA (btnApontarMelhorias)
**Função:** Ativa a ferramenta de desenho/caneta mágica.

**Quando usar:** Para marcar pontos que precisam de melhorias, anotações visuais ou desenhos no mapa.

---

### 🚶 S.VIEW (btnSview)
**Função:** Abre o Street View no centro do mapa.

**Quando usar:** Para visualizar imagens de rua do local, auxiliando na identificação de equipamentos.

---

### 🛰️ MAPA (btnMapaMaior)
**Função:** Alterna entre mapa de ruas e imagem de satélite.

**Quando usar:** Para ter diferentes visualizações do terreno e equipamentos.

---

### 🔖 VERSÃO (btnVersao)
**Função:** Mostra a versão atual do sistema.

**Quando usar:** Para verificar qual versão está instalada no dispositivo.

---

## Funcionalidades Principais

### 1. Radar de Equipes (Visibilidade)
Permite ver em tempo real onde estão os colegas de equipe que também estão com o radar ativado. Útil para:
- Coordenar trabalhos em campo
- Saber quem está próximo
- Evitar deslocamentos desnecessários

### 2. Cadastro de Equipamentos
Possibilita adicionar e editar:
- Chaves de manobra (NA, NF, Fusível, etc.)
- Transformadores
- Postes
- Pontos de poda
- Interligações

### 3. Chat em Tempo Real
Comunicação instantânea entre membros da equipe:
- Mensagens públicas (todos)
- Mensagens privadas (para colega específico)
- Avisos automáticos de sistema

### 4. Mapas Offline
O sistema funciona mesmo sem internet após o primeiro carregamento, pois armazena:
- Tiles de mapa em cache
- Dados dos equipamentos
- Configurações do usuário

### 5. Sincronização Automática
Todos os dados são sincronizados entre dispositivos conectados via MQTT:
- Novos equipamentos aparecem instantaneamente
- Alterações são propagadas em tempo real
- Podas resolvidas são removidas de todos os dispositivos

### 6. Interação com Linhas de Rede (Alimentadores)
Ao navegar pelo mapa, você pode interagir diretamente com as linhas que representam a rede elétrica.

**IMPORTANTE:** Para abrir o balão de opções, é necessário **clicar ou tocar EXATAMENTE sobre a linha** (e não no número ou ícone do equipamento).

O balão branco aberto mostrará as seguintes opções e informações:
- **Editar Cor:** Altere a cor visual do alimentador no mapa para facilitar a identificação.
- **Editar Nome/Número:** Modifique a identificação do alimentador (ex: mudar de AL01 para AL02).
- **Extensão da Rede (KM):** Visualize o tamanho total do trecho do alimentador em quilômetros.
- **Classificação da Área:** O sistema informa se a área do alimentador contém trechos rurais ou se é estritamente urbana.

---

## Dicas de Uso

1. **Sempre ative o GPS** do dispositivo para melhor precisão de localização
2. **Mantenha o radar ativado** durante o trabalho para coordenação com a equipe
3. **Use filtros de alimentador** para focar apenas no circuito de trabalho
4. **Salve frequentemente** ao cadastrar muitos equipamentos
5. **Verifique a versão** periodicamente para manter o sistema atualizado

---

## Suporte

Em caso de dúvidas ou problemas, entre em contato através do WhatsApp disponível no sistema.

---

**Versão do Documento:** 1.0  
**Data:** 19/04/2026  
**Sistema:** Inspeção Pro