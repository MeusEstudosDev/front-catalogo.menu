# WhatsApp Web Service - Múltiplos Números

## 📱 Visão Geral

Este serviço agora suporta **múltiplos números de WhatsApp por business**. Cada business pode conectar vários números identificados por um `phoneIdentifier` único.

## 🔑 Conceitos

### Session Key

Cada sessão WhatsApp é identificada por uma chave única no formato:

```
{businessId}:{phoneIdentifier}
```

**Exemplos:**

- `business-123:default` - Número padrão do business 123
- `business-123:vendas` - Número de vendas do business 123
- `business-123:suporte` - Número de suporte do business 123

### Phone Identifier

- Parâmetro opcional em todas as rotas
- Se não especificado, usa `'default'`
- Permite identificar qual número do WhatsApp usar
- Pode ser qualquer string (ex: 'vendas', 'suporte', 'atendimento1', etc)

## 🚀 Como Usar

### 1. Obter QR Code para Conectar

**Conectar o número padrão:**

```bash
GET /whatsapp/qr
```

**Conectar um número específico:**

```bash
GET /whatsapp/qr?phone=vendas
GET /whatsapp/qr?phone=suporte
GET /whatsapp/qr?phone=atendimento1
```

### 2. Verificar Status de Conexão

**Ver todas as sessões do business:**

```bash
GET /whatsapp/connected
```

**Resposta:**

```json
{
  "business_id": "business-123",
  "total": 3,
  "connected": 2,
  "sessions": [
    {
      "business_id": "business-123",
      "phone_identifier": "default",
      "session_key": "business-123:default",
      "connected": true,
      "ready": true,
      "qrCodeAvailable": false,
      "info": {
        "wid": "5511999999999@c.us",
        "pushname": "Atendimento Principal",
        "platform": "android"
      }
    },
    {
      "business_id": "business-123",
      "phone_identifier": "vendas",
      "session_key": "business-123:vendas",
      "connected": true,
      "ready": true,
      "qrCodeAvailable": false,
      "info": {
        "wid": "5511888888888@c.us",
        "pushname": "Vendas",
        "platform": "android"
      }
    },
    {
      "business_id": "business-123",
      "phone_identifier": "suporte",
      "session_key": "business-123:suporte",
      "connected": false,
      "ready": false,
      "qrCodeAvailable": true,
      "info": null
    }
  ]
}
```

**Ver status de uma sessão específica:**

```bash
GET /whatsapp/connected?phone=vendas
```

### 3. Enviar Mensagens

**Usando o número padrão:**

```bash
POST /whatsapp/send
Content-Type: application/json

{
  "number": "5511999999999",
  "message": "Olá! Como posso ajudar?"
}
```

**Usando um número específico:**

```bash
POST /whatsapp/send
Content-Type: application/json

{
  "number": "5511999999999",
  "message": "Olá da equipe de vendas!",
  "phoneIdentifier": "vendas"
}
```

**Enviando mídia com número específico:**

```bash
POST /whatsapp/send
Content-Type: application/json

{
  "number": "5511999999999",
  "phoneIdentifier": "suporte",
  "payload": {
    "type": "media",
    "media": {
      "url": "https://example.com/image.jpg"
    },
    "caption": "Veja esta imagem"
  }
}
```

### 4. Listar Mensagens

**Do número padrão:**

```bash
GET /whatsapp/messages?limit=50
```

**De um número específico:**

```bash
GET /whatsapp/messages?phone=vendas&limit=50
GET /whatsapp/messages?phone=suporte&chatId=5511999999999@c.us
```

### 5. Baixar Mídia

**Do número padrão:**

```bash
GET /whatsapp/messages/{messageId}/media
```

**De um número específico:**

```bash
GET /whatsapp/messages/{messageId}/media?phone=vendas
```

### 6. Marcar como Visto

**No número padrão:**

```bash
POST /whatsapp/seen
Content-Type: application/json

{
  "chatId": "5511999999999@c.us"
}
```

**Em um número específico:**

```bash
POST /whatsapp/seen
Content-Type: application/json

{
  "chatId": "5511999999999@c.us",
  "phoneIdentifier": "vendas"
}
```

## 🎯 Casos de Uso

### Departamentos Diferentes

```typescript
// Vendas
await whatsappService.sendMessage(
  businessId,
  customerNumber,
  { type: "text", text: "Oferta especial!" },
  undefined,
  "vendas",
);

// Suporte
await whatsappService.sendMessage(
  businessId,
  customerNumber,
  { type: "text", text: "Como podemos ajudar?" },
  undefined,
  "suporte",
);
```

### Múltiplos Atendentes

```typescript
// Atendente 1
phoneIdentifier: "atendente1";

// Atendente 2
phoneIdentifier: "atendente2";

// Atendente 3
phoneIdentifier: "atendente3";
```

### Filiais

```typescript
// Filial São Paulo
phoneIdentifier: "filial-sp";

// Filial Rio de Janeiro
phoneIdentifier: "filial-rj";

// Filial Belo Horizonte
phoneIdentifier: "filial-bh";
```

## 📁 Armazenamento

Cada sessão tem seu próprio diretório de autenticação:

```
.wwebjs_auth/
├── session-business-123:default/
├── session-business-123:vendas/
├── session-business-123:suporte/
└── session-business-456:default/
```

## ⚠️ Considerações Importantes

### Consumo de Recursos

- Cada sessão = 1 instância do Puppeteer (navegador headless)
- Cada instância consome ~100-200MB de RAM
- Recomendado: máximo 5-10 sessões simultâneas por servidor

### Limites do WhatsApp

- Cada número pode estar conectado em apenas 1 dispositivo por vez
- Se conectar em outro lugar, a sessão aqui será desconectada
- WhatsApp pode banir números com uso abusivo

### Boas Práticas

1. Use identificadores descritivos (`vendas`, `suporte`, não `whatsapp1`, `whatsapp2`)
2. Monitore o consumo de memória
3. Implemente rate limiting para evitar spam
4. Mantenha backup das credenciais (`.wwebjs_auth/`)
5. Desconecte sessões não utilizadas

## 🔧 Manutenção

### Verificar Todas as Sessões Ativas

```bash
GET /whatsapp/connected/all
```

### Reconectar uma Sessão

1. Obter novo QR Code: `GET /whatsapp/qr?phone=vendas`
2. Escanear com o WhatsApp
3. Aguardar evento `ready`

### Limpar Sessão Antiga

```bash
# Deletar diretório da sessão
rm -rf .wwebjs_auth/session-business-123:vendas

# Reconectar
GET /whatsapp/qr?phone=vendas
```

## 🆕 Migração de Código Antigo

### Antes (sessão única):

```typescript
await whatsappService.sendMessage(businessId, number, payload);
```

### Depois (compatível - usa 'default'):

```typescript
// Funciona igual, usa phoneIdentifier='default' internamente
await whatsappService.sendMessage(businessId, number, payload);
```

### Novo (múltiplas sessões):

```typescript
// Especifica qual número usar
await whatsappService.sendMessage(
  businessId,
  number,
  payload,
  options,
  "vendas",
);
```

## 📊 Monitoramento

Endpoints úteis para monitoramento:

- **Status geral:** `GET /whatsapp/connected/all`
- **Status do business:** `GET /whatsapp/connected`
- **Status de sessão específica:** `GET /whatsapp/connected?phone=vendas`

## 🐛 Troubleshooting

### Sessão não conecta

1. Verificar se QR code foi gerado: `GET /whatsapp/qr?phone=X`
2. Verificar logs do servidor
3. Deletar diretório `.wwebjs_auth/session-X` e reconectar

### Mensagem não envia

1. Verificar se sessão está `ready`: `GET /whatsapp/connected?phone=X`
2. Verificar se número está no formato correto
3. Verificar logs para erros

### Memória alta

1. Listar sessões: `GET /whatsapp/connected/all`
2. Desconectar sessões não usadas
3. Considerar escalar horizontalmente
