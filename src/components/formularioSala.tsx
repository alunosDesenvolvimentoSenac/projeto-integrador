"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
} from "@/components/ui/form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cadastrarSalaNoBanco } from "@/app/actions/admin" 

type Unidade = {
  idUnidade: number;
  descricaoUnidade: string;
};

type Area = {
  idArea: number;
  descricaoArea: string;
};

const formSchema = z.object({
  codigoSala: z.string().min(1, "O código é obrigatório"),
  descricaoSala: z.string().min(3, "A descrição deve ter min. 3 caracteres"),
  capacidade: z.coerce.number().min(1, "Capacidade inválida"),
  unidadeId: z.string().min(1, "Selecione uma unidade"),
  areaId: z.string().min(1, "Selecione uma área"),
});

type FormValues = z.infer<typeof formSchema>;

interface FormularioSalaProps extends React.ComponentPropsWithoutRef<"div"> {
  unidades: Unidade[];
  areas: Area[];
}

export function FormularioSala({ unidades, areas, className, ...props }: FormularioSalaProps) {
  const [open, setOpen] = useState(false)
  const [dadosParaConfirmar, setDadosParaConfirmar] = useState<FormValues | null>(null)
  
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      codigoSala: "",
      descricaoSala: "",
      capacidade: 0,
      unidadeId: "",
      areaId: "",
    },
  })

  function onPreSubmit(values: FormValues) {
    setDadosParaConfirmar(values)
    setOpen(true)
  }

  async function onFinalSubmit() {
    if (!dadosParaConfirmar) return;

    try {
        const payload = {
            codigoSala: dadosParaConfirmar.codigoSala,
            descricaoSala: dadosParaConfirmar.descricaoSala,
            capacidade: dadosParaConfirmar.capacidade,
            idUnidade: Number(dadosParaConfirmar.unidadeId),
            idArea: Number(dadosParaConfirmar.areaId)
        };

        const result = await cadastrarSalaNoBanco(payload);

        if (result.success) {
            alert(result.message);
            setOpen(false);
            form.reset({
                codigoSala: "",
                descricaoSala: "",
                capacidade: 0,
                unidadeId: "",
                areaId: "",
            });
        } else {
            alert("Erro: " + result.message);
        }
    } catch (error) {
        console.error(error);
        alert("Erro inesperado.");
    }
  }

  const getNomeUnidade = (id: string) => 
    unidades.find(u => String(u.idUnidade) === id)?.descricaoUnidade || "-";

  const getNomeArea = (id: string) => 
    areas.find(a => String(a.idArea) === id)?.descricaoArea || "-";

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onPreSubmit)}>
          
          <div className="flex flex-col gap-6">
            
            {/* Cabeçalho */}
            <div className="flex flex-col items-center gap-2">
              <h1 className="text-xl font-bold">Cadastro de Salas</h1>
              <p className="text-sm text-muted-foreground">Adicione novos laboratórios ou salas</p>
            </div>

            <div className="flex flex-col gap-6">
              
              {/* Código da Sala */}
              {/* Usando a estrutura grid gap-2 igual ao FormularioUsuario */}
              <FormField
                control={form.control}
                name="codigoSala"
                render={({ field }) => (
                  <FormItem className="grid gap-2 space-y-0">
                    <FormLabel>Código da Sala</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: A-102" required {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Descrição */}
              <FormField
                control={form.control}
                name="descricaoSala"
                render={({ field }) => (
                  <FormItem className="grid gap-2 space-y-0">
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Laboratório de Informática" required {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Capacidade */}
              <FormField
                control={form.control}
                name="capacidade"
                render={({ field }) => (
                  <FormItem className="grid gap-2 space-y-0">
                    <FormLabel>Capacidade</FormLabel>
                    <FormControl>
                      <Input 
                          type="number" 
                          placeholder="Ex: 40" 
                          required 
                          {...field}
                          value={field.value as number | string ?? ''}
                          onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Unidade */}
              <FormField
                control={form.control}
                name="unidadeId"
                render={({ field }) => (
                  <FormItem className="grid gap-2 space-y-0">
                    <FormLabel>Unidade</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                           <SelectValue placeholder="Selecione a unidade..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {unidades.map((unidade) => (
                          <SelectItem key={unidade.idUnidade} value={String(unidade.idUnidade)}>
                            {unidade.descricaoUnidade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Área */}
              <FormField
                control={form.control}
                name="areaId"
                render={({ field }) => (
                  <FormItem className="grid gap-2 space-y-0">
                    <FormLabel>Área / Setor</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                           <SelectValue placeholder="Selecione a área..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {areas.map((area) => (
                          <SelectItem key={area.idArea} value={String(area.idArea)}>
                            {area.descricaoArea}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full">
                Cadastrar Sala
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
                <span className="font-bold text-right">Código:</span>
                <span className="col-span-3">{dadosParaConfirmar.codigoSala}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-bold text-right">Descrição:</span>
                <span className="col-span-3">{dadosParaConfirmar.descricaoSala}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-bold text-right">Capacidade:</span>
                <span className="col-span-3">{dadosParaConfirmar.capacidade}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-bold text-right">Unidade:</span>
                <span className="col-span-3">{getNomeUnidade(dadosParaConfirmar.unidadeId)}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-bold text-right">Área:</span>
                <span className="col-span-3">{getNomeArea(dadosParaConfirmar.areaId)}</span>
              </div>
            </div>
          )}

          <DialogFooter className="sm:justify-between">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Voltar
            </Button>
            <Button onClick={onFinalSubmit} className="bg-green-600 hover:bg-green-700">
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}