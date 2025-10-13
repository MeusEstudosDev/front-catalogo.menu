# Business Edit Module

Este módulo fornece componentes para edição completa de empresas, seguindo os mesmos padrões UX/UI da área de conta de usuário.

## Estrutura

```
components/business-edit/
├── BasicInfoTab.tsx      # Tab de informações básicas
├── PhonesTab.tsx        # Tab de telefones (CRUD)
├── AddressesTab.tsx     # Tab de endereços (CRUD)
├── EmailsTab.tsx        # Tab de e-mails (CRUD)
├── types.ts             # Interfaces TypeScript
├── utils.ts             # Funções utilitárias
├── index.ts             # Exports centralizados
└── README.md            # Esta documentação
```

## Tabs Disponíveis

### 1. BasicInfoTab
Exibe e permite editar informações básicas da empresa:
- **code** (readonly): Código único da empresa
- **created_at** (readonly): Data de criação
- **status**: Status da empresa com dropdown (ACTIVE, INACTIVE, SUSPENDED)
- **cnpj**: CNPJ com formatação automática
- **name**: Nome da empresa
- **website**: Website da empresa

**Props:**
- `businessId: string` - ID da empresa a ser editada

**API:**
- GET `/businesses/{id}` - Busca dados da empresa
- PUT `/businesses/{id}` - Atualiza informações básicas

### 2. PhonesTab
Gerencia telefones da empresa com CRUD completo:
- Lista todos os telefones cadastrados
- Adiciona novos telefones com validação
- Edita telefones existentes
- Remove telefones
- Suporta múltiplos códigos de país (DDI)
- Validação específica para números brasileiros

**Tipos de telefone:**
- PERSONAL
- RESIDENTIAL
- COMMERCIAL
- OTHER

**Props:**
- `businessId: string` - ID da empresa

**API:**
- GET `/businesses/{id}/phones` - Lista telefones
- POST `/businesses/{id}/phones` - Adiciona telefone
- PUT `/businesses/{id}/phones/{phoneId}` - Atualiza telefone
- DELETE `/businesses/{id}/phones/{phoneId}` - Remove telefone

### 3. AddressesTab
Gerencia endereços da empresa com CRUD completo:
- Lista todos os endereços cadastrados
- Adiciona novos endereços com busca por CEP
- Edita endereços existentes
- Remove endereços
- Visualização em mapa (Google Maps)
- Integração com API ViaCEP

**Tipos de endereço:**
- RESIDENTIAL
- COMMERCIAL
- OTHER

**Props:**
- `businessId: string` - ID da empresa

**API:**
- GET `/businesses/{id}/addresses` - Lista endereços
- POST `/businesses/{id}/addresses` - Adiciona endereço
- PUT `/businesses/{id}/addresses/{addressId}` - Atualiza endereço
- DELETE `/businesses/{id}/addresses/{addressId}` - Remove endereço

### 4. EmailsTab
Gerencia e-mails da empresa com CRUD completo:
- Lista todos os e-mails cadastrados
- Adiciona novos e-mails com validação
- Edita e-mails existentes
- Remove e-mails
- Indicação de e-mails verificados

**Tipos de e-mail:**
- GENERAL
- SALES
- SUPPORT
- BILLING
- OTHER

**Props:**
- `businessId: string` - ID da empresa

**API:**
- GET `/businesses/{id}/emails` - Lista e-mails
- POST `/businesses/{id}/emails` - Adiciona e-mail
- PUT `/businesses/{id}/emails/{emailId}` - Atualiza e-mail
- DELETE `/businesses/{id}/emails/{emailId}` - Remove e-mail

## Uso

### Importação

```tsx
import {
  BasicInfoTab,
  PhonesTab,
  AddressesTab,
  EmailsTab,
} from "@/components/business-edit";
```

### Exemplo de Uso na Página

```tsx
"use client";

import {
  BasicInfoTab,
  PhonesTab,
  AddressesTab,
  EmailsTab,
} from "@/components/business-edit";
import { Tabs } from "@chakra-ui/react";

export default function BusinessEditPage() {
  const businessId = "uuid-da-empresa";

  return (
    <Tabs.Root defaultValue="info">
      <Tabs.List>
        <Tabs.Trigger value="info">Informações Básicas</Tabs.Trigger>
        <Tabs.Trigger value="phones">Telefones</Tabs.Trigger>
        <Tabs.Trigger value="addresses">Endereços</Tabs.Trigger>
        <Tabs.Trigger value="emails">E-mails</Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="info">
        <BasicInfoTab businessId={businessId} />
      </Tabs.Content>

      <Tabs.Content value="phones">
        <PhonesTab businessId={businessId} />
      </Tabs.Content>

      <Tabs.Content value="addresses">
        <AddressesTab businessId={businessId} />
      </Tabs.Content>

      <Tabs.Content value="emails">
        <EmailsTab businessId={businessId} />
      </Tabs.Content>
    </Tabs.Root>
  );
}
```

## Interfaces TypeScript

### IBusinessDetail
```typescript
interface IBusinessDetail {
  id: string;
  code: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  cnpj: string;
  name: string;
  website: string | null;
  status: BusinessStatus;
}
```

### IBusinessPhone
```typescript
interface IBusinessPhone {
  id: string;
  code: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  type: "PERSONAL" | "RESIDENTIAL" | "COMMERCIAL" | "OTHER";
  country_code: string;
  number: string;
  primary: boolean;
  verified: Date | null;
  business_id: string;
}
```

### IBusinessAddress
```typescript
interface IBusinessAddress {
  id: string;
  code: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  type: "RESIDENTIAL" | "COMMERCIAL" | "OTHER";
  cep: string;
  city: string;
  state: string;
  district: string;
  street: string;
  number: string;
  complement?: string;
  primary: boolean;
  latitude?: number;
  longitude?: number;
  business_id: string;
}
```

### IBusinessEmail
```typescript
interface IBusinessEmail {
  id: string;
  code: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  type: "GENERAL" | "SALES" | "SUPPORT" | "BILLING" | "OTHER";
  email: string;
  is_verified: boolean;
  primary: boolean;
  verified_at: Date | null;
  business_id: string;
}
```

## Funções Utilitárias (utils.ts)

### Formatação
- `formatCNPJ(cnpj: string): string` - Formata CNPJ (XX.XXX.XXX/XXXX-XX)
- `formatPhone(countryCode: string, number: string): string` - Formata telefone
- `formatCEP(cep: string): string` - Formata CEP (XXXXX-XXX)
- `formatDate(date: Date | string): string` - Formata data para exibição

### Remoção de Máscaras
- `removeMask(value: string): string` - Remove caracteres não numéricos

### Validação
- `validateCNPJ(cnpj: string): boolean` - Valida CNPJ
- `validateEmail(email: string): boolean` - Valida e-mail
- `validateCEP(cep: string): boolean` - Valida CEP

## Características

### UX/UI Consistente
- Segue os mesmos padrões da área de conta de usuário
- Modais para ações de criar, editar e excluir
- Feedback visual com toasts (sucesso, erro)
- Loading states em todas as operações assíncronas
- Badges coloridos para status e tipos

### Validações
- Validação de campos obrigatórios
- Validação de formatos (CNPJ, e-mail, CEP, telefone)
- Validação específica para números brasileiros
- Mensagens de erro claras e descritivas

### Acessibilidade
- Labels descritivos
- Estados de loading visíveis
- Confirmação para ações destrutivas
- Feedback visual para interações

### Integração com APIs
- Tratamento de erros HTTP
- Loading states durante requisições
- Refresh automático após operações CRUD
- Suporte a tokens de autenticação

## Rotas da Página

A página de edição está localizada em:
```
/manage-system/businesses/edit?id={businessId}
```

## Dependências

- **@chakra-ui/react**: Componentes UI
- **react-hook-form**: Formulários
- **zod**: Validação de schemas
- **react-icons**: Ícones
- **world-countries**: Lista de países (para telefones)
- **Google Maps API**: Visualização de mapas (endereços)
- **ViaCEP API**: Busca de endereços por CEP

## Próximos Passos

- [ ] Implementar verificação de e-mail
- [ ] Adicionar campo de e-mail primário
- [ ] Implementar verificação de telefone
- [ ] Adicionar campo de telefone primário
- [ ] Melhorar validações de campos
- [ ] Adicionar testes unitários
- [ ] Implementar paginação nas listas (se necessário)
- [ ] Adicionar filtros e busca nas tabs

## Convenções de Código

- **Nomenclatura**: PascalCase para componentes, camelCase para funções
- **Imports**: Organizados por categoria (externos, internos, tipos)
- **Estado**: useState para estado local, fetch para dados do servidor
- **Erros**: Sempre mostrar feedback ao usuário via toasts
- **Loading**: Sempre indicar operações assíncronas em andamento
- **Modais**: Confirmação para ações destrutivas (delete)
