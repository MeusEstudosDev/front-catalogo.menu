"use client";

import { SystemNavigation } from "@/components/manage-system/SystemNavigation";
import { Container } from "@chakra-ui/react";

export default function ManageSystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Container maxW="container.xl" px={0}>
        <SystemNavigation />
      </Container>
      {children}
    </>
  );
}
