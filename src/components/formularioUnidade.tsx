"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cadastrarUnidadeNoBanco } from "@/app/actions/admin"

const formSchema = z.object({
  descricaoUnidade: z.string().min(3, "A descrição deve ter pelo menos 3 caracteres"),
});

type FormValues = z.infer<typeof formSchema>;

export function FormularioUnidade({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  const [open, setOpen] = useState(false)
  const [dadosParaConfirmar, setDadosParaConfirmar] = useState<FormValues | null>(null)
  const [loading, setLoading] = useState(false)

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      descricaoUnidade: "",
    },
  })

  function onPreSubmit(values: FormValues) {
    setDadosParaConfirmar(values)
    setOpen(true)
  }

  async function onFinalSubmit() {
    if (!dadosParaConfirmar) return;
    setLoading(true);

    try {
      const result = await cadastrarUnidadeNoBanco(dadosParaConfirmar.descricaoUnidade);

      if (result.success) {
        alert(result.message);
        setOpen(false);
        form.reset();
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
            <div className="flex flex-col items-center gap-2">
              <h1 className="text-xl font-bold">Cadastro de Unidades</h1>
              <p className="text-sm text-muted-foreground">Registre uma nova unidade do Senac</p>
            </div>

            <div className="flex flex-col gap-6">
              
              <FormField
                control={form.control}
                name="descricaoUnidade"
                render={({ field }) => (
                  <FormItem className="grid gap-2 space-y-0">
                    <FormLabel>Nome da Unidade</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Senac - Poços de Caldas" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={loading}>
                Cadastrar Unidade
              </Button>
            </div>
          </div>
        </form>
      </Form>

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
                <span className="font-bold text-right">Unidade:</span>
                <span className="col-span-3">{dadosParaConfirmar.descricaoUnidade}</span>
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