"use client";

import { formatDate } from "@/components/businesses";
import { toaster } from "@/components/ui/toaster";
import {
  Badge,
  Box,
  Button,
  Dialog,
  Input,
  InputGroup,
  Spinner,
  Table,
  Text,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { FaPlus } from "react-icons/fa";
import { VscDebugDisconnect } from "react-icons/vsc";

interface EmployeesTabProps {
  businessId: string;
}

type EmployeeStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "SUSPENDED"
  | "PENDING"
  | "BANNED"
  | "DELETED";

interface IEmployee {
  id: number | string;
  code: number;
  created_at: string;
  email: string;
  email_verified_at: string | null;
  name: string;
  status: EmployeeStatus;
  cpf: string;
  birth_date: string;
  gender: string;
}

function getEmployeeStatusColorScheme(status: EmployeeStatus) {
  switch (status) {
    case "ACTIVE":
      return "green";
    case "PENDING":
      return "yellow";
    case "SUSPENDED":
      return "orange";
    case "BANNED":
    case "DELETED":
      return "red";
    case "INACTIVE":
    default:
      return "gray";
  }
}

export function EmployeesTab({ businessId }: EmployeesTabProps) {
  const [employees, setEmployees] = useState<IEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<IEmployee | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const token = await fetch("/api/get-cookies?key=access_token").then((r) => r.json());
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}management/businesses/${businessId}/employees`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setEmployees(Array.isArray(data) ? data : data.data || []);
      } else {
        toaster.error({ title: "Erro", description: "Não foi possível carregar os colaboradores." });
      }
    } catch (e) {
      toaster.error({ title: "Erro", description: "Ocorreu um erro ao buscar os colaboradores." });
    } finally {
      setIsLoading(false);
    }
  };

  const sendInvite = async () => {
    if (!inviteEmail || !inviteName) {
      toaster.warning({ title: "Informe nome e e-mail" });
      return;
    }
    setIsInviting(true);
    try {
      const token = await fetch("/api/get-cookies?key=access_token").then((r) => r.json());
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}management/businesses/${businessId}/employees/invite`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email: inviteEmail, name: inviteName }),
        }
      );
      if (response.ok) {
        toaster.success({ title: "Convite enviado" });
        setIsInviteModalOpen(false);
        setInviteEmail("");
        setInviteName("");
        fetchEmployees();
      } else {
        toaster.error({ title: "Erro", description: "Não foi possível enviar o convite." });
      }
    } catch (e) {
      toaster.error({ title: "Erro", description: "Ocorreu um erro ao enviar o convite." });
    } finally {
      setIsInviting(false);
    }
  };

  const confirmRemove = async () => {
    if (!selectedEmployee) return;
    setIsRemoving(true);
    try {
      const token = await fetch("/api/get-cookies?key=access_token").then((r) => r.json());
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}management/businesses/${businessId}/employees`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ employee_id: selectedEmployee.id }),
        }
      );
      if (response.ok) {
        toaster.success({ title: "Colaborador removido da empresa" });
        setIsRemoveModalOpen(false);
        setSelectedEmployee(null);
        fetchEmployees();
      } else {
        toaster.error({ title: "Erro", description: "Não foi possível remover o colaborador." });
      }
    } catch (e) {
      toaster.error({ title: "Erro", description: "Ocorreu um erro ao remover o colaborador." });
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" alignItems="center" mb={4}>
        <Button onClick={() => setIsInviteModalOpen(true)}>
          <FaPlus />
          Convidar
        </Button>
      </Box>

      <Box
        bg="white"
        _dark={{ bg: "gray.800" }}
        borderRadius="lg"
        boxShadow="sm"
        overflow="hidden"
      >
        {isLoading ? (
          <Box textAlign="center" py={8}>
            <Spinner size="lg" />
            <Text mt={2}>Carregando colaboradores...</Text>
          </Box>
        ) : employees.length === 0 ? (
          <Box textAlign="center" py={8} bg="gray.50" borderRadius="md">
            <Text color="gray.500">Nenhum colaborador cadastrado</Text>
          </Box>
        ) : (
          <Box overflowX="auto" border="1px" borderColor="gray.200" borderRadius="md">
            <Table.Root variant="outline" size="sm">
              <Table.Header>
                <Table.Row bg="gray.50" _dark={{ bg: "gray.800" }}>
                  <Table.ColumnHeader>Código</Table.ColumnHeader>
                  <Table.ColumnHeader>Nome</Table.ColumnHeader>
                  <Table.ColumnHeader>Email</Table.ColumnHeader>
                  <Table.ColumnHeader>Verificado</Table.ColumnHeader>
                  <Table.ColumnHeader>CPF</Table.ColumnHeader>
                  <Table.ColumnHeader>Nascimento</Table.ColumnHeader>
                  <Table.ColumnHeader>Gênero</Table.ColumnHeader>
                  <Table.ColumnHeader>Status</Table.ColumnHeader>
                  <Table.ColumnHeader>Criado em</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="center">Ações</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {employees.map((emp) => (
                  <Table.Row
                    key={emp.id}
                    _hover={{ bg: "gray.50", _dark: { bg: "gray.800" } }}
                  >
                    <Table.Cell fontWeight="medium">#{emp.code}</Table.Cell>
                    <Table.Cell>{emp.name}</Table.Cell>
                    <Table.Cell fontFamily="mono" fontSize="sm">{emp.email}</Table.Cell>
                    <Table.Cell>
                      {emp.email_verified_at ? (
                        <Badge colorPalette="green">Verificado</Badge>
                      ) : (
                        <Badge colorPalette="gray">Pendente</Badge>
                      )}
                    </Table.Cell>
                    <Table.Cell>{emp.cpf || "-"}</Table.Cell>
                    <Table.Cell fontSize="sm">{emp.birth_date ? formatDate(emp.birth_date) : "-"}</Table.Cell>
                    <Table.Cell>{emp.gender || "-"}</Table.Cell>
                    <Table.Cell>
                      <Badge colorPalette={getEmployeeStatusColorScheme(emp.status)}>
                        {emp.status}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell fontSize="sm">{formatDate(emp.created_at)}</Table.Cell>
                    <Table.Cell>
                      <Box display="flex" justifyContent="center">
                        <Button
                          size="xs"
                          variant="ghost"
                          colorPalette="red"
                          onClick={() => {
                            setSelectedEmployee(emp);
                            setIsRemoveModalOpen(true);
                          }}
                          title="Remover colaborador da empresa"
                        >
                          <VscDebugDisconnect />
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
      {/* Modal: Convidar colaborador */}
      <Dialog.Root
        open={isInviteModalOpen}
        onOpenChange={(e) => {
          if (!e.open) {
            setIsInviteModalOpen(false);
            setInviteEmail("");
            setInviteName("");
          }
        }}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Convidar colaborador</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Box display="flex" flexDirection="column" gap={3}>
                <Box>
                  <InputGroup startAddon="Nome">
                    <Input
                      placeholder="Nome do colaborador"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                    />
                  </InputGroup>
                </Box>
                <Box>
                  <InputGroup startAddon="E-mail">
                    <Input
                      type="email"
                      placeholder="email@exemplo.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </InputGroup>
                </Box>
              </Box>
            </Dialog.Body>
            <Dialog.Footer>
              <Button
                variant="outline"
                onClick={() => {
                  setIsInviteModalOpen(false);
                  setInviteEmail("");
                  setInviteName("");
                }}
              >
                Cancelar
              </Button>
              <Button onClick={sendInvite} loading={isInviting}>
                <FaPlus />
                Enviar convite
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Modal: Remover colaborador */}
      <Dialog.Root
        open={isRemoveModalOpen}
        onOpenChange={(e) => {
          if (!e.open) {
            setIsRemoveModalOpen(false);
            setSelectedEmployee(null);
          }
        }}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Remover colaborador</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Text>
                Tem certeza que deseja remover o colaborador {" "}
                <strong>{selectedEmployee?.name}</strong> desta empresa?
              </Text>
            </Dialog.Body>
            <Dialog.Footer>
              <Button
                variant="outline"
                onClick={() => {
                  setIsRemoveModalOpen(false);
                  setSelectedEmployee(null);
                }}
              >
                Cancelar
              </Button>
              <Button colorPalette="red" onClick={confirmRemove} loading={isRemoving}>
                <VscDebugDisconnect />
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
