"use client"

import * as React from "react"
import { 
  Search, Pencil, Trash2, Plus, Loader2, Save, Monitor, MapPin, Package, Filter
} from "lucide-react"
import { useRouter } from "next/navigation"

import { 
  getEquipamentosAction, 
  updateEquipamentoAction, 
  deleteEquipamentoAction, 
  getSalasOptionsAction 
} from "@/app/actions/equipamentos"

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Toaster } from "@/components/ui/sonner" 
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Equipamento {
  id: number
  descricao: string
  quantidade: number
  ativo: boolean
  observacao: string | null
  idSala: number
  nomeSala: string
  codigoSala: string
}

interface SalaOption {
    id: number
    nome: string
    codigo: string
}

export default function ConsultarEquipamentosPage() {
  const router = useRouter()

  const [equipamentos, setEquipamentos] = React.useState<Equipamento[]>([])
  const [salasOptions, setSalasOptions] = React.useState<SalaOption[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  
  const [searchTerm, setSearchTerm] = React.useState("")
  const [filterSala, setFilterSala] = React.useState("all")
  const [filterStatus, setFilterStatus] = React.useState("all")
  const [filterEstoque, setFilterEstoque] = React.useState("all")

  const [deleteId, setDeleteId] = React.useState<number | null>(null)
  
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<Equipamento | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)

  const loadData = React.useCallback(async () => {
    setIsLoading(true)
    
    const [equipData, salasData] = await Promise.all([
        getEquipamentosAction({
            term: searchTerm,
            salaId: filterSala,
            status: filterStatus,
            estoque: filterEstoque
        }),
        getSalasOptionsAction()
    ])
    
    setEquipamentos(equipData)
    setSalasOptions(salasData.map(s => ({...s, id: Number(s.id)})))
    setIsLoading(false)
  }, [searchTerm, filterSala, filterStatus, filterEstoque])

  React.useEffect(() => {
    const timer = setTimeout(() => { loadData() }, 300)
    return () => clearTimeout(timer)
  }, [loadData])

  const handleDelete = async () => {
    if (!deleteId) return;
    const toastId = toast.loading("Excluindo equipamento...");
    const result = await deleteEquipamentoAction(deleteId);
    
    if (result.success) {
      toast.success("Equipamento excluído!", { id: toastId });
      loadData();
    } else {
      toast.error("Erro ao excluir.", { id: toastId });
    }
    setDeleteId(null);
  }

  const handleEditClick = (item: Equipamento) => {
    setEditingItem({ ...item });
    setIsEditOpen(true);
  }

  const handleSaveEdit = async () => {
    if (!editingItem || !editingItem.descricao || !editingItem.idSala) {
        toast.warning("Preencha os campos obrigatórios.");
        return;
    }
    setIsSaving(true);
    const result = await updateEquipamentoAction(editingItem.id, {
        descricao: editingItem.descricao,
        quantidade: editingItem.quantidade,
        idSala: editingItem.idSala,
        ativo: editingItem.ativo,
        observacao: editingItem.observacao || ""
    });
    setIsSaving(false);

    if (result.success) {
        toast.success("Equipamento atualizado!");
        setIsEditOpen(false);
        setEditingItem(null);
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
                <BreadcrumbItem><BreadcrumbPage>Equipamentos</BreadcrumbPage></BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col p-4 md:p-8 max-w-6xl mx-auto w-full gap-6">
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Gerenciar Equipamentos</h1>
              <p className="text-muted-foreground">Consulte o inventário e alocação dos itens.</p>
            </div>
            <Button className="shadow-md" onClick={() => router.push('/equipamentos/cadastrarEquipamentos')}>
              <Plus className="mr-2 h-4 w-4" /> Novo Equipamento
            </Button>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border shadow-sm flex flex-col md:flex-row gap-3 items-center">

            <div className="relative w-full md:flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar equipamento..." 
                className="pl-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <div className="w-full sm:w-[200px]">
                    <Select value={filterSala} onValueChange={setFilterSala}>
                        <SelectTrigger className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 w-full">
                            <div className="flex items-center gap-2 truncate">
                                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                                <SelectValue placeholder="Sala" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas as Salas</SelectItem>
                            {salasOptions.map((s) => (
                                <SelectItem key={s.id} value={String(s.id)}>
                                    {s.nome}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="w-full sm:w-[150px]">
                    <Select value={filterEstoque} onValueChange={setFilterEstoque}>
                        <SelectTrigger className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 w-full">
                            <div className="flex items-center gap-2 truncate">
                                <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                                <SelectValue placeholder="Estoque" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="sem">Esgotado</SelectItem>
                            <SelectItem value="baixo">Baixo</SelectItem>
                            <SelectItem value="normal">Maior</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="w-full sm:w-[130px]">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 w-full">
                            <div className="flex items-center gap-2 truncate">
                                <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                                <SelectValue placeholder="Status" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="ativo">Ativos</SelectItem>
                            <SelectItem value="inativo">Inativos</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-zinc-50 dark:bg-zinc-950/50">
                <TableRow>
                  <TableHead className="w-[300px] pl-6">Equipamento</TableHead>
                  <TableHead className="pl-24">Sala Vinculada</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right pr-6">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Carregando...</TableCell></TableRow>
                ) : equipamentos.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Nenhum equipamento encontrado.</TableCell></TableRow>
                ) : (
                  equipamentos.map((item) => (
                    <TableRow key={item.id} className={cn("hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50", !item.ativo && "opacity-60 bg-red-50/30 dark:bg-red-900/10")}>
                      
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <Monitor className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{item.descricao}</span>
                                {item.observacao && <span className="text-xs text-muted-foreground truncate max-w-[200px]">{item.observacao}</span>}
                            </div>
                        </div>
                      </TableCell>

                      <TableCell className="pl-24">
                        <Badge variant="outline" className="font-normal gap-1">
                            <MapPin className="h-3 w-3" />
                            {item.nomeSala}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            {item.quantidade === 0 ? (
                                <span className="text-red-600 font-bold">Esgotado</span>
                            ) : (
                                <span>{item.quantidade} un.</span>
                            )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant={item.ativo ? "default" : "destructive"} className={cn("text-[10px]", item.ativo ? "bg-emerald-600 hover:bg-emerald-700" : "")}>
                            {item.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" size="icon" 
                            className="h-8 w-8 text-zinc-500 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => handleEditClick(item)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" size="icon" 
                            className="h-8 w-8 text-zinc-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => setDeleteId(item.id)}
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
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Editar Equipamento</DialogTitle>
                    <DialogDescription>
                        Atualize as informações do item.
                    </DialogDescription>
                </DialogHeader>
                
                {editingItem && (
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="descricao">Descrição do Item</Label>
                            <Input 
                                id="descricao" 
                                value={editingItem.descricao} 
                                onChange={(e) => setEditingItem({...editingItem, descricao: e.target.value})} 
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="quantidade">Quantidade</Label>
                                <Input 
                                    id="quantidade" 
                                    type="number"
                                    min={0}
                                    value={editingItem.quantidade} 
                                    onChange={(e) => setEditingItem({...editingItem, quantidade: Number(e.target.value)})} 
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="sala">Localização (Sala)</Label>
                                <Select 
                                    value={String(editingItem.idSala)} 
                                    onValueChange={(val) => setEditingItem({...editingItem, idSala: Number(val)})}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {salasOptions.map((s) => (
                                            <SelectItem key={s.id} value={String(s.id)}>
                                                {s.nome}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="observacao">Observações</Label>
                            <Textarea 
                                id="observacao" 
                                className="resize-none"
                                value={editingItem.observacao || ""} 
                                onChange={(e) => setEditingItem({...editingItem, observacao: e.target.value})} 
                            />
                        </div>

                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label className="text-base">Equipamento Ativo</Label>
                                <div className="text-sm text-muted-foreground">
                                    Define se o item está disponível para uso.
                                </div>
                            </div>
                            <Switch
                                checked={editingItem.ativo}
                                onCheckedChange={(checked) => setEditingItem({...editingItem, ativo: checked})}
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
              <AlertDialogTitle>Excluir equipamento?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação removerá o item do inventário permanentemente.
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