"use client";

import { toaster } from "@/components/ui/toaster";
import {
  Box,
  Button,
  Container,
  Heading,
  HStack,
  Input,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";

interface CharacterResult {
  name: string;
  hasGuild: boolean;
  loading?: boolean;
  error?: boolean;
}

const STORAGE_KEY = "tibia-check-2-char-list";

export default function TibiaCheck2Page() {
  const [inputValue, setInputValue] = useState("");
  const [savedCharacters, setSavedCharacters] = useState<string[]>([]);
  const [showSavedCharacters, setShowSavedCharacters] = useState(true);
  const [results, setResults] = useState<CharacterResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedCharacters = window.localStorage.getItem(STORAGE_KEY);

    if (!storedCharacters) {
      return;
    }

    try {
      const parsedCharacters = JSON.parse(storedCharacters) as string[];
      if (Array.isArray(parsedCharacters)) {
        setSavedCharacters(
          parsedCharacters
            .map((name) => name.trim())
            .filter((name): name is string => name.length > 0),
        );
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedCharacters));
  }, [savedCharacters]);

  const normalizeNames = (value: string) =>
    value
      .split(",")
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

  const addCharacters = () => {
    const namesToAdd = normalizeNames(inputValue);

    if (namesToAdd.length === 0) {
      toaster.create({
        title: "Nenhum nome válido",
        description: "Digite um ou mais nomes separados por vírgula.",
        type: "error",
        duration: 3000,
      });
      return;
    }

    setSavedCharacters((currentCharacters) => {
      const uniqueCharacters = new Set(
        currentCharacters.map((name) => name.toLowerCase()),
      );
      const mergedCharacters = [...currentCharacters];

      namesToAdd.forEach((name) => {
        const normalizedName = name.trim();
        const key = normalizedName.toLowerCase();

        if (!uniqueCharacters.has(key)) {
          uniqueCharacters.add(key);
          mergedCharacters.push(normalizedName);
        }
      });

      return mergedCharacters;
    });

    setInputValue("");
    setShowSavedCharacters(true);

    toaster.create({
      title: "Chars adicionados",
      description: `${namesToAdd.length} char(ns) enviado(s) para a lista.`,
      type: "success",
      duration: 3000,
    });
  };

  const removeCharacter = (characterToRemove: string) => {
    setSavedCharacters((currentCharacters) =>
      currentCharacters.filter((name) => name !== characterToRemove),
    );
  };

  const handleSubmit = async () => {
    if (savedCharacters.length === 0) {
      toaster.create({
        title: "Lista vazia",
        description: "Adicione pelo menos um char na lista antes de pesquisar.",
        type: "error",
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);
    setResults([]);

    const initialResults: CharacterResult[] = savedCharacters.map((name) => ({
      name,
      hasGuild: false,
      loading: true,
    }));
    setResults(initialResults);

    const promises = savedCharacters.map(async (name, index) => {
      try {
        const response = await fetch("/api/tibia-check-2", {
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
      description: `${savedCharacters.length} personagem(ns) verificado(s).`,
      type: "success",
      duration: 3000,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      addCharacters();
    }
  };

  return (
    <Container maxW="container.md" py={10}>
      <VStack gap={6} align="stretch">
        <Stack gap={4}>
          <HStack
            justify="space-between"
            align="center"
            flexWrap="wrap"
            gap={3}
          >
            <Box>
              <Heading size="2xl" mb={2}>
                Verificador de Guild do Tibia
              </Heading>
              <Text color="gray.600">
                Adicione os chars separados por vírgula e consulte a lista salva
              </Text>
            </Box>

            <Button
              variant="outline"
              onClick={() => setShowSavedCharacters((value) => !value)}
            >
              {showSavedCharacters
                ? "Ocultar lista de chares"
                : "Ver lista de chares"}
            </Button>
          </HStack>

          {showSavedCharacters && (
            <>
              <Box display="flex" gap={4}>
                <Input
                  placeholder="Ex: Sorin Emperor, Player Name, Another Player"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  size="lg"
                  disabled={isLoading}
                />

                <Button
                  colorScheme="blue"
                  size="lg"
                  onClick={addCharacters}
                  disabled={isLoading}
                >
                  Adicionar à lista
                </Button>
              </Box>

              <Box
                borderWidth={1}
                borderRadius="md"
                p={4}
                bg="gray.50"
                _dark={{ bg: "gray.800" }}
              >
                {savedCharacters.length === 0 ? (
                  <Text color="gray.500" fontSize="sm">
                    Nenhum char salvo ainda.
                  </Text>
                ) : (
                  <HStack gap={2} flexWrap="wrap">
                    {savedCharacters.map((name) => (
                      <HStack
                        key={name}
                        gap={2}
                        px={3}
                        py={1.5}
                        borderRadius="full"
                        bg="blue.100"
                        _dark={{ bg: "blue.900" }}
                      >
                        <Text fontSize="sm" fontWeight="medium">
                          {name}
                        </Text>
                        <Button
                          size="xs"
                          variant="ghost"
                          aria-label={`Remover ${name}`}
                          onClick={() => removeCharacter(name)}
                        >
                          x
                        </Button>
                      </HStack>
                    ))}
                  </HStack>
                )}
              </Box>
            </>
          )}

          <Stack gap={3}>
            <HStack gap={3} flexWrap="wrap">
              <Button
                colorScheme="green"
                size="lg"
                onClick={handleSubmit}
                loading={isLoading}
                loadingText="Pesquisando..."
                disabled={isLoading}
              >
                Pesquisar chars salvos
              </Button>
            </HStack>
          </Stack>
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
