import { Provider } from "@/components/ui/provider";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "catalogo.menu",
  description: "Sistema de pedidos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
      >
        <Provider>
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {children}
          </div>
        </Provider>
      </body>
    </html>
  );
}
