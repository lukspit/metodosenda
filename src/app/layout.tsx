import type { Metadata } from "next";
import { AppProvider } from "../context/AppContext";
import { DashboardLayout } from "../components/DashboardLayout";
import "./globals.css";

export const metadata: Metadata = {
  title: "Método Senda Core",
  description: "Plataforma de Consultoria Estratégica Assistida por IA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full bg-[#F8F9FC] dark:bg-[#0F172A] text-slate-800 dark:text-slate-100 font-sans">
        <AppProvider>
          <DashboardLayout>{children}</DashboardLayout>
        </AppProvider>
      </body>
    </html>
  );
}

