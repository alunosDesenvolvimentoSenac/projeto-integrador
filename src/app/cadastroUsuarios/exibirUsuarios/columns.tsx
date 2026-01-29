"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Pencil, Trash2, CheckCircle2, XCircle } from "lucide-react"
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
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { updateUsuarioAction, toggleStatusUsuarioAction, deleteUsuarioAction } from "@/app/actions/usuarios"

export type Usuario = {
  id: number
  nome: string
  email: string
  ativo: boolean
  idPerfil: number
  nomePerfil: string | null
  departamento: string | null
}

interface CellActionProps {
  usuario: Usuario
  perfisOptions: { id: number; nome: string }[]
}

export const getColumns = (perfisOptions: { id: number; nome: string }[]): ColumnDef<Usuario>[] => [
  {
    accessorKey: "nome",
    header: "Nome",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  // REMOVIDA A COLUNA DEPARTAMENTO DAQUI DA VISUALIZAÇÃO
  {
    accessorKey: "nomePerfil",
    header: "Perfil",
  },
  {
    accessorKey: "status",
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
    header: "Ações",
    cell: ({ row }) => <CellAction usuario={row.original} perfisOptions={perfisOptions} />,
  },
]

function CellAction({ usuario, perfisOptions }: CellActionProps) {
  const [openEdit, setOpenEdit] = useState(false)
  const [openDelete, setOpenDelete] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Estados do Formulário
  const [nome, setNome] = useState(usuario.nome)
  const [departamento, setDepartamento] = useState(usuario.departamento || "") // Mantido o estado para edição
  const [idPerfil, setIdPerfil] = useState(String(usuario.idPerfil))
  const [status, setStatus] = useState(usuario.ativo ? "ativo" : "inativo")

  const handleEdit = async () => {
    startTransition(async () => {
      try {
        await updateUsuarioAction(usuario.id, {
          nome: nome,
          email: usuario.email,
          idPerfil: Number(idPerfil),
          departamento: departamento // Envia o departamento editado
        })

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
      <div className="flex items-center gap-2">
        <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setOpenEdit(true)}
            title="Editar Usuário"
            className="h-8 w-8 "
        >
            <Pencil className="h-4 w-4" />
        </Button>

        <Button 
            
            size="icon" 
            onClick={() => setOpenDelete(true)}
            title="Excluir Usuário"
            className="h-8 w-8"
        >
            <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Modal Editar - Mantido o campo Departamento aqui */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>Alterar dados de {usuario.nome}.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            
            <div className="grid gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>

            {/* O campo continua aqui para edição */}
            <div className="grid gap-2">
              <Label htmlFor="dept">Departamento</Label>
              <Input 
                id="dept" 
                value={departamento} 
                onChange={(e) => setDepartamento(e.target.value)} 
                placeholder="Exemplo: Secretaria" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label>Perfil</Label>
                    <Select value={idPerfil} onValueChange={setIdPerfil}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                            {perfisOptions.map((p) => (
                                <SelectItem key={p.id} value={String(p.id)}>{p.nome}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
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

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenEdit(false)}>Cancelar</Button>
            <Button onClick={handleEdit} disabled={isPending}>
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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