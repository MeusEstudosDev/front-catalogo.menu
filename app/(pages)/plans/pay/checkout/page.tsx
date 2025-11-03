"use client";

import { GoogleMap } from "@/components/account";
import { formatCep } from "@/components/account/utils";
import { useColorModeValue } from "@/components/ui/color-mode";
import { toaster } from "@/components/ui/toaster";
import {
  Badge,
  Box,
  Button,
  Card,
  createListCollection,
  Dialog,
  Flex,
  Grid,
  GridItem,
  Heading,
  Input,
  List,
  Select,
  Separator,
  Spinner,
  Stack,
  Tabs,
  Text,
} from "@chakra-ui/react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useEffect, useState } from "react";
import { FaPlus } from "react-icons/fa";
import { FiAlertOctagon, FiMapPin, FiTag, FiUser } from "react-icons/fi";
import { IoMdArrowDropright } from "react-icons/io";
import { LuCheck, LuCreditCard } from "react-icons/lu";
import { MdAdd } from "react-icons/md";

interface PlanData {
  planId: string;
  planName: string;
  billingCycle: "monthly" | "yearly";
  priceMonthly: number;
  priceYearly: number;
  discountPix: number;
  discountYearly: number;
  currency: string;
  trialDays: number;
  maxUsers: number | null;
  maxProducts: number | null;
  maxOrders: number | null;
  couponDiscount: number;
  couponCode: string;
}

interface IProfile {
  id: string;
  name: string;
  email: string;
  cpf: string;
  birth_date: string;
  gender: string;
}

interface IUserAddress {
  id: string;
  type: "RESIDENTIAL" | "COMMERCIAL" | "OTHER";
  cep: string;
  city: string;
  state: string;
  district: string;
  street: string;
  number: string;
  complement: string;
  primary: boolean;
  latitude: number | null;
  longitude: number | null;
}

const CheckoutPageContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [profile, setProfile] = useState<IProfile | null>(null);
  const [addresses, setAddresses] = useState<IUserAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<IUserAddress | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [currentTab, setCurrentTab] = useState<"customer" | "payment">("customer");
  
  // Estados do modal de criar endereço
  const [isCreateAddressModalOpen, setIsCreateAddressModalOpen] = useState(false);
  const [createAddressStep, setCreateAddressStep] = useState<1 | 2>(1);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [isLoadingGeocode, setIsLoadingGeocode] = useState(false);
  const [cepError, setCepError] = useState<string>("");
  const [newAddress, setNewAddress] = useState({
    type: "RESIDENTIAL" as const,
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

  // Cores dinâmicas para modo claro/escuro
  const bg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const mutedColor = useColorModeValue("gray.600", "gray.400");
  const accentColor = useColorModeValue("blue.600", "blue.400");
  const successColor = useColorModeValue("green.600", "green.400");

  // Collection para o select de tipo de endereço
  const addressTypeCollection = createListCollection({
    items: [
      { value: "RESIDENTIAL", label: "Residencial" },
      { value: "COMMERCIAL", label: "Comercial" },
      { value: "OTHER", label: "Outro" },
    ],
  });

  useEffect(() => {
    loadPlanData();
    loadProfile();
    fetchAddresses();
  }, []);

  const loadPlanData = () => {
    const planId = searchParams.get("planId");
    const planName = searchParams.get("planName");
    const billingCycle = searchParams.get("billingCycle") as "monthly" | "yearly";
    const priceMonthly = parseFloat(searchParams.get("priceMonthly") || "0");
    const priceYearly = parseFloat(searchParams.get("priceYearly") || "0");
    const discountPix = parseFloat(searchParams.get("discountPix") || "0");
    const discountYearly = parseFloat(searchParams.get("discountYearly") || "0");
    const currency = searchParams.get("currency") || "BRL";
    const trialDays = parseInt(searchParams.get("trialDays") || "0");
    const maxUsers = searchParams.get("maxUsers") ? parseInt(searchParams.get("maxUsers")!) : null;
    const maxProducts = searchParams.get("maxProducts") ? parseInt(searchParams.get("maxProducts")!) : null;
    const maxOrders = searchParams.get("maxOrders") ? parseInt(searchParams.get("maxOrders")!) : null;
    const couponDiscount = parseFloat(searchParams.get("couponDiscount") || "0");
    const couponCode = searchParams.get("couponCode") || "";

    if (!planId || !planName) {
      toaster.error({
        title: "Erro",
        description: "Plano inválido. Redirecionando...",
      });
      router.push("/public/plans");
      return;
    }

    setPlanData({
      planId,
      planName,
      billingCycle,
      priceMonthly,
      priceYearly,
      discountPix,
      discountYearly,
      currency,
      trialDays,
      maxUsers,
      maxProducts,
      maxOrders,
      couponDiscount,
      couponCode,
    });
  };

  const loadProfile = async () => {
    setIsLoadingProfile(true);
    try {
      const profileCookie = await fetch("/api/get-cookies?key=profile").then((res) => res.json());
      
      if (profileCookie) {
        const profileData = JSON.parse(profileCookie);
        setProfile(profileData);
      }
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
      toaster.error({
        title: "Erro ao carregar perfil",
        description: "Não foi possível carregar os dados do perfil.",
      });
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const fetchAddresses = async () => {
    setIsLoadingAddresses(true);
    try {
      const token = await fetch("/api/get-cookies?key=access_token").then((res) => res.json());

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}users/addresses`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAddresses(data);
        
        // Seleciona o endereço principal ou o primeiro da lista
        const primaryAddress = data.find((addr: IUserAddress) => addr.primary);
        setSelectedAddress(primaryAddress || data[0] || null);
      }
    } catch (error) {
      console.error("Erro ao carregar endereços:", error);
      toaster.error({
        title: "Erro ao carregar endereços",
        description: "Não foi possível carregar a lista de endereços.",
      });
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency,
    }).format(price);
  };

  // Funções para gerenciar endereços (baseadas no AddressesTab)
  const fetchCepData = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return null;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        throw new Error("CEP não encontrado");
      }

      return {
        street: data.logradouro || "",
        district: data.bairro || "",
        city: data.localidade || "",
        state: data.uf || "",
      };
    } catch (error) {
      throw new Error("Erro ao buscar CEP");
    }
  };

  const getCoordinates = async (address: string) => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_GEOCODING_API_KEY;
      if (!apiKey) {
        console.error("Google API Key não configurada");
        return null;
      }

      const encodedAddress = encodeURIComponent(address);
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`
      );
      const data = await response.json();

      if (data.status === "OK" && data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return {
          latitude: location.lat,
          longitude: location.lng,
        };
      }

      return null;
    } catch (error) {
      console.error("Erro ao obter coordenadas:", error);
      return null;
    }
  };

  const handleCepSearch = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    setIsLoadingCep(true);
    setCepError("");

    try {
      const cepData = await fetchCepData(cleanCep);

      if (cepData) {
        setNewAddress((prev) => ({
          ...prev,
          street: cepData.street,
          district: cepData.district,
          city: cepData.city,
          state: cepData.state,
        }));
      }
    } catch (error: any) {
      setCepError(error.message);
      toaster.error({
        title: "Erro ao buscar CEP",
        description: error.message,
      });
    } finally {
      setIsLoadingCep(false);
    }
  };

  const handleNextToMapStep = async () => {
    const address = newAddress;

    if (!address.street || !address.number || !address.district || !address.city || !address.state || !address.cep) {
      toaster.error({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios antes de continuar.",
      });
      return;
    }

    const fullAddress = `${address.street}, ${address.number}, ${address.district}, ${address.city}, ${address.state}, Brasil`;

    setIsLoadingGeocode(true);
    try {
      const coordinates = await getCoordinates(fullAddress);

      if (coordinates) {
        setNewAddress((prev) => ({
          ...prev,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
        }));
        setCreateAddressStep(2);
      } else {
        toaster.error({
          title: "Erro ao obter localização",
          description: "Não foi possível obter as coordenadas do endereço. Verifique os dados e tente novamente.",
        });
      }
    } catch (error) {
      toaster.error({
        title: "Erro ao obter localização",
        description: "Ocorreu um erro ao buscar as coordenadas. Tente novamente.",
      });
    } finally {
      setIsLoadingGeocode(false);
    }
  };

  const addAddress = async () => {
    if (!newAddress.street.trim() || !newAddress.number.trim() || !newAddress.district.trim() || !newAddress.city.trim() || !newAddress.state.trim() || !newAddress.cep.trim()) {
      toaster.error({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
      });
      return;
    }

    setIsAddingAddress(true);
    try {
      const token = await fetch("/api/get-cookies?key=access_token").then((res) => res.json());

      const addressData = {
        type: newAddress.type,
        cep: newAddress.cep.replace(/\D/g, ""),
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

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}users/addresses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(addressData),
      });

      if (response.ok) {
        toaster.success({
          title: "Endereço adicionado!",
          description: "Endereço foi adicionado com sucesso.",
        });
        closeCreateAddressModal();
        fetchAddresses();
      } else {
        const error = await response.json();
        throw new Error(error.message?.[0] || "Erro ao adicionar endereço");
      }
    } catch (error: any) {
      toaster.error({
        title: "Erro ao adicionar endereço",
        description: error.message || "Não foi possível adicionar o endereço.",
      });
    } finally {
      setIsAddingAddress(false);
    }
  };

  const openCreateAddressModal = () => {
    setNewAddress({
      type: "RESIDENTIAL",
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
    setIsCreateAddressModalOpen(true);
  };

  const closeCreateAddressModal = () => {
    setIsCreateAddressModalOpen(false);
    setCreateAddressStep(1);
    setNewAddress({
      type: "RESIDENTIAL",
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

  const handleFinishPurchase = () => {
    if (!selectedAddress) {
      toaster.error({
        title: "Endereço obrigatório",
        description: "Selecione um endereço de cobrança antes de continuar.",
      });
      setCurrentTab("customer");
      return;
    }

    toaster.create({
      title: "Processando pagamento",
      description: "Gerando código PIX...",
      type: "info",
    });

    // Aqui você integraria com o gateway de pagamento
  };

  if (!planData || isLoadingProfile) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg={bg}>
        <Spinner size="xl" color={accentColor} />
      </Flex>
    );
  }

  const basePrice = planData.billingCycle === "monthly" ? planData.priceMonthly : planData.priceYearly;
  const pixDiscount = basePrice * (planData.discountPix / 100);
  const yearlyDiscount = planData.billingCycle === "yearly" ? basePrice * (planData.discountYearly / 100) : 0;
  const couponDiscountAmount = (basePrice - pixDiscount - yearlyDiscount) * (planData.couponDiscount / 100);
  const totalDiscount = pixDiscount + yearlyDiscount + couponDiscountAmount;
  const finalPrice = basePrice - totalDiscount;

  return (
    <Box bg={bg} minH="100vh" py={16} px={6}>
      <Box maxW="1200px" mx="auto">
        {/* Cabeçalho */}
        <Box mb={8}>
          <Heading as="h1" size="2xl" mb={2} color={textColor}>
            Checkout - Plano {planData.planName}
          </Heading>
          <Text color={mutedColor}>Complete os dados para finalizar sua assinatura</Text>
        </Box>

        <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={8}>
          {/* Área Principal - Tabs */}
          <GridItem>
            <Tabs.Root value={currentTab} onValueChange={(e) => setCurrentTab(e.value as "customer" | "payment")}>
              <Tabs.List>
                <Tabs.Trigger value="customer">
                  <FiUser />
                  Dados do Cliente
                </Tabs.Trigger>
                <Tabs.Trigger value="payment">
                  <LuCreditCard />
                  Pagamento
                </Tabs.Trigger>
              </Tabs.List>

              {/* Tab: Dados do Cliente */}
              <Tabs.Content value="customer">
                <Card.Root bg={cardBg} borderColor={cardBorder} borderWidth={1} mt={4}>
                  <Card.Header>
                    <Heading as="h3" size="md" color={textColor}>
                      Informações Pessoais
                    </Heading>
                  </Card.Header>
                  <Card.Body>
                    {profile && (
                      <Stack gap={4}>
                        <Box>
                          <Text fontSize="sm" fontWeight="bold" color={mutedColor} mb={1}>
                            Nome Completo
                          </Text>
                          <Text color={textColor}>{profile.name}</Text>
                        </Box>
                        <Box>
                          <Text fontSize="sm" fontWeight="bold" color={mutedColor} mb={1}>
                            E-mail
                          </Text>
                          <Text color={textColor}>{profile.email}</Text>
                        </Box>
                        <Box>
                          <Text fontSize="sm" fontWeight="bold" color={mutedColor} mb={1}>
                            CPF
                          </Text>
                          <Text color={textColor}>
                            {profile.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}
                          </Text>
                        </Box>
                      </Stack>
                    )}
                  </Card.Body>
                </Card.Root>

                {/* Endereços */}
                <Card.Root bg={cardBg} borderColor={cardBorder} borderWidth={1} mt={4}>
                  <Card.Header>
                    <Flex justify="space-between" align="center">
                      <Heading as="h3" size="md" color={textColor}>
                        Endereço de Cobrança
                      </Heading>
                      {addresses.length > 0 && (
                        <Button size="sm" variant="outline" onClick={openCreateAddressModal}>
                          <FaPlus />
                          Adicionar
                        </Button>
                      )}
                    </Flex>
                  </Card.Header>
                  <Card.Body>
                    {isLoadingAddresses ? (
                      <Flex justify="center" py={8}>
                        <Spinner size="md" />
                      </Flex>
                    ) : addresses.length === 0 ? (
                      <Box textAlign="center" py={8} border="1px dashed" borderColor={cardBorder} borderRadius="md">
                        <FiMapPin size={32} style={{ margin: "0 auto 16px" }} color={mutedColor} />
                        <Text color={mutedColor} mb={4}>
                          Nenhum endereço cadastrado
                        </Text>
                        <Button onClick={openCreateAddressModal}>
                          <FaPlus />
                          Adicionar Endereço
                        </Button>
                      </Box>
                    ) : (
                      <Stack gap={3}>
                        {addresses.map((address) => (
                          <Box
                            key={address.id}
                            p={4}
                            border="2px solid"
                            borderColor={selectedAddress?.id === address.id ? accentColor : cardBorder}
                            borderRadius="md"
                            cursor="pointer"
                            onClick={() => setSelectedAddress(address)}
                            transition="all 0.2s"
                            _hover={{ borderColor: accentColor }}
                          >
                            <Flex justify="space-between" align="start" mb={2}>
                              <Flex align="center" gap={2}>
                                <Text fontSize="sm" fontWeight="bold" color={accentColor}>
                                  {address.type === "RESIDENTIAL" && "Residencial"}
                                  {address.type === "COMMERCIAL" && "Comercial"}
                                  {address.type === "OTHER" && "Outro"}
                                </Text>
                                {address.primary && (
                                  <Badge colorPalette="green" variant="solid" size="sm">
                                    Principal
                                  </Badge>
                                )}
                              </Flex>
                              {selectedAddress?.id === address.id && (
                                <Badge colorPalette="blue" variant="solid" size="sm">
                                  <LuCheck /> Selecionado
                                </Badge>
                              )}
                            </Flex>
                            <Text fontSize="sm" color={textColor}>
                              {address.street}, {address.number}
                              {address.complement && ` - ${address.complement}`}
                            </Text>
                            <Text fontSize="sm" color={mutedColor}>
                              {address.district}, {address.city} - {address.state}
                            </Text>
                            <Text fontSize="sm" color={mutedColor}>
                              CEP: {formatCep(address.cep)}
                            </Text>
                          </Box>
                        ))}
                      </Stack>
                    )}
                  </Card.Body>
                </Card.Root>

                {/* Botão para próxima aba */}
                <Flex justify="flex-end" mt={4}>
                  <Button
                    colorPalette="blue"
                    onClick={() => setCurrentTab("payment")}
                    disabled={!selectedAddress}
                  >
                    Continuar para Pagamento →
                  </Button>
                </Flex>
              </Tabs.Content>

              {/* Tab: Pagamento */}
              <Tabs.Content value="payment">
                <Card.Root bg={cardBg} borderColor={cardBorder} borderWidth={1} mt={4}>
                  <Card.Header>
                    <Heading as="h3" size="md" color={textColor}>
                      Método de Pagamento
                    </Heading>
                  </Card.Header>
                  <Card.Body>
                    <Stack gap={4}>
                      {/* PIX - Habilitado */}
                      <Box
                        p={4}
                        border="2px solid"
                        borderColor={accentColor}
                        borderRadius="md"
                        bg={useColorModeValue("blue.50", "blue.900")}
                      >
                        <Flex align="center" gap={3} mb={2}>
                          <Box fontSize="2xl">🔷</Box>
                          <Box flex={1}>
                            <Text fontWeight="bold" color={textColor}>
                              PIX
                            </Text>
                            <Text fontSize="sm" color={successColor}>
                              ✓ Aprovação instantânea
                            </Text>
                          </Box>
                          <Badge colorPalette="green" variant="solid">
                            {planData.discountPix}% OFF
                          </Badge>
                        </Flex>
                        <Text fontSize="xs" color={mutedColor}>
                          Pagamento via QR Code ou Pix Copia e Cola
                        </Text>
                      </Box>

                      {/* Cartão de Crédito - Desabilitado */}
                      <Box
                        p={4}
                        border="1px solid"
                        borderColor={cardBorder}
                        borderRadius="md"
                        opacity={0.5}
                        cursor="not-allowed"
                      >
                        <Flex align="center" gap={3} mb={2}>
                          <Box fontSize="2xl">💳</Box>
                          <Box flex={1}>
                            <Text fontWeight="bold" color={mutedColor}>
                              Cartão de Crédito
                            </Text>
                            <Text fontSize="sm" color={mutedColor}>
                              Em breve
                            </Text>
                          </Box>
                          <Badge colorPalette="gray" variant="outline">
                            Indisponível
                          </Badge>
                        </Flex>
                      </Box>

                      {/* Boleto - Desabilitado */}
                      <Box
                        p={4}
                        border="1px solid"
                        borderColor={cardBorder}
                        borderRadius="md"
                        opacity={0.5}
                        cursor="not-allowed"
                      >
                        <Flex align="center" gap={3} mb={2}>
                          <Box fontSize="2xl">🧾</Box>
                          <Box flex={1}>
                            <Text fontWeight="bold" color={mutedColor}>
                              Boleto Bancário
                            </Text>
                            <Text fontSize="sm" color={mutedColor}>
                              Em breve
                            </Text>
                          </Box>
                          <Badge colorPalette="gray" variant="outline">
                            Indisponível
                          </Badge>
                        </Flex>
                      </Box>
                    </Stack>
                  </Card.Body>
                </Card.Root>

                {/* Botões de ação */}
                <Flex justify="space-between" mt={4}>
                  <Button variant="outline" onClick={() => setCurrentTab("customer")}>
                    ← Voltar
                  </Button>
                  <Button
                    colorPalette="blue"
                    size="lg"
                    onClick={handleFinishPurchase}
                  >
                    Finalizar Compra
                  </Button>
                </Flex>
              </Tabs.Content>
            </Tabs.Root>
          </GridItem>

          {/* Resumo do Pedido (Sidebar) */}
          <GridItem>
            <Card.Root bg={cardBg} borderColor={cardBorder} borderWidth={1} position="sticky" top={4}>
              <Card.Header>
                <Heading as="h2" size="lg" color={textColor}>
                  Resumo do Pedido
                </Heading>
              </Card.Header>
              <Card.Body>
                <Stack gap={4}>
                  {/* Plano */}
                  <Box>
                    <Text fontSize="sm" color={mutedColor} mb={1}>
                      Plano Selecionado
                    </Text>
                    <Flex justify="space-between" align="center">
                      <Text fontWeight="bold" color={textColor}>
                        {planData.planName}
                      </Text>
                      <Badge colorPalette="blue" variant="solid">
                        {planData.billingCycle === "monthly" ? "Mensal" : "Anual"}
                      </Badge>
                    </Flex>
                  </Box>

                  <Separator />

                  {/* Valor Base */}
                  <Flex justify="space-between" align="center">
                    <Text color={mutedColor}>Valor do plano</Text>
                    <Text color={textColor} fontWeight="medium">
                      {formatPrice(basePrice, planData.currency)}
                    </Text>
                  </Flex>

                  {/* Descontos */}
                  {planData.discountPix > 0 && (
                    <Flex justify="space-between" align="center">
                      <Flex align="center" gap={1}>
                        <IoMdArrowDropright color="green" />
                        <Text fontSize="sm" color={successColor}>
                          Desconto PIX ({planData.discountPix}%)
                        </Text>
                      </Flex>
                      <Text fontSize="sm" color={successColor}>
                        -{formatPrice(pixDiscount, planData.currency)}
                      </Text>
                    </Flex>
                  )}

                  {planData.billingCycle === "yearly" && planData.discountYearly > 0 && (
                    <Flex justify="space-between" align="center">
                      <Flex align="center" gap={1}>
                        <MdAdd color="green" />
                        <Text fontSize="sm" color={successColor}>
                          Desconto Anual ({planData.discountYearly}%)
                        </Text>
                      </Flex>
                      <Text fontSize="sm" color={successColor}>
                        -{formatPrice(yearlyDiscount, planData.currency)}
                      </Text>
                    </Flex>
                  )}

                  {planData.couponDiscount > 0 && (
                    <Flex justify="space-between" align="center">
                      <Flex align="center" gap={1}>
                        <FiTag color="green" />
                        <Text fontSize="sm" color={successColor}>
                          Cupom ({planData.couponDiscount}%)
                        </Text>
                      </Flex>
                      <Text fontSize="sm" color={successColor}>
                        -{formatPrice(couponDiscountAmount, planData.currency)}
                      </Text>
                    </Flex>
                  )}

                  <Separator />

                  {/* Total */}
                  <Box bg={useColorModeValue("blue.50", "blue.900")} p={4} borderRadius="md">
                    <Flex justify="space-between" align="center">
                      <Text fontWeight="bold" color={textColor}>
                        Total a pagar
                      </Text>
                      <Box textAlign="right">
                        {totalDiscount > 0 && (
                          <Text fontSize="sm" color={mutedColor} textDecoration="line-through">
                            {formatPrice(basePrice, planData.currency)}
                          </Text>
                        )}
                        <Text fontSize="2xl" fontWeight="bold" color={accentColor}>
                          {formatPrice(finalPrice, planData.currency)}
                        </Text>
                        <Text fontSize="sm" color={mutedColor}>
                          /{planData.billingCycle === "monthly" ? "mês" : "ano"}
                        </Text>
                      </Box>
                    </Flex>
                  </Box>

                  {/* Economia Total */}
                  {totalDiscount > 0 && (
                    <Badge colorPalette="green" variant="solid" p={2}>
                      <FiAlertOctagon />
                      Você está economizando {formatPrice(totalDiscount, planData.currency)}!
                    </Badge>
                  )}

                  {/* Benefícios */}
                  <Box pt={4} borderTopWidth={1} borderColor={cardBorder}>
                    <Text fontSize="sm" fontWeight="bold" mb={3} color={textColor}>
                      Benefícios Inclusos
                    </Text>
                    <List.Root gap={2} variant="plain">
                      {planData.maxUsers && (
                        <List.Item display="flex" alignItems="center" gap={2}>
                          <LuCheck color="green" size={16} />
                          <Text fontSize="xs" color={textColor}>
                            Até {planData.maxUsers} usuários
                          </Text>
                        </List.Item>
                      )}
                      {planData.maxProducts && (
                        <List.Item display="flex" alignItems="center" gap={2}>
                          <LuCheck color="green" size={16} />
                          <Text fontSize="xs" color={textColor}>
                            Até {planData.maxProducts} produtos
                          </Text>
                        </List.Item>
                      )}
                      {planData.maxOrders && (
                        <List.Item display="flex" alignItems="center" gap={2}>
                          <LuCheck color="green" size={16} />
                          <Text fontSize="xs" color={textColor}>
                            Até {planData.maxOrders} pedidos/mês
                          </Text>
                        </List.Item>
                      )}
                    </List.Root>
                  </Box>
                </Stack>
              </Card.Body>
            </Card.Root>
          </GridItem>
        </Grid>
      </Box>

      {/* Modal de Criar Endereço */}
      <Dialog.Root
        open={isCreateAddressModalOpen}
        onOpenChange={(details) => {
          if (!details.open) {
            closeCreateAddressModal();
          }
        }}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="600px">
            <Dialog.Header>
              <Dialog.Title>Adicionar Novo Endereço - Etapa {createAddressStep} de 2</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              {createAddressStep === 1 ? (
                <Box display="flex" flexDir="column" gap={4}>
                  <Box>
                    <Text fontSize="sm" mb={1}>
                      Tipo
                    </Text>
                    <Select.Root
                      value={[newAddress.type]}
                      onValueChange={(e) =>
                        setNewAddress({
                          ...newAddress,
                          type: e.value[0] as any,
                        })
                      }
                      size="md"
                      collection={addressTypeCollection}
                      positioning={{ sameWidth: true }}
                    >
                      <Select.Trigger>
                        <Select.ValueText placeholder="Selecione o tipo" />
                      </Select.Trigger>
                      <Select.Content>
                        {addressTypeCollection.items.map((item) => (
                          <Select.Item key={item.value} item={item}>
                            {item.label}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Root>
                  </Box>

                  <Box>
                    <Text fontSize="sm" mb={1}>
                      CEP *
                    </Text>
                    <Input
                      placeholder="00000-000"
                      value={formatCep(newAddress.cep)}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        setNewAddress({ ...newAddress, cep: value });
                        if (value.length === 8) {
                          handleCepSearch(value);
                        }
                      }}
                      maxLength={9}
                      borderColor={cepError ? "red.500" : undefined}
                    />
                  </Box>

                  <Box display="grid" gridTemplateColumns="3fr 1fr" gap={2}>
                    <Box>
                      <Text fontSize="sm" mb={1}>
                        Rua *
                      </Text>
                      <Input
                        placeholder="Nome da rua"
                        value={newAddress.street}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, street: e.target.value })
                        }
                        disabled={!newAddress.cep || newAddress.cep.length < 8 || isLoadingCep}
                      />
                    </Box>
                    <Box>
                      <Text fontSize="sm" mb={1}>
                        Número *
                      </Text>
                      <Input
                        placeholder="123"
                        value={newAddress.number}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, number: e.target.value })
                        }
                        disabled={!newAddress.cep || newAddress.cep.length < 8 || isLoadingCep}
                      />
                    </Box>
                  </Box>

                  <Box>
                    <Text fontSize="sm" mb={1}>
                      Complemento
                    </Text>
                    <Input
                      placeholder="Apartamento, bloco, etc."
                      value={newAddress.complement}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, complement: e.target.value })
                      }
                      disabled={!newAddress.cep || newAddress.cep.length < 8 || isLoadingCep}
                    />
                  </Box>

                  <Box>
                    <Text fontSize="sm" mb={1}>
                      Bairro/Distrito *
                    </Text>
                    <Input
                      placeholder="Nome do bairro"
                      value={newAddress.district}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, district: e.target.value })
                      }
                      disabled={!newAddress.cep || newAddress.cep.length < 8 || isLoadingCep}
                    />
                  </Box>

                  <Box display="grid" gridTemplateColumns="2fr 1fr" gap={2}>
                    <Box>
                      <Text fontSize="sm" mb={1}>
                        Cidade *
                      </Text>
                      <Input
                        placeholder="Nome da cidade"
                        value={newAddress.city}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, city: e.target.value })
                        }
                        disabled={!newAddress.cep || newAddress.cep.length < 8 || isLoadingCep}
                      />
                    </Box>
                    <Box>
                      <Text fontSize="sm" mb={1}>
                        Estado *
                      </Text>
                      <Input
                        placeholder="SP"
                        value={newAddress.state}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, state: e.target.value.toUpperCase() })
                        }
                        maxLength={2}
                        disabled={!newAddress.cep || newAddress.cep.length < 8 || isLoadingCep}
                      />
                    </Box>
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
                        checked={newAddress.primary}
                        onChange={(e) =>
                          setNewAddress({
                            ...newAddress,
                            primary: e.target.checked,
                          })
                        }
                      />
                      Endereço Principal
                    </label>
                  </Box>
                </Box>
              ) : (
                <Box display="flex" flexDir="column" gap={4}>
                  <Text fontSize="sm" fontWeight="semibold">
                    Confirme a Localização no Mapa
                  </Text>
                  <Text fontSize="xs" color={mutedColor}>
                    Clique ou arraste o marcador para ajustar a localização exata do endereço
                  </Text>

                  {newAddress.latitude && newAddress.longitude && (
                    <GoogleMap
                      latitude={newAddress.latitude}
                      longitude={newAddress.longitude}
                      onLocationChange={(lat, lng) => {
                        setNewAddress({
                          ...newAddress,
                          latitude: lat,
                          longitude: lng,
                        });
                      }}
                      height="400px"
                    />
                  )}
                </Box>
              )}
            </Dialog.Body>
            <Dialog.Footer>
              {createAddressStep === 1 ? (
                <>
                  <Button variant="outline" onClick={closeCreateAddressModal}>
                    Cancelar
                  </Button>
                  <Button onClick={handleNextToMapStep} loading={isLoadingGeocode}>
                    Próximo →
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setCreateAddressStep(1)}>
                    ← Voltar
                  </Button>
                  <Button onClick={addAddress} loading={isAddingAddress}>
                    Adicionar Endereço
                  </Button>
                </>
              )}
            </Dialog.Footer>
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Box>
  );
};

const CheckoutPage: React.FC = () => {
  return (
    <Suspense
      fallback={
        <Flex minH="100vh" align="center" justify="center">
          <Spinner size="xl" />
        </Flex>
      }
    >
      <CheckoutPageContent />
    </Suspense>
  );
};

export default CheckoutPage;
