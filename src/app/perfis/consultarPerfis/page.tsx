"use client"

import * as React from "react"
import { 
  Search, Pencil, Trash2, Plus, Loader2, Save, Shield, ShieldCheck, Filter
} from "lucide-react"
import { useRouter } from "next/navigation"
import { getPerfisAction, updatePerfilAction, deletePerfilAction } from "@/app/actions/perfis"
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
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch" 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Toaster } from "@/components/ui/sonner" 
import { toast } from "sonner"

interface Perfil {
  id: number
  descricao: string
  isAdmin: boolean
}

export default function ConsultarPerfisPage() {
  const router = useRouter()

  const [perfis, setPerfis] = React.useState<Perfil[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  const [searchTerm, setSearchTerm] = React.useState("")
  const [filterType, setFilterType] = React.useState("all")

  const [deleteId, setDeleteId] = React.useState<number | null>(null)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [editingPerfil, setEditingPerfil] = React.useState<Perfil | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)

  const loadData = React.useCallback(async () => {
    setIsLoading(true)
    const data = await getPerfisAction({
        term: searchTerm,
        type: filterType
    })
    setPerfis(data)
    setIsLoading(false)
  }, [searchTerm, filterType])

  React.useEffect(() => {
    const timer = setTimeout(() => { loadData() }, 300)
    return () => clearTimeout(timer)
  }, [loadData])

  const handleDelete = async () => {
    if (!deleteId) return;
    const toastId = toast.loading("Excluindo perfil...");
    const result = await deletePerfilAction(deleteId);
    
    if (result.success) {
      toast.success("Perfil excluído!", { id: toastId });
      loadData();
    } else {
      toast.error("Erro ao excluir.", { id: toastId, description: result.error });
    }
    setDeleteId(null);
  }

  const handleEditClick = (perfil: Perfil) => {
    setEditingPerfil({ ...perfil });
    setIsEditOpen(true);
  }

  const handleSaveEdit = async () => {
    if (!editingPerfil || !editingPerfil.descricao) {
        toast.warning("A descrição é obrigatória.");
        return;
    }
    setIsSaving(true);
    const result = await updatePerfilAction(editingPerfil.id, {
        descricao: editingPerfil.descricao,
        isAdmin: editingPerfil.isAdmin
    });
    setIsSaving(false);

    if (result.success) {
        toast.success("Perfil atualizado!");
        setIsEditOpen(false);
        setEditingPerfil(null);
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
                <BreadcrumbItem><BreadcrumbPage>Perfis</BreadcrumbPage></BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col p-4 md:p-8 max-w-6xl mx-auto w-full gap-6">
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Gerenciar Perfis</h1>
              <p className="text-muted-foreground">Configure os níveis de acesso do sistema.</p>
            </div>
            <Button className="shadow-md" onClick={() => router.push('/dashboard/perfis/cadastro')}>
              <Plus className="mr-2 h-4 w-4" /> Novo Perfil
            </Button>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border shadow-sm flex flex-col md:flex-row gap-3 items-center">
            <div className="relative w-full md:flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar perfil..." 
                className="pl-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="w-full md:w-[200px]">
                <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 w-full">
                        <div className="flex items-center gap-2 truncate">
                            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                            <SelectValue placeholder="Permissão" />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas as Permissões</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="standard">Padrão</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-zinc-50 dark:bg-zinc-950/50">
                <TableRow>
                  <TableHead className="w-[400px] pl-6">Descrição do Perfil</TableHead>
                  <TableHead>Permissões Administrativas</TableHead>
                  <TableHead className="text-right pr-6">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={3} className="h-24 text-center text-muted-foreground">Carregando...</TableCell></TableRow>
                ) : perfis.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="h-24 text-center text-muted-foreground">Nenhum perfil encontrado.</TableCell></TableRow>
                ) : (
                  perfis.map((perfil) => (
                    <TableRow key={perfil.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                      <TableCell className="font-medium pl-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <Shield className="h-4 w-4" />
                            </div>
                            <span className="text-zinc-900 dark:text-zinc-100">{perfil.descricao}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {perfil.isAdmin ? (
                            <Badge variant="outline" className="font-normal gap-1.5 py-1">
                                <ShieldCheck className="h-3.5 w-3.5 text-red-500 fill-red-100" />
                                Administrador
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="font-normal gap-1.5 py-1">
                                <Shield className="h-3.5 w-3.5 text-blue-500 fill-blue-100" />
                                Padrão
                            </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" size="icon" 
                            className="h-8 w-8 text-zinc-500 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => handleEditClick(perfil)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" size="icon" 
                            className="h-8 w-8 text-zinc-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => setDeleteId(perfil.id)}
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
                    <DialogTitle>Editar Perfil</DialogTitle>
                    <DialogDescription>
                        Ajuste o nome e as permissões do perfil.
                    </DialogDescription>
                </DialogHeader>
                
                {editingPerfil && (
                    <div className="grid gap-6 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="descricao">Descrição</Label>
                            <Input 
                                id="descricao" 
                                value={editingPerfil.descricao} 
                                onChange={(e) => setEditingPerfil({...editingPerfil, descricao: e.target.value})} 
                            />
                        </div>
                        
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label className="text-base">Acesso Administrativo</Label>
                                <div className="text-sm text-muted-foreground">
                                    Permite acesso total ao sistema.
                                </div>
                            </div>
                            <Switch
                                checked={editingPerfil.isAdmin}
                                onCheckedChange={(checked) => setEditingPerfil({...editingPerfil, isAdmin: checked})}
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
              <AlertDialogTitle>Excluir perfil?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação é irreversível. Se houver usuários vinculados a este perfil, a exclusão será bloqueada.
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