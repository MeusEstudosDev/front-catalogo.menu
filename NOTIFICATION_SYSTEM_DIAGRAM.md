# Sistema de Notificações - Diagrama de Fluxo

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BACKEND (Node.js/Socket.IO)                  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Emite evento
                                    │ `${userId}-notifications`
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js/React)                         │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              Socket.IO Connection (useEffect)                │   │
│  │                                                               │   │
│  │  1. Conecta quando profile.user_id está disponível           │   │
│  │  2. Escuta: `${userId}-notifications`                        │   │
│  │  3. Reconecta automaticamente se desconectar                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                    │                                 │
│                                    │ Nova notificação recebida       │
│                                    ▼                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Event Handler                             │   │
│  │                                                               │   │
│  │  newSocket.on(notificationEvent, (notification) => {         │   │
│  │    // 1. Mostrar Toast                                       │   │
│  │    toaster.create({...});                                    │   │
│  │                                                               │   │
│  │    // 2. Atualizar Lista                                     │   │
│  │    fetchNotifications(1, false);                             │   │
│  │  });                                                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                    │                                 │
│                    ┌───────────────┴───────────────┐                │
│                    ▼                                ▼                │
│  ┌─────────────────────────────┐  ┌────────────────────────────┐   │
│  │    Toast Notification       │  │   Update Notification List │   │
│  │                             │  │                            │   │
│  │  • Título da notificação    │  │  GET /users/notifications  │   │
│  │  • Mensagem                 │  │  ?page_number=1            │   │
│  │  • Tipo (cor do toast)      │  │  &page_size=20             │   │
│  │  • Duração: 5s              │  │  &unread_only=n/s          │   │
│  └─────────────────────────────┘  └────────────────────────────┘   │
│                                                    │                 │
│                                                    ▼                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    UI Update                                 │   │
│  │                                                               │   │
│  │  • Badge atualizado (unread_count)                           │   │
│  │  • Lista atualizada (notificações)                           │   │
│  │  • Nova notificação aparece no topo                          │   │
│  │  • Fundo azul para não lida                                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                    AÇÕES DO USUÁRIO                                  │
└─────────────────────────────────────────────────────────────────────┘

1. ABRIR MENU DE NOTIFICAÇÕES
   ┌──────────────┐
   │ Click em 🔔 │ ──► Menu dropdown abre
   └──────────────┘      │
                         ▼
                    Carrega notificações
                    GET /users/notifications


2. ROLAR A LISTA (Scroll Infinito)
   ┌──────────────────────┐
   │ Scroll atinge 80%    │ ──► Carrega próxima página
   └──────────────────────┘      │
                                 ▼
                            GET /users/notifications?page_number=2


3. MARCAR COMO LIDA
   ┌──────────────────┐
   │ Click em ☑️      │ ──► PATCH /users/notifications/{id}/read
   └──────────────────┘      │
                             ▼
                        Toast "Marcada como lida"
                             │
                             ▼
                        Recarrega lista (página 1)


4. MARCAR COMO NÃO LIDA
   ┌──────────────────┐
   │ Click em ☐       │ ──► PATCH /users/notifications/{id}/unread
   └──────────────────┘      │
                             ▼
                        Toast "Marcada como não lida"
                             │
                             ▼
                        Recarrega lista (página 1)


5. DELETAR NOTIFICAÇÃO
   ┌──────────────────┐
   │ Click em 🗑️      │ ──► DELETE /users/notifications/{id}
   └──────────────────┘      │
                             ▼
                        Toast "Notificação removida"
                             │
                             ▼
                        Recarrega lista (página 1)


6. FILTRAR NÃO LIDAS
   ┌──────────────────────────────┐
   │ Toggle checkbox "Apenas não  │ ──► Salva preferência localStorage
   │ lidas"                        │      │
   └──────────────────────────────┘      ▼
                                    Recarrega lista com filtro
                                    unread_only=s ou unread_only=n


7. ABRIR DETALHES
   ┌──────────────────────────┐
   │ Click na notificação     │ ──► Modal abre
   └──────────────────────────┘      │
                                     ▼
                                Exibe detalhes completos
                                • Tipo e prioridade
                                • Mensagem completa
                                • Datas (criação, leitura, expiração)
                                • Botão de ação (se houver)


┌─────────────────────────────────────────────────────────────────────┐
│                    ESTRUTURA DE COMPONENTES                          │
└─────────────────────────────────────────────────────────────────────┘

MainMenu (components/ui/main-menu.tsx)
  │
  ├── Socket.IO Connection (useEffect)
  │     │
  │     ├── Connect on profile.user_id available
  │     ├── Listen to `${userId}-notifications`
  │     ├── Handle new notification events
  │     └── Cleanup on unmount
  │
  ├── Notification States
  │     │
  │     ├── notifications: INotification[]
  │     ├── isLoadingNotifications: boolean
  │     ├── isLoadingMoreNotifications: boolean
  │     ├── showOnlyUnread: boolean (localStorage)
  │     ├── notificationPage: number
  │     ├── hasMoreNotifications: boolean
  │     ├── totalNotifications: number
  │     ├── unreadCount: number
  │     └── socket: Socket | null
  │
  ├── Notification Menu (Dropdown)
  │     │
  │     ├── Badge com unreadCount
  │     ├── Checkbox filtro não lidas
  │     ├── Botão refresh
  │     ├── Lista com scroll infinito
  │     └── Indicador de loading
  │
  ├── Notification Modal
  │     │
  │     ├── Detalhes completos
  │     ├── Badges de tipo/prioridade/status
  │     ├── Datas formatadas
  │     ├── Botão de ação customizado
  │     └── Ações: marcar lida/não lida, deletar
  │
  └── Functions
        │
        ├── fetchNotifications(page, append)
        ├── loadMoreNotifications()
        ├── toggleReadNotification(id, isRead)
        ├── deleteNotification(id)
        ├── openNotificationModal(notification)
        ├── closeNotificationModal()
        ├── handleNotificationScroll(e)
        ├── getNotificationColor(type)
        └── getPriorityBadge(priority)


┌─────────────────────────────────────────────────────────────────────┐
│                    FLUXO DE DADOS                                    │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   Backend    │ ──► Socket.IO ──► Frontend useEffect
│  (Socket.IO) │                        │
└──────────────┘                        ▼
                                   notification received
                                        │
                                        ├──► toaster.create()
                                        │
                                        └──► fetchNotifications()
                                                     │
                                                     ▼
                                            Backend REST API
                                            GET /notifications
                                                     │
                                                     ▼
                                              Response:
                                              {
                                                data: [...],
                                                unread_count: N,
                                                has_more: true
                                              }
                                                     │
                                                     ▼
                                              setNotifications()
                                              setUnreadCount()
                                                     │
                                                     ▼
                                               UI Updates


┌─────────────────────────────────────────────────────────────────────┐
│                    TIPOS E CORES                                     │
└─────────────────────────────────────────────────────────────────────┘

Type          Color      Icon    Usage
────────────────────────────────────────────────────────────
INFO          Azul       ℹ️      Informações gerais
SUCCESS       Verde      ✓       Operações bem-sucedidas
WARNING       Laranja    ⚠️      Avisos importantes
ERROR         Vermelho   ✖       Erros e falhas
SYSTEM        Roxo       ⚙️      Notificações do sistema
PROMOTION     Rosa       🎁      Promoções e ofertas
ORDER         Teal       📦      Atualizações de pedidos
MESSAGE       Ciano      💬      Mensagens
PAYMENT       Amarelo    💳      Pagamentos
ACCOUNT       Cinza      👤      Conta do usuário

Priority      Badge
────────────────────────────────────
LOW           (nenhum)
NORMAL        (nenhum)
HIGH          Badge vermelho "Alta"
URGENT        Badge vermelho "Urgente"


┌─────────────────────────────────────────────────────────────────────┐
│                    RESPONSABILIDADES                                 │
└─────────────────────────────────────────────────────────────────────┘

FRONTEND (Implementado)
✅ Conectar ao Socket.IO
✅ Escutar eventos de notificação
✅ Exibir toast para novas notificações
✅ Gerenciar lista de notificações
✅ Implementar scroll infinito
✅ Filtrar notificações (não lidas)
✅ Ações CRUD (ler, deletar)
✅ UI responsiva e acessível
✅ Persistir preferências (localStorage)
✅ Cleanup de conexões

BACKEND (Requisitos)
⚠️  Implementar Socket.IO server
⚠️  Emitir eventos `${userId}-notifications`
⚠️  Implementar endpoints REST:
    - GET /users/notifications (com paginação)
    - PATCH /users/notifications/{id}/read
    - PATCH /users/notifications/{id}/unread
    - DELETE /users/notifications/{id}
⚠️  Retornar unread_count na resposta
⚠️  Configurar CORS para Socket.IO
⚠️  Autenticação e autorização


┌─────────────────────────────────────────────────────────────────────┐
│                    CONFIGURAÇÃO RÁPIDA                               │
└─────────────────────────────────────────────────────────────────────┘

1. Copiar .env.local.example para .env.local
2. Ajustar URLs do backend
3. npm run dev
4. Login na aplicação
5. Verificar console: "Socket.IO conectado"
6. Testar envio de notificação do backend
7. Observar toast e lista atualizarem

✅ Pronto para usar!


┌─────────────────────────────────────────────────────────────────────┐
│                    MONITORAMENTO                                     │
└─────────────────────────────────────────────────────────────────────┘

Console Logs (Frontend):
• "Socket.IO conectado: <id>"
• "Nova notificação recebida: {...}"
• "Desconectando Socket.IO..."
• "Erro de conexão Socket.IO: <error>"

Chrome DevTools:
• Network → WS → Ver mensagens WebSocket
• Console → Ver logs e erros
• Application → Storage → localStorage (preferências)

Backend Logs:
• Conexões Socket.IO
• Emissões de eventos
• Desconexões de clientes
```

---

**Legenda:**
- ✅ = Implementado
- ⚠️  = Requer implementação no backend
- ──► = Fluxo de dados
- │ = Hierarquia/estrutura
- ▼ = Próximo passo
