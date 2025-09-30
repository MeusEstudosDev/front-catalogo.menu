"use client";

import { PasswordInput } from "@/components/ui/password-input";
import { toaster } from "@/components/ui/toaster";
import { formatDate } from "@/utils/converte-date";
import {
  Box,
  Button,
  FileUpload,
  Image,
  Input,
  InputGroup,
  PinInput,
  Tabs,
  Text,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FaEdit } from "react-icons/fa";
import { FaRegCopy } from "react-icons/fa6";
import { HiUpload } from "react-icons/hi";
import { MdOutlineManageAccounts, MdOutlinePassword } from "react-icons/md";
import z from "zod";

interface IProfile {
  id: string;
  code: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  email: string;
  name: string;
  status: string;
  profile_uri: string;
  type: string;
}

const schema = z.object({
  email: z.email("E-mail inválido."),
  name: z.string().min(1, "Nome é obrigatório."),
});

type FormData = z.infer<typeof schema>;

export default function Page() {
  const router = useRouter();

  const [profile, setProfile] = useState<IProfile | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [imageBust, setImageBust] = useState<number>(Date.now());
  const [stepChangePwd, setStepChangePwd] = useState<"form" | "code">("form");
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [isRequestingPwd, setIsRequestingPwd] = useState(false);
  const [isConfirmingPwd, setIsConfirmingPwd] = useState(false);
  const [userTokenId, setUserTokenId] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<FormData>({
    defaultValues: {
      email: profile?.email || "",
      name: profile?.name || "",
    },
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/get-cookies?key=profile");
        const data = await res.json();
        if (data) {
          try {
            const parsed = typeof data === "string" ? JSON.parse(data) : data;
            setProfile(parsed);
            setValue("email", parsed.email);
            setValue("name", parsed.name);
          } catch {
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
      } catch {
        setProfile(null);
      }
    }
    fetchProfile();
  }, []);

  const onSubmit = async (data: FormData) => {
    const token = await fetch("/api/get-cookies?key=access_token").then((res) =>
      res.json()
    );

    const promise = new Promise((resolve, reject) => {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}users/update/self`, {
        method: "PATCH",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
        title: "Atualizando...",
        description: "Por favor aguarde",
      },
      success: {
        title: "Atualização efetuada!",
        description: "Dados atualizados com sucesso.",
      },
      error: (err) => ({
        title: "Erro ao atualizar",
        description: err || "Erro desconhecido.",
      }),
    });

    await fetch("/api/delete-cookies?key=profile", {
      method: "DELETE",
    });
  };

  const withCacheBust = (url: string, bust: number) =>
    `${url}${url.includes("?") ? "&" : "?"}cb=${bust}`;

  // schema e form de alteração de senha
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
    <Box px={8}>
      <Tabs.Root defaultValue="account" mt={8}>
        <Tabs.List>
          <Tabs.Trigger value="account">
            <MdOutlineManageAccounts />
            Meus dados
          </Tabs.Trigger>

          <Tabs.Trigger value="change-password">
            <MdOutlinePassword />
            Alterar senha
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="account">
          {profile && (
            <Box display={"flex"} flexDir={"row"} gap={4}>
              <Box
                display={"flex"}
                flexDir={"column"}
                alignItems={"center"}
                w="150px"
                minW="150px"
                h="260px"
                p={2}
                gap={2}
              >
                <Image
                  src={
                    previewUrl ||
                    withCacheBust(profile?.profile_uri || "", imageBust)
                  }
                  boxSize="150px"
                  borderRadius="full"
                  fit="cover"
                  alt={profile?.name || "Usuário"}
                />

                <FileUpload.Root
                  accept={["image/png", "image/jpg", "image/jpeg"]}
                >
                  <FileUpload.HiddenInput
                    onChange={(e) => {
                      const file =
                        (e.target as HTMLInputElement).files?.[0] || null;
                      if (!file) {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                        return;
                      }
                      const validTypes = [
                        "image/png",
                        "image/jpg",
                        "image/jpeg",
                      ];
                      if (!validTypes.includes(file.type)) {
                        toaster.error({
                          title: "Tipo de arquivo inválido",
                          description: "Selecione uma imagem PNG ou JPG.",
                        });
                        (e.target as HTMLInputElement).value = "";
                        return;
                      }
                      const maxSize = 5 * 1024 * 1024; // 5MB
                      if (file.size > maxSize) {
                        toaster.error({
                          title: "Arquivo muito grande",
                          description: "O tamanho máximo é de 5MB.",
                        });
                        (e.target as HTMLInputElement).value = "";
                        return;
                      }

                      setSelectedFile(file);
                      const url = URL.createObjectURL(file);
                      setPreviewUrl(url);
                    }}
                  />
                  <FileUpload.Trigger asChild>
                    <Button variant="outline" size="sm" w="100%">
                      <HiUpload /> Alterar foto
                    </Button>
                  </FileUpload.Trigger>
                </FileUpload.Root>

                {selectedFile && (
                  <Box display="flex" gap={2} mt={2}>
                    <Button
                      size="sm"
                      colorPalette="green"
                      loading={isUploadingPicture}
                      onClick={async () => {
                        if (!selectedFile) return;
                        setIsUploadingPicture(true);

                        const token = await fetch(
                          "/api/get-cookies?key=access_token"
                        ).then((res) => res.json());

                        const formData = new FormData();
                        formData.append("picture", selectedFile);

                        const promise: Promise<{ profile_uri?: string }> =
                          fetch(
                            `${process.env.NEXT_PUBLIC_API_URL}users/update/picture`,
                            {
                              method: "PATCH",
                              headers: {
                                Authorization: `Bearer ${token}`,
                              },
                              body: formData,
                            }
                          ).then(async (res) => {
                            if (!res.ok) {
                              const err = await res.json().catch(() => ({}));
                              throw new Error(
                                err?.message?.[0] ||
                                  err?.message ||
                                  "Erro ao enviar imagem"
                              );
                            }
                            return res.json().catch(() => ({}));
                          });

                        toaster.promise(promise, {
                          loading: {
                            title: "Enviando imagem...",
                            description:
                              "Aguarde enquanto atualizamos sua foto de perfil.",
                          },
                          success: {
                            title: "Imagem atualizada!",
                            description:
                              "Sua foto de perfil foi alterada com sucesso.",
                          },
                          error: (err: any) => ({
                            title: "Falha no upload",
                            description:
                              (typeof err === "string" ? err : err?.message) ||
                              "Não foi possível enviar a imagem.",
                          }),
                        });

                        try {
                          const data = await promise;
                          if (data && typeof data.profile_uri === "string") {
                            const newUri: string = data.profile_uri;
                            setProfile((prev) =>
                              prev ? { ...prev, profile_uri: newUri } : prev
                            );
                            setImageBust(Date.now());
                            window.dispatchEvent(
                              new CustomEvent("profile-picture-updated", {
                                detail: newUri,
                              })
                            );
                          }
                          setSelectedFile(null);
                          if (previewUrl) URL.revokeObjectURL(previewUrl);
                          setPreviewUrl(null);
                          await fetch("/api/delete-cookies?key=profile", {
                            method: "DELETE",
                          });
                        } finally {
                          setIsUploadingPicture(false);
                        }
                      }}
                    >
                      Confirmar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedFile(null);
                        if (previewUrl) URL.revokeObjectURL(previewUrl);
                        setPreviewUrl(null);
                      }}
                    >
                      Cancelar
                    </Button>
                  </Box>
                )}
              </Box>

              <Box display={"flex"} flexDir={"column"} gap={4} w={"100%"}>
                <Box display={"flex"} flexDir={"row"} gap={4}>
                  <InputGroup
                    startAddon="Código"
                    endElement={
                      <Box
                        as="button"
                        onClick={async (e) => {
                          e.preventDefault();
                          if (profile?.code == null) return;
                          try {
                            await navigator.clipboard.writeText(
                              String(profile.code)
                            );
                            toaster.success({
                              title: "Copiado!",
                              description:
                                "Código copiado para a área de transferência.",
                            });
                          } catch {
                            toaster.error({
                              title: "Falha ao copiar",
                              description: "Não foi possível copiar o código.",
                            });
                          }
                        }}
                        aria-label="Copiar código"
                        cursor="pointer"
                        bg="transparent"
                        border="none"
                        _hover={{ color: "accent.solid" }}
                      >
                        <FaRegCopy />
                      </Box>
                    }
                  >
                    <Input value={profile?.code} disabled readOnly />
                  </InputGroup>

                  <InputGroup startAddon="Cadastrado">
                    <Input
                      value={formatDate(profile?.created_at.toString())}
                      disabled
                      readOnly
                    />
                  </InputGroup>

                  <InputGroup startAddon="Status">
                    <Input value={profile?.status} disabled readOnly />
                  </InputGroup>
                </Box>

                <Box display={"flex"} flexDir={"row"} gap={4}>
                  <InputGroup startAddon="Nome">
                    <Input {...register("name")} onChange={() => {}} />
                  </InputGroup>

                  <InputGroup
                    startAddon="E-mail"
                    endElement={
                      <Box
                        as="button"
                        onClick={async (e) => {
                          e.preventDefault();
                          if (profile?.email == null) return;
                          try {
                            await navigator.clipboard.writeText(
                              String(profile.email)
                            );
                            toaster.success({
                              title: "Copiado!",
                              description:
                                "E-mail copiado para a área de transferência.",
                            });
                          } catch {
                            toaster.error({
                              title: "Falha ao copiar",
                              description: "Não foi possível copiar o e-mail.",
                            });
                          }
                        }}
                        aria-label="Copiar e-mail"
                        cursor="pointer"
                        bg="transparent"
                        border="none"
                        _hover={{ color: "accent.solid" }}
                      >
                        <FaRegCopy />
                      </Box>
                    }
                  >
                    <Input value={profile?.email} disabled readOnly />
                  </InputGroup>
                </Box>

                <Button
                  onClick={handleSubmit(onSubmit)}
                  alignSelf={"end"}
                  w="160px"
                  display={"flex"}
                  gap={2}
                >
                  <FaEdit />
                  <Text w="100%">Salvar alterações</Text>
                </Button>
              </Box>
            </Box>
          )}
        </Tabs.Content>

        <Tabs.Content value="change-password">
          <Box display="flex" flexDir="column" gap={4} maxW="520px">
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
                  alignSelf="start"
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
                <Button
                  alignSelf="start"
                  loading={isConfirmingPwd}
                  onClick={onConfirmChangePassword}
                >
                  Confirmar alteração
                </Button>
              </>
            )}
          </Box>
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
}
