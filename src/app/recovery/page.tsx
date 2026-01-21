"use client"

import { useState } from "react"
import Link from "next/link"
import { sendPasswordResetEmail } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { ArrowLeft, Loader2, Mail, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
        toast.warning("Por favor, digite seu e-mail.")
        return
    }

    setIsLoading(true)

    try {
      await sendPasswordResetEmail(auth, email)
      
      setIsEmailSent(true)
      toast.success("E-mail de recuperação enviado!")
    } catch (error: any) {
      console.error(error)
      
      let mensagemErro = "Ocorreu um erro ao tentar enviar o e-mail."
      
      if (error.code === 'auth/user-not-found') {
        mensagemErro = "Não existe uma conta vinculada a este e-mail."
      } else if (error.code === 'auth/invalid-email') {
        mensagemErro = "O e-mail digitado é inválido."
      } else if (error.code === 'auth/too-many-requests') {
          mensagemErro = "Muitas tentativas. Tente novamente mais tarde."
      }

      toast.error(mensagemErro)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Recuperar Senha</CardTitle>
          <CardDescription>
            {!isEmailSent 
              ? "Digite seu e-mail para receber as instruções de redefinição." 
              : "Verifique sua caixa de entrada."}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {!isEmailSent ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail cadastrado</Label>
                <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                    id="email"
                    type="email"
                    placeholder="nome@exemplo.com"
                    className="pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    />
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar Link de Recuperação"
                )}
              </Button>
            </form>
          ) : (
            <div className="flex flex-col items-center gap-4 py-4 text-center animate-in fade-in zoom-in duration-300">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-500" />
                </div>
                <div className="space-y-2">
                    <h3 className="font-semibold text-lg">E-mail enviado!</h3>
                    <p className="text-sm text-muted-foreground">
                        Enviamos um link para <strong>{email}</strong>. <br/>
                        Clique no link para criar uma nova senha.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                        Se não encontrar, verifique sua caixa de spam.
                    </p>
                </div>
                <Button 
                    variant="outline" 
                    className="mt-4 w-full"
                    onClick={() => setIsEmailSent(false)}
                >
                    Tentar outro e-mail
                </Button>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-center border-t p-4 mt-2">
          <Link 
            href="/" 
            className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para o Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}