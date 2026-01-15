"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cadastrarPerfilNoBanco } from "@/app/actions/admin"

// Schema Zod
const formSchema = z.object({
  descricao: z.string().min(3, "A descrição deve ter pelo menos 3 caracteres"),
  isAdmin: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

export function FormularioPerfil({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  const [open, setOpen] = useState(false)
  const [dadosParaConfirmar, setDadosParaConfirmar] = useState<FormValues | null>(null)
  const [loading, setLoading] = useState(false)

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      descricao: "",
      isAdmin: false,
    },
  })

  // 1. Abre Modal
  function onPreSubmit(values: FormValues) {
    setDadosParaConfirmar(values)
    setOpen(true)
  }

  // 2. Envia para o Banco
  async function onFinalSubmit() {
    if (!dadosParaConfirmar) return;
    setLoading(true);

    try {
      const result = await cadastrarPerfilNoBanco({
        descricao: dadosParaConfirmar.descricao,
        isAdmin: dadosParaConfirmar.isAdmin
      });

      if (result.success) {
        alert(result.message);
        setOpen(false);
        form.reset({
            descricao: "",
            isAdmin: false
        });
      } else {
        alert("Erro: " + result.message);
      }
    } catch (error) {
      console.error(error);
      alert("Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onPreSubmit)}>
          
          <div className="flex flex-col gap-6">
            
            {/* Cabeçalho */}
            <div className="flex flex-col items-center gap-2">
              <h1 className="text-xl font-bold">Cadastro de Perfis</h1>
              <p className="text-sm text-muted-foreground">Defina novos níveis de acesso</p>
            </div>

            <div className="flex flex-col gap-6">
              
              {/* Descrição do Perfil */}
              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem className="grid gap-2 space-y-0">
                    <FormLabel>Nome do Perfil</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Coordenador de Curso" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Checkbox Admin */}
              <FormField
                control={form.control}
                name="isAdmin"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Acesso Administrativo
                      </FormLabel>
                      <FormDescription>
                        Permite acesso total às configurações do sistema.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={loading}>
                Cadastrar Perfil
              </Button>
            </div>
          </div>
        </form>
      </Form>

      {/* Modal de Confirmação */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Cadastro</DialogTitle>
            <DialogDescription>
              Verifique os dados abaixo.
            </DialogDescription>
          </DialogHeader>

          {dadosParaConfirmar && (
            <div className="grid gap-4 py-4 text-sm">
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-bold text-right">Perfil:</span>
                <span className="col-span-3">{dadosParaConfirmar.descricao}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-bold text-right">Admin:</span>
                <span className="col-span-3">
                    {dadosParaConfirmar.isAdmin ? "Sim" : "Não"}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="sm:justify-between">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Voltar
            </Button>
            <Button onClick={onFinalSubmit} className="bg-green-600 hover:bg-green-700" disabled={loading}>
              {loading ? "Salvando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}