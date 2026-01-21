"use client"

import * as React from "react"
import { 
  Search, 
  Plus, 
  Pencil, 
  Trash2, 
  Filter,
  Building2,
  Users,
  Save,
  Loader2
} from "lucide-react"
import { useRouter } from "next/navigation"

import { getSalasAction, deleteSalaAction, updateSalaAction } from "@/app/actions/salas"

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label" 
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Toaster } from "@/components/ui/sonner" 
import { toast } from "sonner"

interface Sala {
  id: number
  nome: string
  codigo: string
  capacidade: number
}

export default function SalasPage() {
  const router = useRouter()
  
  const [salas, setSalas] = React.useState<Sala[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [filterCapacidade, setFilterCapacidade] = React.useState("todas")
  
  const [deleteId, setDeleteId] = React.useState<number | null>(null)
  
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [editingSala, setEditingSala] = React.useState<Sala | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)

  const loadSalas = React.useCallback(async () => {
    setIsLoading(true)
    const data = await getSalasAction(searchTerm)
    setSalas(data)
    setIsLoading(false)
  }, [searchTerm])

  React.useEffect(() => {
    const timer = setTimeout(() => {
      loadSalas()
    }, 300)
    return () => clearTimeout(timer)
  }, [loadSalas])

  const filteredSalas = React.useMemo(() => {
    if (filterCapacidade === "todas") return salas;
    if (filterCapacidade === "grande") return salas.filter(s => s.capacidade >= 40);
    if (filterCapacidade === "media") return salas.filter(s => s.capacidade >= 20 && s.capacidade < 40);
    if (filterCapacidade === "pequena") return salas.filter(s => s.capacidade < 20);
    return salas;
  }, [salas, filterCapacidade])

  const handleDelete = async () => {
    if (!deleteId) return;
    const toastId = toast.loading("Excluindo sala...");
    const result = await deleteSalaAction(deleteId);
    
    if (result.success) {
      toast.success("Sala excluída com sucesso!", { id: toastId });
      loadSalas(); 
    } else {
      toast.error("Erro ao excluir.", { id: toastId, description: result.error });
    }
    setDeleteId(null);
  }

  const handleEditClick = (sala: Sala) => {
    setEditingSala({ ...sala }); 
    setIsEditOpen(true);
  }

  const handleSaveEdit = async () => {
    if (!editingSala) return;
    
    if (!editingSala.nome || !editingSala.codigo) {
        toast.warning("Preencha todos os campos obrigatórios.");
        return;
    }

    setIsSaving(true);
    const result = await updateSalaAction(editingSala.id, {
        nome: editingSala.nome,
        codigo: editingSala.codigo,
        capacidade: editingSala.capacidade
    });
    setIsSaving(false);

    if (result.success) {
        toast.success("Sala atualizada com sucesso!");
        setIsEditOpen(false);
        setEditingSala(null);
        loadSalas(); 
    } else {
        toast.error("Erro ao atualizar", { description: result.error });
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#F8F9FA] dark:bg-zinc-950">
        
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem><BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbPage>Salas</BreadcrumbPage></BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col p-4 md:p-8 max-w-6xl mx-auto w-full gap-6">
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Gerenciar Salas</h1>
              <p className="text-muted-foreground">Consulte, altere ou adicione novos espaços.</p>
            </div>
            <Button className="shadow-md" onClick={() => router.push('/salas/cadastrarSalas')}>
              <Plus className="mr-2 h-4 w-4" /> Nova Sala
            </Button>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border shadow-sm flex flex-col md:flex-row gap-4 items-center">
            <div className="relative w-full md:flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nome ou código..." 
                className="pl-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full md:w-[200px]">
              <Select value={filterCapacidade} onValueChange={setFilterCapacidade}>
                <SelectTrigger className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Capacidade" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as capacidades</SelectItem>
                  <SelectItem value="grande">Grandes</SelectItem>
                  <SelectItem value="media">Médias</SelectItem>
                  <SelectItem value="pequena">Pequenas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-zinc-50 dark:bg-zinc-950/50">
                <TableRow>
                  <TableHead className="w-[300px]">Nome da Sala</TableHead>
                  <TableHead className="pl-20">Código</TableHead>
                  
                  <TableHead>Capacidade</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      Carregando salas...
                    </TableCell>
                  </TableRow>
                ) : filteredSalas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      Nenhuma sala encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSalas.map((sala) => (
                    <TableRow key={sala.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <span className="text-zinc-900 dark:text-zinc-100">{sala.nome}</span>
                        </div>
                      </TableCell>                     
                      <TableCell className="pl-20">
                        <Badge variant="outline" className="font-mono text-xs">
                          {sala.codigo || "N/A"}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{sala.capacidade} lug.</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-zinc-500 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => handleEditClick(sala)}
                            title="Alterar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-zinc-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => setDeleteId(sala.id)}
                            title="Deletar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Editar Sala</DialogTitle>
                    <DialogDescription>
                        Faça alterações nas informações da sala abaixo.
                    </DialogDescription>
                </DialogHeader>
                
                {editingSala && (
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="nome">Nome da Sala</Label>
                            <Input 
                                id="nome" 
                                value={editingSala.nome} 
                                onChange={(e) => setEditingSala({...editingSala, nome: e.target.value})} 
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="codigo">Código</Label>
                                <Input 
                                    id="codigo" 
                                    value={editingSala.codigo} 
                                    onChange={(e) => setEditingSala({...editingSala, codigo: e.target.value})} 
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="capacidade">Capacidade</Label>
                                <Input 
                                    id="capacidade" 
                                    type="number"
                                    value={editingSala.capacidade} 
                                    onChange={(e) => setEditingSala({...editingSala, capacidade: Number(e.target.value)})} 
                                />
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSaveEdit} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                        Salvar Alterações
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente a sala
                e pode afetar agendamentos históricos vinculados a ela.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Sim, deletar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Toaster richColors position="bottom-right" />
      </SidebarInset>
    </SidebarProvider>
  )
}