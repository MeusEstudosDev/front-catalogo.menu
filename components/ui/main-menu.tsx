"use client";

import { Avatar, Badge, Box, Breadcrumb, Button, Checkbox, Dialog, Flex, IconButton, Menu, Portal, Spinner, Text } from "@chakra-ui/react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import React, { Fragment, useEffect, useState } from "react";
import { FaRegSquare, FaRegSquareCheck } from "react-icons/fa6";
import { LuBell, LuCheck, LuLogOut, LuRefreshCw, LuSettings, LuTrash2, LuUser, LuX } from "react-icons/lu";
import { SiAwssecretsmanager } from 'react-icons/si';
import { ColorModeButton } from "./color-mode";
import { toaster } from "./toaster";

const MainMenu: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  // Tipos de notificação
  type NotificationType = "INFO" | "SUCCESS" | "WARNING" | "ERROR" | "SYSTEM" | "PROMOTION" | "ORDER" | "MESSAGE" | "PAYMENT" | "ACCOUNT";
  type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

  interface INotification {
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
    name?: string;
    profile_uri?: string;
    type?: "MANAGEMENT" | "MARKETPLACE" | "APPLICATION";
  } | null>(null);
  const [imageBust, setImageBust] = useState<number>(0);

  // Estados de notificações
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [isLoadingMoreNotifications, setIsLoadingMoreNotifications] = useState(false);
  const [showOnlyUnread, setShowOnlyUnread] = useState(() => {
    // Recuperar preferência do localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('notifications_show_only_unread');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<INotification | null>(null);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  
  // Estados de paginação
  const [notificationPage, setNotificationPage] = useState(1);
  const [hasMoreNotifications, setHasMoreNotifications] = useState(false);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  // Salvar preferência no localStorage quando mudar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('notifications_show_only_unread', JSON.stringify(showOnlyUnread));
    }
  }, [showOnlyUnread]);

  // Recarregar notificações quando o filtro mudar
  useEffect(() => {
    if (isNotificationMenuOpen) {
      fetchNotifications(1, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showOnlyUnread]);

  useEffect(() => {
    // garante bust somente no cliente para evitar mismatch
    setImageBust(Date.now());

    async function fetchProfile() {
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
      }
    }
    fetchProfile();
    fetchNotifications(1, false);

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
      handler as EventListener
    );
    return () =>
      window.removeEventListener(
        "profile-picture-updated",
        handler as EventListener
      );
  }, []);

  const withCacheBust = (url?: string, bust?: number) =>
    url
      ? bust
        ? `${url}${url.includes("?") ? "&" : "?"}cb=${bust}`
        : url
      : undefined;

  // Buscar notificações
  const fetchNotifications = async (page: number = 1, append: boolean = false) => {
    if (append) {
      setIsLoadingMoreNotifications(true);
    } else {
      setIsLoadingNotifications(true);
    }
    
    try {
      const token = await fetch("/api/get-cookies?key=access_token").then((r) =>
        r.json()
      );

      // Construir query params
      const params = new URLSearchParams({
        page_number: String(page),
        page_size: "20",
        unread_only: showOnlyUnread ? "s" : "n",
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}users/notifications?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        if (append) {
          setNotifications(prev => [...prev, ...data.data]);
        } else {
          setNotifications(data.data);
        }
        
        setHasMoreNotifications(data.has_more);
        setTotalNotifications(data.total);
        setNotificationPage(data.page_number);
        setUnreadCount(data.information?.unread_count || 0);
      }
    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
    } finally {
      setIsLoadingNotifications(false);
      setIsLoadingMoreNotifications(false);
    }
  };

  // Carregar mais notificações
  const loadMoreNotifications = () => {
    if (!isLoadingMoreNotifications && hasMoreNotifications) {
      fetchNotifications(notificationPage + 1, true);
    }
  };

  // Marcar como lida/não lida
  const toggleReadNotification = async (notificationId: string, isRead: boolean) => {
    try {
      const token = await fetch("/api/get-cookies?key=access_token").then((r) =>
        r.json()
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}users/notifications/${notificationId}/${isRead ? 'unread' : 'read'}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        toaster.success({
          title: isRead ? "Marcada como não lida" : "Marcada como lida",
        });
        fetchNotifications(1, false);
      } else {
        toaster.error({
          title: "Erro",
          description: "Não foi possível atualizar a notificação.",
        });
      }
    } catch (error) {
      console.error("Erro ao atualizar notificação:", error);
      toaster.error({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar a notificação.",
      });
    }
  };

  // Deletar notificação
  const deleteNotification = async (notificationId: string) => {
    try {
      const token = await fetch("/api/get-cookies?key=access_token").then((r) =>
        r.json()
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}users/notifications/${notificationId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        toaster.success({
          title: "Notificação removida",
        });
        fetchNotifications(1, false);
      } else {
        toaster.error({
          title: "Erro",
          description: "Não foi possível remover a notificação.",
        });
      }
    } catch (error) {
      console.error("Erro ao deletar notificação:", error);
      toaster.error({
        title: "Erro",
        description: "Ocorreu um erro ao remover a notificação.",
      });
    }
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
    const scrollPercentage = (target.scrollTop + target.clientHeight) / target.scrollHeight;
    
    // Carregar mais quando chegar a 80% do scroll
    if (scrollPercentage > 0.8 && hasMoreNotifications && !isLoadingMoreNotifications) {
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
        </Flex>        <Flex align="center" gap={3}>
          <ColorModeButton />

          {/* Menu de Notificações */}
          <Menu.Root
            open={isNotificationMenuOpen}
            onOpenChange={(e) => setIsNotificationMenuOpen(e.open)}
            positioning={{ placement: "bottom-end" }}
          >
            <Menu.Trigger>
              <Box position="relative">
                <IconButton
                  aria-label="Notificações"
                  variant="ghost"
                  size="sm"
                >
                  <LuBell size={20} />
                </IconButton>
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
              </Box>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content minW="400px" maxW="500px" maxH="600px">
                  <Box p={3} borderBottom="1px" borderColor="gray.200">
                    <Flex justify="space-between" align="center" mb={3}>
                      <Text fontWeight="bold" fontSize="md">
                        Notificações
                        {totalNotifications > 0 && (
                          <Text as="span" ml={2} fontSize="xs" color="gray.500">
                            ({totalNotifications} total)
                          </Text>
                        )}
                      </Text>
                      <IconButton
                        aria-label="Atualizar notificações"
                        size="xs"
                        variant="ghost"
                        onClick={() => fetchNotifications(1, false)}
                        disabled={isLoadingNotifications}
                      >
                        <LuRefreshCw
                          style={{
                            animation: isLoadingNotifications
                              ? "spin 1s linear infinite"
                              : "none",
                          }}
                        />
                      </IconButton>
                    </Flex>
                    <Checkbox.Root
                      checked={showOnlyUnread}
                      onCheckedChange={(e: any) => setShowOnlyUnread(!!e.checked)}
                    >
                      <Checkbox.HiddenInput />
                      <Checkbox.Control />
                      <Checkbox.Label>
                        <Text fontSize="sm">Mostrar apenas não lidas</Text>
                      </Checkbox.Label>
                    </Checkbox.Root>
                  </Box>

                  <Box maxH="400px" overflowY="auto" onScroll={handleNotificationScroll}>
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
                              bg: notification.read_at ? "gray.100" : "blue.100",
                              _dark: { bg: "gray.700" },
                            }}
                            cursor={"pointer"}
                            onClick={() => openNotificationModal(notification)}
                            mb={2}
                          >
                            <Flex justify="space-between" align="center" mb={1}>
                              <Text fontWeight="semibold" fontSize="sm" mr={1}>
                                {notification.title}
                              </Text>
                              <Flex align="center" gap={2} flex="1">
                                <Badge
                                  colorPalette={getNotificationColor(
                                    notification.type
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
                                      !!notification.read_at
                                    );
                                  }}
                                >
                                  lida: {notification.read_at ? <FaRegSquareCheck size={14} /> : <FaRegSquare size={14} />}
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
                              {new Date(notification.created_at).toLocaleString(
                                "pt-BR"
                              )}
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
                        {!hasMoreNotifications && notifications.length > 0 && (
                          <Box textAlign="center" py={3} borderTop="1px" borderColor="gray.200">
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
                  {selectedNotification && (<>
                <Dialog.Header>
                  <Dialog.Title>{selectedNotification.title}</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                    <Box display="flex" flexDir="column" gap={4}>
                      <Flex align="center" gap={2} flexWrap="wrap">
                        <Badge
                          colorPalette={getNotificationColor(
                            selectedNotification.type
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
                        <Text fontSize="md" color="gray.700" _dark={{ color: "gray.300" }} whiteSpace="pre-wrap">
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
                            selectedNotification.created_at
                          ).toLocaleString("pt-BR", {
                            dateStyle: "full",
                            timeStyle: "short",
                          })}
                        </Text>
                        {selectedNotification.read_at && (
                          <>
                            <Text fontSize="xs" color="gray.500" mt={2} mb={1}>
                              Lida em
                            </Text>
                            <Text fontSize="sm">
                              {new Date(
                                selectedNotification.read_at
                              ).toLocaleString("pt-BR", {
                                dateStyle: "full",
                                timeStyle: "short",
                              })}
                            </Text>
                          </>
                        )}
                        {selectedNotification.expires_at && (
                          <>
                            <Text fontSize="xs" color="gray.500" mt={2} mb={1}>
                              Expira em
                            </Text>
                            <Text fontSize="sm">
                              {new Date(
                                selectedNotification.expires_at
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
                        colorPalette={selectedNotification?.read_at ? "orange" : "green"}
                        onClick={() => {
                          if (selectedNotification) {
                            toggleReadNotification(
                              selectedNotification.id,
                              !!selectedNotification.read_at
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
                    <Button variant="outline" onClick={closeNotificationModal} size="sm">
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
                  src={withCacheBust(profile?.profile_uri, imageBust || undefined)}
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
                        src={withCacheBust(profile?.profile_uri, imageBust || undefined)}
                      />
                    </Avatar.Root>
                    {profile?.name}
                  </Menu.Item>

                  <Menu.Separator />

                  {
                    profile?.type === "MANAGEMENT" && (                <Menu.Item
                      onClick={() => router.replace("/manage-system")}
                      style={{ cursor: "pointer" }}
                      value="manage-system"
                    >
                      <Flex align="center" gap={2}>
                        <SiAwssecretsmanager />
                        Gerenciar sistema
                      </Flex>
                    </Menu.Item>)
                  }

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
