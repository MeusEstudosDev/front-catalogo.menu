"use client";

import {
  formatCurrency,
  formatDate,
  formatLimit,
  getCurrencySymbol,
  getStatusColorScheme,
  ICreatePlanData,
  IPlan,
  IUpdatePlanData,
  translateStatus,
} from "@/components/plans";
import { toaster } from "@/components/ui/toaster";
import {
  Badge,
  Box,
  Button,
  Container,
  createListCollection,
  Dialog,
  Flex,
  Input,
  InputGroup,
  Select,
  Spinner,
  Table,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import { MdSwapVert } from "react-icons/md";

function PlansPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [plans, setPlans] = useState<IPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Collections para os Selects
  const currencyCollection = createListCollection({
    items: [{ value: "BRL", label: "BRL - Real Brasileiro" }],
  });

  const statusCollection = createListCollection({
    items: [
      { value: "true", label: "Ativo" },
      { value: "false", label: "Inativo" },
    ],
  });

  // Parâmetros de paginação
  const [pageNumber, setPageNumber] = useState(
    Number(searchParams.get("page_number")) || 1
  );
  const [pageSize, setPageSize] = useState(
    Number(searchParams.get("page_size")) || 10
  );

  // Estados dos modais
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<IPlan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Estados do formulário de criação
  const [newPlan, setNewPlan] = useState<ICreatePlanData>({
    name: "",
    description: "",
    price_monthly: "",
    price_yearly: "",
    currency: "BRL",
    trial_days: 0,
    is_active: true,
    max_users: undefined,
    max_branches: undefined,
    max_products: undefined,
    max_orders: undefined,
  });

  // Estados do formulário de edição
  const [editPlan, setEditPlan] = useState<IUpdatePlanData>({});

  // Buscar planos
  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const token = await fetch("/api/get-cookies?key=access_token").then((r) =>
        r.json()
      );

      const queryString = new URLSearchParams({
        page_number: String(pageNumber),
        page_size: String(pageSize),
      }).toString();

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}management/plans?${queryString}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPlans(data.data || []);
        setTotal(data.total || 0);
        setTotalPages(data.last_page || 0);
      } else {
        toaster.error({
          title: "Erro ao carregar planos",
          description: "Não foi possível carregar a lista de planos.",
        });
      }
    } catch (error) {
      console.error("Erro ao buscar planos:", error);
      toaster.error({
        title: "Erro",
        description: "Ocorreu um erro ao buscar os planos.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Atualizar URL com parâmetros
  const updateURL = () => {
    const params = new URLSearchParams();
    params.set("page_number", String(pageNumber));
    params.set("page_size", String(pageSize));

    router.push(`/manage-system/plans?${params.toString()}`);
  };

  // Efeito para buscar planos quando parâmetros mudarem
  useEffect(() => {
    fetchPlans();
    updateURL();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNumber, pageSize]);

  // Abrir modal de deleção
  const openDeleteModal = (plan: IPlan) => {
    setSelectedPlan(plan);
    setIsDeleteModalOpen(true);
  };

  // Confirmar deleção
  const confirmDelete = async () => {
    if (!selectedPlan) return;

    setIsDeleting(true);
    try {
      const token = await fetch("/api/get-cookies?key=access_token").then((r) =>
        r.json()
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}management/plans/${selectedPlan.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        toaster.success({
          title: "Plano deletado",
          description: `O plano "${selectedPlan.name}" foi deletado com sucesso.`,
        });
        setIsDeleteModalOpen(false);
        setSelectedPlan(null);
        fetchPlans();
      } else {
        toaster.error({
          title: "Erro ao deletar",
          description: "Não foi possível deletar o plano.",
        });
      }
    } catch (error) {
      console.error("Erro ao deletar plano:", error);
      toaster.error({
        title: "Erro",
        description: "Ocorreu um erro ao deletar o plano.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Abrir modal de alteração de status
  const openStatusModal = (plan: IPlan) => {
    setSelectedPlan(plan);
    setIsStatusModalOpen(true);
  };

  // Confirmar alteração de status
  const confirmStatusChange = async () => {
    if (!selectedPlan) return;

    setIsUpdatingStatus(true);
    try {
      const token = await fetch("/api/get-cookies?key=access_token").then((r) =>
        r.json()
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}management/plans/${selectedPlan.id}/toggle-status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        toaster.success({
          title: "Status atualizado",
          description:
            data.message || "Status do plano atualizado com sucesso.",
        });
        setIsStatusModalOpen(false);
        setSelectedPlan(null);
        fetchPlans();
      } else {
        toaster.error({
          title: "Erro ao atualizar status",
          description: "Não foi possível atualizar o status do plano.",
        });
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toaster.error({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar o status.",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Criar novo plano
  const handleCreatePlan = async () => {
    if (!newPlan.name || !newPlan.price_monthly || !newPlan.currency) {
      toaster.error({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
      });
      return;
    }

    setIsCreating(true);
    try {
      const token = await fetch("/api/get-cookies?key=access_token").then((r) =>
        r.json()
      );

      const body: any = {
        name: newPlan.name,
        price_monthly: newPlan.price_monthly,
        currency: newPlan.currency,
        trial_days: newPlan.trial_days,
        is_active: newPlan.is_active,
      };

      if (newPlan.description) body.description = newPlan.description;
      if (newPlan.price_yearly) body.price_yearly = newPlan.price_yearly;
      if (newPlan.max_users !== undefined) body.max_users = newPlan.max_users;
      if (newPlan.max_branches !== undefined)
        body.max_branches = newPlan.max_branches;
      if (newPlan.max_products !== undefined)
        body.max_products = newPlan.max_products;
      if (newPlan.max_orders !== undefined)
        body.max_orders = newPlan.max_orders;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}management/plans`,
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
          title: "Plano criado!",
          description: `O plano "${newPlan.name}" foi criado com sucesso.`,
        });
        setIsCreateModalOpen(false);
        setNewPlan({
          name: "",
          description: "",
          price_monthly: "",
          price_yearly: "",
          currency: "BRL",
          trial_days: 0,
          is_active: true,
          max_users: undefined,
          max_branches: undefined,
          max_products: undefined,
          max_orders: undefined,
        });
        fetchPlans();
      } else {
        const error = await response.json();
        toaster.error({
          title: "Erro ao criar plano",
          description: error.message?.[0] || "Não foi possível criar o plano.",
        });
      }
    } catch (error: any) {
      console.error("Erro ao criar plano:", error);
      toaster.error({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao criar o plano.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Abrir modal de edição
  const openEditModal = (plan: IPlan) => {
    setSelectedPlan(plan);
    setEditPlan({
      name: plan.name,
      description: plan.description || "",
      price_monthly: plan.price_monthly,
      price_yearly: plan.price_yearly || "",
      currency: plan.currency,
      trial_days: plan.trial_days,
      is_active: plan.is_active,
      max_users: plan.max_users || undefined,
      max_branches: plan.max_branches || undefined,
      max_products: plan.max_products || undefined,
      max_orders: plan.max_orders || undefined,
    });
    setIsEditModalOpen(true);
  };

  // Atualizar plano existente
  const handleUpdatePlan = async () => {
    if (!selectedPlan) return;

    setIsUpdating(true);
    try {
      const token = await fetch("/api/get-cookies?key=access_token").then((r) =>
        r.json()
      );

      const body: any = {};
      if (editPlan.name !== undefined) body.name = editPlan.name;
      if (editPlan.description !== undefined)
        body.description = editPlan.description;
      if (editPlan.price_monthly !== undefined)
        body.price_monthly = editPlan.price_monthly;
      if (editPlan.price_yearly !== undefined)
        body.price_yearly = editPlan.price_yearly;
      if (editPlan.currency !== undefined) body.currency = editPlan.currency;
      if (editPlan.trial_days !== undefined)
        body.trial_days = editPlan.trial_days;
      if (editPlan.is_active !== undefined) body.is_active = editPlan.is_active;
      if (editPlan.max_users !== undefined) body.max_users = editPlan.max_users;
      if (editPlan.max_branches !== undefined)
        body.max_branches = editPlan.max_branches;
      if (editPlan.max_products !== undefined)
        body.max_products = editPlan.max_products;
      if (editPlan.max_orders !== undefined)
        body.max_orders = editPlan.max_orders;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}management/plans/${selectedPlan.id}`,
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
          title: "Plano atualizado!",
          description: `O plano "${editPlan.name}" foi atualizado com sucesso.`,
        });
        setIsEditModalOpen(false);
        setSelectedPlan(null);
        setEditPlan({});
        fetchPlans();
      } else {
        const error = await response.json();
        toaster.error({
          title: "Erro ao atualizar plano",
          description:
            error.message?.[0] || "Não foi possível atualizar o plano.",
        });
      }
    } catch (error: any) {
      console.error("Erro ao atualizar plano:", error);
      toaster.error({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao atualizar o plano.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Abrir modal de detalhes
  const openDetailsModal = (plan: IPlan) => {
    setSelectedPlan(plan);
    setIsDetailsModalOpen(true);
  };

  return (
    <Container maxW="container.xl">
      <Box>
        {/* Cabeçalho */}
        <Flex justify="flex-end" align="center" mb={6}>
          {plans.length !== 0 && (
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <FaPlus />
              Criar novo plano
            </Button>
          )}
        </Flex>

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
          ) : plans.length === 0 ? (
            <Box
              textAlign="center"
              py={8}
              border="1px dashed"
              borderColor="gray.300"
              borderRadius="md"
            >
              <Text color="gray.500">Nenhum plano encontrado</Text>
              <Text fontSize="sm" color="gray.400" mb={4}>
                Crie o primeiro plano para começar
              </Text>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <FaPlus />
                Criar primeiro plano
              </Button>
            </Box>
          ) : (
            <Box
              overflowX="auto"
              border="1px"
              borderColor="gray.200"
              borderRadius="md"
            >
              <Table.Root variant="outline" size="sm">
                <Table.Header>
                  <Table.Row bg="gray.50" _dark={{ bg: "gray.800" }}>
                    <Table.ColumnHeader>Código</Table.ColumnHeader>
                    <Table.ColumnHeader>Nome</Table.ColumnHeader>
                    <Table.ColumnHeader>Preço Mensal</Table.ColumnHeader>
                    <Table.ColumnHeader>Preço Anual</Table.ColumnHeader>
                    <Table.ColumnHeader>Moeda</Table.ColumnHeader>
                    <Table.ColumnHeader>Dias de Teste</Table.ColumnHeader>
                    <Table.ColumnHeader>Status</Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="right">
                      Ações
                    </Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {plans.map((plan) => (
                    <Table.Row
                      key={plan.id}
                      _hover={{ bg: "gray.50", _dark: { bg: "gray.800" } }}
                      cursor="pointer"
                      onClick={() => openDetailsModal(plan)}
                    >
                      <Table.Cell fontWeight="medium">#{plan.code}</Table.Cell>
                      <Table.Cell>{plan.name}</Table.Cell>
                      <Table.Cell>
                        {formatCurrency(plan.price_monthly, plan.currency)}
                      </Table.Cell>
                      <Table.Cell>
                        {plan.price_yearly
                          ? formatCurrency(plan.price_yearly, plan.currency)
                          : "-"}
                      </Table.Cell>
                      <Table.Cell>{plan.currency}</Table.Cell>
                      <Table.Cell>{plan.trial_days} dias</Table.Cell>
                      <Table.Cell>
                        <Badge
                          colorPalette={getStatusColorScheme(plan.is_active)}
                        >
                          {translateStatus(plan.is_active)}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Flex
                          justify="right"
                          gap={2}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => openEditModal(plan)}
                            title="Editar"
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            colorPalette="orange"
                            onClick={() => openStatusModal(plan)}
                            title="Alterar status"
                          >
                            <MdSwapVert />
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            colorPalette="red"
                            onClick={() => openDeleteModal(plan)}
                            title="Deletar"
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
              <Flex
                justify="space-between"
                align="center"
                p={4}
                borderTop="1px"
                borderColor="gray.200"
              >
                <Text fontSize="sm" color="gray.600">
                  Mostrando {(pageNumber - 1) * pageSize + 1} a{" "}
                  {Math.min(pageNumber * pageSize, total)} de {total} planos
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
            </Box>
          )}
        </Box>

        {/* Modal de Criação */}
        <Dialog.Root
          open={isCreateModalOpen}
          onOpenChange={(e) => {
            if (!e.open) {
              setIsCreateModalOpen(false);
              setNewPlan({
                name: "",
                description: "",
                price_monthly: "",
                price_yearly: "",
                currency: "BRL",
                trial_days: 0,
                is_active: true,
                max_users: undefined,
                max_branches: undefined,
                max_products: undefined,
                max_orders: undefined,
              });
            }
          }}
        >
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content maxW="600px">
              <Dialog.Header>
                <Dialog.Title>Criar Novo Plano</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Box display="flex" flexDir="column" gap={4}>
                  <Box>
                    <InputGroup startAddon="Nome *">
                      <Input
                        placeholder="Nome do plano"
                        value={newPlan.name}
                        onChange={(e) =>
                          setNewPlan({ ...newPlan, name: e.target.value })
                        }
                      />
                    </InputGroup>
                  </Box>
                  <Box>
                    <InputGroup startAddon="Descrição">
                      <Textarea
                        placeholder="Descrição do plano"
                        value={newPlan.description}
                        onChange={(e) =>
                          setNewPlan({
                            ...newPlan,
                            description: e.target.value,
                          })
                        }
                      />
                    </InputGroup>
                  </Box>
                  <Box>
                    <Text fontSize="sm" mb={1} fontWeight="medium">
                      Moeda{" "}
                      <Text as="span" color="red.500">
                        *
                      </Text>
                    </Text>
                    <Select.Root
                      value={[newPlan.currency]}
                      onValueChange={(e) =>
                        setNewPlan({
                          ...newPlan,
                          currency: e.value[0] as any,
                        })
                      }
                      size="md"
                      collection={currencyCollection}
                      positioning={{ sameWidth: true }}
                    >
                      <Select.HiddenSelect />
                      <Select.Control>
                        <Select.Trigger cursor="pointer">
                          <Select.ValueText placeholder="Selecione a moeda" />
                        </Select.Trigger>
                        <Select.IndicatorGroup>
                          <Select.Indicator />
                        </Select.IndicatorGroup>
                      </Select.Control>
                      <Select.Positioner zIndex={2000}>
                        <Select.Content>
                          {currencyCollection.items.map((item) => (
                            <Select.Item
                              cursor="pointer"
                              item={item}
                              key={item.value}
                            >
                              {item.label}
                              <Select.ItemIndicator />
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Positioner>
                    </Select.Root>
                  </Box>
                  <Flex gap={4}>
                    <Box flex="1">
                      <InputGroup
                        startAddon={getCurrencySymbol(newPlan.currency)}
                      >
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Preço Mensal *"
                          value={newPlan.price_monthly}
                          onChange={(e) =>
                            setNewPlan({
                              ...newPlan,
                              price_monthly: e.target.value,
                            })
                          }
                        />
                      </InputGroup>
                    </Box>
                    <Box flex="1">
                      <InputGroup
                        startAddon={getCurrencySymbol(newPlan.currency)}
                      >
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Preço Anual"
                          value={newPlan.price_yearly}
                          onChange={(e) =>
                            setNewPlan({
                              ...newPlan,
                              price_yearly: e.target.value,
                            })
                          }
                        />
                      </InputGroup>
                    </Box>
                  </Flex>
                  <Box>
                    <InputGroup startAddon="Dias de Teste">
                      <Input
                        type="number"
                        placeholder="15"
                        value={newPlan.trial_days}
                        onChange={(e) =>
                          setNewPlan({
                            ...newPlan,
                            trial_days: Number(e.target.value),
                          })
                        }
                      />
                    </InputGroup>
                  </Box>
                  <Flex gap={4}>
                    <Box flex="1">
                      <InputGroup startAddon="Limite de Usuários">
                        <Input
                          type="number"
                          placeholder="Ilimitado"
                          value={newPlan.max_users || ""}
                          onChange={(e) =>
                            setNewPlan({
                              ...newPlan,
                              max_users: e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            })
                          }
                        />
                      </InputGroup>
                    </Box>
                    <Box flex="1">
                      <InputGroup startAddon="Limite de Filiais">
                        <Input
                          type="number"
                          placeholder="Ilimitado"
                          value={newPlan.max_branches || ""}
                          onChange={(e) =>
                            setNewPlan({
                              ...newPlan,
                              max_branches: e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            })
                          }
                        />
                      </InputGroup>
                    </Box>
                  </Flex>
                  <Flex gap={4}>
                    <Box flex="1">
                      <InputGroup startAddon="Limite de Produtos">
                        <Input
                          type="number"
                          placeholder="Ilimitado"
                          value={newPlan.max_products || ""}
                          onChange={(e) =>
                            setNewPlan({
                              ...newPlan,
                              max_products: e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            })
                          }
                        />
                      </InputGroup>
                    </Box>
                    <Box flex="1">
                      <InputGroup startAddon="Limite de Pedidos">
                        <Input
                          type="number"
                          placeholder="Ilimitado"
                          value={newPlan.max_orders || ""}
                          onChange={(e) =>
                            setNewPlan({
                              ...newPlan,
                              max_orders: e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            })
                          }
                        />
                      </InputGroup>
                    </Box>
                  </Flex>
                </Box>
              </Dialog.Body>
              <Dialog.Footer>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setNewPlan({
                      name: "",
                      description: "",
                      price_monthly: "",
                      price_yearly: "",
                      currency: "BRL",
                      trial_days: 0,
                      is_active: true,
                      max_users: undefined,
                      max_branches: undefined,
                      max_products: undefined,
                      max_orders: undefined,
                    });
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleCreatePlan} loading={isCreating}>
                  Criar Plano
                </Button>
              </Dialog.Footer>
              <Dialog.CloseTrigger />
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Root>

        {/* Modal de Edição */}
        <Dialog.Root
          open={isEditModalOpen}
          onOpenChange={(e) => {
            if (!e.open) {
              setIsEditModalOpen(false);
              setSelectedPlan(null);
              setEditPlan({});
            }
          }}
        >
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content maxW="600px">
              <Dialog.Header>
                <Dialog.Title>Editar Plano</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Box display="flex" flexDir="column" gap={4}>
                  <Box>
                    <InputGroup startAddon="Nome">
                      <Input
                        placeholder="Nome do plano"
                        value={editPlan.name || ""}
                        onChange={(e) =>
                          setEditPlan({ ...editPlan, name: e.target.value })
                        }
                      />
                    </InputGroup>
                  </Box>
                  <Box>
                    <InputGroup startAddon="Descrição">
                      <Textarea
                        placeholder="Descrição do plano"
                        value={editPlan.description || ""}
                        onChange={(e) =>
                          setEditPlan({
                            ...editPlan,
                            description: e.target.value,
                          })
                        }
                      />
                    </InputGroup>
                  </Box>
                  <Box>
                    <Text fontSize="sm" mb={1} fontWeight="medium">
                      Moeda
                    </Text>
                    <Select.Root
                      value={[editPlan.currency || "BRL"]}
                      onValueChange={(e) =>
                        setEditPlan({
                          ...editPlan,
                          currency: e.value[0] as any,
                        })
                      }
                      size="md"
                      collection={currencyCollection}
                      positioning={{ sameWidth: true }}
                    >
                      <Select.HiddenSelect />
                      <Select.Control>
                        <Select.Trigger cursor="pointer">
                          <Select.ValueText placeholder="Selecione a moeda" />
                        </Select.Trigger>
                        <Select.IndicatorGroup>
                          <Select.Indicator />
                        </Select.IndicatorGroup>
                      </Select.Control>
                      <Select.Positioner zIndex={2000}>
                        <Select.Content>
                          {currencyCollection.items.map((item) => (
                            <Select.Item
                              cursor="pointer"
                              item={item}
                              key={item.value}
                            >
                              {item.label}
                              <Select.ItemIndicator />
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Positioner>
                    </Select.Root>
                  </Box>
                  <Flex gap={4}>
                    <Box flex="1">
                      <InputGroup
                        startAddon={getCurrencySymbol(
                          editPlan.currency || "BRL"
                        )}
                      >
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Preço Mensal"
                          value={editPlan.price_monthly || ""}
                          onChange={(e) =>
                            setEditPlan({
                              ...editPlan,
                              price_monthly: e.target.value,
                            })
                          }
                        />
                      </InputGroup>
                    </Box>
                    <Box flex="1">
                      <InputGroup
                        startAddon={getCurrencySymbol(
                          editPlan.currency || "BRL"
                        )}
                      >
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Preço Anual"
                          value={editPlan.price_yearly || ""}
                          onChange={(e) =>
                            setEditPlan({
                              ...editPlan,
                              price_yearly: e.target.value,
                            })
                          }
                        />
                      </InputGroup>
                    </Box>
                  </Flex>
                  <Box>
                    <InputGroup startAddon="Dias de Teste">
                      <Input
                        type="number"
                        placeholder="15"
                        value={editPlan.trial_days || ""}
                        onChange={(e) =>
                          setEditPlan({
                            ...editPlan,
                            trial_days: Number(e.target.value),
                          })
                        }
                      />
                    </InputGroup>
                  </Box>
                  <Flex gap={4}>
                    <Box flex="1">
                      <InputGroup startAddon="Limite de Usuários">
                        <Input
                          type="number"
                          placeholder="Ilimitado"
                          value={editPlan.max_users || ""}
                          onChange={(e) =>
                            setEditPlan({
                              ...editPlan,
                              max_users: e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            })
                          }
                        />
                      </InputGroup>
                    </Box>
                    <Box flex="1">
                      <InputGroup startAddon="Limite de Filiais">
                        <Input
                          type="number"
                          placeholder="Ilimitado"
                          value={editPlan.max_branches || ""}
                          onChange={(e) =>
                            setEditPlan({
                              ...editPlan,
                              max_branches: e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            })
                          }
                        />
                      </InputGroup>
                    </Box>
                  </Flex>
                  <Flex gap={4}>
                    <Box flex="1">
                      <InputGroup startAddon="Limite de Produtos">
                        <Input
                          type="number"
                          placeholder="Ilimitado"
                          value={editPlan.max_products || ""}
                          onChange={(e) =>
                            setEditPlan({
                              ...editPlan,
                              max_products: e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            })
                          }
                        />
                      </InputGroup>
                    </Box>
                    <Box flex="1">
                      <InputGroup startAddon="Limite de Pedidos">
                        <Input
                          type="number"
                          placeholder="Ilimitado"
                          value={editPlan.max_orders || ""}
                          onChange={(e) =>
                            setEditPlan({
                              ...editPlan,
                              max_orders: e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            })
                          }
                        />
                      </InputGroup>
                    </Box>
                  </Flex>
                </Box>
              </Dialog.Body>
              <Dialog.Footer>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedPlan(null);
                    setEditPlan({});
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleUpdatePlan} loading={isUpdating}>
                  Salvar Alterações
                </Button>
              </Dialog.Footer>
              <Dialog.CloseTrigger />
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Root>

        {/* Modal de Detalhes */}
        <Dialog.Root
          open={isDetailsModalOpen}
          onOpenChange={(e) => {
            if (!e.open) {
              setIsDetailsModalOpen(false);
              setSelectedPlan(null);
            }
          }}
        >
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content maxW="600px">
              <Dialog.Header>
                <Dialog.Title>Detalhes do Plano</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                {selectedPlan && (
                  <Box display="flex" flexDir="column" gap={3}>
                    <Flex justify="space-between">
                      <Text fontWeight="medium">Código:</Text>
                      <Text>#{selectedPlan.code}</Text>
                    </Flex>
                    <Flex justify="space-between">
                      <Text fontWeight="medium">Nome:</Text>
                      <Text>{selectedPlan.name}</Text>
                    </Flex>
                    <Flex justify="space-between" align="start">
                      <Text fontWeight="medium">Descrição:</Text>
                      <Text textAlign="right" maxW="70%">
                        {selectedPlan.description || "-"}
                      </Text>
                    </Flex>
                    <Flex justify="space-between">
                      <Text fontWeight="medium">Preço Mensal:</Text>
                      <Text>
                        {formatCurrency(
                          selectedPlan.price_monthly,
                          selectedPlan.currency
                        )}
                      </Text>
                    </Flex>
                    <Flex justify="space-between">
                      <Text fontWeight="medium">Preço Anual:</Text>
                      <Text>
                        {selectedPlan.price_yearly
                          ? formatCurrency(
                              selectedPlan.price_yearly,
                              selectedPlan.currency
                            )
                          : "-"}
                      </Text>
                    </Flex>
                    <Flex justify="space-between">
                      <Text fontWeight="medium">Moeda:</Text>
                      <Text>{selectedPlan.currency}</Text>
                    </Flex>
                    <Flex justify="space-between">
                      <Text fontWeight="medium">Dias de Teste:</Text>
                      <Text>{selectedPlan.trial_days} dias</Text>
                    </Flex>
                    <Flex justify="space-between">
                      <Text fontWeight="medium">Status:</Text>
                      <Badge
                        colorPalette={getStatusColorScheme(
                          selectedPlan.is_active
                        )}
                      >
                        {translateStatus(selectedPlan.is_active)}
                      </Badge>
                    </Flex>
                    <Flex justify="space-between">
                      <Text fontWeight="medium">Limite de Usuários:</Text>
                      <Text>{formatLimit(selectedPlan.max_users)}</Text>
                    </Flex>
                    <Flex justify="space-between">
                      <Text fontWeight="medium">Limite de Filiais:</Text>
                      <Text>{formatLimit(selectedPlan.max_branches)}</Text>
                    </Flex>
                    <Flex justify="space-between">
                      <Text fontWeight="medium">Limite de Produtos:</Text>
                      <Text>{formatLimit(selectedPlan.max_products)}</Text>
                    </Flex>
                    <Flex justify="space-between">
                      <Text fontWeight="medium">Limite de Pedidos:</Text>
                      <Text>{formatLimit(selectedPlan.max_orders)}</Text>
                    </Flex>
                    <Flex justify="space-between">
                      <Text fontWeight="medium">Data de Criação:</Text>
                      <Text>{formatDate(selectedPlan.created_at)}</Text>
                    </Flex>
                    <Flex justify="space-between">
                      <Text fontWeight="medium">Última Atualização:</Text>
                      <Text>{formatDate(selectedPlan.updated_at)}</Text>
                    </Flex>
                  </Box>
                )}
              </Dialog.Body>
              <Dialog.Footer>
                <Button
                  onClick={() => {
                    setIsDetailsModalOpen(false);
                    setSelectedPlan(null);
                  }}
                >
                  Fechar
                </Button>
              </Dialog.Footer>
              <Dialog.CloseTrigger />
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Root>

        {/* Modal de Deleção */}
        <Dialog.Root
          open={isDeleteModalOpen}
          onOpenChange={(e) => {
            if (!e.open) {
              setIsDeleteModalOpen(false);
              setSelectedPlan(null);
            }
          }}
        >
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>Confirmar Deleção</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Text>
                  Tem certeza que deseja deletar o plano{" "}
                  <strong>{selectedPlan?.name}</strong>?
                </Text>
                <Text mt={2} fontSize="sm" color="red.500">
                  Esta ação não pode ser desfeita.
                </Text>
              </Dialog.Body>
              <Dialog.Footer>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedPlan(null);
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
              </Dialog.Footer>
              <Dialog.CloseTrigger />
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Root>

        {/* Modal de Alteração de Status */}
        <Dialog.Root
          open={isStatusModalOpen}
          onOpenChange={(e) => {
            if (!e.open) {
              setIsStatusModalOpen(false);
              setSelectedPlan(null);
            }
          }}
        >
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>Alterar Status</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Text>
                  Deseja {selectedPlan?.is_active ? "desativar" : "ativar"} o
                  plano <strong>{selectedPlan?.name}</strong>?
                </Text>
              </Dialog.Body>
              <Dialog.Footer>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsStatusModalOpen(false);
                    setSelectedPlan(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmStatusChange}
                  loading={isUpdatingStatus}
                >
                  Confirmar
                </Button>
              </Dialog.Footer>
              <Dialog.CloseTrigger />
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Root>
      </Box>
    </Container>
  );
}

export default function PlansPage() {
  return (
    <Suspense
      fallback={
        <Container maxW="container.xl" py={8}>
          <Flex justify="center" align="center" minH="400px">
            <Spinner size="xl" />
          </Flex>
        </Container>
      }
    >
      <PlansPageContent />
    </Suspense>
  );
}
