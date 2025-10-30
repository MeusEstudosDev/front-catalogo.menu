"use client";

import { GoogleMap } from "@/components/account/GoogleMap";
import { toaster } from "@/components/ui/toaster";
import { Box, Button, Dialog, Input, Select, Text, createListCollection } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import { IBusinessAddress } from "./types";
import { formatCep, removeMask } from "./utils";

interface AddressesTabProps {
  businessId: string;
}

const addressTypeCollection = createListCollection({
  items: [
    { label: "Residencial", value: "RESIDENTIAL" },
    { label: "Comercial", value: "COMMERCIAL" },
    { label: "Outro", value: "OTHER" },
  ],
});

export function AddressesTab({ businessId }: AddressesTabProps) {
  // Lista e carregamento
  const [addresses, setAddresses] = useState<IBusinessAddress[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Submissão
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modais
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Estados de edição/deleção
  const [editingAddress, setEditingAddress] = useState<IBusinessAddress | null>(null);
  const [addressToDelete, setAddressToDelete] = useState<IBusinessAddress | null>(null);

  // Formulários
  const [newAddress, setNewAddress] = useState({
    type: "COMMERCIAL" as const,
    cep: "",
    city: "",
    state: "",
    district: "",
    street: "",
    number: "",
    complement: "",
    primary: false,
    latitude: null as number | null,
    longitude: null as number | null,
  });

  // Etapas e loaders auxiliares
  const [createAddressStep, setCreateAddressStep] = useState<1 | 2>(1);
  const [editAddressStep, setEditAddressStep] = useState<1 | 2>(1);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [isLoadingGeocode, setIsLoadingGeocode] = useState(false);
  const [cepError, setCepError] = useState<string>("");

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
    } catch (_e) {
      toaster.error({ title: "Erro ao carregar endereços", description: "Não foi possível carregar a lista." });
    } finally {
      setIsLoading(false);
    }
  };

  // ViaCEP
  const fetchCepData = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return null;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      if (data.erro) throw new Error("CEP não encontrado");
      return {
        street: data.logradouro || "",
        district: data.bairro || "",
        city: data.localidade || "",
        state: data.uf || "",
      };
    } catch (_e) {
      throw new Error("Erro ao buscar CEP");
    }
  };

  // Geocoding Google
  const getCoordinates = async (address: string) => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_GEOCODING_API_KEY;
      if (!apiKey) {
        console.error("Google API Key não configurada");
        return null;
      }
      const encoded = encodeURIComponent(address);
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${apiKey}`);
      const data = await res.json();
      if (data.status === "OK" && data.results?.length > 0) {
        const loc = data.results[0].geometry.location;
        return { latitude: loc.lat, longitude: loc.lng };
      }
      return null;
    } catch (e) {
      console.error("Erro ao obter coordenadas:", e);
      return null;
    }
  };

  // Buscar CEP e preencher campos
  const handleCepSearch = async (cep: string, isEditing = false) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    setIsLoadingCep(true);
    setCepError("");
    try {
      const cepData = await fetchCepData(cleanCep);
      if (cepData) {
        if (isEditing && editingAddress) {
          setEditingAddress({ ...editingAddress, ...cepData });
        } else {
          setNewAddress((prev) => ({ ...prev, ...cepData }));
        }
      }
    } catch (error: any) {
      setCepError(error.message);
      toaster.error({ title: "Erro ao buscar CEP", description: error.message });
    } finally {
      setIsLoadingCep(false);
    }
  };

  // Avançar para etapa do mapa com geocoding
  const handleNextToMapStep = async (isEditing = false) => {
    const current = isEditing && editingAddress ? editingAddress : newAddress;

    if (!current.street || !current.number || !current.district || !current.city || !current.state || !current.cep) {
      toaster.error({ title: "Campos obrigatórios", description: "Preencha todos os campos antes de continuar." });
      return;
    }

    const full = `${current.street}, ${current.number}, ${current.district}, ${current.city}, ${current.state}, Brasil`;

    setIsLoadingGeocode(true);
    try {
      const coords = await getCoordinates(full);
      if (coords) {
        if (isEditing && editingAddress) {
          setEditingAddress({ ...editingAddress, latitude: coords.latitude, longitude: coords.longitude });
          setEditAddressStep(2);
        } else {
          setNewAddress((prev) => ({ ...prev, latitude: coords.latitude, longitude: coords.longitude }));
          setCreateAddressStep(2);
        }
      } else {
        toaster.error({ title: "Erro ao obter localização", description: "Não foi possível obter as coordenadas." });
      }
    } catch (_e) {
      toaster.error({ title: "Erro ao obter localização", description: "Tente novamente." });
    } finally {
      setIsLoadingGeocode(false);
    }
  };

  // Criar
  const handleCreate = async () => {
    if (!newAddress.street.trim() || !newAddress.number.trim() || !newAddress.district.trim() || !newAddress.city.trim() || !newAddress.state.trim() || !newAddress.cep.trim()) {
      toaster.error({ title: "Campos obrigatórios", description: "Preencha todos os campos obrigatórios." });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await fetch("/api/get-cookies?key=access_token").then((r) => r.json());
      const body = {
        type: newAddress.type,
        cep: removeMask(newAddress.cep),
        city: newAddress.city,
        state: newAddress.state,
        district: newAddress.district,
        street: newAddress.street,
        number: newAddress.number,
        complement: newAddress.complement || undefined,
        primary: newAddress.primary,
        latitude: newAddress.latitude,
        longitude: newAddress.longitude,
      };
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}management/businesses/${businessId}/addresses`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        }
      );

      if (response.ok) {
        toaster.success({ title: "Endereço adicionado!", description: "Endereço foi adicionado com sucesso." });
        closeCreateModal();
        fetchAddresses();
      } else {
        const error = await response.json();
        throw new Error(error.message?.[0] || "Erro ao adicionar endereço");
      }
    } catch (error: any) {
      toaster.error({ title: "Erro ao adicionar endereço", description: error.message || "Não foi possível adicionar." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Atualizar
  const handleUpdate = async () => {
    if (!editingAddress) return;
    if (!editingAddress.street.trim() || !editingAddress.number.trim() || !editingAddress.district.trim() || !editingAddress.city.trim() || !editingAddress.state.trim() || !editingAddress.cep.trim()) {
      toaster.error({ title: "Campos obrigatórios", description: "Preencha todos os campos obrigatórios." });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await fetch("/api/get-cookies?key=access_token").then((r) => r.json());
      const body = {
        type: editingAddress.type,
        cep: removeMask(editingAddress.cep),
        city: editingAddress.city,
        state: editingAddress.state,
        district: editingAddress.district,
        street: editingAddress.street,
        number: editingAddress.number,
        complement: editingAddress.complement || undefined,
        primary: editingAddress.primary,
        latitude: editingAddress.latitude,
        longitude: editingAddress.longitude,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}management/businesses/${businessId}/addresses/${editingAddress.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        }
      );

      if (response.ok) {
        toaster.success({ title: "Endereço atualizado!", description: "Endereço foi atualizado com sucesso." });
        closeEditModal();
        fetchAddresses();
      } else {
        const error = await response.json();
        throw new Error(error.message?.[0] || "Erro ao atualizar endereço");
      }
    } catch (error: any) {
      toaster.error({ title: "Erro ao atualizar endereço", description: error.message || "Não foi possível atualizar." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remover
  const handleDelete = async () => {
    if (!addressToDelete) return;
    setIsSubmitting(true);
    try {
      const token = await fetch("/api/get-cookies?key=access_token").then((r) => r.json());
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}management/businesses/${businessId}/addresses/${addressToDelete.id}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.ok) {
        toaster.success({ title: "Endereço removido!", description: "Endereço foi removido com sucesso." });
        setIsDeleteModalOpen(false);
        setAddressToDelete(null);
        fetchAddresses();
      } else {
        const error = await response.json();
        throw new Error(error.message?.[0] || "Erro ao remover endereço");
      }
    } catch (error: any) {
      toaster.error({ title: "Erro ao remover endereço", description: error.message || "Não foi possível remover." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Abertura/fechamento de modais
  const openCreateModal = () => {
    setNewAddress({
      type: "COMMERCIAL",
      cep: "",
      city: "",
      state: "",
      district: "",
      street: "",
      number: "",
      complement: "",
      primary: false,
      latitude: null,
      longitude: null,
    });
    setCepError("");
    setCreateAddressStep(1);
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setCreateAddressStep(1);
    setNewAddress({
      type: "COMMERCIAL",
      cep: "",
      city: "",
      state: "",
      district: "",
      street: "",
      number: "",
      complement: "",
      primary: false,
      latitude: null,
      longitude: null,
    });
    setCepError("");
  };

  const openEditModal = (address: IBusinessAddress) => {
    setEditingAddress(address);
    setCepError("");
    setEditAddressStep(1);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditAddressStep(1);
    setEditingAddress(null);
    setCepError("");
  };

  const openDeleteModal = (address: IBusinessAddress) => {
    setAddressToDelete(address);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setAddressToDelete(null);
  };

  return (
    <Box display="flex" flexDir="column" gap={4} w="100%" px={{ base: 4, md: 0 }}>
      <Box display="flex" justifyContent="flex-end" alignItems="center">
        {
          addresses.length !== 0 && (
            <Button onClick={openCreateModal}>
              <FaPlus />
              Adicionar Endereço
            </Button>
          )
        }
      </Box>

      {isLoading ? (
        <Text>Carregando endereços...</Text>
      ) : addresses.length === 0 ? (
        <Box
            textAlign="center"
            py={8}
            border="1px dashed"
            borderColor="gray.300"
            borderRadius="md"
        >
          <Text color="gray.500">
            Nenhum endereço cadastrado.
          </Text>
          <Text fontSize="sm" color="gray.400" mb={4}>
            Adicione seu primeiro endereço para começar
          </Text>
          <Button onClick={openCreateModal}>
            Adicionar Primeiro Endereço
          </Button>
        </Box>
      ) : (
        <Box display="grid" gridTemplateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={4}>
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
                  {address.complement && (
                    <Text fontSize="sm" color="gray.600" mb={1}>
                      {address.complement}
                    </Text>
                  )}
                  <Text fontSize="sm" color="gray.600">{address.district}</Text>
                  <Text fontSize="sm" color="gray.600">{address.city} - {address.state}</Text>
                  <Text fontSize="sm" color="gray.600">CEP: {formatCep(address.cep)}</Text>
                  {address.latitude && address.longitude && (
                    <Text fontSize="xs" color="blue.500" mt={1}>
                      📍 {address.latitude.toFixed(6)}, {address.longitude.toFixed(6)}
                    </Text>
                  )}
                </Box>

                <Box display="flex" gap={2} mt={3}>
                  <Button
                    size="sm"
                    variant="outline"
                    flex="1"
                    onClick={() => openEditModal(address)}
                  >
                    <FaEdit />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    colorPalette="red"
                    onClick={() => openDeleteModal(address)}
                  >
                    <FaTrash />
                  </Button>
                </Box>
              </Box>
            ))}
        </Box>
      )}

      {/* Modal Criar Endereço (2 etapas) */}
      <Dialog.Root
        open={isCreateModalOpen}
        onOpenChange={(e) => {
          if (!e.open) closeCreateModal();
        }}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="700px">
            <Dialog.Header>
              <Dialog.Title>Adicionar Endereço - Etapa {createAddressStep} de 2</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              {createAddressStep === 1 ? (
                <Box display="flex" flexDir="column" gap={4}>
                  <Box>
                    <Text fontSize="sm" mb={1}>Tipo</Text>
                    <Select.Root
                      value={[newAddress.type]}
                      onValueChange={(e) => setNewAddress((p) => ({ ...p, type: e.value[0] as any }))}
                      size="sm"
                      collection={addressTypeCollection}
                      positioning={{ sameWidth: true }}
                    >
                      <Select.HiddenSelect />
                      <Select.Control>
                        <Select.Trigger>
                          <Select.ValueText placeholder="Selecione o tipo" />
                          <Select.IndicatorGroup>
                            <Select.Indicator />
                          </Select.IndicatorGroup>
                        </Select.Trigger>
                      </Select.Control>
                      <Select.Positioner zIndex={2000}>
                        <Select.Content>
                          {addressTypeCollection.items.map((item) => (
                            <Select.Item key={item.value} item={item}>
                              <Select.ItemText>{item.label}</Select.ItemText>
                              <Select.ItemIndicator />
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Positioner>
                    </Select.Root>
                  </Box>

                  <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                    <Box>
                      <Text fontSize="sm" mb={1}>CEP</Text>
                      <Input
                        placeholder="00000-000"
                        value={formatCep(newAddress.cep)}
                        onChange={(e) => setNewAddress((p) => ({ ...p, cep: e.target.value }))}
                        onBlur={(e) => handleCepSearch(e.target.value)}
                        maxLength={9}
                      />
                      {cepError && (
                        <Text color="red.600" fontSize="xs" mt={1}>{cepError}</Text>
                      )}
                    </Box>
                    <Box>
                      <Text fontSize="sm" mb={1}>Estado</Text>
                      <Input
                        placeholder="SP"
                        value={newAddress.state}
                        onChange={(e) => setNewAddress((p) => ({ ...p, state: e.target.value.toUpperCase() }))}
                        disabled={isLoadingCep}
                        maxLength={2}
                      />
                    </Box>
                  </Box>

                  <Box>
                    <Text fontSize="sm" mb={1}>Cidade</Text>
                    <Input
                      placeholder="São Paulo"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress((p) => ({ ...p, city: e.target.value }))}
                      disabled={isLoadingCep}
                    />
                  </Box>

                  <Box>
                    <Text fontSize="sm" mb={1}>Bairro</Text>
                    <Input
                      placeholder="Centro"
                      value={newAddress.district}
                      onChange={(e) => setNewAddress((p) => ({ ...p, district: e.target.value }))}
                      disabled={isLoadingCep}
                    />
                  </Box>

                  <Box display="grid" gridTemplateColumns="3fr 1fr" gap={2}>
                    <Box>
                      <Text fontSize="sm" mb={1}>Rua</Text>
                      <Input
                        placeholder="Rua Principal"
                        value={newAddress.street}
                        onChange={(e) => setNewAddress((p) => ({ ...p, street: e.target.value }))}
                        disabled={isLoadingCep}
                      />
                    </Box>
                    <Box>
                      <Text fontSize="sm" mb={1}>Número</Text>
                      <Input
                        placeholder="123"
                        value={newAddress.number}
                        onChange={(e) => setNewAddress((p) => ({ ...p, number: e.target.value }))}
                        disabled={isLoadingCep}
                      />
                    </Box>
                  </Box>

                  <Box>
                    <Text fontSize="sm" mb={1}>Complemento</Text>
                    <Input
                      placeholder="Apartamento, bloco, etc."
                      value={newAddress.complement}
                      onChange={(e) => setNewAddress((p) => ({ ...p, complement: e.target.value }))}
                      disabled={isLoadingCep}
                    />
                  </Box>

                  <Box>
                    <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={newAddress.primary}
                        onChange={(e) => setNewAddress((p) => ({ ...p, primary: e.target.checked }))}
                      />
                      <Text fontSize="sm">Definir como principal</Text>
                    </label>
                  </Box>
                </Box>
              ) : (
                <Box display="flex" flexDir="column" gap={4}>
                  <Text fontSize="sm" fontWeight="semibold">Confirme a Localização no Mapa</Text>
                  <Text fontSize="xs" color="gray.600">Clique ou arraste o marcador para ajustar a localização exata do endereço</Text>
                  {newAddress.latitude && newAddress.longitude && (
                    <>
                      <GoogleMap
                        latitude={newAddress.latitude}
                        longitude={newAddress.longitude}
                        onLocationChange={(lat, lng) => setNewAddress((p) => ({ ...p, latitude: lat, longitude: lng }))}
                        height="400px"
                      />
                      <Box
                        p={3}
                        borderRadius="md"
                        border="1px dashed"
                        borderColor="gray.200"
                      >
                        <Text fontSize="xs" fontWeight="semibold" mb={1}>
                          Endereço:
                        </Text>
                        <Text fontSize="sm">
                          {newAddress.street}, {newAddress.number}
                          {newAddress.complement &&
                            ` - ${newAddress.complement}`}
                        </Text>
                        <Text fontSize="sm">
                          {newAddress.district} - {newAddress.city}/
                          {newAddress.state}
                        </Text>
                        <Text fontSize="sm">CEP: {formatCep(newAddress.cep)}</Text>
                        <Text fontSize="xs" color="gray.500" mt={2}>
                          Coordenadas: {newAddress.latitude.toFixed(6)},{" "}
                          {newAddress.longitude.toFixed(6)}
                        </Text>
                      </Box>
                    </>
                  )}
                </Box>
              )}
            </Dialog.Body>
            <Dialog.Footer>
              {createAddressStep === 1 ? (
                <>
                  <Button variant="outline" onClick={closeCreateModal}>Cancelar</Button>
                  <Button onClick={() => handleNextToMapStep(false)} loading={isLoadingGeocode}>
                    Continuar
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setCreateAddressStep(1)}>Voltar</Button>
                  <Button onClick={handleCreate} loading={isSubmitting}>
                    Salvar Endereço
                  </Button>
                </>
              )}
            </Dialog.Footer>
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Modal Editar Endereço (2 etapas) */}
      <Dialog.Root
        open={isEditModalOpen}
        onOpenChange={(e) => {
          if (!e.open) closeEditModal();
        }}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="700px">
            <Dialog.Header>
              <Dialog.Title>Editar Endereço - Etapa {editAddressStep} de 2</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              {editAddressStep === 1 ? (
                editingAddress && (
                  <Box display="flex" flexDir="column" gap={4}>
                    <Box>
                      <Text fontSize="sm" mb={1}>Tipo</Text>
                      <Select.Root
                        value={[editingAddress.type]}
                        onValueChange={(e) => setEditingAddress((prev) => prev ? { ...prev, type: e.value[0] as any } : null)}
                        size="sm"
                        collection={addressTypeCollection}
                        positioning={{ sameWidth: true }}
                      >
                        <Select.HiddenSelect />
                        <Select.Control>
                          <Select.Trigger>
                            <Select.ValueText placeholder="Selecione o tipo" />
                            <Select.IndicatorGroup>
                              <Select.Indicator />
                            </Select.IndicatorGroup>
                          </Select.Trigger>
                        </Select.Control>
                        <Select.Positioner zIndex={2000}>
                          <Select.Content>
                            {addressTypeCollection.items.map((item) => (
                              <Select.Item key={item.value} item={item}>
                                <Select.ItemText>{item.label}</Select.ItemText>
                                <Select.ItemIndicator />
                              </Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Positioner>
                      </Select.Root>
                    </Box>

                    <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                      <Box>
                        <Text fontSize="sm" mb={1}>CEP</Text>
                        <Input
                          placeholder="00000-000"
                          value={formatCep(editingAddress.cep)}
                          onChange={(e) => setEditingAddress((prev) => prev ? { ...prev, cep: e.target.value } : null)}
                          onBlur={(e) => handleCepSearch(e.target.value, true)}
                          maxLength={9}
                        />
                        {cepError && (
                          <Text color="red.600" fontSize="xs" mt={1}>{cepError}</Text>
                        )}
                      </Box>
                      <Box>
                        <Text fontSize="sm" mb={1}>Estado</Text>
                        <Input
                          placeholder="SP"
                          value={editingAddress.state}
                          onChange={(e) => setEditingAddress((prev) => prev ? { ...prev, state: e.target.value.toUpperCase() } : null)}
                          disabled={isLoadingCep}
                          maxLength={2}
                        />
                      </Box>
                    </Box>

                    <Box>
                      <Text fontSize="sm" mb={1}>Cidade</Text>
                      <Input
                        placeholder="São Paulo"
                        value={editingAddress.city}
                        onChange={(e) => setEditingAddress((prev) => prev ? { ...prev, city: e.target.value } : null)}
                        disabled={isLoadingCep}
                      />
                    </Box>

                    <Box>
                      <Text fontSize="sm" mb={1}>Bairro</Text>
                      <Input
                        placeholder="Centro"
                        value={editingAddress.district}
                        onChange={(e) => setEditingAddress((prev) => prev ? { ...prev, district: e.target.value } : null)}
                        disabled={isLoadingCep}
                      />
                    </Box>

                    <Box display="grid" gridTemplateColumns="3fr 1fr" gap={2}>
                      <Box>
                        <Text fontSize="sm" mb={1}>Rua</Text>
                        <Input
                          placeholder="Rua Principal"
                          value={editingAddress.street}
                          onChange={(e) => setEditingAddress((prev) => prev ? { ...prev, street: e.target.value } : null)}
                          disabled={isLoadingCep}
                        />
                      </Box>
                      <Box>
                        <Text fontSize="sm" mb={1}>Número</Text>
                        <Input
                          placeholder="123"
                          value={editingAddress.number}
                          onChange={(e) => setEditingAddress((prev) => prev ? { ...prev, number: e.target.value } : null)}
                          disabled={isLoadingCep}
                        />
                      </Box>
                    </Box>

                    <Box>
                      <Text fontSize="sm" mb={1}>Complemento</Text>
                      <Input
                        placeholder="Apartamento, bloco, etc."
                        value={editingAddress.complement || ""}
                        onChange={(e) => setEditingAddress((prev) => prev ? { ...prev, complement: e.target.value } : null)}
                        disabled={isLoadingCep}
                      />
                    </Box>

                    <Box>
                      <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <input
                          type="checkbox"
                          checked={!!editingAddress.primary}
                          onChange={(e) => setEditingAddress((prev) => prev ? { ...prev, primary: e.target.checked } : null)}
                        />
                        <Text fontSize="sm">Definir como principal</Text>
                      </label>
                    </Box>
                  </Box>
                )
              ) : (
                editingAddress && (
                  <Box display="flex" flexDir="column" gap={4}>
                    <Text fontSize="sm" fontWeight="semibold">Confirme a Localização no Mapa</Text>
                    <Text fontSize="xs" color="gray.600">Clique ou arraste o marcador para ajustar a localização exata do endereço</Text>
                    {typeof editingAddress.latitude === "number" && typeof editingAddress.longitude === "number" && (
                      <>
                        <GoogleMap
                          latitude={editingAddress.latitude}
                          longitude={editingAddress.longitude}
                          onLocationChange={(lat, lng) => setEditingAddress((prev) => prev ? { ...prev, latitude: lat, longitude: lng } : null)}
                          height="400px"
                        />
                        <Box
                          p={3}
                          borderRadius="md"
                          border="1px dashed"
                          borderColor="gray.200"
                        >
                          <Text fontSize="xs" fontWeight="semibold" mb={1}>
                            Endereço:
                          </Text>
                          <Text fontSize="sm">
                            {editingAddress.street}, {editingAddress.number}
                            {editingAddress.complement &&
                              ` - ${editingAddress.complement}`}
                          </Text>
                          <Text fontSize="sm">
                            {editingAddress.district} - {editingAddress.city}/
                            {editingAddress.state}
                          </Text>
                          <Text fontSize="sm">CEP: {formatCep(editingAddress.cep)}</Text>
                          <Text fontSize="xs" color="gray.500" mt={2}>
                            Coordenadas: {editingAddress.latitude.toFixed(6)},{" "}
                            {editingAddress.longitude.toFixed(6)}
                          </Text>
                        </Box>
                      </>
                    )}
                  </Box>
                )
              )}
            </Dialog.Body>
            <Dialog.Footer>
              {editAddressStep === 1 ? (
                <>
                  <Button variant="outline" onClick={closeEditModal}>Cancelar</Button>
                  <Button onClick={() => handleNextToMapStep(true)} loading={isLoadingGeocode}>
                    Continuar
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setEditAddressStep(1)}>Voltar</Button>
                  <Button onClick={handleUpdate} loading={isSubmitting}>
                    Salvar Alterações
                  </Button>
                </>
              )}
            </Dialog.Footer>
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Modal Remover */}
      <Dialog.Root
        open={isDeleteModalOpen}
        onOpenChange={(e) => {
          if (!e.open) closeDeleteModal();
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
              {addressToDelete && (
                <Box mt={3} p={3} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
                  <Text fontSize="sm" fontWeight="bold">{addressToDelete.street}, {addressToDelete.number}</Text>
                  <Text fontSize="sm" color="gray.600">{addressToDelete.district} - {addressToDelete.city}/{addressToDelete.state}</Text>
                </Box>
              )}
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={closeDeleteModal}>Cancelar</Button>
              <Button colorPalette="red" onClick={handleDelete} loading={isSubmitting}>Remover</Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Box>
  );
}
