# Front Catalogo Menu - Contexto do Projeto

## Visao Geral

- Aplicacao web construída com Next.js 15.5 (App Router) e TypeScript em modo strict.
- Interface usando Chakra UI v3 com provider customizado em `components/ui/provider.tsx`.
- Autenticacao baseada em JWT com refresh tokens automaticos orquestrados por `middleware.ts`.
- Foco: sistema de pedidos/catalogo com gestao de conta de usuario e suporte a enderecos georreferenciados.

## Estrutura de Rotas

- `app/(public)/`: paginas publicas como termos, privacidade, registro e `404`.
- `app/(pages)/(user)/`: rotas privadas de conta (account, settings) com layout compartilhado.
- `app/(pages)/dashboard/`: dashboard principal protegido.
- `app/api/`: rotas de API server-side para manipular cookies (`get-cookies`, `set-cookies`, `delete-cookies`).

## Autenticacao e Cookies

- Cookies `access_token`, `refresh_token` e `profile` gerenciados via middleware e rotas API.
- Tokens salvos como httpOnly (exceto `profile`) e renovados automaticamente quando expiram.
- Listas de rotas (`publicPaths`, `publicGlobalPaths`, `privatePaths`) determinam comportamento de redirecionamento; rotas desconhecidas enviam para `/404`.

## Integracao Google Maps

- Padrão de modal em duas etapas: primeira etapa coleta dados e consulta ViaCEP; segunda etapa abre mapa e faz unica chamada ao Google Geocoding API.
- Componente `components/account/GoogleMap.tsx` recebe `latitude`, `longitude`, `onLocationChange`, `height`, `zoom` e expõe marcador arrastavel.
- Script do Google Maps carregado globalmente em `app/layout.tsx` com biblioteca `places`.

## Gerenciamento de Estado e Formulario

- Componentes complexos usam estados numericos (`useState<1 | 2>`) para controlar etapas de criacao/edicao.
- Estados de loading separados (`isLoadingCep`, `isLoadingGeocode`, `isAddingAddress`) para feedback preciso.
- Formulario padrao com React Hook Form + Zod (`@hookform/resolvers/zod`) para validacao tipada.

## Utilitarios e Tipos

- Funcoes de mascara em `components/account/utils.ts`: `formatCpf`, `formatCep`, `formatPhone`, `removeMask`, entre outras.
- Tipos centrais em `components/account/types.ts`: `IProfile`, `IUserPhone`, `IUserAddress`.
- Tipos do Google Maps declarados em `types/google-maps.d.ts` para acesso a `window.google` no cliente.

## Convencoes de Codigo

- Componentes cliente iniciam com "use client" quando necessario.
- Preferencia por arrow functions e exports nomeados (exceto paginas Next.js).
- Imports ordenados: React, Next, bibliotecas externas, modulos internos (`@/...`).
- Uso de `process.env.NEXT_PUBLIC_*` para variaveis disponiveis no cliente.

## Estilizacao e UI

- Chakra UI com temas centralizados; fontes Geist Sans/Mono via `next/font`.
- Notificacoes via `components/ui/toaster.tsx`.
- Componentes reutilizaveis agrupados em `components/ui/` com barrel exportes quando aplicavel.

## Configuracoes e Build

- Dev server roda em `npm run dev` na porta 3333 conforme `package.json`.
- Outros scripts relevantes: `npm run build` (producao) e `npm start` (modo producao).
- `next.config.ts` inclui otimizacoes de imports do Chakra UI e dominios permitidos (ex.: `develop.diegogaspar.dev.br`).

## Estrutura de Pastas (resumo)

```
app/
  (public)/
  (pages)/
  api/
components/
  account/
  ui/
public/
types/
utils/
```

## Requisitos de Ambiente

- Node.js (ver `package.json` para versao minima recomendada pelo Next.js 15.x).
- Variaveis `NEXT_PUBLIC_API_URL` e `NEXT_PUBLIC_GOOGLE_GEOCODING_API_KEY` para chamadas externas.
