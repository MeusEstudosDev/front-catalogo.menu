"use client";

import { Box, Button, Flex, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { ColorModeButton, useColorModeValue } from "../ui/color-mode";

const PublicDashboardMenu: React.FC = () => {
  const router = useRouter();
  const [isPlansOpen, setIsPlansOpen] = useState(false);

  // Cores que respeitam o modo claro/escuro do sistema
  const bg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.800", "gray.100");

  return (
    <Box as="header" w="100%" borderBottomWidth={1} borderColor={border} bg={bg}>
      <Flex maxW="1200px" mx="auto" align="center" justify="space-between" px={6} py={3}>
        <Flex align="center" gap={6}>
          <Text fontWeight="bold" fontSize="lg" color={textColor}>catalogo.menu</Text>

          {/* Navegação principal com submenu simples */}
          <Flex as="nav" align="center" gap={4}>
            <Box position="relative">
              <Button
                variant="ghost"
                onClick={() => setIsPlansOpen((s) => !s)}
                aria-expanded={isPlansOpen}
                aria-controls="plans-submenu"
              >
                Planos
              </Button>

              {isPlansOpen && (
                <Box
                  id="plans-submenu"
                  position="absolute"
                  mt={2}
                  bg="white"
                  borderWidth={1}
                  borderColor="gray.200"
                  boxShadow="sm"
                  minW="160px"
                  zIndex={20}
                >
                  <Box display="flex" flexDirection="column" gap={0}>
                    <Button
                      variant="ghost"
                      justifyContent="flex-start"
                      onClick={() => {
                        router.push("/dashboard/plans");
                        setIsPlansOpen(false);
                      }}
                    >
                      Listar planos
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>

            <Button variant="ghost" onClick={() => router.push("/dashboard/plans")}>Planos (ir direto)</Button>
          </Flex>
        </Flex>

        <Flex align="center">
          <ColorModeButton />
          <Button colorScheme="blue" onClick={() => router.push("/")}>Minha Conta</Button>
        </Flex>
      </Flex>
    </Box>
  );
};

export default PublicDashboardMenu;
