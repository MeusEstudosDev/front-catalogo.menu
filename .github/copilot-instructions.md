# Front Catálogo Menu - Instruções para Agentes de IA

## Visão Geral da Arquitetura

Este é um projeto **Next.js 15.5** (App Router) com **Chakra UI v3** para interface, autenticação baseada em JWT com refresh tokens, e integração com Google Maps API. A aplicação é um sistema de pedidos/catálogo com gestão de conta de usuário.

### Estrutura de Rotas

- `app/(public)/` - Rotas públicas (termos, privacidade, registro)
- `app/(pages)/(user)/` - Rotas protegidas (account, settings) com layout compartilhado
- `app/(pages)/dashboard/` - Dashboard principal
- `app/api/` - Rotas de API para manipulação de cookies server-side

## Convenções Críticas do Projeto

### 1. Autenticação e Middleware

O `middleware.ts` implementa sistema de refresh token automático:

- Tokens são armazenados em **cookies httpOnly**
- Refresh automático quando `access_token` expira
- Cookie `profile` não é httpOnly (acessível client-side)
- Rotas definidas em arrays: `publicPaths`, `publicGlobalPaths`, `privatePaths`
- Redirecionamento para `/404` para rotas desconhecidas

**Importante**: Para acessar variáveis de ambiente no cliente, use prefixo `NEXT_PUBLIC_`:

```typescript
process.env.NEXT_PUBLIC_API_URL;
process.env.NEXT_PUBLIC_GOOGLE_GEOCODING_API_KEY;
```

### 2. Integração Google Maps (Padrão de Duas Etapas)

Componentes com endereços seguem padrão de **modal em duas etapas** para otimizar chamadas à API:

**Etapa 1**: Formulário de dados

- Busca CEP via ViaCEP (gratuito)
- Preenchimento automático de campos
- **Sem chamadas ao Google Maps**

**Etapa 2**: Confirmação no mapa

- **Uma única chamada** ao Google Geocoding API
- Mapa interativo com marcador arrastável
- Coordenadas atualizáveis pelo usuário

Ver `GOOGLE_MAPS_IMPLEMENTATION.md` e `MODAL_TWO_STEPS_OPTIMIZATION.md` para detalhes.

**Componente GoogleMap** (`components/account/GoogleMap.tsx`):

- Props: `latitude`, `longitude`, `onLocationChange`, `height`, `zoom`
- Marcador arrastável e clicável
- Callback para atualizar coordenadas no componente pai

### 3. Gerenciamento de Estado

Padrão consistente com `useState` para componentes complexos:

```typescript
const [createAddressStep, setCreateAddressStep] = useState<1 | 2>(1);
const [editAddressStep, setEditAddressStep] = useState<1 | 2>(1);
```

Estados de loading separados para cada operação:

```typescript
const [isLoadingCep, setIsLoadingCep] = useState(false);
const [isLoadingGeocode, setIsLoadingGeocode] = useState(false);
const [isAddingAddress, setIsAddingAddress] = useState(false);
```

### 4. Formulários e Validação

- **React Hook Form** com **Zod** para validação
- Resolver: `@hookform/resolvers/zod`
- Exemplo padrão:

```typescript
const schema = z.object({
  email: z.email("E-mail inválido."),
  password: z.string().min(1, "Senha é obrigatória."),
});
type FormData = z.infer<typeof schema>;
const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm<FormData>({
  resolver: zodResolver(schema),
});
```

### 5. UI e Estilização

- **Chakra UI v3** com sistema de design padrão
- Provider customizado: `components/ui/provider.tsx` (inclui ColorModeProvider e Toaster)
- Fontes: Geist Sans e Geist Mono via `next/font/google`
- Notificações: `toaster` de `@/components/ui/toaster`
- Componentes UI customizados em `components/ui/`

### 6. Máscaras e Formatação

Utilitários em `components/account/utils.ts`:

- `formatCpf()`, `formatCep()`, `formatDate()`, `formatPhone()`
- `removeMask()` - remove caracteres não numéricos
- `formatISODateToDisplay()` - converte ISO para DD/MM/AAAA

### 7. Tipos TypeScript

Interfaces principais em `components/account/types.ts`:

- `IProfile` - dados do usuário
- `IUserPhone` - telefones com verificação
- `IUserAddress` - endereços com coordenadas opcionais

Tipos Google Maps em `types/google-maps.d.ts` (necessário para `window.google`).

## Comandos de Desenvolvimento

```bash
npm run dev      # Servidor em localhost:3333 (porta customizada)
npm run build    # Build de produção
npm start        # Inicia servidor de produção
```

**Importante**: Dev server roda na porta **3333**, não na padrão 3000.

## Padrões de API

Todas as chamadas de API usam:

- Base URL: `process.env.NEXT_PUBLIC_API_URL`
- Headers padrão: `Authorization: Bearer ${token}`, `Content-Type: application/json`
- Cookies obtidos via `/api/get-cookies` ou diretamente de `document.cookie`
- Padrão de tratamento de erro com toaster para feedback ao usuário

Exemplo:

```typescript
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}endpoint`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(data),
});
```

## Estrutura de Componentes

- **Componentes de conta**: Organizados em `components/account/` com barrel export (`index.ts`)
- **Componentes UI**: Reutilizáveis em `components/ui/`
- **Client Components**: Sempre marcar com `"use client"` quando usar hooks ou estado
- **Layouts**: Aninhados com layouts específicos para grupos de rotas

## Notas Importantes

1. **Idioma**: Interface em **português brasileiro**
2. **TypeScript estrito**: `strict: true` ativado
3. **Path alias**: `@/*` aponta para raiz do projeto
4. **Otimizações**: Package imports otimizados para Chakra UI no `next.config.ts`
5. **Google Maps**: Script carregado globalmente no `app/layout.tsx` com biblioteca `places`
6. **Domínios permitidos**: `develop.diegogaspar.dev.br` em `allowedDevOrigins`

## Convenções de Código

- Use arrow functions para componentes
- Export default para páginas Next.js
- Named exports para componentes reutilizáveis
- Organize imports: React → Next → Third-party → Local (@/)
- Prefira `const` sobre `let`/`var`
- Use tipos explícitos em vez de inferência quando clareza é importante
