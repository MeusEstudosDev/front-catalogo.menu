import { Box, Container, Heading, Text } from "@chakra-ui/react";

export default function UsersPage() {
  return (
    <Container maxW="container.xl" py={8}>
      <Box>
        <Heading as="h1" size="xl" mb={2}>
          Empresas Cadastradas
        </Heading>
        <Text color="gray.600" _dark={{ color: "gray.400" }} mb={8}>
          Gerencie todas as empresas cadastradas no sistema
        </Text>

        {/* Conteúdo será adicionado futuramente */}
        <Box mt={8}>
          {/* Tabela de empresas, filtros, etc. */}
        </Box>
      </Box>
    </Container>
  );
}
