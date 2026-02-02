"use client"

import * as React from "react"
import { 
  User, 
  FlaskConical, 
  Loader2, 
  Layers, 
  AlertCircle,
  CheckCircle2,
  CalendarDays,
  Search,
  History,
  Hourglass,
  ListFilter,
  Calendar as CalendarIcon,
  ClipboardList, 
  Check,
  Tag,
  Clock,
  Activity
} from "lucide-react"

import { auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { getDadosUsuarioSidebar } from "@/app/actions/auth"
import { getAgendamentosAction, getSalasAction } from "@/app/actions/agendamentos"
import { salvarChecklistAction, getEquipamentosDaSalaAction } from "@/app/actions/checklist" 

import { ChecklistForm } from "@/components/formularioChecklist"

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Toaster } from "@/components/ui/sonner" 
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

// --- TIPOS ---
interface Agendamento {
  id: number
  dia: number
  mes: number
  ano: number
  periodo: "Manhã" | "Tarde" | "Noite"
  status: "confirmado" | "pendente" | "concluido" 
  docente: string
  disciplina: string
  labId?: number
  groupId?: string
  observacao?: string
}

interface Sala {
  id: number
  nome: string
  equipamentos?: any[]
}

interface Usuario {
  nome: string
  email: string
}

type GroupedItem = 
  | { type: 'single', data: Agendamento, isHistory: boolean, statusPrincipal?: string }
  | { type: 'group', id: string, items: Agendamento[], isHistory: boolean, primaryStatus: string }

export default function MeusAgendamentosPage() {
  const [currentUser, setCurrentUser] = React.useState<Usuario | null>(null)
  const [agendamentos, setAgendamentos] = React.useState<Agendamento[]>([])
  const [laboratorios, setLaboratorios] = React.useState<Sala[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  
  // FILTROS
  const [searchText, setSearchText] = React.useState("")
  const [filterType, setFilterType] = React.useState<"all" | "single" | "series">("all")
  const [filterLab, setFilterLab] = React.useState<string>("all")
  const [filterTurno, setFilterTurno] = React.useState<string>("all")
  const [filterStatus, setFilterStatus] = React.useState<string>("todos")
  const [filterDate, setFilterDate] = React.useState<Date | undefined>(undefined)

  const [expandedGroups, setExpandedGroups] = React.useState<string[]>([])

  // MODAL CHECKLIST
  const [isReportOpen, setIsReportOpen] = React.useState(false)
  const [reportLoading, setReportLoading] = React.useState(false) 
  const [reportData, setReportData] = React.useState<{equipamentos: any[], dadosAgendamento: any} | null>(null)

  // 1. AUTH
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const rawResponse = await getDadosUsuarioSidebar(user.uid)
          const infoBanco = Array.isArray(rawResponse) ? rawResponse[0] : rawResponse;

          if (infoBanco) {
            const nomeCorreto = (infoBanco as any).nome || (infoBanco as any).nomeUsuario || (infoBanco as any).nome_usuario || "Usuário";
            setCurrentUser({ nome: nomeCorreto, email: user.email || "" })
          }
        } catch (error) { console.error(error) }
      }
    })
    return () => unsubscribe()
  }, [])

  // 2. DATA FETCH
  const fetchData = React.useCallback(async () => {
    if (!currentUser) return 
    setIsLoading(true)
    try {
      const [dadosAgendamentos, dadosSalas] = await Promise.all([getAgendamentosAction(), getSalasAction()])
      const meusAgendamentos = (dadosAgendamentos as unknown as Agendamento[]).filter(a => a.docente === currentUser.nome)
      setAgendamentos(meusAgendamentos)
      setLaboratorios(dadosSalas)
    } catch (error) { toast.error("Erro ao carregar agenda.") } 
    finally { setIsLoading(false) }
  }, [currentUser])

  React.useEffect(() => { if (currentUser) fetchData() }, [currentUser, fetchData])

  const getLabName = React.useCallback((id?: number) => {
    if (!id) return "Não definido"
    return laboratorios.find(l => l.id === id)?.nome || `Lab ${id}`
  }, [laboratorios])

  // 3. LOGICA CHECKLIST
  const handleOpenReport = async (itemOrGroup: Agendamento | GroupedItem, isSeries: boolean) => {
    setIsReportOpen(true);
    setReportLoading(true);

    let targetLabId: number | undefined;
    let agendamentoInfo: any = {};

    if (isSeries) {
        const group = itemOrGroup as any;
        const firstItem = group.items[0];
        targetLabId = firstItem.labId;
        agendamentoInfo = {
            isSeries: true,
            count: group.items.length,
            dateStart: new Date(group.items[0].ano, group.items[0].mes, group.items[0].dia),
            dateEnd: new Date(group.items[group.items.length - 1].ano, group.items[group.items.length - 1].mes, group.items[group.items.length - 1].dia),
            groupId: group.id
        };
    } else {
        const item = itemOrGroup as Agendamento;
        targetLabId = item.labId;
        agendamentoInfo = {
            isSeries: false,
            dateStart: new Date(item.ano, item.mes, item.dia),
            idAgendamento: item.id
        };
    }

    try {
        if (targetLabId) {
            const equipamentos = await getEquipamentosDaSalaAction(targetLabId);
            
            // --- ALTERAÇÃO AQUI: FILTRAR APENAS OS ATIVOS ---
            const equipamentosAtivos = equipamentos 
                ? equipamentos.filter((eq: any) => eq.ativo === true) 
                : [];
            
            setReportData({ equipamentos: equipamentosAtivos, dadosAgendamento: agendamentoInfo });
        } else {
            setReportData({ equipamentos: [], dadosAgendamento: agendamentoInfo });
        }
    } catch (error) {
        console.error("Erro ao buscar equipamentos:", error);
        toast.error("Erro ao carregar equipamentos da sala.");
        setReportData({ equipamentos: [], dadosAgendamento: agendamentoInfo });
    } finally {
        setReportLoading(false);
    }
}

  const handleSubmitReport = async (data: any) => {
      if (!reportData) return;

      const payload = {
          idAgendamento: reportData.dadosAgendamento.idAgendamento,
          groupId: reportData.dadosAgendamento.groupId,
          materialOk: data.materialOk,
          limpezaOk: data.limpezaOk,
          observacaoGeral: data.observacaoGeral,
          itens: data.itens
      };

      try {
          const result = await salvarChecklistAction(payload);

          if (result.success) {
              toast.success("Conferência realizada e salva!");
              setIsReportOpen(false);
              setReportData(null);
              fetchData(); 
          } else {
              console.error(result.error);
              toast.error("Erro ao salvar no banco.");
          }
      } catch (error) {
          console.error(error);
          toast.error("Erro de conexão.");
      }
  }

  // 4. LISTA E ORDENAÇÃO
  const organizedList = React.useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    
    // Filtros
    const filtered = agendamentos.filter(item => {
        const searchLower = searchText.toLowerCase()
        const labName = getLabName(item.labId).toLowerCase()
        const matchSearch = item.disciplina?.toLowerCase().includes(searchLower) || item.observacao?.toLowerCase().includes(searchLower) || labName.includes(searchLower)
        
        if (!matchSearch) return false
        if (filterType === "single" && item.groupId) return false
        if (filterType === "series" && !item.groupId) return false
        if (filterLab !== "all" && String(item.labId) !== filterLab) return false
        if (filterTurno !== "all" && item.periodo !== filterTurno) return false
        if (filterStatus !== "todos" && item.status !== filterStatus) return false
        
        if (filterDate) {
            if (item.dia !== filterDate.getDate() || item.mes !== filterDate.getMonth() || item.ano !== filterDate.getFullYear()) return false
        }
        return true
    })

    const groups: Record<string, Agendamento[]> = {}
    const result: GroupedItem[] = []
    const processedGroupIds = new Set<string>()
    
    filtered.forEach(item => { if (item.groupId) { if (!groups[item.groupId]) groups[item.groupId] = []; groups[item.groupId].push(item) } })
    filtered.forEach(item => {
        const itemDate = new Date(item.ano, item.mes, item.dia)
        const isItemPast = itemDate < today
        if (item.groupId) {
            if (!processedGroupIds.has(item.groupId)) {
                const groupItems = groups[item.groupId]
                groupItems.sort((a, b) => new Date(a.ano, a.mes, a.dia).getTime() - new Date(b.ano, b.mes, b.dia).getTime())
                
                const hasFuture = groupItems.some(i => new Date(i.ano, i.mes, i.dia) >= today)
                const allDone = groupItems.every(i => i.status === 'concluido');
                const hasConfirmed = groupItems.some(i => i.status === 'confirmado');
                
                let primaryStatus = 'pendente';
                if (allDone) primaryStatus = 'concluido';
                else if (hasConfirmed) primaryStatus = 'confirmado';

                result.push({ type: 'group', id: item.groupId, items: groupItems, isHistory: !hasFuture, primaryStatus })
                processedGroupIds.add(item.groupId)
            }
        } else {
            result.push({ type: 'single', data: item, isHistory: isItemPast, statusPrincipal: item.status })
        }
    })
    
    return result.sort((a, b) => {
        const getStatus = (item: GroupedItem) => {
            if (item.type === 'single') return item.data.status;
            return item.primaryStatus;
        }
        const statusA = getStatus(a);
        const statusB = getStatus(b);

        const getScore = (item: GroupedItem, status: string) => {
            if (item.isHistory) return 4;
            if (status === 'confirmado') return 1;
            if (status === 'pendente') return 2;
            return 3;
        }

        const scoreA = getScore(a, statusA!);
        const scoreB = getScore(b, statusB!);

        if (scoreA !== scoreB) {
            return scoreA - scoreB;
        }

        const getDate = (item: GroupedItem) => item.type === 'single' 
            ? new Date(item.data.ano, item.data.mes, item.data.dia).getTime() 
            : new Date(item.items[0].ano, item.items[0].mes, item.items[0].dia).getTime()
        
        if (scoreA >= 3) return getDate(b) - getDate(a); 
        return getDate(a) - getDate(b);
    })

  }, [agendamentos, searchText, filterType, filterLab, filterTurno, filterDate, filterStatus, getLabName])

  const toggleGroup = (groupId: string) => setExpandedGroups(prev => prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId])
  const handleResetFilters = () => { setSearchText(""); setFilterType("all"); setFilterLab("all"); setFilterTurno("all"); setFilterStatus("todos"); setFilterDate(undefined) }
  
  const periodColors = { Manhã: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400", Tarde: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400", Noite: "bg-zinc-800 text-zinc-100 border-zinc-700 dark:bg-zinc-700" }

  const AgendamentoCard = ({ item, isChild = false }: { item: Agendamento, isChild?: boolean }) => {
     const today = new Date(); today.setHours(0,0,0,0);
     const itemDate = new Date(item.ano, item.mes, item.dia)
     const isPast = itemDate < today;
     
     const canReport = item.status === 'confirmado' && !isChild; 
     const isDone = item.status === 'concluido';

     const renderSmartText = (text: string | undefined, limit: number, label: string) => {
        if (!text) return null;
        const isTruncated = text.length > limit;
        const truncatedText = text.substring(0, limit) + "...";
        if (!isTruncated) return <span>{text}</span>
        return (
            <Popover>
                <PopoverTrigger asChild>
                    <span className="cursor-pointer hover:text-primary hover:underline underline-offset-2 break-all transition-colors">{truncatedText}</span>
                </PopoverTrigger>
                <PopoverContent className="w-auto max-w-[300px] p-3 text-sm break-words shadow-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">{label}</p>
                    <p className="text-zinc-900 dark:text-zinc-100">{text}</p>
                </PopoverContent>
            </Popover>
        )
     }

     return (
        <Card className={cn("overflow-hidden border shadow-sm transition-all", isChild ? "border-l-4 border-l-violet-500 ml-6 mb-3" : "hover:shadow-md", (isPast || isDone) && !isChild ? "bg-zinc-50/40 opacity-80" : "border-zinc-200 dark:border-zinc-800")}>
            <CardContent className="p-0 flex flex-col">
                <div className="flex flex-col sm:flex-row">
                    <div className={cn("flex flex-col items-center justify-center p-4 min-w-[100px] sm:min-w-[120px] border-b sm:border-b-0 sm:border-r border-zinc-100 dark:border-zinc-800", (isPast || isChild || isDone) ? "bg-zinc-100/50" : "bg-zinc-50 dark:bg-zinc-900")}>
                        <span className={cn("text-2xl sm:text-3xl font-bold", (isPast || isDone) ? "text-zinc-500" : "text-primary")}>{item.dia}</span>
                        <span className="text-xs sm:text-sm font-medium uppercase text-muted-foreground">{format(itemDate, 'MMM', { locale: ptBR })}</span>
                        <span className="text-[10px] sm:text-xs text-muted-foreground mt-1">{item.ano}</span>
                    </div>
                    
                    <div className="flex-1 p-4 flex flex-col justify-center gap-2">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            {isDone ? (
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 flex items-center gap-1">
                                    <Check className="h-3 w-3" /> Concluído
                                </Badge>
                            ) : isPast ? (
                                <Badge variant="outline" className="bg-zinc-100 text-zinc-500 border-zinc-200 flex items-center gap-1">
                                    <History className="h-3 w-3" /> Finalizado
                                </Badge>
                            ) : item.status === 'confirmado' ? (
                                <Badge className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" /> Aprovado
                                </Badge>
                            ) : (
                                <Badge className="bg-orange-500 hover:bg-orange-600 flex items-center gap-1">
                                    <Hourglass className="h-3 w-3" /> Pendente
                                </Badge>
                            )}

                            <Badge variant="secondary" className={cn("border", periodColors[item.periodo])}>{item.periodo}</Badge>
                            {item.groupId && !isChild && <Badge variant="outline" className="gap-1 bg-violet-50 text-violet-700 border-violet-200"><Layers className="h-3 w-3" /> Série</Badge>}
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-y-2 gap-x-4 mt-1">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-y-1 gap-x-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 font-medium text-base">
                                    <FlaskConical className="h-4 w-4" />
                                    {getLabName(item.labId)}
                                </span>
                                {item.disciplina && (
                                    <span className="flex items-center gap-1.5 text-xs sm:text-sm">
                                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0 hidden sm:block" />
                                        {renderSmartText(item.disciplina, 60, "Disciplina")}
                                    </span>
                                )}
                            </div>

                            {/* BOTÃO ALINHADO À DIREITA NA MESMA LINHA */}
                            {canReport && (
                                <Button 
                                    onClick={() => handleOpenReport(item, false)}
                                    className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm h-8 px-3 text-xs font-bold uppercase tracking-wide self-start sm:self-center ml-auto"
                                    size="sm"
                                >
                                    <ClipboardList className="mr-2 h-3.5 w-3.5" />
                                    Conferência
                                </Button>
                            )}
                        </div>

                        <div className="mt-1 text-sm bg-zinc-50 dark:bg-zinc-900 text-zinc-600 p-2 rounded-md border border-zinc-100 flex gap-2 items-start">
                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                            <span className="break-all line-clamp-2">
                                {item.observacao ? renderSmartText(item.observacao, 140, "Observação") : <span className="text-muted-foreground/60 italic">Nenhuma observação geral.</span>}
                            </span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
     )
  }

  // --- RENDER ---
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#F8F9FA] dark:bg-zinc-950">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" /><Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb><BreadcrumbList><BreadcrumbItem><BreadcrumbLink >Agendamento</BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>Minha Agenda</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col p-4 md:p-8 max-w-6xl mx-auto w-full gap-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div><h1 className="text-2xl font-bold tracking-tight">Meus Agendamentos</h1><p className="text-muted-foreground">Histórico completo de solicitações.</p></div>
            {currentUser && <Badge variant="outline" className="px-3 py-1 text-sm bg-background flex items-center gap-2"><User className="h-3 w-3"/> {currentUser.nome}</Badge>}
          </div>

          {/* FILTROS - TUDO NA MESMA LINHA */}
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row gap-3 flex-wrap items-center">
                  
                  {/* PESQUISA */}
                  <div className="relative w-full md:flex-1 min-w-[200px]">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Pesquisar..." className="pl-9 bg-zinc-50 dark:bg-zinc-950 h-9" value={searchText} onChange={(e) => setSearchText(e.target.value)} />
                  </div>

                  {/* TIPO */}
                  <Select value={filterType} onValueChange={(val:any) => setFilterType(val)}>
                      <SelectTrigger className="w-full md:w-[130px] bg-zinc-50 h-9 px-3">
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
                            <SelectValue placeholder="Tipo" />
                          </div>
                      </SelectTrigger>
                      <SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="single">Únicos</SelectItem><SelectItem value="series">Séries</SelectItem></SelectContent>
                  </Select>

                  {/* LABORATÓRIO */}
                  <Select value={filterLab} onValueChange={setFilterLab}>
                      <SelectTrigger className="w-full md:w-[160px] bg-zinc-50 h-9 px-3">
                          <div className="flex items-center gap-2">
                            <FlaskConical className="h-4 w-4 text-muted-foreground shrink-0" />
                            <SelectValue placeholder="Laboratório" />
                          </div>
                      </SelectTrigger>
                      <SelectContent><SelectItem value="all">Todos</SelectItem>{laboratorios.map(lab => (<SelectItem key={lab.id} value={String(lab.id)}>{lab.nome}</SelectItem>))}</SelectContent>
                  </Select>

                  {/* TURNO */}
                  <Select value={filterTurno} onValueChange={setFilterTurno}>
                      <SelectTrigger className="w-full md:w-[130px] bg-zinc-50 h-9 px-3">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                            <SelectValue placeholder="Turno" />
                          </div>
                      </SelectTrigger>
                      <SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="Manhã">Manhã</SelectItem><SelectItem value="Tarde">Tarde</SelectItem><SelectItem value="Noite">Noite</SelectItem></SelectContent>
                  </Select>

                  {/* STATUS */}
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full md:w-[140px] bg-zinc-50 h-9 px-3">
                        <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-muted-foreground shrink-0" />
                            <SelectValue placeholder="Status" />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="confirmado">Aprovado</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="concluido">Concluído</SelectItem>
                    </SelectContent>
                 </Select>

                  {/* DATA */}
                  <Popover>
                      <PopoverTrigger asChild>
                          <Button variant={"outline"} className={cn("w-full md:w-[140px] justify-start bg-zinc-50 h-9 px-3 font-normal", !filterDate && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                              <span className="truncate">{filterDate ? format(filterDate, "dd/MM/yyyy") : "Todos"}</span>
                          </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={filterDate} onSelect={setFilterDate} initialFocus locale={ptBR} /></PopoverContent>
                  </Popover>
              </div>
          </div>

          {/* LISTA */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="text-muted-foreground">Carregando...</p></div>
          ) : organizedList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4 border-2 border-dashed rounded-xl"><div className="bg-zinc-100 p-4 rounded-full"><CalendarDays className="h-10 w-10 text-muted-foreground" /></div><div className="text-center"><h3 className="text-lg font-semibold">Nada encontrado</h3><Button variant="link" onClick={handleResetFilters}>Limpar filtros</Button></div></div>
          ) : (
            <div className="space-y-4">
              {organizedList.map((entry) => {
                if (entry.type === 'single') return <AgendamentoCard key={entry.data.id} item={entry.data} />
                const isExpanded = expandedGroups.includes(entry.id);
                const isHistory = entry.isHistory;
                const canReportSeries = entry.primaryStatus === 'confirmado';
                return (
                    <div key={entry.id} className={cn("rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm transition-all", isHistory ? "bg-zinc-50/40 opacity-80" : "bg-zinc-50/50")}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 hover:bg-zinc-100 transition-colors cursor-pointer" onClick={() => toggleGroup(entry.id)}>
                            <div className="flex items-center gap-4 flex-1 cursor-pointer">
                                <div className={cn("p-2.5 rounded-lg hidden sm:block", isHistory ? "bg-zinc-100 text-zinc-500" : "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400")}>
                                    <ListFilter className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className={cn("font-semibold text-lg", isHistory && "text-muted-foreground")}>Agendamento em Série</h3>
                                        {entry.primaryStatus === 'concluido' ? (
                                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 gap-1"><Check className="h-3 w-3"/> Concluído</Badge>
                                        ) : entry.primaryStatus === 'confirmado' ? (
                                            <Badge className="bg-emerald-600 hover:bg-emerald-700">Aprovado</Badge>
                                        ) : (
                                            <Badge className="bg-orange-500 hover:bg-orange-600">Pendente</Badge>
                                        )}
                                        <Badge variant="secondary" className={cn("border", periodColors[entry.items[0].periodo])}>{entry.items[0].periodo}</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                                        <CalendarIcon className="h-3.5 w-3.5 mr-2"/> {format(new Date(entry.items[0].ano, entry.items[0].mes, entry.items[0].dia), "dd/MM")} à {format(new Date(entry.items[entry.items.length-1].ano, entry.items[entry.items.length-1].mes, entry.items[entry.items.length-1].dia), "dd/MM")}
                                        <span className="mx-1">•</span> <FlaskConical className="h-3.5 w-3.5"/> {getLabName(entry.items[0].labId)}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3 self-end sm:self-center">
                                {canReportSeries && (
                                    <Button onClick={(e) => { e.stopPropagation(); handleOpenReport(entry, true); }} className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm h-8 px-3 text-xs font-bold uppercase tracking-wide ml-auto sm:self-center">
                                        <ClipboardList className="mr-2 h-3.5 w-3.5" /> Conferir Série
                                    </Button>
                                )}
                            </div>
                        </div>
                        {isExpanded && <div className="p-4 pt-0 border-t">{entry.items.map(sub => <AgendamentoCard key={sub.id} item={sub} isChild />)}</div>}
                    </div>
                )
              })}
            </div>
          )}
        </div>

        <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
            <DialogContent className="max-w-3xl max-h-[95vh] h-auto p-0 flex flex-col bg-white dark:bg-zinc-950 overflow-hidden gap-0 [&>button]:hidden">
                <div className="sr-only"><DialogTitle>Conferência</DialogTitle><DialogDescription>Checklist de equipamentos</DialogDescription></div>
                <div className="flex-1 flex flex-col overflow-hidden w-full p-0">
                    {reportLoading ? (
                        <div className="flex flex-col items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="mt-2 text-muted-foreground">Carregando...</span></div>
                    ) : reportData ? (
                        <ChecklistForm 
                            equipamentos={reportData.equipamentos} 
                            dadosAgendamento={reportData.dadosAgendamento}
                            onSubmit={handleSubmitReport}
                            onClose={() => setIsReportOpen(false)} 
                            isSubmitting={false}
                        />
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>

        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  )
}