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
  Loader2,
  Monitor,
  Box,
  LayoutGrid
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
import { ScrollArea } from "@/components/ui/scroll-area"

interface Equipamento {
  idEquipamento: number
  descricao: string
  quantidade: number
  ativo: boolean
}

interface Sala {
  id: number
  nome: string
  codigo: string
  capacidade: number
  equipamentos?: Equipamento[]
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
    try {
      const data = await getSalasAction(searchTerm)
      setSalas(data as unknown as Sala[]) 
    } catch (error) {
      toast.error("Erro ao carregar salas")
    } finally {
      setIsLoading(false)
    }
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

  const getTotalItens = (equipamentos?: Equipamento[]) => {
    if (!equipamentos || equipamentos.length === 0) return 0;
    return equipamentos.reduce((acc, item) => acc + (item.quantidade || 1), 0);
  }

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
                  {/* Ajustei o width aqui também */}
                  <TableHead className="w-[300px]">Nome da Sala</TableHead>
                  
                  {/* ADICIONEI pl-10 AQUI PARA SEPARAR DO NOME */}
                  <TableHead className="pl-10">Código</TableHead>
                  
                  <TableHead>Capacidade</TableHead>
                  <TableHead>Total Equipamentos</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Carregando salas...
                    </TableCell>
                  </TableRow>
                ) : filteredSalas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Nenhuma sala encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSalas.map((sala) => {
                    const totalItens = getTotalItens(sala.equipamentos);
                    
                    return (
                      <TableRow key={sala.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                              <Building2 className="h-4 w-4" />
                            </div>
                            <span className="text-zinc-900 dark:text-zinc-100">{sala.nome}</span>
                          </div>
                        </TableCell>                     
                        
                        {/* ADICIONEI pl-10 AQUI TAMBÉM NA CÉLULA */}
                        <TableCell className="pl-10">
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

                        <TableCell>
                          <div className={cn(
                            "flex items-center gap-2 font-medium",
                            totalItens > 0 ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-400 italic"
                          )}>
                             <Monitor className={cn("h-4 w-4", totalItens > 0 ? "text-blue-500" : "opacity-50")} />
                             <span>{totalItens}</span>
                             <span className="text-xs font-normal text-muted-foreground">und.</span>
                          </div>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-zinc-500 hover:text-blue-600 hover:bg-blue-50"
                              onClick={() => handleEditClick(sala)}
                              title="Alterar / Ver Equipamentos"
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
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* MODAL DE EDIÇÃO E VISUALIZAÇÃO */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle>Detalhes da Sala</DialogTitle>
                    <DialogDescription>
                        Edite informações e visualize o inventário completo.
                    </DialogDescription>
                </DialogHeader>
                
                {editingSala && (
                    <div className="grid gap-6 py-4">
                        <div className="grid gap-4 p-4 border rounded-lg bg-zinc-50/50 dark:bg-zinc-900/50">
                            <h3 className="text-sm font-semibold flex items-center gap-2 mb-1">
                                <LayoutGrid className="h-4 w-4 text-primary" /> Informações Básicas
                            </h3>
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

                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold flex items-center gap-2">
                                    <Monitor className="h-4 w-4 text-primary" /> Inventário de Equipamentos
                                </h3>
                                <Badge variant="secondary" className="font-normal text-xs">
                                    Total: {getTotalItens(editingSala.equipamentos)}
                                </Badge>
                            </div>
                            
                            <div className="border rounded-md bg-white dark:bg-zinc-950">
                                {editingSala.equipamentos && editingSala.equipamentos.length > 0 ? (
                                    <ScrollArea className="h-[180px]">
                                        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                            {editingSala.equipamentos.map((equip) => (
                                                <div key={equip.idEquipamento} className="flex items-center justify-between p-3 text-sm">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded text-zinc-500">
                                                            <Box className="h-3.5 w-3.5" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                                                {equip.descricao}
                                                            </span>
                                                            <span className="text-[10px] text-muted-foreground">
                                                                {equip.ativo ? "Disponível" : "Em manutenção/Inativo"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <Badge variant="outline" className="font-mono bg-zinc-50">
                                                        Qtd: {equip.quantidade}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-[100px] text-muted-foreground text-sm gap-2">
                                        <Box className="h-8 w-8 opacity-20" />
                                        <p>Nenhum equipamento vinculado.</p>
                                    </div>
                                )}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">
                                * Para adicionar equipamentos, acesse o menu "Equipamentos" e vincule a esta sala.
                            </p>
                        </div>
                    </div>
                )}

                {/* ADICIONEI GAP-4 AQUI PARA SEPARAR OS BOTÕES */}
                <DialogFooter className="gap-4">
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
                Esta ação não pode ser desfeita. Isso excluirá permanentemente a sala.
                <br/>
                <span className="text-red-500 font-medium text-xs mt-2 block">
                    Atenção: Os equipamentos vinculados ficarão sem local definido.
                </span>
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

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}