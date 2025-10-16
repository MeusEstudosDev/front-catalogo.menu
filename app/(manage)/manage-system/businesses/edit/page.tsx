"use client";

import {
  AddressesTab,
  BasicInfoTab,
  EmailsTab,
  IBusinessDetail,
  PhonesTab,
} from "@/components/business-edit";
import { toaster } from "@/components/ui/toaster";
import { Box, Container, Heading, Spinner, Tabs, Text } from "@chakra-ui/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { FaEnvelope, FaInfoCircle, FaMapMarkerAlt, FaPhone } from "react-icons/fa";

function BusinessesEditPageContent() {
  const searchParams = useSearchParams();
  const businessId = searchParams.get("id");
  
  const [business, setBusiness] = useState<IBusinessDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (businessId) {
      fetchBusiness();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  const fetchBusiness = async () => {
    setIsLoading(true);
    try {
      const token = await fetch("/api/get-cookies?key=access_token").then((r) =>
        r.json()
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}management/businesses/${businessId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setBusiness(data);
      } else {
        toaster.error({
          title: "Erro ao carregar empresa",
          description: "Não foi possível carregar os dados da empresa.",
        });
      }
    } catch (error) {
      console.error("Erro ao buscar empresa:", error);
      toaster.error({
        title: "Erro",
        description: "Ocorreu um erro ao buscar os dados da empresa.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBusinessUpdate = (updatedBusiness: IBusinessDetail) => {
    setBusiness(updatedBusiness);
  };

  if (!businessId) {
    return (
      <Container maxW="container.xl" py={8}>
        <Box textAlign="center" py={12}>
          <Text fontSize="lg" color="red.500">
            ID da empresa não fornecido
          </Text>
        </Box>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Box textAlign="center" py={12}>
          <Spinner size="xl" />
          <Text mt={4} color="gray.500">
            Carregando dados da empresa...
          </Text>
        </Box>
      </Container>
    );
  }

  if (!business) {
    return (
      <Container maxW="container.xl" py={8}>
        <Box textAlign="center" py={12}>
          <Text fontSize="lg" color="red.500">
            Empresa não encontrada
          </Text>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Box>
        <Heading as="h1" size="xl" mb={2}>
          Editar Empresa
        </Heading>
        <Text color="gray.600" _dark={{ color: "gray.400" }} mb={2}>
          {business.name} (#{business.code})
        </Text>
        <Text color="gray.600" _dark={{ color: "gray.400" }} mb={8}>
          Altere os dados da empresa conforme necessário
        </Text>

        <Tabs.Root defaultValue="info" mt={8} variant="enclosed">
          <Tabs.List>
            <Tabs.Trigger value="info">
              <FaInfoCircle style={{ marginRight: "8px" }} />
              Informações Básicas
            </Tabs.Trigger>

            <Tabs.Trigger value="phones">
              <FaPhone style={{ marginRight: "8px" }} />
              Telefones
            </Tabs.Trigger>

            <Tabs.Trigger value="addresses">
              <FaMapMarkerAlt style={{ marginRight: "8px" }} />
              Endereços
            </Tabs.Trigger>

            <Tabs.Trigger value="emails">
              <FaEnvelope style={{ marginRight: "8px" }} />
              E-mails
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="info">
            <Box p={6} bg="white" _dark={{ bg: "gray.800" }} borderRadius="md" shadow="sm">
              <BasicInfoTab business={business} onBusinessUpdate={handleBusinessUpdate} />
            </Box>
          </Tabs.Content>

          <Tabs.Content value="phones">
            <Box p={6} bg="white" _dark={{ bg: "gray.800" }} borderRadius="md" shadow="sm">
              <PhonesTab businessId={businessId} />
            </Box>
          </Tabs.Content>

          <Tabs.Content value="addresses">
            <Box p={6} bg="white" _dark={{ bg: "gray.800" }} borderRadius="md" shadow="sm">
              <AddressesTab businessId={businessId} />
            </Box>
          </Tabs.Content>

          <Tabs.Content value="emails">
            <Box p={6} bg="white" _dark={{ bg: "gray.800" }} borderRadius="md" shadow="sm">
              <EmailsTab businessId={businessId} />
            </Box>
          </Tabs.Content>
        </Tabs.Root>
      </Box>
    </Container>
  );
}

export default function BusinessesEditPage() {
  return (
    <Suspense
      fallback={
        <Container maxW="container.xl" py={8}>
          <Box textAlign="center" py={12}>
            <Spinner size="xl" />
          </Box>
        </Container>
      }
    >
      <BusinessesEditPageContent />
    </Suspense>
  );
}
