"use client";

import { toaster } from "@/components/ui/toaster";
import { formatDate } from "@/utils/converte-date";
import {
  Box,
  Button,
  FileUpload,
  Image,
  Input,
  InputGroup,
  Tabs,
  Text,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
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
  const [profile, setProfile] = useState<IProfile | null>(null);

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
    const token = await fetch("/api/get-cookies?key=access_token");
    console.log("token", token);

    const promise = new Promise((resolve, reject) => {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}users/update/self`, {
        method: "PATCH",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
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
        description: "Seja bem-vindo de volta!",
      },
      error: (err) => ({
        title: "Erro ao atualizar",
        description: err || "Erro desconhecido.",
      }),
    });
  };

  return (
    <Box px={8}>
      <Tabs.Root defaultValue="members" mt={8}>
        <Tabs.List>
          <Tabs.Trigger value="account">
            <MdOutlineManageAccounts />
            Meus dados
          </Tabs.Trigger>

          <Tabs.Trigger value="projects">
            <MdOutlinePassword />
            Alterar senha
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="account">
          {profile && (
            <Box display={"flex"} flexDir={"row"} gap={4}>
              <Box display={"flex"} alignContent={"center"} flexDir={"column"}>
                <Image
                  src={profile?.profile_uri}
                  boxSize="150px"
                  borderRadius="full"
                  fit="cover"
                  alt={profile?.name || "Usuário"}
                />

                <FileUpload.Root accept={["image/png"]}>
                  <FileUpload.HiddenInput />
                  <FileUpload.Trigger asChild>
                    <Button variant="outline" size="sm" w="100%">
                      <HiUpload /> Upload file
                    </Button>
                  </FileUpload.Trigger>
                  <FileUpload.List />
                </FileUpload.Root>
              </Box>

              <Box display={"flex"} flexDir={"column"} gap={4} w={"100%"}>
                <Box display={"flex"} flexDir={"row"} gap={4}>
                  <InputGroup startAddon="Código" endElement={<FaRegCopy />}>
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

                  <InputGroup startAddon="E-mail">
                    <Input {...register("email")} onChange={() => {}} />
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

        <Tabs.Content value="projects">Manage your projects</Tabs.Content>
      </Tabs.Root>
    </Box>
  );
}
// profile_uri   String     @default("/public/images/default-profile?.png")
// type          UserType   @default(APPLICATION)
