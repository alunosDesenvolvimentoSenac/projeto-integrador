"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { createSalaAction } from "@/app/actions/salas"

// --- AQUI ESTÁ A CORREÇÃO DO TIPO ---
interface Option { 
  id: number; 
  nome: string 
}

interface SalaControlsProps {
  areas: Option[]
  unidades: Option[]
}

// Note que aplicamos ': SalaControlsProps' aqui
export function SalaControls({ areas, unidades }: SalaControlsProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Estados do Formulário
  const [nome, setNome] = useState("")
  const [codigo, setCodigo] = useState("")
  const [capacidade, setCapacidade] = useState("")
  const [idArea, setIdArea] = useState("")
  const [idUnidade, setIdUnidade] = useState("")

  const handleCreate = async () => {
    // Validação
    if (!nome || !codigo || !capacidade || !idArea || !idUnidade) {
        toast.warning("Preencha todos os campos!")
        return
    }

    startTransition(async () => {
      try {
        const res = await createSalaAction({
          nome,
          codigo,
          capacidade: Number(capacidade),
          idArea: Number(idArea),
          idUnidade: Number(idUnidade)
        })

        if (res.success) {
          toast.success("Sala cadastrada com sucesso!")
          setOpen(false)
          // Limpa o form
          setNome("")
          setCodigo("")
          setCapacidade("")
          setIdArea("")
          setIdUnidade("")
        } else {
          toast.error(res.error || "Erro ao cadastrar.")
        }
      } catch (error) {
        toast.error("Erro inesperado.")
      }
    })
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
      <div className="flex-1 w-full md:w-auto">
         {/* Espaço para filtro de texto futuro */}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="w-full md:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Nova Sala
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nova Sala</DialogTitle>
            <DialogDescription>
              Preencha os dados para cadastrar um novo ambiente.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="codigo">Código</Label>
                    <Input id="codigo" placeholder="Ex: LAB-01" value={codigo} onChange={(e) => setCodigo(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="capacidade">Capacidade</Label>
                    <Input id="capacidade" type="number" placeholder="0" value={capacidade} onChange={(e) => setCapacidade(e.target.value)} />
                </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nome">Nome / Descrição</Label>
              <Input id="nome" placeholder="Ex: Laboratório de Informática 1" value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Unidade</Label>
                    <Select value={idUnidade} onValueChange={setIdUnidade}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                            {unidades.map((u) => (
                                <SelectItem key={u.id} value={String(u.id)}>{u.nome}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Área</Label>
                    <Select value={idArea} onValueChange={setIdArea}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                            {areas.map((a) => (
                                <SelectItem key={a.id} value={String(a.id)}>{a.nome}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={isPending}>
              {isPending ? "Cadastrando..." : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}