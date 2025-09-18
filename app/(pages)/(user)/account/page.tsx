"use client";

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
import { useEffect, useState } from "react";
import { FaEdit } from "react-icons/fa";
import { FaRegCopy } from "react-icons/fa6";
import { HiUpload } from "react-icons/hi";
import { MdOutlineManageAccounts, MdOutlinePassword } from "react-icons/md";

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

export default function Page() {
  const [profile, setProfile] = useState<IProfile | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/get-cookies?key=profile");
        const data = await res.json();
        if (data) {
          try {
            const parsed = typeof data === "string" ? JSON.parse(data) : data;
            setProfile(parsed);
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
                    <Input value={profile?.name} onChange={() => {}} />
                  </InputGroup>

                  <InputGroup startAddon="E-mail">
                    <Input value={profile?.email} onChange={() => {}} />
                  </InputGroup>
                </Box>

                <Button alignSelf={"end"} w="160px" display={"flex"} gap={2}>
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
