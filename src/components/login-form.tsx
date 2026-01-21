"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signInWithEmailAndPassword, signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { verificarPermissaoUsuario } from "@/app/actions/auth"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { AlertCircle } from "lucide-react"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError("")

    const formData = new FormData(event.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const firebaseUid = userCredential.user.uid

      const resultadoBanco = await verificarPermissaoUsuario(firebaseUid)

      if (!resultadoBanco.sucesso) {
        await signOut(auth) 
        throw new Error(resultadoBanco.mensagem || "Acesso negado.")
      }

      router.push("/dashboard") 
      
    } catch (err: unknown) {
      console.error(err)

      if (typeof err === 'object' && err !== null && 'code' in err) {
        const erroComCodigo = err as { code: string };
        if (erroComCodigo.code === 'auth/invalid-credential') {
          setError("E-mail ou senha incorretos.");
          return;
        }
        if (erroComCodigo.code === 'auth/user-disabled') {
          setError("Esta conta foi desativada pelo administrador.");
          return;
        }
      }

      if (err instanceof Error) {
        setError(err.message);
        return;
      }

      setError("Ocorreu um erro ao tentar entrar. Tente novamente.");
    } finally {
      setLoading(false)
    }
  }

  return (
    <form 
      onSubmit={handleSubmit}
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

        {error && (
          <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input 
            id="email" 
            name="email" 
            type="email" 
            placeholder="m@exemplo.com" 
            required 
            disabled={loading} 
          />
        </Field>

        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Senha</FieldLabel>
            
            <Link
              href="/recovery"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Esqueceu sua senha?
            </Link>
            
          </div>
          <Input 
            id="password" 
            name="password" 
            type="password" 
            required 
            disabled={loading}
          />
        </Field>

        <Field>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Entrando...
                </>
            ) : "Entrar"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}

function Loader2({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    )
}