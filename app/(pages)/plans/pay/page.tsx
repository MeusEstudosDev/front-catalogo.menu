"use client";

import { useColorModeValue } from "@/components/ui/color-mode";
import { toaster } from "@/components/ui/toaster";
import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Grid,
  GridItem,
  Heading,
  Input,
  List,
  Separator,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useEffect, useState } from "react";
import { FiAlertOctagon, FiTag } from "react-icons/fi";
import { IoMdArrowDropright } from "react-icons/io";
import { LuCheck } from "react-icons/lu";
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
}

const PaymentPageContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);

  // Cores dinâmicas para modo claro/escuro
  const bg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const mutedColor = useColorModeValue("gray.600", "gray.400");
  const accentColor = useColorModeValue("blue.600", "blue.400");
  const successColor = useColorModeValue("green.600", "green.400");

  useEffect(() => {
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
    });
  }, [searchParams, router]);

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency,
    }).format(price);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toaster.error({
        title: "Erro",
        description: "Digite um código de cupom válido.",
      });
      return;
    }

    setIsApplyingCoupon(true);
    try {
      // Aqui você faria a chamada real para validar o cupom
      // Simulação de validação
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Exemplo de desconto de cupom (10%)
      setCouponDiscount(10);
      toaster.success({
        title: "Sucesso",
        description: "Cupom aplicado com sucesso!",
      });
    } catch (error) {
      toaster.error({
        title: "Erro",
        description: "Cupom inválido ou expirado.",
      });
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleContinue = () => {
    if (!planData) return;

    // Monta os query params com todos os dados do plano e cupom
    const queryParams = new URLSearchParams({
      planId: planData.planId,
      planName: planData.planName,
      billingCycle: planData.billingCycle,
      priceMonthly: planData.priceMonthly.toString(),
      priceYearly: planData.priceYearly.toString(),
      discountPix: planData.discountPix.toString(),
      discountYearly: planData.discountYearly.toString(),
      currency: planData.currency,
      trialDays: planData.trialDays.toString(),
      maxUsers: planData.maxUsers?.toString() || "",
      maxProducts: planData.maxProducts?.toString() || "",
      maxOrders: planData.maxOrders?.toString() || "",
      couponDiscount: couponDiscount.toString(),
      couponCode: couponCode,
    });

    router.push(`/plans/pay/checkout?${queryParams.toString()}`);
  };

  if (!planData) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg={bg}>
        <Spinner size="xl" color={accentColor} />
      </Flex>
    );
  }

  const basePrice = planData.billingCycle === "monthly" ? planData.priceMonthly : planData.priceYearly;
  const pixDiscount = basePrice * (planData.discountPix / 100);
  const yearlyDiscount = planData.billingCycle === "yearly" ? basePrice * (planData.discountYearly / 100) : 0;
  const couponDiscountAmount = (basePrice - pixDiscount - yearlyDiscount) * (couponDiscount / 100);
  const totalDiscount = pixDiscount + yearlyDiscount + couponDiscountAmount;
  const finalPrice = basePrice - totalDiscount;

  return (
    <Box bg={bg} minH="100vh" py={16} px={6}>
      <Box maxW="1200px" mx="auto">
        {/* Cabeçalho */}
        <Box mb={8}>
          <Heading as="h1" size="2xl" mb={2} color={textColor}>
            Finalizar Assinatura
          </Heading>
          <Text color={mutedColor}>Revise os detalhes do seu plano antes de continuar</Text>
        </Box>

        <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={8}>
          {/* Informações do Plano */}
          <GridItem>
            <Card.Root bg={cardBg} borderColor={cardBorder} borderWidth={1}>
              <Card.Header>
                <Heading as="h2" size="lg" color={textColor}>
                  Detalhes do Plano
                </Heading>
              </Card.Header>
              <Card.Body>
                <Stack gap={6}>
                  {/* Nome e Período */}
                  <Box>
                    <Flex justify="space-between" align="center" mb={2}>
                      <Heading as="h3" size="md" color={textColor}>
                        Plano {planData.planName}
                      </Heading>
                      <Badge colorPalette="blue" variant="solid">
                        {planData.billingCycle === "monthly" ? "Mensal" : "Anual"}
                      </Badge>
                    </Flex>
                    {planData.trialDays > 0 && (
                      <Text fontSize="sm" color={successColor}>
                        + {planData.trialDays} dias grátis para experimentar
                      </Text>
                    )}
                  </Box>

                  <Separator />

                  {/* Benefícios */}
                  <Box>
                    <Heading as="h4" size="sm" mb={4} color={textColor}>
                      Benefícios Inclusos
                    </Heading>
                    <List.Root gap={3} variant="plain">
                      {planData.maxUsers && (
                        <List.Item display="flex" alignItems="center" gap={2}>
                          <LuCheck color="green" size={20} />
                          <Text fontSize="sm" color={textColor}>
                            Até {planData.maxUsers} usuários simultâneos
                          </Text>
                        </List.Item>
                      )}
                      {planData.maxProducts && (
                        <List.Item display="flex" alignItems="center" gap={2}>
                          <LuCheck color="green" size={20} />
                          <Text fontSize="sm" color={textColor}>
                            Até {planData.maxProducts} produtos cadastrados
                          </Text>
                        </List.Item>
                      )}
                      {planData.maxOrders && (
                        <List.Item display="flex" alignItems="center" gap={2}>
                          <LuCheck color="green" size={20} />
                          <Text fontSize="sm" color={textColor}>
                            Até {planData.maxOrders} pedidos por mês
                          </Text>
                        </List.Item>
                      )}
                      <List.Item display="flex" alignItems="center" gap={2}>
                        <LuCheck color="green" size={20} />
                        <Text fontSize="sm" color={textColor}>
                          Suporte por e-mail
                        </Text>
                      </List.Item>
                      <List.Item display="flex" alignItems="center" gap={2}>
                        <LuCheck color="green" size={20} />
                        <Text fontSize="sm" color={textColor}>
                          Atualizações automáticas
                        </Text>
                      </List.Item>
                    </List.Root>
                  </Box>

                  <Separator />

                  {/* Cupom de Desconto */}
                  <Box>
                    <Heading as="h4" size="sm" mb={3} color={textColor}>
                      Cupom de Desconto
                    </Heading>
                    <Flex gap={2}>
                      <Input
                        placeholder="Digite o código do cupom"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        disabled={isApplyingCoupon}
                        flex={1}
                      />
                      <Button
                        colorPalette="blue"
                        variant="outline"
                        onClick={handleApplyCoupon}
                        disabled={isApplyingCoupon || !couponCode.trim()}
                        loading={isApplyingCoupon}
                      >
                        <FiTag />
                        Aplicar
                      </Button>
                    </Flex>
                    {couponDiscount > 0 && (
                      <Text fontSize="sm" color={successColor} mt={2}>
                        ✓ Cupom aplicado: {couponDiscount}% de desconto adicional
                      </Text>
                    )}
                  </Box>
                </Stack>
              </Card.Body>
            </Card.Root>
          </GridItem>

          {/* Resumo do Pedido */}
          <GridItem>
            <Card.Root bg={cardBg} borderColor={cardBorder} borderWidth={1} position="sticky" top={4}>
              <Card.Header>
                <Heading as="h2" size="lg" color={textColor}>
                  Resumo do Pedido
                </Heading>
              </Card.Header>
              <Card.Body>
                <Stack gap={4}>
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

                  {couponDiscount > 0 && (
                    <Flex justify="space-between" align="center">
                      <Flex align="center" gap={1}>
                        <FiTag color="green" />
                        <Text fontSize="sm" color={successColor}>
                          Cupom ({couponDiscount}%)
                        </Text>
                      </Flex>
                      <Text fontSize="sm" color={successColor}>
                        -{formatPrice(couponDiscountAmount, planData.currency)}
                      </Text>
                    </Flex>
                  )}

                  <Separator />

                  {/* Total com Desconto */}
                  {totalDiscount > 0 && (
                    <Flex justify="space-between" align="center">
                      <Text fontSize="sm" color={mutedColor}>
                        Total de descontos
                      </Text>
                      <Text fontSize="sm" color={successColor} fontWeight="medium">
                        -{formatPrice(totalDiscount, planData.currency)}
                      </Text>
                    </Flex>
                  )}

                  {/* Valor Final */}
                  <Box bg={useColorModeValue("blue.50", "blue.900")} p={4} borderRadius="md">
                    <Flex justify="space-between" align="center">
                      <Text fontWeight="bold" color={textColor}>
                        Total a pagar
                      </Text>
                      <Box textAlign="right">
                        {totalDiscount > 0 && (
                          <Text
                            fontSize="sm"
                            color={mutedColor}
                            textDecoration="line-through"
                          >
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

                  <Separator />

                  {/* Botão de Continuar */}
                  <Button
                    colorPalette="blue"
                    variant="solid"
                    size="lg"
                    w="full"
                    onClick={handleContinue}
                  >
                    Continuar para Pagamento
                  </Button>

                  <Text fontSize="xs" color={mutedColor} textAlign="center">
                    Ao continuar, você concorda com nossos{" "}
                    <Text as="span" color={accentColor} cursor="pointer">
                      Termos de Serviço
                    </Text>{" "}
                    e{" "}
                    <Text as="span" color={accentColor} cursor="pointer">
                      Política de Privacidade
                    </Text>
                  </Text>
                </Stack>
              </Card.Body>
            </Card.Root>
          </GridItem>
        </Grid>
      </Box>
    </Box>
  );
};

const PaymentPage: React.FC = () => {
  return (
    <Suspense
      fallback={
        <Flex minH="100vh" align="center" justify="center">
          <Spinner size="xl" />
        </Flex>
      }
    >
      <PaymentPageContent />
    </Suspense>
  );
};

export default PaymentPage;
