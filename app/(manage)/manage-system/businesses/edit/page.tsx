"use client";

import { Box, Container, Heading, Spinner, Tabs, Text } from "@chakra-ui/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { MdBusiness, MdInfo, MdLocationOn, MdSettings } from "react-icons/md";

function BusinessesEditPageContent() {
  const searchParams = useSearchParams();
  const businessId = searchParams.get("id");

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

  return (
    <Container maxW="container.xl" py={8}>
      <Box>
        <Heading as="h1" size="xl" mb={2}>
          Editar Empresa
        </Heading>
        <Text color="gray.600" _dark={{ color: "gray.400" }} mb={2}>
          ID: {businessId}
        </Text>
        <Text color="gray.600" _dark={{ color: "gray.400" }} mb={8}>
          Altere os dados da empresa conforme necessário
        </Text>

        <Tabs.Root defaultValue="info" mt={8}>
          <Tabs.List>
            <Tabs.Trigger value="info">
              <MdInfo />
              Informações Básicas
            </Tabs.Trigger>

            <Tabs.Trigger value="business">
              <MdBusiness />
              Dados Empresariais
            </Tabs.Trigger>

            <Tabs.Trigger value="address">
              <MdLocationOn />
              Endereço
            </Tabs.Trigger>

            <Tabs.Trigger value="settings">
              <MdSettings />
              Configurações
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="info">
            <Box p={6}>
              <Text color="gray.500">
                Aba de Informações Básicas - Em desenvolvimento
              </Text>
            </Box>
          </Tabs.Content>

          <Tabs.Content value="business">
            <Box p={6}>
              <Text color="gray.500">
                Aba de Dados Empresariais - Em desenvolvimento
              </Text>
            </Box>
          </Tabs.Content>

          <Tabs.Content value="address">
            <Box p={6}>
              <Text color="gray.500">
                Aba de Endereço - Em desenvolvimento
              </Text>
            </Box>
          </Tabs.Content>

          <Tabs.Content value="settings">
            <Box p={6}>
              <Text color="gray.500">
                Aba de Configurações - Em desenvolvimento
              </Text>
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
