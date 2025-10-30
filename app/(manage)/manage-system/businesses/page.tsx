"use client";

import {
  BusinessStatus,
  formatCnpj,
  formatDate,
  getStatusColorScheme,
  IBusiness,
  IBusinessListParams,
  translateStatus,
} from "@/components/businesses";
import { toaster } from "@/components/ui/toaster";
import {
  Badge,
  Box,
  Button,
  Container,
  Dialog,
  Flex,
  Input,
  InputGroup,
  NativeSelect,
  Spinner,
  Table,
  Text
} from "@chakra-ui/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { FaEdit, FaExternalLinkAlt, FaPlus, FaSearch, FaTrash } from "react-icons/fa";
import { MdSwapVert } from "react-icons/md";

function BusinessesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [businesses, setBusinesses] = useState<IBusiness[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Parâmetros de busca e paginação
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [code, setCode] = useState(searchParams.get("code") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [pageNumber, setPageNumber] = useState(Number(searchParams.get("page_number")) || 1);
  const [pageSize, setPageSize] = useState(Number(searchParams.get("page_size")) || 10);
  const [sort, setsort] = useState(searchParams.get("sort") || "created_at");
  const [order_by, setOrder] = useState<"asc" | "desc">(
    (searchParams.get("order_by") as "asc" | "desc") || "desc"
  );

  // Estados dos modais
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<IBusiness | null>(null);
  const [newStatus, setNewStatus] = useState<BusinessStatus>(BusinessStatus.ACTIVE);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Estados do formulário de criação
  const [newBusiness, setNewBusiness] = useState({
    cnpj: "",
    name: "",
    website: "",
    user_name: "",
    user_email: "",
  });

  // Buscar empresas
  const fetchBusinesses = async () => {
    setIsLoading(true);
    try {
      const token = await fetch("/api/get-cookies?key=access_token").then((r) =>
        r.json()
      );

      const params: IBusinessListParams = {
        page_number: pageNumber,
        page_size: pageSize,
        sort,
        order_by,
      };

      if (search) {
        params.search = search;
      }

      if (code) {
        params.code = Number(code);
      }

      if (statusFilter) {
        params.status = statusFilter as BusinessStatus;
      }

      const queryString = new URLSearchParams({
        page_number: String(params.page_number),
        page_size: String(params.page_size),
        sort: params.sort,
        order_by: params.order_by,
        ...(params.search && { search: params.search }),
        ...(params.code && { code: String(params.code) }),
        ...(params.status && { status: params.status }),
      }).toString();

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}management/businesses?${queryString}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setBusinesses(data.data || []);
        setTotal(data.total || 0);
        setTotalPages(data.last_page || 0);
      } else {
        toaster.error({
          title: "Erro ao carregar empresas",
          description: "Não foi possível carregar a lista de empresas.",
        });
      }
    } catch (error) {
      console.error("Erro ao buscar empresas:", error);
      toaster.error({
        title: "Erro",
        description: "Ocorreu um erro ao buscar as empresas.",
      });
    } finally {
        setIsLoading(false);
    }
  };

  // Atualizar URL com parâmetros
  const updateURL = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (code) params.set("code", code);
    if (statusFilter) params.set("status", statusFilter);
    params.set("page_number", String(pageNumber));
    params.set("page_size", String(pageSize));
    params.set("sort", sort);
    params.set("order_by", order_by);

    router.push(`/manage-system/businesses?${params.toString()}`);
  };

  // Efeito para buscar empresas quando parâmetros mudarem
  useEffect(() => {
    fetchBusinesses();
    updateURL();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNumber, pageSize, sort, order_by]);

  // Função de busca
  const handleSearch = () => {
    setPageNumber(1); // Resetar para primeira página
    fetchBusinesses();
    updateURL();
  };

  // Função de ordenação
  const handleSort = (field: string) => {
    if (sort === field) {
      setOrder(order_by === "asc" ? "desc" : "asc");
    } else {
      setsort(field);
      setOrder("asc");
    }
  };

  // Abrir modal de deleção
  const openDeleteModal = (business: IBusiness) => {
    setSelectedBusiness(business);
    setIsDeleteModalOpen(true);
  };

  // Confirmar deleção
  const confirmDelete = async () => {
    if (!selectedBusiness) return;

    setIsDeleting(true);
    try {
      const token = await fetch("/api/get-cookies?key=access_token").then((r) =>
        r.json()
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}management/businesses/${selectedBusiness.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        toaster.success({
          title: "Empresa deletada",
          description: `A empresa "${selectedBusiness.name}" foi deletada com sucesso.`,
        });
        setIsDeleteModalOpen(false);
        setSelectedBusiness(null);
        fetchBusinesses();
      } else {
        toaster.error({
          title: "Erro ao deletar",
          description: "Não foi possível deletar a empresa.",
        });
      }
    } catch (error) {
      console.error("Erro ao deletar empresa:", error);
      toaster.error({
        title: "Erro",
        description: "Ocorreu um erro ao deletar a empresa.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Abrir modal de alteração de status
  const openStatusModal = (business: IBusiness) => {
    setSelectedBusiness(business);
    setNewStatus(business.status);
    setIsStatusModalOpen(true);
  };

  // Confirmar alteração de status
  const confirmStatusChange = async () => {
    if (!selectedBusiness) return;

    setIsUpdatingStatus(true);
    try {
      const token = await fetch("/api/get-cookies?key=access_token").then((r) =>
        r.json()
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}management/businesses/${selectedBusiness.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        toaster.success({
          title: "Status atualizado",
          description: `Status da empresa "${selectedBusiness.name}" atualizado para ${translateStatus(newStatus)}.`,
        });
        setIsStatusModalOpen(false);
        setSelectedBusiness(null);
        fetchBusinesses();
      } else {
        toaster.error({
          title: "Erro ao atualizar status",
          description: "Não foi possível atualizar o status da empresa.",
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

  // Criar nova empresa
  const handleCreateBusiness = async () => {
    if (!newBusiness.cnpj || !newBusiness.name || !newBusiness.user_name || !newBusiness.user_email) {
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
        cnpj: newBusiness.cnpj.replace(/\D/g, ""), // Remove formatação do CNPJ
        name: newBusiness.name,
        user_name: newBusiness.user_name,
        user_email: newBusiness.user_email,
      };

      if (newBusiness.website) {
        body.website = newBusiness.website;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}management/businesses`,
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
          title: "Empresa criada!",
          description: `A empresa "${newBusiness.name}" foi criada com sucesso.`,
        });
        setIsCreateModalOpen(false);
        setNewBusiness({
          cnpj: "",
          name: "",
          website: "",
          user_name: "",
          user_email: "",
        });
        fetchBusinesses();
      } else {
        const error = await response.json();
        toaster.error({
          title: "Erro ao criar empresa",
          description: error.message?.[0] || "Não foi possível criar a empresa.",
        });
      }
    } catch (error: any) {
      console.error("Erro ao criar empresa:", error);
      toaster.error({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao criar a empresa.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Container maxW="container.xl">
      <Box>
        {/* Cabeçalho */}
        <Flex justify="flex-end" align="center" mb={6}>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
          >
            <FaPlus />
            Criar nova empresa
          </Button>
        </Flex>

        {/* Busca e filtros */}
        <Box
          p={4}
          bg="white"
          _dark={{ bg: "gray.800" }}
          borderRadius="lg"
          boxShadow="sm"
          mb={6}
        >
          <Flex gap={4} flexWrap="wrap" align="end">
            <Box flex="1" minW="250px">
              <InputGroup startAddon="Buscar">
                <Input
                  placeholder="Nome ou CNPJ..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                />
              </InputGroup>
            </Box>
            
            <Box minW="120px">
              <InputGroup startAddon="Código">
                <Input
                  type="number"
                  placeholder="Código..."
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                />
              </InputGroup>
            </Box>

            <Box minW="150px">
              <InputGroup startAddon="Status">
                <NativeSelect.Root>
                  <NativeSelect.Field
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">Todos</option>
                    {Object.values(BusinessStatus).map((status) => (
                      <option key={status} value={status}>
                        {translateStatus(status)}
                      </option>
                    ))}
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </InputGroup>
            </Box>

            <Button onClick={handleSearch} height="40px">
              <FaSearch />
              Buscar
            </Button>
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
          ) : businesses.length === 0 ? (
            <Box
              textAlign="center"
              py={12}
              border="1px dashed"
              borderColor="gray.300"
              borderRadius="md"
            >
              <Text fontSize="lg" color="gray.500" mb={2}>
                Nenhuma empresa encontrada
              </Text>
              <Text fontSize="sm" color="gray.400">
                {search
                  ? "Tente buscar com outros termos"
                  : "Crie a primeira empresa para começar"}
              </Text>
            </Box>
          ) : (
            <Box overflowX="auto" border="1px" borderColor="gray.200" borderRadius="md">
              <Table.Root variant="outline" size="sm">
                <Table.Header>
                  <Table.Row bg="gray.50" _dark={{ bg: "gray.800" }}>
                    <Table.ColumnHeader
                      cursor="pointer"
                      _hover={{ bg: "gray.100", _dark: { bg: "gray.700" } }}
                      onClick={() => handleSort("code")}
                    >
                      <Flex align="center" gap={2}>
                        Código
                        <MdSwapVert />
                      </Flex>
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      cursor="pointer"
                      onClick={() => handleSort("name")}
                      _hover={{ bg: "gray.100", _dark: { bg: "gray.700" } }}
                    >
                      <Flex align="center" gap={2}>
                        Nome
                        <MdSwapVert />
                      </Flex>
                    </Table.ColumnHeader>
                    <Table.ColumnHeader>CNPJ</Table.ColumnHeader>
                    <Table.ColumnHeader>Website</Table.ColumnHeader>
                    <Table.ColumnHeader
                      cursor="pointer"
                      onClick={() => handleSort("status")}
                      _hover={{ bg: "gray.100", _dark: { bg: "gray.700" } }}
                    >
                      <Flex align="center" gap={2}>
                        Status
                        <MdSwapVert />
                      </Flex>
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      cursor="pointer"
                      onClick={() => handleSort("created_at")}
                      _hover={{ bg: "gray.100", _dark: { bg: "gray.700" } }}
                    >
                      <Flex align="center" gap={2}>
                        Data de Criação
                        <MdSwapVert />
                      </Flex>
                    </Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="right">Ações</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {businesses.map((business) => (
                    <Table.Row
                      key={business.id}
                      _hover={{ bg: "gray.50", _dark: { bg: "gray.800" } }}
                    >
                      <Table.Cell fontWeight="medium">#{business.code}</Table.Cell>
                      <Table.Cell>{business.name}</Table.Cell>
                      <Table.Cell fontFamily="mono" fontSize="sm">
                        {formatCnpj(business.cnpj)}
                      </Table.Cell>
                      <Table.Cell>
                        {business.website ? (
                          <Flex align="center" gap={2}>
                            <a
                              href={business.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: "var(--chakra-colors-blue-500)",
                                textDecoration: "none",
                                fontSize: "14px",
                                maxWidth: "200px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                display: "inline-block",
                              }}
                            >
                              {business.website}
                            </a>
                            <FaExternalLinkAlt size={12} color="blue" />
                          </Flex>
                        ) : (
                          <Text color="gray.400" fontSize="sm">
                            -
                          </Text>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <Badge colorPalette={getStatusColorScheme(business.status)}>
                          {translateStatus(business.status)}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell fontSize="sm">
                        {formatDate(business.created_at)}
                      </Table.Cell>
                      <Table.Cell>
                        <Flex justify="right" gap={2}>
                          <Button
                            size="xs"
                            variant="ghost"
                            colorPalette="blue"
                            onClick={() =>
                              router.push(`/manage-system/businesses/edit?id=${business.id}`)
                            }
                            title="Editar"
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            colorPalette="orange"
                            onClick={() => openStatusModal(business)}
                            title="Alterar status"
                          >
                            <MdSwapVert />
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            colorPalette="red"
                            onClick={() => openDeleteModal(business)}
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
            </Box>
          )}
        </Box>



        {/* Modal de Criação */}
        <Dialog.Root
          open={isCreateModalOpen}
          onOpenChange={(e) => {
            if (!e.open) {
              setIsCreateModalOpen(false);
              setNewBusiness({
                cnpj: "",
                name: "",
                website: "",
                user_name: "",
                user_email: "",
              });
            }
          }}
        >
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>Criar Nova Empresa</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Box display="flex" flexDir="column" gap={4}>
                  <Box>
                    <Text fontSize="sm" mb={1} fontWeight="medium">
                      CNPJ <Text as="span" color="red.500">*</Text>
                    </Text>
                    <Input
                      placeholder="00.000.000/0000-00"
                      value={formatCnpj(newBusiness.cnpj)}
                      onChange={(e) =>
                        setNewBusiness({ ...newBusiness, cnpj: e.target.value })
                      }
                    />
                  </Box>
                  <Box>
                    <Text fontSize="sm" mb={1} fontWeight="medium">
                      Nome da Empresa <Text as="span" color="red.500">*</Text>
                    </Text>
                    <Input
                      placeholder="Nome da empresa"
                      value={newBusiness.name}
                      onChange={(e) =>
                        setNewBusiness({ ...newBusiness, name: e.target.value })
                      }
                    />
                  </Box>
                  <Box>
                    <Text fontSize="sm" mb={1} fontWeight="medium">
                      Website
                    </Text>
                    <Input
                      placeholder="https://exemplo.com.br"
                      value={newBusiness.website}
                      onChange={(e) =>
                        setNewBusiness({ ...newBusiness, website: e.target.value })
                      }
                    />
                  </Box>
                  <Box>
                    <Text fontSize="sm" mb={1} fontWeight="medium">
                      Nome do Usuário <Text as="span" color="red.500">*</Text>
                    </Text>
                    <Input
                      placeholder="Nome do usuário administrador"
                      value={newBusiness.user_name}
                      onChange={(e) =>
                        setNewBusiness({ ...newBusiness, user_name: e.target.value })
                      }
                    />
                  </Box>
                  <Box>
                    <Text fontSize="sm" mb={1} fontWeight="medium">
                      E-mail do Usuário <Text as="span" color="red.500">*</Text>
                    </Text>
                    <Input
                      type="email"
                      placeholder="email@exemplo.com"
                      value={newBusiness.user_email}
                      onChange={(e) =>
                        setNewBusiness({ ...newBusiness, user_email: e.target.value })
                      }
                    />
                  </Box>
                </Box>
              </Dialog.Body>
              <Dialog.Footer>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setNewBusiness({
                      cnpj: "",
                      name: "",
                      website: "",
                      user_name: "",
                      user_email: "",
                    });
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  colorPalette="blue"
                  onClick={handleCreateBusiness}
                  loading={isCreating}
                >
                  Criar Empresa
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
              setSelectedBusiness(null);
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
                  Tem certeza que deseja deletar a empresa{" "}
                  <strong>{selectedBusiness?.name}</strong>?
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
                    setSelectedBusiness(null);
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
              setSelectedBusiness(null);
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
                <Text mb={4}>
                  Alterar status da empresa <strong>{selectedBusiness?.name}</strong>:
                </Text>
                <Box>
                  <Text fontSize="sm" mb={2} fontWeight="medium">
                    Novo Status
                  </Text>
                  <NativeSelect.Root>
                    <NativeSelect.Field
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as BusinessStatus)}
                    >
                      {Object.values(BusinessStatus).map((status) => (
                        <option key={status} value={status}>
                          {translateStatus(status)}
                        </option>
                      ))}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                </Box>
              </Dialog.Body>
              <Dialog.Footer>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsStatusModalOpen(false);
                    setSelectedBusiness(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  colorPalette="blue"
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

export default function BusinessesPage() {
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
      <BusinessesPageContent />
    </Suspense>
  );
}
