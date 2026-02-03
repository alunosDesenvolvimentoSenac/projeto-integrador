"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea" // Opcional, se preferir Input normal, troque aqui
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { cadastrarEquipamentoNoBanco } from "@/app/actions/admin"

// Tipos
type Sala = {
  idSala: number;
  codigoSala: string;
  descricaoSala: string;
};

// Schema Zod
const formSchema = z.object({
  descricao: z.string().min(3, "A descrição deve ter pelo menos 3 caracteres"),
  quantidade: z.coerce.number().min(1, "Quantidade mínima é 1"),
  observacao: z.string().optional(),
  salaId: z.string().min(1, "Selecione uma sala"),
  ativo: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface FormularioEquipamentoProps extends React.ComponentPropsWithoutRef<"div"> {
  salas: Sala[];
}

export function FormularioEquipamento({ salas, className, ...props }: FormularioEquipamentoProps) {
  const [open, setOpen] = useState(false)
  const [dadosParaConfirmar, setDadosParaConfirmar] = useState<FormValues | null>(null)
  const [loading, setLoading] = useState(false)

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      descricao: "",
      quantidade: 1,
      observacao: "",
      salaId: "",
      ativo: true,
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
      const payload = {
        descricao: dadosParaConfirmar.descricao,
        quantidade: dadosParaConfirmar.quantidade,
        observacao: dadosParaConfirmar.observacao,
        idSala: Number(dadosParaConfirmar.salaId),
        ativo: dadosParaConfirmar.ativo,
      };

      const result = await cadastrarEquipamentoNoBanco(payload);

      if (result.success) {
        alert(result.message);
        setOpen(false);
        form.reset({
            descricao: "",
            quantidade: 1,
            observacao: "",
            salaId: "",
            ativo: true
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

  const getNomeSala = (id: string) => {
    const sala = salas.find(s => String(s.idSala) === id);
    return sala ? `${sala.codigoSala} - ${sala.descricaoSala}` : "-";
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onPreSubmit)}>
          
          <div className="flex flex-col gap-6">
            
            {/* Cabeçalho */}
            <div className="flex flex-col items-center gap-2">
              <h1 className="text-xl font-bold">Cadastro de Equipamentos</h1>
              <p className="text-sm text-muted-foreground">Cadastre novos itens e vincule a uma sala</p>
            </div>

            <div className="flex flex-col gap-6">
              
              {/* Descrição */}
              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem className="grid gap-2 space-y-0">
                    <FormLabel>Descrição do Equipamento</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Projetor Epson X41" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Quantidade */}
              <FormField
                control={form.control}
                name="quantidade"
                render={({ field }) => (
                  <FormItem className="grid gap-2 space-y-0">
                    <FormLabel>Quantidade</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field}
                        value={field.value as number | string ?? ''}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Sala (Select) */}
              <FormField
                control={form.control}
                name="salaId"
                render={({ field }) => (
                  <FormItem className="grid gap-2 space-y-0">
                    <FormLabel>Sala</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                           <SelectValue placeholder="Selecione a sala..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {salas.map((sala) => (
                          <SelectItem key={sala.idSala} value={String(sala.idSala)}>
                            {sala.codigoSala} - {sala.descricaoSala}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Observação */}
              <FormField
                control={form.control}
                name="observacao"
                render={({ field }) => (
                  <FormItem className="grid gap-2 space-y-0">
                    <FormLabel>Observação</FormLabel>
                    <FormControl>
                      {/* Pode usar Input normal aqui se preferir */}
                      <Textarea 
                        placeholder="Ex: Patrimônio nº 123456" 
                        className="resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Checkbox Ativo */}
              <FormField
                control={form.control}
                name="ativo"
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
                        Item Ativo
                      </FormLabel>
                      <FormDescription>
                        Disponível para uso imediato.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={loading}>
                Cadastrar Equipamento
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
                <span className="font-bold text-right">Descrição:</span>
                <span className="col-span-3">{dadosParaConfirmar.descricao}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-bold text-right">Qtd:</span>
                <span className="col-span-3">{dadosParaConfirmar.quantidade}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-bold text-right">Sala:</span>
                <span className="col-span-3">{getNomeSala(dadosParaConfirmar.salaId)}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-bold text-right">Status:</span>
                <span className="col-span-3">
                    {dadosParaConfirmar.ativo ? "Ativo" : "Inativo"}
                </span>
              </div>
               {dadosParaConfirmar.observacao && (
                <div className="grid grid-cols-4 items-center gap-4">
                    <span className="font-bold text-right">Obs:</span>
                    <span className="col-span-3 truncate">{dadosParaConfirmar.observacao}</span>
                </div>
               )}
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