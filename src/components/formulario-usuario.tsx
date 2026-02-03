"use client"

import { useState, useMemo } from "react"
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

// --- ALTERAÇÃO 1: Importações necessárias do Firebase ---
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth"
import { initializeApp, getApp, deleteApp } from "firebase/app" // Nota: em versões recentes pode ser 'firebase/app'
// Se der erro na linha acima use: import { initializeApp, getApp, deleteApp } from "firebase/app"

import { auth } from "@/lib/firebase" // Sua instância principal (Admin logado)
import { cadastrarUsuarioNoBanco } from "@/app/actions/admin"

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
  const [perfilSelecionado, setPerfilSelecionado] = useState<string>("")

  // Ordenação (Mantida do seu código anterior)
  const unidadesOrdenadas = useMemo(() => {
    return [...unidades].sort((a, b) => 
      a.descricaoUnidade.localeCompare(b.descricaoUnidade)
    );
  }, [unidades]);

  const perfisOrdenados = useMemo(() => {
    return [...perfis].sort((a, b) => 
      a.descricaoPerfil.localeCompare(b.descricaoPerfil)
    );
  }, [perfis]);
  
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setLoading(true);
      
      const form = event.currentTarget;
      const formData = new FormData(form);
      
      const nome = formData.get("nome") as string
      const email = formData.get("email") as string
      const password = formData.get("password") as string 
      const departamento = formData.get("departamento") as string 

      // Variável para a App Secundária
      let secondaryApp: any = null;

      try {
        if (!unidadeSelecionada) throw new Error("Selecione a Unidade.");
        if (!perfilSelecionado) throw new Error("Selecione o Perfil de acesso.");

        // --- ALTERAÇÃO 2: Lógica de Criação Isolada ---
        
        // 1. Pegamos a configuração do app principal que já está rodando
        const firebaseConfig = auth.app.options;

        // 2. Inicializamos uma "Segunda Instância" do Firebase com nome único
        secondaryApp = initializeApp(firebaseConfig, "SecondaryAppForUserCreation");
        
        // 3. Pegamos o Auth dessa segunda instância
        const secondaryAuth = getAuth(secondaryApp);

        // 4. Criamos o usuário na SEGUNDA instância (isso loga ele lá, mas não na principal)
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password)
        const uid = userCredential.user.uid

        // 5. O Admin continua logado na 'auth' principal. Agora salvamos no banco.
        const result = await cadastrarUsuarioNoBanco(
            uid,
            nome,
            email,
            Number(unidadeSelecionada),
            Number(perfilSelecionado),
            departamento 
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
        // 6. Deletamos a app secundária para limpar o estado
        if (secondaryApp) {
            await deleteApp(secondaryApp).catch(console.error);
        }
        setLoading(false);
      }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}> 
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-xl font-bold">Cadastro de Usuários</h1>
          </div>
          <div className="flex flex-col gap-6">
            
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome Completo</Label>
              <Input id="nome" name="nome" type="text" placeholder="Ex: Ana Souza" required disabled={loading} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email Corporativo</Label>
              <Input id="email" name="email" type="email" placeholder="nome@mg.senac.br" required disabled={loading} />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="unidade">Unidade</Label>
              <Select value={unidadeSelecionada} onValueChange={setUnidadeSelecionada} disabled={loading}>
                  <SelectTrigger className="w-full"> 
                      <SelectValue placeholder="Selecione a unidade..." />
                  </SelectTrigger>
                  <SelectContent>
                    {unidadesOrdenadas.map((item) => (
                        <SelectItem key={item.idUnidade} value={String(item.idUnidade)}>
                            {item.descricaoUnidade}
                        </SelectItem>
                    ))}
                  </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="departamento">Departamento</Label>
              <Input id="departamento" name="departamento" type="text" placeholder="Ex: Tecnologia da Informação" disabled={loading} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="perfil">Perfil de Acesso</Label>
              <Select value={perfilSelecionado} onValueChange={setPerfilSelecionado} disabled={loading}>
                  <SelectTrigger className="w-full"> 
                      <SelectValue placeholder="Selecione o nível de acesso..." />
                  </SelectTrigger>
                  <SelectContent>
                    {perfisOrdenados.map((item) => (
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