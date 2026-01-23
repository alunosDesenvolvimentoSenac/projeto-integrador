"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Pencil, Trash2 } from "lucide-react"
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
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { updateUnidadeAction, deleteUnidadeAction } from "@/app/actions/unidades"

export type Unidade = {
  id: number
  descricao: string
}

export const columns: ColumnDef<Unidade>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">#{row.getValue("id")}</span>,
    // Define uma largura fixa pequena para o ID não ocupar espaço demais
    size: 60, 
  },
  {
    accessorKey: "descricao",
    header: "Descrição da Unidade",
    // Faz essa coluna ocupar todo o espaço sobrando, empurrando a próxima para a direita
    cell: ({ row }) => <div className="w-full">{row.getValue("descricao")}</div>,
  },
  {
    id: "actions",
    // 1. Alinha o Título do cabeçalho à direita
    header: () => <div className="text-center">Ações</div>,
    // 2. Alinha o conteúdo da célula à direita usando Flexbox
    cell: ({ row }) => (
      <div className="flex justify-center">
        <CellAction unidade={row.original} />
      </div>
    ),
  },
]

function CellAction({ unidade }: { unidade: Unidade }) {
  const [openEdit, setOpenEdit] = useState(false)
  const [openDelete, setOpenDelete] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [descricao, setDescricao] = useState(unidade.descricao)

  const handleEdit = async () => {
    startTransition(async () => {
      try {
        const res = await updateUnidadeAction(unidade.id, descricao)

        if (res.success) {
          toast.success("Unidade atualizada com sucesso!")
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
        const res = await deleteUnidadeAction(unidade.id)
        if (res.success) {
            toast.success("Unidade excluída com sucesso.")
            setOpenDelete(false)
        } else {
            toast.error(res.error)
        }
      } catch (error) {
        toast.error("Erro ao excluir unidade.")
      }
    })
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setOpenEdit(true)}
            title="Editar Unidade"
            className="h-8 w-8 "
        >
            <Pencil className="h-4 w-4" />
        </Button>

        <Button 
            variant="secondary" 
            size="icon" 
            onClick={() => setOpenDelete(true)}
            title="Excluir Unidade"
            className="h-8 w-8 "
        >
            <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Modal Editar */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Unidade</DialogTitle>
            <DialogDescription>Alterar a descrição da unidade.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Input id="descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenEdit(false)}>Cancelar</Button>
            <Button onClick={handleEdit} disabled={isPending}>
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Deletar */}
      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir unidade?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá a unidade <b>{unidade.descricao}</b>. 
              <br/><br/>
              <span className="text-red-600 font-semibold text-xs">ATENÇÃO: A exclusão falhará se existirem salas ou usuários vinculados a esta unidade.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              {isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}