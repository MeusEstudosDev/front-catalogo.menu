# AI Agent Reference - Catalogo.menu Frontend

> **Última atualização:** 10 de Outubro de 2025  
> **Versão do Projeto:** 0.1.0

Este documento serve como referência central para qualquer AI Agent que for trabalhar neste projeto. Leia atentamente antes de fazer qualquer alteração.

---

## 📋 Índice

1. [Visão Geral do Projeto](#visão-geral-do-projeto)
2. [Stack Tecnológica](#stack-tecnológica)
3. [Estrutura de Diretórios](#estrutura-de-diretórios)
4. [Padrões de Código](#padrões-de-código)
5. [Convenções de Nomenclatura](#convenções-de-nomenclatura)
6. [Roteamento e Navegação](#roteamento-e-navegação)
7. [Gerenciamento de Estado](#gerenciamento-de-estado)
8. [Estilização](#estilização)
9. [Autenticação e Autorização](#autenticação-e-autorização)
10. [Ambiente de Desenvolvimento](#ambiente-de-desenvolvimento)
11. [Boas Práticas](#boas-práticas)
12. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral do Projeto

**Nome:** catalogo.menu  
**Descrição:** Sistema de pedidos e catálogo online  
**Tipo:** E-commerce / Sistema de Pedidos  
**Framework Principal:** Next.js 15.5.2 (App Router)  
**Linguagem:** TypeScript 5

### Objetivos do Sistema
- Catálogo digital de produtos
- Sistema de pedidos online
- Gestão de negócios (businesses)
- Gerenciamento de usuários
- Área administrativa (manage-system)

---

## 🛠 Stack Tecnológica

### Core
- **Framework:** Next.js 15.5.2
- **Runtime:** React 19.1.0
- **Linguagem:** TypeScript 5
- **Package Manager:** npm

### UI/UX
- **Component Library:** Chakra UI v3.27.0
  - `@chakra-ui/react`
  - `@chakra-ui/form-control`
- **Styling:** 
  - Tailwind CSS v4
  - Emotion (CSS-in-JS) v11.14.0
- **Icons:** React Icons v5.5.0
- **Animações:** Framer Motion v12.23.15
- **Temas:** next-themes v0.4.6

### Formulários e Validação
- **Forms:** React Hook Form v7.62.0
- **Validation:** Zod v4.1.5
- **Resolvers:** @hookform/resolvers v5.2.1

### Utilitários
- **Dados Geográficos:** world-countries v5.1.0
- **Google Maps:** @types/google.maps v3.58.1

### Configuração de Desenvolvimento
- **Servidor de Dev:** Porta 3333 (`npm run dev`)
- **Build:** `npm run build`
- **Production:** `npm start`

---

## 📁 Estrutura de Diretórios

```
front-catalogo.menu/
├── app/                          # Next.js App Router
│   ├── (manage)/                 # Grupo de rotas - Área administrativa
│   │   ├── layout.tsx            # Layout para área de gestão
│   │   └── manage-system/        # Sistema de gerenciamento
│   │       ├── businesses/       # Gestão de negócios
│   │       └── users/            # Gestão de usuários
│   │
│   ├── (pages)/                  # Grupo de rotas - Páginas autenticadas
│   │   ├── layout.tsx            # Layout para páginas autenticadas
│   │   ├── (user)/               # Sub-grupo de usuário
│   │   │   ├── account/          # Conta do usuário
│   │   │   └── settings/         # Configurações
│   │   └── dashboard/            # Dashboard principal
│   │
│   ├── (public)/                 # Grupo de rotas - Páginas públicas
│   │   ├── 404/                  # Página de erro
│   │   ├── privacy/              # Política de privacidade
│   │   ├── register/             # Registro de usuário
│   │   └── terms/                # Termos de uso
│   │
│   ├── api/                      # API Routes
│   │   ├── delete-cookies/
│   │   ├── get-cookies/
│   │   └── set-cookies/
│   │
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Homepage
│   └── globals.css               # Estilos globais
│
├── components/                   # Componentes reutilizáveis
│   ├── account/                  # Componentes da área de conta
│   │   ├── AccountTab.tsx
│   │   ├── AddressesTab.tsx
│   │   ├── ChangePasswordTab.tsx
│   │   ├── GoogleMap.tsx
│   │   ├── PhonesTab.tsx
│   │   ├── types.ts              # Tipos TypeScript
│   │   ├── utils.ts              # Utilitários
│   │   └── index.ts              # Barrel export
│   │
│   └── ui/                       # Componentes de UI base
│       ├── color-mode.tsx
│       ├── footer.tsx
│       ├── main-menu.tsx
│       ├── password-input.tsx
│       ├── provider.tsx
│       └── toaster.tsx
│
├── types/                        # Definições de tipos globais
│   └── google-maps.d.ts
│
├── utils/                        # Funções utilitárias
│   └── converte-date.ts
│
├── public/                       # Arquivos estáticos
│   └── [imagens e ícones]
│
├── middleware.ts                 # Middleware do Next.js
├── next.config.ts                # Configuração do Next.js
├── tsconfig.json                 # Configuração do TypeScript
├── postcss.config.mjs            # Configuração do PostCSS
└── package.json                  # Dependências do projeto
```

### Convenções de Agrupamento de Rotas

- **(manage)** - Rotas administrativas que requerem permissões especiais
- **(pages)** - Rotas autenticadas para usuários normais
- **(public)** - Rotas públicas acessíveis sem autenticação
- **(user)** - Sub-grupo dentro de (pages) para funcionalidades específicas do usuário

---

## 💻 Padrões de Código

### TypeScript

**SEMPRE use TypeScript em todos os arquivos.**

```typescript
// ✅ BOM - Type explícito
interface UserProps {
  name: string;
  email: string;
}

export function UserCard({ name, email }: UserProps) {
  // ...
}

// ❌ RUIM - Sem tipos
export function UserCard({ name, email }) {
  // ...
}
```

### Componentes React

**Use Server Components por padrão (Next.js 15).**

```typescript
// ✅ Server Component (padrão)
export default function Page() {
  return <div>Content</div>;
}

// ✅ Client Component (quando necessário)
'use client';

import { useState } from 'react';

export function InteractiveComponent() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

### Imports

**Use o alias `@/` para importações absolutas.**

```typescript
// ✅ BOM
import { Button } from '@/components/ui/button';
import { formatDate } from '@/utils/converte-date';

// ❌ RUIM
import { Button } from '../../../components/ui/button';
```

### Barrel Exports

**Use index.ts para exports organizados.**

```typescript
// components/account/index.ts
export { AccountTab } from './AccountTab';
export { AddressesTab } from './AddressesTab';
export { ChangePasswordTab } from './ChangePasswordTab';
export * from './types';
```

---

## 📝 Convenções de Nomenclatura

### Arquivos

- **Componentes React:** `PascalCase.tsx` (ex: `AccountTab.tsx`)
- **Pages (App Router):** `page.tsx`
- **Layouts:** `layout.tsx`
- **API Routes:** `route.ts`
- **Utilitários:** `kebab-case.ts` (ex: `converte-date.ts`)
- **Tipos:** `types.ts` ou `[nome].d.ts`
- **Configuração:** `kebab-case.ts` ou `.mjs/.json`

### Código

- **Componentes:** `PascalCase` (ex: `UserCard`)
- **Funções:** `camelCase` (ex: `formatDate`)
- **Constantes:** `UPPER_SNAKE_CASE` (ex: `API_URL`)
- **Interfaces/Types:** `PascalCase` (ex: `UserProps`)
- **Variáveis:** `camelCase` (ex: `userData`)

---

## 🗺 Roteamento e Navegação

### Estrutura de Rotas

| Rota                     | Acesso      | Descrição                    |
|--------------------------|-------------|------------------------------|
| `/`                      | Público     | Homepage                     |
| `/register`              | Público     | Registro de usuário          |
| `/privacy`               | Público     | Política de privacidade      |
| `/terms`                 | Público     | Termos de uso                |
| `/404`                   | Público     | Página de erro               |
| `/dashboard`             | Privado     | Dashboard do usuário         |
| `/account`               | Privado     | Conta do usuário             |
| `/settings`              | Privado     | Configurações                |
| `/manage-system`         | Gestão      | Sistema administrativo       |
| `/manage-system/businesses` | Gestão   | Listagem de empresas         |
| `/manage-system/businesses/create` | Gestão | Criar nova empresa    |
| `/manage-system/businesses/edit` | Gestão | Editar empresa (com tabs) |
| `/manage-system/users`   | Gestão      | Gestão de usuários           |

### Middleware de Autenticação

O arquivo `middleware.ts` controla o acesso às rotas:

- **publicPaths:** `["/", "/register"]`
- **publicGlobalPaths:** `["/privacy", "/terms", "/404"]`
- **privatePaths:** `["/dashboard", "/account", "/settings"]`
- **managementPaths:** `["/manage-system", "/manage-system/businesses", "/manage-system/users"]`

**Rotas de criação e edição (com tabs):**
- `/manage-system/businesses/create` - Criação de empresa (padrão de tabs)
- `/manage-system/businesses/edit?id={id}` - Edição de empresa (padrão de tabs)

**Ao adicionar novas rotas, SEMPRE atualize o middleware correspondente.**

---

## 🔄 Gerenciamento de Estado

### Formulários

**Use React Hook Form + Zod para validação.**

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type FormData = z.infer<typeof schema>;

export function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  // ...
}
```

### Estado Local

**Use hooks nativos do React.**

```typescript
import { useState, useEffect } from 'react';

// Para componentes client-side
'use client';
```

---

## 🎨 Estilização

### Prioridade de Estilização

1. **Chakra UI Components** (preferido para componentes de UI)
2. **Tailwind CSS** (para layouts e utilidades)
3. **CSS-in-JS com Emotion** (quando necessário)

### Chakra UI

```typescript
import { Button, Box, Stack } from '@chakra-ui/react';

export function Example() {
  return (
    <Box p={4} bg="gray.100">
      <Stack direction="row" gap={2}>
        <Button colorScheme="blue">Primary</Button>
      </Stack>
    </Box>
  );
}
```

### Tailwind CSS

```typescript
export function Example() {
  return (
    <div className="p-4 bg-gray-100">
      <div className="flex gap-2">
        <button className="px-4 py-2 bg-blue-500 text-white rounded">
          Primary
        </button>
      </div>
    </div>
  );
}
```

### Tema e Dark Mode

**Use next-themes para gerenciar temas.**

```typescript
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  // ...
}
```

### Fontes

**Fontes configuradas:**
- `Geist Sans` (variável: `--font-geist-sans`)
- `Geist Mono` (variável: `--font-geist-mono`)

---

## 🔐 Autenticação e Autorização

### Sistema de Autenticação

O projeto usa autenticação baseada em **JWT** com:
- **Token de acesso** (access token)
- **Token de atualização** (refresh token)
- **Cookie de perfil** (profile)

### Middleware

A verificação de autenticação é feita no `middleware.ts`:

```typescript
// Função de decodificação JWT
function decodeJwt(token: string): any | null

// Validação de token
async function tokenIsValid(
  token: string | undefined,
  refreshToken: string | undefined,
  profileCookie: string | undefined,
  request: NextRequest
)
```

### API Routes para Cookies

- `POST /api/set-cookies` - Define cookies de autenticação
- `GET /api/get-cookies` - Recupera cookies
- `DELETE /api/delete-cookies` - Remove cookies (logout)

**Ao trabalhar com autenticação, sempre considere:**
- Validação de tokens expirados
- Refresh de tokens automático
- Redirecionamentos apropriados
- Proteção de rotas sensíveis

---

## 🌍 Variáveis de Ambiente

### Variáveis Necessárias

```env
# Google Maps API (obrigatório)
NEXT_PUBLIC_GOOGLE_GEOCODING_API_KEY=your_api_key_here
```

### Uso no Código

```typescript
// ✅ Variáveis públicas (NEXT_PUBLIC_)
const apiKey = process.env.NEXT_PUBLIC_GOOGLE_GEOCODING_API_KEY;

// ✅ Variáveis privadas (server-side only)
const secretKey = process.env.SECRET_KEY;
```

**NUNCA exponha variáveis secretas no client-side.**

---

## 💻 Ambiente de Desenvolvimento

### Comandos Principais

```bash
# Instalar dependências
npm install

# Servidor de desenvolvimento (porta 3333)
npm run dev

# Build de produção
npm run build

# Executar em produção
npm start
```

### Task do VS Code

Use a task configurada:
- **"Executar servidor de desenvolvimento"** - Executa `npm run dev` em background

### Portas

- **Desenvolvimento:** 3333
- **Domínios permitidos:** `develop.diegogaspar.dev.br`

---

## ✅ Boas Práticas

### 1. TypeScript First

- Sempre defina tipos/interfaces
- Evite `any` - use `unknown` se necessário
- Use tipos utilitários do TypeScript (`Partial`, `Pick`, `Omit`, etc.)

### 2. Componentes

- **Prefira Server Components** (mais performáticos)
- Use `'use client'` apenas quando necessário (interatividade, hooks, etc.)
- Mantenha componentes pequenos e focados
- Extraia lógica complexa para hooks customizados

### 3. Performance

- Use `next/image` para imagens
- Implemente lazy loading quando apropriado
- Minimize bundle size
- Use `React.memo()` criteriosamente

### 4. Acessibilidade

- Sempre use labels em formulários
- Adicione `aria-*` attributes quando necessário
- Teste com leitores de tela
- Mantenha contraste adequado

### 5. Segurança

- Nunca exponha tokens/secrets no client
- Valide sempre inputs do usuário
- Sanitize dados antes de exibir
- Use HTTPS em produção

### 6. Estrutura de Código

```typescript
// Ordem de imports
// 1. Bibliotecas externas
import { useState } from 'react';
import { Button } from '@chakra-ui/react';

// 2. Imports internos (alias @/)
import { UserCard } from '@/components/user-card';
import { formatDate } from '@/utils/converte-date';

// 3. Imports relativos
import { UserType } from './types';

// 4. Estilos (se houver)
import styles from './styles.module.css';
```

### 7. Organização de Componentes

```typescript
// 1. Imports

// 2. Types/Interfaces
interface ComponentProps {
  // ...
}

// 3. Constantes
const DEFAULT_VALUE = 10;

// 4. Componente principal
export function Component({ prop }: ComponentProps) {
  // 4.1 Hooks
  const [state, setState] = useState();
  
  // 4.2 Funções
  const handleClick = () => {
    // ...
  };
  
  // 4.3 Effects
  useEffect(() => {
    // ...
  }, []);
  
  // 4.4 Render
  return (
    // JSX
  );
}

// 5. Sub-componentes (se houver)
```

---

## 🐛 Troubleshooting

### Problema: Hydration Mismatch

**Causa:** Diferença entre renderização server-side e client-side  
**Solução:** Use `suppressHydrationWarning` em elementos que variam (ex: tema)

```typescript
<html suppressHydrationWarning>
```

### Problema: Módulo não encontrado

**Causa:** Caminho de import incorreto  
**Solução:** Use o alias `@/` configurado no `tsconfig.json`

### Problema: Google Maps não carrega

**Causa:** API key não configurada  
**Solução:** Configure `NEXT_PUBLIC_GOOGLE_GEOCODING_API_KEY` no `.env.local`

### Problema: Erro de compilação TypeScript

**Causa:** Tipos incompatíveis ou ausentes  
**Solução:** 
1. Verifique tipos das props
2. Execute `npm install @types/[biblioteca]` se necessário
3. Defina tipos customizados em `types/`

---

## 📦 Adicionando Novas Funcionalidades

### Checklist para Novas Features

- [ ] Criar/identificar a rota apropriada em `app/`
- [ ] Definir tipos em arquivo `types.ts` local
- [ ] Criar componentes em `components/`
- [ ] Adicionar validação com Zod (se formulário)
- [ ] Atualizar middleware se necessário (autenticação)
- [ ] Testar em diferentes temas (light/dark)
- [ ] Verificar responsividade
- [ ] Adicionar tratamento de erros
- [ ] Documentar código complexo
- [ ] Verificar acessibilidade

### Exemplo: Adicionando Nova Página

```typescript
// 1. Criar arquivo: app/(pages)/nova-funcionalidade/page.tsx

// 2. Adicionar rota no middleware (se privada)
const privatePaths = [..., "/nova-funcionalidade"];

// 3. Criar componentes necessários
// components/nova-funcionalidade/NovaFuncionalidadeCard.tsx

// 4. Adicionar tipos
// components/nova-funcionalidade/types.ts
```

---

## 🔧 Configurações Importantes

### Next.js Config

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["@chakra-ui/react"], // Otimização do Chakra UI
  },
  allowedDevOrigins: ["develop.diegogaspar.dev.br"],
};
```

### TypeScript Config

- **Paths:** Alias `@/*` aponta para raiz do projeto
- **Strict mode:** Ativado
- **Module Resolution:** Bundler

### PostCSS

- Configurado para Tailwind CSS v4

---

## 📚 Recursos Adicionais

### Documentação Oficial

- [Next.js 15 Docs](https://nextjs.org/docs)
- [React 19 Docs](https://react.dev)
- [Chakra UI v3 Docs](https://www.chakra-ui.com/docs)
- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs)
- [React Hook Form](https://react-hook-form.com)
- [Zod](https://zod.dev)

### Padrões de Design

- Use **Compound Components** para componentes complexos
- Aplique **Composition** over inheritance
- Implemente **Controlled Components** para formulários

---

## 🎯 Filosofia do Projeto

1. **TypeScript em tudo** - Segurança de tipos é prioridade
2. **Server-first** - Use Server Components quando possível
3. **Performance** - Otimize desde o início
4. **Acessibilidade** - Design inclusivo sempre
5. **Developer Experience** - Código limpo e manutenível
6. **Consistência** - Siga os padrões estabelecidos

---

## ⚠️ IMPORTANTE: Leia Antes de Modificar

### Antes de Fazer Alterações:

1. **Leia este documento completamente**
2. **Entenda a estrutura de rotas** (grupos de rotas)
3. **Verifique o middleware** para autenticação
4. **Use TypeScript** - sem exceções
5. **Siga as convenções** de nomenclatura
6. **Teste localmente** antes de commitar
7. **Mantenha consistência** com código existente

### Ao Criar Novos Arquivos:

- Use o padrão de nomenclatura correto
- Adicione tipos TypeScript apropriados
- Organize imports na ordem correta
- Adicione comentários em código complexo
- Exporte componentes pelo `index.ts` quando aplicável

### Ao Modificar Código Existente:

- Entenda o contexto completo antes de mudar
- Verifique dependências e usages
- Mantenha backward compatibility quando possível
- Teste cenários de erro
- Atualize tipos se necessário

---

**Este documento é vivo e deve ser atualizado conforme o projeto evolui.**

**Última revisão:** 10 de Outubro de 2025
