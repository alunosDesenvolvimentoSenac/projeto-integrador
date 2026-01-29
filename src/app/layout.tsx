import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { UserProvider } from "@/components/user-provider"; // <--- IMPORTAR

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Projeto Integrador",
  description: "Sistema de Agendamento Senac",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <body className={inter.className}>
        {/* O UserProvider envolve tudo */}
        <UserProvider>
            {children}
            <Toaster richColors />
        </UserProvider>
      </body>
    </html>
  );
}