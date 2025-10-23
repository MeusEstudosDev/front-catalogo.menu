# 🔧 Guia de Troubleshooting - Sistema de Notificações

## 🎯 Resolução de Problemas Comuns

---

## 1. 🐌 UI Não Está Instantânea

### Sintoma
- Ações de notificação demoram mais de 100ms
- Spinner/loading aparece ao marcar como lida ou deletar
- Usuário precisa esperar para ver mudança

### Diagnóstico
```typescript
// Verificar se está usando fire and forget
// ❌ ERRADO (espera)
const action = async () => {
  await toggleRead(id, isRead); // Bloqueia!
  toast.success("OK");
};

// ✅ CORRETO (não espera)
const action = () => {
  toggleRead(id, isRead).catch(console.error); // Fire and forget
  toast.success("OK"); // Imediato
};
```

### Solução
1. Remover `await` das ações no componente
2. Mover toast para ANTES da chamada da função
3. Usar `.catch()` para erros ao invés de `try/catch`

```typescript
// components/ui/main-menu.tsx
const toggleReadNotification = (notificationId: string, isRead: boolean) => {
  // Fire and forget
  toggleRead(notificationId, isRead).catch((error) => {
    console.error("Erro:", error);
    toaster.error({ title: "Erro", description: "..." });
  });
  
  // Toast IMEDIATO
  toaster.success({ title: "Atualizada!" });
};
```

---

## 2. 🔄 Requisições Duplicadas

### Sintoma
- Múltiplas requisições para mesma notificação
- Console mostra requisições em duplicata
- Backend registra ações duplicadas

### Diagnóstico
```bash
# Chrome DevTools > Network
# Filtrar por: notifications
# Verificar: requisições duplicadas em < 2s
```

### Solução
1. Verificar `dedupingInterval` do SWR:
```typescript
// hooks/useNotifications.ts
useSWR(key, fetcher, {
  dedupingInterval: 2000, // DEVE estar configurado
  // ...
});
```

2. Verificar se sistema de fila está ativo:
```typescript
// hooks/useNotifications.ts
const actionQueue = useRef(new ActionQueue()).current;

const toggleRead = async (...) => {
  return actionQueue.add(async () => {
    // Lógica aqui
  });
};
```

---

## 3. ⏱️ Timeout Não Funciona

### Sintoma
- Requisições demoram mais de 5s sem cancelar
- UI trava em conexões lentas
- AbortError não aparece no console

### Diagnóstico
```typescript
// Verificar implementação do AbortController
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000);

fetch(url, {
  signal: controller.signal, // DEVE ter signal
});
```

### Solução
```typescript
// hooks/useNotifications.ts
const toggleRead = async (...) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { ... },
      signal: controller.signal, // ✅ Cancelável
    });
    
    clearTimeout(timeoutId); // ✅ Limpar timeout
    
    // ...
  } catch (error: any) {
    clearTimeout(timeoutId); // ✅ Limpar timeout
    
    if (error.name === 'AbortError') {
      console.warn('Timeout, mantendo mudança otimista');
      return true; // Não reverte
    }
    
    throw error;
  }
};
```

---

## 4. 💾 Cache Não Invalida

### Sintoma
- Após ação, lista não atualiza
- Contador de não lidas fica desatualizado
- Reabrir menu mostra dados antigos

### Diagnóstico
```bash
# Console do Browser
localStorage.getItem('swr-cache-notifications')
# Verificar se cache está sendo salvo
```

### Solução
1. Verificar chave do SWR:
```typescript
// hooks/useNotifications.ts
const key = enabled ? ['notifications', page, unreadOnly] : null;
//                      ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//                      Deve incluir todos os parâmetros que afetam dados
```

2. Verificar invalidação:
```typescript
// hooks/useNotifications.ts
mutate(
  (key) => Array.isArray(key) && key[0] === 'notifications',
  undefined,
  { revalidate: true }
);
```

3. Verificar background revalidation:
```typescript
setTimeout(() => {
  mutateSWR();
  mutate(...);
}, 100); // Delay de 100ms
```

---

## 5. 🔌 Socket.IO Não Conecta

### Sintoma
- Console mostra erro de conexão
- Notificações em tempo real não funcionam
- Socket state fica "disconnected"

### Diagnóstico
```javascript
// Console do Browser
socket.connected // deve ser true
```

### Solução
1. Verificar URL do socket:
```typescript
// .env.local
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

2. Verificar conexão:
```typescript
// components/ui/main-menu.tsx
const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 10000,
});

newSocket.on('connect', () => {
  console.log('Socket conectado!'); // Deve aparecer
});

newSocket.on('connect_error', (error) => {
  console.error('Erro:', error); // Verificar erros
});
```

3. Verificar CORS no backend:
```typescript
// Backend (exemplo)
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
});
```

---

## 6. 🎯 Atualização Otimista Reverte

### Sintoma
- UI atualiza mas depois volta ao estado anterior
- Mudanças não persistem
- Contador de não lidas fica incorreto

### Diagnóstico
```typescript
// Verificar se erro está revertendo corretamente
if (error.name === 'AbortError') {
  // Timeout: NÃO deve reverter
  return true;
}
// Erro real: DEVE reverter
revert();
```

### Solução
```typescript
// hooks/useNotifications.ts
const toggleRead = async (...) => {
  // Atualização otimista
  await updateNotificationLocally(notificationId, { read_at: newReadAt });
  
  try {
    const response = await fetch(...);
    // ... sucesso
  } catch (error: any) {
    // Timeout: MANTÉM mudança
    if (error.name === 'AbortError') {
      console.warn('Timeout, mas mantendo mudança');
      return true; // ✅ Não reverte
    }
    
    // Erro real: REVERTE
    await updateNotificationLocally(notificationId, { read_at: oldValue });
    throw error;
  }
};
```

---

## 7. 📱 Problemas Mobile

### Sintoma
- Touch não funciona corretamente
- Menu de notificações sai da tela
- Scroll travado

### Solução
1. Verificar responsividade:
```typescript
// components/ui/main-menu.tsx
<Menu.Content
  minW="400px"  // Desktop
  maxW="500px"
  maxH="600px"
  
  // Adicionar para mobile:
  w={{ base: "90vw", md: "400px" }}
  maxW={{ base: "90vw", md: "500px" }}
>
```

2. Verificar scroll:
```typescript
<Box
  maxH="400px"
  overflowY="auto"
  onScroll={handleNotificationScroll}
  
  // Adicionar para mobile:
  css={{
    WebkitOverflowScrolling: 'touch',
  }}
>
```

---

## 8. 🔥 Fila de Ações Não Processa

### Sintoma
- Múltiplas ações simultâneas travam
- Fila cresce mas não processa
- Console mostra "processing = false" mas nada acontece

### Diagnóstico
```typescript
// hooks/useNotifications.ts
class ActionQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;

  // Adicionar logs temporários
  async add<T>(action: () => Promise<T>): Promise<T> {
    console.log('Adicionando à fila, tamanho:', this.queue.length + 1);
    // ...
  }

  private async process() {
    console.log('Processando fila, tamanho:', this.queue.length);
    // ...
  }
}
```

### Solução
```typescript
class ActionQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;

  async add<T>(action: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await action();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.process(); // ✅ DEVE chamar process()
    });
  }

  private async process() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const action = this.queue.shift();
      if (action) {
        try {
          await action();
        } catch (error) {
          console.error('Erro na fila:', error);
        }
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    this.processing = false;
  }
}
```

---

## 9. 🎨 UI Não Atualiza Visualmente

### Sintoma
- Notificação marcada como lida mas continua com fundo azul
- Contador não atualiza
- Lista não remove notificação deletada

### Diagnóstico
```typescript
// Verificar mutação local
const updateNotificationLocally = async (...) => {
  if (!data) return; // ⚠️ Problema: data pode estar undefined
  
  await mutateSWR({
    ...data,
    data: data.data.map(...),
  }, false); // ✅ false = não revalidar ainda
};
```

### Solução
```typescript
// hooks/useNotifications.ts
const updateNotificationLocally = async (...) => {
  if (!data) {
    console.warn('Dados não disponíveis ainda');
    return;
  }

  // Mutação local imediata
  await mutateSWR(
    {
      ...data,
      data: data.data.map(notif =>
        notif.id === notificationId
          ? { ...notif, ...updates } // ✅ Spread correto
          : notif
      ),
    },
    false // ✅ Não revalidar ainda
  );
};
```

---

## 10. 🚨 Erros Comuns no Console

### Erro: "Cannot read property 'data' of undefined"
**Causa:** SWR ainda não carregou dados
**Solução:**
```typescript
const { data, isLoading } = useSWR(...);

// Proteger contra undefined
const notifications = data?.data || [];
const unreadCount = data?.information?.unread_count || 0;
```

### Erro: "AbortError: The user aborted a request"
**Causa:** Timeout de 5s
**Solução:** Isso é NORMAL! Apenas log informativo:
```typescript
if (error.name === 'AbortError') {
  console.warn('Timeout esperado, mantendo mudança');
  return true;
}
```

### Erro: "mutate is not a function"
**Causa:** Importação incorreta
**Solução:**
```typescript
import useSWR, { mutate } from 'swr'; // ✅ Correto
```

### Erro: "Socket.IO connection error"
**Causa:** URL incorreta ou servidor offline
**Solução:**
```bash
# Verificar .env.local
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

# Verificar se backend está rodando
curl http://localhost:3001/socket.io/
```

---

## 🔍 Ferramentas de Debug

### 1. React DevTools
```bash
# Instalar extensão: React Developer Tools
# Inspecionar componente MainMenu
# Verificar states: notifications, isLoading, etc.
```

### 2. Chrome Network Tab
```bash
# Chrome DevTools > Network
# Filtrar por: notifications
# Verificar:
# - Timing de requisições
# - Headers (Authorization?)
# - Response (200, 401, 500?)
```

### 3. Console Logs
```typescript
// Adicionar temporariamente
console.log('🔍 Notificações:', notifications);
console.log('🔢 Contador:', unreadCount);
console.log('⏳ Loading:', isLoading);
console.log('🔄 Validating:', isValidating);
```

### 4. Redux DevTools (se usando)
```bash
# Instalar extensão: Redux DevTools
# Ver actions e state mutations
```

---

## 📊 Checklist de Debug

Quando algo não funciona:

1. [ ] Verificar console para erros
2. [ ] Verificar Network tab para requisições
3. [ ] Verificar React DevTools para states
4. [ ] Verificar .env.local para variáveis
5. [ ] Verificar backend está rodando
6. [ ] Verificar token de autenticação
7. [ ] Verificar CORS no backend
8. [ ] Limpar cache do browser
9. [ ] Reiniciar servidor Next.js
10. [ ] Verificar versões de dependências

---

## 🆘 Quando Pedir Ajuda

Se após seguir este guia o problema persistir, colete:

1. **Logs do console** (erros completos)
2. **Network requests** (screenshot)
3. **Código relevante** (função que falha)
4. **Passos para reproduzir**
5. **Ambiente** (browser, OS, versão do Next.js)

Exemplo:
```
Problema: UI não atualiza ao marcar como lida

Logs:
- "Cannot read property 'data' of undefined"

Network:
- PATCH /notifications/123/read → 200 OK

Código:
- toggleReadNotification() em main-menu.tsx

Passos:
1. Abrir menu de notificações
2. Clicar em "marcar como lida"
3. UI não atualiza

Ambiente:
- Chrome 120, Ubuntu 22.04, Next.js 14
```

---

## ✅ Conclusão

Este guia cobre **90% dos problemas comuns**. Se encontrar algo novo:
1. Documente o problema
2. Documente a solução
3. Adicione a este guia

**Boa sorte!** 🚀
