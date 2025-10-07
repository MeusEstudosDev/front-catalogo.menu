"use client";

import {
  AccountTab,
  AddressesTab,
  ChangePasswordTab,
  IProfile,
  PhonesTab,
} from "@/components/account";
import { Box, Tabs } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import {
  MdOutlineLocationOn,
  MdOutlineManageAccounts,
  MdOutlinePassword,
} from "react-icons/md";

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
      <Tabs.Root defaultValue="account" mt={8}>
        <Tabs.List>
          <Tabs.Trigger value="account">
            <MdOutlineManageAccounts />
            Meus dados
          </Tabs.Trigger>

          <Tabs.Trigger value="phones">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
            </svg>
            Telefones
          </Tabs.Trigger>

          <Tabs.Trigger value="addresses">
            <MdOutlineLocationOn />
            Endereços
          </Tabs.Trigger>

          <Tabs.Trigger value="change-password">
            <MdOutlinePassword />
            Alterar senha
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="account">
          {profile && <AccountTab profile={profile} onProfileUpdate={setProfile} />}
        </Tabs.Content>

        <Tabs.Content value="phones">
          <PhonesTab />
        </Tabs.Content>

        <Tabs.Content value="addresses">
          <AddressesTab />
        </Tabs.Content>

        <Tabs.Content value="change-password">
          <ChangePasswordTab />
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
}
