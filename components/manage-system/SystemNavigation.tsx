"use client";

import { Box, Button, Container, Flex } from "@chakra-ui/react";
import { usePathname, useRouter } from "next/navigation";
import { FaFileInvoiceDollar, FaUsers, FaWhatsapp } from "react-icons/fa";
import { IoMdNotificationsOutline } from "react-icons/io";
import { IoBusiness } from "react-icons/io5";
import { MdDashboard } from "react-icons/md";

export function SystemNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <Container maxW="container.xl">
      <Box mt={6} mb={6}>
        <Flex gap={2} flexWrap="wrap">
          <Button
            variant="ghost"
            colorScheme={isActive("/manage-system") ? "gray" : undefined}
            color={isActive("/manage-system") ? "gray.200" : "gray.800"}
            bg={isActive("/manage-system") ? "gray.950" : "gray.100"}
            _dark={{ bg: isActive("/manage-system") ? "gray.800" : "gray.950", color: "gray.200" }}
            _hover={{ bg: isActive("/manage-system") ? "gray.800" : "gray.200", _dark: { bg: isActive("/manage-system") ? "gray.900" : "gray.900" } }}
            px={6}
            borderRadius={0}
            shadow={ isActive("/manage-system") ? "xl" : undefined }
            onClick={() => router.push("/manage-system")}
          >
            <MdDashboard />
            Dashboard
          </Button>
          <Button
            variant="ghost"
            colorScheme={(isActive("/manage-system/businesses") || isActive("/manage-system/businesses/edit")) ? "gray" : undefined}
            color={(isActive("/manage-system/businesses") || isActive("/manage-system/businesses/edit")) ? "gray.200" : "gray.800"}
            bg={(isActive("/manage-system/businesses") || isActive("/manage-system/businesses/edit")) ? "gray.950" : "gray.100"}
            _dark={{ bg: (isActive("/manage-system/businesses") || isActive("/manage-system/businesses/edit")) ? "gray.800" : "gray.950", color: "gray.200" }}
            _hover={{ bg: (isActive("/manage-system/businesses") || isActive("/manage-system/businesses/edit")) ? "gray.800" : "gray.200", _dark: { bg: (isActive("/manage-system/businesses") || isActive("/manage-system/businesses/edit")) ? "gray.900" : "gray.900" } }}
            px={6}
            borderRadius={0}
            shadow={ (isActive("/manage-system/businesses") || isActive("/manage-system/businesses/edit")) ? "xl" : undefined }
            onClick={() => router.push("/manage-system/businesses")}
          >
            <IoBusiness />
            Empresas
          </Button>
          <Button
            variant="ghost"
            colorScheme={isActive("/manage-system/users") ? "gray" : undefined}
            color={isActive("/manage-system/users") ? "gray.200" : "gray.800"}
            bg={isActive("/manage-system/users") ? "gray.950" : "gray.100"}
            _dark={{ bg: isActive("/manage-system/users") ? "gray.800" : "gray.950", color: "gray.200" }}
            _hover={{ bg: isActive("/manage-system/users") ? "gray.800" : "gray.200", _dark: { bg: isActive("/manage-system/users") ? "gray.900" : "gray.900" } }}
            px={6}
            borderRadius={0}
            shadow={ isActive("/manage-system/users") ? "xl" : undefined }
            onClick={() => router.push("/manage-system/users")}
          >
            <FaUsers />
            Usuários
          </Button>
          <Button
            variant="ghost"
            colorScheme={isActive("/manage-system/notifications") ? "gray" : undefined}
            color={isActive("/manage-system/notifications") ? "gray.200" : "gray.800"}
            bg={isActive("/manage-system/notifications") ? "gray.950" : "gray.100"}
            _dark={{ bg: isActive("/manage-system/notifications") ? "gray.800" : "gray.950", color: "gray.200" }}
            _hover={{ bg: isActive("/manage-system/notifications") ? "gray.800" : "gray.200", _dark: { bg: isActive("/manage-system/notifications") ? "gray.900" : "gray.900" } }}
            px={6}
            borderRadius={0}
            shadow={ isActive("/manage-system/notifications") ? "xl" : undefined }
            onClick={() => router.push("/manage-system/notifications")}
          >
            <IoMdNotificationsOutline />
            Notificações
          </Button>
          <Button
            variant="ghost"
            colorScheme={isActive("/manage-system/whatsapp") ? "gray" : undefined}
            color={isActive("/manage-system/whatsapp") ? "gray.200" : "gray.800"}
            bg={isActive("/manage-system/whatsapp") ? "gray.950" : "gray.100"}
            _dark={{ bg: isActive("/manage-system/whatsapp") ? "gray.800" : "gray.950", color: "gray.200" }}
            _hover={{ bg: isActive("/manage-system/whatsapp") ? "gray.800" : "gray.200", _dark: { bg: isActive("/manage-system/whatsapp") ? "gray.900" : "gray.900" } }}
            px={6}
            borderRadius={0}
            shadow={ isActive("/manage-system/whatsapp") ? "xl" : undefined }
            onClick={() => router.push("/manage-system/whatsapp")}
          >
            <FaWhatsapp />
            WhatsApp
          </Button>
          <Button
            variant="ghost"
            colorScheme={isActive("/manage-system/whatsapp") ? "gray" : undefined}
            color={isActive("/manage-system/whatsapp") ? "gray.200" : "gray.800"}
            bg={isActive("/manage-system/whatsapp") ? "gray.950" : "gray.100"}
            _dark={{ bg: isActive("/manage-system/whatsapp") ? "gray.800" : "gray.950", color: "gray.200" }}
            _hover={{ bg: isActive("/manage-system/whatsapp") ? "gray.800" : "gray.200", _dark: { bg: isActive("/manage-system/whatsapp") ? "gray.900" : "gray.900" } }}
            px={6}
            borderRadius={0}
            shadow={ isActive("/manage-system/whatsapp") ? "xl" : undefined }
            onClick={() => router.push("/manage-system/whatsapp")}
          >
            <FaFileInvoiceDollar />
            Planos
          </Button>
        </Flex>
        <Box h="0.5" w="100%" bgColor="gray.300" _dark={{ bg: "gray.800" }}></Box>
      </Box>
    </Container>
  );
}
