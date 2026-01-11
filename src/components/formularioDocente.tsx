"use client"

import { useState } from "react" // 1. Importar useState
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
// 2. Importar os componentes do Dialog
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type Unidade = {
  idUnidade: number;
  descricaoUnidade: string;
};

const formSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  unidadeId: z.string().min(1, "Selecione uma unidade"),
  senha: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
  confirmarSenha: z.string().min(6, "Confirme a senha"),
  isAdmin: z.boolean().default(false),
}).refine((data) => data.senha === data.confirmarSenha, {
  message: "As senhas não coincidem",
  path: ["confirmarSenha"],
});

type FormValues = z.infer<typeof formSchema>;

export function FormularioDocente({ unidades }: { unidades: Unidade[] }) {
  // 3. Estado para controlar se o modal está aberto
  const [open, setOpen] = useState(false)
  // 4. Estado para guardar os dados temporariamente enquanto o usuário revisa
  const [dadosParaConfirmar, setDadosParaConfirmar] = useState<FormValues | null>(null)
  
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      email: "",
      unidadeId: "",
      senha: "",
      confirmarSenha: "",
      isAdmin: false,
    },
  })

  // 5. Essa função roda quando o usuário clica no primeiro botão (validação ok)
  function onPreSubmit(values: FormValues) {
    setDadosParaConfirmar(values) // Salva os dados
    setOpen(true) // Abre o modal
  }

  // 6. Essa função roda quando o usuário clica em "Confirmar" DENTRO do modal
  function onFinalSubmit() {
    if (!dadosParaConfirmar) return;

    // AQUI VAI SUA LÓGICA FINAL DE ENVIO PARA O BANCO
    console.log("Enviando para o servidor:", dadosParaConfirmar)
    alert("Cadastro realizado com sucesso!")
    
    setOpen(false) // Fecha o modal
    form.reset() // Limpa o formulário (opcional)
  }

  // Função auxiliar para achar o nome da unidade baseada no ID selecionado
  const getNomeUnidade = (id: string) => {
    return unidades.find(u => String(u.idUnidade) === id)?.descricaoUnidade || "Não encontrada";
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onPreSubmit)} className="space-y-6">
          
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">Nome Completo</FormLabel>
                <FormControl>
                  <Input placeholder="José da Silva" className="h-12 text-lg" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">E-mail</FormLabel>
                <FormControl>
                  <Input placeholder="docente@senac.com.br" type="email" className="h-12 text-lg" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unidadeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">Unidade</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-12 w-full text-lg">
                      <SelectValue placeholder="Selecione a unidade" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {unidades.map((unidade) => (
                      <SelectItem 
                        key={unidade.idUnidade} 
                        value={String(unidade.idUnidade)} 
                        className="text-base"
                      >
                        {unidade.descricaoUnidade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
              control={form.control}
              name="senha"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel className="text-base">Senha</FormLabel>
                  <FormControl>
                      <Input type="password" placeholder="******" className="h-12 text-lg" {...field} />
                  </FormControl>
                  <FormMessage />
                  </FormItem>
              )}
              />

              <FormField
              control={form.control}
              name="confirmarSenha"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel className="text-base">Confirmar Senha</FormLabel>
                  <FormControl>
                      <Input type="password" placeholder="******" className="h-12 text-lg" {...field} />
                  </FormControl>
                  <FormMessage />
                  </FormItem>
              )}
              />
          </div>

          <FormField
            control={form.control}
            name="isAdmin"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="h-6 w-6"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-base cursor-pointer">
                    Conceder permissão de Administrador
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />

          <Button type="submit" className="h-12 w-full text-lg font-bold">
            Revisar e Cadastrar
          </Button>
        </form>
      </Form>

      {/* --- 7. Modal de Confirmação --- */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirme os dados</DialogTitle>
            <DialogDescription>
              Por favor, verifique se as informações abaixo estão corretas antes de salvar.
            </DialogDescription>
          </DialogHeader>

          {dadosParaConfirmar && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-bold text-right">Nome:</span>
                <span className="col-span-3">{dadosParaConfirmar.nome}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-bold text-right">E-mail:</span>
                <span className="col-span-3">{dadosParaConfirmar.email}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-bold text-right">Unidade:</span>
                <span className="col-span-3">
                  {getNomeUnidade(dadosParaConfirmar.unidadeId)}
                </span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-bold text-right">Permissão:</span>
                <span className="col-span-3">
                  {dadosParaConfirmar.isAdmin ? "Administrador" : "Docente Padrão"}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="sm:justify-between">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Voltar e Corrigir
            </Button>
            <Button onClick={onFinalSubmit} className="bg-green-600 hover:bg-green-700">
              Confirmar Cadastro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}