# Sistema de Notificações - Documentação

## Visão Geral

Sistema completo de notificações em tempo real implementado no menu principal da aplicação, com funcionalidades de paginação infinita, filtros, e atualizações via Socket.IO.

## Funcionalidades Implementadas

### 1. **Interface de Notificações**

#### Menu de Notificações
- Dropdown acessível pelo ícone de sino no menu principal
- Badge com contagem de notificações não lidas
- Lista de notificações com scroll infinito
- Checkbox para filtrar apenas notificações não lidas (preferência salva em localStorage)
- Botão de atualização manual
- Contador total de notificações

#### Modal de Detalhes
- Visualização completa da notificação
- Informações de tipo, prioridade e status (lida/não lida)
- Datas de criação, leitura e expiração
- Botão de ação personalizado (se disponível)
- Ações rápidas: marcar como lida/não lida, deletar

### 2. **Paginação Infinita**

- Carregamento automático ao rolar até 80% da lista
- Tamanho de página: 20 notificações
- Indicador de carregamento durante fetch
- Mensagem quando todas as notificações foram carregadas

### 3. **Filtros e Preferências**

- **Filtro de não lidas**: Checkbox que aplica `unread_only=s` na requisição
- **localStorage**: Preferência do filtro persistida entre sessões
- **Sincronização automática**: Ao mudar o filtro, recarrega a lista do início

### 4. **Ações em Notificações**

Todas as ações atualizam a lista e o contador de não lidas:

- **Marcar como lida**: `PATCH /users/notifications/{id}/read`
- **Marcar como não lida**: `PATCH /users/notifications/{id}/unread`
- **Deletar**: `DELETE /users/notifications/{id}`

### 5. **Notificações em Tempo Real (Socket.IO)**

#### Configuração
```typescript
const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 
                  process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1/', '') || 
                  'http://localhost:3001';

const socket = io(socketUrl, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});
```

#### Eventos
- **Conexão**: Estabelecida quando o perfil do usuário está disponível
- **Canal**: `${userId}-notifications` - canal específico por usuário
- **Payload**: Objeto `INotification` completo

#### Comportamento ao Receber Notificação
1. Toast exibido com título e mensagem da notificação
2. Tipo do toast baseado no tipo da notificação (INFO, SUCCESS, WARNING, ERROR)
3. Duração do toast: 5 segundos
4. Atualização automática da lista de notificações
5. Atualização do contador de não lidas

#### Cleanup
- Desconexão automática ao desmontar o componente
- Remoção de listeners do evento específico do usuário

## Estrutura de Dados

### INotification
```typescript
interface INotification {
  id: string;
  created_at: string;
  read_at: string | null;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  action_url?: string;
  metadata?: any;
  expires_at?: string;
}

type NotificationType = 
  | "INFO" | "SUCCESS" | "WARNING" | "ERROR" 
  | "SYSTEM" | "PROMOTION" | "ORDER" 
  | "MESSAGE" | "PAYMENT" | "ACCOUNT";

type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
```

### Resposta da API
```typescript
{
  data: INotification[];
  has_more: boolean;
  total: number;
  page_number: number;
  information: {
    unread_count: number;
  };
}
```

## Endpoints Utilizados

### GET `/users/notifications`
**Query Parameters:**
- `page_number`: Número da página (começa em 1)
- `page_size`: Tamanho da página (padrão: 20)
- `unread_only`: "s" para apenas não lidas, "n" para todas

**Resposta:**
```json
{
  "data": [...],
  "has_more": true,
  "total": 150,
  "page_number": 1,
  "information": {
    "unread_count": 42
  }
}
```

### PATCH `/users/notifications/{id}/read`
Marca uma notificação como lida.

### PATCH `/users/notifications/{id}/unread`
Marca uma notificação como não lida.

### DELETE `/users/notifications/{id}`
Remove uma notificação permanentemente.

## Variáveis de Ambiente

### `.env.local.example`
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1/

# Socket.IO Configuration
# If not provided, will be derived from NEXT_PUBLIC_API_URL
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

### Configuração Recomendada
1. Copie `.env.local.example` para `.env.local`
2. Ajuste as URLs conforme seu ambiente
3. Para produção, use variáveis de ambiente do hosting

## Dependências

```json
{
  "socket.io-client": "^4.8.1",
  "@chakra-ui/react": "^3.27.0",
  "react-icons": "^5.5.0"
}
```

## Estilização

### Cores por Tipo de Notificação
```typescript
const colors: Record<NotificationType, string> = {
  INFO: "blue",
  SUCCESS: "green",
  WARNING: "orange",
  ERROR: "red",
  SYSTEM: "purple",
  PROMOTION: "pink",
  ORDER: "teal",
  MESSAGE: "cyan",
  PAYMENT: "yellow",
  ACCOUNT: "gray",
};
```

### Estados Visuais
- **Não lida**: Fundo azul claro (`blue.50` / `blue.900` dark mode)
- **Lida**: Fundo cinza (`gray.50` / transparente dark mode)
- **Hover**: Fundo mais escuro para feedback visual
- **Prioridade Alta/Urgente**: Badge vermelho

## Fluxo de Uso

### 1. Usuário Abre o Menu
1. Click no ícone de sino
2. Menu dropdown abre
3. Se houver preferência salva, aplica filtro de não lidas
4. Carrega primeira página de notificações
5. Exibe contador total e não lidas

### 2. Usuário Rola a Lista
1. Ao chegar a 80% do scroll
2. Verifica se há mais notificações (`has_more`)
3. Carrega próxima página
4. Adiciona ao final da lista existente
5. Exibe spinner durante carregamento

### 3. Nova Notificação Chega (Socket)
1. Backend emite evento `${userId}-notifications`
2. Frontend recebe payload da notificação
3. Toast aparece com detalhes
4. Lista é recarregada do início
5. Contador de não lidas é atualizado

### 4. Usuário Interage com Notificação
1. Click na notificação → Abre modal com detalhes
2. Click em "Marcar como lida/não lida" → Atualiza status e recarrega lista
3. Click em "Deletar" → Remove notificação e recarrega lista
4. Click em "Ir para ação" → Navega para URL especificada

## Boas Práticas Implementadas

### Performance
- ✅ Paginação para evitar carregar todas as notificações de uma vez
- ✅ Scroll infinito com lazy loading
- ✅ Debounce implícito no scroll (threshold de 80%)
- ✅ Reutilização de conexão Socket.IO
- ✅ Cleanup de listeners e conexões

### UX
- ✅ Feedback visual imediato (toasts)
- ✅ Estados de loading claros
- ✅ Preferências persistidas
- ✅ Badges para indicar tipos e prioridades
- ✅ Formatação de datas em português
- ✅ Truncamento de texto para leitura rápida
- ✅ Modal para leitura completa

### Código
- ✅ TypeScript com tipos bem definidos
- ✅ Separação de responsabilidades
- ✅ Tratamento de erros
- ✅ Logs para debugging
- ✅ Fallbacks para variáveis de ambiente

## Troubleshooting

### Socket não conecta
1. Verifique se `NEXT_PUBLIC_SOCKET_URL` está configurado
2. Confirme que o backend está rodando
3. Verifique logs do console para erros de conexão
4. Confirme que CORS está configurado no backend

### Notificações não atualizam
1. Verifique se o `userId` está disponível no profile
2. Confirme que o backend está emitindo para o canal correto
3. Verifique se o token de autenticação é válido
4. Teste a rota GET manualmente

### Contador de não lidas errado
1. Confirme que o backend retorna `information.unread_count`
2. Verifique se todas as ações atualizam a lista
3. Force refresh com o botão de atualização

### Scroll infinito não funciona
1. Verifique se `has_more` é retornado corretamente
2. Confirme que o evento `onScroll` está sendo disparado
3. Teste com `console.log` no handler de scroll

## Próximas Melhorias (Opcionais)

- [ ] Cache de notificações no localStorage
- [ ] Filtros adicionais (por tipo, prioridade, data)
- [ ] Busca/pesquisa de notificações
- [ ] Ações em lote (marcar todas como lidas)
- [ ] Sons/alertas customizáveis
- [ ] Notificações do navegador (Web Push API)
- [ ] Agrupamento de notificações por categoria
- [ ] Analytics de engajamento

## Testes Recomendados

### Testes Manuais
- [ ] Abrir menu de notificações
- [ ] Rolar até o fim e verificar paginação
- [ ] Alternar filtro de não lidas
- [ ] Marcar como lida/não lida
- [ ] Deletar notificação
- [ ] Verificar socket connection no console
- [ ] Simular recebimento de notificação via backend
- [ ] Verificar toast ao receber notificação
- [ ] Verificar atualização de contador
- [ ] Fechar e reabrir navegador (persistência de filtro)

### Testes de Integração
- [ ] Múltiplos usuários simultâneos
- [ ] Reconexão após perda de conexão
- [ ] Performance com muitas notificações
- [ ] Comportamento em dispositivos móveis
- [ ] Dark mode e light mode

## Arquivos Modificados

```
/root/projects/front-catalogo.menu/
├── components/ui/main-menu.tsx          # Implementação principal
├── package.json                          # Dependência socket.io-client
├── app/globals.css                       # Animação de spinner
└── .env.local.example                    # Exemplo de configuração
```

## Suporte

Para dúvidas ou problemas:
1. Verifique logs do console
2. Consulte documentação do Socket.IO
3. Revise este documento
4. Entre em contato com a equipe de desenvolvimento

---

**Última atualização**: 2024
**Versão**: 1.0.0
