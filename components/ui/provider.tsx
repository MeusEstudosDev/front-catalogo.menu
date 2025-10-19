"use client";

import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import * as React from "react";
import { ColorModeProvider, type ColorModeProviderProps } from "./color-mode";
import { Toaster } from "./toaster";

export function Provider(props: React.PropsWithChildren<ColorModeProviderProps>) {
  const { children, ...rest } = props;
  return (

    <ChakraProvider value={defaultSystem}>
      <ColorModeProvider {...rest}>{children}</ColorModeProvider>
      <Toaster />
    </ChakraProvider>
  );
}
