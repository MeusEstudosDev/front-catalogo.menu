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
  Heading,
  Input,
  InputGroup,
  Spinner,
  Table,
  Text,
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
  const [selectedBusiness, setSelectedBusiness] = useState<IBusiness | null>(null);
  const [newStatus, setNewStatus] = useState<BusinessStatus>(BusinessStatus.ACTIVE);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

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

  return (
    <Container maxW="container.xl" py={8}>
      <Box>
        {/* Cabeçalho */}
        <Flex justify="space-between" align="center" mb={6}>
          <Box>
            <Heading as="h1" size="xl" mb={2}>
              Empresas Cadastradas
            </Heading>
            <Text color="gray.600" _dark={{ color: "gray.400" }}>
              Gerencie todas as empresas cadastradas no sistema
            </Text>
          </Box>
          <Button
            colorPalette="blue"
            onClick={() => router.push("/manage-system/businesses/create")}
          >
            <FaPlus />
            Criar nova empresa
          </Button>
        </Flex>

        {/* Busca e filtros */}
        <Flex gap={4} mb={6} flexWrap="wrap" align="end">
          <Box flex="1" minW="250px">
            <Text fontSize="sm" mb={1} fontWeight="medium">
              Buscar
            </Text>
            <InputGroup>
              <Input
                placeholder="Nome ou CNPJ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
            </InputGroup>
          </Box>
          
          <Box minW="120px">
            <Text fontSize="sm" mb={1} fontWeight="medium">
              Código
            </Text>
            <Input
              type="number"
              placeholder="Código..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
          </Box>

          <Box minW="150px">
            <Text fontSize="sm" mb={1} fontWeight="medium">
              Status
            </Text>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                width: "100%",
                height: "40px",
                padding: "0 12px",
                border: "1px solid var(--chakra-colors-border)",
                borderRadius: "6px",
                backgroundColor: "transparent",
                color: "inherit",
                fontSize: "14px",
                outline: "none",
              }}
            >
              <option value="">Todos</option>
              {Object.values(BusinessStatus).map((status) => (
                <option key={status} value={status}>
                  {translateStatus(status)}
                </option>
              ))}
            </select>
          </Box>

          <Button colorPalette="blue" onClick={handleSearch} height="40px">
            <FaSearch />
            Buscar
          </Button>

          <Box minW="150px">
            <Text fontSize="sm" mb={1} fontWeight="medium">
              Itens por página
            </Text>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPageNumber(1);
              }}
              style={{
                width: "100%",
                height: "40px",
                padding: "0 12px",
                border: "1px solid var(--chakra-colors-border)",
                borderRadius: "6px",
                backgroundColor: "transparent",
                color: "inherit",
                fontSize: "14px",
                outline: "none",
              }}
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </Box>
        </Flex>

        {/* Tabela */}
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
                    onClick={() => handleSort("code")}
                    _hover={{ bg: "gray.100", _dark: { bg: "gray.700" } }}
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
                  <Table.ColumnHeader textAlign="center">Ações</Table.ColumnHeader>
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
                      <Flex justify="center" gap={2}>
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
          </Box>
        )}

        {/* Paginação */}
        {!isLoading && businesses.length > 0 && (
          <Flex justify="space-between" align="center" mt={6} flexWrap="wrap" gap={4}>
            <Text fontSize="sm" color="gray.600">
              Mostrando {(pageNumber - 1) * pageSize + 1} -{" "}
              {Math.min(pageNumber * pageSize, total)} de {total} empresas
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
              <Flex gap={1} align="center">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      size="sm"
                      variant={pageNumber === page ? "solid" : "ghost"}
                      colorPalette={pageNumber === page ? "blue" : "gray"}
                      onClick={() => setPageNumber(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
                {totalPages > 5 && <Text px={2}>...</Text>}
              </Flex>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPageNumber(pageNumber + 1)}
                disabled={pageNumber === totalPages}
              >
                Próxima
              </Button>
            </Flex>
          </Flex>
        )}

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
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as BusinessStatus)}
                    style={{
                      width: "100%",
                      height: "40px",
                      padding: "0 12px",
                      border: "1px solid var(--chakra-colors-border)",
                      borderRadius: "6px",
                      backgroundColor: "transparent",
                      color: "inherit",
                      fontSize: "14px",
                      outline: "none",
                    }}
                  >
                    {Object.values(BusinessStatus).map((status) => (
                      <option key={status} value={status}>
                        {translateStatus(status)}
                      </option>
                    ))}
                  </select>
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
