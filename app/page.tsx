"use client";

import { PasswordInput } from "@/components/ui/password-input";
import { toaster } from "@/components/ui/toaster";
import { FormControl, FormErrorMessage } from "@chakra-ui/form-control";
import {
  Box,
  Button,
  Heading,
  Input,
  InputGroup,
  Link,
  Text,
  VStack,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { LuLock, LuUser } from "react-icons/lu";
import { z } from "zod";

const schema = z.object({
  email: z.email("E-mail inválido."),
  password: z.string().min(1, "Senha é obrigatória."),
});

type FormData = z.infer<typeof schema>;

export default function Page() {
  const router = useRouter();

  const [visible, setVisible] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    const promise = new Promise((resolve, reject) => {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}sign-in`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      })
        .then((res) => {
          if (!res.ok) {
            return res.json().then((err) => {
              reject(err.message[0] || "Erro desconhecido");
            });
          }
          resolve(res.json());
        })
        .catch((err) => {
          reject(err.message || "Erro desconhecido");
        });
    });

    toaster.promise(promise, {
      loading: {
        title: "Autenticando...",
        description: "Por favor aguarde",
      },
      success: {
        title: "Login efetuado!",
        description: "Seja bem-vindo de volta!",
      },
      error: (err) => ({
        title: "Erro ao autenticar",
        description: err || "Usuário ou senha inválidos.",
      }),
    });

    const response = (await promise) as {
      access_token: string;
      refresh_token: string;
    };

    await fetch("/api/set-cookies", {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({
        value: response.access_token,
        key: "access_token",
      }),
      headers: { "Content-Type": "application/json" },
    })
      .then(() => {
        console.log("Cookie setado");
        router.replace("/dashboard");
      })
      .catch((err) => {
        console.error("Erro ao setar cookie", err);
        toaster.error({
          title: "Erro ao autenticar",
          description: "Não foi possível salvar o cookie de autenticação.",
        });
      });

    await fetch("/api/set-cookies", {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({
        value: response.refresh_token,
        key: "refresh_token",
      }),
      headers: { "Content-Type": "application/json" },
    })
      .then(() => {
        console.log("Cookie setado");
        router.replace("/dashboard");
      })
      .catch((err) => {
        console.error("Erro ao setar cookie", err);
        toaster.error({
          title: "Erro ao autenticar",
          description: "Não foi possível salvar o cookie de autenticação.",
        });
      });
  };

  return (
    <Box pt={20}>
      <Box
        maxW="lg"
        mx="auto"
        p={8}
        borderWidth={1}
        borderRadius="lg"
        boxShadow="md"
      >
        <Heading mb={6} textAlign="center">
          Faça login ou crie uma conta
        </Heading>
        <form onSubmit={handleSubmit(onSubmit)}>
          <VStack>
            <FormControl width="100%" isInvalid={!!errors.email}>
              <InputGroup startElement={<LuUser />}>
                <Input
                  h={12}
                  type="email"
                  placeholder="E-mail"
                  {...register("email")}
                />
              </InputGroup>

              <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
            </FormControl>

            <FormControl width="100%" isInvalid={!!errors.password}>
              <InputGroup startElement={<LuLock />}>
                <PasswordInput
                  h={12}
                  visible={visible}
                  onVisibleChange={setVisible}
                  placeholder="Senha"
                  {...register("password")}
                />
              </InputGroup>
              <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
            </FormControl>

            <Button
              h={12}
              type="submit"
              colorScheme="teal"
              loading={isSubmitting}
              w="full"
              mt={4}
            >
              Entrar
            </Button>

            <Text>
              Ainda não tem cadastro?{" "}
              <Link href="/register" variant="underline" colorPalette="orange">
                crie sua conta
              </Link>
            </Text>

            <Text mt={4} textStyle="sm" textAlign="center">
              Ao continuar, você concorda com as{" "}
              <Link href="/terms" variant="underline" colorPalette="orange">
                Condições de Uso
              </Link>{" "}
              e a
              <Link href="/privacy" variant="underline" colorPalette="orange">
                {" "}
                Notificação de privacidade
              </Link>{" "}
              do uai-food.com
            </Text>
          </VStack>
        </form>
      </Box>
    </Box>
  );
}
