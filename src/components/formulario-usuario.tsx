"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select" 

// Firebase e Server Action
import { createUserWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { cadastrarUsuarioNoBanco } from "@/app/actions/admin"

// Tipagem das props para receber as unidades e perfis do banco
interface FormularioProps extends React.ComponentPropsWithoutRef<"div"> {
  unidades: {
    idUnidade: number;
    descricaoUnidade: string;
  }[];
  perfis: {
    idPerfil: number;
    descricaoPerfil: string;
  }[];
}

export function FormularioUsuario({
  className,
  unidades = [], 
  perfis = [],
  ...props
}: FormularioProps) {
  
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [unidadeSelecionada, setUnidadeSelecionada] = useState<string>("")
  const [perfilSelecionado, setPerfilSelecionado] = useState<string>("") // Estado para o perfil
  
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setLoading(true);
      
      const form = event.currentTarget;
      const formData = new FormData(form);
      
      // Captura dados dos inputs
      const nome = formData.get("nome") as string
      const email = formData.get("email") as string
      const password = formData.get("password") as string 

      try {
        if (!unidadeSelecionada) {
            throw new Error("Por favor selecione a Unidade.");
        }
        if (!perfilSelecionado) {
            throw new Error("Por favor selecione o Perfil.");
        }

        // 1. Cria usuário no Firebase (Client Side)
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        const uid = userCredential.user.uid

        // 2. Envia para o Banco de Dados (Server Action)
        const result = await cadastrarUsuarioNoBanco(
            uid,
            nome,
            email,
            Number(unidadeSelecionada),
            Number(perfilSelecionado) // Envia o ID do perfil selecionado
        );

        if (result && result.success === true) {
            alert(result.message);
            form.reset();
            setUnidadeSelecionada("");
            setPerfilSelecionado("");
        } else {
            throw new Error(result?.message || "Erro desconhecido ao salvar no banco.");
        }

      } catch (error: any) {
        console.error("Erro capturado no catch:", error);
        
        let msg = error.message || "Erro desconhecido";
        
        if (error.code === 'auth/email-already-in-use') msg = "E-mail já cadastrado.";
        
        alert("Atenção: " + msg);
      } finally {
        setLoading(false);
      }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}> 
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-xl font-bold">Cadastro de Usuários</h1>
            <p className="text-sm text-muted-foreground">Crie o acesso para um novo usuário no sistema</p>
          </div>
          <div className="flex flex-col gap-6">
            
            {/* Campo Nome */}
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome Completo</Label>
              <Input
                id="nome"
                name="nome"
                type="text"
                placeholder="Ex: Carlos Silva"
                required
                disabled={loading}
              />
            </div>

            {/* Campo Email */}
            <div className="grid gap-2">
              <Label htmlFor="email">Email Corporativo</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="usuario@senac.com.br"
                required
                disabled={loading}
              />
            </div>
            
            {/* Campo Unidade (Select) */}
            <div className="grid gap-2">
              <Label htmlFor="unidade">Unidade</Label>
              <Select 
                value={unidadeSelecionada} 
                onValueChange={setUnidadeSelecionada}
                disabled={loading}
              >
                 <SelectTrigger className="w-full"> 
                     <SelectValue placeholder="Selecione a unidade..." />
                 </SelectTrigger>
                 <SelectContent>
                    {unidades?.map((unidade) => (
                        <SelectItem key={unidade.idUnidade} value={String(unidade.idUnidade)}>
                            {unidade.descricaoUnidade}
                        </SelectItem>
                    ))}
                 </SelectContent>
              </Select>
            </div>

            {/* Campo Perfil (Select) - NOVO */}
            <div className="grid gap-2">
              <Label htmlFor="perfil">Perfil de Acesso</Label>
              <Select 
                value={perfilSelecionado} 
                onValueChange={setPerfilSelecionado}
                disabled={loading}
              >
                 <SelectTrigger className="w-full"> 
                     <SelectValue placeholder="Selecione o perfil..." />
                 </SelectTrigger>
                 <SelectContent>
                    {perfis?.map((perfil) => (
                        <SelectItem key={perfil.idPerfil} value={String(perfil.idPerfil)}>
                            {perfil.descricaoPerfil}
                        </SelectItem>
                    ))}
                 </SelectContent>
              </Select>
            </div>

            {/* Campo Senha */}
            <div className="grid gap-2">
              <Label htmlFor="password">Senha Provisória</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Cadastrando..." : "Cadastrar Usuário"}
            </Button>
          </div>
          
        </div>
      </form>
      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary  ">
        Desenvolvido por Senac Minas - Curso de Desenvolvimento de Sistemas - 2025
      </div>
    </div>
  )
}