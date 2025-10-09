import Footer from "@/components/ui/footer";
import MainMenu from "@/components/ui/main-menu";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <MainMenu />
        {children}
      </div>
      <Footer />
    </>
  );
}
