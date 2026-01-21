"use client"

import * as React from "react"
import { 
  Search, Pencil, Trash2, Plus, Loader2, Save, MapPin
} from "lucide-react"
import { useRouter } from "next/navigation"

import { getUnidadesAction, updateUnidadeAction, deleteUnidadeAction } from "@/app/actions/unidades"

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Toaster } from "@/components/ui/sonner" 
import { toast } from "sonner"

interface Unidade {
  id: number
  descricao: string
}

export default function ConsultarUnidadesPage() {
  const router = useRouter()

  const [unidades, setUnidades] = React.useState<Unidade[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState("")

  const [deleteId, setDeleteId] = React.useState<number | null>(null)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [editingUnidade, setEditingUnidade] = React.useState<Unidade | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)

  const loadData = React.useCallback(async () => {
    setIsLoading(true)
    const data = await getUnidadesAction(searchTerm)
    setUnidades(data)
    setIsLoading(false)
  }, [searchTerm])

  React.useEffect(() => {
    const timer = setTimeout(() => { loadData() }, 300)
    return () => clearTimeout(timer)
  }, [loadData])

  const handleDelete = async () => {
    if (!deleteId) return;
    const toastId = toast.loading("Excluindo unidade...");
    const result = await deleteUnidadeAction(deleteId);
    
    if (result.success) {
      toast.success("Unidade excluída!", { id: toastId });
      loadData();
    } else {
      toast.error("Erro ao excluir.", { id: toastId, description: result.error });
    }
    setDeleteId(null);
  }

  const handleEditClick = (unidade: Unidade) => {
    setEditingUnidade({ ...unidade });
    setIsEditOpen(true);
  }

  const handleSaveEdit = async () => {
    if (!editingUnidade || !editingUnidade.descricao) {
        toast.warning("O nome da unidade é obrigatório.");
        return;
    }
    setIsSaving(true);
    const result = await updateUnidadeAction(editingUnidade.id, editingUnidade.descricao);
    setIsSaving(false);

    if (result.success) {
        toast.success("Unidade atualizada!");
        setIsEditOpen(false);
        setEditingUnidade(null);
        loadData();
    } else {
        toast.error("Erro ao atualizar.");
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
                <BreadcrumbItem><BreadcrumbPage>Unidades</BreadcrumbPage></BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col p-4 md:p-8 max-w-6xl mx-auto w-full gap-6">
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Gerenciar Unidades</h1>
              <p className="text-muted-foreground">Cadastre e edite as unidades do Senac.</p>
            </div>
            <Button className="shadow-md" onClick={() => router.push('/dashboard/unidades/cadastro')}>
              <Plus className="mr-2 h-4 w-4" /> Novo Unidade
            </Button>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border shadow-sm flex items-center">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar unidade..." 
                className="pl-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-zinc-50 dark:bg-zinc-950/50">
                <TableRow>
                  <TableHead className="w-[400px] pl-6">Nome da Unidade</TableHead>
                  <TableHead className="text-right pr-6">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={2} className="h-24 text-center text-muted-foreground">Carregando...</TableCell></TableRow>
                ) : unidades.length === 0 ? (
                  <TableRow><TableCell colSpan={2} className="h-24 text-center text-muted-foreground">Nenhuma unidade encontrada.</TableCell></TableRow>
                ) : (
                  unidades.map((unidade) => (
                    <TableRow key={unidade.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                      <TableCell className="font-medium pl-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <MapPin className="h-4 w-4" />
                            </div>
                            <span className="text-zinc-900 dark:text-zinc-100">{unidade.descricao}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" size="icon" 
                            className="h-8 w-8 text-zinc-500 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => handleEditClick(unidade)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" size="icon" 
                            className="h-8 w-8 text-zinc-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => setDeleteId(unidade.id)}
                            title="Excluir"
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
                    <DialogTitle>Editar Unidade</DialogTitle>
                    <DialogDescription>
                        Altere o nome da unidade abaixo.
                    </DialogDescription>
                </DialogHeader>
                
                {editingUnidade && (
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="descricao">Nome da Unidade</Label>
                            <Input 
                                id="descricao" 
                                value={editingUnidade.descricao} 
                                onChange={(e) => setEditingUnidade({...editingUnidade, descricao: e.target.value})} 
                            />
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSaveEdit} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                        Salvar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Se houver salas ou usuários vinculados a esta unidade, a exclusão será bloqueada pelo sistema.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Toaster richColors position="bottom-right" />
      </SidebarInset>
    </SidebarProvider>
  )
}