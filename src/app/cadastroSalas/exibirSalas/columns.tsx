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
import { updateSalaAction, deleteSalaAction } from "@/app/actions/salas" // Ajuste o caminho se necessário

// Tipo baseado no retorno da getSalasAction
export type Sala = {
  id: number
  nome: string
  codigo: string
  capacidade: number
}

export const columns: ColumnDef<Sala>[] = [
  {
    accessorKey: "codigo",
    header: "Código",
    cell: ({ row }) => <span className="font-mono font-medium">{row.getValue("codigo")}</span>,
  },
  {
    accessorKey: "nome",
    header: "Descrição / Nome",
  },
  {
    accessorKey: "capacidade",
    header: "Capacidade",
    cell: ({ row }) => <span>{row.getValue("capacidade")}</span>,
  },
  {
    id: "actions",
    header: "Ações",
    cell: ({ row }) => <CellAction sala={row.original} />,
  },
]

function CellAction({ sala }: { sala: Sala }) {
  const [openEdit, setOpenEdit] = useState(false)
  const [openDelete, setOpenDelete] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Estados do Formulário de Edição
  const [nome, setNome] = useState(sala.nome)
  const [codigo, setCodigo] = useState(sala.codigo)
  const [capacidade, setCapacidade] = useState(sala.capacidade)

  const handleEdit = async () => {
    startTransition(async () => {
      try {
        const res = await updateSalaAction(sala.id, {
          nome,
          codigo,
          capacidade: Number(capacidade)
        })

        if (res.success) {
          toast.success("Sala atualizada com sucesso!")
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
        const res = await deleteSalaAction(sala.id)
        if (res.success) {
            toast.success("Sala excluída com sucesso.")
            setOpenDelete(false)
        } else {
            toast.error(res.error)
        }
      } catch (error) {
        toast.error("Erro ao excluir sala.")
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
            title="Editar Sala"
            className="h-8 w-8 "
        >
            <Pencil className="h-4 w-4" />
        </Button>

        <Button 
            variant="secondary" 
            size="icon" 
            onClick={() => setOpenDelete(true)}
            title="Excluir Sala"
            className="h-8 w-8 "
        >
            <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Modal Editar */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Sala</DialogTitle>
            <DialogDescription>Alterar dados da sala {sala.codigo}.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="codigo">Código (Identificação Visual)</Label>
              <Input id="codigo" value={codigo} onChange={(e) => setCodigo(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome / Descrição</Label>
              <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="capacidade">Capacidade (Pessoas)</Label>
              <Input id="capacidade" type="number" value={capacidade} onChange={(e) => setCapacidade(Number(e.target.value))} />
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
            <AlertDialogTitle>Excluir sala?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá a sala <b>{sala.nome}</b>. Se houver agendamentos passados ou futuros vinculados a ela, a exclusão pode ser bloqueada pelo banco.
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