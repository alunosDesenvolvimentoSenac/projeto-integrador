"use client"

import * as React from "react"
import { 
  Check, 
  X, 
  User, 
  FlaskConical, 
  Loader2, 
  Layers, 
  AlertCircle,
  CheckCircle2,
  Inbox,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  ListFilter,
  Search,
  FilterX,
  Calendar as CalendarIcon,
  Clock 
} from "lucide-react"

import { 
  getAgendamentosAction, 
  approveAgendamentoAction, 
  approveSerieAction, 
  deleteAgendamentoAction, 
  deleteSerieAction,
  getSalasAction 
} from "@/app/actions/agendamentos"

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
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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

type GroupedItem = 
  | { type: 'single', data: Agendamento }
  | { type: 'group', id: string, items: Agendamento[] }

export default function SolicitacoesPage() {
  const [agendamentos, setAgendamentos] = React.useState<Agendamento[]>([])
  const [laboratorios, setLaboratorios] = React.useState<Sala[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  
  const [searchText, setSearchText] = React.useState("")
  const [filterType, setFilterType] = React.useState<"all" | "single" | "series">("all")
  const [filterLab, setFilterLab] = React.useState<string>("all")
  const [filterTurno, setFilterTurno] = React.useState<string>("all")
  const [filterDate, setFilterDate] = React.useState<Date | undefined>(undefined)

  const [expandedGroups, setExpandedGroups] = React.useState<string[]>([])
  
  const [actionData, setActionData] = React.useState<{
    isOpen: boolean
    type: 'approve' | 'reject'
    item: Agendamento | null
  }>({
    isOpen: false,
    type: 'approve',
    item: null
  })

  const fetchData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const [dadosAgendamentos, dadosSalas] = await Promise.all([
        getAgendamentosAction(),
        getSalasAction()
      ])
      
      const pendentes = (dadosAgendamentos as unknown as Agendamento[])
        .filter(a => a.status === 'pendente')
        .sort((a, b) => {
            const dateA = new Date(a.ano, a.mes, a.dia).getTime()
            const dateB = new Date(b.ano, b.mes, b.dia).getTime()
            return dateA - dateB
        })

      setAgendamentos(pendentes)
      setLaboratorios(dadosSalas)
    } catch (error) {
      console.error(error)
      toast.error("Erro ao carregar solicitações.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const getLabName = React.useCallback((id?: number) => {
    if (!id) return "Não definido"
    return laboratorios.find(l => l.id === id)?.nome || `Lab ${id}`
  }, [laboratorios])

  const periodColors = {
    Manhã: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    Tarde: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    Noite: "bg-zinc-800 text-zinc-100 dark:bg-zinc-700 dark:text-zinc-100 border-zinc-700",
  }

  const organizedList = React.useMemo(() => {
    const filtered = agendamentos.filter(item => {
        const searchLower = searchText.toLowerCase()
        const labName = getLabName(item.labId).toLowerCase()
        const matchSearch = 
            item.docente.toLowerCase().includes(searchLower) ||
            item.disciplina?.toLowerCase().includes(searchLower) ||
            item.observacao?.toLowerCase().includes(searchLower) ||
            labName.includes(searchLower)

        if (!matchSearch) return false
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

    const groups: Record<string, Agendamento[]> = {}
    const result: GroupedItem[] = []
    const processedGroupIds = new Set<string>()

    filtered.forEach(item => {
        if (item.groupId) {
            if (!groups[item.groupId]) groups[item.groupId] = []
            groups[item.groupId].push(item)
        }
    })

    filtered.forEach(item => {
        if (item.groupId) {
            if (!processedGroupIds.has(item.groupId)) {
                
                const rawGroupItems = groups[item.groupId];
                const groupItemsWithoutWeekends = rawGroupItems.filter(gItem => {
                     const dateObj = new Date(gItem.ano, gItem.mes, gItem.dia);
                     const dayOfWeek = dateObj.getDay();
                     return dayOfWeek !== 0 && dayOfWeek !== 6;
                });

                if (groupItemsWithoutWeekends.length > 0) {
                    const sortedGroupItems = groupItemsWithoutWeekends.sort((a, b) => {
                        const dateA = new Date(a.ano, a.mes, a.dia).getTime()
                        const dateB = new Date(b.ano, b.mes, b.dia).getTime()
                        return dateA - dateB
                    })

                    result.push({ 
                        type: 'group', 
                        id: item.groupId, 
                        items: sortedGroupItems 
                    })
                }
                
                processedGroupIds.add(item.groupId)
            }
        } else {
            result.push({ type: 'single', data: item })
        }
    })

    return result.sort((a, b) => {
        if (a.type === 'single' && b.type === 'group') return -1
        if (a.type === 'group' && b.type === 'single') return 1
        return 0
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

  const handleActionClick = (type: 'approve' | 'reject', item: Agendamento) => {
    setActionData({ isOpen: true, type, item })
  }

  const executeAction = async (type: 'approve' | 'reject', id: number | string, isSeries: boolean) => {
    try {
      if (type === 'approve') {
        if (isSeries) {
            await approveSerieAction(String(id))
            toast.success("Série aprovada com sucesso!")
        } else {
            await approveAgendamentoAction(Number(id))
            toast.success("Agendamento aprovado!")
        }
      } else {
        if (isSeries) {
            const currentStatus = actionData.item?.status || 'pendente';
            await deleteSerieAction(String(id), currentStatus)
            toast.success(`Série ${currentStatus} recusada/removida!`)
        } else {
            await deleteAgendamentoAction(Number(id))
            toast.success("Agendamento recusado!")
        }
      }
      setActionData({ ...actionData, isOpen: false })
      fetchData() 
    } catch (error) {
      console.error(error)
      toast.error("Erro ao processar solicitação.")
    }
  }

  const AgendamentoCard = ({ item, isChild = false }: { item: Agendamento, isChild?: boolean }) => {
     const itemDate = new Date(item.ano, item.mes, item.dia)
     
     const renderSmartText = (text: string | undefined, limit: number) => {
        if (!text) return null;
        
        const isTruncated = text.length > limit;
        const truncatedText = text.substring(0, limit) + "...";

        if (!isTruncated) {
            return <span>{text}</span>
        }

        return (
            <Popover>
                <PopoverTrigger asChild>
                    <span className="cursor-pointer hover:text-primary hover:underline underline-offset-2 break-all transition-colors">
                        {truncatedText}
                    </span>
                </PopoverTrigger>
                <PopoverContent className="w-auto max-w-[300px] p-3 text-sm break-words shadow-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Observação Completa</p>
                    <p className="text-zinc-900 dark:text-zinc-100">{text}</p>
                </PopoverContent>
            </Popover>
        )
     }
     
     return (
        <Card className={cn(
            "overflow-hidden border shadow-sm transition-all", 
            isChild ? "border-l-4 border-l-violet-500 ml-6 mb-3" : "hover:shadow-md"
        )}>
            <CardContent className="p-0 flex flex-col sm:flex-row">
                <div className={cn(
                    "flex flex-col items-center justify-center p-4 min-w-[120px] border-b sm:border-b-0 sm:border-r border-zinc-100 dark:border-zinc-800",
                    isChild ? "bg-white dark:bg-zinc-950" : "bg-zinc-50 dark:bg-zinc-900"
                )}>
                    <span className="text-3xl font-medium text-muted-foreground">{item.dia}</span>
                    <span className="text-sm font-medium uppercase text-muted-foreground">
                        {format(itemDate, 'MMM', { locale: ptBR })}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">{item.ano}</span>
                </div>

                <div className="flex-1 p-4 flex flex-col justify-center gap-2">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Badge variant="secondary" className={cn("border", periodColors[item.periodo])}>
                            {item.periodo}
                        </Badge>
                        {item.groupId && !isChild && (
                             <Badge variant="outline" className="gap-1 bg-violet-50 text-violet-700 border-violet-200">
                                <Layers className="h-3 w-3" /> Série
                             </Badge>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold text-lg">{item.docente}</span>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-y-1 gap-x-4 text-sm text-muted-foreground">
                        {item.disciplina && (
                            <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                                {item.disciplina}
                            </span>
                        )}
                        <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                            <FlaskConical className="h-3.5 w-3.5" />
                            {getLabName(item.labId)}
                        </span>
                    </div>

                    {item.observacao && (
                        <div className="mt-2 text-sm bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 p-2 rounded-md border border-amber-100 dark:border-amber-900/50 flex gap-2 items-start">
                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                            <span className="break-all">{renderSmartText(item.observacao, 100)}</span>
                        </div>
                    )}
                </div>

                <div className={cn(
                    "p-4 flex sm:flex-col items-center justify-center gap-2 border-t sm:border-t-0 sm:border-l border-zinc-100 dark:border-zinc-800",
                    isChild ? "bg-white dark:bg-zinc-950" : "bg-zinc-50/50 dark:bg-zinc-900/20"
                )}>
                    <Button 
                        size="sm"
                        className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => handleActionClick('approve', item)}
                    >
                        <Check className="h-4 w-4 mr-2" /> Aprovar
                    </Button>
                    <Button 
                        size="sm"
                        variant="destructive" 
                        className="w-full sm:w-auto bg-white text-red-600 border border-red-200 hover:bg-red-50 dark:bg-zinc-950 dark:border-red-900 dark:text-red-400"
                        onClick={() => handleActionClick('reject', item)}
                    >
                        <X className="h-4 w-4 mr-2" /> Recusar
                    </Button>
                </div>
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
                  <BreadcrumbPage>Solicitações Pendentes</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col p-4 md:p-8 max-w-6xl mx-auto w-full gap-6">
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Solicitações de Reserva</h1>
              <p className="text-muted-foreground">Gerencie os pedidos pendentes de aprovação.</p>
            </div>
            <Badge variant="secondary" className="px-3 py-1 text-sm">
              Total Pendente: {agendamentos.length}
            </Badge>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Pesquisar docente, laboratório..." 
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

          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground animate-pulse">Buscando pendências...</p>
            </div>
          ) : organizedList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4 border-2 border-dashed rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50">
              <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-full">
                <Inbox className="h-10 w-10 text-muted-foreground" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold">Nenhum item encontrado</h3>
                <p className="text-muted-foreground text-sm">Não há solicitações correspondentes aos filtros.</p>
                <Button variant="link" onClick={handleResetFilters} className="mt-2">Limpar filtros</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {organizedList.map((entry, index) => {
                
                if (entry.type === 'single') {
                    return <AgendamentoCard key={entry.data.id} item={entry.data} />
                }

                const isExpanded = expandedGroups.includes(entry.id);
                const firstItem = entry.items[0]; 
                const lastItem = entry.items[entry.items.length - 1];
                const count = entry.items.length;

                const firstDate = new Date(firstItem.ano, firstItem.mes, firstItem.dia);
                const lastDate = new Date(lastItem.ano, lastItem.mes, lastItem.dia);

                const isConfirmed = entry.items.some(i => i.status === 'confirmado');

                return (
                    <div key={entry.id} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20 overflow-hidden shadow-sm">
                        <div 
                            onClick={() => toggleGroup(entry.id)}
                            className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="bg-zinc-100 dark:bg-zinc-800 p-2.5 rounded-lg text-muted-foreground hidden sm:block">
                                    <ListFilter className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="font-semibold text-lg text-zinc-600 dark:text-zinc-400">Solicitação em Série</h3>
                                        
                                        <Badge variant="secondary" className={cn("border", periodColors[firstItem.periodo])}>
                                            {firstItem.periodo}
                                        </Badge>
                                    </div>

                                    <p className="text-sm text-muted-foreground flex flex-wrap items-center gap-2 mt-1">
                                            <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
                                                <CalendarIcon className="h-3.5 w-3.5" />
                                                {firstDate.getTime() === lastDate.getTime() 
                                                    ? format(firstDate, "d 'de' MMMM", { locale: ptBR })
                                                    : `${format(firstDate, "d 'de' MMMM", { locale: ptBR })} até ${format(lastDate, "d 'de' MMMM", { locale: ptBR })}`
                                                }
                                                <span className="text-zinc-300 dark:text-zinc-700 mx-1">•</span>
                                                
                                                <span className="flex items-center gap-1.5 text-muted-foreground">
                                                    <Layers className="h-3.5 w-3.5" />
                                                    {count} dias
                                                </span>
                                            </span>

                                            <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600 hidden sm:block" />

                                            <span className="flex items-center gap-1.5 text-muted-foreground">
                                                <User className="h-3.5 w-3.5" /> {firstItem.docente}
                                            </span>

                                            <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600 hidden sm:block" />

                                            <span className="flex items-center gap-1.5 text-muted-foreground">
                                                <FlaskConical className="h-3.5 w-3.5" /> {getLabName(firstItem.labId)}
                                            </span>
                                    </p>
                                </div>
                            </div>
                            
                            <Button variant="ghost" size="icon" className="text-muted-foreground">
                                {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                            </Button>
                        </div>

                        {isExpanded && (
                            <div className="p-4 pt-0 border-t border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-top-2 fade-in duration-200">
                                <div className="py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider pl-6 mb-2 mt-2">
                                    Itens da série:
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
                                        <ChevronUp className="h-3 w-3 mr-1"/> Recolher grupo
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

        <AlertDialog open={actionData.isOpen} onOpenChange={(val) => !val && setActionData(prev => ({...prev, isOpen: false}))}>
          <AlertDialogContent className="sm:max-w-[500px]">
             {actionData.item && (
                <>
                    <AlertDialogHeader>
                        <AlertDialogTitle className={cn("flex items-center gap-2", actionData.type === 'approve' ? "text-emerald-600" : "text-red-600")}>
                            {actionData.type === 'approve' ? <CheckCircle2 className="h-5 w-5"/> : <AlertCircle className="h-5 w-5"/>}
                            {actionData.type === 'approve' ? 'Confirmar Aprovação' : 'Confirmar Recusa'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                           Verifique os dados abaixo antes de confirmar a ação.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg border text-sm flex flex-col gap-3 my-2">
                        
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold uppercase text-foreground tracking-wider">Data do Agendamento</span>
                            
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground"/>
                                <span>{actionData.item.dia}/{actionData.item.mes + 1}/{actionData.item.ano}</span>
                                <span className="text-xs text-muted-foreground/60 mx-1">•</span>
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    {actionData.item.groupId 
                                        ? <Layers className="h-3.5 w-3.5" /> 
                                        : <Clock className="h-3.5 w-3.5" />
                                    }
                                    <span>{actionData.item.groupId ? "Série Recorrente" : "1 dia"}</span>
                                </div>
                                <Badge 
                                    variant="secondary" 
                                    className={cn(
                                        "ml-auto h-5 px-1.5 text-[10px] pointer-events-none border", 
                                        periodColors[actionData.item.periodo]
                                    )}
                                >
                                    {actionData.item.periodo}
                                </Badge>
                            </div>
                        </div>

                        <div className="h-px w-full bg-border/60" />

                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold uppercase text-foreground tracking-wider">Docente</span>
                            <span className="text-base text-muted-foreground leading-none">
                                {actionData.item.docente}
                            </span>
                        </div>

                        <div className="h-px w-full bg-border/60" />

                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold uppercase text-foreground tracking-wider">Laboratório</span>
                            <span className="text-muted-foreground flex items-center gap-2">
                                <FlaskConical className="h-3.5 w-3.5 text-muted-foreground" />
                                {getLabName(actionData.item.labId)}
                            </span>
                        </div>

                        {actionData.item.disciplina && (
                            <>
                                <div className="h-px w-full bg-border/60" />
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-bold uppercase text-foreground tracking-wider">Disciplina</span>
                                    <span className="text-muted-foreground">{actionData.item.disciplina}</span>
                                </div>
                            </>
                        )}

                        {actionData.item.groupId && (
                            <div className="mt-1 p-2.5 bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 rounded-md flex items-start gap-2.5">
                                <Layers className="h-4 w-4 text-violet-600 dark:text-violet-400 mt-0.5 shrink-0" />
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-xs font-bold text-violet-700 dark:text-violet-300">Série Recorrente</span>
                                    <span className="text-[11px] text-violet-600/80 dark:text-violet-300/80 leading-tight">
                                        Esta ação será aplicada para todos os itens <strong>{actionData.item.status}s</strong> desta série.
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    <AlertDialogFooter className="sm:justify-between gap-2">
                        <AlertDialogCancel className="mt-0">Cancelar</AlertDialogCancel>
                        
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                             {actionData.item.groupId ? (
                                <>
                                    <Button variant="outline" onClick={() => executeAction(actionData.type, actionData.item!.id, false)}>
                                        Apenas este dia
                                    </Button>
                                    <Button 
                                        className={cn(actionData.type === 'approve' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700")}
                                        onClick={() => executeAction(actionData.type, actionData.item!.groupId!, true)}
                                    >
                                        Toda a série
                                    </Button>
                                </>
                             ) : (
                                <Button 
                                    className={cn("w-full sm:w-auto", actionData.type === 'approve' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700")}
                                    onClick={() => executeAction(actionData.type, actionData.item!.id, false)}
                                >
                                    Confirmar {actionData.type === 'approve' ? 'Aprovação' : 'Recusa'}
                                </Button>
                             )}
                        </div>
                    </AlertDialogFooter>
                </>
             )}
          </AlertDialogContent>
        </AlertDialog>

        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  )
}