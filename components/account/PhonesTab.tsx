"use client";

import { toaster } from "@/components/ui/toaster";
import {
  Box,
  Button,
  Dialog,
  Input,
  PinInput,
  Text,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { FaCheckCircle, FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import { GoAlert } from "react-icons/go";
import countries from "world-countries";
import { IUserPhone } from "./types";
import { formatPhone, removeMask } from "./utils";

export function PhonesTab() {
  const [phones, setPhones] = useState<IUserPhone[]>([]);
  const [isLoadingPhones, setIsLoadingPhones] = useState(false);
  const [isAddingPhone, setIsAddingPhone] = useState(false);
  const [editingPhone, setEditingPhone] = useState<IUserPhone | null>(null);
  const [newPhone, setNewPhone] = useState({
    type: "PERSONAL",
    country_code: "+55",
    number: "",
  });
  const [verificationPhoneCode, setVerificationPhoneCode] = useState<string>("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [phoneToDelete, setPhoneToDelete] = useState<IUserPhone | null>(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isVerifyConfirmModalOpen, setIsVerifyConfirmModalOpen] = useState(false);
  const [phoneToVerify, setPhoneToVerify] = useState<IUserPhone | null>(null);
  const [isConfirmingVerification, setIsConfirmingVerification] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);

  // Lista de países com códigos DDI
  const countryOptions = countries
    .filter((country) => country.idd && country.idd.root)
    .map((country) => ({
      code: country.cca2,
      name: country.name.common,
      dialCode: country.idd.root + (country.idd.suffixes?.[0] || ""),
      flag: country.flag,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Adicionar Brasil no topo se não estiver lá
  const brazilIndex = countryOptions.findIndex((c) => c.code === "BR");
  if (brazilIndex > 0) {
    const brazil = countryOptions.splice(brazilIndex, 1)[0];
    countryOptions.unshift(brazil);
  }

  useEffect(() => {
    fetchPhones();
  }, []);

  // Função para validar número de telefone
  const validatePhoneNumber = (
    number: string
  ): { isValid: boolean; message?: string } => {
    const cleanNumber = removeMask(number);

    if (!/^\d+$/.test(cleanNumber)) {
      return { isValid: false, message: "O número deve conter apenas dígitos" };
    }

    if (cleanNumber.length < 8) {
      return {
        isValid: false,
        message: "O número deve ter pelo menos 8 dígitos",
      };
    }

    if (cleanNumber.length > 15) {
      return {
        isValid: false,
        message: "O número não pode ter mais de 15 dígitos",
      };
    }

    // Para números brasileiros (quando DDI for +55)
    if (
      newPhone.country_code === "+55" ||
      (editingPhone && editingPhone.country_code === "+55")
    ) {
      if (cleanNumber.length === 10) {
        if (cleanNumber.charAt(2) === "9") {
          return {
            isValid: false,
            message: "Para telefone fixo, o primeiro dígito após o DDD não pode ser 9",
          };
        }
      } else if (cleanNumber.length === 11) {
        if (cleanNumber.charAt(2) !== "9") {
          return {
            isValid: false,
            message: "Para celular, o primeiro dígito após o DDD deve ser 9",
          };
        }
      } else {
        return {
          isValid: false,
          message: "Número brasileiro deve ter 10 dígitos (fixo) ou 11 dígitos (celular)",
        };
      }
    }

    return { isValid: true };
  };

  const fetchPhones = async () => {
    setIsLoadingPhones(true);
    try {
      const token = await fetch("/api/get-cookies?key=access_token").then(
        (res) => res.json()
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}users/phones`,
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
      toaster.error({
        title: "Erro ao carregar telefones",
        description: "Não foi possível carregar a lista de telefones.",
      });
    } finally {
      setIsLoadingPhones(false);
    }
  };

  const addPhone = async () => {
    if (!newPhone.number.trim()) {
      toaster.error({
        title: "Número obrigatório",
        description: "Digite um número de telefone.",
      });
      return;
    }

    const validation = validatePhoneNumber(newPhone.number);
    if (!validation.isValid) {
      toaster.error({
        title: "Número inválido",
        description: validation.message,
      });
      return;
    }

    setIsAddingPhone(true);
    try {
      const token = await fetch("/api/get-cookies?key=access_token").then(
        (res) => res.json()
      );

      const cleanNumber = removeMask(newPhone.number);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}users/phones`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type: newPhone.type,
            country_code: newPhone.country_code,
            number: cleanNumber,
          }),
        }
      );

      if (response.ok) {
        toaster.success({
          title: "Telefone adicionado!",
          description: "Telefone foi adicionado com sucesso.",
        });
        setNewPhone({ type: "PERSONAL", country_code: "+55", number: "" });
        setIsCreateModalOpen(false);
        fetchPhones();
      } else {
        const error = await response.json();
        throw new Error(error.message?.[0] || "Erro ao adicionar telefone");
      }
    } catch (error: any) {
      toaster.error({
        title: "Erro ao adicionar telefone",
        description: error.message || "Não foi possível adicionar o telefone.",
      });
    } finally {
      setIsAddingPhone(false);
    }
  };

  const updatePhone = async (phone: IUserPhone) => {
    const validation = validatePhoneNumber(phone.number);
    if (!validation.isValid) {
      toaster.error({
        title: "Número inválido",
        description: validation.message,
      });
      return;
    }

    try {
      const token = await fetch("/api/get-cookies?key=access_token").then(
        (res) => res.json()
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}users/phones`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: phone.id,
            type: phone.type,
            country_code: phone.country_code,
            number: removeMask(phone.number),
            primary: phone.primary,
          }),
        }
      );

      if (response.ok) {
        toaster.success({
          title: "Telefone atualizado!",
          description: "Telefone foi atualizado com sucesso.",
        });
        setEditingPhone(null);
        setIsEditModalOpen(false);
        fetchPhones();
      } else {
        const error = await response.json();
        throw new Error(error.message?.[0] || "Erro ao atualizar telefone");
      }
    } catch (error: any) {
      toaster.error({
        title: "Erro ao atualizar telefone",
        description: error.message || "Não foi possível atualizar o telefone.",
      });
    }
  };

  const sendVerificationCode = (phone: IUserPhone) => {
    setPhoneToVerify(phone);
    setIsVerifyConfirmModalOpen(true);
  };

  const confirmSendVerificationCode = async () => {
    if (!phoneToVerify) return;

    setIsSendingCode(true);

    try {
      const token = await fetch("/api/get-cookies?key=access_token").then(
        (res) => res.json()
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}users/phones/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ phone_id: phoneToVerify.id }),
        }
      );

      if (response.ok) {
        setIsVerifyConfirmModalOpen(false);
        toaster.success({
          title: "Código enviado!",
          description: "Código de verificação foi enviado por SMS.",
        });
        setIsVerifyModalOpen(true);
      } else {
        const error = await response.json();
        throw new Error(error.message?.[0] || "Erro ao enviar código");
      }
    } catch (error: any) {
      toaster.error({
        title: "Erro ao enviar código",
        description:
          error.message || "Não foi possível enviar o código de verificação.",
      });
      setPhoneToVerify(null);
      setIsVerifyConfirmModalOpen(false);
    } finally {
      setIsSendingCode(false);
    }
  };

  const confirmPhoneVerification = async () => {
    if (
      !phoneToVerify ||
      !verificationPhoneCode ||
      verificationPhoneCode.length !== 6
    ) {
      toaster.error({
        title: "Código inválido",
        description: "Digite os 6 dígitos enviados por SMS.",
      });
      return;
    }

    setIsConfirmingVerification(true);
    try {
      const token = await fetch("/api/get-cookies?key=access_token").then(
        (res) => res.json()
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}users/phones/confirm-verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            phone_id: phoneToVerify.id,
            code: verificationPhoneCode,
          }),
        }
      );

      if (response.ok) {
        toaster.success({
          title: "Telefone verificado!",
          description: "Seu telefone foi verificado com sucesso.",
        });
        closeVerifyModal();
        fetchPhones();
      } else {
        const error = await response.json();
        throw new Error(error.message?.[0] || "Código inválido");
      }
    } catch (error: any) {
      toaster.error({
        title: "Erro na verificação",
        description: error.message || "Não foi possível verificar o telefone.",
      });
    } finally {
      setIsConfirmingVerification(false);
    }
  };

  const confirmDeletePhone = async () => {
    if (!phoneToDelete) return;

    try {
      const token = await fetch("/api/get-cookies?key=access_token").then(
        (res) => res.json()
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}users/phones/${phoneToDelete.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        toaster.success({
          title: "Telefone removido!",
          description: "Telefone foi removido com sucesso.",
        });
        closeDeleteModal();
        fetchPhones();
      } else {
        const error = await response.json();
        throw new Error(error.message?.[0] || "Erro ao remover telefone");
      }
    } catch (error: any) {
      toaster.error({
        title: "Erro ao remover telefone",
        description: error.message || "Não foi possível remover o telefone.",
      });
    }
  };

  // Funções para controlar modais
  const openCreateModal = () => {
    setNewPhone({ type: "PERSONAL", country_code: "+55", number: "" });
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setNewPhone({ type: "PERSONAL", country_code: "+55", number: "" });
  };

  const openEditModal = (phone: IUserPhone) => {
    setEditingPhone(phone);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingPhone(null);
  };

  const openDeleteModal = (phone: IUserPhone) => {
    setPhoneToDelete(phone);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setPhoneToDelete(null);
  };

  const closeVerifyModal = () => {
    setIsVerifyModalOpen(false);
    setPhoneToVerify(null);
    setVerificationPhoneCode("");
  };

  const PIN_LENGTH = 6;

  return (
    <Box display="flex" flexDir="row" gap={4}>
      <Box display="flex" flexDir="column" gap={4} w="100%">
        <Box
          display="flex"
          flexDir="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Text fontSize="xl" fontWeight="bold">
            Meus Telefones
          </Text>
          <Box display="flex" gap={2}>
            <Button
              onClick={openCreateModal}
              colorPalette="black"
              size="sm"
              alignSelf={{ base: "stretch", md: "end" }}
              w={{ base: "100%", md: "160px" }}
              display="flex"
              gap={2}
            >
              <FaPlus />
              Adicionar Telefone
            </Button>
          </Box>
        </Box>

        {isLoadingPhones ? (
          <Box textAlign="center" py={8}>
            <Text>Carregando telefones...</Text>
          </Box>
        ) : phones.length === 0 ? (
          <Box textAlign="center" py={8}>
            <Text color="gray.500">Nenhum telefone cadastrado.</Text>
            <Button
              onClick={openCreateModal}
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
              md: "repeat(3, 1fr)",
              lg: "repeat(5, 1fr)",
            }}
            gap={4}
          >
            {phones
              .sort((a, b) => {
                if (a.primary && !b.primary) return -1;
                if (!a.primary && b.primary) return 1;
                return 0;
              })
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
                  minW="358px"
                  display="flex"
                  flexDirection="column"
                  justifyContent="space-between"
                  cursor="default"
                >
                  <Box
                    h="100%"
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
                        onClick={() => sendVerificationCode(phone)}
                        flex="1"
                        color="orange.600"
                      >
                        <GoAlert />
                        <Text fontSize="sm">Verificar</Text>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditModal(phone)}
                      flex="1"
                    >
                      <FaEdit />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      colorPalette="red"
                      variant="outline"
                      onClick={() => openDeleteModal(phone)}
                    >
                      <FaTrash />
                    </Button>
                  </Box>
                </Box>
              ))}
          </Box>
        )}
      </Box>

      {/* Modal de Criar Telefone */}
      <Dialog.Root
        open={isCreateModalOpen}
        onOpenChange={(details) => setIsCreateModalOpen(details.open)}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Adicionar Novo Telefone</Dialog.Title>
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
                      setNewPhone((prev) => ({
                        ...prev,
                        type: e.target.value as any,
                      }))
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
                      outline: "none",
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
                      setNewPhone((prev) => ({
                        ...prev,
                        country_code: e.target.value,
                      }))
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
                      outline: "none",
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
                    value={newPhone.number}
                    onChange={(e) => {
                      const sanitized = e.target.value.replace(
                        /[^\d\s()-]/g,
                        ""
                      );
                      const formatted = formatPhone(sanitized);
                      setNewPhone((prev) => ({
                        ...prev,
                        number: formatted,
                      }));
                    }}
                    placeholder="99999-9999"
                    maxLength={15}
                  />
                </Box>
              </Box>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={closeCreateModal}>
                Cancelar
              </Button>
              <Button
                colorPalette="blue"
                onClick={addPhone}
                loading={isAddingPhone}
              >
                Adicionar
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Modal de Editar Telefone */}
      <Dialog.Root
        open={isEditModalOpen}
        onOpenChange={(details) => setIsEditModalOpen(details.open)}
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
                        setEditingPhone((prev) =>
                          prev
                            ? { ...prev, type: e.target.value as any }
                            : null
                        )
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
                        outline: "none",
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
                      value={editingPhone.country_code}
                      onChange={(e) =>
                        setEditingPhone((prev) =>
                          prev
                            ? { ...prev, country_code: e.target.value }
                            : null
                        )
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
                        outline: "none",
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
                      value={formatPhone(editingPhone.number)}
                      onChange={(e) => {
                        const sanitized = e.target.value.replace(
                          /[^\d\s()-]/g,
                          ""
                        );
                        const formatted = formatPhone(sanitized);
                        setEditingPhone((prev) =>
                          prev
                            ? { ...prev, number: removeMask(formatted) }
                            : null
                        );
                      }}
                      maxLength={15}
                    />
                  </Box>
                  <Box>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "14px",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={editingPhone.primary}
                        onChange={(e) =>
                          setEditingPhone((prev) =>
                            prev
                              ? { ...prev, primary: e.target.checked }
                              : null
                          )
                        }
                      />
                      Telefone Principal
                    </label>
                  </Box>
                </Box>
              )}
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={closeEditModal}>
                Cancelar
              </Button>
              <Button
                colorPalette="green"
                onClick={() => editingPhone && updatePhone(editingPhone)}
              >
                Salvar
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog.Root
        open={isDeleteModalOpen}
        onOpenChange={(details) => setIsDeleteModalOpen(details.open)}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Confirmar Exclusão</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Text>
                Tem certeza que deseja remover o telefone{" "}
                <Text as="span" fontWeight="bold">
                  {phoneToDelete &&
                    `${phoneToDelete.country_code} ${formatPhone(
                      phoneToDelete.number
                    )}`}
                </Text>
                ? Esta ação não pode ser desfeita.
              </Text>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={closeDeleteModal}>
                Cancelar
              </Button>
              <Button colorPalette="red" onClick={confirmDeletePhone}>
                Remover
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Modal de Verificação de Telefone */}
      <Dialog.Root
        open={isVerifyModalOpen}
        onOpenChange={(details) => setIsVerifyModalOpen(details.open)}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Verificar Telefone</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Text mb={4}>
                Enviamos um código de 6 dígitos para o número{" "}
                <Text as="span" fontWeight="bold">
                  {phoneToVerify &&
                    `${phoneToVerify.country_code} ${formatPhone(
                      phoneToVerify.number
                    )}`}
                </Text>
                . Digite o código abaixo para confirmar:
              </Text>
              <Box>
                <Text mb={2}>Código de verificação</Text>
                <PinInput.Root
                  value={Array.from({ length: PIN_LENGTH }, (_, i) => verificationPhoneCode[i] ?? "")}
                  onValueChange={(details) => setVerificationPhoneCode(details.valueAsString)}
                  otp
                  type="alphanumeric"
                >
                  <PinInput.HiddenInput />
                  <PinInput.Control>
                    {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                      <PinInput.Input key={i} index={i} />
                    ))}
                  </PinInput.Control>
                </PinInput.Root>
              </Box>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={closeVerifyModal}>
                Cancelar
              </Button>
              <Button
                colorPalette="green"
                onClick={confirmPhoneVerification}
                loading={isConfirmingVerification}
              >
                Confirmar Verificação
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Modal de Confirmação de Verificação */}
      <Dialog.Root
        open={isVerifyConfirmModalOpen}
        onOpenChange={(details) =>
          setIsVerifyConfirmModalOpen(details.open)
        }
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Confirmar Verificação</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Box display="flex" flexDir="column" gap={4}>
                <Text>
                  Será enviado um código de verificação via SMS para o
                  número:
                </Text>
                <Box
                  p={3}
                  bg="gray.50"
                  borderRadius="md"
                  border="1px solid"
                  borderColor="gray.200"
                >
                  <Text fontWeight="bold" fontSize="lg" textAlign="center">
                    {phoneToVerify?.country_code} {phoneToVerify?.number}
                  </Text>
                </Box>
                <Text fontSize="sm" color="gray.600">
                  Após receber o código, você poderá inserí-lo na próxima
                  tela para confirmar a verificação do telefone.
                </Text>
              </Box>
            </Dialog.Body>
            <Dialog.Footer>
              <Button
                variant="outline"
                onClick={() => {
                  setIsVerifyConfirmModalOpen(false);
                  setPhoneToVerify(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                colorPalette="blue"
                onClick={confirmSendVerificationCode}
                loading={isSendingCode}
              >
                Enviar Código
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Box>
  );
}
