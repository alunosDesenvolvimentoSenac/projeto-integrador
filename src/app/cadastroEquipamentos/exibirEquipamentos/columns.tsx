"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Pencil, Trash2, CheckCircle2, XCircle, ArrowUpDown } from "lucide-react" // Certifique-se de ter ArrowUpDown importado
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { updateEquipamentoAction, deleteEquipamentoAction } from "@/app/actions/equipamentos"

export type Equipamento = {
  id: number
  descricao: string
  quantidade: number
  ativo: boolean
  observacao: string | null
  idSala: number
  nomeSala: string
  codigoSala: string
}

interface CellActionProps {
  equipamento: Equipamento
  salasOptions: { id: number, nome: string, codigo: string }[]
}

export const getColumns = (salasOptions: { id: number, nome: string, codigo: string }[]): ColumnDef<Equipamento>[] => [
  {
    accessorKey: "descricao",
    header: "Equipamento",
    cell: ({ row }) => (
      // max-w-[200px] pode ser pouco dependendo da tela, ajustei para ser flexível
      <div className="flex flex-col min-w-[180px]"> 
        <span className="font-medium truncate">{row.getValue("descricao")}</span>
        {row.original.observacao && (
          <span className="text-xs text-muted-foreground truncate max-w-[250px]">
            {row.original.observacao}
          </span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "codigoSala", 
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          // CORREÇÃO DE ALINHAMENTO AQUI:
          // 1. px-0: Remove padding lateral que empurrava o texto
          // 2. justify-start: Força o texto e ícone para a esquerda
          // 3. -ml-2: Compensa visualmente o padding padrão da tabela para alinhar perfeitamente com a célula
          className="hover:bg-transparent px-0 justify-start font-semibold text-foreground"
        >
          Sala Vinculada
          <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="flex flex-col items-start justify-center">
        <span className="font-medium">{row.original.codigoSala}</span>
        <span className="text-xs text-muted-foreground truncate max-w-[180px]">
             {row.original.nomeSala}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "quantidade",
    header: "Quantidade",
    cell: ({ row }) => {
      const qtd = row.original.quantidade
      return (
        <div className="flex items-center">
             <Badge variant="outline" className="font-medium">
                {qtd} un
             </Badge>
        </div>
      )
    },
  },
  {
    accessorKey: "ativo",
    header: "Status",
    cell: ({ row }) => {
      const ativo = row.original.ativo
      return (
        <div className={`flex items-center gap-2 font-medium ${ativo ? "text-emerald-600" : "text-red-500"}`}>
          {ativo ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {ativo ? "Ativo" : "Inativo"}
        </div>
      )
    },
  },
  {
    id: "actions",
    // Alinha o cabeçalho "Ações" à direita
    header: () => <div className="text-right">Ações</div>,
    cell: ({ row }) => {
        // Alinha os botões à direita
        return (
            <div className="flex justify-end">
                <CellAction equipamento={row.original} salasOptions={salasOptions} />
            </div>
        )
    },
  },
]

function CellAction({ equipamento, salasOptions }: CellActionProps) {
  const [openEdit, setOpenEdit] = useState(false)
  const [openDelete, setOpenDelete] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [descricao, setDescricao] = useState(equipamento.descricao)
  const [quantidade, setQuantidade] = useState(equipamento.quantidade)
  const [idSala, setIdSala] = useState(String(equipamento.idSala))
  const [observacao, setObservacao] = useState(equipamento.observacao || "")
  const [ativo, setAtivo] = useState(equipamento.ativo ? "true" : "false")

  const handleEdit = async () => {
    startTransition(async () => {
      try {
        const res = await updateEquipamentoAction(equipamento.id, {
          descricao,
          quantidade: Number(quantidade),
          idSala: Number(idSala),
          observacao,
          ativo: ativo === "true"
        })

        if (res.success) {
          toast.success("Equipamento atualizado!")
          setOpenEdit(false)
        } else {
          toast.error(res.error || "Erro ao atualizar.")
        }
      } catch (error) {
        toast.error("Erro inesperado.")
      }
    })
  }

  const handleDelete = async () => {
    startTransition(async () => {
      try {
        const res = await deleteEquipamentoAction(equipamento.id)
        if (res.success) {
            toast.success("Equipamento excluído.")
            setOpenDelete(false)
        } else {
            toast.error(res.error)
        }
      } catch (error) {
        toast.error("Erro ao excluir.")
      }
    })
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setOpenEdit(true)}
            title="Editar"
            className="h-8 w-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-50"
        >
            <Pencil className="h-4 w-4" />
        </Button>

        <Button 
            // Mudei para variant ghost para alinhar visualmente com o de editar
            size="icon" 
            onClick={() => setOpenDelete(true)}
            title="Excluir"
            className="h-8 w-8 "
        >
            <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Equipamento</DialogTitle>
            <DialogDescription>Atualize as informações do equipamento.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Descrição</Label>
              <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label>Quantidade</Label>
                    <Input type="number" value={quantidade} onChange={(e) => setQuantidade(Number(e.target.value))} />
                </div>
                <div className="grid gap-2">
                    <Label>Status</Label>
                    <Select value={ativo} onValueChange={setAtivo}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="true">Ativo</SelectItem>
                            <SelectItem value="false">Inativo</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="grid gap-2">
                <Label>Sala Vinculada</Label>
                <Select value={idSala} onValueChange={setIdSala}>
                    <SelectTrigger><SelectValue placeholder="Selecione a sala" /></SelectTrigger>
                    <SelectContent>
                        {salasOptions.map((s) => (
                            <SelectItem key={s.id} value={String(s.id)}>{s.codigo} - {s.nome}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid gap-2">
              <Label>Observação</Label>
              <Textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} className="h-20 resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenEdit(false)}>Cancelar</Button>
            <Button onClick={handleEdit} disabled={isPending}>{isPending ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir equipamento?</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja remover <b>{equipamento.descricao}</b> permanentemente?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">{isPending ? "Excluindo..." : "Excluir"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}