"use client";

import {
  BusinessStatus,
  formatCnpj,
  formatDate,
  translateStatus
} from "@/components/businesses";
import { toaster } from "@/components/ui/toaster";
import {
  Box,
  Button,
  createListCollection,
  Input,
  InputGroup,
  Portal,
  Select,
  Text
} from "@chakra-ui/react";
import { useState } from "react";
import { FaEdit } from "react-icons/fa";
import { IBusinessDetail } from "./types";

interface BasicInfoTabProps {
  business: IBusinessDetail;
  onBusinessUpdate: (business: IBusinessDetail) => void;
}

export function BasicInfoTab({ business, onBusinessUpdate }: BasicInfoTabProps) {
  const [formData, setFormData] = useState({
    cnpj: business.cnpj,
    name: business.name,
    website: business.website || "",
    status: business.status,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const token = await fetch("/api/get-cookies?key=access_token").then((r) =>
        r.json()
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}management/businesses/${business.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            cnpj: formData.cnpj,
            name: formData.name,
            website: formData.website || null,
            status: formData.status,
          }),
        }
      );

      if (response.ok) {
        const updatedBusiness = await response.json();
        onBusinessUpdate(updatedBusiness);
        toaster.success({
          title: "Empresa atualizada",
          description: "As informações da empresa foram atualizadas com sucesso.",
        });
      } else {
        toaster.error({
          title: "Erro ao atualizar",
          description: "Não foi possível atualizar a empresa.",
        });
      }
    } catch (error) {
      console.error("Erro ao atualizar empresa:", error);
      toaster.error({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar a empresa.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const frameworks = createListCollection({
  items: [
    "ACTIVE",
    "INACTIVE",
    "SUSPENDED",
    "PENDING",
    "PAYMENT_PENDING",
    "TRIAL",
    "EXPIRED",
    "ARCHIVED",
    "BANNED",
    "DELETED",
  ] as BusinessStatus[],
})

  return (
    <Box display="flex" flexDir="column" gap={6} p={6}>
      <Box display="flex" flexDir={{ base: "column", md: "row" }} gap={4}>
        <InputGroup startAddon="Código">
          <Input value={business.code} disabled readOnly />
        </InputGroup>

        <InputGroup startAddon="Cadastrado em">
          <Input
            value={formatDate(business.created_at)}
            disabled
            readOnly
          />
        </InputGroup>
      </Box>



      <Box display="flex" flexDir={{ base: "column", md: "row" }} gap={4}>
        <InputGroup startAddon="CNPJ">
          <Input
            value={formatCnpj(formData.cnpj)}
            onChange={(e) => {
              const clean = e.target.value.replace(/\D/g, "");
              setFormData({ ...formData, cnpj: clean });
            }}
            maxLength={18}
          />
        </InputGroup>

        <InputGroup startAddon="Nome">
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </InputGroup>

        <Box w="100%" display="flex" alignItems="center" gap={3}>
          <Select.Root
            value={[formData.status]}
            onValueChange={(e) =>
              setFormData({ ...formData, status: e.value[0] as BusinessStatus })
            }
            size="md"
            collection={frameworks}
          >
            <Select.HiddenSelect />
            <Select.Control>
              <Select.Trigger>
                <Select.ValueText placeholder="Selecione o status" />
              </Select.Trigger>
              <Select.IndicatorGroup>
                <Select.Indicator />
              </Select.IndicatorGroup>
            </Select.Control>
            <Portal>
              <Select.Positioner>
                <Select.Content>
                  {frameworks.items.map((framework) => (
                    <Select.Item item={framework} key={framework}>
                      {translateStatus(framework)}
                      <Select.ItemIndicator />
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Portal>
          </Select.Root>
        </Box>
      </Box>

      <InputGroup startAddon="Website">
        <Input
          value={formData.website}
          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
          placeholder="https://exemplo.com.br"
        />
      </InputGroup>

      <Box display="flex" gap={4} justifyContent="flex-end">
        <Button
          onClick={handleSubmit}
          loading={isSubmitting}
          colorPalette="blue"
          alignSelf={{ base: "stretch", md: "end" }}
          w={{ base: "100%", md: "200px" }}
          display="flex"
          gap={2}
        >
          <FaEdit />
          <Text w="100%">Salvar alterações</Text>
        </Button>
      </Box>
    </Box>
  );
}
