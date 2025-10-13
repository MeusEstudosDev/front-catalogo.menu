"use client";

import {
    BusinessStatus,
    formatCnpj,
    formatDate,
    getStatusColorScheme,
    translateStatus,
} from "@/components/businesses";
import { toaster } from "@/components/ui/toaster";
import {
    Badge,
    Box,
    Button,
    Input,
    InputGroup,
    Text,
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

      <Box>
        <Text fontSize="sm" mb={2} fontWeight="medium">
          Status
        </Text>
        <Box display="flex" alignItems="center" gap={3}>
          <select
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value as BusinessStatus })
            }
            style={{
              width: "100%",
              height: "40px",
              padding: "0 12px",
              border: "1px solid var(--chakra-colors-border)",
              borderRadius: "6px",
              backgroundColor: "transparent",
              color: "inherit",
              fontSize: "14px",
              outline: "none",
            }}
          >
            {Object.values(BusinessStatus).map((status) => (
              <option key={status} value={status}>
                {translateStatus(status)}
              </option>
            ))}
          </select>
          <Badge colorPalette={getStatusColorScheme(formData.status)} minW="120px" textAlign="center">
            {translateStatus(formData.status)}
          </Badge>
        </Box>
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
