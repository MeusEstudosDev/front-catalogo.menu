import { Box, Flex, Link, Text } from "@chakra-ui/react";
import React from "react";

const Footer: React.FC = () => {
  return (
    <Box
      as="footer"
      w="100%"
      py={4}
      bg="var(--background)"
      borderTop="1px"
      borderColor="var(--border)"
      textAlign="center"
    >
      <Flex direction="column" align="center" gap={2}>
        <Flex gap={4}>
          <Link href="/privacy" fontSize="sm" color="var(--muted-foreground)">
            Privacidade
          </Link>
          <Link href="/terms" fontSize="sm" color="var(--muted-foreground)">
            Termos
          </Link>
        </Flex>
        <Text fontSize="sm" color="var(--subtle-foreground)">
          © {new Date().getFullYear()} Meu E-commerce. Todos os direitos
          reservados.
        </Text>
      </Flex>
    </Box>
  );
};

export default Footer;
