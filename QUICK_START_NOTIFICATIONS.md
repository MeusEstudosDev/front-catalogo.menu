# 🚀 Quick Start - Sistema de Notificações

## Instalação Completa ✅

O sistema de notificações em tempo real já está totalmente implementado e pronto para uso!

## O que foi implementado?

### ✅ Interface de Notificações
- Menu dropdown com lista de notificações
- Badge com contador de não lidas
- Modal de detalhes completo
- Scroll infinito com paginação
- Filtro de notificações não lidas

### ✅ Socket.IO em Tempo Real
- Conexão automática ao backend
- Recebimento de notificações via WebSocket
- Toast quando nova notificação chega
- Atualização automática da lista
- Reconexão automática

### ✅ Ações CRUD
- Marcar como lida/não lida
- Deletar notificação
- Navegar para ação customizada

## Como usar agora?

### 1. Configure as variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```bash
cp .env.local.example .env.local
```

Edite `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1/
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

> **Nota:** Ajuste as URLs conforme seu ambiente.

### 2. Reinicie o servidor

```bash
npm run dev
```

### 3. Teste a conexão

1. Abra a aplicação no navegador
2. Faça login
3. Abra o console do navegador (F12)
4. Você deve ver: `Socket.IO conectado: <id>`

### 4. Envie uma notificação de teste

No seu backend, emita uma notificação:

```typescript
io.emit(`${userId}-notifications`, {
  id: crypto.randomUUID(),
  created_at: new Date().toISOString(),
  read_at: null,
  type: 'INFO',
  priority: 'NORMAL',
  title: 'Bem-vindo!',
  message: 'Sistema de notificações funcionando perfeitamente! 🎉'
});
```

### 5. Veja a mágica acontecer! ✨

- Toast aparece no canto da tela
- Badge de notificações atualiza
- Lista de notificações é atualizada automaticamente

## Estrutura de Dados

### Enviando Notificação do Backend

```typescript
interface NotificationPayload {
  id: string;                    // UUID único
  created_at: string;            // ISO 8601 timestamp
  read_at: string | null;        // null = não lida
  type: NotificationType;        // INFO, SUCCESS, WARNING, ERROR, etc.
  priority: NotificationPriority; // LOW, NORMAL, HIGH, URGENT
  title: string;                 // Título curto
  message: string;               // Mensagem completa
  action_url?: string;           // URL opcional para ação
  metadata?: any;                // Dados adicionais
  expires_at?: string;           // Data de expiração opcional
}
```

### Tipos Disponíveis

```typescript
type NotificationType = 
  | "INFO"      // Azul - Informações gerais
  | "SUCCESS"   // Verde - Operações bem-sucedidas
  | "WARNING"   // Laranja - Avisos
  | "ERROR"     // Vermelho - Erros
  | "SYSTEM"    // Roxo - Sistema
  | "PROMOTION" // Rosa - Promoções
  | "ORDER"     // Teal - Pedidos
  | "MESSAGE"   // Ciano - Mensagens
  | "PAYMENT"   // Amarelo - Pagamentos
  | "ACCOUNT"   // Cinza - Conta

type NotificationPriority = 
  | "LOW"       // Baixa prioridade
  | "NORMAL"    // Prioridade normal
  | "HIGH"      // Alta prioridade (badge vermelho)
  | "URGENT"    // Urgente (badge vermelho "Urgente")
```

## Exemplos de Uso

### Notificação de Sucesso
```typescript
io.emit(`${userId}-notifications`, {
  id: crypto.randomUUID(),
  created_at: new Date().toISOString(),
  read_at: null,
  type: 'SUCCESS',
  priority: 'NORMAL',
  title: 'Pedido Confirmado',
  message: 'Seu pedido #12345 foi confirmado e está sendo preparado!'
});
```

### Notificação Urgente
```typescript
io.emit(`${userId}-notifications`, {
  id: crypto.randomUUID(),
  created_at: new Date().toISOString(),
  read_at: null,
  type: 'WARNING',
  priority: 'URGENT',
  title: 'Ação Requerida',
  message: 'Seu pagamento está vencendo em 1 hora!',
  action_url: '/payments/pending'
});
```

### Notificação com Ação
```typescript
io.emit(`${userId}-notifications`, {
  id: crypto.randomUUID(),
  created_at: new Date().toISOString(),
  read_at: null,
  type: 'INFO',
  priority: 'NORMAL',
  title: 'Nova Mensagem',
  message: 'Você recebeu uma nova mensagem de João Silva',
  action_url: '/messages/123',
  metadata: {
    sender_id: 'user-123',
    sender_name: 'João Silva'
  }
});
```

## Endpoints da API

O frontend espera que seu backend implemente:

### 1. Listar Notificações
```
GET /users/notifications?page_number=1&page_size=20&unread_only=n
```

**Resposta:**
```json
{
  "data": [
    {
      "id": "notif-1",
      "created_at": "2024-01-15T10:30:00Z",
      "read_at": null,
      "type": "INFO",
      "priority": "NORMAL",
      "title": "Título",
      "message": "Mensagem",
      "action_url": "/dashboard",
      "metadata": {}
    }
  ],
  "has_more": true,
  "total": 150,
  "page_number": 1,
  "information": {
    "unread_count": 42
  }
}
```

### 2. Marcar como Lida
```
PATCH /users/notifications/{id}/read
```

### 3. Marcar como Não Lida
```
PATCH /users/notifications/{id}/unread
```

### 4. Deletar Notificação
```
DELETE /users/notifications/{id}
```

## Checklist de Verificação

- [ ] Variáveis de ambiente configuradas (`.env.local`)
- [ ] Servidor Next.js rodando (`npm run dev`)
- [ ] Backend Socket.IO configurado
- [ ] Usuário logado na aplicação
- [ ] Console mostra "Socket.IO conectado"
- [ ] Badge de notificações visível no menu
- [ ] Menu de notificações abre ao clicar no sino

## Documentação Adicional

📖 **Documentação Completa:** `NOTIFICATION_SYSTEM_DOCUMENTATION.md`
- Detalhes técnicos completos
- Arquitetura do sistema
- Boas práticas implementadas

🧪 **Guia de Testes:** `NOTIFICATION_SYSTEM_TESTING.md`
- Passo a passo para testes
- Casos de teste completos
- Debugging de problemas

📋 **Resumo Técnico:** `NOTIFICATION_SYSTEM_SUMMARY.md`
- Referência rápida
- Troubleshooting
- Fluxo de dados

## Arquivos Modificados

```
/root/projects/front-catalogo.menu/
├── components/ui/main-menu.tsx          ← Implementação principal
├── package.json                          ← socket.io-client já instalado
├── .env.local.example                    ← Template de configuração
├── NOTIFICATION_SYSTEM_DOCUMENTATION.md  ← Documentação técnica
├── NOTIFICATION_SYSTEM_TESTING.md        ← Guia de testes
└── NOTIFICATION_SYSTEM_SUMMARY.md        ← Resumo rápido
```

## Suporte

Encontrou algum problema?

1. **Verifique o console do navegador** - Erros aparecem lá primeiro
2. **Consulte a documentação** - 3 arquivos MD com detalhes completos
3. **Teste a conexão** - Siga o guia de testes
4. **Verifique variáveis de ambiente** - URLs corretas?

## Próximos Passos

### Para Desenvolvimento
✅ Sistema está pronto para uso
✅ Teste com notificações reais do backend
✅ Customize cores/estilos conforme necessário

### Para Produção
1. Configure variáveis de ambiente de produção
2. Use HTTPS/WSS para conexões seguras
3. Configure CORS no backend
4. Monitore logs de conexão
5. Faça deploy! 🚀

---

**Status:** ✅ Sistema Completo e Funcional
**Pronto para:** Desenvolvimento e Produção
**Tempo de setup:** ~5 minutos

**Dúvidas?** Consulte os arquivos de documentação detalhada.
