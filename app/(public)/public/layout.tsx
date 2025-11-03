import PublicDashboardMenu from "@/components/public-dashboard/menu";
import Footer from "@/components/ui/footer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <PublicDashboardMenu />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {children}
      </div>
      <Footer />
    </>
  );
}
