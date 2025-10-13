"use client";

import { toaster } from "@/components/ui/toaster";
import { Box, Button, Dialog, Input, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import { IBusinessAddress } from "./types";
import { formatCep, removeMask } from "./utils";

interface AddressesTabProps {
  businessId: string;
}

export function AddressesTab({ businessId }: AddressesTabProps) {
  const [addresses, setAddresses] = useState<IBusinessAddress[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<IBusinessAddress | null>(null);
  const [addressToDelete, setAddressToDelete] = useState<IBusinessAddress | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newAddress, setNewAddress] = useState({
    type: "COMMERCIAL" as const,
    cep: "",
    city: "",
    state: "",
    district: "",
    street: "",
    number: "",
    complement: "",
  });

  useEffect(() => {
    fetchAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  const fetchAddresses = async () => {
    setIsLoading(true);
    try {
      const token = await fetch("/api/get-cookies?key=access_token").then((r) => r.json());
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}management/businesses/${businessId}/addresses`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setAddresses(data);
      }
    } catch (error) {
      console.error("Erro ao carregar endereços:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    setIsSubmitting(true);
    try {
      const token = await fetch("/api/get-cookies?key=access_token").then((r) => r.json());
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}management/businesses/${businessId}/addresses`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...newAddress,
            cep: removeMask(newAddress.cep),
          }),
        }
      );

      if (response.ok) {
        toaster.success({ title: "Endereço adicionado", description: "Endereço adicionado com sucesso." });
        setIsCreateModalOpen(false);
        setNewAddress({
          type: "COMMERCIAL",
          cep: "",
          city: "",
          state: "",
          district: "",
          street: "",
          number: "",
          complement: "",
        });
        fetchAddresses();
      } else {
        toaster.error({ title: "Erro", description: "Não foi possível adicionar o endereço." });
      }
    } catch (error) {
      toaster.error({ title: "Erro", description: "Ocorreu um erro ao adicionar o endereço." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingAddress) return;
    setIsSubmitting(true);
    try {
      const token = await fetch("/api/get-cookies?key=access_token").then((r) => r.json());
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}management/businesses/${businessId}/addresses/${editingAddress.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type: editingAddress.type,
            cep: removeMask(editingAddress.cep),
            city: editingAddress.city,
            state: editingAddress.state,
            district: editingAddress.district,
            street: editingAddress.street,
            number: editingAddress.number,
            complement: editingAddress.complement,
            primary: editingAddress.primary,
          }),
        }
      );

      if (response.ok) {
        toaster.success({ title: "Endereço atualizado", description: "Endereço atualizado com sucesso." });
        setIsEditModalOpen(false);
        setEditingAddress(null);
        fetchAddresses();
      } else {
        toaster.error({ title: "Erro", description: "Não foi possível atualizar o endereço." });
      }
    } catch (error) {
      toaster.error({ title: "Erro", description: "Ocorreu um erro ao atualizar o endereço." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!addressToDelete) return;
    setIsSubmitting(true);
    try {
      const token = await fetch("/api/get-cookies?key=access_token").then((r) => r.json());
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}management/businesses/${businessId}/addresses/${addressToDelete.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        toaster.success({ title: "Endereço removido", description: "Endereço removido com sucesso." });
        setIsDeleteModalOpen(false);
        setAddressToDelete(null);
        fetchAddresses();
      } else {
        toaster.error({ title: "Erro", description: "Não foi possível remover o endereço." });
      }
    } catch (error) {
      toaster.error({ title: "Erro", description: "Ocorreu um erro ao remover o endereço." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box display="flex" flexDir="column" gap={4} w="100%" px={{ base: 4, md: 0 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Text fontSize="xl" fontWeight="bold">
          Endereços da Empresa
        </Text>
        <Button onClick={() => setIsCreateModalOpen(true)} colorPalette="blue" size="sm">
          <FaPlus />
          Adicionar Endereço
        </Button>
      </Box>

      {isLoading ? (
        <Text>Carregando endereços...</Text>
      ) : addresses.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Text color="gray.500">Nenhum endereço cadastrado.</Text>
          <Button onClick={() => setIsCreateModalOpen(true)} colorPalette="blue" size="sm" mt={4}>
            Adicionar Primeiro Endereço
          </Button>
        </Box>
      ) : (
        <Box
          display="grid"
          gridTemplateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }}
          gap={4}
        >
          {addresses
            .sort((a, b) => (a.primary && !b.primary ? -1 : 1))
            .map((address) => (
              <Box
                key={address.id}
                p={4}
                border="1px solid"
                borderColor="gray.200"
                borderRadius="lg"
                bg="white"
                boxShadow="sm"
                _hover={{ boxShadow: "md" }}
                transition="box-shadow 0.2s"
                position="relative"
                minH="200px"
                display="flex"
                flexDirection="column"
              >
                {address.primary && (
                  <Box
                    bg="green.600"
                    color="white"
                    px={2}
                    py={1}
                    borderRadius="md"
                    fontSize="xs"
                    fontWeight="bold"
                    textAlign="center"
                    mb={3}
                    w="fit-content"
                    position="absolute"
                    top={4}
                    right={4}
                  >
                    PRINCIPAL
                  </Box>
                )}

                <Box flex="1">
                  <Text fontWeight="semibold" fontSize="sm" mb={2}>
                    {address.street}, {address.number}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    {address.district}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    {address.city} - {address.state}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    CEP: {formatCep(address.cep)}
                  </Text>
                  <Text fontSize="xs" color="gray.500" mt={2}>
                    {address.type === "RESIDENTIAL"
                      ? "Residencial"
                      : address.type === "COMMERCIAL"
                      ? "Comercial"
                      : "Outro"}
                  </Text>
                </Box>

                <Box display="flex" gap={2} mt={3}>
                  <Button
                    size="sm"
                    variant="outline"
                    colorPalette="blue"
                    flex="1"
                    onClick={() => {
                      setEditingAddress(address);
                      setIsEditModalOpen(true);
                    }}
                  >
                    <FaEdit />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    colorPalette="red"
                    onClick={() => {
                      setAddressToDelete(address);
                      setIsDeleteModalOpen(true);
                    }}
                  >
                    <FaTrash />
                  </Button>
                </Box>
              </Box>
            ))}
        </Box>
      )}

      {/* Modal Criar - Simplificado para o exemplo */}
      <Dialog.Root open={isCreateModalOpen} onOpenChange={(e) => !e.open && setIsCreateModalOpen(false)}>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="600px">
            <Dialog.Header>
              <Dialog.Title>Adicionar Endereço</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Box display="flex" flexDir="column" gap={3}>
                <Box>
                  <Text fontSize="sm" mb={1}>Tipo</Text>
                  <select
                    value={newAddress.type}
                    onChange={(e) => setNewAddress({ ...newAddress, type: e.target.value as any })}
                    style={{
                      width: "100%",
                      height: "40px",
                      padding: "0 12px",
                      border: "1px solid var(--chakra-colors-border)",
                      borderRadius: "6px",
                    }}
                  >
                    <option value="RESIDENTIAL">Residencial</option>
                    <option value="COMMERCIAL">Comercial</option>
                    <option value="OTHER">Outro</option>
                  </select>
                </Box>
                <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                  <Box>
                    <Text fontSize="sm" mb={1}>CEP</Text>
                    <Input
                      placeholder="00000-000"
                      value={formatCep(newAddress.cep)}
                      onChange={(e) => setNewAddress({ ...newAddress, cep: e.target.value })}
                    />
                  </Box>
                  <Box>
                    <Text fontSize="sm" mb={1}>Estado</Text>
                    <Input
                      placeholder="SP"
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value.toUpperCase() })}
                      maxLength={2}
                    />
                  </Box>
                </Box>
                <Box>
                  <Text fontSize="sm" mb={1}>Cidade</Text>
                  <Input
                    placeholder="São Paulo"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                  />
                </Box>
                <Box>
                  <Text fontSize="sm" mb={1}>Bairro</Text>
                  <Input
                    placeholder="Centro"
                    value={newAddress.district}
                    onChange={(e) => setNewAddress({ ...newAddress, district: e.target.value })}
                  />
                </Box>
                <Box display="grid" gridTemplateColumns="3fr 1fr" gap={2}>
                  <Box>
                    <Text fontSize="sm" mb={1}>Rua</Text>
                    <Input
                      placeholder="Rua Principal"
                      value={newAddress.street}
                      onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                    />
                  </Box>
                  <Box>
                    <Text fontSize="sm" mb={1}>Número</Text>
                    <Input
                      placeholder="123"
                      value={newAddress.number}
                      onChange={(e) => setNewAddress({ ...newAddress, number: e.target.value })}
                    />
                  </Box>
                </Box>
                <Box>
                  <Text fontSize="sm" mb={1}>Complemento</Text>
                  <Input
                    placeholder="Sala 10"
                    value={newAddress.complement}
                    onChange={(e) => setNewAddress({ ...newAddress, complement: e.target.value })}
                  />
                </Box>
              </Box>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancelar
              </Button>
              <Button colorPalette="blue" onClick={handleCreate} loading={isSubmitting}>
                Adicionar
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Modal Editar - Similar ao criar */}
      <Dialog.Root
        open={isEditModalOpen}
        onOpenChange={(e) => {
          if (!e.open) {
            setIsEditModalOpen(false);
            setEditingAddress(null);
          }
        }}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="600px">
            <Dialog.Header>
              <Dialog.Title>Editar Endereço</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              {editingAddress && (
                <Box display="flex" flexDir="column" gap={3}>
                  <Box>
                    <Text fontSize="sm" mb={1}>Rua</Text>
                    <Input
                      value={editingAddress.street}
                      onChange={(e) => setEditingAddress({ ...editingAddress, street: e.target.value })}
                    />
                  </Box>
                  <Box>
                    <Text fontSize="sm" mb={1}>Número</Text>
                    <Input
                      value={editingAddress.number}
                      onChange={(e) => setEditingAddress({ ...editingAddress, number: e.target.value })}
                    />
                  </Box>
                  <Box>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <input
                        type="checkbox"
                        checked={editingAddress.primary}
                        onChange={(e) => setEditingAddress({ ...editingAddress, primary: e.target.checked })}
                      />
                      <Text fontSize="sm">Definir como principal</Text>
                    </label>
                  </Box>
                </Box>
              )}
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={() => { setIsEditModalOpen(false); setEditingAddress(null); }}>
                Cancelar
              </Button>
              <Button colorPalette="blue" onClick={handleUpdate} loading={isSubmitting}>
                Salvar
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Modal Deletar */}
      <Dialog.Root
        open={isDeleteModalOpen}
        onOpenChange={(e) => {
          if (!e.open) {
            setIsDeleteModalOpen(false);
            setAddressToDelete(null);
          }
        }}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Remover Endereço</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Text>Tem certeza que deseja remover este endereço?</Text>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={() => { setIsDeleteModalOpen(false); setAddressToDelete(null); }}>
                Cancelar
              </Button>
              <Button colorPalette="red" onClick={handleDelete} loading={isSubmitting}>
                Remover
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Box>
  );
}
