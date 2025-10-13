"use client";

import { toaster } from "@/components/ui/toaster";
import { Box, Button, Dialog, Input, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { FaCheckCircle, FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import { GoAlert } from "react-icons/go";
import countries from "world-countries";
import { IBusinessPhone } from "./types";
import { formatPhone, removeMask } from "./utils";

interface PhonesTabProps {
  businessId: string;
}

export function PhonesTab({ businessId }: PhonesTabProps) {
  const [phones, setPhones] = useState<IBusinessPhone[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingPhone, setEditingPhone] = useState<IBusinessPhone | null>(null);
  const [phoneToDelete, setPhoneToDelete] = useState<IBusinessPhone | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newPhone, setNewPhone] = useState({
    type: "COMMERCIAL" as const,
    country_code: "+55",
    number: "",
  });

  const countryOptions = countries
    .filter((country) => country.idd && country.idd.root)
    .map((country) => ({
      code: country.cca2,
      name: country.name.common,
      dialCode: country.idd.root + (country.idd.suffixes?.[0] || ""),
      flag: country.flag,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const brazilIndex = countryOptions.findIndex((c) => c.code === "BR");
  if (brazilIndex > 0) {
    const brazil = countryOptions.splice(brazilIndex, 1)[0];
    countryOptions.unshift(brazil);
  }

  useEffect(() => {
    fetchPhones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  const fetchPhones = async () => {
    setIsLoading(true);
    try {
      const token = await fetch("/api/get-cookies?key=access_token").then((r) =>
        r.json()
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}management/businesses/${businessId}/phones`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPhones(data);
      }
    } catch (error) {
      console.error("Erro ao carregar telefones:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newPhone.number) {
      toaster.error({
        title: "Campos obrigatórios",
        description: "Digite um número de telefone.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await fetch("/api/get-cookies?key=access_token").then((r) =>
        r.json()
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}management/businesses/${businessId}/phones`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type: newPhone.type,
            country_code: newPhone.country_code,
            number: removeMask(newPhone.number),
          }),
        }
      );

      if (response.ok) {
        toaster.success({
          title: "Telefone adicionado",
          description: "Telefone adicionado com sucesso.",
        });
        setIsCreateModalOpen(false);
        setNewPhone({ type: "COMMERCIAL", country_code: "+55", number: "" });
        fetchPhones();
      } else {
        toaster.error({
          title: "Erro",
          description: "Não foi possível adicionar o telefone.",
        });
      }
    } catch (error) {
      console.error("Erro:", error);
      toaster.error({
        title: "Erro",
        description: "Ocorreu um erro ao adicionar o telefone.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingPhone) return;

    setIsSubmitting(true);
    try {
      const token = await fetch("/api/get-cookies?key=access_token").then((r) =>
        r.json()
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}management/businesses/${businessId}/phones/${editingPhone.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type: editingPhone.type,
            country_code: editingPhone.country_code,
            number: removeMask(editingPhone.number),
            primary: editingPhone.primary,
          }),
        }
      );

      if (response.ok) {
        toaster.success({
          title: "Telefone atualizado",
          description: "Telefone atualizado com sucesso.",
        });
        setIsEditModalOpen(false);
        setEditingPhone(null);
        fetchPhones();
      } else {
        toaster.error({
          title: "Erro",
          description: "Não foi possível atualizar o telefone.",
        });
      }
    } catch (error) {
      console.error("Erro:", error);
      toaster.error({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar o telefone.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!phoneToDelete) return;

    setIsSubmitting(true);
    try {
      const token = await fetch("/api/get-cookies?key=access_token").then((r) =>
        r.json()
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}management/businesses/${businessId}/phones/${phoneToDelete.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        toaster.success({
          title: "Telefone removido",
          description: "Telefone removido com sucesso.",
        });
        setIsDeleteModalOpen(false);
        setPhoneToDelete(null);
        fetchPhones();
      } else {
        toaster.error({
          title: "Erro",
          description: "Não foi possível remover o telefone.",
        });
      }
    } catch (error) {
      console.error("Erro:", error);
      toaster.error({
        title: "Erro",
        description: "Ocorreu um erro ao remover o telefone.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box display="flex" flexDir="column" gap={4} w="100%" px={{ base: 4, md: 0 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Text fontSize="xl" fontWeight="bold">
          Telefones da Empresa
        </Text>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          colorPalette="blue"
          size="sm"
        >
          <FaPlus />
          Adicionar Telefone
        </Button>
      </Box>

      {isLoading ? (
        <Text>Carregando telefones...</Text>
      ) : phones.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Text color="gray.500">Nenhum telefone cadastrado.</Text>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            colorPalette="blue"
            size="sm"
            mt={4}
          >
            Adicionar Primeiro Telefone
          </Button>
        </Box>
      ) : (
        <Box
          display="grid"
          gridTemplateColumns={{
            base: "1fr",
            md: "repeat(2, 1fr)",
            lg: "repeat(3, 1fr)",
          }}
          gap={4}
        >
          {phones
            .sort((a, b) => (a.primary && !b.primary ? -1 : 1))
            .map((phone) => (
              <Box
                key={phone.id}
                p={4}
                border="1px solid"
                borderColor="gray.200"
                borderRadius="lg"
                bg="white"
                boxShadow="sm"
                _hover={{ boxShadow: "md" }}
                transition="box-shadow 0.2s"
                position="relative"
                display="flex"
                flexDirection="column"
                justifyContent="space-between"
              >
                {phone.primary && (
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

                <Box>
                  <Text fontWeight="semibold" fontSize="lg" mb={2}>
                    {phone.country_code} {formatPhone(phone.number)}
                  </Text>
                  <Text color="gray.600" fontSize="sm" mb={3}>
                    {phone.type === "PERSONAL"
                      ? "Pessoal"
                      : phone.type === "RESIDENTIAL"
                      ? "Residencial"
                      : phone.type === "COMMERCIAL"
                      ? "Comercial"
                      : "Outro"}
                  </Text>
                </Box>

                <Box display="flex" gap={2} mt="auto">
                  {phone.verified ? (
                    <Button
                      size="sm"
                      variant="outline"
                      flex="1"
                      color="green.600"
                      disabled
                    >
                      <FaCheckCircle />
                      <Text fontSize="sm">Verificado</Text>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      flex="1"
                      color="orange.600"
                      disabled
                    >
                      <GoAlert />
                      <Text fontSize="sm">Não verificado</Text>
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    colorPalette="blue"
                    onClick={() => {
                      setEditingPhone(phone);
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
                      setPhoneToDelete(phone);
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

      {/* Modal Criar */}
      <Dialog.Root
        open={isCreateModalOpen}
        onOpenChange={(e) => !e.open && setIsCreateModalOpen(false)}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Adicionar Telefone</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Box display="flex" flexDir="column" gap={4}>
                <Box>
                  <Text fontSize="sm" mb={1}>
                    Tipo
                  </Text>
                  <select
                    value={newPhone.type}
                    onChange={(e) =>
                      setNewPhone({
                        ...newPhone,
                        type: e.target.value as any,
                      })
                    }
                    style={{
                      width: "100%",
                      height: "40px",
                      padding: "0 12px",
                      border: "1px solid var(--chakra-colors-border)",
                      borderRadius: "6px",
                      backgroundColor: "transparent",
                      color: "inherit",
                      fontSize: "14px",
                    }}
                  >
                    <option value="PERSONAL">Pessoal</option>
                    <option value="RESIDENTIAL">Residencial</option>
                    <option value="COMMERCIAL">Comercial</option>
                    <option value="OTHER">Outro</option>
                  </select>
                </Box>
                <Box>
                  <Text fontSize="sm" mb={1}>
                    País
                  </Text>
                  <select
                    value={newPhone.country_code}
                    onChange={(e) =>
                      setNewPhone({ ...newPhone, country_code: e.target.value })
                    }
                    style={{
                      width: "100%",
                      height: "40px",
                      padding: "0 12px",
                      border: "1px solid var(--chakra-colors-border)",
                      borderRadius: "6px",
                      backgroundColor: "transparent",
                      color: "inherit",
                      fontSize: "14px",
                    }}
                  >
                    {countryOptions.map((country) => (
                      <option key={country.code} value={country.dialCode}>
                        {country.flag} {country.dialCode} {country.name}
                      </option>
                    ))}
                  </select>
                </Box>
                <Box>
                  <Text fontSize="sm" mb={1}>
                    Número
                  </Text>
                  <Input
                    placeholder="(99) 99999-9999"
                    value={formatPhone(newPhone.number)}
                    onChange={(e) =>
                      setNewPhone({ ...newPhone, number: e.target.value })
                    }
                  />
                </Box>
              </Box>
            </Dialog.Body>
            <Dialog.Footer>
              <Button
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                colorPalette="blue"
                onClick={handleCreate}
                loading={isSubmitting}
              >
                Adicionar
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Modal Editar */}
      <Dialog.Root
        open={isEditModalOpen}
        onOpenChange={(e) => {
          if (!e.open) {
            setIsEditModalOpen(false);
            setEditingPhone(null);
          }
        }}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Editar Telefone</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              {editingPhone && (
                <Box display="flex" flexDir="column" gap={4}>
                  <Box>
                    <Text fontSize="sm" mb={1}>
                      Tipo
                    </Text>
                    <select
                      value={editingPhone.type}
                      onChange={(e) =>
                        setEditingPhone({
                          ...editingPhone,
                          type: e.target.value as any,
                        })
                      }
                      style={{
                        width: "100%",
                        height: "40px",
                        padding: "0 12px",
                        border: "1px solid var(--chakra-colors-border)",
                        borderRadius: "6px",
                        backgroundColor: "transparent",
                        color: "inherit",
                        fontSize: "14px",
                      }}
                    >
                      <option value="PERSONAL">Pessoal</option>
                      <option value="RESIDENTIAL">Residencial</option>
                      <option value="COMMERCIAL">Comercial</option>
                      <option value="OTHER">Outro</option>
                    </select>
                  </Box>
                  <Box>
                    <Text fontSize="sm" mb={1}>
                      Número
                    </Text>
                    <Input
                      placeholder="(99) 99999-9999"
                      value={formatPhone(editingPhone.number)}
                      onChange={(e) =>
                        setEditingPhone({
                          ...editingPhone,
                          number: e.target.value,
                        })
                      }
                    />
                  </Box>
                  <Box>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <input
                        type="checkbox"
                        checked={editingPhone.primary}
                        onChange={(e) =>
                          setEditingPhone({
                            ...editingPhone,
                            primary: e.target.checked,
                          })
                        }
                      />
                      <Text fontSize="sm">Definir como principal</Text>
                    </label>
                  </Box>
                </Box>
              )}
            </Dialog.Body>
            <Dialog.Footer>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingPhone(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                colorPalette="blue"
                onClick={handleUpdate}
                loading={isSubmitting}
              >
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
            setPhoneToDelete(null);
          }
        }}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Remover Telefone</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Text>
                Tem certeza que deseja remover o telefone{" "}
                <strong>
                  {phoneToDelete?.country_code} {formatPhone(phoneToDelete?.number || "")}
                </strong>
                ?
              </Text>
            </Dialog.Body>
            <Dialog.Footer>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setPhoneToDelete(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                colorPalette="red"
                onClick={handleDelete}
                loading={isSubmitting}
              >
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
