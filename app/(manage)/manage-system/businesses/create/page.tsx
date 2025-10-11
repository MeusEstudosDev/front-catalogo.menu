"use client";

import { Box, Container, Heading, Tabs, Text } from "@chakra-ui/react";
import { MdBusiness, MdInfo, MdLocationOn, MdSettings } from "react-icons/md";

export default function BusinessesCreatePage() {
  return (
    <Container maxW="container.xl" py={8}>
      <Box>
        <Heading as="h1" size="xl" mb={2}>
          Criar Nova Empresa
        </Heading>
        <Text color="gray.600" _dark={{ color: "gray.400" }} mb={8}>
          Preencha os dados para cadastrar uma nova empresa
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
