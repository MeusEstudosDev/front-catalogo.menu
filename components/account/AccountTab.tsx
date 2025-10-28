"use client";

import { toaster } from "@/components/ui/toaster";
import {
    Box,
    Button,
    createListCollection,
    FileUpload,
    Image,
    Input,
    InputGroup,
    Select,
    Text,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FaEdit, FaRegCopy } from "react-icons/fa";
import { HiUpload } from "react-icons/hi";
import z from "zod";
import { IProfile } from "./types";
import {
    convertDisplayDateToNumeric,
    formatCpf,
    formatDate,
    formatISODateToDisplay,
    removeMask,
} from "./utils";

const schema = z.object({
  email: z.string().email("E-mail inválido."),
  name: z.string().min(1, "Nome é obrigatório."),
  cpf: z.string().min(11, "CPF deve ter ao menos 11 caracteres."),
  birth_date: z.string().min(8, "Data de nascimento é obrigatória."),
  gender: z.enum(["MALE", "FEMALE", "OTHER"], {
    message: "Gênero é obrigatório.",
  }),
});

type FormData = z.infer<typeof schema>;

// Collection para o select de gênero
const genderCollection = createListCollection({
  items: [
    { value: "MALE", label: "Masculino" },
    { value: "FEMALE", label: "Feminino" },
    { value: "OTHER", label: "Outro" },
  ],
});

interface AccountTabProps {
  profile: IProfile;
  onProfileUpdate: (profile: IProfile) => void;
}

export function AccountTab({ profile, onProfileUpdate }: AccountTabProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [imageBust, setImageBust] = useState<number>(Date.now());
  const [maskedCpf, setMaskedCpf] = useState<string>(
    profile.cpf ? formatCpf(profile.cpf) : ""
  );
  const [maskedBirthdate, setMaskedBirthdate] = useState<string>(
    profile.birth_date ? formatISODateToDisplay(profile.birth_date) : ""
  );
  const [selectedGender, setSelectedGender] = useState<string>(
    profile?.gender || "OTHER"
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<FormData>({
    defaultValues: {
      email: profile?.email || "",
      name: profile?.name || "",
      cpf: profile?.cpf || "",
      birth_date: profile?.birth_date || "",
      gender: profile?.gender || "OTHER",
    },
    resolver: zodResolver(schema),
  });

  const withCacheBust = (url: string, bust: number) =>
    `${url}${url.includes("?") ? "&" : "?"}cb=${bust}`;

  const onSubmit = async (data: FormData) => {
    const token = await fetch("/api/get-cookies?key=access_token").then((res) =>
      res.json()
    );

    // Remove máscaras e transforma a data
    const cleanCpf = removeMask(data.cpf);
    const cleanBirthDate = convertDisplayDateToNumeric(maskedBirthdate);

    // Transforma a data em formato Date com horário 12:00:00
    let formattedBirthDate: string;
    if (cleanBirthDate && cleanBirthDate.length === 8) {
      // Formato esperado: DDMMAAAA
      const day = cleanBirthDate.substring(0, 2);
      const month = cleanBirthDate.substring(2, 4);
      const year = cleanBirthDate.substring(4, 8);

      // Cria objeto Date com horário 12:00:00
      const dateObj = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        12,
        0,
        0,
        0
      );
      formattedBirthDate = dateObj.toISOString();
    } else {
      formattedBirthDate = cleanBirthDate;
    }

    const cleanData = {
      ...data,
      cpf: cleanCpf,
      birth_date: formattedBirthDate,
    };

    const promise = new Promise((resolve, reject) => {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}users/update/self`, {
        method: "PATCH",
        body: JSON.stringify(cleanData),
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

  return (
    <Box
      display={"flex"}
      flexDir={{ base: "column", lg: "row" }}
      gap={6}
      alignItems={{ base: "center", lg: "flex-start" }}
    >
      <Box
        display={"flex"}
        flexDir={"column"}
        alignItems={"center"}
        w={{ base: "200px", lg: "150px" }}
        minW={{ base: "200px", lg: "150px" }}
        h={{ base: "280px", lg: "260px" }}
        p={2}
        gap={2}
        flexShrink={0}
      >
        <Image
          src={
            previewUrl ||
            withCacheBust(profile?.profile_uri || "", imageBust)
          }
          boxSize={{ base: "200px", lg: "150px" }}
          borderRadius="full"
          fit="cover"
          alt={profile?.name || "Usuário"}
        />

        <FileUpload.Root accept={["image/png", "image/jpg", "image/jpeg"]}>
          <FileUpload.HiddenInput
            onChange={(e) => {
              const file =
                (e.target as HTMLInputElement).files?.[0] || null;
              if (!file) {
                setSelectedFile(null);
                setPreviewUrl(null);
                return;
              }
              const validTypes = ["image/png", "image/jpg", "image/jpeg"];
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

                const promise: Promise<{ profile_uri?: string }> = fetch(
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
                    onProfileUpdate({ ...profile, profile_uri: newUri });
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
                    await navigator.clipboard.writeText(String(profile.code));
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
              value={formatISODateToDisplay(profile?.created_at.toString())}
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
            <Input {...register("name")} />
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
                    await navigator.clipboard.writeText(String(profile.email));
                    toaster.success({
                      title: "Copiado!",
                      description: "E-mail copiado para a área de transferência.",
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

        <Box
          display={"flex"}
          flexDir={{ base: "column", md: "row" }}
          gap={4}
          alignItems={"stretch"}
        >
          <InputGroup startAddon="CPF" flex="1" minW="0">
            <Input
              value={maskedCpf}
              onChange={(e) => {
                const masked = formatCpf(e.target.value);
                const clean = removeMask(e.target.value);
                setMaskedCpf(masked);
                setValue("cpf", clean);
              }}
              placeholder="000.000.000-00"
              maxLength={14}
            />
          </InputGroup>

          <InputGroup startAddon="Data de nascimento" flex="1" minW="0">
            <Input
              value={maskedBirthdate}
              onChange={(e) => {
                const masked = formatDate(e.target.value);
                const clean = removeMask(e.target.value);
                setMaskedBirthdate(masked);
                setValue("birth_date", clean);
              }}
              placeholder="DD/MM/AAAA"
              maxLength={10}
            />
          </InputGroup>

          <InputGroup startAddon="Gênero" flex="1" minW="0">
            <Select.Root
              collection={genderCollection}
              value={[selectedGender]}
              onValueChange={(details) => {
                const value = details.value[0];
                if (value) {
                  setSelectedGender(value);
                  setValue("gender", value as "MALE" | "FEMALE" | "OTHER");
                }
              }}
              positioning={{ sameWidth: true }}
            >
              <Select.HiddenSelect {...register("gender")} />
              <Select.Control>
                <Select.Trigger cursor="pointer">
                  <Select.ValueText placeholder="Selecione o gênero" />
                </Select.Trigger>
                <Select.IndicatorGroup>
                  <Select.Indicator />
                </Select.IndicatorGroup>
              </Select.Control>
              <Select.Positioner>
                <Select.Content>
                  {genderCollection.items.map((item) => (
                    <Select.Item cursor="pointer" item={item} key={item.value}>
                      <Select.ItemText>{item.label}</Select.ItemText>
                      <Select.ItemIndicator />
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Select.Root>
          </InputGroup>
        </Box>

        <Box display={"flex"} gap={4} justifyContent={"space-between"}>
          <Box />
          <Button
            onClick={handleSubmit(onSubmit)}
            loading={isSubmitting}
            colorPalette="black"
            alignSelf={{ base: "stretch", md: "end" }}
            w={{ base: "100%", md: "160px" }}
            display={"flex"}
            gap={2}
          >
            <FaEdit />
            <Text w="100%">Salvar alterações</Text>
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
