# Componentes de Planos

Este diretório contém os tipos, utilitários e componentes relacionados à gestão de planos do sistema.

## Estrutura

```
components/plans/
├── index.ts          # Barrel export de todos os tipos e utilitários
├── types.ts          # Interfaces e tipos TypeScript
├── utils.ts          # Funções utilitárias de formatação
└── README.md         # Este arquivo
```

## Tipos

### `IPlan`

Interface principal que representa um plano no sistema.

**Propriedades:**

- `id`: string - ID único do plano
- `code`: number - Código numérico do plano
- `created_at`: string - Data de criação (ISO)
- `updated_at`: string - Data da última atualização (ISO)
- `deleted_at`: string | null - Data de deleção (soft delete)
- `name`: string - Nome do plano
- `description`: string | null - Descrição do plano
- `price_monthly`: string - Preço mensal
- `price_yearly`: string | null - Preço anual (opcional)
- `currency`: string - Código da moeda (BRL, USD, EUR)
- `trial_days`: number - Dias de teste grátis
- `is_active`: boolean - Status ativo/inativo
- `features`: any | null - Features do plano (JSON)
- `max_users`: number | null - Limite de usuários (null = ilimitado)
- `max_branches`: number | null - Limite de filiais (null = ilimitado)
- `max_products`: number | null - Limite de produtos (null = ilimitado)
- `max_orders`: number | null - Limite de pedidos (null = ilimitado)

### `ICreatePlanData`

Interface para dados de criação de um novo plano.

### `IUpdatePlanData`

Interface para atualização parcial de um plano existente (todos os campos opcionais).

### `IPlanListParams`

Parâmetros para listagem paginada de planos.

### `IPlanListResponse`

Resposta da API de listagem com metadados de paginação.

## Funções Utilitárias

### `formatCurrency(value: string | number, currency: string): string`

Formata valores monetários de acordo com a moeda.

**Exemplo:**

```typescript
formatCurrency("99.90", "BRL"); // "R$ 99,90"
formatCurrency(1299.99, "USD"); // "$ 1299,99"
```

### `formatDate(date: Date | string): string`

Formata datas para o padrão brasileiro (DD/MM/YYYY).

**Exemplo:**

```typescript
formatDate("2025-10-30T18:01:51.564Z"); // "30/10/2025"
```

### `getStatusColorScheme(isActive: boolean): string`

Retorna a cor do badge baseado no status.

**Retorna:**

- `"green"` para planos ativos
- `"red"` para planos inativos

### `translateStatus(isActive: boolean): string`

Traduz status booleano para português.

**Retorna:**

- `"Ativo"` para `true`
- `"Inativo"` para `false`

### `formatLimit(value: number | null | undefined): string`

Formata limites, exibindo "Ilimitado" para valores nulos.

**Exemplo:**

```typescript
formatLimit(10); // "10"
formatLimit(null); // "Ilimitado"
```

### `getCurrencyName(currency: string): string`

Retorna o nome completo da moeda.

**Exemplo:**

```typescript
getCurrencyName("BRL"); // "Real Brasileiro"
getCurrencyName("USD"); // "Dólar Americano"
```

## Uso

### Importação

```typescript
import {
  IPlan,
  ICreatePlanData,
  formatCurrency,
  formatDate,
  getStatusColorScheme,
  translateStatus,
  formatLimit,
} from "@/components/plans";
```

### Exemplo de Uso

```typescript
const plan: IPlan = {
  id: "abc123",
  code: 1,
  name: "Plano Básico",
  price_monthly: "99.90",
  currency: "BRL",
  is_active: true,
  // ... outras propriedades
};

console.log(formatCurrency(plan.price_monthly, plan.currency)); // "R$ 99,90"
console.log(translateStatus(plan.is_active)); // "Ativo"
console.log(formatLimit(plan.max_users)); // "Ilimitado" ou número
```

## Integração com API

### Endpoints Utilizados

- **GET** `/management/plans` - Listagem paginada
- **GET** `/management/plans/:plan_id` - Detalhes de um plano
- **POST** `/management/plans` - Criar novo plano
- **PATCH** `/management/plans/:plan_id` - Atualizar plano
- **PATCH** `/management/plans/toggle-status/:plan_id` - Alternar status ativo/inativo
- **DELETE** `/management/plans/:plan_id` - Deletar plano

Todos os endpoints requerem autenticação via token Bearer.

## Moedas Suportadas

- **BRL** - Real Brasileiro (R$)
- **USD** - Dólar Americano ($)
- **EUR** - Euro (€)

## Limites

Os campos de limite (`max_users`, `max_branches`, `max_products`, `max_orders`) aceitam:

- **number** - Limite específico
- **null/undefined** - Ilimitado

Quando exibidos na interface, valores `null` são traduzidos como "Ilimitado" pela função `formatLimit()`.
