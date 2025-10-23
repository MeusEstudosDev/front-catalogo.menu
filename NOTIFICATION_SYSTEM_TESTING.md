# Teste de Sistema de Notificações em Tempo Real

## Guia Rápido para Testar Socket.IO

### Pré-requisitos
1. Backend rodando com suporte a Socket.IO
2. `.env.local` configurado com URLs corretas
3. Usuário logado na aplicação

### Passos para Testar

#### 1. Verificar Conexão Socket

Abra o console do navegador (F12) e procure por mensagens:
```
Socket.IO conectado: <socket-id>
```

Se houver erro de conexão, você verá:
```
Erro de conexão Socket.IO: <detalhes>
```

#### 2. Simular Envio de Notificação pelo Backend

Use este exemplo de código no backend para emitir uma notificação:

```typescript
// Exemplo Node.js/Socket.IO no backend
io.emit(`${userId}-notifications`, {
  id: crypto.randomUUID(),
  created_at: new Date().toISOString(),
  read_at: null,
  type: 'INFO',
  priority: 'NORMAL',
  title: 'Teste de Notificação',
  message: 'Esta é uma notificação de teste enviada via Socket.IO',
  action_url: '/dashboard',
  metadata: {}
});
```

#### 3. O que Deve Acontecer

Ao emitir a notificação, você deve observar:

1. **Console do navegador:**
   ```
   Nova notificação recebida: { id: '...', title: 'Teste de Notificação', ... }
   ```

2. **Toast (notificação flutuante):**
   - Aparece no canto da tela
   - Título: "Teste de Notificação"
   - Descrição: "Esta é uma notificação de teste..."
   - Tipo: Info (ícone azul)
   - Duração: 5 segundos

3. **Badge de notificações:**
   - Número incrementa em 1
   - Badge vermelho aparece/atualiza

4. **Lista de notificações:**
   - Se o menu estiver aberto, a lista é atualizada
   - Nova notificação aparece no topo
   - Destacada com fundo azul (não lida)

### Teste Completo do Fluxo

#### Passo a Passo

1. **Login na aplicação**
   ```
   - Acesse /login
   - Faça login com suas credenciais
   - Aguarde carregar o dashboard
   ```

2. **Verificar estado inicial**
   ```
   - Abra o console (F12)
   - Procure por "Socket.IO conectado"
   - Click no ícone de sino no menu
   - Veja quantas notificações não lidas você tem
   ```

3. **Enviar notificação de teste**
   ```
   - Use ferramenta do backend ou postman
   - Emita evento para `${userId}-notifications`
   - Observe o toast aparecer
   ```

4. **Verificar atualização automática**
   ```
   - Badge deve atualizar imediatamente
   - Abra o menu de notificações
   - Nova notificação deve estar no topo
   - Fundo azul indica "não lida"
   ```

5. **Interagir com a notificação**
   ```
   - Click na notificação para abrir modal
   - Click em "Marcar como lida"
   - Verifique que badge decrementa
   - Notificação muda para fundo cinza
   ```

### Testes de Tipos de Notificação

Teste diferentes tipos para verificar cores e ícones:

```typescript
// INFO - Azul
{ type: 'INFO', title: 'Informação', message: 'Teste info' }

// SUCCESS - Verde
{ type: 'SUCCESS', title: 'Sucesso', message: 'Teste sucesso' }

// WARNING - Laranja
{ type: 'WARNING', title: 'Aviso', message: 'Teste aviso' }

// ERROR - Vermelho
{ type: 'ERROR', title: 'Erro', message: 'Teste erro' }

// SYSTEM - Roxo
{ type: 'SYSTEM', title: 'Sistema', message: 'Teste sistema' }
```

### Testes de Prioridade

```typescript
// URGENT - Badge vermelho "Urgente"
{ priority: 'URGENT', title: 'Urgente!', message: 'Ação imediata necessária' }

// HIGH - Badge vermelho "Alta"
{ priority: 'HIGH', title: 'Alta prioridade', message: 'Requer atenção' }

// NORMAL - Sem badge especial
{ priority: 'NORMAL', title: 'Normal', message: 'Notificação padrão' }

// LOW - Sem badge especial
{ priority: 'LOW', title: 'Baixa', message: 'Quando possível' }
```

### Teste de Reconexão

1. **Simular perda de conexão:**
   ```
   - Pause o backend momentaneamente
   - Observe console: "Socket.IO desconectado"
   ```

2. **Verificar reconexão automática:**
   ```
   - Reinicie o backend
   - Aguarde até 5 segundos
   - Console: "Socket.IO conectado: <novo-id>"
   ```

3. **Validar funcionalidade:**
   ```
   - Envie nova notificação
   - Deve funcionar normalmente
   ```

### Teste de Múltiplas Abas

1. Abra a aplicação em 2 abas do navegador
2. Faça login nas duas
3. Envie notificação
4. Ambas as abas devem:
   - Mostrar o toast
   - Atualizar o badge
   - Atualizar a lista (se aberta)

### Debug de Problemas

#### Socket não conecta

Verifique:
```javascript
// No console, execute:
console.log(process.env.NEXT_PUBLIC_SOCKET_URL);
console.log(process.env.NEXT_PUBLIC_API_URL);

// Deve retornar as URLs configuradas
```

Soluções:
- Configure `.env.local` corretamente
- Reinicie o servidor Next.js (`npm run dev`)
- Verifique firewall/CORS no backend

#### Notificação não recebe

Verifique:
```javascript
// No console, após login, execute:
const profile = JSON.parse(localStorage.getItem('profile') || '{}');
console.log('User ID:', profile.user_id);

// Certifique-se que o backend está emitindo para:
// `${user_id}-notifications`
```

#### Toast não aparece

Verifique:
```javascript
// No console, você deve ver:
Nova notificação recebida: {...}

// Se aparecer mas toast não, verifique:
// - Toaster está importado e configurado
// - Componente Provider está envolvendo a aplicação
```

### Ferramentas Úteis

#### Socket.IO Admin UI
```bash
# Instale no backend para monitorar conexões
npm install @socket.io/admin-ui
```

#### Chrome DevTools
```
- Network → WS (WebSocket) para ver mensagens
- Console para logs e erros
- Application → Storage para verificar localStorage
```

#### Postman/Insomnia
Configure cliente Socket.IO para testar emissão de eventos manualmente.

### Checklist de Validação

- [ ] Socket conecta ao carregar a página
- [ ] Console mostra "Socket.IO conectado"
- [ ] Badge de notificações funciona
- [ ] Menu de notificações abre e lista itens
- [ ] Toast aparece ao receber notificação
- [ ] Badge incrementa ao receber notificação
- [ ] Lista atualiza ao receber notificação
- [ ] Marcar como lida funciona
- [ ] Marcar como não lida funciona
- [ ] Deletar notificação funciona
- [ ] Filtro de não lidas funciona
- [ ] Scroll infinito carrega mais itens
- [ ] Modal de detalhes abre e fecha
- [ ] Ação customizada (action_url) funciona
- [ ] Dark mode e light mode funcionam
- [ ] Reconexão automática funciona
- [ ] Múltiplas abas recebem notificações
- [ ] Socket desconecta ao fazer logout
- [ ] Preferência de filtro persiste após refresh

### Performance

Teste com volume:
```typescript
// Envie múltiplas notificações rapidamente
for (let i = 0; i < 50; i++) {
  io.emit(`${userId}-notifications`, {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    read_at: null,
    type: 'INFO',
    priority: 'NORMAL',
    title: `Teste #${i}`,
    message: `Notificação de teste número ${i}`,
  });
  
  await new Promise(r => setTimeout(r, 100)); // 100ms entre cada
}
```

Observe:
- Toasts devem aparecer em sequência
- Badge deve atualizar corretamente
- Lista deve carregar todas as notificações
- Sem travamentos ou lentidão

### Logs Importantes

Mensagens esperadas no console:

```
✅ Socket.IO conectado: abc123
✅ Nova notificação recebida: {...}
✅ Atualização de notificações bem-sucedida
```

Mensagens de erro comuns:

```
❌ Erro de conexão Socket.IO: timeout
   → Backend não está respondendo

❌ Erro ao buscar notificações: 401 Unauthorized
   → Token expirado, faça login novamente

❌ Socket.IO desconectado
   → Conexão perdida, aguardando reconexão
```

### Ambiente de Produção

Antes de deploy:
- [ ] Configure variáveis de ambiente de produção
- [ ] Use HTTPS/WSS para conexões seguras
- [ ] Configure CORS corretamente
- [ ] Teste com carga real de usuários
- [ ] Monitore logs de erros
- [ ] Configure alertas para desconexões
- [ ] Documente para equipe de suporte

---

**Dúvidas?** Consulte `NOTIFICATION_SYSTEM_DOCUMENTATION.md` para detalhes técnicos completos.
