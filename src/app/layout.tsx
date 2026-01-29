import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// 1. ALTERAÇÃO AQUI: Importe do componente UI que criamos acima, e NÃO direto da biblioteca 'sonner'
import { Toaster } from "@/components/ui/sonner"; 
import { UserProvider } from "@/components/user-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sistema de Agendamento Senac",
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
        <UserProvider>
            {children}
            {/* 2. ALTERAÇÃO AQUI: 
               - theme="dark": Força o fundo preto e texto branco.
               - richColors={false}: Garante o visual neutro (sem fundos verdes/vermelhos).
            */}
            <Toaster 
              theme="dark" 
              richColors={false} 
              position="bottom-right" 
              className="z-[99999]" 
            />
        </UserProvider>
      </body>
    </html>
  );
}