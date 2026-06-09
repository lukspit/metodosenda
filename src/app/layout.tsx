import type { Metadata, Viewport } from "next";
import { AppProvider } from "../context/AppContext";
import { DashboardLayout } from "../components/DashboardLayout";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1E2538",
};

export const metadata: Metadata = {
  title: "Método Senda Core",
  description: "Plataforma de Consultoria Estratégica Assistida por IA",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Senda",
  },
  icons: {
    icon: '/icon.png',
    apple: '/icons/icon-192.png',
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('ServiceWorker registrado com sucesso no escopo: ', registration.scope);
                    },
                    function(err) {
                      console.log('Falha ao registrar ServiceWorker: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}



