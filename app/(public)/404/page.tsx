import { Button, Flex, Heading, Text } from "@chakra-ui/react";
import Link from "next/link";

export default function NotFound() {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      h="100vh"
      textAlign="center"
      p={6}
    >
      <Heading fontSize="9xl" mb={16} color="red.500">
        404
      </Heading>

      <Heading fontSize="2xl" my={4}>
        Ops... página não encontrada! 🍝
      </Heading>

      <Text fontSize="lg" color="gray.600" maxW="md" mb={6}>
        Parece que esta página não existe.
      </Text>

      <Link href="/" passHref>
        <Button colorScheme="teal" size="lg" width="200px">
          Voltar
        </Button>
      </Link>
    </Flex>
  );
}
