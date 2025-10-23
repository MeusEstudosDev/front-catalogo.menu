"use client";

import { toaster } from "@/components/ui/toaster";
import {
  Badge,
  Box,
  Button,
  Container,
  Dialog,
  Flex,
  Heading,
  Input,
  Select,
  Spinner,
  Table,
  Text,
  Textarea,
  createListCollection,
} from "@chakra-ui/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { FaEdit, FaPlus, FaSearch, FaTrash } from "react-icons/fa";
import { MdSwapVert } from "react-icons/md";

// Enums
enum NotificationType {
  INFO = "INFO",
  SUCCESS = "SUCCESS",
  WARNING = "WARNING",
  ERROR = "ERROR",
  SYSTEM = "SYSTEM",
  PROMOTION = "PROMOTION",
  ORDER = "ORDER",
  MESSAGE = "MESSAGE",
  PAYMENT = "PAYMENT",
  ACCOUNT = "ACCOUNT",
}

enum NotificationPriority {
  LOW = "LOW",
  NORMAL = "NORMAL",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

enum UserType {
  MANAGEMENT = "MANAGEMENT",
  MARKETPLACE = "MARKETPLACE",
  APPLICATION = "APPLICATION",
}

// Interface da notificação
interface ISystemNotification {
  id: string;
  created_at: string;
  deleted_at: string | null;
  send_at: string;
  sended_at: string | null;
  type: NotificationType;
  priority: NotificationPriority;
  user_type: UserType | null;
  title: string;
  message: string;
  action_url: string | null;
  metadata: any;
  expires_at: string | null;
}

// Funções auxiliares
const getTypeColorScheme = (type: NotificationType): string => {
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

const getPriorityColorScheme = (priority: NotificationPriority): string => {
  const colors: Record<NotificationPriority, string> = {
    LOW: "gray",
    NORMAL: "blue",
    HIGH: "orange",
    URGENT: "red",
  };
  return colors[priority] || "gray";
};

const translateType = (type: NotificationType): string => {
  const translations: Record<NotificationType, string> = {
    INFO: "Informação",
    SUCCESS: "Sucesso",
    WARNING: "Aviso",
    ERROR: "Erro",
    SYSTEM: "Sistema",
    PROMOTION: "Promoção",
    ORDER: "Pedido",
    MESSAGE: "Mensagem",
    PAYMENT: "Pagamento",
    ACCOUNT: "Conta",
  };
  return translations[type] || type;
};

const translatePriority = (priority: NotificationPriority): string => {
  const translations: Record<NotificationPriority, string> = {
    LOW: "Baixa",
    NORMAL: "Normal",
    HIGH: "Alta",
    URGENT: "Urgente",
  };
  return translations[priority] || priority;
};

const translateUserType = (userType: UserType | null): string => {
  if (!userType) return "Todos";
  const translations: Record<UserType, string> = {
    MANAGEMENT: "Gestão",
    MARKETPLACE: "Marketplace",
    APPLICATION: "Aplicação",
  };
  return translations[userType] || userType;
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function NotificationsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [notifications, setNotifications] = useState<ISystemNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Parâmetros de busca e paginação
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [typeFilter, setTypeFilter] = useState(searchParams.get("type") || "");
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get("priority") || "");
  const [pageNumber, setPageNumber] = useState(Number(searchParams.get("page_number")) || 1);
  const [pageSize, setPageSize] = useState(Number(searchParams.get("page_size")) || 10);
  const [sort, setSort] = useState(searchParams.get("sort") || "created_at");
  const [orderBy, setOrderBy] = useState<"asc" | "desc">(
    (searchParams.get("order_by") as "asc" | "desc") || "desc"
  );

  // Estados dos modais
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<ISystemNotification | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Estados do formulário
  const [formData, setFormData] = useState({
    user_type: "",
    send_at: "",
    type: NotificationType.INFO,
    priority: NotificationPriority.NORMAL,
    title: "",
    message: "",
    action_url: "",
    expires_at: "",
  });

  // Buscar notificações
  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const token = await fetch("/api/get-cookies?key=access_token").then((r) => r.json());

      const params: any = {
        page_number: pageNumber,
        page_size: pageSize,
        sort,
        order_by: orderBy,
      };

      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      if (priorityFilter) params.priority = priorityFilter;

      const queryString = new URLSearchParams(
        Object.entries(params).map(([key, value]) => [key, String(value)])
      ).toString();

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}management/system-notifications?${queryString}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setNotifications(result.data || []);
        setTotal(result.total || 0);
        setTotalPages(result.last_page || 0);
      } else {
        toaster.error({
          title: "Erro ao carregar notificações",
          description: "Não foi possível carregar a lista de notificações.",
        });
      }
    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
      toaster.error({
        title: "Erro",
        description: "Ocorreu um erro ao buscar as notificações.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Atualizar URL com parâmetros
  const updateURL = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (typeFilter) params.set("type", typeFilter);
    if (priorityFilter) params.set("priority", priorityFilter);
    params.set("page_number", String(pageNumber));
    params.set("page_size", String(pageSize));
    params.set("sort", sort);
    params.set("order_by", orderBy);

    router.push(`/manage-system/notifications?${params.toString()}`);
  };

  // Efeito para buscar notificações quando parâmetros mudarem
  useEffect(() => {
    fetchNotifications();
    updateURL();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNumber, pageSize, sort, orderBy]);

  // Função de busca
  const handleSearch = () => {
    setPageNumber(1);
    fetchNotifications();
    updateURL();
  };

  // Função de ordenação
  const handleSort = (field: string) => {
    if (sort === field) {
      setOrderBy(orderBy === "asc" ? "desc" : "asc");
    } else {
      setSort(field);
      setOrderBy("asc");
    }
  };

  // Resetar formulário
  const resetForm = () => {
    setFormData({
      user_type: "",
      send_at: "",
      type: NotificationType.INFO,
      priority: NotificationPriority.NORMAL,
      title: "",
      message: "",
      action_url: "",
      expires_at: "",
    });
  };

  // Abrir modal de criação
  const openCreateModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  // Abrir modal de edição
  const openEditModal = (notification: ISystemNotification) => {
    if (notification.sended_at) {
      toaster.warning({
        title: "Notificação já enviada",
        description: "Não é possível editar notificações que já foram enviadas.",
      });
      return;
    }

    setSelectedNotification(notification);
    setFormData({
      user_type: notification.user_type || "",
      send_at: notification.send_at ? new Date(notification.send_at).toISOString().slice(0, 16) : "",
      type: notification.type,
      priority: notification.priority,
      title: notification.title,
      message: notification.message,
      action_url: notification.action_url || "",
      expires_at: notification.expires_at ? new Date(notification.expires_at).toISOString().slice(0, 16) : "",
    });
    setIsEditModalOpen(true);
  };

  // Criar notificação
  const handleCreate = async () => {
    if (!formData.title || !formData.message || !formData.send_at) {
      toaster.error({
        title: "Campos obrigatórios",
        description: "Preencha título, mensagem e data de envio.",
      });
      return;
    }

    setIsCreating(true);
    try {
      const token = await fetch("/api/get-cookies?key=access_token").then((r) => r.json());

      const body: any = {
        title: formData.title,
        message: formData.message,
        send_at: new Date(formData.send_at).toISOString(),
        type: formData.type,
        priority: formData.priority,
      };

      if (formData.user_type) body.user_type = formData.user_type;
      if (formData.action_url) body.action_url = formData.action_url;
      if (formData.expires_at) body.expires_at = new Date(formData.expires_at).toISOString();

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}management/system-notifications`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );

      if (response.ok) {
        toaster.success({
          title: "Notificação criada!",
          description: "A notificação foi agendada com sucesso.",
        });
        setIsCreateModalOpen(false);
        resetForm();
        fetchNotifications();
      } else {
        const error = await response.json();
        toaster.error({
          title: "Erro ao criar notificação",
          description: error.message?.[0] || "Não foi possível criar a notificação.",
        });
      }
    } catch (error: any) {
      console.error("Erro ao criar notificação:", error);
      toaster.error({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao criar a notificação.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Editar notificação
  const handleEdit = async () => {
    if (!selectedNotification) return;

    if (!formData.title || !formData.message || !formData.send_at) {
      toaster.error({
        title: "Campos obrigatórios",
        description: "Preencha título, mensagem e data de envio.",
      });
      return;
    }

    setIsEditing(true);
    try {
      const token = await fetch("/api/get-cookies?key=access_token").then((r) => r.json());

      const body: any = {
        title: formData.title,
        message: formData.message,
        send_at: new Date(formData.send_at).toISOString(),
        type: formData.type,
        priority: formData.priority,
      };

      if (formData.user_type) body.user_type = formData.user_type;
      if (formData.action_url) body.action_url = formData.action_url;
      if (formData.expires_at) body.expires_at = new Date(formData.expires_at).toISOString();

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}management/system-notifications/${selectedNotification.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );

      if (response.ok) {
        toaster.success({
          title: "Notificação atualizada!",
          description: "A notificação foi atualizada com sucesso.",
        });
        setIsEditModalOpen(false);
        setSelectedNotification(null);
        resetForm();
        fetchNotifications();
      } else {
        const error = await response.json();
        toaster.error({
          title: "Erro ao atualizar notificação",
          description: error.message?.[0] || "Não foi possível atualizar a notificação.",
        });
      }
    } catch (error: any) {
      console.error("Erro ao atualizar notificação:", error);
      toaster.error({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao atualizar a notificação.",
      });
    } finally {
      setIsEditing(false);
    }
  };

  // Abrir modal de deleção
  const openDeleteModal = (notification: ISystemNotification) => {
    setSelectedNotification(notification);
    setIsDeleteModalOpen(true);
  };

  // Confirmar deleção
  const confirmDelete = async () => {
    if (!selectedNotification) return;

    setIsDeleting(true);
    try {
      const token = await fetch("/api/get-cookies?key=access_token").then((r) => r.json());

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}management/system-notifications/${selectedNotification.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        toaster.success({
          title: "Notificação deletada",
          description: "A notificação foi deletada com sucesso.",
        });
        setIsDeleteModalOpen(false);
        setSelectedNotification(null);
        fetchNotifications();
      } else {
        toaster.error({
          title: "Erro ao deletar",
          description: "Não foi possível deletar a notificação.",
        });
      }
    } catch (error) {
      console.error("Erro ao deletar notificação:", error);
      toaster.error({
        title: "Erro",
        description: "Ocorreu um erro ao deletar a notificação.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <Box>
        <Flex justify="space-between" align="center" mb={6}>
          <Box>
            <Heading as="h1" size="xl" mb={2}>
              Notificações do Sistema
            </Heading>
            <Text color="gray.600" _dark={{ color: "gray.400" }}>
              Gerencie as notificações enviadas para os usuários
            </Text>
          </Box>
          <Button colorPalette="blue" onClick={openCreateModal}>
            <FaPlus /> Nova Notificação
          </Button>
        </Flex>

        {/* Filtros */}
        <Box
          p={4}
          bg="white"
          _dark={{ bg: "gray.800" }}
          borderRadius="lg"
          boxShadow="sm"
          mb={6}
        >
          <Flex gap={4} flexWrap="wrap">
            <Box flex="1" minW="200px">
              <Text fontSize="sm" mb={2} fontWeight="medium">
                Buscar
              </Text>
              <Input
                placeholder="Título ou mensagem..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
            </Box>

            <Box minW="150px">
              <Text fontSize="sm" mb={2} fontWeight="medium">
                Tipo
              </Text>
              <Select.Root
                collection={createListCollection({
                  items: [
                    { label: "Todos", value: "" },
                    ...Object.values(NotificationType).map((type) => ({
                      label: translateType(type),
                      value: type,
                    })),
                  ],
                })}
                value={[typeFilter]}
                onValueChange={(e) => setTypeFilter(e.value[0])}
              >
                <Select.Trigger>
                  <Select.ValueText placeholder="Selecione" />
                </Select.Trigger>
                <Select.Content>
                  {[
                    { label: "Todos", value: "" },
                    ...Object.values(NotificationType).map((type) => ({
                      label: translateType(type),
                      value: type,
                    })),
                  ].map((option) => (
                    <Select.Item key={option.value} item={option}>
                      {option.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </Box>

            <Box minW="150px">
              <Text fontSize="sm" mb={2} fontWeight="medium">
                Prioridade
              </Text>
              <Select.Root
                collection={createListCollection({
                  items: [
                    { label: "Todas", value: "" },
                    ...Object.values(NotificationPriority).map((priority) => ({
                      label: translatePriority(priority),
                      value: priority,
                    })),
                  ],
                })}
                value={[priorityFilter]}
                onValueChange={(e) => setPriorityFilter(e.value[0])}
              >
                <Select.Trigger>
                  <Select.ValueText placeholder="Selecione" />
                </Select.Trigger>
                <Select.Content>
                  {[
                    { label: "Todas", value: "" },
                    ...Object.values(NotificationPriority).map((priority) => ({
                      label: translatePriority(priority),
                      value: priority,
                    })),
                  ].map((option) => (
                    <Select.Item key={option.value} item={option}>
                      {option.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </Box>

            <Box display="flex" alignItems="flex-end">
              <Button colorPalette="blue" onClick={handleSearch}>
                <FaSearch /> Buscar
              </Button>
            </Box>
          </Flex>
        </Box>

        {/* Tabela */}
        <Box
          bg="white"
          _dark={{ bg: "gray.800" }}
          borderRadius="lg"
          boxShadow="sm"
          overflow="hidden"
        >
          {isLoading ? (
            <Flex justify="center" align="center" py={12}>
              <Spinner size="xl" />
            </Flex>
          ) : notifications.length === 0 ? (
            <Box textAlign="center" py={12}>
              <Text color="gray.500">Nenhuma notificação encontrada</Text>
            </Box>
          ) : (
            <>
              <Table.Root size="sm" variant="outline">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader
                      onClick={() => handleSort("title")}
                      cursor="pointer"
                      _hover={{ bg: "gray.50", _dark: { bg: "gray.700" } }}
                    >
                      <Flex align="center">
                        Título
                        <MdSwapVert style={{ marginLeft: "4px" }} />
                      </Flex>
                    </Table.ColumnHeader>
                    <Table.ColumnHeader>Tipo</Table.ColumnHeader>
                    <Table.ColumnHeader>Prioridade</Table.ColumnHeader>
                    <Table.ColumnHeader>Destinatários</Table.ColumnHeader>
                    <Table.ColumnHeader
                      onClick={() => handleSort("send_at")}
                      cursor="pointer"
                      _hover={{ bg: "gray.50", _dark: { bg: "gray.700" } }}
                    >
                      <Flex align="center">
                        Enviar em
                        <MdSwapVert style={{ marginLeft: "4px" }} />
                      </Flex>
                    </Table.ColumnHeader>
                    <Table.ColumnHeader>Status</Table.ColumnHeader>
                    <Table.ColumnHeader>Ações</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {notifications.map((notification) => (
                    <Table.Row key={notification.id}>
                      <Table.Cell maxW="300px">
                        <Text fontWeight="medium" textOverflow="ellipsis" overflow="hidden" whiteSpace="nowrap">
                          {notification.title}
                        </Text>
                        <Text fontSize="xs" color="gray.500" textOverflow="ellipsis" overflow="hidden" whiteSpace="nowrap">
                          {notification.message}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge colorPalette={getTypeColorScheme(notification.type)} size="sm">
                          {translateType(notification.type)}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge colorPalette={getPriorityColorScheme(notification.priority)} size="sm">
                          {translatePriority(notification.priority)}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Text fontSize="sm">{translateUserType(notification.user_type)}</Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text fontSize="sm">{formatDate(notification.send_at)}</Text>
                      </Table.Cell>
                      <Table.Cell>
                        {notification.sended_at ? (
                          <Badge colorPalette="green" size="sm">
                            Enviada
                          </Badge>
                        ) : (
                          <Badge colorPalette="orange" size="sm">
                            Pendente
                          </Badge>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <Flex gap={2}>
                          {!notification.sended_at && (
                            <Button
                              size="sm"
                              variant="ghost"
                              colorPalette="blue"
                              onClick={() => openEditModal(notification)}
                            >
                              <FaEdit />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            colorPalette="red"
                            onClick={() => openDeleteModal(notification)}
                          >
                            <FaTrash />
                          </Button>
                        </Flex>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>

              {/* Paginação */}
              <Flex justify="space-between" align="center" p={4} borderTop="1px" borderColor="gray.200">
                <Text fontSize="sm" color="gray.600">
                  Mostrando {(pageNumber - 1) * pageSize + 1} a{" "}
                  {Math.min(pageNumber * pageSize, total)} de {total} notificações
                </Text>
                <Flex gap={2}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPageNumber(pageNumber - 1)}
                    disabled={pageNumber === 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPageNumber(pageNumber + 1)}
                    disabled={pageNumber >= totalPages}
                  >
                    Próxima
                  </Button>
                </Flex>
              </Flex>
            </>
          )}
        </Box>

        {/* Modal de Criação */}
        <Dialog.Root
          open={isCreateModalOpen}
          onOpenChange={(e) => {
            if (!e.open) {
              setIsCreateModalOpen(false);
              resetForm();
            }
          }}
        >
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content maxW="600px">
              <Dialog.Header>
                <Dialog.Title>Nova Notificação</Dialog.Title>
              </Dialog.Header>
              <Dialog.CloseTrigger />
              <Dialog.Body>
                <Box display="flex" flexDir="column" gap={4}>
                  <Box>
                    <Text fontSize="sm" mb={2} fontWeight="medium">
                      Título *
                    </Text>
                    <Input
                      placeholder="Título da notificação"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </Box>

                  <Box>
                    <Text fontSize="sm" mb={2} fontWeight="medium">
                      Mensagem *
                    </Text>
                    <Textarea
                      placeholder="Mensagem da notificação"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={4}
                    />
                  </Box>

                  <Flex gap={4}>
                    <Box flex="1">
                      <Text fontSize="sm" mb={2} fontWeight="medium">
                        Tipo
                      </Text>
                      <Select.Root
                        collection={createListCollection({
                          items: Object.values(NotificationType).map((type) => ({
                            label: translateType(type),
                            value: type,
                          })),
                        })}
                        value={[formData.type]}
                        onValueChange={(e) => setFormData({ ...formData, type: e.value[0] as NotificationType })}
                      >
                        <Select.Trigger>
                          <Select.ValueText placeholder="Selecione" />
                        </Select.Trigger>
                        <Select.Content>
                          {Object.values(NotificationType).map((type) => (
                            <Select.Item key={type} item={{ label: translateType(type), value: type }}>
                              {translateType(type)}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Root>
                    </Box>

                    <Box flex="1">
                      <Text fontSize="sm" mb={2} fontWeight="medium">
                        Prioridade
                      </Text>
                      <Select.Root
                        collection={createListCollection({
                          items: Object.values(NotificationPriority).map((priority) => ({
                            label: translatePriority(priority),
                            value: priority,
                          })),
                        })}
                        value={[formData.priority]}
                        onValueChange={(e) => setFormData({ ...formData, priority: e.value[0] as NotificationPriority })}
                      >
                        <Select.Trigger>
                          <Select.ValueText placeholder="Selecione" />
                        </Select.Trigger>
                        <Select.Content>
                          {Object.values(NotificationPriority).map((priority) => (
                            <Select.Item key={priority} item={{ label: translatePriority(priority), value: priority }}>
                              {translatePriority(priority)}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Root>
                    </Box>
                  </Flex>

                  <Box>
                    <Text fontSize="sm" mb={2} fontWeight="medium">
                      Destinatários
                    </Text>
                    <Select.Root
                      collection={createListCollection({
                        items: [
                          { label: "Todos", value: "" },
                          ...Object.values(UserType).map((userType) => ({
                            label: translateUserType(userType),
                            value: userType,
                          })),
                        ],
                      })}
                      value={[formData.user_type]}
                      onValueChange={(e) => setFormData({ ...formData, user_type: e.value[0] })}
                    >
                      <Select.Trigger>
                        <Select.ValueText placeholder="Selecione" />
                      </Select.Trigger>
                      <Select.Content>
                        {[
                          { label: "Todos", value: "" },
                          ...Object.values(UserType).map((userType) => ({
                            label: translateUserType(userType),
                            value: userType,
                          })),
                        ].map((option) => (
                          <Select.Item key={option.value} item={option}>
                            {option.label}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Root>
                  </Box>

                  <Box>
                    <Text fontSize="sm" mb={2} fontWeight="medium">
                      Enviar em *
                    </Text>
                    <Input
                      type="datetime-local"
                      value={formData.send_at}
                      onChange={(e) => setFormData({ ...formData, send_at: e.target.value })}
                    />
                  </Box>

                  <Box>
                    <Text fontSize="sm" mb={2} fontWeight="medium">
                      URL de Ação (Opcional)
                    </Text>
                    <Input
                      placeholder="/caminho/da/acao"
                      value={formData.action_url}
                      onChange={(e) => setFormData({ ...formData, action_url: e.target.value })}
                    />
                  </Box>

                  <Box>
                    <Text fontSize="sm" mb={2} fontWeight="medium">
                      Expira em (Opcional)
                    </Text>
                    <Input
                      type="datetime-local"
                      value={formData.expires_at}
                      onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                    />
                  </Box>
                </Box>
              </Dialog.Body>
              <Dialog.Footer>
                <Flex gap={2} justify="flex-end" w="100%">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      resetForm();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    colorPalette="blue"
                    onClick={handleCreate}
                    loading={isCreating}
                  >
                    Criar Notificação
                  </Button>
                </Flex>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Root>

        {/* Modal de Edição */}
        <Dialog.Root
          open={isEditModalOpen}
          onOpenChange={(e) => {
            if (!e.open) {
              setIsEditModalOpen(false);
              setSelectedNotification(null);
              resetForm();
            }
          }}
        >
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content maxW="600px">
              <Dialog.Header>
                <Dialog.Title>Editar Notificação</Dialog.Title>
              </Dialog.Header>
              <Dialog.CloseTrigger />
              <Dialog.Body>
                <Box display="flex" flexDir="column" gap={4}>
                  <Box>
                    <Text fontSize="sm" mb={2} fontWeight="medium">
                      Título *
                    </Text>
                    <Input
                      placeholder="Título da notificação"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </Box>

                  <Box>
                    <Text fontSize="sm" mb={2} fontWeight="medium">
                      Mensagem *
                    </Text>
                    <Textarea
                      placeholder="Mensagem da notificação"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={4}
                    />
                  </Box>

                  <Flex gap={4}>
                    <Box flex="1">
                      <Text fontSize="sm" mb={2} fontWeight="medium">
                        Tipo
                      </Text>
                      <Select.Root
                        collection={createListCollection({
                          items: Object.values(NotificationType).map((type) => ({
                            label: translateType(type),
                            value: type,
                          })),
                        })}
                        value={[formData.type]}
                        onValueChange={(e) => setFormData({ ...formData, type: e.value[0] as NotificationType })}
                      >
                        <Select.Trigger>
                          <Select.ValueText placeholder="Selecione" />
                        </Select.Trigger>
                        <Select.Content>
                          {Object.values(NotificationType).map((type) => (
                            <Select.Item key={type} item={{ label: translateType(type), value: type }}>
                              {translateType(type)}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Root>
                    </Box>

                    <Box flex="1">
                      <Text fontSize="sm" mb={2} fontWeight="medium">
                        Prioridade
                      </Text>
                      <Select.Root
                        collection={createListCollection({
                          items: Object.values(NotificationPriority).map((priority) => ({
                            label: translatePriority(priority),
                            value: priority,
                          })),
                        })}
                        value={[formData.priority]}
                        onValueChange={(e) => setFormData({ ...formData, priority: e.value[0] as NotificationPriority })}
                      >
                        <Select.Trigger>
                          <Select.ValueText placeholder="Selecione" />
                        </Select.Trigger>
                        <Select.Content>
                          {Object.values(NotificationPriority).map((priority) => (
                            <Select.Item key={priority} item={{ label: translatePriority(priority), value: priority }}>
                              {translatePriority(priority)}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Root>
                    </Box>
                  </Flex>

                  <Box>
                    <Text fontSize="sm" mb={2} fontWeight="medium">
                      Destinatários
                    </Text>
                    <Select.Root
                      collection={createListCollection({
                        items: [
                          { label: "Todos", value: "" },
                          ...Object.values(UserType).map((userType) => ({
                            label: translateUserType(userType),
                            value: userType,
                          })),
                        ],
                      })}
                      value={[formData.user_type]}
                      onValueChange={(e) => setFormData({ ...formData, user_type: e.value[0] })}
                    >
                      <Select.Trigger>
                        <Select.ValueText placeholder="Selecione" />
                      </Select.Trigger>
                      <Select.Content>
                        {[
                          { label: "Todos", value: "" },
                          ...Object.values(UserType).map((userType) => ({
                            label: translateUserType(userType),
                            value: userType,
                          })),
                        ].map((option) => (
                          <Select.Item key={option.value} item={option}>
                            {option.label}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Root>
                  </Box>

                  <Box>
                    <Text fontSize="sm" mb={2} fontWeight="medium">
                      Enviar em *
                    </Text>
                    <Input
                      type="datetime-local"
                      value={formData.send_at}
                      onChange={(e) => setFormData({ ...formData, send_at: e.target.value })}
                    />
                  </Box>

                  <Box>
                    <Text fontSize="sm" mb={2} fontWeight="medium">
                      URL de Ação (Opcional)
                    </Text>
                    <Input
                      placeholder="/caminho/da/acao"
                      value={formData.action_url}
                      onChange={(e) => setFormData({ ...formData, action_url: e.target.value })}
                    />
                  </Box>

                  <Box>
                    <Text fontSize="sm" mb={2} fontWeight="medium">
                      Expira em (Opcional)
                    </Text>
                    <Input
                      type="datetime-local"
                      value={formData.expires_at}
                      onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                    />
                  </Box>
                </Box>
              </Dialog.Body>
              <Dialog.Footer>
                <Flex gap={2} justify="flex-end" w="100%">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setSelectedNotification(null);
                      resetForm();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    colorPalette="blue"
                    onClick={handleEdit}
                    loading={isEditing}
                  >
                    Salvar Alterações
                  </Button>
                </Flex>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Root>

        {/* Modal de Deleção */}
        <Dialog.Root
          open={isDeleteModalOpen}
          onOpenChange={(e) => {
            if (!e.open) {
              setIsDeleteModalOpen(false);
              setSelectedNotification(null);
            }
          }}
        >
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>Confirmar Exclusão</Dialog.Title>
              </Dialog.Header>
              <Dialog.CloseTrigger />
              <Dialog.Body>
                <Text>
                  Tem certeza que deseja deletar a notificação "{selectedNotification?.title}"?
                </Text>
                <Text mt={2} fontSize="sm" color="red.500">
                  Esta ação não pode ser desfeita.
                </Text>
              </Dialog.Body>
              <Dialog.Footer>
                <Flex gap={2} justify="flex-end" w="100%">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDeleteModalOpen(false);
                      setSelectedNotification(null);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    colorPalette="red"
                    onClick={confirmDelete}
                    loading={isDeleting}
                  >
                    Deletar
                  </Button>
                </Flex>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Root>
      </Box>
    </Container>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <NotificationsPageContent />
    </Suspense>
  );
}
