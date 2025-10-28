"use client";

import { toaster } from "@/components/ui/toaster";
import {
  Badge,
  Box,
  Button,
  Container,
  Dialog,
  Flex,
  Image,
  Spinner,
  Table,
  Text
} from "@chakra-ui/react";
import { Suspense, useEffect, useState } from "react";
import { FaPlus, FaWhatsapp } from "react-icons/fa";
import { MdRefresh } from "react-icons/md";
import { VscDebugDisconnect } from "react-icons/vsc";

interface WhatsAppSession {
  business_id: string;
  phone_identifier: string;
  session_key: string;
  connected: boolean;
  ready: boolean;
  qrCodeAvailable: boolean;
  info: {
    wid: string;
    pushname: string;
    platform: string;
  } | null;
}

interface WhatsAppConnectionResponse {
  business_id: string;
  total: number;
  connected: number;
  sessions: WhatsAppSession[];
}

function WhatsAppPageContent() {
  const [sessions, setSessions] = useState<WhatsAppSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<WhatsAppSession | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  
  // Estado do modal de conexão
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [phoneIdentifier, setPhoneIdentifier] = useState("");
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [qrCheckInterval, setQrCheckInterval] = useState<NodeJS.Timeout | null>(null);

  // Buscar sessões conectadas
  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const token = await fetch("/api/get-cookies?key=access_token").then((r) =>
        r.json()
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}whatsapp/connected`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data: WhatsAppConnectionResponse = await response.json();
        setSessions(data.sessions || []);
      } else {
        toaster.error({
          title: "Erro ao carregar sessões",
          description: "Não foi possível carregar as sessões do WhatsApp.",
        });
      }
    } catch (error) {
      console.error("Erro ao buscar sessões:", error);
      toaster.error({
        title: "Erro",
        description: "Ocorreu um erro ao buscar as sessões.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Abrir modal de desconexão
  const openDisconnectModal = (session: WhatsAppSession) => {
    setSelectedSession(session);
    setIsDisconnectModalOpen(true);
  };

  // Confirmar desconexão
  const confirmDisconnect = async () => {
    if (!selectedSession) return;

    setIsDisconnecting(true);
    try {
      const token = await fetch("/api/get-cookies?key=access_token").then((r) =>
        r.json()
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}whatsapp/disconnect`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            phoneIdentifier: selectedSession.phone_identifier,
          }),
        }
      );

      if (response.ok) {
        toaster.success({
          title: "Sessão desconectada",
          description: `A sessão "${selectedSession.phone_identifier}" foi desconectada com sucesso.`,
        });
        setIsDisconnectModalOpen(false);
        setSelectedSession(null);
        fetchSessions();
      } else {
        const error = await response.json();
        toaster.error({
          title: "Erro ao desconectar",
          description: error.message || "Não foi possível desconectar a sessão.",
        });
      }
    } catch (error) {
      console.error("Erro ao desconectar sessão:", error);
      toaster.error({
        title: "Erro",
        description: "Ocorreu um erro ao desconectar a sessão.",
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  // Abrir modal de conexão
  const openConnectModal = () => {
    setPhoneIdentifier("");
    setQrCode(null);
    setIsConnectModalOpen(true);
  };

  // Fechar modal de conexão e limpar interval
  const closeConnectModal = () => {
    setIsConnectModalOpen(false);
    setQrCode(null);
    setPhoneIdentifier("");
    setQrCheckInterval(null);
    if (qrCheckInterval) {
      clearInterval(qrCheckInterval);
    }
  };

  // Gerar QR Code
  const generateQRCode = async () => {
    if (!phoneIdentifier.trim()) {
      toaster.error({
        title: "Campo obrigatório",
        description: "Por favor, informe o identificador do telefone.",
      });
      return;
    }

    setIsGeneratingQR(true);
    setQrCode(null);

    try {
      const token = await fetch("/api/get-cookies?key=access_token").then((r) =>
        r.json()
      );

      // Iniciar polling do QR Code
      const checkQRCode = async () => {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}whatsapp/qr?phone=${encodeURIComponent(phoneIdentifier)}`,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.qr) {
              setQrCode(data.qr);
            }

            // Verificar se já conectou
            const connectedResponse = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}whatsapp/connected?phone=${encodeURIComponent(phoneIdentifier)}`,
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (connectedResponse.ok) {
              const connectedData = await connectedResponse.json();
              if (connectedData.connected && connectedData.ready) {
                // Conectado com sucesso
                toaster.success({
                  title: "WhatsApp conectado!",
                  description: `A sessão "${phoneIdentifier}" foi conectada com sucesso.`,
                });
                closeConnectModal();
                fetchSessions();
              }
            }
          }
        } catch (error) {
          console.error("Erro ao verificar QR Code:", error);
        }
      };

      // Primeira verificação imediata
      await checkQRCode();

      // Configurar polling a cada 5 segundos
      const interval = setInterval(checkQRCode, 5000);
      setQrCheckInterval(interval);
    } catch (error) {
      console.error("Erro ao gerar QR Code:", error);
      toaster.error({
        title: "Erro",
        description: "Ocorreu um erro ao gerar o QR Code.",
      });
    } finally {
      setIsGeneratingQR(false);
    }
  };

  // Limpar interval quando o componente desmontar
  useEffect(() => {
    return () => {
      if (qrCheckInterval) {
        clearInterval(qrCheckInterval);
      }
    };
  }, [qrCheckInterval]);

  return (
    <Container maxW="container.xl">
      {/* Cabeçalho */}
      <Flex justify="flex-end" align="center" mb={6}>
        <Flex gap={3}>
          <Button
            colorPalette="gray"
            onClick={fetchSessions}
            variant="outline"
          >
            <MdRefresh />
            Atualizar
          </Button>
          <Button onClick={openConnectModal}>
            <FaPlus />
            Conectar WhatsApp
          </Button>
        </Flex>
      </Flex>

      {/* Tabela */}
      {isLoading ? (
        <Flex justify="center" align="center" py={12}>
          <Spinner size="xl" />
        </Flex>
      ) : sessions.length === 0 ? (
        <Box
          textAlign="center"
          py={12}
          border="1px dashed"
          borderColor="gray.300"
          borderRadius="md"
        >
          <Text fontSize="lg" color="gray.500" mb={2}>
            Nenhuma sessão conectada
          </Text>
          <Text color="gray.400" mb={4}>
            Clique em "Conectar WhatsApp" para adicionar uma nova sessão
          </Text>
        </Box>
      ) : (
        <Box
          border="1px solid"
          borderColor="gray.200"
          borderRadius="lg"
          overflow="hidden"
        >
          <Table.Root variant="outline" size="sm">
            <Table.Header>
              <Table.Row bg="gray.50">
                <Table.ColumnHeader>Identificador</Table.ColumnHeader>
                <Table.ColumnHeader>Número</Table.ColumnHeader>
                <Table.ColumnHeader>Nome</Table.ColumnHeader>
                <Table.ColumnHeader>Plataforma</Table.ColumnHeader>
                <Table.ColumnHeader>Status</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">Ações</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {sessions.map((session) => (
                <Table.Row key={session.session_key}>
                  <Table.Cell fontWeight="medium">
                    <Flex align="center" gap={2}>
                      <FaWhatsapp color="#25D366" />
                      {session.phone_identifier}
                    </Flex>
                  </Table.Cell>
                  <Table.Cell>
                    {session.info?.wid
                      ? session.info.wid.replace("@c.us", "")
                      : "-"}
                  </Table.Cell>
                  <Table.Cell>{session.info?.pushname || "-"}</Table.Cell>
                  <Table.Cell>
                    {session.info?.platform
                      ? session.info.platform.charAt(0).toUpperCase() +
                        session.info.platform.slice(1)
                      : "-"}
                  </Table.Cell>
                  <Table.Cell>
                    {session.connected && session.ready ? (
                      <Badge colorPalette="green">Conectado</Badge>
                    ) : session.qrCodeAvailable ? (
                      <Badge colorPalette="yellow">QR Disponível</Badge>
                    ) : (
                      <Badge colorPalette="red">Desconectado</Badge>
                    )}
                  </Table.Cell>
                  <Table.Cell textAlign="end">
                    <Flex justify="flex-end" gap={2}>
                      {session.connected && (
                        <Button
                          size="sm"
                          colorPalette="red"
                          variant="outline"
                          onClick={() => openDisconnectModal(session)}
                        >
                          <VscDebugDisconnect  />
                          Desconectar
                        </Button>
                      )}
                    </Flex>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
      )}

      {/* Modal de Desconexão */}
      <Dialog.Root
        open={isDisconnectModalOpen}
        onOpenChange={(e) => setIsDisconnectModalOpen(e.open)}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Confirmar Desconexão</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Text>
                Tem certeza que deseja desconectar a sessão{" "}
                <strong>{selectedSession?.phone_identifier}</strong>?
              </Text>
              <Text mt={2} fontSize="sm" color="gray.600">
                Será necessário escanear o QR Code novamente para reconectar.
              </Text>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <Button variant="outline" disabled={isDisconnecting}>
                  Cancelar
                </Button>
              </Dialog.CloseTrigger>
              <Button
                colorPalette="red"
                onClick={confirmDisconnect}
                loading={isDisconnecting}
              >
                Desconectar
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Modal de Conexão */}
      <Dialog.Root
        open={isConnectModalOpen}
        onOpenChange={(e) => {
          if (!e.open) {
            closeConnectModal();
          }
        }}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="500px">
            <Dialog.Header>
              <Dialog.Title>Conectar WhatsApp</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              {!qrCheckInterval ? (
                <Box>
                  <Text mb={2} fontWeight="medium">
                    Identificador do Telefone
                  </Text>
                  <input
                    type="text"
                    placeholder="Ex: vendas, suporte, default..."
                    value={phoneIdentifier}
                    onChange={(e) => setPhoneIdentifier(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && phoneIdentifier.trim()) {
                        generateQRCode();
                      }
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
                  />
                  <Text mt={2} fontSize="sm" color="gray.600">
                    Use um identificador único para cada número (ex: vendas, suporte,
                    default)
                  </Text>
                </Box>
              ) : (
                <Box>
                  {qrCode ? (
                    <Box textAlign="center">
                      <Text mb={4} fontWeight="medium">
                        Escaneie o QR Code com seu WhatsApp
                      </Text>
                      <Box
                        display="inline-block"
                        p={4}
                        bg="white"
                        borderRadius="lg"
                        border="2px solid"
                        borderColor="gray.200"
                      >
                        <Image
                          src={qrCode}
                          alt="QR Code"
                          width="256px"
                          height="256px"
                        />
                      </Box>
                      <Text mt={4} fontSize="sm" color="gray.600">
                        Identificador: <strong>{phoneIdentifier}</strong>
                      </Text>
                      <Text mt={2} fontSize="sm" color="gray.500">
                        O QR Code será atualizado automaticamente a cada 5 segundos
                      </Text>
                    </Box>
                  ) : (
                    <Flex direction="column" align="center" py={8}>
                      <Spinner size="xl" mb={4} />
                      <Text fontSize="lg" fontWeight="medium" mb={2}>
                        Gerando QR Code...
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        Aguarde enquanto o QR Code é gerado
                      </Text>
                    </Flex>
                  )}
                </Box>
              )}
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <Button variant="outline" onClick={closeConnectModal}>
                  Cancelar
                </Button>
              </Dialog.CloseTrigger>
              {!qrCheckInterval && (
                <Button
                  colorPalette="green"
                  onClick={generateQRCode}
                  loading={isGeneratingQR}
                  disabled={!phoneIdentifier.trim()}
                >
                  Gerar QR Code
                </Button>
              )}
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Container>
  );
}

export default function WhatsAppPage() {
  return (
    <Suspense
      fallback={
        <Flex justify="center" align="center" minH="100vh">
          <Spinner size="xl" />
        </Flex>
      }
    >
      <WhatsAppPageContent />
    </Suspense>
  );
}
