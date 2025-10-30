"use client";

import { toaster } from "@/components/ui/toaster";
import {
  Badge,
  Box,
  Button,
  CheckboxCard,
  Dialog,
  Input,
  InputGroup,
  PinInput,
  Spinner,
  Table,
  Text
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { FaCheckCircle, FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import { GoAlert } from "react-icons/go";
import { IBusinessEmail } from "./types";

interface EmailsTabProps {
  businessId: string;
}

export function EmailsTab({ businessId }: EmailsTabProps) {
  const [emails, setEmails] = useState<IBusinessEmail[]>([]);
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  const [isAddingEmail, setIsAddingEmail] = useState(false);
  const [editingEmail, setEditingEmail] = useState<IBusinessEmail | null>(null);
  const [newEmail, setNewEmail] = useState({
    name: "",
    email: "",
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [emailToDelete, setEmailToDelete] = useState<IBusinessEmail | null>(null);

  // Estados de verificação
  const [isVerifyConfirmModalOpen, setIsVerifyConfirmModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [emailToVerify, setEmailToVerify] = useState<IBusinessEmail | null>(null);
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isConfirmingVerification, setIsConfirmingVerification] = useState(false);

  useEffect(() => {
    fetchEmails();
  }, [businessId]);

  const validateEmail = (email: string): { isValid: boolean; message?: string } => {
    if (!email.trim()) {
      return { isValid: false, message: "E-mail é obrigatório" };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, message: "E-mail inválido" };
    }

    return { isValid: true };
  };

  const fetchEmails = async () => {
    setIsLoadingEmails(true);
    try {
      const token = await fetch("/api/get-cookies?key=access_token").then(
        (res) => res.json()
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}management/businesses/${businessId}/emails`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setEmails(data);
      }
    } catch (error) {
      toaster.error({
        title: "Erro ao carregar e-mails",
        description: "Não foi possível carregar a lista de e-mails.",
      });
    } finally {
      setIsLoadingEmails(false);
    }
  };

  const addEmail = async () => {
    if (!newEmail.name.trim()) {
      toaster.error({ title: "Nome obrigatório", description: "Informe o nome." });
      return;
    }

    const validation = validateEmail(newEmail.email);
    if (!validation.isValid) {
      toaster.error({
        title: "E-mail inválido",
        description: validation.message,
      });
      return;
    }

    setIsAddingEmail(true);
    try {
      const token = await fetch("/api/get-cookies?key=access_token").then(
        (res) => res.json()
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}management/businesses/${businessId}/emails`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: newEmail.name, email: newEmail.email }),
        }
      );

      if (response.ok) {
        toaster.success({
          title: "E-mail adicionado",
          description: "O e-mail foi adicionado com sucesso.",
        });
        setIsCreateModalOpen(false);
        setNewEmail({ name: "", email: "" });
        fetchEmails();
      } else {
        const errorData = await response.json();
        toaster.error({
          title: "Erro ao adicionar e-mail",
          description: errorData.message || "Não foi possível adicionar o e-mail.",
        });
      }
    } catch (error) {
      toaster.error({
        title: "Erro ao adicionar e-mail",
        description: "Ocorreu um erro ao adicionar o e-mail.",
      });
    } finally {
      setIsAddingEmail(false);
    }
  };

  const updateEmail = async () => {
    if (!editingEmail) return;

    if (!editingEmail.name?.trim()) {
      toaster.error({ title: "Nome obrigatório", description: "Informe o nome." });
      return;
    }

    const validation = validateEmail(editingEmail.email);
    if (!validation.isValid) {
      toaster.error({
        title: "E-mail inválido",
        description: validation.message,
      });
      return;
    }

    setIsAddingEmail(true);
    try {
      const token = await fetch("/api/get-cookies?key=access_token").then(
        (res) => res.json()
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}management/businesses/${businessId}/emails`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: editingEmail.id,
            name: editingEmail.name,
            email: editingEmail.email,
            primary: editingEmail.primary,
          }),
        }
      );

      if (response.ok) {
        toaster.success({
          title: "E-mail atualizado",
          description: "O e-mail foi atualizado com sucesso.",
        });
        setIsEditModalOpen(false);
        setEditingEmail(null);
        fetchEmails();
      } else {
        const errorData = await response.json();
        toaster.error({
          title: "Erro ao atualizar e-mail",
          description: errorData.message || "Não foi possível atualizar o e-mail.",
        });
      }
    } catch (error) {
      toaster.error({
        title: "Erro ao atualizar e-mail",
        description: "Ocorreu um erro ao atualizar o e-mail.",
      });
    } finally {
      setIsAddingEmail(false);
    }
  };

  const deleteEmail = async () => {
    if (!emailToDelete) return;

    setIsAddingEmail(true);
    try {
      const token = await fetch("/api/get-cookies?key=access_token").then(
        (res) => res.json()
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}management/businesses/${businessId}/emails/${emailToDelete.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        toaster.success({
          title: "E-mail excluído",
          description: "O e-mail foi excluído com sucesso.",
        });
        setIsDeleteModalOpen(false);
        setEmailToDelete(null);
        fetchEmails();
      } else {
        const errorData = await response.json();
        toaster.error({
          title: "Erro ao excluir e-mail",
          description: errorData.message || "Não foi possível excluir o e-mail.",
        });
      }
    } catch (error) {
      toaster.error({
        title: "Erro ao excluir e-mail",
        description: "Ocorreu um erro ao excluir o e-mail.",
      });
    } finally {
      setIsAddingEmail(false);
    }
  };

  const sendVerificationCode = (email: IBusinessEmail) => {
    setEmailToVerify(email);
    setIsVerifyConfirmModalOpen(true);
  };

  const confirmSendVerificationCode = async () => {
    if (!emailToVerify) return;

    setIsSendingCode(true);
    try {
      const token = await fetch("/api/get-cookies?key=access_token").then((r) =>
        r.json()
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}management/businesses/${businessId}/emails/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email_id: emailToVerify.id }),
        }
      );

      if (response.ok) {
        setIsVerifyConfirmModalOpen(false);
        toaster.success({
          title: "Código enviado!",
          description: "Código de verificação foi enviado por e-mail.",
        });
        setIsVerifyModalOpen(true);
      } else {
        const error = await response.json();
        throw new Error(error.message?.[0] || "Erro ao enviar código");
      }
    } catch (error: any) {
      toaster.error({
        title: "Erro ao enviar código",
        description: error.message || "Não foi possível enviar o código de verificação.",
      });
      setEmailToVerify(null);
      setIsVerifyConfirmModalOpen(false);
    } finally {
      setIsSendingCode(false);
    }
  };

  const confirmEmailVerification = async () => {
    if (!emailToVerify || !verificationCode || verificationCode.length !== 6) {
      toaster.error({
        title: "Código inválido",
        description: "Digite os 6 dígitos enviados por e-mail.",
      });
      return;
    }

    setIsConfirmingVerification(true);
    try {
      const token = await fetch("/api/get-cookies?key=access_token").then((r) =>
        r.json()
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}management/businesses/${businessId}/emails/confirm-verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            code: verificationCode,
            email_id: emailToVerify.id,
          }),
        }
      );

      if (response.ok) {
        toaster.success({
          title: "E-mail verificado!",
          description: "O e-mail foi verificado com sucesso.",
        });
        closeVerifyModal();
        fetchEmails();
      } else {
        const error = await response.json();
        throw new Error(error.message?.[0] || "Código inválido");
      }
    } catch (error: any) {
      toaster.error({
        title: "Erro na verificação",
        description: error.message || "Não foi possível verificar o e-mail.",
      });
    } finally {
      setIsConfirmingVerification(false);
    }
  };

  const closeVerifyModal = () => {
    setIsVerifyModalOpen(false);
    setEmailToVerify(null);
    setVerificationCode("");
  };

  const PIN_LENGTH = 6;

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="flex-end"
        alignItems="center"
        mb={4}
      >
        {
          emails.length !== 0 && (
            <Button
              onClick={() => setIsCreateModalOpen(true)}
            >
              <FaPlus />
              Adicionar E-mail
            </Button>
          )
        }
      </Box>
      <Box
        bg="white"
        _dark={{ bg: "gray.800" }}
        borderRadius="lg"
        boxShadow="sm"
        overflow="hidden"
      >
        {isLoadingEmails ? (
          <Box textAlign="center" py={8}>
            <Spinner size="lg" />
            <Text mt={2}>Carregando e-mails...</Text>
          </Box>
        ) : emails.length === 0 ? (
          <Box
            textAlign="center"
            py={8}
            border="1px dashed"
            borderColor="gray.300"
            borderRadius="md"
        >
            <Text color="gray.500">
              Nenhum e-mail cadastrado
            </Text>
            <Text fontSize="sm" color="gray.400" mb={4}>
              Cadastre para começar
            </Text>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
            >
              <FaPlus />
              Cadastrar
            </Button>
          </Box>
        ) : (
          <Box overflowX="auto" border="1px" borderColor="gray.200" borderRadius="md">
            <Table.Root variant="outline" size="sm">
              <Table.Header>
                <Table.Row bg="gray.50" _dark={{ bg: "gray.800" }}>
                  <Table.ColumnHeader>Nome</Table.ColumnHeader>
                  <Table.ColumnHeader>E-mail</Table.ColumnHeader>
                  <Table.ColumnHeader>Status</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="right">Ações</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {emails.map((email) => (
                  <Table.Row key={email.id} _hover={{ bg: "gray.50", _dark: { bg: "gray.800" } }}>
                    <Table.Cell>{email.name}</Table.Cell>
                    <Table.Cell>{email.email}</Table.Cell>
                    <Table.Cell>
                      {email.verified ? (
                        <Badge colorPalette="green">
                          <FaCheckCircle style={{ marginRight: "4px" }} />
                          Verificado
                        </Badge>
                      ) : (
                        <Badge colorPalette="yellow">Não verificado</Badge>
                      )}
                    </Table.Cell>
                    <Table.Cell textAlign="right">
                      <Box display="flex" gap={2} justifyContent="flex-end">
                        {!email.verified && (
                          <Button
                            size="xs"
                            variant="ghost"
                            colorPalette="orange"
                            onClick={() => sendVerificationCode(email)}
                            title="Verificar E-mail"
                          >
                            <GoAlert />
                          </Button>
                        )}
                        <Button
                          size="xs"
                          variant="ghost"
                          colorPalette="blue"
                          onClick={() => {
                            setEditingEmail(email);
                            setIsEditModalOpen(true);
                          }}
                          title="Editar"
                        >
                          <FaEdit />
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          colorPalette="red"
                          onClick={() => {
                            setEmailToDelete(email);
                            setIsDeleteModalOpen(true);
                          }}
                          title="Deletar"
                        >
                          <FaTrash />
                        </Button>
                      </Box>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>
        )}
      </Box>

      {/* Modal de Criação */}
      <Dialog.Root
        open={isCreateModalOpen}
        onOpenChange={(e) => setIsCreateModalOpen(e.open)}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Adicionar E-mail</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Box mb={4}>
                <Text mb={2} fontWeight="medium">
                  Nome
                </Text>
                <Input
                  placeholder="Ex.: Comercial, Suporte"
                  value={newEmail.name}
                  onChange={(e) => setNewEmail({ ...newEmail, name: e.target.value })}
                />
              </Box>

              <Box mb={4}>
                <Text mb={2} fontWeight="medium">
                  E-mail
                </Text>
                <Input
                  type="email"
                  placeholder="exemplo@empresa.com"
                  value={newEmail.email}
                  onChange={(e) => setNewEmail({ ...newEmail, email: e.target.value })}
                />
              </Box>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline" mr={3}>
                  Cancelar
                </Button>
              </Dialog.ActionTrigger>
              <Button
                colorScheme="blue"
                onClick={addEmail}
                loading={isAddingEmail}
              >
                Adicionar
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Modal de Edição */}
      <Dialog.Root
        open={isEditModalOpen}
        onOpenChange={(e) => setIsEditModalOpen(e.open)}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Editar E-mail</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              {editingEmail && (
                <>
                  <Box mb={4}>
                    <InputGroup startAddon="Nome">
                      <Input
                        placeholder="Ex.: Comercial, Suporte"
                        value={editingEmail.name}
                        onChange={(e) =>
                          setEditingEmail({
                            ...editingEmail,
                            name: e.target.value,
                          } as IBusinessEmail)
                        }
                      />
                    </InputGroup>
                  </Box>

                  <Box mb={4}>
                    <InputGroup startAddon="E-mail">
                    <Input
                      type="email"
                      placeholder="exemplo@empresa.com"
                      value={editingEmail.email}
                      onChange={(e) =>
                        setEditingEmail({
                          ...editingEmail,
                          email: e.target.value,
                        } as IBusinessEmail)
                      }
                      disabled={(editingEmail as any).verified}
                    />
                    </InputGroup>
                  </Box>

                  <CheckboxCard.Root
                    checked={!!editingEmail.primary}
                    onCheckedChange={(details) =>
                      setEditingEmail({
                        ...editingEmail,
                        primary: details.checked,
                      } as IBusinessEmail)
                    }
                    cursor="pointer"
                  >
                    <CheckboxCard.HiddenInput />
                    <CheckboxCard.Control>
                      <CheckboxCard.Content>
                        <CheckboxCard.Label>
                          <Text fontSize="sm">Definir como principal</Text>
                        </CheckboxCard.Label>
                      </CheckboxCard.Content>
                      <CheckboxCard.Indicator />
                    </CheckboxCard.Control>
                  </CheckboxCard.Root>
                </>
              )}
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline">
                  Cancelar
                </Button>
              </Dialog.ActionTrigger>
              <Button
                onClick={updateEmail}
                loading={isAddingEmail}
              >
                <FaPlus />
                Salvar
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Modal de Exclusão */}
      <Dialog.Root
        open={isDeleteModalOpen}
        onOpenChange={(e) => setIsDeleteModalOpen(e.open)}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Excluir E-mail</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Box display="flex" alignItems="center" mb={4}>
                <GoAlert size={24} color="red" style={{ marginRight: "12px" }} />
                <Text>
                  Tem certeza que deseja excluir o e-mail{" "}
                  <strong>{emailToDelete?.email}</strong>?
                </Text>
              </Box>
              <Text fontSize="sm" textAlign="center" color="gray.600">
                Esta ação não pode ser desfeita.
              </Text>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline">
                  Cancelar
                </Button>
              </Dialog.ActionTrigger>
              <Button
                colorPalette="red"
                onClick={deleteEmail}
                loading={isAddingEmail}
              >
                <FaTrash />
                Excluir
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Modal de Confirmação de Envio de Código */}
      <Dialog.Root
        open={isVerifyConfirmModalOpen}
        onOpenChange={(e) => {
          if (!e.open) {
            setIsVerifyConfirmModalOpen(false);
            setEmailToVerify(null);
          }
        }}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Confirmar Verificação</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Box display="flex" flexDir="column" gap={4}>
                <Text>Será enviado um código de verificação para o e-mail:</Text>
                <Box p={3} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
                  <Text fontWeight="bold" fontSize="lg" textAlign="center">
                    {emailToVerify?.email}
                  </Text>
                </Box>
                <Text fontSize="sm" color="gray.600">
                  Após receber o código, você poderá inseri-lo na próxima tela para confirmar a verificação do e-mail.
                </Text>
              </Box>
            </Dialog.Body>
            <Dialog.Footer>
              <Button
                variant="outline"
                onClick={() => {
                  setIsVerifyConfirmModalOpen(false);
                  setEmailToVerify(null);
                }}
              >
                Cancelar
              </Button>
              <Button onClick={confirmSendVerificationCode} loading={isSendingCode}>
                Enviar Código
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Modal de Verificação com Código */}
      <Dialog.Root
        open={isVerifyModalOpen}
        onOpenChange={(e) => {
          if (!e.open) {
            closeVerifyModal();
          }
        }}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Verificar E-mail</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Text mb={4}>
                Enviamos um código de 6 dígitos para o e-mail{" "}
                <Text as="span" fontWeight="bold">
                  {emailToVerify?.email}
                </Text>
                . Digite o código abaixo para confirmar:
              </Text>
              <Box>
                <Text mb={2}>Código de verificação</Text>
                <PinInput.Root
                  value={Array.from({ length: PIN_LENGTH }, (_, i) => verificationCode[i] ?? "")}
                  onValueChange={(details) => setVerificationCode(details.valueAsString)}
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
              <Button onClick={confirmEmailVerification} loading={isConfirmingVerification}>
                Confirmar Verificação
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Box>
  );
}
