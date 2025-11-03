"use client";

import { useColorModeValue } from "@/components/ui/color-mode";
import { toaster } from "@/components/ui/toaster";
import { Badge, Box, Button, Card, Flex, Grid, GridItem, Heading, List, Span, Spinner, Stack, Text } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { FiAlertOctagon } from "react-icons/fi";
import { IoMdArrowDropright } from "react-icons/io";
import { LuCheck } from "react-icons/lu";
import { MdAdd } from "react-icons/md";

interface Plan {
  id: string;
  code: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  discount_yearly: number;
  discount_pix: number;
  currency: string;
  trial_days: number;
  is_active: boolean;
  features: string[] | null;
  max_users: number | null;
  max_products: number | null;
  max_orders: number | null;
}

const PlansPage: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  // Cores dinâmicas para modo claro/escuro
  const bg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const mutedColor = useColorModeValue("gray.600", "gray.400");
  const accentColor = useColorModeValue("blue.600", "blue.400");
  const successColor = useColorModeValue("green.600", "green.400");

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}public/plans`);
      
      if (!response.ok) {
        throw new Error("Falha ao carregar planos");
      }

      const data = await response.json();
      setPlans(data.filter((plan: Plan) => plan.is_active));
    } catch (error) {
      console.error("Erro ao buscar planos:", error);
      toaster.error({
        title: "Erro",
        description: "Não foi possível carregar os planos. Tente novamente mais tarde.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: string, currency: string) => {
    const numPrice = parseFloat(price);
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency,
    }).format(numPrice);
  };

  const getMostPopularPlan = () => {
    // Lógica para destacar plano mais popular (pode ser baseado em código, nome, etc.)
    return plans.length > 1 ? plans[1]?.id : plans[0]?.id;
  };

  if (isLoading) {
    return (
      <Flex minH="60vh" align="center" justify="center" bg={bg}>
        <Spinner size="xl" color={accentColor} />
      </Flex>
    );
  }

  return (
    <Box bg={bg} minH="100vh" py={16} px={6}>
      <Box maxW="1200px" mx="auto">
        {/* Cabeçalho */}
        <Box textAlign="center" mb={24}>
          <Heading as="h1" size="2xl" mb={4} color={textColor}>
            Escolha o Plano Ideal Para Seu Negócio
          </Heading>

          {/* Toggle de Ciclo de Cobrança */}
          <Flex align="center" justify="center" gap={4}>
            <Button
              variant={billingCycle === "monthly" ? "solid" : "outline"}
              colorPalette="blue"
              onClick={() => setBillingCycle("monthly")}
              size="sm"
            >
              Mensal
            </Button>
            <Button
              variant={billingCycle === "yearly" ? "solid" : "outline"}
              colorPalette="blue"
              onClick={() => setBillingCycle("yearly")}
              size="sm"
            >
              Anual
            </Button>
          </Flex>
        </Box>

        {/* Grid de Planos */}
        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: `repeat(3, 1fr)` }} gap={8}>
          {plans.map((plan) => {
            const isMostPopular = plan.id === getMostPopularPlan();

            const discountPix = plan.discount_pix || 0;
            const discountYearly = plan.discount_yearly || 0;

            const priceMonthlyDiscount = discountPix > 0 ? Number(plan.price_monthly) - (Number(plan.price_monthly) * (discountPix / 100)) : Number(plan.price_monthly);
            const priceYearlyDiscount = discountYearly > 0 ? Number(plan.price_yearly) - (Number(plan.price_yearly) * ((discountYearly + discountPix) / 100)) : Number(plan.price_yearly);

            const currentPrice = billingCycle === "monthly" ? Number(plan.price_monthly) : Number(plan.price_yearly);

            return (
              <GridItem key={plan.id}>
                <Card.Root
                  bg={cardBg}
                  borderColor={isMostPopular ? accentColor : cardBorder}
                  borderWidth={isMostPopular ? 2 : 1}
                  position="relative"
                  transition="all 0.3s"
                  h="full"
                >
                  {/* Badge de Mais Popular */}
                  {isMostPopular && (
                    <Badge
                      colorPalette="blue"
                      variant="solid"
                      position="absolute"
                      top={-35}
                      left="50%"
                      transform="translateX(-50%)"
                      px={12}
                      py={4}
                    >
                      MAIS POPULAR
                    </Badge>
                  )}

                  <Card.Body p={8}>
                    {billingCycle === "yearly" && (
                      <>
                        <Badge display="flex" alignItems="center" colorPalette="green" variant="solid" h={6} mb={3} p={4}>
                          <FiAlertOctagon />
                          Economize {plan.discount_yearly}% nos planos anuais
                        </Badge>
                      </>
                    )}
                    <Stack gap={6}>
                      {/* Nome do Plano */}
                      <Heading as="h3" size="xl" color={textColor}>
                        Plano {plan.name} {plan.trial_days > 0 && (<Span  color={mutedColor}>+{plan.trial_days} dias grátis</Span>)}
                      </Heading>

                      {/* Preço */}
                      <Box>
                        <Text display="flex" alignItems="center" fontSize="sm" color={successColor}>
                          <IoMdArrowDropright />
                          {discountPix}% de desconto no PIX
                        </Text>
                        {
                          billingCycle === "yearly" && discountPix > 0 && (
                            <Text display="flex" alignItems="center" fontSize="sm" color={successColor}>
                              <MdAdd />
                              {discountYearly}% de desconto no plano anual
                            </Text>
                          )
                        }
                        <Flex color={mutedColor} align="baseline" gap={1}>
                          De{" "}
                          <Text textDecoration="line-through" fontSize="4xl" fontWeight="bold" color={mutedColor}>
                            {formatPrice(currentPrice.toString(), plan.currency)}
                          </Text>
                          <Text fontSize="md" color={mutedColor}>
                            /{billingCycle === "monthly" ? "mês" : "ano"}
                          </Text>
                        </Flex>
                        <Text color={accentColor}>
                           <Span color={mutedColor}>por {" "}</Span> 
                          {
                            billingCycle === "yearly"
                              ? formatPrice(priceYearlyDiscount.toString(), plan.currency)
                              : formatPrice(priceMonthlyDiscount.toString(), plan.currency)
                          }
                          <Span color={mutedColor}>/{billingCycle === "monthly" ? "mês" : "ano"} no PIX</Span>
                          
                        </Text>
                      </Box>

                      {/* Botão CTA */}
                      <Button
                        colorPalette="blue"
                        variant={isMostPopular ? "solid" : "outline"}
                        size="lg"
                        w="full"
                      >
                        Escolher Plano
                      </Button>

                      {/* Recursos do Plano */}
                      <Box pt={4} borderTopWidth={1} borderColor={cardBorder}>
                        <List.Root gap={3} variant="plain">
                          {plan.max_users && (
                            <List.Item display="flex" alignItems="center" gap={2}>
                              <LuCheck color="green" size={20} />
                              <Text fontSize="sm" color={textColor}>
                                Até {plan.max_users} usuários
                              </Text>
                            </List.Item>
                          )}
                          {plan.max_products && (
                            <List.Item display="flex" alignItems="center" gap={2}>
                              <LuCheck color="green" size={20} />
                              <Text fontSize="sm" color={textColor}>
                                Até {plan.max_products} produtos
                              </Text>
                            </List.Item>
                          )}
                          {plan.max_orders && (
                            <List.Item display="flex" alignItems="center" gap={2}>
                              <LuCheck color="green" size={20} />
                              <Text fontSize="sm" color={textColor}>
                                Até {plan.max_orders} pedidos/mês
                              </Text>
                            </List.Item>
                          )}
                        </List.Root>
                      </Box>
                    </Stack>
                  </Card.Body>
                </Card.Root>
              </GridItem>
            );
          })}
          <GridItem>
            <Card.Root
              bg={cardBg}
              borderColor={cardBorder}
              borderWidth="1"
              position="relative"
              transition="all 0.3s"
              h="full"
            >
              <Card.Body p={8}>
                <Stack gap={6}>
                  {/* Nome do Plano */}
                  <Heading as="h3" size="xl" color={textColor}>
                    Customizado
                  </Heading>

                  {/* Descrição */}
                  <Text fontSize="sm" color={mutedColor}>
                    Plano personalizado para atender às necessidades específicas do seu negócio. Entre em contato conosco para mais detalhes.
                  </Text>

                  {/* Botão CTA */}
                  <Button
                    colorPalette="blue"
                    variant="outline"
                    size="lg"
                    w="full"
                  >
                    Escolher Plano
                  </Button>

                  {/* Recursos do Plano */}
                  <Box pt={4} borderTopWidth={1} borderColor={cardBorder}>
                    <List.Root gap={3} variant="plain">
                      <List.Item display="flex" alignItems="center" gap={2}>
                        <LuCheck color="green" size={20} />
                        <Text fontSize="sm" color={textColor}>
                          Entre em contato para recursos personalizados.
                        </Text>
                      </List.Item>
                    </List.Root>
                  </Box>
                </Stack>
              </Card.Body>
            </Card.Root>
          </GridItem>
        </Grid>
      </Box>
    </Box>
  );
};

export default PlansPage;
