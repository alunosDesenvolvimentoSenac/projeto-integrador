"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Pencil, Trash2, ShieldCheck, User } from "lucide-react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { updatePerfilAction, deletePerfilAction } from "@/app/actions/perfis"

export type Perfil = {
  id: number
  descricao: string
  isAdmin: boolean
}

export const columns: ColumnDef<Perfil>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">#{row.getValue("id")}</span>,
    size: 60,
  },
  {
    accessorKey: "descricao",
    header: "Descrição do Perfil",
    cell: ({ row }) => <span className="font-medium">{row.getValue("descricao")}</span>,
  },
  {
    accessorKey: "isAdmin",
    header: "Tipo de Acesso",
    cell: ({ row }) => {
      const isAdmin = row.original.isAdmin
      return (
        <div className="flex items-center">
          {isAdmin ? (
             <Badge variant="default" className="bg-purple-600 hover:bg-purple-700 gap-1">
                <ShieldCheck className="h-3 w-3" /> Admin
             </Badge>
          ) : (
             <Badge variant="secondary" className="gap-1">
                <User className="h-3 w-3" /> Comum
             </Badge>
          )}
        </div>
      )
    },
  },
  {
    id: "actions",
    header: "Ações",
    cell: ({ row }) => <CellAction perfil={row.original} />,
  },
]

function CellAction({ perfil }: { perfil: Perfil }) {
  const [openEdit, setOpenEdit] = useState(false)
  const [openDelete, setOpenDelete] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Estados do Formulário de Edição
  const [descricao, setDescricao] = useState(perfil.descricao)
  const [isAdmin, setIsAdmin] = useState(perfil.isAdmin ? "true" : "false")

  const handleEdit = async () => {
    startTransition(async () => {
      try {
        const res = await updatePerfilAction(perfil.id, {
          descricao,
          isAdmin: isAdmin === "true"
        })

        if (res.success) {
          toast.success("Perfil atualizado!")
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
        const res = await deletePerfilAction(perfil.id)
        if (res.success) {
            toast.success("Perfil removido.")
            setOpenDelete(false)
        } else {
            toast.error(res.error)
        }
      } catch (error) {
        toast.error("Erro ao remover.")
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
            title="Editar Perfil"
            className="h-8 w-8  hover:bg-blue-50"
        >
            <Pencil className="h-4 w-4" />
        </Button>

        <Button 
            
            size="icon" 
            onClick={() => setOpenDelete(true)}
            title="Excluir Perfil"
            className="h-8 w-8 hover:bg-red-50"
        >
            <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Modal Editar */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
            <DialogDescription>Alterar permissões e nome.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Input id="descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Nível de Acesso</Label>
              <Select value={isAdmin} onValueChange={setIsAdmin}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Usuário Comum</SelectItem>
                  <SelectItem value="true">Administrador</SelectItem>
                </SelectContent>
              </Select>
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
            <AlertDialogTitle>Excluir perfil?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá o perfil <b>{perfil.descricao}</b>.
              <br/><br/>
              <span className="text-red-600 font-semibold text-xs">ATENÇÃO: Não será possível excluir se houver usuários vinculados a este perfil.</span>
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