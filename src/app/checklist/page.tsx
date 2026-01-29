"use client"

import * as React from "react"
import { Suspense } from "react" // 1. IMPORTAÇÃO DO SUSPENSE ADICIONADA
import { useSearchParams, useRouter } from "next/navigation"
import {
  getRelatoriosPendentesAction,
  getEquipamentosDaSalaAction,
  salvarChecklistAction,
  getHistoricoChecklistsAction,
  getSalasOptionsAction,
  getDetalhesDoChecklistAction
} from "@/app/actions/checklist"
import { ChecklistForm } from "@/components/formularioChecklist"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator
} from "@/components/ui/breadcrumb"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import {
  ClipboardList, History, CheckCircle2, XCircle, Calendar, User, Search,
  RefreshCcw, X, ChevronDown, Package, AlertTriangle, ImageIcon, FileWarning,
  Layers, Brush, Box, Loader2
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Image from "next/image"

// 2. RENOMEADO DE "RelatoriosPage" PARA "RelatoriosContent" E REMOVIDO O "export default"
function RelatoriosContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [pendentes, setPendentes] = React.useState<any[]>([])
  const [historico, setHistorico] = React.useState<any[]>([])
  const [salasOptions, setSalasOptions] = React.useState<any[]>([])

  const [selected, setSelected] = React.useState<any>(null)
  const [viewReport, setViewReport] = React.useState<any>(null)
  const [equipamentos, setEquipamentos] = React.useState([])

  const [loading, setLoading] = React.useState(false)
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  const [filterSearch, setFilterSearch] = React.useState("")
  const [filterSala, setFilterSala] = React.useState("all")
  const [filterStatus, setFilterStatus] = React.useState("todos")
  const [filterDate, setFilterDate] = React.useState<Date | undefined>(undefined)

  const pendentesAgrupados = React.useMemo(() => {
    const grouped: any[] = [];
    const map = new Map();

    pendentes.forEach(item => {
      if (item.groupId) {
        if (!map.has(item.groupId)) {
          const groupItem = {
            ...item,
            isSeries: true,
            dates: [new Date(item.inicio)],
            count: 1
          };
          map.set(item.groupId, groupItem);
          grouped.push(groupItem);
        } else {
          const group = map.get(item.groupId);
          group.dates.push(new Date(item.inicio));
          group.count += 1;
        }
      } else {
        grouped.push({ ...item, isSeries: false });
      }
    });

    grouped.forEach(g => {
      if (g.isSeries && g.dates) {
        g.dates.sort((a: Date, b: Date) => a.getTime() - b.getTime());
        g.dateStart = g.dates[0];
        g.dateEnd = g.dates[g.dates.length - 1];
      }
    });

    return grouped;
  }, [pendentes]);

  const historicoAgrupado = React.useMemo(() => {
    const grouped: any[] = [];
    const map = new Map();

    historico.forEach(item => {
      if (item.groupId) {
        if (!map.has(item.groupId)) {
          const dataReferencia = item.inicio ? new Date(item.inicio) : new Date(item.data);

          const groupItem = {
            ...item,
            isSeries: true,
            dates: [dataReferencia],
            count: 1
          };
          map.set(item.groupId, groupItem);
          grouped.push(groupItem);
        } else {
          const group = map.get(item.groupId);
          const dataReferencia = item.inicio ? new Date(item.inicio) : new Date(item.data);
          group.dates.push(dataReferencia);
          group.count += 1;
        }
      } else {
        grouped.push({ ...item, isSeries: false });
      }
    });

    grouped.forEach(g => {
      if (g.isSeries && g.dates) {
        g.dates.sort((a: Date, b: Date) => a.getTime() - b.getTime());
        g.dateStart = g.dates[0];
        g.dateEnd = g.dates[g.dates.length - 1];
      }
    });

    return grouped;
  }, [historico]);

  React.useEffect(() => {
    if (searchParams.get("error") === "bloqueado") {
      setTimeout(() => {
        toast.error("Ação Bloqueada", {
          description: "Você precisa finalizar o checklist pendente antes de realizar novos agendamentos.",
          duration: 6000,
          icon: <FileWarning className="h-5 w-5 text-red-600" />,
        })
      }, 100)
      router.replace("/relatorios")
    }
  }, [searchParams, router])

  React.useEffect(() => {
    if (!isRefreshing && pendentes.length > 0 && searchParams.get("error") !== "bloqueado") {
      toast.warning("Pendências Encontradas", {
        id: "aviso-pendencia",
        description: `Você possui conferências aguardando finalização.`,
        duration: 5000,
        icon: <AlertTriangle className="h-5 w-5 text-amber-500" />
      })
    }
  }, [pendentes, isRefreshing, searchParams])

  React.useEffect(() => {
    getSalasOptionsAction().then(setSalasOptions)
  }, [])

  const loadData = React.useCallback(async () => {
    setIsRefreshing(true)
    try {
      const filters = {
        search: filterSearch,
        idSala: filterSala,
        status: filterStatus as any,
        data: filterDate ? format(filterDate, 'yyyy-MM-dd') : undefined
      }

      const [p, h] = await Promise.all([
        getRelatoriosPendentesAction(),
        getHistoricoChecklistsAction(filters)
      ])
      setPendentes(p)
      setHistorico(h)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast.error("Erro ao atualizar listas.")
    } finally {
      setIsRefreshing(false)
    }
  }, [filterSearch, filterSala, filterStatus, filterDate])

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      loadData()
    }, 300)
    return () => clearTimeout(timeout)
  }, [loadData])

  const handleOpenForm = async (item: any) => {
    if (loading) return;
    const toastId = toast.loading("Buscando equipamentos...")
    setLoading(true)
    try {
      const eqs = await getEquipamentosDaSalaAction(item.idSala)
      setEquipamentos(eqs as any)
      setSelected(item)
      toast.dismiss(toastId)
    } catch (error) {
      toast.error("Erro ao buscar equipamentos.", { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDetails = async (historicoItem: any) => {
    if (loading) return;
    const toastId = toast.loading("Carregando detalhes...")
    setLoading(true)
    try {
      const detalhes: any = await getDetalhesDoChecklistAction(historicoItem.idChecklist)
      
      setViewReport({
        ...historicoItem,
        itens: detalhes.itens,
        observacaoGeral: detalhes.observacaoGeral,
        limpezaOk: detalhes.limpezaOk ?? true
      })
      toast.dismiss(toastId)
    } catch (error) {
      console.error(error)
      toast.error("Erro ao carregar detalhes.", { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  const handleFinish = async (payload: any) => {
    if (loading) return
    setLoading(true)
    const toastId = toast.loading("Salvando...")
    try {
      const res = await salvarChecklistAction({
        idAgendamento: selected.id,
        groupId: selected.isSeries ? selected.groupId : undefined,
        disciplina: selected.disciplina,
        
        materialOk: payload.materialOk,
        limpezaOk: payload.limpezaOk, 

        itens: payload.itens.map((it: any) => ({
          ...it,
          quantidadeCorreta: it.tudoOk
        })),
        observacaoGeral: payload.observacaoGeral
      })

      if (res.success) {
        setSelected(null)
        setEquipamentos([])
        toast.success(selected.isSeries ? "Série finalizada com sucesso!" : "Checklist concluído!", { id: toastId })
        loadData()
      } else {
        toast.error("Erro ao salvar: " + res.error, { id: toastId })
      }
    } catch (error) {
      toast.error("Erro de comunicação.", { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  const clearSearch = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setFilterSearch("") }
  const clearSala = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setFilterSala("all") }
  const clearStatus = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setFilterStatus("todos") }
  const clearDate = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setFilterDate(undefined) }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">Sistema</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Gestão de Relatórios</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-8 p-6 md:p-10 pt-8 max-w-6xl mx-auto w-full">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <ClipboardList className="text-primary h-8 w-8" />
              Relatórios de Checklist
            </h1>
          </div>

          <Separator />

          <section className="space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <History className="h-5 w-5 text-zinc-500" />
                Histórico de Relatórios
              </h2>
              {isRefreshing && <span className="text-xs flex items-center gap-1 text-muted-foreground animate-pulse"><RefreshCcw className="h-3 w-3 animate-spin" /> Atualizando...</span>}
            </div>

            <div className="bg-background border rounded-xl shadow-sm overflow-hidden flex flex-col">
              {/* FILTROS */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border-b bg-muted/30">
                <div className="md:col-span-5 relative group">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar docente..."
                    className={cn("pl-9 pr-10 bg-background w-full transition-colors", filterSearch ? "text-foreground" : "text-muted-foreground placeholder:text-muted-foreground")}
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                  />
                  {filterSearch && (
                    <button onClick={clearSearch} className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground p-0.5 rounded-full hover:bg-muted transition-colors z-20 cursor-pointer">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="md:col-span-3 relative">
                  <Select value={filterSala} onValueChange={setFilterSala}>
                    <SelectTrigger className={cn("bg-background w-full pr-10 [&>svg]:hidden", filterSala !== 'all' ? "text-foreground font-medium" : "text-muted-foreground")}>
                      <SelectValue placeholder="Sala" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as salas</SelectItem>
                      {salasOptions.map((s) => (<SelectItem key={s.id} value={String(s.id)}>{s.nome}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  {filterSala !== "all" ? (
                    <button onClick={clearSala} className="absolute right-3 top-1/2 -translate-y-1/2 z-20 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted transition-colors cursor-pointer">
                      <X className="h-4 w-4" />
                    </button>
                  ) : (
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50 pointer-events-none" />
                  )}
                </div>
                <div className="md:col-span-2 relative">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-between bg-background px-3 pr-10", !filterDate ? "text-muted-foreground" : "text-foreground font-medium")}>
                        <div className="flex items-center truncate">
                          <span className="truncate">{filterDate ? format(filterDate, "dd/MM/yyyy", { locale: ptBR }) : "Todas as datas"}</span>
                        </div>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent mode="single" selected={filterDate} onSelect={setFilterDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                  {filterDate ? (
                    <div role="button" onClick={clearDate} className="absolute right-3 top-1/2 -translate-y-1/2 z-20 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted transition-colors cursor-pointer">
                      <X className="h-4 w-4" />
                    </div>
                  ) : (
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50 pointer-events-none" />
                  )}
                </div>
                <div className="md:col-span-2 relative">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className={cn("bg-background w-full pr-10 [&>svg]:hidden", filterStatus !== 'todos' ? "text-foreground font-medium" : "text-muted-foreground")}>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os tipos</SelectItem>
                      <SelectItem value="ok">Sem Avarias</SelectItem>
                      <SelectItem value="avaria">Com Avaria</SelectItem>
                    </SelectContent>
                  </Select>
                  {filterStatus !== "todos" ? (
                    <button onClick={clearStatus} className="absolute right-3 top-1/2 -translate-y-1/2 z-20 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted transition-colors cursor-pointer">
                      <X className="h-4 w-4" />
                    </button>
                  ) : (
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50 pointer-events-none" />
                  )}
                </div>
              </div>

              <div className="h-[600px] overflow-y-auto p-4 bg-slate-50/50 dark:bg-zinc-950/20">
                <div className="space-y-2">
                  {historicoAgrupado.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-60">
                      <Search className="h-10 w-10 mb-2" />
                      <p>Nenhum histórico encontrado.</p>
                    </div>
                  ) : (
                    historicoAgrupado.map((h) => (
                      <div
                        key={h.idChecklist || h.groupId}
                        onClick={() => handleOpenDetails(h)}
                        className="group flex flex-col md:flex-row md:items-center justify-between p-4 bg-card border rounded-lg hover:border-primary/50 hover:shadow-md transition-all shadow-sm cursor-pointer"
                      >
                        <div className="flex items-start gap-4 mb-3 md:mb-0">
                          {/* BOLINHA STATUS DO CARD DA LISTA */}
                          <div className={cn("mt-1 p-2 rounded-full shrink-0", 
                            (h.materialOk && (h.limpezaOk ?? true))
                            ? "bg-emerald-100 text-emerald-600" 
                            : "bg-red-100 text-red-600"
                          )}>
                            {(h.materialOk && (h.limpezaOk ?? true)) ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                          </div>
                          <div>
                            <p className="font-bold text-base group-hover:text-primary transition-colors flex items-center gap-2">
                              {h.salaNome}
                              {h.isSeries && (
                                <span className="text-[10px] font-medium px-2 py-0.5 bg-violet-50 text-violet-700 border border-violet-100 rounded-full flex items-center gap-1">
                                  <Layers className="h-3 w-3" /> Série
                                </span>
                              )}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                              <User className="h-3 w-3" /> <span className="truncate max-w-[150px]">{h.docente}</span>
                              <span className="text-zinc-300">|</span>
                              <Calendar className="h-3 w-3" />
                              <span>
                                {h.isSeries
                                  ? `${format(h.dateStart, "dd/MM/yyyy")} a ${format(h.dateEnd, "dd/MM/yyyy")}`
                                  : new Date(h.data).toLocaleDateString('pt-BR')
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto pl-12 md:pl-0">
                          <span className={cn("text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-wider", 
                             (h.materialOk && (h.limpezaOk ?? true))
                             ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                             : "bg-red-50 text-red-700 border-red-200"
                          )}>
                            {(h.materialOk && (h.limpezaOk ?? true)) ? 'INTEGRIDADE TOTAL' : 'AVARIA REGISTRADA'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        <Dialog open={!!selected} onOpenChange={(open) => !open && !loading && setSelected(null)}>
          <DialogContent className="sm:max-w-lg w-full max-h-[95vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl">
            <DialogHeader className="px-6 py-4 bg-zinc-50 dark:bg-zinc-900 border-b flex flex-col gap-0.5">
              <DialogTitle className="text-xl font-bold leading-none flex items-center gap-2">
                Conferência
                {selected?.isSeries && <Badge variant="secondary" className="text-[10px] h-5 px-1.5"><Layers className="h-3 w-3 mr-1" /> Série</Badge>}
              </DialogTitle>
              <p className="text-muted-foreground text-xs font-medium line-clamp-1">{selected?.salaNome}</p>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto p-6 pt-0 bg-white dark:bg-zinc-950">
              {selected && (
                <ChecklistForm
                  equipamentos={equipamentos}
                  isSubmitting={loading}
                  onSubmit={handleFinish}
                  dadosAgendamento={selected}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!viewReport} onOpenChange={(open) => !open && setViewReport(null)}>
          <DialogContent className="sm:max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl">
            {viewReport && (
              <>
                <DialogHeader className="px-6 py-4 bg-zinc-50 dark:bg-zinc-900 border-b flex flex-col gap-1 text-left">
                  <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                    {viewReport.salaNome}
                    {viewReport.isSeries && (
                      <Badge variant="secondary" className="text-[10px] h-5 px-1.5"><Layers className="h-3 w-3 mr-1" /> Série</Badge>
                    )}
                  </DialogTitle>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {viewReport.isSeries
                        ? `${format(viewReport.dateStart, "dd/MM/yyyy")} a ${format(viewReport.dateEnd, "dd/MM/yyyy")}`
                        : new Date(viewReport.data).toLocaleDateString('pt-BR')
                      }
                    </span>
                    <span className="text-zinc-300">|</span>
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {viewReport.docente}
                    </span>
                  </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-zinc-950">

                  {viewReport.isSeries && (
                    <div className="mb-6 p-4 bg-violet-50 border border-violet-100 rounded-lg flex items-center gap-3">
                      <div className="p-2 bg-violet-100 rounded-full shrink-0">
                        <Layers className="h-5 w-5 text-violet-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-violet-900">Relatório em Série</h4>
                        <p className="text-xs text-violet-700">
                          Este checklist foi aplicado a {viewReport.count} agendamentos no período de {format(viewReport.dateStart, "dd/MM/yyyy")} a {format(viewReport.dateEnd, "dd/MM/yyyy")}.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className={cn("flex items-center gap-3 p-4 rounded-lg mb-6 border", 
                    (viewReport.materialOk && viewReport.limpezaOk)
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                    : "bg-red-50 border-red-200 text-red-800")
                  }>
                    {(viewReport.materialOk && viewReport.limpezaOk) ? <CheckCircle2 className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
                    <div>
                      <h4 className="font-bold">
                        {(viewReport.materialOk && viewReport.limpezaOk) ? "Sem Avarias Registradas" : "Avarias Encontradas"}
                      </h4>
                      <p className="text-xs opacity-90">
                        {(viewReport.materialOk && viewReport.limpezaOk) ? "Limpeza e equipamentos conformes." : "Houve divergência em limpeza ou equipamentos."}
                      </p>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4" /> Equipamentos Verificados
                  </h3>

                  {!viewReport.itens || viewReport.itens.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 px-4 text-center border-2 border-dashed rounded-lg bg-muted/10 text-muted-foreground">
                      <Package className="h-10 w-10 mb-2 opacity-20" />
                      <p className="text-sm font-medium">Nenhum equipamento registrado para esta conferência.</p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {viewReport.itens.map((item: any, idx: number) => (
                        <div key={idx} className="flex flex-col gap-3 p-3 border rounded-lg bg-card hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 bg-muted rounded-md shrink-0 overflow-hidden flex items-center justify-center border relative">
                              {item.foto ? (
                                <Image src={item.foto} alt={item.nome} fill className="object-cover" />
                              ) : (
                                <ImageIcon className="h-5 w-5 text-muted-foreground/30" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col gap-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-bold text-sm truncate">{item.nome}</p>
                                <span className="font-medium text-foreground bg-zinc-100 px-2 py-0.5 rounded-full text-[10px] border shrink-0">
                                  Qtd: {item.quantidade}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className={cn("flex items-center gap-3 p-3 rounded-lg border", viewReport.limpezaOk ? "bg-white border-zinc-200" : "bg-red-50 border-red-200")}>
                          <div className={cn("p-2 rounded-md shrink-0", viewReport.limpezaOk ? "bg-zinc-100" : "bg-red-100")}>
                              <Brush className={cn("h-4 w-4", viewReport.limpezaOk ? "text-zinc-500" : "text-red-500")} />
                          </div>
                          <div className="flex flex-col">
                              <span className="text-sm font-bold text-foreground">Integridade da Sala</span>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  {viewReport.limpezaOk ? <><CheckCircle2 className="h-3 w-3 text-emerald-600"/> Conforme</> : <><XCircle className="h-3 w-3 text-red-600"/> Problema</>}
                              </span>
                          </div>
                      </div>

                      <div className={cn("flex items-center gap-3 p-3 rounded-lg border", viewReport.materialOk ? "bg-white border-zinc-200" : "bg-red-50 border-red-200")}>
                          <div className={cn("p-2 rounded-md shrink-0", viewReport.materialOk ? "bg-zinc-100" : "bg-red-100")}>
                              <Box className={cn("h-4 w-4", viewReport.materialOk ? "text-zinc-500" : "text-red-500")} />
                          </div>
                          <div className="flex flex-col">
                              <span className="text-sm font-bold text-foreground">Integridade dos Equipamentos</span>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  {viewReport.materialOk ? <><CheckCircle2 className="h-3 w-3 text-emerald-600"/> Conforme</> : <><XCircle className="h-3 w-3 text-red-600"/> Problema</>}
                              </span>
                          </div>
                      </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Observações Gerais</h3>
                    <div className="p-4 bg-muted/30 rounded-lg border text-sm min-h-[80px]">
                      {viewReport.observacaoGeral || <span className="text-muted-foreground italic">Nenhuma observação geral registrada.</span>}
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t bg-muted/10 flex justify-end">
                  <Button variant="outline" onClick={() => setViewReport(null)}>Fechar</Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

      </SidebarInset>
    </SidebarProvider>
  )
}

// 3. NOVO COMPONENTE DEFAULT COM SUSPENSE
export default function RelatoriosPage() {
  return (
    <Suspense fallback={
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    }>
      <RelatoriosContent />
    </Suspense>
  )
}