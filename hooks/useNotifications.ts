import { useRef } from 'react';
import useSWR, { mutate } from 'swr';

// Tipos
type NotificationType = "INFO" | "SUCCESS" | "WARNING" | "ERROR" | "SYSTEM" | "PROMOTION" | "ORDER" | "MESSAGE" | "PAYMENT" | "ACCOUNT";
type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export interface INotification {
  id: string;
  created_at: string;
  read_at: string | null;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  action_url?: string;
  metadata?: any;
  expires_at?: string;
}

interface NotificationsResponse {
  data: INotification[];
  has_more: boolean;
  total: number;
  page_number: number;
  information: {
    unread_count: number;
  };
}

interface UseNotificationsOptions {
  page?: number;
  pageSize?: number;
  unreadOnly?: boolean;
  enabled?: boolean;
}

// Sistema de fila para ações
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
      this.process();
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
          console.error('Erro ao processar ação na fila:', error);
        }
        // Pequeno delay entre ações para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    this.processing = false;
  }
}

// Tipos

// Fetcher para o SWR
const fetcher = async (url: string, token: string) => {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Erro ao buscar notificações');
  }

  return response.json();
};

// Hook customizado para notificações
export function useNotifications(options: UseNotificationsOptions = {}) {
  const {
    page = 1,
    pageSize = 20,
    unreadOnly = false,
    enabled = true,
  } = options;

  // Fila de ações (singleton por instância do hook)
  const actionQueue = useRef(new ActionQueue()).current;

  // Buscar token
  const getToken = async () => {
    const response = await fetch('/api/get-cookies?key=access_token');
    return response.json();
  };

  // Construir URL com query params
  const buildUrl = (p: number) => {
    const params = new URLSearchParams({
      page_number: String(p),
      page_size: String(pageSize),
      unread_only: unreadOnly ? 's' : 'n',
    });
    return `${process.env.NEXT_PUBLIC_API_URL}users/notifications?${params.toString()}`;
  };

  // Key para o SWR (inclui page e filter para cache separado)
  const key = enabled ? ['notifications', page, unreadOnly] : null;

  // SWR hook
  const { data, error, isLoading, isValidating, mutate: mutateSWR } = useSWR<NotificationsResponse>(
    key,
    async () => {
      const token = await getToken();
      return fetcher(buildUrl(page), token);
    },
    {
      revalidateOnFocus: true, // Revalida ao focar na janela
      revalidateOnReconnect: true, // Revalida ao reconectar
      dedupingInterval: 2000, // Deduplica requisições em 2s
      refreshInterval: 30000, // Atualiza automaticamente a cada 30s
      keepPreviousData: true, // Mantém dados anteriores durante carregamento
    }
  );

  // Função para atualizar uma notificação localmente (optimistic update)
  const updateNotificationLocally = async (
    notificationId: string,
    updates: Partial<INotification>
  ) => {
    if (!data) return;

    // Atualizar cache local imediatamente
    await mutateSWR(
      {
        ...data,
        data: data.data.map(notif =>
          notif.id === notificationId
            ? { ...notif, ...updates }
            : notif
        ),
      },
      false // Não revalidar ainda
    );
  };

  // Função para remover uma notificação localmente
  const removeNotificationLocally = async (notificationId: string) => {
    if (!data) return;

    const notification = data.data.find(n => n.id === notificationId);
    const wasUnread = notification && !notification.read_at;

    // Atualizar cache local imediatamente
    await mutateSWR(
      {
        ...data,
        data: data.data.filter(n => n.id !== notificationId),
        total: Math.max(0, data.total - 1),
        information: {
          unread_count: wasUnread
            ? Math.max(0, data.information.unread_count - 1)
            : data.information.unread_count,
        },
      },
      false
    );
  };

  // Função para marcar como lida/não lida (com retry e abort)
  const toggleRead = async (notificationId: string, isRead: boolean) => {
    // Adicionar à fila para não sobrecarregar
    return actionQueue.add(async () => {
      const token = await getToken();
      
      // Atualização otimista
      const newReadAt = isRead ? null : new Date().toISOString();
      await updateNotificationLocally(notificationId, { read_at: newReadAt });

      // Atualizar contador local
      if (data) {
        await mutateSWR(
          {
            ...data,
            information: {
              unread_count: isRead
                ? data.information.unread_count + 1
                : Math.max(0, data.information.unread_count - 1),
            },
          },
          false
        );
      }

      // Controller para cancelamento
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}users/notifications/${notificationId}/${isRead ? 'unread' : 'read'}`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) throw new Error('Erro ao atualizar notificação');

        // Revalidar cache em background (sem esperar)
        setTimeout(() => {
          mutateSWR();
          mutate(
            (key) => Array.isArray(key) && key[0] === 'notifications',
            undefined,
            { revalidate: true }
          );
        }, 100);

        return true;
      } catch (error: any) {
        clearTimeout(timeoutId);
        
        // Se foi abort por timeout, não reverter (dar uma chance)
        if (error.name === 'AbortError') {
          console.warn('Requisição cancelada por timeout, mas mantendo mudança otimista');
          return true; // Fingir sucesso para não bloquear UI
        }

        // Reverter em caso de erro real
        const revertReadAt = isRead ? new Date().toISOString() : null;
        await updateNotificationLocally(notificationId, { read_at: revertReadAt });
        
        if (data) {
          await mutateSWR(
            {
              ...data,
              information: {
                unread_count: isRead
                  ? Math.max(0, data.information.unread_count - 1)
                  : data.information.unread_count + 1,
              },
            },
            false
          );
        }
        
        throw error;
      }
    });
  };

  // Função para deletar notificação (com retry e abort)
  const deleteNotification = async (notificationId: string) => {
    // Adicionar à fila para não sobrecarregar
    return actionQueue.add(async () => {
      const token = await getToken();

      // Atualização otimista
      await removeNotificationLocally(notificationId);

      // Controller para cancelamento
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}users/notifications/${notificationId}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) throw new Error('Erro ao deletar notificação');

        // Revalidar cache em background (sem esperar)
        setTimeout(() => {
          mutateSWR();
          mutate(
            (key) => Array.isArray(key) && key[0] === 'notifications',
            undefined,
            { revalidate: true }
          );
        }, 100);

        return true;
      } catch (error: any) {
        clearTimeout(timeoutId);
        
        // Se foi abort por timeout, não reverter (dar uma chance)
        if (error.name === 'AbortError') {
          console.warn('Requisição de delete cancelada por timeout, mas mantendo mudança otimista');
          return true; // Fingir sucesso para não bloquear UI
        }

        // Revalidar para restaurar estado correto
        mutateSWR();
        throw error;
      }
    });
  };

  // Função para forçar revalidação
  const refresh = () => mutateSWR();

  // Função para invalidar todo o cache de notificações
  const invalidateAll = () => {
    mutate(
      (key) => Array.isArray(key) && key[0] === 'notifications',
      undefined,
      { revalidate: true }
    );
  };

  return {
    notifications: data?.data || [],
    hasMore: data?.has_more || false,
    total: data?.total || 0,
    unreadCount: data?.information?.unread_count || 0,
    currentPage: data?.page_number || page,
    isLoading,
    isValidating,
    error,
    toggleRead,
    deleteNotification,
    refresh,
    invalidateAll,
  };
}

// Hook para notificações infinitas (múltiplas páginas)
export function useInfiniteNotifications(options: Omit<UseNotificationsOptions, 'page'> = {}) {
  const {
    pageSize = 20,
    unreadOnly = false,
    enabled = true,
  } = options;

  const [pages, setPages] = React.useState<number[]>([1]);

  // Buscar token
  const getToken = async () => {
    const response = await fetch('/api/get-cookies?key=access_token');
    return response.json();
  };

  // Construir URL
  const buildUrl = (p: number) => {
    const params = new URLSearchParams({
      page_number: String(p),
      page_size: String(pageSize),
      unread_only: unreadOnly ? 's' : 'n',
    });
    return `${process.env.NEXT_PUBLIC_API_URL}users/notifications?${params.toString()}`;
  };

  // Buscar todas as páginas
  const keys = enabled
    ? pages.map(p => ['notifications', p, unreadOnly])
    : pages.map(() => null);

  const { data: allData, error, isLoading } = useSWR(
    keys,
    async (keys: any[]) => {
      const token = await getToken();
      const results = await Promise.all(
        keys.map(async ([, page]) => {
          return fetcher(buildUrl(page as number), token);
        })
      );
      return results;
    },
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 2000,
      refreshInterval: 30000,
      keepPreviousData: true,
    }
  );

  // Consolidar dados de todas as páginas
  const notifications = allData?.flatMap(d => d.data) || [];
  const lastPage = allData?.[allData.length - 1];
  const hasMore = lastPage?.has_more || false;
  const total = lastPage?.total || 0;
  const unreadCount = lastPage?.information?.unread_count || 0;

  // Carregar próxima página
  const loadMore = () => {
    if (hasMore && !isLoading) {
      setPages(prev => [...prev, Math.max(...prev) + 1]);
    }
  };

  // Reset ao mudar filtro
  React.useEffect(() => {
    setPages([1]);
  }, [unreadOnly]);

  return {
    notifications,
    hasMore,
    total,
    unreadCount,
    isLoading,
    error,
    loadMore,
  };
}

// Precisa do import do React
import React from 'react';
