"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Pencil, Trash2, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { useState, useTransition } from "react"
import { toast } from "sonner" 
import { updateUsuarioAction, toggleStatusUsuarioAction, deleteUsuarioAction } from "@/app/actions/usuarios"

// Tipo de dados alinhado com o retorno do banco
export type Usuario = {
  id: number
  nome: string
  email: string
  ativo: boolean
  idPerfil: number
  nomePerfil: string | null
}

export const columns: ColumnDef<Usuario>[] = [
  {
    accessorKey: "nome",
    header: "Nome",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "nomePerfil",
    header: "Perfil",
  },
  {
    accessorKey: "status", // STATUS MOVIDO PARA CÁ (DEPOIS DO PERFIL)
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
    header: "Ações", // CABEÇALHO ADICIONADO AQUI
    cell: ({ row }) => <CellAction usuario={row.original} />,
  },
]

// Componente auxiliar para gerenciar os Modais de cada linha
function CellAction({ usuario }: { usuario: Usuario }) {
  const [openEdit, setOpenEdit] = useState(false)
  const [openDelete, setOpenDelete] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Estados locais do formulário
  const [nome, setNome] = useState(usuario.nome)
  const [status, setStatus] = useState(usuario.ativo ? "ativo" : "inativo")

  const handleEdit = async () => {
    startTransition(async () => {
      try {
        // 1. Atualiza dados cadastrais
        await updateUsuarioAction(usuario.id, {
          nome: nome,
          email: usuario.email,
          idPerfil: usuario.idPerfil
        })

        // 2. Atualiza status se houve mudança
        const novoStatusBool = status === "ativo"
        if (novoStatusBool !== usuario.ativo) {
          await toggleStatusUsuarioAction(usuario.id, novoStatusBool)
        }

        toast.success("Usuário atualizado!")
        setOpenEdit(false)
      } catch (error) {
        toast.error("Erro ao atualizar.")
      }
    })
  }

  const handleDelete = async () => {
    startTransition(async () => {
      try {
        await deleteUsuarioAction(usuario.id)
        toast.success("Usuário removido.")
        setOpenDelete(false)
      } catch (error) {
        toast.error("Erro ao remover.")
      }
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setOpenEdit(true)}>
            <Pencil className="mr-2 h-4 w-4" /> Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setOpenDelete(true)} className="text-red-600 focus:text-red-600">
            <Trash2 className="mr-2 h-4 w-4" /> Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modal Editar */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>Alterar nome e status de {usuario.nome}.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
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
            <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. O usuário <b>{usuario.nome}</b> será removido permanentemente.
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