"use client";

import { toaster } from "@/components/ui/toaster";
import { Box, Button, Container, Heading, Input, Stack, Text, VStack } from "@chakra-ui/react";
import { useState } from "react";

interface CharacterResult {
  name: string;
  hasGuild: boolean;
  loading?: boolean;
  error?: boolean;
}

export default function TibiaCheckPage() {
  const [inputValue, setInputValue] = useState("");
  const [results, setResults] = useState<CharacterResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!inputValue.trim()) {
      toaster.create({
        title: "Campo vazio",
        description: "Por favor, digite pelo menos um nome de personagem.",
        type: "error",
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);
    setResults([]);

    // Separar nomes por vírgula e limpar espaços
    const names = inputValue
      .split(",")
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    if (names.length === 0) {
      toaster.create({
        title: "Nenhum nome válido",
        description: "Por favor, digite nomes válidos separados por vírgula.",
        type: "error",
        duration: 3000,
      });
      setIsLoading(false);
      return;
    }

    // Inicializar resultados com status de loading
    const initialResults: CharacterResult[] = names.map((name) => ({
      name,
      hasGuild: false,
      loading: true,
    }));
    setResults(initialResults);

    // Processar cada nome
    const promises = names.map(async (name, index) => {
      try {
        const response = await fetch("/api/tibia-check", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name }),
        });

        if (!response.ok) {
          throw new Error("Erro ao verificar personagem");
        }

        const data = await response.json();

        // Atualizar resultado específico
        setResults((prev) => {
          const newResults = [...prev];
          newResults[index] = {
            name: data.name,
            hasGuild: data.hasGuild,
            loading: false,
          };
          return newResults;
        });

        return data;
      } catch (error) {
        // Atualizar com erro
        setResults((prev) => {
          const newResults = [...prev];
          newResults[index] = {
            name,
            hasGuild: false,
            loading: false,
            error: true,
          };
          return newResults;
        });

        console.error(`Erro ao verificar ${name}:`, error);
        return null;
      }
    });

    await Promise.all(promises);
    setIsLoading(false);

    toaster.create({
      title: "Verificação concluída",
      description: `${names.length} personagem(ns) verificado(s).`,
      type: "success",
      duration: 3000,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <Container maxW="container.md" py={10}>
      <VStack gap={6} align="stretch">
        <Box textAlign="center">
          <Heading size="2xl" mb={2}>
            Verificador de Guild do Tibia
          </Heading>
          <Text color="gray.600">
            Digite os nomes dos personagens separados por vírgula
          </Text>
        </Box>

        <Stack gap={4}>
          <Input
            placeholder="Ex: Sorin Emperor, Player Name, Another Player"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            size="lg"
            disabled={isLoading}
          />

          <Button
            colorScheme="blue"
            size="lg"
            onClick={handleSubmit}
            loading={isLoading}
            loadingText="Verificando..."
            disabled={isLoading}
          >
            Verificar
          </Button>
        </Stack>

        {results.length > 0 && (
          <Box
            borderWidth={1}
            borderRadius="md"
            p={6}
            bg="gray.50"
            _dark={{ bg: "gray.800" }}
          >
            <Heading size="lg" mb={4}>
              Resultados
            </Heading>
            <VStack align="stretch" gap={3}>
              {results.map((result, index) => (
                <Box
                  key={index}
                  p={4}
                  borderWidth={1}
                  borderRadius="md"
                  bg="white"
                  _dark={{ bg: "gray.700" }}
                  borderColor={
                    result.loading
                      ? "gray.300"
                      : result.error
                      ? "red.300"
                      : result.hasGuild
                      ? "green.300"
                      : "orange.300"
                  }
                >
                  <Text fontWeight="bold" fontSize="lg" mb={1}>
                    {result.name}
                  </Text>
                  {result.loading ? (
                    <Text color="gray.600" fontSize="sm">
                      Verificando...
                    </Text>
                  ) : result.error ? (
                    <Text color="red.600" fontSize="sm">
                      ❌ Erro ao verificar personagem
                    </Text>
                  ) : result.hasGuild ? (
                    <Text color="green.600" fontSize="sm">
                      ✅ Faz parte de uma guild ou tem house
                    </Text>
                  ) : (
                    <Text color="orange.600" fontSize="sm">
                      ⚠️ Não faz parte de uma guild e não tem house
                    </Text>
                  )}
                </Box>
              ))}
            </VStack>
          </Box>
        )}
      </VStack>
    </Container>
  );
}
