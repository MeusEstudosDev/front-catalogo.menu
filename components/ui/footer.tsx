import { Box, Flex, Link, Text } from "@chakra-ui/react";
import React from "react";

const Footer: React.FC = () => {
  return (
    <Box
      as="footer"
      w="100%"
      py={4}
      bg="gray.50"
      borderTop="1px"
      borderColor="gray.200"
      textAlign="center"
    >
      <Flex direction="column" align="center" gap={2}>
        <Flex gap={4}>
          <Link href="/privacy" fontSize="sm" color="gray.500">
            Privacidade
          </Link>
          <Link href="/terms" fontSize="sm" color="gray.500">
            Termos
          </Link>
        </Flex>
        <Text fontSize="sm" color="gray.600">
          © {new Date().getFullYear()} Meu E-commerce. Todos os direitos
          reservados.
        </Text>
      </Flex>
    </Box>
  );
};

export default Footer;
