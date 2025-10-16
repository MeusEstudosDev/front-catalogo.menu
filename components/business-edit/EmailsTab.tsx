"use client";

import { toaster } from "@/components/ui/toaster";
import {
  Badge,
  Box,
  Button,
  Dialog,
  Input,
  Spinner,
  Table,
  Text,
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
    type: "GENERAL",
    email: "",
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [emailToDelete, setEmailToDelete] = useState<IBusinessEmail | null>(null);

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
          body: JSON.stringify(newEmail),
        }
      );

      if (response.ok) {
        toaster.success({
          title: "E-mail adicionado",
          description: "O e-mail foi adicionado com sucesso.",
        });
        setIsCreateModalOpen(false);
        setNewEmail({ type: "GENERAL", email: "" });
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
        `${process.env.NEXT_PUBLIC_API_URL}management/businesses/${businessId}/emails/${editingEmail.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: editingEmail.type,
            email: editingEmail.email,
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

  const getEmailTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      GENERAL: "Geral",
      SALES: "Vendas",
      SUPPORT: "Suporte",
      BILLING: "Financeiro",
      OTHER: "Outro",
    };
    return types[type] || type;
  };

  const getEmailTypeBadge = (type: string) => {
    const colorMap: Record<string, string> = {
      GENERAL: "blue",
      SALES: "green",
      SUPPORT: "orange",
      BILLING: "purple",
      OTHER: "gray",
    };
    return colorMap[type] || "gray";
  };

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <Text fontSize="xl" fontWeight="bold">
          E-mails
        </Text>
        <Button
          colorScheme="blue"
          size="sm"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <FaPlus style={{ marginRight: "8px" }} />
          Adicionar E-mail
        </Button>
      </Box>

      {isLoadingEmails ? (
        <Box textAlign="center" py={8}>
          <Spinner size="lg" />
          <Text mt={2}>Carregando e-mails...</Text>
        </Box>
      ) : emails.length === 0 ? (
        <Box textAlign="center" py={8} bg="gray.50" borderRadius="md">
          <Text color="gray.500">Nenhum e-mail cadastrado</Text>
        </Box>
      ) : (
        <Box overflowX="auto">
          <Table.Root size="sm" striped>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Tipo</Table.ColumnHeader>
                <Table.ColumnHeader>E-mail</Table.ColumnHeader>
                <Table.ColumnHeader>Status</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="right">Ações</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {emails.map((email) => (
                <Table.Row key={email.id}>
                  <Table.Cell>
                    <Badge colorPalette={getEmailTypeBadge(email.type)}>
                      {getEmailTypeLabel(email.type)}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>{email.email}</Table.Cell>
                  <Table.Cell>
                    {email.is_verified ? (
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
                      <Button
                        size="xs"
                        variant="outline"
                        colorScheme="blue"
                        onClick={() => {
                          setEditingEmail(email);
                          setIsEditModalOpen(true);
                        }}
                      >
                        <FaEdit />
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        colorScheme="red"
                        onClick={() => {
                          setEmailToDelete(email);
                          setIsDeleteModalOpen(true);
                        }}
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
                  Tipo
                </Text>
                <select
                  value={newEmail.type}
                  onChange={(e) =>
                    setNewEmail({ ...newEmail, type: e.target.value as "GENERAL" | "SALES" | "SUPPORT" | "BILLING" | "OTHER" })
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "6px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <option value="GENERAL">Geral</option>
                  <option value="SALES">Vendas</option>
                  <option value="SUPPORT">Suporte</option>
                  <option value="BILLING">Financeiro</option>
                  <option value="OTHER">Outro</option>
                </select>
              </Box>

              <Box mb={4}>
                <Text mb={2} fontWeight="medium">
                  E-mail
                </Text>
                <Input
                  type="email"
                  placeholder="exemplo@empresa.com"
                  value={newEmail.email}
                  onChange={(e) =>
                    setNewEmail({ ...newEmail, email: e.target.value })
                  }
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
                    <Text mb={2} fontWeight="medium">
                      Tipo
                    </Text>
                    <select
                      value={editingEmail.type}
                      onChange={(e) =>
                        setEditingEmail({
                          ...editingEmail,
                          type: e.target.value as "GENERAL" | "SALES" | "SUPPORT" | "BILLING" | "OTHER",
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "6px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <option value="GENERAL">Geral</option>
                      <option value="SALES">Vendas</option>
                      <option value="SUPPORT">Suporte</option>
                      <option value="BILLING">Financeiro</option>
                      <option value="OTHER">Outro</option>
                    </select>
                  </Box>

                  <Box mb={4}>
                    <Text mb={2} fontWeight="medium">
                      E-mail
                    </Text>
                    <Input
                      type="email"
                      placeholder="exemplo@empresa.com"
                      value={editingEmail.email}
                      onChange={(e) =>
                        setEditingEmail({
                          ...editingEmail,
                          email: e.target.value,
                        })
                      }
                    />
                  </Box>
                </>
              )}
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline" mr={3}>
                  Cancelar
                </Button>
              </Dialog.ActionTrigger>
              <Button
                colorScheme="blue"
                onClick={updateEmail}
                loading={isAddingEmail}
              >
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
              <Text fontSize="sm" color="gray.600">
                Esta ação não pode ser desfeita.
              </Text>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline" mr={3}>
                  Cancelar
                </Button>
              </Dialog.ActionTrigger>
              <Button
                colorScheme="red"
                onClick={deleteEmail}
                loading={isAddingEmail}
              >
                Excluir
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Box>
  );
}
