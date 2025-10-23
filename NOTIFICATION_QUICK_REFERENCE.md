# 📇 Quick Reference Cards - Sistema de Notificações

## 🚀 Referência Rápida para Desenvolvimento

---

## Card 1: Fire and Forget Pattern

### ❌ EVITAR
```typescript
// Bloqueia UI
const action = async () => {
  setLoading(true);
  await apiCall();
  setLoading(false);
  toast.success("OK");
};
```

### ✅ USAR
```typescript
// Não bloqueia UI
const action = () => {
  apiCall().catch(console.error);
  toast.success("OK"); // Imediato
};
```

---

## Card 2: Atualização Otimista

### Receita
```typescript
1. Atualizar UI localmente
2. Mostrar toast de sucesso
3. Fazer requisição em background
4. Em erro: reverter e mostrar erro
```

### Exemplo
```typescript
const toggleRead = (id: string, isRead: boolean) => {
  // 1. Atualizar UI
  updateUI(id, { read_at: isRead ? null : new Date() });
  
  // 2. Toast imediato
  toast.success("Atualizada!");
  
  // 3. Background sync
  api.toggleRead(id, isRead).catch(error => {
    // 4. Reverter em erro
    updateUI(id, { read_at: isRead ? new Date() : null });
    toast.error("Erro!");
  });
};
```

---

## Card 3: Sistema de Fila

### Quando usar?
- Múltiplas ações simultâneas
- Evitar sobrecarga do servidor
- Garantir ordem de execução

### Código
```typescript
class ActionQueue {
  private queue = [];
  private processing = false;

  async add(action) {
    this.queue.push(action);
    this.process();
  }

  private async process() {
    if (this.processing) return;
    this.processing = true;
    
    while (this.queue.length > 0) {
      await this.queue.shift()();
      await delay(50); // Espaçar ações
    }
    
    this.processing = false;
  }
}
```

---

## Card 4: Timeout com AbortController

### Problema
Requisições podem travar indefinidamente

### Solução
```typescript
const fetchWithTimeout = async (url, timeout = 5000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    
    if (error.name === 'AbortError') {
      // Timeout: não reverter (graceful)
      return null;
    }
    
    throw error;
  }
};
```

---

## Card 5: SWR Cache

### Configuração Recomendada
```typescript
useSWR(key, fetcher, {
  dedupingInterval: 2000,      // Deduplica 2s
  refreshInterval: 30000,       // Auto-refresh 30s
  revalidateOnFocus: true,      // Revalida ao focar
  revalidateOnReconnect: true,  // Revalida ao reconectar
  keepPreviousData: true,       // Mantém dados anteriores
});
```

### Invalidar Cache
```typescript
// Invalidar todas as páginas de notificações
mutate(
  (key) => Array.isArray(key) && key[0] === 'notifications',
  undefined,
  { revalidate: true }
);
```

---

## Card 6: Socket.IO Setup

### Cliente
```typescript
const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

socket.on('connect', () => console.log('Conectado'));
socket.on(`${userId}-notifications`, (notification) => {
  toast.info(notification.title);
  invalidateCache();
});
```

### Cleanup
```typescript
useEffect(() => {
  // ... setup socket
  
  return () => {
    socket.off(`${userId}-notifications`);
    socket.disconnect();
  };
}, [userId]);
```

---

## Card 7: Tratamento de Erros

### Estratégia
```typescript
try {
  await action();
} catch (error) {
  // Timeout: manter mudança (graceful)
  if (error.name === 'AbortError') {
    console.warn('Timeout, mantendo mudança');
    return true;
  }
  
  // Erro real: reverter (seguro)
  revert();
  toast.error("Erro!");
  throw error;
}
```

---

## Card 8: Debug Checklist

### Quando algo não funciona:
1. [ ] Console tem erros?
2. [ ] Network mostra requisição?
3. [ ] Token está válido?
4. [ ] Backend está rodando?
5. [ ] .env.local está correto?
6. [ ] Cache está limpo?
7. [ ] SWR key está correta?
8. [ ] Socket conectado?

---

## Card 9: Performance Tips

### DO ✅
- Fire and forget para ações
- Atualização otimista sempre
- Usar fila para múltiplas ações
- Timeout de 5s nas requisições
- SWR para cache inteligente
- Delay de 50ms entre ações

### DON'T ❌
- await em ações de UI
- Loading visual nas ações
- Requisições sem timeout
- Múltiplas requisições simultâneas
- Reverter em timeout
- Ignorar cache

---

## Card 10: Code Snippets

### Marcar como Lida
```typescript
const toggleRead = (id: string, isRead: boolean) => {
  // Fire and forget
  api.toggleRead(id, isRead).catch(console.error);
  
  // Toast otimista
  toast.success(isRead ? "Não lida" : "Lida");
};
```

### Deletar Notificação
```typescript
const deleteNotification = (id: string) => {
  // Fire and forget
  api.delete(id).catch(console.error);
  
  // Toast otimista
  toast.success("Removida");
};
```

### Invalidar Cache
```typescript
// Todas as notificações
mutate(
  (key) => Array.isArray(key) && key[0] === 'notifications',
  undefined,
  { revalidate: true }
);
```

---

## Card 11: Environment Setup

### .env.local
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000/
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

### Verificar
```bash
# API
curl http://localhost:3000/users/notifications

# Socket.IO
curl http://localhost:3001/socket.io/
```

---

## Card 12: Common Issues

### UI não atualiza
```typescript
// ❌ Problema
await action(); // Bloqueia

// ✅ Solução
action().catch(...); // Fire and forget
```

### Múltiplas requisições
```typescript
// ❌ Problema
onClick={() => action()} // Múltiplos cliques

// ✅ Solução
actionQueue.add(() => action())
```

### Timeout trava UI
```typescript
// ❌ Problema
await fetch(url); // Sem timeout

// ✅ Solução
await fetch(url, { signal: controller.signal });
```

---

## 🎯 Métricas Alvo

| Métrica | Valor | Como Medir |
|---------|-------|------------|
| Tempo de resposta UI | < 100ms | DevTools Performance |
| Toast aparece | < 50ms | DevTools Performance |
| Timeout | 5s | Console log |
| Delay entre ações | 50ms | Console log |
| Auto-refresh | 30s | Console log |
| Dedupicação | 2s | Network tab |

---

## 🔧 Tools

### Chrome DevTools
```
Performance: Medir tempo de resposta
Network: Ver requisições
Console: Debug logs
React DevTools: Inspecionar states
```

### VS Code
```
TypeScript: Verificar tipos
ESLint: Verificar código
Prettier: Formatar código
```

---

## 📚 Documentação Rápida

### Performance
`NOTIFICATION_PERFORMANCE_OPTIMIZATIONS.md`

### Comparação
`NOTIFICATION_BEFORE_AFTER_COMPARISON.md`

### Validação
`NOTIFICATION_VALIDATION_CHECKLIST.md`

### Troubleshooting
`NOTIFICATION_TROUBLESHOOTING.md`

---

## 🎓 Regras de Ouro

1. **Nunca** bloqueie a UI esperando resposta
2. **Sempre** use atualização otimista
3. **Sempre** use timeout em requisições
4. **Sempre** use fila para múltiplas ações
5. **Sempre** mantenha mudança em timeout
6. **Sempre** reverta em erro real
7. **Sempre** use SWR para cache
8. **Sempre** invalide cache após mutação

---

## 🚀 Deploy Checklist

Antes de fazer deploy:

- [ ] Testes passando
- [ ] Performance < 100ms
- [ ] Sem erros no console
- [ ] Sem warnings do TypeScript
- [ ] .env configurado
- [ ] Backend respondendo
- [ ] Socket.IO conectando
- [ ] Cache funcionando
- [ ] Timeout de 5s
- [ ] Fire and forget implementado

---

## 💡 Pro Tips

### Performance
```typescript
// Use setTimeout para não bloquear
setTimeout(() => sync(), 100);
```

### Debug
```typescript
// Logs úteis
console.log('🔍 Debug:', { notifications, isLoading });
```

### TypeScript
```typescript
// Use tipos corretos
const notifications: INotification[] = data?.data || [];
```

### React
```typescript
// Use useRef para valores que não mudam
const queue = useRef(new ActionQueue()).current;
```

---

## 🎯 Resumo Ultra-Rápido

```
1. Fire and Forget     → Não espera resposta
2. Atualização Otimista → UI primeiro, sync depois
3. Sistema de Fila     → Controla concorrência
4. Timeout (5s)        → Não trava indefinido
5. SWR Cache           → Inteligente e rápido
6. Socket.IO           → Real-time updates
7. Graceful Errors     → Timeout não reverte
8. Background Sync     → Não bloqueia UI
```

---

**Imprima este arquivo e mantenha perto! 📋**
