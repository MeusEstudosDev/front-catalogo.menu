"use client";

import {
  Badge,
  Box,
  Button,
  Center,
  Container,
  DialogBackdrop,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogHeader,
  DialogRoot,
  Flex,
  Heading,
  SimpleGrid,
  Spinner,
  Text
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FaArchive,
  FaBan,
  FaBuilding,
  FaCalendarTimes,
  FaChartLine,
  FaCheckCircle,
  FaClock,
  FaDollarSign,
  FaEllipsisH,
  FaExclamationTriangle,
  FaHourglassHalf,
  FaPause,
  FaStore,
  FaTrash,
  FaUsers,
} from "react-icons/fa";

interface StatusSummary {
  total: number;
  active: number;
  pending: number;
  inactive: number;
  others: number;
}

function StatusCard({ title, data, rawData, icon: Icon, colorScheme, loading, onClick, onOthersClick }: {
  title: string;
  data: StatusSummary;
  rawData: any;
  icon: React.ElementType;
  colorScheme: string;
  loading: boolean;
  onClick?: () => void;
  onOthersClick: () => void;
}) {
  return (
    <Box
      p={5}
      bg="white"
      _dark={{ bg: "gray.800", borderColor: "gray.700" }}
      borderRadius="lg"
      boxShadow="sm"
      border="1px"
      borderColor="gray.200"
      transition="all 0.3s"
    >
      <Flex 
        alignItems="center" 
        mb={4}
        cursor={onClick ? "pointer" : "default"}
        onClick={onClick}
        _hover={onClick ? { opacity: 0.8 } : {}}
      >
        <Box color={`${colorScheme}.500`}>
          <Icon size={28} />
        </Box>
        <Heading as="h3" size="sm" ml={3}>
          {title}
        </Heading>
      </Flex>
      
      {loading ? (
        <Center py={4}>
          <Spinner size="md" />
        </Center>
      ) : (
        <>
          <Text fontSize="3xl" fontWeight="bold" mb={3}>
            {data.total}
          </Text>
          
          <SimpleGrid columns={2} gap={2}>
            <Box>
              <Text fontSize="xs" color="gray.500">Ativos</Text>
              <Flex alignItems="center">
                <FaCheckCircle size={12} color="green" />
                <Text fontSize="sm" fontWeight="semibold" ml={1}>{data.active}</Text>
              </Flex>
            </Box>
            <Box>
              <Text fontSize="xs" color="gray.500">Pendentes</Text>
              <Flex alignItems="center">
                <FaClock size={12} color="orange" />
                <Text fontSize="sm" fontWeight="semibold" ml={1}>{data.pending}</Text>
              </Flex>
            </Box>
            <Box>
              <Text fontSize="xs" color="gray.500">Inativos</Text>
              <Flex alignItems="center">
                <FaPause size={12} color="gray" />
                <Text fontSize="sm" fontWeight="semibold" ml={1}>{data.inactive}</Text>
              </Flex>
            </Box>
            <Box
              cursor="pointer"
              onClick={(e) => {
                e.stopPropagation();
                onOthersClick();
              }}
              _hover={{ bg: "gray.50", _dark: { bg: "gray.700" } }}
              p={1}
              borderRadius="md"
              transition="all 0.2s"
            >
              <Text fontSize="xs" color="gray.500">Outros</Text>
              <Flex alignItems="center">
                <FaEllipsisH size={12} color="blue" />
                <Text fontSize="sm" fontWeight="semibold" ml={1}>{data.others}</Text>
              </Flex>
            </Box>
          </SimpleGrid>
        </>
      )}
    </Box>
  );
}

interface StatusDetails {
  count: number;
  active: number;
  banned: number;
  deleted: number;
  inactive: number;
  pending: number;
  suspended: number;
}

interface BusinessDetails extends StatusDetails {
  archived: number;
  expired: number;
  paymentPending: number;
  trial: number;
}

function DetailsModal({ isOpen, onClose, title, data, type }: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: BusinessDetails | StatusDetails | null;
  type: 'business' | 'user';
}) {
  const businessData = type === 'business' ? data as BusinessDetails : null;

  return (
    <DialogRoot 
      open={isOpen} 
      onOpenChange={(e) => {
        if (!e.open) {
          onClose();
        }
      }}
    >
      <DialogBackdrop 
        bg="blackAlpha.600"
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        zIndex={1400}
      />
      <DialogContent
        position="fixed"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        maxW="600px"
        w="90%"
        maxH="80vh"
        overflow="auto"
        zIndex={1500}
      >
        <DialogHeader>{title} - Detalhes Completos</DialogHeader>
        <DialogCloseTrigger />
        <DialogBody pb={6}>
          {data ? (
            <SimpleGrid columns={2} gap={4}>
            <Box>
              <Text fontSize="sm" fontWeight="bold" color="gray.600" _dark={{ color: "gray.400" }} mb={2}>
                Status Principal
              </Text>
              <Flex alignItems="center" mb={2}>
                <FaCheckCircle color="green" size={16} />
                <Text ml={2}>Ativos: <strong>{data.active}</strong></Text>
              </Flex>
              <Flex alignItems="center" mb={2}>
                <FaClock color="orange" size={16} />
                <Text ml={2}>Pendentes: <strong>{data.pending}</strong></Text>
              </Flex>
              <Flex alignItems="center" mb={2}>
                <FaPause color="gray" size={16} />
                <Text ml={2}>Inativos: <strong>{data.inactive}</strong></Text>
              </Flex>
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="bold" color="gray.600" _dark={{ color: "gray.400" }} mb={2}>
                Status Crítico
              </Text>
              <Flex alignItems="center" mb={2}>
                <FaBan color="red" size={16} />
                <Text ml={2}>Banidos: <strong>{data.banned}</strong></Text>
              </Flex>
              <Flex alignItems="center" mb={2}>
                <FaExclamationTriangle color="orange" size={16} />
                <Text ml={2}>Suspensos: <strong>{data.suspended}</strong></Text>
              </Flex>
              <Flex alignItems="center" mb={2}>
                <FaTrash color="red" size={16} />
                <Text ml={2}>Deletados: <strong>{data.deleted}</strong></Text>
              </Flex>
            </Box>

            {businessData && (
              <Box gridColumn="1 / -1">
                <Text fontSize="sm" fontWeight="bold" color="gray.600" _dark={{ color: "gray.400" }} mb={2}>
                  Status Específicos (Empresas)
                </Text>
                <SimpleGrid columns={2} gap={2}>
                  <Flex alignItems="center">
                    <FaHourglassHalf color="cyan" size={16} />
                    <Text ml={2}>Trial: <strong>{businessData.trial}</strong></Text>
                  </Flex>
                  <Flex alignItems="center">
                    <FaDollarSign color="green" size={16} />
                    <Text ml={2}>Pag. Pendente: <strong>{businessData.paymentPending}</strong></Text>
                  </Flex>
                  <Flex alignItems="center">
                    <FaCalendarTimes color="red" size={16} />
                    <Text ml={2}>Expiradas: <strong>{businessData.expired}</strong></Text>
                  </Flex>
                  <Flex alignItems="center">
                    <FaArchive color="gray" size={16} />
                    <Text ml={2}>Arquivadas: <strong>{businessData.archived}</strong></Text>
                  </Flex>
                </SimpleGrid>
              </Box>
            )}

            <Box gridColumn="1 / -1" mt={4} pt={4} borderTop="1px" borderColor="gray.200" _dark={{ borderColor: "gray.700" }}>
              <Flex alignItems="center" justifyContent="space-between">
                <Text fontSize="lg" fontWeight="bold">Total:</Text>
                <Badge colorScheme="blue" fontSize="lg" px={3} py={1}>
                  {data?.count ?? 0}
                </Badge>
              </Flex>
            </Box>
          </SimpleGrid>
          ) : (
            <Text>Nenhum dado disponível</Text>
          )}
        </DialogBody>
      </DialogContent>
    </DialogRoot>
  );
}

interface DashboardInfo {
  business: BusinessDetails;
  user: StatusDetails;
  userManagement: StatusDetails;
  userMarketplace: StatusDetails;
  userApplication: StatusDetails;
}

export default function ManageSystemPage() {
  const router = useRouter();
  const [dashboardInfo, setDashboardInfo] = useState<DashboardInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<{
    title: string;
    data: BusinessDetails | StatusDetails | null;
    type: 'business' | 'user';
  }>({ title: '', data: null, type: 'user' });

  useEffect(() => {
    async function fetchDashboardInfo() {
      try {    
        const token = await fetch("/api/get-cookies?key=access_token").then((r) =>
          r.json()
        );

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}management/info-dashboard`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setDashboardInfo(data);
        }
      } catch (error) {
        console.error('Erro ao buscar informações do dashboard:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardInfo();
  }, []);

  const handleBusinessClick = () => {
    router.push('/manage-system/businesses');
  };

  const handleUsersClick = () => {
    router.push('/manage-system/users');
  };

  // Funções auxiliares para calcular os dados resumidos
  const getBusinessSummary = (): StatusSummary => {
    if (!dashboardInfo) return { total: 0, active: 0, pending: 0, inactive: 0, others: 0 };
    const { business } = dashboardInfo;
    return {
      total: business.count,
      active: business.active,
      pending: business.pending,
      inactive: business.inactive,
      others: business.trial + business.paymentPending + business.suspended + business.expired + business.banned + business.archived + business.deleted,
    };
  };

  const getUserSummary = (type: 'user' | 'userManagement' | 'userMarketplace' | 'userApplication'): StatusSummary => {
    if (!dashboardInfo) return { total: 0, active: 0, pending: 0, inactive: 0, others: 0 };
    const data = dashboardInfo[type];
    return {
      total: data.count,
      active: data.active,
      pending: data.pending,
      inactive: data.inactive,
      others: data.banned + data.suspended + data.deleted,
    };
  };

  const openModal = (title: string, data: BusinessDetails | StatusDetails, type: 'business' | 'user') => {
    console.log('Opening modal:', { title, data, type });
    setModalData({ title, data, type });
    setModalOpen(true);
  };

  return (
    <Container maxW="container.xl" py={8}>
      <Box>
        <Box mb={4} gap={2} display="flex">
          <Button onClick={() => router.push('/manage-system/whatsapp')}>Whatsapps</Button>
          <Button onClick={() => router.push('/manage-system/notifications')}>Notificações</Button>
        </Box>

        <Box mb={8}>
          <Heading as="h2" size="md" mb={4} color="gray.700" _dark={{ color: "gray.300" }}>
            📊 Empresas
          </Heading>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
            <StatusCard
              title="Empresas"
              data={getBusinessSummary()}
              rawData={dashboardInfo?.business}
              icon={FaBuilding}
              colorScheme="blue"
              loading={loading}
              onClick={handleBusinessClick}
              onOthersClick={() => {
                const mockBusiness: BusinessDetails = {
                  count: 150,
                  active: 100,
                  banned: 5,
                  deleted: 3,
                  inactive: 10,
                  pending: 15,
                  suspended: 2,
                  archived: 8,
                  expired: 4,
                  paymentPending: 3,
                  trial: 0
                };
                openModal('Empresas', dashboardInfo?.business || mockBusiness, 'business');
              }}
            />
          </SimpleGrid>
        </Box>

        <Box>
          <Heading as="h2" size="md" mb={4} color="gray.700" _dark={{ color: "gray.300" }}>
            👥 Usuários
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
            <StatusCard
              title="Usuários (Geral)"
              data={getUserSummary('user')}
              rawData={dashboardInfo?.user}
              icon={FaUsers}
              colorScheme="green"
              loading={loading}
              onClick={handleUsersClick}
              onOthersClick={() => {
                const mockUser: StatusDetails = {
                  count: 500,
                  active: 450,
                  banned: 10,
                  deleted: 5,
                  inactive: 20,
                  pending: 10,
                  suspended: 5
                };
                openModal('Usuários (Geral)', dashboardInfo?.user || mockUser, 'user');
              }}
            />

            <StatusCard
              title="Usuários Gerenciamento"
              data={getUserSummary('userManagement')}
              rawData={dashboardInfo?.userManagement}
              icon={FaUsers}
              colorScheme="purple"
              loading={loading}
              onClick={handleUsersClick}
              onOthersClick={() => dashboardInfo && openModal('Usuários Gerenciamento', dashboardInfo.userManagement, 'user')}
            />

            <StatusCard
              title="Usuários Marketplace"
              data={getUserSummary('userMarketplace')}
              rawData={dashboardInfo?.userMarketplace}
              icon={FaStore}
              colorScheme="orange"
              loading={loading}
              onClick={handleUsersClick}
              onOthersClick={() => dashboardInfo && openModal('Usuários Marketplace', dashboardInfo.userMarketplace, 'user')}
            />

            <StatusCard
              title="Usuários Aplicação"
              data={getUserSummary('userApplication')}
              rawData={dashboardInfo?.userApplication}
              icon={FaChartLine}
              colorScheme="teal"
              loading={loading}
              onClick={handleUsersClick}
              onOthersClick={() => dashboardInfo && openModal('Usuários Aplicação', dashboardInfo.userApplication, 'user')}
            />
          </SimpleGrid>
        </Box>

        {/* Modal de Detalhes */}
        <DetailsModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={modalData.title}
          data={modalData.data}
          type={modalData.type}
        />

        {/* Área para futuros gráficos e relatórios */}
        <Box mt={8}>
          {/* Seções administrativas serão adicionadas aqui */}
        </Box>
      </Box>
    </Container>
  );
}
