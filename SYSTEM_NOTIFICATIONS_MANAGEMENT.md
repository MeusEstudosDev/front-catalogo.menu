# 📢 Sistema de Notificações do Sistema - Documentação

## 🎯 Visão Geral

Nova página de gerenciamento de notificações do sistema que permite criar, editar, listar e deletar notificações agendadas para usuários.

---

## 📍 Localização

```
/app/(manage)/manage-system/notifications/page.tsx
```

**URL:** `/manage-system/notifications`

---

## 🎨 Funcionalidades Implementadas

### 1. **Listagem de Notificações** 📋
- Tabela com todas as notificações do sistema
- Paginação (10 itens por página)
- Ordenação por título ou data de envio
- Filtros por:
  - Busca (título ou mensagem)
  - Tipo de notificação
  - Prioridade

### 2. **Criação de Notificações** ➕
- Modal com formulário completo
- Campos obrigatórios:
  - Título (max 200 caracteres)
  - Mensagem (texto longo)
  - Data/hora de envio
- Campos opcionais:
  - Tipo de usuário destinatário
  - URL de ação
  - Data de expiração
- Seleção de tipo (INFO, SUCCESS, WARNING, etc.)
- Seleção de prioridade (LOW, NORMAL, HIGH, URGENT)

### 3. **Edição de Notificações** ✏️
- Modal de edição
- **Restrição:** Só permite editar notificações que ainda NÃO foram enviadas
- Validação: Se `sended_at` existe, mostra aviso e bloqueia edição
- Todos os campos podem ser alterados

### 4. **Exclusão de Notificações** 🗑️
- Modal de confirmação
- Exclusão permanente (soft delete no backend)
- Feedback visual de sucesso/erro

### 5. **Filtros e Busca** 🔍
- Busca textual em título e mensagem
- Filtro por tipo de notificação
- Filtro por prioridade
- Botão "Buscar" para aplicar filtros

### 6. **Indicadores Visuais** 🎨
- **Badges de tipo:** Cores diferentes por tipo de notificação
- **Badges de prioridade:** Cores diferentes por prioridade
- **Status:** Badge verde (Enviada) ou laranja (Pendente)
- **Destinatários:** Mostra tipo de usuário ou "Todos"

---

## 🔌 Integração com API

### Endpoints Utilizados

#### 1. **Listar Notificações**
```
GET /management/system-notifications
```

**Query Params:**
- `page_number`: número da página
- `page_size`: tamanho da página
- `sort`: campo de ordenação (title, send_at, created_at)
- `order_by`: asc ou desc
- `search`: busca textual (opcional)
- `type`: filtro por tipo (opcional)
- `priority`: filtro por prioridade (opcional)

**Response:**
```json
{
  "data": [
    {
      "id": "cuid",
      "created_at": "2024-01-01T00:00:00Z",
      "send_at": "2024-01-02T12:00:00Z",
      "sended_at": null,
      "type": "INFO",
      "priority": "NORMAL",
      "user_type": null,
      "title": "Título",
      "message": "Mensagem",
      "action_url": "/action",
      "expires_at": null
    }
  ],
  "total": 100,
  "last_page": 10
}
```

#### 2. **Criar Notificação**
```
POST /management/system-notifications
```

**Body:**
```json
{
  "title": "Título",
  "message": "Mensagem",
  "send_at": "2024-01-02T12:00:00Z",
  "type": "INFO",
  "priority": "NORMAL",
  "user_type": "MANAGEMENT",
  "action_url": "/action",
  "expires_at": "2024-01-10T12:00:00Z"
}
```

#### 3. **Editar Notificação**
```
PATCH /management/system-notifications/:id
```

**Body:** (Todos os campos opcionais)
```json
{
  "title": "Novo Título",
  "message": "Nova Mensagem",
  "send_at": "2024-01-02T12:00:00Z",
  "type": "WARNING",
  "priority": "HIGH"
}
```

**Restrição:** Só funciona se `sended_at` for `null`

#### 4. **Deletar Notificação**
```
DELETE /management/system-notifications/:id
```

---

## 📊 Tipos e Enums

### NotificationType
```typescript
enum NotificationType {
  INFO = "INFO",           // Azul
  SUCCESS = "SUCCESS",     // Verde
  WARNING = "WARNING",     // Laranja
  ERROR = "ERROR",         // Vermelho
  SYSTEM = "SYSTEM",       // Roxo
  PROMOTION = "PROMOTION", // Rosa
  ORDER = "ORDER",         // Teal
  MESSAGE = "MESSAGE",     // Ciano
  PAYMENT = "PAYMENT",     // Amarelo
  ACCOUNT = "ACCOUNT"      // Cinza
}
```

### NotificationPriority
```typescript
enum NotificationPriority {
  LOW = "LOW",         // Cinza
  NORMAL = "NORMAL",   // Azul
  HIGH = "HIGH",       // Laranja
  URGENT = "URGENT"    // Vermelho
}
```

### UserType
```typescript
enum UserType {
  MANAGEMENT = "MANAGEMENT",     // Gestão
  MARKETPLACE = "MARKETPLACE",   // Marketplace
  APPLICATION = "APPLICATION"    // Aplicação
}
```

---

## 🎨 Layout e Design

### Estrutura
1. **Cabeçalho:**
   - Título "Notificações do Sistema"
   - Botão "Nova Notificação"

2. **Filtros:**
   - Box branco com bordas arredondadas
   - Campos: Busca, Tipo, Prioridade
   - Botão "Buscar"

3. **Tabela:**
   - Colunas: Título, Tipo, Prioridade, Destinatários, Enviar em, Status, Ações
   - Ícones de editar e deletar
   - Hover effects

4. **Paginação:**
   - Informação de registros exibidos
   - Botões "Anterior" e "Próxima"

### Cores e Temas
- **Tema claro:** Fundo branco, bordas cinza
- **Tema escuro:** Fundo gray.800, bordas gray.700
- **Badges coloridos:** Seguem esquema de cores dos tipos

---

## 🔒 Validações

### Frontend
1. **Criação:**
   - Título obrigatório
   - Mensagem obrigatória
   - Data de envio obrigatória
   - Validação de formato de data

2. **Edição:**
   - Mesmas validações da criação
   - Verifica se notificação já foi enviada
   - Mostra aviso se não puder editar

3. **Exclusão:**
   - Confirmação obrigatória
   - Feedback visual

### Backend (Esperado)
- Validação de campos obrigatórios
- Validação de formato de datas
- Validação de enums
- Verificação de `sended_at` na edição
- Soft delete com `deleted_at`

---

## 📱 Responsividade

- **Desktop:** Layout completo com todos os filtros visíveis
- **Tablet:** Filtros em múltiplas linhas
- **Mobile:** Stack vertical de filtros

---

## 🚀 Exemplo de Uso

### 1. Criar Notificação de Manutenção
```
Título: Manutenção Programada
Mensagem: O sistema ficará em manutenção das 02:00 às 04:00.
Tipo: SYSTEM
Prioridade: HIGH
Destinatários: Todos
Enviar em: 2024-01-15 20:00
Expira em: 2024-01-16 04:00
```

### 2. Criar Promoção
```
Título: Super Desconto de Natal!
Mensagem: Aproveite 30% de desconto em todos os produtos.
Tipo: PROMOTION
Prioridade: NORMAL
Destinatários: MARKETPLACE
Enviar em: 2024-12-20 08:00
Action URL: /promotions/natal
Expira em: 2024-12-25 23:59
```

### 3. Alerta de Pagamento
```
Título: Pagamento Pendente
Mensagem: Sua fatura vence em 3 dias. Evite multas!
Tipo: PAYMENT
Prioridade: URGENT
Destinatários: APPLICATION
Enviar em: 2024-01-27 09:00
Action URL: /billing
```

---

## 🎯 Status da Notificação

### Pendente (Laranja)
- `sended_at` é `null`
- Ainda não foi enviada
- **Pode ser editada e deletada**

### Enviada (Verde)
- `sended_at` tem data
- Já foi enviada aos usuários
- **NÃO pode ser editada**
- **Pode ser deletada** (histórico)

---

## 🔧 Tecnologias Utilizadas

- **React** - Componentes
- **Next.js** - Framework
- **Chakra UI** - Design System
- **TypeScript** - Tipagem
- **Context7 MCP** - API Integration (sugerido no arquivo mcp.json)

---

## 📝 Notas de Implementação

### Padrão Seguido
Seguiu o mesmo padrão das páginas existentes em `/manage-system`:
- Estrutura de modais
- Sistema de filtros
- Paginação
- Toasts de feedback
- Layout responsivo
- Hooks de estado
- Fetch com token de autenticação

### Melhorias Futuras
- [ ] Visualização prévia da notificação
- [ ] Envio de teste para usuário específico
- [ ] Dashboard com estatísticas de envio
- [ ] Filtro por status (Pendente/Enviada)
- [ ] Busca avançada com múltiplos campos
- [ ] Exportação de relatórios
- [ ] Templates de notificações
- [ ] Agendamento recorrente

---

## ✅ Checklist de Validação

### Funcionalidade
- [x] Listagem de notificações funciona
- [x] Paginação funciona
- [x] Ordenação funciona
- [x] Filtros funcionam
- [x] Criação funciona
- [x] Edição funciona (apenas pendentes)
- [x] Exclusão funciona
- [x] Validações de campos obrigatórios

### UI/UX
- [x] Layout consistente com outras páginas
- [x] Cores e badges corretos
- [x] Modais funcionam
- [x] Toasts de feedback
- [x] Loading states
- [x] Estados vazios
- [x] Responsividade

### Código
- [x] TypeScript sem erros
- [x] Componentes organizados
- [x] Código limpo e comentado
- [x] Seguindo padrões do projeto

---

## 🎉 Conclusão

Página de gerenciamento de notificações do sistema totalmente funcional, seguindo o padrão das demais páginas do `/manage-system`, com CRUD completo, validações e uma interface profissional.

**Status:** ✅ Pronto para uso!
