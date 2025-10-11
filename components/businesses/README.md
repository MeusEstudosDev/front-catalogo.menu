# Módulo de Gerenciamento de Empresas

## 📋 Visão Geral

Este módulo implementa a funcionalidade completa de listagem, criação, edição e exclusão de empresas no sistema de gerenciamento.

## 🗂️ Estrutura de Arquivos

```
app/(manage)/manage-system/businesses/
├── page.tsx           # Listagem de empresas
├── create/
│   └── page.tsx       # Criação de empresa (com tabs)
└── edit/
    └── page.tsx       # Edição de empresa (com tabs)

components/businesses/
├── types.ts           # Tipos TypeScript (BusinessStatus, IBusiness, etc.)
├── utils.ts           # Funções utilitárias (formatação, tradução)
└── index.ts           # Barrel export
```

## 🎯 Funcionalidades Implementadas

### Página de Listagem (`/manage-system/businesses`)

#### ✅ Recursos
- **Tabela responsiva** com todas as empresas
- **Campo de busca** por nome ou CNPJ
- **Filtro por código** (numérico)
- **Filtro por status** (dropdown com todos os status disponíveis)
- **Paginação** completa com navegação entre páginas
- **Ordenação** por qualquer coluna (código, nome, status, data)
- **Filtro de itens por página** (10, 25, 50, 100)
- **Ações por empresa:**
  - ✏️ Editar (redireciona para página de edição)
  - 🔄 Alterar status (abre modal)
  - 🗑️ Deletar (abre modal de confirmação)

#### 📊 Colunas da Tabela
1. **Código** - ID numérico da empresa
2. **Nome** - Nome da empresa
3. **CNPJ** - Formatado com máscara (00.000.000/0000-00)
4. **Website** - Link clicável com ícone de link externo
5. **Status** - Badge colorido conforme o status
6. **Data de Criação** - Formatada (DD/MM/YYYY)
7. **Ações** - Botões de editar, alterar status e deletar

#### 🎨 Interface
- Integração com Chakra UI v3
- Dark mode suportado
- Loading states (spinner)
- Empty states (quando não há dados)
- Modais de confirmação

### Página de Criação (`/manage-system/businesses/create`)

- **Estrutura com Tabs** (padrão `/account`)
  - 📄 Informações Básicas
  - 🏢 Dados Empresariais
  - 📍 Endereço
  - ⚙️ Configurações
- Placeholder para desenvolvimento futuro

### Página de Edição (`/manage-system/businesses/edit?id={id}`)

- **Estrutura com Tabs** (padrão `/account`)
  - 📄 Informações Básicas
  - 🏢 Dados Empresariais
  - 📍 Endereço
  - ⚙️ Configurações
- Recebe ID via query parameter
- Placeholder para desenvolvimento futuro

## 🔧 API Integration

### Endpoint: GET /management/businesses

**Query Parameters:**
```typescript
{
  search?: string;       // Busca por nome ou CNPJ
  code?: number;         // Filtro por código da empresa
  status?: BusinessStatus; // Filtro por status
  page: number;          // Número da página (1-indexed)
  size: number;          // Itens por página
  sortBy: string;        // Campo para ordenação
  order: 'asc' | 'desc'; // Ordem de ordenação
}
```

**Response:**
```typescript
{
  page: number;          // Página atual
  page_size: number;     // Tamanho da página
  total: number;         // Total de registros
  has_more: boolean;     // Há mais páginas?
  next_page: number;     // Número da próxima página
  prev_page: number | null; // Número da página anterior (null se não houver)
  last_page: number;     // Última página
  sort: string;          // Campo de ordenação
  order: string;         // Ordem ('asc' | 'desc')
  data: IBusiness[];     // Array de empresas
}
```

### Endpoint: DELETE /management/businesses/{id}

**Deleta uma empresa**

### Endpoint: PATCH /management/businesses/{id}/status

**Body:**
```typescript
{
  status: BusinessStatus;
}
```

## 📝 Tipos e Enums

### BusinessStatus Enum

```typescript
enum BusinessStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
  PENDING = "PENDING",
  PAYMENT_PENDING = "PAYMENT_PENDING",
  TRIAL = "TRIAL",
  EXPIRED = "EXPIRED",
  ARCHIVED = "ARCHIVED",
  BANNED = "BANNED",
  DELETED = "DELETED",
}
```

### IBusiness Interface

```typescript
interface IBusiness {
  id: string;           // UUID (não exibido na UI)
  code: number;         // Código numérico
  cnpj: string;         // CNPJ sem máscara
  name: string;         // Nome da empresa
  website: string | null; // URL do website
  status: BusinessStatus; // Status atual
  created_at: Date;     // Data de criação
}
```

## 🛠️ Funções Utilitárias

### formatCnpj(cnpj: string)
Formata CNPJ: `12345678901234` → `12.345.678/9012-34`

### formatDate(date: Date | string)
Formata data: `2025-10-10` → `10/10/2025`

### translateStatus(status: BusinessStatus)
Traduz status para português:
- `ACTIVE` → "Ativo"
- `SUSPENDED` → "Suspenso"
- etc.

### getStatusColorScheme(status: BusinessStatus)
Retorna cor do badge:
- `ACTIVE` → "green"
- `SUSPENDED` → "orange"
- `DELETED` → "red"
- etc.

## 🎨 Padrões de UI

### Cores de Status

| Status | Cor | Descrição |
|--------|-----|-----------|
| ACTIVE | Verde | Empresa ativa |
| INACTIVE | Cinza | Empresa inativa |
| SUSPENDED | Laranja | Empresa suspensa |
| PENDING | Amarelo | Aguardando aprovação |
| PAYMENT_PENDING | Ciano | Pagamento pendente |
| TRIAL | Azul | Período de teste |
| EXPIRED | Vermelho | Expirado |
| ARCHIVED | Roxo | Arquivado |
| BANNED | Vermelho | Banido |
| DELETED | Vermelho | Deletado |

## 🔐 Autenticação

Todas as requisições utilizam:
- **Bearer Token** obtido de `/api/get-cookies?key=access_token`
- **Headers:**
  ```
  Content-Type: application/json
  Authorization: Bearer {token}
  ```

## 📱 Responsividade

- **Mobile:** Tabela com scroll horizontal
- **Tablet:** Layout adaptado
- **Desktop:** Visualização completa

## ⚡ Performance

- **Client-side only**: Componente usa `'use client'`
- **Suspense**: Implementado para loading states
- **Lazy loading**: Paginação server-side
- **Memoization**: Pode ser adicionada conforme necessário

## 🔄 Estados

### Loading States
- ✅ Carregamento inicial (spinner centralizado)
- ✅ Deletando empresa (botão com loading)
- ✅ Atualizando status (botão com loading)

### Empty States
- ✅ Sem empresas cadastradas
- ✅ Sem resultados de busca

### Error States
- ✅ Toasters para feedback de erro
- ✅ Mensagens descritivas

## 🧪 Próximos Passos

### Para Desenvolvedores Futuros

1. **Implementar Tabs de Criação/Edição**
   - Criar componentes para cada tab
   - Adicionar validação com Zod
   - Integrar com API

2. **Adicionar Filtros Avançados**
   - Filtro por status
   - Filtro por data de criação
   - Filtro por região/estado

3. **Exportação de Dados**
   - CSV
   - Excel
   - PDF

4. **Ações em Lote**
   - Seleção múltipla
   - Deletar várias empresas
   - Alterar status em lote

5. **Melhorias de UX**
   - Skeleton loading
   - Infinite scroll (alternativa à paginação)
   - Drag & drop para ordenação

## 📚 Referências

- [AI Agent Reference](/AI_AGENT_REFERENCE.md) - Guia completo do projeto
- [Chakra UI v3 Docs](https://www.chakra-ui.com/docs)
- [Next.js 15 Docs](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🐛 Troubleshooting

### Problema: Empresas não carregam
**Solução:** Verificar se o token de autenticação está válido

### Problema: Paginação não funciona
**Solução:** Verificar se a URL está sendo atualizada corretamente

### Problema: Modal não abre
**Solução:** Verificar se o estado do modal está sendo gerenciado corretamente

---

**Desenvolvido seguindo os padrões do projeto catalogo.menu**  
**Data:** 10 de Outubro de 2025
