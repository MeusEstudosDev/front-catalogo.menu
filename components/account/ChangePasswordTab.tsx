"use client";

import { PasswordInput } from "@/components/ui/password-input";
import { toaster } from "@/components/ui/toaster";
import { Box, Button, PinInput, Text } from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

const changePwdSchema = z
  .object({
    current_password: z.string().min(1, "Senha atual é obrigatória."),
    new_password: z
      .string()
      .min(8, "A nova senha deve ter pelo menos 8 caracteres."),
    confirm_new_password: z.string().min(1, "Confirme a nova senha."),
  })
  .refine((data) => data.new_password === data.confirm_new_password, {
    message: "As senhas não coincidem.",
    path: ["confirm_new_password"],
  });

type ChangePasswordFormData = z.infer<typeof changePwdSchema>;

export function ChangePasswordTab() {
  const router = useRouter();
  const [stepChangePwd, setStepChangePwd] = useState<"form" | "code">("form");
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [isRequestingPwd, setIsRequestingPwd] = useState(false);
  const [isConfirmingPwd, setIsConfirmingPwd] = useState(false);
  const [userTokenId, setUserTokenId] = useState<string>("");

  const {
    register: registerPwd,
    handleSubmit: handleSubmitPwd,
    formState: { errors: errorsPwd, isSubmitting: isSubmittingPwd },
    reset: resetPwd,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePwdSchema),
  });

  const onRequestChangePassword = async (data: ChangePasswordFormData) => {
    const token = await fetch("/api/get-cookies?key=access_token").then((r) =>
      r.json()
    );

    setIsRequestingPwd(true);
    const promise = fetch(
      `${process.env.NEXT_PUBLIC_API_URL}users/change-password`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: data.current_password,
          new_password: data.new_password,
        }),
      }
    ).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          err?.message?.[0] || err?.message || "Falha ao solicitar alteração"
        );
      }
      return res.json().catch(() => ({}));
    });

    toaster.promise(promise, {
      loading: {
        title: "Solicitando...",
        description: "Enviando código de verificação para seu e-mail.",
      },
      success: {
        title: "Código enviado",
        description:
          "Enviamos um código de 6 dígitos para seu e-mail. Digite abaixo para confirmar.",
      },
      error: (err: any) => ({
        title: "Erro",
        description:
          (typeof err === "string" ? err : err?.message) ||
          "Não foi possível iniciar a alteração de senha.",
      }),
    });

    try {
      const data = await promise;
      setUserTokenId(data.user_token_id);
      setStepChangePwd("code");
    } finally {
      setIsRequestingPwd(false);
    }
  };

  const onConfirmChangePassword = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toaster.error({
        title: "Código inválido",
        description: "Digite os 6 dígitos enviados para o seu e-mail.",
      });
      return;
    }
    const token = await fetch("/api/get-cookies?key=access_token").then((r) =>
      r.json()
    );
    setIsConfirmingPwd(true);
    const promise = fetch(
      `${process.env.NEXT_PUBLIC_API_URL}users/confirm-change-password`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          token: verificationCode,
          user_token_id: userTokenId,
        }),
      }
    ).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          err?.message?.[0] || err?.message || "Falha ao confirmar alteração"
        );
      }
      return res.json().catch(() => ({}));
    });

    toaster.promise(promise, {
      loading: {
        title: "Confirmando...",
        description: "Validando o código informado.",
      },
      success: {
        title: "Senha alterada!",
        description: "Sua senha foi atualizada com sucesso.",
      },
      error: (err: any) => ({
        title: "Erro na confirmação",
        description:
          (typeof err === "string" ? err : err?.message) ||
          "Não foi possível confirmar a alteração.",
      }),
    });

    try {
      await promise; // sucesso
      // Remove cookies apenas após confirmação bem-sucedida
      try {
        await Promise.all([
          fetch("/api/delete-cookies?key=profile", { method: "DELETE" }),
          fetch("/api/delete-cookies?key=access_token", { method: "DELETE" }),
          fetch("/api/delete-cookies?key=refresh_token", { method: "DELETE" }),
        ]);
      } catch {
        // silenciosamente ignora erros ao apagar cookies
      }

      setVerificationCode("");
      setStepChangePwd("form");
      resetPwd();
      router.push("/");
    } catch (e) {
    } finally {
      setIsConfirmingPwd(false);
    }
  };

  return (
    <Box
      display="flex"
      flexDir="column"
      gap={4}
      maxW={{ base: "100%", md: "520px" }}
      mx={{ base: 0, md: "auto" }}
      px={{ base: 4, md: 0 }}
    >
      {stepChangePwd === "form" && (
        <>
          <PasswordInput
            placeholder="Senha atual"
            {...registerPwd("current_password")}
          />
          {errorsPwd.current_password && (
            <Text color="red.500" textStyle="sm">
              {errorsPwd.current_password.message}
            </Text>
          )}

          <PasswordInput
            placeholder="Nova senha"
            {...registerPwd("new_password")}
          />
          {errorsPwd.new_password && (
            <Text color="red.500" textStyle="sm">
              {errorsPwd.new_password.message}
            </Text>
          )}

          <PasswordInput
            placeholder="Confirme a nova senha"
            {...registerPwd("confirm_new_password")}
          />
          {errorsPwd.confirm_new_password && (
            <Text color="red.500" textStyle="sm">
              {errorsPwd.confirm_new_password.message}
            </Text>
          )}

          <Button
            alignSelf={{ base: "stretch", md: "start" }}
            w={{ base: "100%", md: "auto" }}
            loading={isRequestingPwd || isSubmittingPwd}
            onClick={handleSubmitPwd(onRequestChangePassword)}
          >
            Enviar
          </Button>
        </>
      )}

      {stepChangePwd === "code" && (
        <>
          <Box>
            <Text mb={2}>Código de verificação</Text>
            <Box
              display="flex"
              justifyContent={{ base: "center", md: "flex-start" }}
            >
              <PinInput.Root
                value={verificationCode.split("")}
                onValueChange={(details) =>
                  setVerificationCode(
                    Array.isArray(details.value)
                      ? details.value.join("")
                      : details.value
                  )
                }
                otp
                type="alphanumeric"
              >
                <PinInput.HiddenInput />
                <PinInput.Control>
                  <PinInput.Input index={0} />
                  <PinInput.Input index={1} />
                  <PinInput.Input index={2} />
                  <PinInput.Input index={3} />
                  <PinInput.Input index={4} />
                  <PinInput.Input index={5} />
                </PinInput.Control>
              </PinInput.Root>
            </Box>
          </Box>
          <Button
            alignSelf={{ base: "stretch", md: "start" }}
            w={{ base: "100%", md: "auto" }}
            loading={isConfirmingPwd}
            onClick={onConfirmChangePassword}
          >
            Confirmar alteração
          </Button>
        </>
      )}
    </Box>
  );
}
