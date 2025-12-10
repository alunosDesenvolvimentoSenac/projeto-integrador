"use client"

import { useState } from "react"
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

// Tipagem das props atualizada para receber perfis
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
  
  const [loading, setLoading] = useState(false)
  const [unidadeSelecionada, setUnidadeSelecionada] = useState<string>("")
  const [perfilSelecionado, setPerfilSelecionado] = useState<string>("") // Novo State
  
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setLoading(true);
      
      const form = event.currentTarget;
      const formData = new FormData(form);
      
      const nome = formData.get("nome") as string
      const email = formData.get("email") as string
      const password = formData.get("password") as string 

      try {
        if (!unidadeSelecionada) throw new Error("Selecione a Unidade.");
        if (!perfilSelecionado) throw new Error("Selecione o Perfil de acesso.");

        // 1. Cria usuário no Firebase
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        const uid = userCredential.user.uid

        // 2. Envia para o Banco com o Perfil Selecionado
        const result = await cadastrarUsuarioNoBanco(
            uid,
            nome,
            email,
            Number(unidadeSelecionada),
            Number(perfilSelecionado) // Envia o ID escolhido
        );

        if (result && result.success) {
            alert(result.message);
            form.reset();
            setUnidadeSelecionada("");
            setPerfilSelecionado("");
        } else {
            throw new Error(result?.message || "Erro desconhecido.");
        }

      } catch (error: any) {
        console.error(error);
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
            <p className="text-sm text-muted-foreground">Cadastre Docentes, Coordenadores ou Admins</p>
          </div>
          <div className="flex flex-col gap-6">
            
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome Completo</Label>
              <Input id="nome" name="nome" type="text" placeholder="Ex: Ana Souza" required disabled={loading} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email Corporativo</Label>
              <Input id="email" name="email" type="email" placeholder="usuario@senac.com.br" required disabled={loading} />
            </div>
            
            {/* SELECT UNIDADE */}
            <div className="grid gap-2">
              <Label htmlFor="unidade">Unidade</Label>
              <Select value={unidadeSelecionada} onValueChange={setUnidadeSelecionada} disabled={loading}>
                 <SelectTrigger className="w-full"> 
                     <SelectValue placeholder="Selecione a unidade..." />
                 </SelectTrigger>
                 <SelectContent>
                    {unidades?.map((item) => (
                        <SelectItem key={item.idUnidade} value={String(item.idUnidade)}>
                            {item.descricaoUnidade}
                        </SelectItem>
                    ))}
                 </SelectContent>
              </Select>
            </div>

            {/* SELECT PERFIL (NOVO) */}
            <div className="grid gap-2">
              <Label htmlFor="perfil">Perfil de Acesso</Label>
              <Select value={perfilSelecionado} onValueChange={setPerfilSelecionado} disabled={loading}>
                 <SelectTrigger className="w-full"> 
                     <SelectValue placeholder="Selecione o nível de acesso..." />
                 </SelectTrigger>
                 <SelectContent>
                    {perfis?.map((item) => (
                        <SelectItem key={item.idPerfil} value={String(item.idPerfil)}>
                            {item.descricaoPerfil}
                        </SelectItem>
                    ))}
                 </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Senha Provisória</Label>
              <Input id="password" name="password" type="password" placeholder="******" required minLength={6} disabled={loading} />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Salvando..." : "Cadastrar Usuário"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}