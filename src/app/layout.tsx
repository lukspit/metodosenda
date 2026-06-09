import type { Metadata } from "next";
import { AppProvider } from "../context/AppContext";
import { DashboardLayout } from "../components/DashboardLayout";
import "./globals.css";

export const metadata: Metadata = {
  title: "Método Senda Core",
  description: "Plataforma de Consultoria Estratégica Assistida por IA",
  icons: {
    icon: '/icon.png',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full bg-white text-slate-800 font-sans">
        <AppProvider>
          <DashboardLayout>{children}</DashboardLayout>
        </AppProvider>
      </body>
    </html>
  );
}


