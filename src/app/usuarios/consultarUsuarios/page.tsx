"use client"

import * as React from "react"
import { 
  Search, Pencil, Trash2, Ban, CheckCircle2, 
  Shield, ShieldCheck, Mail, Plus, Loader2, Save, Filter
} from "lucide-react"
import { useRouter } from "next/navigation"

import { 
  getUsuariosAction, 
  updateUsuarioAction, 
  deleteUsuarioAction, 
  toggleStatusUsuarioAction,
  getPerfisOptionsAction
} from "@/app/actions/usuarios"

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Toaster } from "@/components/ui/sonner" 
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface UsuarioData {
  id: number
  nome: string
  email: string
  ativo: boolean | null
  idPerfil: number | null
  nomePerfil: string | null 
}

interface Perfil {
  idPerfil: number
  descricaoPerfil: string 
}

export default function ConsultarUsuariosPage() {
  const router = useRouter()

  const [usuarios, setUsuarios] = React.useState<UsuarioData[]>([])
  const [perfis, setPerfis] = React.useState<Perfil[]>([]) 
  const [isLoading, setIsLoading] = React.useState(true)
  
  const [searchTerm, setSearchTerm] = React.useState("")
  const [filterPerfil, setFilterPerfil] = React.useState("all")
  const [filterStatus, setFilterStatus] = React.useState("all")

  const [deleteId, setDeleteId] = React.useState<number | null>(null)
  const [suspendData, setSuspendData] = React.useState<{ id: number, nome: string, currentStatus: boolean } | null>(null)
  
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [editingUser, setEditingUser] = React.useState<UsuarioData | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)

  const loadData = React.useCallback(async () => {
    setIsLoading(true)
    
    const [usersData, perfisData] = await Promise.all([
        getUsuariosAction({ 
            term: searchTerm, 
            perfil: filterPerfil, 
            status: filterStatus 
        }),
        getPerfisOptionsAction()
    ])
    
    setUsuarios(usersData as unknown as UsuarioData[])
    setPerfis(perfisData as unknown as Perfil[])
    
    setIsLoading(false)
  }, [searchTerm, filterPerfil, filterStatus])

  React.useEffect(() => {
    const timer = setTimeout(() => { loadData() }, 300)
    return () => clearTimeout(timer)
  }, [loadData])

  const handleDelete = async () => {
    if (!deleteId) return;
    const toastId = toast.loading("Excluindo usuário...");
    const result = await deleteUsuarioAction(deleteId);
    
    if (result.success) {
      toast.success("Usuário excluído!", { id: toastId });
      loadData();
    } else {
      toast.error("Erro ao excluir.", { id: toastId });
    }
    setDeleteId(null);
  }

  const handleToggleSuspend = async () => {
    if (!suspendData) return;
    const novoStatus = !suspendData.currentStatus; 
    const toastId = toast.loading(`${novoStatus ? "Ativando" : "Suspendendo"} usuário...`);
    const result = await toggleStatusUsuarioAction(suspendData.id, novoStatus);

    if (result.success) {
      toast.success(`Usuário ${novoStatus ? "ativado" : "suspenso"} com sucesso!`, { id: toastId });
      loadData();
    } else {
      toast.error(`Erro ao alterar status.`, { id: toastId });
    }
    setSuspendData(null);
  }

  const handleEditClick = (user: UsuarioData) => {
    setEditingUser({ ...user });
    setIsEditOpen(true);
  }

  const handleSaveEdit = async () => {
    if (!editingUser || !editingUser.idPerfil) {
        toast.warning("Preencha os campos obrigatórios.");
        return;
    }
    setIsSaving(true);
    const result = await updateUsuarioAction(editingUser.id, {
        nome: editingUser.nome,
        email: editingUser.email,
        idPerfil: editingUser.idPerfil
    });
    setIsSaving(false);

    if (result.success) {
        toast.success("Usuário atualizado!");
        setIsEditOpen(false);
        setEditingUser(null);
        loadData();
    } else {
        toast.error("Erro ao atualizar.");
    }
  }

  const getProfileColor = (nomePerfil: string | null) => {
    if (!nomePerfil) return "text-zinc-400"; 
    const nome = nomePerfil.toLowerCase();
    if (nome.includes("admin")) return "text-red-500 fill-red-100"; 
    if (nome.includes("docente") || nome.includes("professor")) return "text-blue-500 fill-blue-100"; 
    if (nome.includes("aluno")) return "text-emerald-500 fill-emerald-100"; 
    return "text-zinc-500"; 
  }

  const getProfileIcon = (nomePerfil: string | null) => {
    const nome = nomePerfil?.toLowerCase() || "";
    if (nome.includes("admin")) return ShieldCheck;
    return Shield;
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
                <BreadcrumbItem><BreadcrumbPage>Usuários</BreadcrumbPage></BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col p-4 md:p-8 max-w-6xl mx-auto w-full gap-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Gerenciar Usuários</h1>
              <p className="text-muted-foreground">Consulte e gerencie o acesso ao sistema.</p>
            </div>
            <Button className="shadow-md" onClick={() => router.push('/usuarios/cadastrarUsuarios')}>
              <Plus className="mr-2 h-4 w-4" /> Novo Usuário
            </Button>
          </div>

          {/* BARRA DE FILTROS E PESQUISA */}
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border shadow-sm flex flex-col md:flex-row gap-3 items-center">
            
            {/* SEARCH */}
            <div className="relative w-full md:flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nome ou e-mail..." 
                className="pl-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* FILTROS */}
            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                <div className="w-full md:w-[200px]">
                    <Select value={filterPerfil} onValueChange={setFilterPerfil}>
                        <SelectTrigger className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 w-full">
                            <div className="flex items-center gap-2 truncate">
                                <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
                                <SelectValue placeholder="Perfil" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos Perfis</SelectItem>
                            {perfis.map((p) => (
                                <SelectItem key={p.idPerfil} value={String(p.idPerfil)}>
                                    {p.descricaoPerfil}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="w-full md:w-[180px]">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 w-full">
                            <div className="flex items-center gap-2 truncate">
                                <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                                <SelectValue placeholder="Status" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos Status</SelectItem>
                            <SelectItem value="ativo">Ativos</SelectItem>
                            <SelectItem value="suspenso">Suspensos</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-zinc-50 dark:bg-zinc-950/50">
                <TableRow>
                  <TableHead className="w-[300px]">Usuário</TableHead>
                  <TableHead className="pl-24">Perfil</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">Carregando...</TableCell></TableRow>
                ) : usuarios.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">Nenhum usuário encontrado.</TableCell></TableRow>
                ) : (
                  usuarios.map((user) => {
                    const ProfileIcon = getProfileIcon(user.nomePerfil);

                    return (
                    <TableRow key={user.id} className={cn("hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50", !user.ativo && "opacity-60 bg-red-50/30 dark:bg-red-900/10")}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border">
                                <AvatarFallback className={cn("text-xs font-bold", !user.ativo ? "bg-zinc-200 text-zinc-500" : "bg-primary/10 text-primary")}>
                                    {user.nome.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{user.nome}</span>
                                <span className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3"/> {user.email}</span>
                            </div>
                        </div>
                      </TableCell>
                      
                      <TableCell className="pl-24">
                        <Badge variant="outline" className="font-normal gap-1.5 py-1">
                            {/* Renderiza o ícone dinâmico aqui */}
                            <ProfileIcon className={cn("h-3.5 w-3.5", getProfileColor(user.nomePerfil))} />
                            {user.nomePerfil || "Sem perfil"}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <Badge variant={user.ativo ? "default" : "destructive"} className={cn("text-[10px]", user.ativo ? "bg-emerald-600 hover:bg-emerald-700" : "")}>
                            {user.ativo ? "Ativo" : "Suspenso"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" size="icon" 
                            className="h-8 w-8 text-zinc-500 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => handleEditClick(user)}
                            title="Editar Dados"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          
                          <Button 
                            variant="ghost" size="icon" 
                            className={cn(
                                "h-8 w-8", 
                                user.ativo ? "text-zinc-500 hover:text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            )}
                            onClick={() => setSuspendData({ id: user.id, nome: user.nome, currentStatus: !!user.ativo })}
                            title={user.ativo ? "Suspender Acesso" : "Reativar Acesso"}
                          >
                             {user.ativo ? <Ban className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                          </Button>

                          <Button 
                            variant="ghost" size="icon" 
                            className="h-8 w-8 text-zinc-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => setDeleteId(user.id)}
                            title="Excluir Conta"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )})
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* ... (Dialogs e Alerts permanecem iguais) ... */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Editar Usuário</DialogTitle>
                    <DialogDescription>
                        Altere os dados de acesso.
                    </DialogDescription>
                </DialogHeader>
                
                {editingUser && (
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="nome">Nome Completo</Label>
                            <Input 
                                id="nome" 
                                value={editingUser.nome} 
                                onChange={(e) => setEditingUser({...editingUser, nome: e.target.value})} 
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">E-mail</Label>
                            <Input 
                                id="email" 
                                type="email"
                                value={editingUser.email} 
                                onChange={(e) => setEditingUser({...editingUser, email: e.target.value})} 
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="perfil">Perfil de Acesso</Label>
                            <Select 
                                value={String(editingUser.idPerfil)} 
                                onValueChange={(val) => setEditingUser({...editingUser, idPerfil: Number(val)})}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {perfis.map((p) => (
                                        <SelectItem key={p.idPerfil} value={String(p.idPerfil)}>
                                            {p.descricaoPerfil}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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

        <AlertDialog open={!!suspendData} onOpenChange={() => setSuspendData(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {suspendData?.currentStatus ? "Suspender Acesso?" : "Reativar Acesso?"}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {suspendData?.currentStatus 
                            ? `O usuário ${suspendData?.nome} perderá o acesso ao sistema imediatamente.`
                            : `O usuário ${suspendData?.nome} terá seu acesso restaurado.`
                        }
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={handleToggleSuspend}
                        className={suspendData?.currentStatus ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"}
                    >
                        Confirmar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir permanentemente?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação removerá o usuário do banco de dados e todo seu histórico.
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