"use client"

import * as React from "react"
import { 
  User, 
  FlaskConical, 
  Loader2, 
  Layers, 
  AlertCircle,
  CheckCircle2,
  Inbox,
  CalendarDays,
  Search,
  FilterX,
  History,
  Hourglass,
  ListFilter,
  ChevronUp,
  ChevronDown,
  Calendar as CalendarIcon
} from "lucide-react"

import { auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { getDadosUsuarioSidebar } from "@/app/actions/auth"
import { getAgendamentosAction, getSalasAction } from "@/app/actions/agendamentos"

import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Toaster } from "@/components/ui/sonner" 
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
  status: "confirmado" | "pendente"
  docente: string
  disciplina: string
  labId?: number
  groupId?: string
  observacao?: string
}

interface Sala {
  id: number
  nome: string
}

interface Usuario {
  nome: string
  email: string
}

// Tipo para a lista unificada
type GroupedItem = 
  | { type: 'single', data: Agendamento, isHistory: boolean }
  | { type: 'group', id: string, items: Agendamento[], isHistory: boolean, primaryStatus: 'confirmado' | 'pendente' }

export default function MeusAgendamentosPage() {
  const [currentUser, setCurrentUser] = React.useState<Usuario | null>(null)
  const [agendamentos, setAgendamentos] = React.useState<Agendamento[]>([])
  const [laboratorios, setLaboratorios] = React.useState<Sala[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  
  // --- FILTROS ---
  const [searchText, setSearchText] = React.useState("")
  const [filterType, setFilterType] = React.useState<"all" | "single" | "series">("all")
  const [filterLab, setFilterLab] = React.useState<string>("all")
  const [filterTurno, setFilterTurno] = React.useState<string>("all")
  const [filterDate, setFilterDate] = React.useState<Date | undefined>(undefined)

  // Estado para expandir/recolher grupos
  const [expandedGroups, setExpandedGroups] = React.useState<string[]>([])

  // --- 1. AUTENTICAÇÃO ---
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const infoBanco = await getDadosUsuarioSidebar(user.uid)
          if (infoBanco) {
            setCurrentUser({
              nome: infoBanco.nomeUsuario,
              email: user.email || ""
            })
          }
        } catch (error) {
          console.error("Erro auth:", error)
        }
      }
    })
    return () => unsubscribe()
  }, [])

  // --- 2. BUSCA DADOS ---
  const fetchData = React.useCallback(async () => {
    if (!currentUser) return 

    setIsLoading(true)
    try {
      const [dadosAgendamentos, dadosSalas] = await Promise.all([
        getAgendamentosAction(),
        getSalasAction()
      ])
      
      const meusAgendamentos = (dadosAgendamentos as unknown as Agendamento[])
        .filter(a => a.docente === currentUser.nome)

      setAgendamentos(meusAgendamentos)
      setLaboratorios(dadosSalas)
    } catch (error) {
      console.error(error)
      toast.error("Erro ao carregar sua agenda.")
    } finally {
      setIsLoading(false)
    }
  }, [currentUser])

  React.useEffect(() => {
    if (currentUser) {
        fetchData()
    }
  }, [currentUser, fetchData])

  const getLabName = React.useCallback((id?: number) => {
    if (!id) return "Não definido"
    return laboratorios.find(l => l.id === id)?.nome || `Lab ${id}`
  }, [laboratorios])

  // --- 3. LÓGICA DE FILTRAGEM, AGRUPAMENTO E ORDENAÇÃO ---
  const organizedList = React.useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);

    // A. Filtragem
    const filtered = agendamentos.filter(item => {
        const searchLower = searchText.toLowerCase()
        const labName = getLabName(item.labId).toLowerCase()
        const matchSearch = 
            item.disciplina?.toLowerCase().includes(searchLower) ||
            item.observacao?.toLowerCase().includes(searchLower) ||
            labName.includes(searchLower)

        if (!matchSearch) return false
        
        // Filtro de Tipo
        if (filterType === "single" && item.groupId) return false
        if (filterType === "series" && !item.groupId) return false

        if (filterLab !== "all" && String(item.labId) !== filterLab) return false
        if (filterTurno !== "all" && item.periodo !== filterTurno) return false
        if (filterDate) {
            if (
                item.dia !== filterDate.getDate() ||
                item.mes !== filterDate.getMonth() ||
                item.ano !== filterDate.getFullYear()
            ) return false
        }
        return true
    })

    // B. Agrupamento
    const groups: Record<string, Agendamento[]> = {}
    const result: GroupedItem[] = []
    const processedGroupIds = new Set<string>()

    filtered.forEach(item => {
        if (item.groupId) {
            if (!groups[item.groupId]) groups[item.groupId] = []
            groups[item.groupId].push(item)
        }
    })

    // C. Construção da Lista GroupedItem
    filtered.forEach(item => {
        const itemDate = new Date(item.ano, item.mes, item.dia)
        const isItemPast = itemDate < today

        if (item.groupId) {
            if (!processedGroupIds.has(item.groupId)) {
                const groupItems = groups[item.groupId]
                
                // ORDENAR OS ITENS DENTRO DO GRUPO CRONOLOGICAMENTE
                groupItems.sort((a, b) => {
                    const dateA = new Date(a.ano, a.mes, a.dia).getTime()
                    const dateB = new Date(b.ano, b.mes, b.dia).getTime()
                    return dateA - dateB
                })

                // Analisa o grupo para determinar status dominante
                const hasFuture = groupItems.some(i => new Date(i.ano, i.mes, i.dia) >= today)
                const isGroupHistory = !hasFuture // Grupo é histórico se TODOS forem passados
                
                // Status principal
                const hasConfirmedFuture = groupItems.some(i => i.status === 'confirmado' && new Date(i.ano, i.mes, i.dia) >= today)
                const primaryStatus = hasConfirmedFuture ? 'confirmado' : 'pendente'

                result.push({ 
                    type: 'group', 
                    id: item.groupId, 
                    items: groupItems,
                    isHistory: isGroupHistory,
                    primaryStatus: primaryStatus
                })
                processedGroupIds.add(item.groupId)
            }
        } else {
            result.push({ 
                type: 'single', 
                data: item, 
                isHistory: isItemPast 
            })
        }
    })

    // D. Ordenação Final
    return result.sort((a, b) => {
        // 1. ATIVOS vs HISTÓRICO (Ativos Primeiro)
        if (a.isHistory !== b.isHistory) {
            return a.isHistory ? 1 : -1 
        }

        // 2. TIPO (Single Primeiro, Series Depois)
        if (a.type !== b.type) {
            return a.type === 'single' ? -1 : 1
        }

        // 3. STATUS (Confirmado < Pendente)
        const getStatusScore = (item: GroupedItem) => {
            if (item.type === 'single') return item.data.status === 'confirmado' ? 1 : 2
            return item.primaryStatus === 'confirmado' ? 1 : 2
        }
        const scoreA = getStatusScore(a)
        const scoreB = getStatusScore(b)
        
        if (scoreA !== scoreB) return scoreA - scoreB

        // 4. DATA (Cronológica)
        const getDate = (item: GroupedItem) => {
            if (item.type === 'single') return new Date(item.data.ano, item.data.mes, item.data.dia).getTime()
            return new Date(item.items[0].ano, item.items[0].mes, item.items[0].dia).getTime()
        }
        const dateA = getDate(a)
        const dateB = getDate(b)

        // Se for histórico, ordena do mais recente pro mais antigo. Se futuro, o contrário.
        if (a.isHistory) return dateB - dateA
        return dateA - dateB
    })

  }, [agendamentos, searchText, filterType, filterLab, filterTurno, filterDate, getLabName])

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId) 
        : [...prev, groupId]
    )
  }

  const handleResetFilters = () => {
    setSearchText("")
    setFilterType("all")
    setFilterLab("all")
    setFilterTurno("all")
    setFilterDate(undefined)
  }

  const periodColors = {
    Manhã: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
    Tarde: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
    Noite: "bg-zinc-800 text-zinc-100 border-zinc-700 dark:bg-zinc-700 dark:text-zinc-100",
  }

  // --- COMPONENTES INTERNOS ---

  const AgendamentoCard = ({ item, isChild = false }: { item: Agendamento, isChild?: boolean }) => {
     const today = new Date();
     today.setHours(0,0,0,0);
     const itemDate = new Date(item.ano, item.mes, item.dia)
     const isPast = itemDate < today;

     return (
        <Card 
            className={cn(
                "overflow-hidden border shadow-sm transition-all", 
                isChild ? "border-l-4 border-l-violet-500 ml-6 mb-3" : "hover:shadow-md",
                isPast && !isChild 
                    ? "bg-zinc-50/40 dark:bg-zinc-900/20 border-zinc-200 dark:border-zinc-800 opacity-80 hover:opacity-100 grayscale-[0.3]" 
                    : "border-zinc-200 dark:border-zinc-800"
            )}
        >
            <CardContent className="p-0 flex flex-col sm:flex-row">
                
                {/* DATA */}
                <div className={cn(
                    "flex flex-col items-center justify-center p-4 min-w-[120px] border-b sm:border-b-0 sm:border-r border-zinc-100 dark:border-zinc-800",
                    (isPast || isChild) ? "bg-zinc-100/50 dark:bg-zinc-950/50" : "bg-zinc-50 dark:bg-zinc-900"
                )}>
                    <span className={cn("text-3xl font-bold", isPast ? "text-zinc-500" : "text-primary")}>{item.dia}</span>
                    <span className="text-sm font-medium uppercase text-muted-foreground">
                        {format(itemDate, 'MMM', { locale: ptBR })}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">{item.ano}</span>
                </div>

                {/* INFO */}
                <div className="flex-1 p-4 flex flex-col justify-center gap-2">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        
                        {/* STATUS BADGE */}
                        {isPast ? (
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

                        <Badge variant="secondary" className={cn("border", periodColors[item.periodo])}>
                            {item.periodo}
                        </Badge>
                        
                        {item.groupId && !isChild && (
                            <Badge variant="outline" className="gap-1 bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-800">
                                <Layers className="h-3 w-3" /> Série
                            </Badge>
                        )}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-y-1 gap-x-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 font-medium">
                            <FlaskConical className="h-3.5 w-3.5" />
                            {getLabName(item.labId)}
                        </span>
                        {item.disciplina && (
                            <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                                {item.disciplina}
                            </span>
                        )}
                    </div>

                    {item.observacao && (
                        <div className="mt-2 text-sm bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 p-2 rounded-md border border-zinc-100 dark:border-zinc-800 flex gap-2 items-start">
                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                            <span>{item.observacao}</span>
                        </div>
                    )}
                </div>

                {/* DIREITA: STATUS TEXTUAL SE FOR PASSADO */}
                {isPast && (
                    <div className="p-4 flex items-center justify-center border-t sm:border-t-0 sm:border-l border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20 min-w-[140px]">
                        <div className="flex flex-col items-center gap-1 text-sm text-muted-foreground">
                            <span>Status original:</span>
                            <span className={cn(
                                "font-semibold capitalize",
                                item.status === 'confirmado' ? "text-emerald-600" : "text-orange-500"
                            )}>
                                {item.status}
                            </span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
     )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#F8F9FA] dark:bg-zinc-950">
        
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Minha Agenda</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col p-4 md:p-8 max-w-6xl mx-auto w-full gap-6">
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Meus Agendamentos</h1>
              <p className="text-muted-foreground">Histórico completo de suas solicitações e reservas.</p>
            </div>
            {currentUser && (
                 <Badge variant="outline" className="px-3 py-1 text-sm bg-background flex items-center gap-2">
                    <User className="h-3 w-3"/> {currentUser.nome}
                 </Badge>
            )}
          </div>

          {/* BARRA DE FILTROS */}
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                  
                  <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Pesquisar disciplina, observação..." 
                        className="pl-9 bg-zinc-50 dark:bg-zinc-950"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                      />
                  </div>

                  <Select value={filterType} onValueChange={(val: any) => setFilterType(val)}>
                    <SelectTrigger className="w-full md:w-[160px] bg-zinc-50 dark:bg-zinc-950">
                        <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os tipos</SelectItem>
                        <SelectItem value="single">Apenas Únicos</SelectItem>
                        <SelectItem value="series">Apenas Séries</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterLab} onValueChange={setFilterLab}>
                    <SelectTrigger className="w-full md:w-[180px] bg-zinc-50 dark:bg-zinc-950">
                        <SelectValue placeholder="Laboratório" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos Laboratórios</SelectItem>
                        {laboratorios.map(lab => (
                            <SelectItem key={lab.id} value={String(lab.id)}>{lab.nome}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                   <Select value={filterTurno} onValueChange={setFilterTurno}>
                    <SelectTrigger className="w-full md:w-[140px] bg-zinc-50 dark:bg-zinc-950">
                        <SelectValue placeholder="Turno" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos Turnos</SelectItem>
                        <SelectItem value="Manhã">Manhã</SelectItem>
                        <SelectItem value="Tarde">Tarde</SelectItem>
                        <SelectItem value="Noite">Noite</SelectItem>
                    </SelectContent>
                  </Select>

                  <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "w-full md:w-[180px] justify-start text-left font-normal bg-zinc-50 dark:bg-zinc-950",
                                !filterDate && "text-muted-foreground"
                            )}
                        >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filterDate ? format(filterDate, "dd/MM/yyyy") : <span>Data específica</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={filterDate}
                            onSelect={setFilterDate}
                            initialFocus
                            locale={ptBR}
                        />
                    </PopoverContent>
                   </Popover>

                  {(searchText || filterType !== 'all' || filterLab !== 'all' || filterTurno !== 'all' || filterDate) && (
                      <Button variant="ghost" size="icon" onClick={handleResetFilters} title="Limpar filtros">
                          <FilterX className="h-4 w-4 text-red-500" />
                      </Button>
                  )}
              </div>
          </div>

          {/* LISTA */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground animate-pulse">Carregando sua agenda...</p>
            </div>
          ) : organizedList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4 border-2 border-dashed rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50">
              <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-full">
                <CalendarDays className="h-10 w-10 text-muted-foreground" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold">Nenhum agendamento encontrado</h3>
                <p className="text-muted-foreground text-sm">Você ainda não possui agendamentos com estes critérios.</p>
                <Button variant="link" onClick={handleResetFilters} className="mt-2">Limpar filtros</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {organizedList.map((entry) => {
                
                // RENDERIZAÇÃO: ITEM ÚNICO
                if (entry.type === 'single') {
                    return <AgendamentoCard key={entry.data.id} item={entry.data} />
                }

                // RENDERIZAÇÃO: GRUPO (SÉRIE)
                const isExpanded = expandedGroups.includes(entry.id);
                const firstItem = entry.items[0];
                const lastItem = entry.items[entry.items.length - 1];
                const count = entry.items.length;
                const isHistoryGroup = entry.isHistory;

                const firstDate = new Date(firstItem.ano, firstItem.mes, firstItem.dia);
                const lastDate = new Date(lastItem.ano, lastItem.mes, lastItem.dia);

                return (
                    <div 
                        key={entry.id} 
                        className={cn(
                            "rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm transition-all",
                            isHistoryGroup 
                                ? "bg-zinc-50/40 dark:bg-zinc-900/20 border-zinc-200 dark:border-zinc-800 opacity-80 hover:opacity-100 grayscale-[0.3]" 
                                : "bg-zinc-50/50 dark:bg-zinc-900/20"
                        )}
                    >
                        {/* CABEÇALHO DO GRUPO */}
                        <div 
                            onClick={() => toggleGroup(entry.id)}
                            className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "p-2.5 rounded-lg hidden sm:block",
                                    isHistoryGroup 
                                        ? "bg-zinc-100 text-zinc-500" 
                                        : "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
                                )}>
                                    <ListFilter className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className={cn("font-semibold text-lg", isHistoryGroup && "text-muted-foreground")}>
                                            Agendamento em Série
                                        </h3>
                                        
                                        {/* 1. STATUS BADGE */}
                                        {isHistoryGroup ? (
                                            <Badge variant="outline" className="bg-zinc-100 text-zinc-500 border-zinc-200 gap-1">
                                                <History className="h-3 w-3"/> Finalizado
                                            </Badge>
                                        ) : entry.primaryStatus === 'confirmado' ? (
                                            <Badge className="bg-emerald-600 hover:bg-emerald-700">Aprovado</Badge>
                                        ) : (
                                            <Badge className="bg-orange-500 hover:bg-orange-600">Pendente</Badge>
                                        )}

                                        {/* 2. PERIODO BADGE */}
                                        <Badge variant="secondary" className={cn("border", periodColors[firstItem.periodo])}>
                                            {firstItem.periodo}
                                        </Badge>
                                    </div>

                                    {/* LINHA INFERIOR COM DETALHES */}
                                    <p className="text-sm text-muted-foreground flex flex-wrap items-center gap-2 mt-1">
                                        {/* DATA COM ICONE (CORRIGIDO PARA CINZA) */}
                                        <span className="flex items-center gap-1.5">
                                            <CalendarIcon className="h-3.5 w-3.5" />
                                            {firstDate.getTime() === lastDate.getTime() 
                                                ? format(firstDate, "d 'de' MMMM", { locale: ptBR })
                                                : `${format(firstDate, "d 'de' MMMM", { locale: ptBR })} até ${format(lastDate, "d 'de' MMMM", { locale: ptBR })}`
                                            }
                                        </span>

                                        <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600 hidden sm:block" />

                                        <span className="flex items-center gap-1.5">
                                            <Layers className="h-3.5 w-3.5" /> {count} dias
                                        </span>

                                        <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600 hidden sm:block" />

                                        <span className="flex items-center gap-1.5">
                                            <FlaskConical className="h-3.5 w-3.5" /> {getLabName(firstItem.labId)}
                                        </span>
                                    </p>
                                </div>
                            </div>
                            
                            <Button variant="ghost" size="icon" className="text-muted-foreground">
                                {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                            </Button>
                        </div>

                        {/* LISTA DE FILHOS */}
                        {isExpanded && (
                            <div className="p-4 pt-0 border-t border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-top-2 fade-in duration-200">
                                <div className="py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider pl-6 mb-2 mt-2">
                                    Detalhes dos dias:
                                </div>
                                {entry.items.map(subItem => (
                                    <AgendamentoCard key={subItem.id} item={subItem} isChild />
                                ))}
                                <div className="flex justify-center pb-2">
                                    <Button 
                                        variant="link" 
                                        size="sm" 
                                        className="text-muted-foreground"
                                        onClick={() => toggleGroup(entry.id)}
                                    >
                                        <ChevronUp className="h-3 w-3 mr-1"/> Recolher série
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )
              })}
            </div>
          )}
        </div>
        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  )
}