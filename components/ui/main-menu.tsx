"use client";

import { Avatar, Badge, Box, Breadcrumb, Checkbox, Flex, IconButton, Menu, Portal, Spinner, Text } from "@chakra-ui/react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import React, { Fragment, useEffect, useState } from "react";
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
  const [showOnlyUnread, setShowOnlyUnread] = useState(() => {
    // Recuperar preferência do localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('notifications_show_only_unread');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);

  // Salvar preferência no localStorage quando mudar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('notifications_show_only_unread', JSON.stringify(showOnlyUnread));
    }
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
    fetchNotifications();

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
  const fetchNotifications = async () => {
    setIsLoadingNotifications(true);
    try {
      const token = await fetch("/api/get-cookies?key=access_token").then((r) =>
        r.json()
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}users/notifications`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
    } finally {
      setIsLoadingNotifications(false);
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
        fetchNotifications();
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
        fetchNotifications();
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
                {notifications.filter((n) => !n.read_at).length > 0 && (
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
                    {notifications.filter((n) => !n.read_at).length}
                  </Badge>
                )}
              </Box>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content minW="400px" maxW="500px" maxH="600px">
                  <Box p={3} borderBottom="1px" borderColor="gray.200">
                    <Flex justify="space-between" align="center" mb={2}>
                      <Text fontWeight="bold" fontSize="lg">
                        Notificações
                      </Text>
                      <IconButton
                        aria-label="Atualizar notificações"
                        size="xs"
                        variant="ghost"
                        onClick={fetchNotifications}
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

                  <Box maxH="400px" overflowY="auto">
                    {isLoadingNotifications ? (
                      <Flex justify="center" align="center" py={8}>
                        <Spinner size="lg" />
                      </Flex>
                    ) : notifications.length === 0 ? (
                      <Box textAlign="center" py={8}>
                        <Text color="gray.500">Nenhuma notificação</Text>
                      </Box>
                    ) : (
                      notifications
                        .filter((n) => !showOnlyUnread || !n.read_at)
                        .map((notification) => (
                          <Box
                            key={notification.id}
                            p={3}
                            borderBottom="1px"
                            borderColor="gray.100"
                            bg={notification.read_at ? "transparent" : "blue.50"}
                            _dark={{
                              bg: notification.read_at
                                ? "transparent"
                                : "blue.900",
                            }}
                            _hover={{
                              bg: "gray.50",
                              _dark: { bg: "gray.700" },
                            }}
                            cursor={notification.action_url ? "pointer" : "default"}
                            onClick={() => {
                              if (notification.action_url) {
                                router.push(notification.action_url);
                                setIsNotificationMenuOpen(false);
                              }
                            }}
                          >
                            <Flex justify="space-between" align="start" mb={1}>
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
                                  {notification.read_at ? <LuX size={14} /> : <LuCheck size={14} />}
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
                            <Text fontWeight="semibold" fontSize="sm" mb={1}>
                              {notification.title}
                            </Text>
                            <Text fontSize="xs" color="gray.600" mb={1}>
                              {notification.message}
                            </Text>
                            <Text fontSize="xs" color="gray.400">
                              {new Date(notification.created_at).toLocaleString(
                                "pt-BR"
                              )}
                            </Text>
                          </Box>
                        ))
                    )}
                  </Box>
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>

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
