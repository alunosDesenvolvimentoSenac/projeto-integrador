"use client" // 1. Obrigatório para usar hooks (useState, useRouter)

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation" // Para redirecionar após login
import { signInWithEmailAndPassword } from "firebase/auth" // Função do Firebase
import { auth } from "@/lib/firebase" // Sua configuração do Firebase
import { verificarPermissaoUsuario } from "@/app/actions/auth" // A Server Action (vamos confirmar abaixo)

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Função que lida com o envio do formulário
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault() // Impede a página de recarregar
    setLoading(true)
    setError("")

    // Captura os dados dos inputs
    const formData = new FormData(event.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      // 1. Tenta logar no Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const firebaseUid = userCredential.user.uid

      // 2. Verifica no Banco de Dados (Neon) quem é esse usuário
      // Precisamos garantir que ele existe no SQL e pegar o perfil dele
      const resultadoBanco = await verificarPermissaoUsuario(firebaseUid)

      if (!resultadoBanco.sucesso) {
        throw new Error(resultadoBanco.mensagem || "Erro ao verificar usuário no sistema.")
      }

      // 3. Sucesso! Redireciona para o Dashboard
      router.push("/dashboard") 
      
    } catch (err: unknown) {
      console.error(err)
      // Tratamento básico de erros
      // Verificamos se 'err' é um objeto e se tem a propriedade 'code'
  if (typeof err === 'object' && err !== null && 'code' in err) {
    // Agora o TypeScript sabe que é seguro acessar .code
    const erroComCodigo = err as { code: string };
    
    if (erroComCodigo.code === 'auth/invalid-credential') {
      setError("E-mail ou senha incorretos.");
      return;
    }
  }

  // Fallback para erro genérico
  setError("Ocorreu um erro ao tentar entrar. Tente novamente.");
} finally {
  setLoading(false)
}
  }


  return (
    <form 
      onSubmit={handleSubmit} // Adicionamos o evento aqui
      className={cn("flex flex-col gap-6", className)} 
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Sistema de Agendamento</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Acesse o sistema de agendamento de salas do Senac Poços de Caldas
          </p>
        </div>

        {/* Exibe erro se houver */}
        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input 
            id="email" 
            name="email" // Importante para o FormData pegar o valor
            type="email" 
            placeholder="m@exemplo.com" 
            required 
            disabled={loading} // Trava enquanto carrega
          />
        </Field>

        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Senha</FieldLabel>
            <a
              href="#"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Esqueceu sua senha?
            </a>
          </div>
          <Input 
            id="password" 
            name="password" // Importante para o FormData
            type="password" 
            required 
            disabled={loading}
          />
        </Field>

        <Field>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
