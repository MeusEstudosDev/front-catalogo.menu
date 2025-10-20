"use client";

import {
  AddressesTab,
  BasicInfoTab,
  EmailsTab,
  EmployeesTab,
  IBusinessDetail,
  PhonesTab,
} from "@/components/business-edit";
import { toaster } from "@/components/ui/toaster";
import { Box, Spinner, Tabs, Text } from "@chakra-ui/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { FaEnvelope } from "react-icons/fa";
import { MdOutlineLocationOn, MdOutlineManageAccounts } from "react-icons/md";

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
      <Box px={8}>
        <Box textAlign="center" py={12}>
          <Text fontSize="lg" color="red.500">
            ID da empresa não fornecido
          </Text>
        </Box>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box px={8}>
        <Box textAlign="center" py={12}>
          <Spinner size="xl" />
          <Text mt={4} color="gray.500">
            Carregando dados da empresa...
          </Text>
        </Box>
      </Box>
    );
  }

  if (!business) {
    return (
      <Box px={8}>
        <Box textAlign="center" py={12}>
          <Text fontSize="lg" color="red.500">
            Empresa não encontrada
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box px={8}>
      <Tabs.Root defaultValue="account" mt={8}>
        <Tabs.List>
          <Tabs.Trigger value="account">
            <MdOutlineManageAccounts />
            Meus dados
          </Tabs.Trigger>

          <Tabs.Trigger value="phones">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
            </svg>
            Telefones
          </Tabs.Trigger>

          <Tabs.Trigger value="addresses">
            <MdOutlineLocationOn />
            Endereços
          </Tabs.Trigger>

          <Tabs.Trigger value="emails">
            <FaEnvelope />
            E-mails
          </Tabs.Trigger>

          <Tabs.Trigger value="employees">
            {/* Ícone de usuários */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 6 }}>
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V20h14v-3.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V20h6v-3.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
            Colaboradores
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="account">
          <BasicInfoTab business={business} onBusinessUpdate={handleBusinessUpdate} />
        </Tabs.Content>

        <Tabs.Content value="phones">
          <PhonesTab businessId={businessId} />
        </Tabs.Content>

        <Tabs.Content value="addresses">
          <AddressesTab businessId={businessId} />
        </Tabs.Content>

        <Tabs.Content value="emails">
          <EmailsTab businessId={businessId} />
        </Tabs.Content>

        <Tabs.Content value="employees">
          <EmployeesTab businessId={businessId} />
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
}

export default function BusinessesEditPage() {
  return (
    <Suspense
      fallback={
        <Box px={8}>
          <Box textAlign="center" py={12}>
            <Spinner size="xl" />
          </Box>
        </Box>
      }
    >
      <BusinessesEditPageContent />
    </Suspense>
  );
}
