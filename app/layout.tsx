import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/shared/components/Sidebar";
import { Header } from "@/shared/components/Navbar"; // Ojo, asegurate que la ruta sea correcta, antes era header.tsx
import { ThemeProvider } from "@/shared/providers/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sistema de Gestión Agro",
  description: "Control de stock y logística",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`h-screen w-full flex overflow-hidden antialiased ${inter.className}`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Sidebar />

          <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
            <Header />

            <main className="flex-1 overflow-y-auto">
              <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
                {children}
              </div>
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
