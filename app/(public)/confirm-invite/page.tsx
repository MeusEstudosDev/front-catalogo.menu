"use client";

import { PasswordInput } from "@/components/ui/password-input";
import { toaster } from "@/components/ui/toaster";
import { FormControl, FormErrorMessage } from "@chakra-ui/form-control";
import {
  Box,
  Button,
  Heading,
  Input,
  PinInput,
  Text,
  VStack,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z
  .object({
    code: z.string().min(6, "Código deve ter 6 caracteres."),
    email: z.string().email("E-mail inválido."),
    password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres."),
    confirmPassword: z.string().min(1, "Confirme sua senha."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

const PIN_LENGTH = 6;

function ConfirmInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams.get("email") || "";

  const [verificationCode, setVerificationCode] = useState<string>("");
  const [visiblePassword, setVisiblePassword] = useState(false);
  const [visibleConfirmPassword, setVisibleConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: emailFromUrl,
      code: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    const promise = new Promise((resolve, reject) => {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}users/confirm-invite`, {
        method: "POST",
        body: JSON.stringify({
          code: data.code,
          email: data.email,
          password: data.password,
        }),
        headers: { "Content-Type": "application/json" },
      })
        .then((res) => {
          if (!res.ok) {
            return res.json().then((err) => {
              reject(err.message?.[0] || "Erro desconhecido");
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
        title: "Confirmando convite...",
        description: "Por favor aguarde",
      },
      success: {
        title: "Convite confirmado!",
        description: "Sua conta foi ativada com sucesso.",
      },
      error: (err) => ({
        title: "Erro ao confirmar convite",
        description: err || "Verifique os dados e tente novamente.",
      }),
    });

    try {
      await promise;
      await fetch("/api/delete-cookies?key=profile", {
        method: "DELETE",
      });
      await fetch("/api/delete-cookies?key=access_token", {
        method: "DELETE",
      });
      await fetch("/api/delete-cookies?key=refresh_token", {
        method: "DELETE",
      });
      router.push("/");
    } catch (error) {
      console.error("Erro ao confirmar convite:", error);
    }
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
          Confirmar Convite
        </Heading>
        <Text mb={6} textAlign="center" color="gray.600">
          Digite o código que você recebeu por e-mail e crie sua senha para
          ativar sua conta.
        </Text>
        <form onSubmit={handleSubmit(onSubmit)}>
          <VStack>
            <FormControl width="100%" isInvalid={!!errors.code}>
              <Text mb={2} fontSize="sm" fontWeight="medium">
                Código de verificação
              </Text>
              <PinInput.Root
                value={Array.from(
                  { length: PIN_LENGTH },
                  (_, i) => verificationCode[i] ?? ""
                )}
                onValueChange={(details) => {
                  setVerificationCode(details.valueAsString);
                  setValue("code", details.valueAsString);
                }}
                otp
                type="alphanumeric"
              >
                <PinInput.HiddenInput />
                <PinInput.Control>
                  {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                    <PinInput.Input key={i} index={i} />
                  ))}
                </PinInput.Control>
              </PinInput.Root>
              <FormErrorMessage>{errors.code?.message}</FormErrorMessage>
            </FormControl>

            <FormControl width="100%" isInvalid={!!errors.email}>
              <Text mb={2} fontSize="sm" fontWeight="medium">
                E-mail
              </Text>
              <Input
                h={12}
                type="email"
                placeholder="E-mail"
                readOnly
                disabled
                bg="gray.100"
                cursor="not-allowed"
                {...register("email")}
              />
              <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
            </FormControl>

            <FormControl width="100%" isInvalid={!!errors.password}>
              <Text mb={2} fontSize="sm" fontWeight="medium">
                Senha
              </Text>
              <PasswordInput
                h={12}
                visible={visiblePassword}
                onVisibleChange={setVisiblePassword}
                placeholder="Digite sua senha"
                {...register("password")}
              />
              <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
            </FormControl>

            <FormControl width="100%" isInvalid={!!errors.confirmPassword}>
              <Text mb={2} fontSize="sm" fontWeight="medium">
                Confirmar Senha
              </Text>
              <PasswordInput
                h={12}
                visible={visibleConfirmPassword}
                onVisibleChange={setVisibleConfirmPassword}
                placeholder="Confirme sua senha"
                {...register("confirmPassword")}
              />
              <FormErrorMessage>
                {errors.confirmPassword?.message}
              </FormErrorMessage>
            </FormControl>

            <Button
              h={12}
              type="submit"
              colorScheme="teal"
              loading={isSubmitting}
              w="full"
              mt={4}
            >
              Confirmar e Ativar Conta
            </Button>
          </VStack>
        </form>
      </Box>
    </Box>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <Box pt={20} textAlign="center">
          <Text>Carregando...</Text>
        </Box>
      }
    >
      <ConfirmInviteContent />
    </Suspense>
  );
}
