"use client";

import { useNotifications, type INotification } from "@/hooks/useNotifications";
import {
  Avatar,
  Badge,
  Box,
  Breadcrumb,
  Button,
  Checkbox,
  Dialog,
  Flex,
  IconButton,
  Menu,
  Portal,
  Spinner,
  Text,
} from "@chakra-ui/react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import React, { Fragment, useEffect, useState } from "react";
import { FaRegSquare, FaRegSquareCheck } from "react-icons/fa6";
import {
  LuBell,
  LuCheck,
  LuLogOut,
  LuRefreshCw,
  LuSettings,
  LuTrash2,
  LuUser,
  LuX,
} from "react-icons/lu";
import { io, Socket } from "socket.io-client";
import { ColorModeButton } from "./color-mode";
import { toaster } from "./toaster";

const MainMenu: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  // Tipos de notificação
  type NotificationType =
    | "INFO"
    | "SUCCESS"
    | "WARNING"
    | "ERROR"
    | "SYSTEM"
    | "PROMOTION"
    | "ORDER"
    | "MESSAGE"
    | "PAYMENT"
    | "ACCOUNT";
  type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

  const handleLogout = async () => {
    await fetch("/api/delete-cookies?key=profile", {
      method: "DELETE",
    });
    await fetch("/api/delete-cookies?key=access_token", {
      method: "DELETE",
    });
    await fetch("/api/delete-cookies?key=refresh_token", {
      method: "DELETE",
    });
    router.refresh();
  };

  const [profile, setProfile] = useState<{
    id?: string;
    name?: string;
    profile_uri?: string;
    type?: "MANAGEMENT" | "MARKETPLACE" | "APPLICATION";
  } | null>(null);
  const [imageBust, setImageBust] = useState<number>(0);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Estados de notificações
  const [showOnlyUnread, setShowOnlyUnread] = useState(() => {
    // Recuperar preferência do localStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("notifications_show_only_unread");
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<INotification | null>(null);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [notificationPage, setNotificationPage] = useState(1);

  // Hook SWR para notificações
  const {
    notifications,
    hasMore,
    total,
    unreadCount,
    isLoading: isLoadingNotifications,
    isValidating,
    toggleRead,
    deleteNotification: deleteNotificationSWR,
    refresh: refreshNotifications,
    invalidateAll,
  } = useNotifications({
    page: notificationPage,
    pageSize: 20,
    unreadOnly: showOnlyUnread,
    enabled: isNotificationMenuOpen, // Só busca quando menu está aberto
  });

  // Estado para loading de mais notificações
  const [isLoadingMoreNotifications, setIsLoadingMoreNotifications] =
    useState(false);

  // Estado para Socket.IO
  const [socket, setSocket] = useState<Socket | null>(null);

  // Conectar ao Socket.IO quando o profile estiver disponível
  useEffect(() => {
    if (!profile?.id) return;

    // Conectar ao backend via socket.io
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;

    const newSocket = io(socketUrl, {
      transports: ["websocket", "polling"], // Tenta WebSocket primeiro, depois polling
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      // Adicionar headers se necessário
      extraHeaders: {
        "Access-Control-Allow-Origin": "*",
      },
    });

    newSocket.on("connect", () => {});

    newSocket.on("disconnect", (reason) => {});

    newSocket.on("connect_error", (error: any) => {
      console.error("Erro de conexão Socket.IO:", error.message);
      console.error("Detalhes:", {
        type: error.type || "unknown",
        description: error.description || error.message,
      });
    });

    // Escutar eventos de notificação específicos do usuário
    const notificationEvent = `${profile.id}-notifications`;

    newSocket.on(notificationEvent, (notification: INotification) => {
      // Mostrar toast com a nova notificação
      const notificationTypeMap: Record<
        NotificationType,
        "info" | "success" | "warning" | "error"
      > = {
        INFO: "info",
        SUCCESS: "success",
        WARNING: "warning",
        ERROR: "error",
        SYSTEM: "info",
        PROMOTION: "info",
        ORDER: "info",
        MESSAGE: "info",
        PAYMENT: "info",
        ACCOUNT: "info",
      };

      const toastType = notificationTypeMap[notification.type] || "info";

      toaster.create({
        title: notification.title,
        description: notification.message,
        type: toastType,
        duration: 5000,
        closable: true,
      });

      // Invalidar todas as páginas de notificações para atualizar
      invalidateAll();
    });

    setSocket(newSocket);

    // Cleanup: desconectar quando o componente for desmontado
    return () => {
      console.log("Desconectando Socket.IO...");
      newSocket.off(notificationEvent);
      newSocket.disconnect();
    };
  }, [profile?.id]);

  // Salvar preferência no localStorage quando mudar
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "notifications_show_only_unread",
        JSON.stringify(showOnlyUnread),
      );
    }
  }, [showOnlyUnread]);

  // Recarregar notificações quando o filtro mudar
  useEffect(() => {
    if (isNotificationMenuOpen) {
      setNotificationPage(1); // Reset para página 1
      refreshNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showOnlyUnread]);

  useEffect(() => {
    // garante bust somente no cliente para evitar mismatch
    setImageBust(Date.now());

    async function fetchProfile() {
      setIsLoadingProfile(true);
      try {
        const res = await fetch("/api/get-cookies?key=profile");
        const data = await res.json();
        if (data) {
          try {
            const parsed = typeof data === "string" ? JSON.parse(data) : data;
            setProfile(parsed);
          } catch {
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
      } catch {
        setProfile(null);
      } finally {
        setIsLoadingProfile(false);
      }
    }
    fetchProfile();

    const handler = (e: Event) => {
      const custom = e as CustomEvent<string>;
      const newUri = custom.detail;
      if (typeof newUri === "string") {
        setProfile((prev) => (prev ? { ...prev, profile_uri: newUri } : prev));
        setImageBust(Date.now());
      } else {
        setImageBust(Date.now());
      }
    };
    window.addEventListener(
      "profile-picture-updated",
      handler as EventListener,
    );
    return () =>
      window.removeEventListener(
        "profile-picture-updated",
        handler as EventListener,
      );
  }, []);

  const withCacheBust = (url?: string, bust?: number) =>
    url
      ? bust
        ? `${url}${url.includes("?") ? "&" : "?"}cb=${bust}`
        : url
      : undefined;

  // Carregar mais notificações
  const loadMoreNotifications = () => {
    if (!isLoadingMoreNotifications && hasMore) {
      setIsLoadingMoreNotifications(true);
      setNotificationPage((prev) => prev + 1);
      // SWR irá buscar automaticamente com a nova página
      setTimeout(() => setIsLoadingMoreNotifications(false), 500);
    }
  };

  // Marcar como lida/não lida com SWR (não espera, não bloqueia)
  const toggleReadNotification = (notificationId: string, isRead: boolean) => {
    // Não espera (fire and forget)
    toggleRead(notificationId, isRead).catch((error) => {
      console.error("Erro ao atualizar notificação:", error);
      toaster.error({
        title: "Erro",
        description:
          "Não foi possível atualizar a notificação. Tentando novamente...",
      });
    });

    // Toast de sucesso imediato (otimista)
    toaster.success({
      title: isRead ? "Marcada como não lida" : "Marcada como lida",
    });
  };

  // Deletar notificação com SWR (não espera, não bloqueia)
  const deleteNotification = (notificationId: string) => {
    // Não espera (fire and forget)
    deleteNotificationSWR(notificationId).catch((error) => {
      console.error("Erro ao deletar notificação:", error);
      toaster.error({
        title: "Erro",
        description:
          "Não foi possível remover a notificação. Tentando novamente...",
      });
    });

    // Toast de sucesso imediato (otimista)
    toaster.success({
      title: "Notificação removida",
    });
  };

  // Função para obter cor baseada no tipo
  const getNotificationColor = (type: NotificationType) => {
    const colors: Record<NotificationType, string> = {
      INFO: "blue",
      SUCCESS: "green",
      WARNING: "orange",
      ERROR: "red",
      SYSTEM: "purple",
      PROMOTION: "pink",
      ORDER: "teal",
      MESSAGE: "cyan",
      PAYMENT: "yellow",
      ACCOUNT: "gray",
    };
    return colors[type] || "gray";
  };

  // Função para obter ícone de prioridade
  const getPriorityBadge = (priority: NotificationPriority) => {
    if (priority === "URGENT" || priority === "HIGH") {
      return (
        <Badge colorPalette="red" size="xs">
          {priority === "URGENT" ? "Urgente" : "Alta"}
        </Badge>
      );
    }
    return null;
  };

  // Abrir modal de notificação
  const openNotificationModal = (notification: INotification) => {
    setSelectedNotification(notification);
    setIsNotificationModalOpen(true);
    setIsNotificationMenuOpen(false);
  };

  // Fechar modal de notificação
  const closeNotificationModal = () => {
    setSelectedNotification(null);
    setIsNotificationModalOpen(false);
  };

  // Truncar texto
  const truncateText = (text: string, maxLength: number = 80) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // Handler de scroll para paginação infinita
  const handleNotificationScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const scrollPercentage =
      (target.scrollTop + target.clientHeight) / target.scrollHeight;

    // Carregar mais quando chegar a 80% do scroll
    if (scrollPercentage > 0.8 && hasMore && !isLoadingMoreNotifications) {
      loadMoreNotifications();
    }
  };

  return (
    <>
      <Box
        as="nav"
        w="100%"
        py={4}
        borderBottom="1px"
        bg="var(--background)"
        borderColor="var(--border)"
        display={"flex"}
        flexDir={"row"}
        justifyContent={"space-between"}
        px={16}
        alignItems={"center"}
      >
        <Flex as="ul" gap={8} listStyleType="none" m={0} p={0} justify="center">
          <Box as="li" display="flex" alignItems="center" gap={2}>
            <Image
              src="/favicon.png"
              alt="catalogo.menu"
              width={40}
              height={40}
            />
          </Box>
        </Flex>

        {isLoadingProfile ? (
          <Flex align="center" gap={3}>
            <Spinner size="sm" />
            <Text fontSize="sm" color="gray.500">
              Carregando...
            </Text>
          </Flex>
        ) : (
          <Flex align="center" gap={3}>
            <ColorModeButton />

            {/* Menu de Notificações */}
            <Menu.Root
              open={isNotificationMenuOpen}
              onOpenChange={(e) => setIsNotificationMenuOpen(e.open)}
              positioning={{ placement: "bottom-end" }}
            >
              <Menu.Trigger asChild>
                <IconButton
                  aria-label="Notificações"
                  variant="ghost"
                  size="sm"
                  position="relative"
                >
                  <LuBell size={20} />
                  {unreadCount > 0 && (
                    <Badge
                      position="absolute"
                      top="-2px"
                      right="-2px"
                      colorPalette="red"
                      borderRadius="full"
                      fontSize="xs"
                      px={1.5}
                      minW="20px"
                      textAlign="center"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </IconButton>
              </Menu.Trigger>
              <Portal>
                <Menu.Positioner>
                  <Menu.Content minW="400px" maxW="500px" maxH="600px">
                    <Box p={3} borderBottom="1px" borderColor="gray.200">
                      <Flex justify="space-between" align="center" mb={3}>
                        <Text fontWeight="bold" fontSize="md">
                          Notificações
                          {total > 0 && (
                            <Text
                              as="span"
                              ml={2}
                              fontSize="xs"
                              color="gray.500"
                            >
                              ({total} total)
                            </Text>
                          )}
                        </Text>
                        <IconButton
                          aria-label="Atualizar notificações"
                          size="xs"
                          variant="ghost"
                          onClick={() => refreshNotifications()}
                          disabled={isLoadingNotifications || isValidating}
                        >
                          <LuRefreshCw
                            style={{
                              animation:
                                isLoadingNotifications || isValidating
                                  ? "spin 1s linear infinite"
                                  : "none",
                            }}
                          />
                        </IconButton>
                      </Flex>
                      <Checkbox.Root
                        checked={showOnlyUnread}
                        onCheckedChange={(e: any) =>
                          setShowOnlyUnread(!!e.checked)
                        }
                      >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control />
                        <Checkbox.Label>
                          <Text fontSize="sm">Mostrar apenas não lidas</Text>
                        </Checkbox.Label>
                      </Checkbox.Root>
                    </Box>

                    <Box
                      maxH="400px"
                      overflowY="auto"
                      onScroll={handleNotificationScroll}
                    >
                      {isLoadingNotifications ? (
                        <Flex justify="center" align="center" py={8}>
                          <Spinner size="lg" />
                        </Flex>
                      ) : notifications.length === 0 ? (
                        <Box textAlign="center" py={8}>
                          <Text color="gray.500">Nenhuma notificação</Text>
                        </Box>
                      ) : (
                        <>
                          {notifications.map((notification) => (
                            <Box
                              key={notification.id}
                              p={3}
                              borderBottom="1px"
                              borderColor="gray.100"
                              bg={notification.read_at ? "gray.50" : "blue.50"}
                              _dark={{
                                bg: notification.read_at
                                  ? "transparent"
                                  : "blue.900",
                              }}
                              _hover={{
                                bg: notification.read_at
                                  ? "gray.100"
                                  : "blue.100",
                                _dark: { bg: "gray.700" },
                              }}
                              cursor={"pointer"}
                              onClick={() =>
                                openNotificationModal(notification)
                              }
                              mb={2}
                            >
                              <Flex
                                justify="space-between"
                                align="center"
                                mb={1}
                              >
                                <Text
                                  fontWeight="semibold"
                                  fontSize="sm"
                                  mr={1}
                                >
                                  {notification.title}
                                </Text>
                                <Flex align="center" gap={2} flex="1">
                                  <Badge
                                    colorPalette={getNotificationColor(
                                      notification.type,
                                    )}
                                    size="xs"
                                  >
                                    {notification.type}
                                  </Badge>
                                  {getPriorityBadge(notification.priority)}
                                </Flex>
                                <Flex gap={1}>
                                  <IconButton
                                    aria-label={
                                      notification.read_at
                                        ? "Marcar como não lida"
                                        : "Marcar como lida"
                                    }
                                    size="xs"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleReadNotification(
                                        notification.id,
                                        !!notification.read_at,
                                      );
                                    }}
                                  >
                                    lida:{" "}
                                    {notification.read_at ? (
                                      <FaRegSquareCheck size={14} />
                                    ) : (
                                      <FaRegSquare size={14} />
                                    )}
                                  </IconButton>
                                  <IconButton
                                    aria-label="Deletar notificação"
                                    size="xs"
                                    variant="ghost"
                                    colorPalette="red"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteNotification(notification.id);
                                    }}
                                  >
                                    <LuTrash2 size={14} />
                                  </IconButton>
                                </Flex>
                              </Flex>
                              <Text fontSize="xs" color="gray.600" mb={1}>
                                {truncateText(notification.message, 80)}
                              </Text>
                              <Text fontSize="xs" color="gray.400">
                                {new Date(
                                  notification.created_at,
                                ).toLocaleString("pt-BR")}
                              </Text>
                            </Box>
                          ))}

                          {/* Loading de mais notificações */}
                          {isLoadingMoreNotifications && (
                            <Flex justify="center" align="center" py={4}>
                              <Spinner size="md" />
                            </Flex>
                          )}

                          {/* Indicador de fim das notificações */}
                          {!hasMore && notifications.length > 0 && (
                            <Box
                              textAlign="center"
                              py={3}
                              borderTop="1px"
                              borderColor="gray.200"
                            >
                              <Text fontSize="xs" color="gray.400">
                                Todas as notificações foram carregadas
                              </Text>
                            </Box>
                          )}
                        </>
                      )}
                    </Box>
                  </Menu.Content>
                </Menu.Positioner>
              </Portal>
            </Menu.Root>

            {/* Modal de Detalhes da Notificação */}
            <Dialog.Root
              open={isNotificationModalOpen}
              onOpenChange={(e) => {
                if (!e.open) {
                  closeNotificationModal();
                }
              }}
            >
              <Dialog.Backdrop />
              <Dialog.Positioner>
                <Dialog.Content maxW="600px">
                  {selectedNotification && (
                    <>
                      <Dialog.Header>
                        <Dialog.Title>
                          {selectedNotification.title}
                        </Dialog.Title>
                      </Dialog.Header>
                      <Dialog.Body>
                        <Box display="flex" flexDir="column" gap={4}>
                          <Flex align="center" gap={2} flexWrap="wrap">
                            <Badge
                              colorPalette={getNotificationColor(
                                selectedNotification.type,
                              )}
                            >
                              {selectedNotification.type}
                            </Badge>
                            {getPriorityBadge(selectedNotification.priority)}
                            {selectedNotification.read_at ? (
                              <Badge colorPalette="gray">Lida</Badge>
                            ) : (
                              <Badge colorPalette="blue">Não lida</Badge>
                            )}
                          </Flex>

                          <Box>
                            <Text
                              fontSize="md"
                              color="gray.700"
                              _dark={{ color: "gray.300" }}
                              whiteSpace="pre-wrap"
                            >
                              {selectedNotification.message}
                            </Text>
                          </Box>

                          <Box
                            p={3}
                            bg="gray.50"
                            _dark={{ bg: "gray.800" }}
                            borderRadius="md"
                          >
                            <Text fontSize="xs" color="gray.500" mb={1}>
                              Data de criação
                            </Text>
                            <Text fontSize="sm">
                              {new Date(
                                selectedNotification.created_at,
                              ).toLocaleString("pt-BR", {
                                dateStyle: "full",
                                timeStyle: "short",
                              })}
                            </Text>
                            {selectedNotification.read_at && (
                              <>
                                <Text
                                  fontSize="xs"
                                  color="gray.500"
                                  mt={2}
                                  mb={1}
                                >
                                  Lida em
                                </Text>
                                <Text fontSize="sm">
                                  {new Date(
                                    selectedNotification.read_at,
                                  ).toLocaleString("pt-BR", {
                                    dateStyle: "full",
                                    timeStyle: "short",
                                  })}
                                </Text>
                              </>
                            )}
                            {selectedNotification.expires_at && (
                              <>
                                <Text
                                  fontSize="xs"
                                  color="gray.500"
                                  mt={2}
                                  mb={1}
                                >
                                  Expira em
                                </Text>
                                <Text fontSize="sm">
                                  {new Date(
                                    selectedNotification.expires_at,
                                  ).toLocaleString("pt-BR", {
                                    dateStyle: "full",
                                    timeStyle: "short",
                                  })}
                                </Text>
                              </>
                            )}
                          </Box>

                          {selectedNotification.action_url && (
                            <Button
                              colorPalette="blue"
                              onClick={() => {
                                router.push(selectedNotification.action_url!);
                                closeNotificationModal();
                              }}
                            >
                              Ir para ação
                            </Button>
                          )}
                        </Box>
                      </Dialog.Body>
                    </>
                  )}
                  <Dialog.Footer>
                    <Flex justify="space-between" w="100%" gap={2}>
                      <Flex gap={2}>
                        <Button
                          variant="outline"
                          colorPalette={
                            selectedNotification?.read_at ? "orange" : "green"
                          }
                          onClick={() => {
                            if (selectedNotification) {
                              toggleReadNotification(
                                selectedNotification.id,
                                !!selectedNotification.read_at,
                              );
                              closeNotificationModal();
                            }
                          }}
                          size="sm"
                        >
                          {selectedNotification?.read_at ? (
                            <>
                              <LuX /> Marcar como não lida
                            </>
                          ) : (
                            <>
                              <LuCheck /> Marcar como lida
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          colorPalette="red"
                          onClick={() => {
                            if (selectedNotification) {
                              deleteNotification(selectedNotification.id);
                              closeNotificationModal();
                            }
                          }}
                          size="sm"
                        >
                          <LuTrash2 /> Deletar
                        </Button>
                      </Flex>
                      <Button
                        variant="outline"
                        onClick={closeNotificationModal}
                        size="sm"
                      >
                        Fechar
                      </Button>
                    </Flex>
                  </Dialog.Footer>
                  <Dialog.CloseTrigger />
                </Dialog.Content>
              </Dialog.Positioner>
            </Dialog.Root>

            <Menu.Root positioning={{ placement: "right-end" }}>
              <Menu.Trigger rounded="full" focusRing="none">
                <Avatar.Root
                  colorPalette="green"
                  variant="subtle"
                  style={{ cursor: "pointer" }}
                >
                  <Avatar.Fallback name={profile?.name || "Usuário"} />
                  <Avatar.Image
                    src={withCacheBust(
                      profile?.profile_uri,
                      imageBust || undefined,
                    )}
                  />
                </Avatar.Root>
              </Menu.Trigger>
              <Portal>
                <Menu.Positioner>
                  <Menu.Content>
                    <Menu.Item value="profile">
                      <Avatar.Root variant="subtle" size="xs">
                        <Avatar.Fallback name={profile?.name || "Usuário"} />
                        <Avatar.Image
                          src={withCacheBust(
                            profile?.profile_uri,
                            imageBust || undefined,
                          )}
                        />
                      </Avatar.Root>
                      {profile?.name}
                    </Menu.Item>

                    <Menu.Separator />

                    {profile?.type === "MANAGEMENT" && (
                      <Menu.Item
                        onClick={() => router.replace("/manage-system")}
                        style={{ cursor: "pointer" }}
                        value="manage-system"
                      >
                        <Flex align="center" gap={2}>
                          <LuSettings />
                          Gerenciar sistema
                        </Flex>
                      </Menu.Item>
                    )}

                    <Menu.Item
                      onClick={() => router.replace("/account")}
                      style={{ cursor: "pointer" }}
                      value="account"
                    >
                      <Flex align="center" gap={2}>
                        <LuUser />
                        Minha conta
                      </Flex>
                    </Menu.Item>

                    <Menu.Item
                      value="settings"
                      style={{ cursor: "pointer" }}
                      onClick={() => router.replace("/settings")}
                    >
                      <Flex align="center" gap={2}>
                        <LuSettings />
                        Configurações
                      </Flex>
                    </Menu.Item>

                    <Menu.Separator />

                    <Menu.Item
                      value="logout"
                      style={{ cursor: "pointer" }}
                      onClick={handleLogout}
                    >
                      <Flex align="center" gap={2}>
                        <LuLogOut /> Logout
                      </Flex>
                    </Menu.Item>
                  </Menu.Content>
                </Menu.Positioner>
              </Portal>
            </Menu.Root>
          </Flex>
        )}
      </Box>

      <Breadcrumb.Root ml={4} mt={2}>
        <Breadcrumb.List>
          {pathname !== "/dashboard" &&
            pathname.split("/").map((path, index) => {
              const pathTranslated: Record<string, string> = {
                account: "minha conta",
                settings: "configurações",
                "manage-system": "gerenciamento do sistema",
                businesses: "empresas",
                users: "usuários",
                notifications: "notificações",
              };

              const value =
                index === 0 ? "dashboard" : pathTranslated[path] || path;

              return (
                <Fragment key={value}>
                  <Breadcrumb.Separator />

                  <Breadcrumb.Item>
                    <button
                      onClick={() => router.replace(`/${path}`)}
                      style={{ cursor: "pointer" }}
                    >
                      {value}
                    </button>
                  </Breadcrumb.Item>
                </Fragment>
              );
            })}
        </Breadcrumb.List>
      </Breadcrumb.Root>
    </>
  );
};

const LinkMainMenu: React.FC<{
  href: string;
  pathname: string;
  children: React.ReactNode;
}> = ({ href, pathname, children }) => {
  const router = useRouter();

  const isActive =
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <button
      onClick={() => router.replace(href)}
      style={{ cursor: "pointer", fontWeight: isActive ? "bold" : undefined }}
    >
      {children}
    </button>
  );
};

export default MainMenu;
