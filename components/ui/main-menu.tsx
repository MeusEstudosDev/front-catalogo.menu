"use client";

import { Avatar, Box, Breadcrumb, Flex, Menu, Portal } from "@chakra-ui/react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import React, { Fragment, useEffect, useState } from "react";
import { LuLogOut, LuSettings, LuUser } from "react-icons/lu";

const MainMenu: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch("/api/delete-cookies?key=profile", {
      method: "DELETE",
    });
    await fetch("/api/delete-cookies?key=access_token", {
      method: "DELETE",
    });
    await fetch("/api/delete-cookies?key=refresh_token", {
      method: "DELETE",
    });
    router.refresh();
  };

  const [profile, setProfile] = useState<{
    name?: string;
    profile_uri?: string;
  } | null>(null);
  const [imageBust, setImageBust] = useState<number>(Date.now());

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

    const handler = (e: Event) => {
      const custom = e as CustomEvent<string>;
      const newUri = custom.detail;
      if (typeof newUri === "string") {
        setProfile((prev) => (prev ? { ...prev, profile_uri: newUri } : prev));
        setImageBust(Date.now());
      } else {
        setImageBust(Date.now());
      }
    };
    window.addEventListener(
      "profile-picture-updated",
      handler as EventListener
    );
    return () =>
      window.removeEventListener(
        "profile-picture-updated",
        handler as EventListener
      );
  }, []);

  const withCacheBust = (url?: string, bust?: number) =>
    url
      ? `${url}${url.includes("?") ? "&" : "?"}cb=${bust ?? Date.now()}`
      : undefined;

  return (
    <>
      <Box
        as="nav"
        w="100%"
        py={4}
        borderBottom="1px"
        bg="gray.950"
        borderColor="gray.100"
        display={"flex"}
        flexDir={"row"}
        justifyContent={"space-between"}
        px={16}
        alignItems={"center"}
      >
        <Flex as="ul" gap={8} listStyleType="none" m={0} p={0} justify="center">
          <Box as="li" display="flex" alignItems="center" gap={2}>
            <Image
              src="/favicon.png"
              alt="catalogo.menu"
              width={40}
              height={40}
            />
          </Box>
        </Flex>

        <Menu.Root positioning={{ placement: "right-end" }}>
          <Menu.Trigger rounded="full" focusRing="none">
            <Avatar.Root
              colorPalette="green"
              variant="subtle"
              style={{ cursor: "pointer" }}
            >
              <Avatar.Fallback name={profile?.name || "Usuário"} />
              <Avatar.Image
                src={withCacheBust(profile?.profile_uri, imageBust)}
              />
            </Avatar.Root>
          </Menu.Trigger>
          <Portal>
            <Menu.Positioner>
              <Menu.Content>
                <Menu.Item value="profile">
                  <Avatar.Root variant="subtle" size="xs">
                    <Avatar.Fallback name={profile?.name || "Usuário"} />
                    <Avatar.Image
                      src={withCacheBust(profile?.profile_uri, imageBust)}
                    />
                  </Avatar.Root>
                  {profile?.name}
                </Menu.Item>

                <Menu.Separator />

                <Menu.Item
                  onClick={() => router.replace("/account")}
                  style={{ cursor: "pointer" }}
                  value="account"
                >
                  <Flex align="center" gap={2}>
                    <LuUser />
                    Minha conta
                  </Flex>
                </Menu.Item>

                <Menu.Item
                  value="settings"
                  style={{ cursor: "pointer" }}
                  onClick={() => router.replace("/settings")}
                >
                  <Flex align="center" gap={2}>
                    <LuSettings />
                    Configurações
                  </Flex>
                </Menu.Item>

                <Menu.Separator />

                <Menu.Item
                  value="logout"
                  style={{ cursor: "pointer" }}
                  onClick={handleLogout}
                >
                  <Flex align="center" gap={2}>
                    <LuLogOut /> Logout
                  </Flex>
                </Menu.Item>
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>
      </Box>

      <Breadcrumb.Root ml={4} mt={2}>
        <Breadcrumb.List>
          {pathname !== "/dashboard" &&
            pathname.split("/").map((path, index) => {
              const pathTranslated: Record<string, string> = {
                account: "minha conta",
                settings: "configurações",
              };

              const value =
                index === 0 ? "dashboard" : pathTranslated[path] || path;

              return (
                <Fragment key={value}>
                  <Breadcrumb.Separator />

                  <Breadcrumb.Item>
                    <button
                      onClick={() => router.replace(`/${path}`)}
                      style={{ cursor: "pointer" }}
                    >
                      {value}
                    </button>
                  </Breadcrumb.Item>
                </Fragment>
              );
            })}
        </Breadcrumb.List>
      </Breadcrumb.Root>
    </>
  );
};

const LinkMainMenu: React.FC<{
  href: string;
  pathname: string;
  children: React.ReactNode;
}> = ({ href, pathname, children }) => {
  const router = useRouter();

  const isActive =
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <button
      onClick={() => router.replace(href)}
      style={{ cursor: "pointer", fontWeight: isActive ? "bold" : undefined }}
    >
      {children}
    </button>
  );
};

export default MainMenu;
