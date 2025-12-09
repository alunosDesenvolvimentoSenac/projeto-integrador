"use client"

import * as React from "react"
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  User,
  CheckCircle2,
  AlertCircle,
  Plus,
  FlaskConical,
  ListChecks,
  SunMedium,
  Pencil, 
  Loader2,
  X, 
  Check, 
  Lock,
  Unlock,
  CalendarDays, 
  Copy,
  Trash2,
  Info // Importado novo ícone
} from "lucide-react"

// --- IMPORTS DE AUTENTICAÇÃO ---
import { auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { getDadosUsuarioSidebar } from "@/app/actions/auth"

// --- LIBS DE DATA ---
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input" 
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/sonner" 
import { toast } from "sonner"

// --- IMPORTS DO CALENDÁRIO VISUAL (SHADCN) ---
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// --- TIPOS ---
type Periodo = "Manhã" | "Tarde" | "Noite"

interface Usuario {
  id: number
  nome: string
  email: string
  role: "ADMIN" | "USER"
}

interface Agendamento {
  id: number
  dia: number
  mes: number
  ano: number
  periodo: Periodo
  status: "confirmado" | "pendente"
  docente: string
  disciplina: string
  labId?: number
  groupId?: string
  observacao?: string // Novo campo opcional
}

// DADOS ESTÁTICOS DOS LABORATÓRIOS
const LABORATORIOS = [
  { id: 1, nome: "Laboratório de Informática 01" },
  { id: 2, nome: "Laboratório de Hardware" },
  { id: 3, nome: "Laboratório de Enfermagem" },
]

export default function Dashboard() {
  const today = new Date();
  today.setHours(0, 0, 0, 0); 

  const [date, setDate] = React.useState(new Date(2025, 11, 1)) 
  
  // ESTADOS DE DADOS
  const [agendamentos, setAgendamentos] = React.useState<Agendamento[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  
  // ESTADO DO USUÁRIO
  const [currentUser, setCurrentUser] = React.useState<Usuario | null>(null)

  // FILTROS
  const [selectedLab, setSelectedLab] = React.useState("0") 
  const [filterStatus, setFilterStatus] = React.useState("todos")
  const [filterPeriod, setFilterPeriod] = React.useState("todos")
  
  // MODAIS
  const [selectedDayDetails, setSelectedDayDetails] = React.useState<{ day: number, month: number, year: number, appointments: Agendamento[] } | null>(null)
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [isRangeMode, setIsRangeMode] = React.useState(false) 
  
  const [formInitialDate, setFormInitialDate] = React.useState<{
    day: number, 
    month: number, 
    year: number,
    periodoPre?: Periodo, 
    labIdPre?: string 
  } | null>(null)

  // --- 1. BUSCA DADOS DO USUÁRIO ---
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const infoBanco = await getDadosUsuarioSidebar(user.uid)
          
          if (infoBanco) {
            const roleMapeada = infoBanco.cargo === "Administrador" ? "ADMIN" : "USER"

            setCurrentUser({
              id: (infoBanco as any).idUsuario || 1, 
              nome: infoBanco.nomeUsuario,
              email: user.email || "",
              role: roleMapeada
            })
          }
        } catch (error) {
          console.error("Erro ao buscar dados do usuário:", error)
          toast.error("Erro ao carregar perfil do usuário.")
        }
      } else {
        setCurrentUser(null)
      }
    })

    return () => unsubscribe()
  }, [])

  // --- 2. BUSCA AGENDAMENTOS (SIMULAÇÃO) ---
  React.useEffect(() => {
    const fetchAgendamentos = async () => {
      setIsLoading(true)
      try {
        await new Promise(resolve => setTimeout(resolve, 800))
        const dadosDoBanco: Agendamento[] = [
          { id: 1, dia: 5, mes: 11, ano: 2025, periodo: "Manhã", status: "confirmado", docente: "Carlos Silva", disciplina: "Algoritmos", labId: 1 },
          { id: 2, dia: 5, mes: 11, ano: 2025, periodo: "Noite", status: "pendente", docente: "Ana Souza", disciplina: "Redes", labId: 1 },
          { id: 3, dia: 12, mes: 11, ano: 2025, periodo: "Tarde", status: "confirmado", docente: "Roberto", disciplina: "Banco de Dados", labId: 2 },
          { id: 4, dia: 15, mes: 11, ano: 2025, periodo: "Manhã", status: "confirmado", docente: "Julia", disciplina: "Design", labId: 3 },
        ]
        setAgendamentos(dadosDoBanco)
      } catch (error) {
        console.error("Erro", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchAgendamentos()
  }, [])

  const nextMonth = () => setDate(new Date(date.getFullYear(), date.getMonth() + 1, 1))
  const prevMonth = () => setDate(new Date(date.getFullYear(), date.getMonth() - 1, 1))
  const monthName = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  // --- INTERAÇÕES ---

  const handleDayClick = (day: number, month: number) => {
    const year = date.getFullYear()
    const isAdmin = currentUser?.role === "ADMIN"
    
    // VERIFICAÇÃO DE DATA RETROATIVA
    const clickedDate = new Date(year, month, day);
    const now = new Date();
    now.setHours(0,0,0,0); 

    if (clickedDate < now && !isAdmin) {
        toast.error("Data Retroativa", {
            description: "Não é possível realizar agendamentos em dias passados.",
            icon: <Lock className="h-4 w-4 text-red-500"/>
        })
        return;
    }

    if (selectedLab === "0") {
        toast.error("Laboratório não selecionado", {
            description: "Por favor, selecione um laboratório no filtro superior."
        })
        return; 
    }

    const apps = getAppointments(day, month, year)
    setSelectedDayDetails({ day, month, year, appointments: apps })
  }

  // --- HABILITA O MODO RANGE APENAS PELO BOTÃO DE ADIÇÃO ---
  const handleOpenAddForm = (periodo?: Periodo, enableRange: boolean = false) => {
    if (selectedLab === "0") return;

    let targetDay = today.getDate();
    let targetMonth = today.getMonth();
    let targetYear = today.getFullYear();

    if (selectedDayDetails) {
        targetDay = selectedDayDetails.day;
        targetMonth = selectedDayDetails.month;
        targetYear = selectedDayDetails.year;
        setSelectedDayDetails(null) 
    }

    setFormInitialDate({
        day: targetDay,
        month: targetMonth,
        year: targetYear,
        periodoPre: periodo,
        labIdPre: selectedLab 
    })
    setIsRangeMode(enableRange) 
    setIsFormOpen(true)
  }

  // --- LÓGICA DE SALVAR INTELIGENTE E VALIDADA ---
  const handleSaveAppointment = async (data: { 
    docente: string, 
    disciplina: string, 
    labId: number,
    startDetails: {d: number, m: number, y: number},
    endDateStr: string, 
    periodos: Periodo[],
    observacao?: string
  }) => {
    
    const initialStatus = currentUser?.role === 'ADMIN' ? 'confirmado' : 'pendente';
    
    const startDate = new Date(data.startDetails.y, data.startDetails.m, data.startDetails.d);
    
    const [endY, endM, endD] = data.endDateStr.split('-').map(Number);
    const endDate = new Date(endY, endM - 1, endD);

    const actualEndDate = endDate < startDate ? startDate : endDate;

    // --- 1. VERIFICAÇÃO DE CONFLITOS (NOVA LÓGICA) ---
    for (let d = new Date(startDate); d <= actualEndDate; d.setDate(d.getDate() + 1)) {
        const checkDia = d.getDate();
        const checkMes = d.getMonth();
        const checkAno = d.getFullYear();

        for (const p of data.periodos) {
            const conflito = agendamentos.find(
                (a) => 
                    a.dia === checkDia && 
                    a.mes === checkMes && 
                    a.ano === checkAno && 
                    a.periodo === p &&
                    a.labId === data.labId
            );

            if (conflito) {
                toast.error("Conflito de horário", {
                    description: `O turno da ${p} no dia e mês ${checkDia}/${checkMes + 1} já está reservado para ${conflito.docente}.`,
                    icon: <AlertCircle className="h-4 w-4 text-red-500" />
                });
                return;
            }
        }
    }

    // --- 2. CRIAÇÃO DOS AGENDAMENTOS ---
    const newAppointments: Agendamento[] = [];
    const isBatch = actualEndDate.getTime() > startDate.getTime() || data.periodos.length > 1;
    const groupId = isBatch ? Math.random().toString(36).substr(2, 9) : undefined;

    const createDateLoop = new Date(startDate);
    const todayZero = new Date();
    todayZero.setHours(0,0,0,0);
    const now = new Date();
    const currentHour = now.getHours();

    for (let d = createDateLoop; d <= actualEndDate; d.setDate(d.getDate() + 1)) {
        const currentDia = d.getDate();
        const currentMes = d.getMonth();
        const currentAno = d.getFullYear();

        const isLoopToday = d.getTime() === todayZero.getTime();

        data.periodos.forEach(p => {
              let skip = false;
              if (isLoopToday) {
                  if (p === 'Manhã' && currentHour >= 12) skip = true;
                  if (p === 'Tarde' && currentHour >= 18) skip = true;
                  if (p === 'Noite' && currentHour >= 23) skip = true;
              }

              if (!skip) {
                  newAppointments.push({
                    id: Math.random(),
                    dia: currentDia,
                    mes: currentMes,
                    ano: currentAno,
                    periodo: p,
                    status: initialStatus,
                    docente: data.docente,
                    disciplina: data.disciplina || "Sem disciplina",
                    labId: data.labId,
                    groupId: groupId,
                    observacao: data.observacao // Salva a observação
                  });
              }
        });
    }

    if (newAppointments.length === 0) {
        toast.error("Nenhum horário disponível", {
            description: "Todos os horários selecionados para os dias escolhidos já passaram."
        });
        return;
    }

    setAgendamentos(prev => [...prev, ...newAppointments])
    setIsFormOpen(false)
    
    if (initialStatus === 'pendente') {
        toast.message("Solicitação enviada!", {
            description: isBatch ? `Série de agendamentos enviada para aprovação.` : "Seu agendamento aguarda aprovação.",
            icon: <Clock className="h-4 w-4 text-orange-500" />
        })
    } else {
        toast.success(isBatch ? "Série de agendamentos criada!" : "Agendamento confirmado!")
    }
  }

  // --- LÓGICA DE EXCLUSÃO ---
  const handleDeleteAppointment = (id: number, deleteAllInGroup: boolean = false) => {
    const targetApp = agendamentos.find(a => a.id === id);
    if (!targetApp) return;

    if (deleteAllInGroup && targetApp.groupId) {
        setAgendamentos(prev => prev.filter(a => a.groupId !== targetApp.groupId))
        
        if (selectedDayDetails) {
             const updatedList = selectedDayDetails.appointments.filter(a => a.groupId !== targetApp.groupId)
             setSelectedDayDetails({ ...selectedDayDetails, appointments: updatedList })
        }
        toast.success("Série de agendamentos removida.")
    } else {
        setAgendamentos(prev => prev.filter(a => a.id !== id))
        
        if (selectedDayDetails) {
           const updatedList = selectedDayDetails.appointments.filter(a => a.id !== id)
           setSelectedDayDetails({ ...selectedDayDetails, appointments: updatedList })
        }
        toast.success("Agendamento removido.")
    }
  }

  const handleApproveAppointment = (id: number) => {
    setAgendamentos(prev => prev.map(a => 
        a.id === id ? { ...a, status: "confirmado" } : a
    ))

    if (selectedDayDetails) {
        const updatedList = selectedDayDetails.appointments.map(a => 
            a.id === id ? { ...a, status: "confirmado" } : a
        ) as Agendamento[] 
        setSelectedDayDetails({ ...selectedDayDetails, appointments: updatedList })
    }

    toast.success("Agendamento aprovado!")
  }

  // --- HELPERS CALENDÁRIO ---
  const getCalendarDays = () => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    const prevMonthDays = new Date(year, month, 0).getDate();
    
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, currentMonth: false, month: month - 1 });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, currentMonth: true, month: month });
    }
    const remainingSlots = 42 - days.length;
    for (let i = 1; i <= remainingSlots; i++) {
      days.push({ day: i, currentMonth: false, month: month + 1 });
    }
    return days;
  };

  const calendarDays = getCalendarDays();

  const getAppointments = (day: number, month: number, year: number) => {
    if (selectedLab === "0") return [];

    return agendamentos.filter(
      (a) => {
        const matchDate = a.dia === day && a.mes === month && a.ano === year;
        const matchStatus = filterStatus === "todos" ? true : a.status === filterStatus;
        const matchPeriod = filterPeriod === "todos" ? true : a.periodo === filterPeriod;
        const matchLab = String(a.labId) === selectedLab;
        return matchDate && matchStatus && matchPeriod && matchLab;
      }
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#F8F9FA] dark:bg-zinc-950">
        
        {/* HEADER */}
         <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">Agendamento</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Agendamentos</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          
          <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
              {currentUser ? (
                <span>Logado como: <strong>{currentUser.nome}</strong> ({currentUser.role})</span>
              ) : (
                <span>Carregando usuário...</span>
              )}
          </div>
        </header>

        {/* ÁREA PRINCIPAL */}
        <div className="flex flex-1 flex-col p-4 md:p-6 overflow-hidden h-[calc(100vh-64px)]">
          
          {/* BARRA SUPERIOR */}
          <div className="flex items-center justify-between w-full mb-6">
              <div className="flex items-center bg-white dark:bg-zinc-900 rounded-lg border shadow-sm p-1">
                <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8 text-zinc-500 hover:text-zinc-900"><ChevronLeft className="h-4 w-4" /></Button>
                <div className="px-4 border-x border-zinc-100 dark:border-zinc-800 mx-1 min-w-[180px] flex justify-center">
                    <span className="text-sm font-semibold capitalize text-zinc-700 dark:text-zinc-200 tracking-tight">{monthName}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8 text-zinc-500 hover:text-zinc-900"><ChevronRight className="h-4 w-4" /></Button>
              </div>

              <Button onClick={() => {
                if (selectedLab === "0") {
                    toast.error("Selecione um laboratório antes de criar um novo agendamento.")
                    return
                }
                // TRUE AQUI: Habilita modo range (Editável)
                handleOpenAddForm(undefined, true);
              }}>
                <Plus className="mr-2 h-4 w-4" /> Agendamento Personalizado
              </Button>
          </div>

          {/* BARRA DE CONTROLE E FILTROS */}
          <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 mb-4"> 
              <div className="flex items-center gap-4 px-1 shrink-0">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-full border shadow-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Manhã
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-full border shadow-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Tarde
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-full border shadow-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-950 dark:bg-zinc-100"></span> Noite
                  </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto xl:justify-end">
                <div className="relative w-full sm:w-[200px]">
                    <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                        <SelectTrigger className="h-10 bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 shadow-sm w-full text-sm">
                          <div className="flex items-center gap-2 truncate">
                              <div className="bg-orange-100 dark:bg-orange-900/30 p-1 rounded-md shrink-0"><SunMedium className="h-4 w-4 text-orange-600 dark:text-orange-400" /></div>
                              <SelectValue placeholder="Período" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="todos">Todos os períodos</SelectItem>
                            <SelectItem value="Manhã">Manhã</SelectItem>
                            <SelectItem value="Tarde">Tarde</SelectItem>
                            <SelectItem value="Noite">Noite</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="relative w-full sm:w-[200px]">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="h-10 bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 shadow-sm w-full text-sm">
                          <div className="flex items-center gap-2 truncate">
                              <div className="bg-violet-100 dark:bg-violet-900/30 p-1 rounded-md shrink-0"><ListChecks className="h-4 w-4 text-violet-600 dark:text-violet-400" /></div>
                              <SelectValue placeholder="Status" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="todos">Todos os status</SelectItem>
                            <SelectItem value="confirmado">Confirmados</SelectItem>
                            <SelectItem value="pendente">Pendentes</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="relative w-full sm:w-[280px]">
                    <Select value={selectedLab} onValueChange={setSelectedLab}>
                        <SelectTrigger className={cn(
                          "h-10 border-zinc-300 dark:border-zinc-700 shadow-sm w-full text-sm transition-colors",
                          selectedLab === "0" 
                            ? "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 ring-1 ring-red-200 dark:ring-red-900" 
                            : "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                        )}>
                          <div className="flex items-center gap-2 truncate">
                              <div className={cn(
                                "p-1 rounded-md shrink-0 transition-colors",
                                selectedLab === "0" ? "bg-zinc-200 dark:bg-zinc-700" : "bg-blue-100 dark:bg-blue-900/30"
                              )}>
                                  <FlaskConical className={cn(
                                    "h-4 w-4", 
                                    selectedLab === "0" ? "text-zinc-500" : "text-blue-600 dark:text-blue-400"
                                  )} />
                              </div>
                              <SelectValue placeholder="Procurar sala" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="0" className="text-muted-foreground font-medium">Preencher sala...</SelectItem>
                            {LABORATORIOS.map((lab) => (
                                <SelectItem key={lab.id} value={String(lab.id)}>{lab.nome}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
              </div>
          </div>

          {/* GRID CALENDÁRIO */}
          <div className="flex-1 bg-white dark:bg-zinc-900 border rounded-xl shadow-sm flex flex-col overflow-hidden relative">
              {isLoading && (
                <div className="absolute inset-0 bg-white/80 dark:bg-zinc-950/80 z-50 flex items-center justify-center backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="text-sm font-medium text-muted-foreground">Carregando agenda...</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-7 border-b bg-zinc-50/80 dark:bg-zinc-900/50">
                {["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"].map((d) => (
                  <div key={d} className="py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    <span className="hidden md:inline">{d}</span>
                    <span className="md:hidden">{d.slice(0, 3)}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 flex-1 auto-rows-fr overflow-y-auto">
                {calendarDays.map((slot, i) => {
                  let slotYear = date.getFullYear();
                  if (slot.month === -1) slotYear = date.getFullYear() - 1; 
                  if (slot.month === 12) slotYear = date.getFullYear() + 1;

                  const apps = getAppointments(slot.day, slot.month, slotYear);
                  
                  const todayDate = new Date();
                  todayDate.setHours(0,0,0,0);
                  const slotDate = new Date(slotYear, slot.month, slot.day);
                  
                  const isToday = slotDate.getTime() === todayDate.getTime();
                  const isPastDay = slotDate < todayDate; 
                  
                  const isCurrentMonth = slot.currentMonth;
                  const dayOfWeek = slotDate.getDay(); 
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                  const isAdmin = currentUser?.role === "ADMIN";
                  const isBlockedForUser = (isPastDay || isWeekend) && !isAdmin;

                  return (
                    <div 
                      key={i}
                      onClick={() => {
                        if (!isCurrentMonth) return;

                        if (isWeekend && !isAdmin) {
                            toast.error("Indisponível", {
                                description: "Não é possível realizar agendamentos aos fins de semana.",
                                icon: <AlertCircle className="h-4 w-4 text-red-500" />
                            })
                            return;
                        }

                        handleDayClick(slot.day, slot.month)
                      }}
                      className={cn(
                        "relative border-b border-r p-2 transition-all flex flex-col gap-1 min-h-[100px] select-none",
                        isPastDay && !isAdmin && "bg-zinc-100/50 dark:bg-zinc-900/80 cursor-not-allowed opacity-60",
                        isPastDay && isAdmin && "bg-zinc-50/30 cursor-pointer",
                        
                        !isCurrentMonth && "bg-zinc-50/60 dark:bg-zinc-900/50 opacity-40 grayscale pointer-events-none",
                        
                        isCurrentMonth && isWeekend && !isAdmin ? "bg-red-50 dark:bg-red-950/10 cursor-not-allowed hover:bg-red-100/50 dark:hover:bg-red-900/20" : 
                        (isCurrentMonth && !isBlockedForUser && "bg-background cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50")
                      )}
                    >
                      <div className="flex items-center justify-between">
                          <span className={cn(
                            "text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full transition-colors",
                            isToday && isCurrentMonth ? "bg-primary text-primary-foreground shadow-md font-bold" : "text-zinc-600 dark:text-zinc-400",
                             isWeekend && isCurrentMonth && "text-red-400 dark:text-red-400/70"
                          )}>
                              {slot.day}
                          </span>
                          {isPastDay && isCurrentMonth && !isWeekend && !isAdmin && (
                             <Lock className="h-3 w-3 text-zinc-300" />
                          )}
                           {isWeekend && isCurrentMonth && !isAdmin && (
                             <Lock className="h-3 w-3 text-red-200 dark:text-red-900" />
                          )}
                      </div>

                      {(!isWeekend || isAdmin) && (
                          <div className="flex flex-col gap-1 mt-1 overflow-hidden">
                            {apps.map((app) => (
                            <EventPill key={app.id} app={app} />
                            ))}
                          </div>
                      )}
                    </div>
                  )
                })}
              </div>
          </div>
        </div>

        {/* MODAL DETALHES DO DIA */}
        <DayDetailsDialog 
          isOpen={!!selectedDayDetails}
          onClose={() => setSelectedDayDetails(null)}
          data={selectedDayDetails}
          monthName={monthName}
          // FALSE AQUI: Clicar no modal do dia é SEMPRE dia único (FIXO)
          onAddClick={(periodo: Periodo) => handleOpenAddForm(periodo, false)}
          onDelete={handleDeleteAppointment}
          onApprove={handleApproveAppointment}
          currentUser={currentUser}
        />

        {/* MODAL FORMULÁRIO DE ADIÇÃO */}
        <AppointmentFormDialog 
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          formData={formInitialDate}
          onSave={handleSaveAppointment}
          laboratorios={LABORATORIOS}
          currentUser={currentUser}
          isRangeMode={isRangeMode} // Passando o modo
        />

        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  )
}

// --- COMPONENTE PÍLULA ---
function EventPill({ app }: { app: Agendamento }) {
    const bgStyles = {
        confirmado: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
        pendente: "bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800",
    }
    const dotColors = {
        Manhã: "bg-amber-500",
        Tarde: "bg-blue-500",
        Noite: "bg-zinc-950 dark:bg-zinc-100",
    }
    return (
      <div className={cn("text-[11px] px-2 py-0.5 rounded-md border truncate font-medium flex items-center gap-1.5 shadow-sm", bgStyles[app.status])}>
        <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColors[app.periodo])} />
        <span className="truncate leading-tight">{app.docente}</span>
        {app.groupId && <Copy className="h-2.5 w-2.5 opacity-50 ml-auto" />}
      </div>
    )
}
  
// --- MODAL DE DETALHES E EXCLUSÃO ---
function DayDetailsDialog({ isOpen, onClose, data, monthName, onAddClick, onDelete, onApprove, currentUser }: any) {
    const [deleteConfirmation, setDeleteConfirmation] = React.useState<{id: number, groupId?: string} | null>(null)
    const [deleteStep, setDeleteStep] = React.useState<'select-scope' | 'confirm'>('select-scope')
    const [scopeToDelete, setScopeToDelete] = React.useState<'single' | 'series' | null>(null)
    
    // Resetar estados ao abrir/fechar
    React.useEffect(() => {
        if (!isOpen) {
             setDeleteConfirmation(null);
             setDeleteStep('select-scope');
             setScopeToDelete(null);
        }
    }, [isOpen]);

    if (!data) return null
    const periodosOrder: Periodo[] = ["Manhã", "Tarde", "Noite"]
    const isAdmin = currentUser?.role === "ADMIN"

    const badgeColors: Record<string, string> = {
        Manhã: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 hover:bg-amber-100/80",
        Tarde: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-100/80",
        Noite: "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-zinc-100/80"
    }

    const statusBadgeStyles = {
        disponivel: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-100/80",
        encerrado: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100/80",
        pendente: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 hover:bg-orange-100/80",
        confirmado: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 hover:bg-emerald-100/80",
    }

    const isPeriodExpired = (period: Periodo) => {
        if (isAdmin) return false; 

        const now = new Date();
        const selectedDate = new Date(data.year, data.month, data.day);
        const today = new Date();
        today.setHours(0,0,0,0);

        if (selectedDate > today) return false;
        if (selectedDate < today) return true;

        const currentHour = now.getHours();
        if (period === 'Manhã' && currentHour >= 12) return true;
        if (period === 'Tarde' && currentHour >= 18) return true;
        if (period === 'Noite' && currentHour >= 23) return true; 

        return false;
    }

    const handleInitialDelete = (app: Agendamento) => {
        setDeleteConfirmation({ id: app.id, groupId: app.groupId })
        if (app.groupId) {
            setDeleteStep('select-scope')
        } else {
            setScopeToDelete('single')
            setDeleteStep('confirm')
        }
    }

    const confirmDeletion = () => {
        if (!deleteConfirmation) return;
        const deleteSeries = scopeToDelete === 'series';
        onDelete(deleteConfirmation.id, deleteSeries);
        setDeleteConfirmation(null);
    }

    return (
      <>
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[480px]">
            <DialogHeader className="pb-4 border-b">
                <DialogTitle className="flex items-center gap-3 text-xl">
                <div className="bg-primary/10 p-2.5 rounded-xl"><CalendarIcon className="h-6 w-6 text-primary" /></div>
                <div>
                    <span className="block text-sm font-normal text-muted-foreground">Agenda do laboratório</span>
                    <span className="font-bold">{data.day} de {monthName}</span>
                </div>
                </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] -mr-4 pr-4 pt-4">
                <div className="grid gap-3">
                {periodosOrder.map((periodo) => {
                    const agendamento = data.appointments.find((a: any) => a.periodo === periodo)
                    const expired = isPeriodExpired(periodo);

                    return (
                        <div key={periodo} className={cn(
                        "group relative flex flex-col gap-1 rounded-xl border p-4 transition-all duration-200",
                        agendamento 
                            ? "bg-card shadow-sm border-zinc-200 dark:border-zinc-800" 
                            : expired 
                                ? "bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 opacity-70"
                                : "bg-zinc-50/50 border-dashed border-zinc-200 hover:border-zinc-300 dark:bg-zinc-900/50 dark:border-zinc-800"
                        )}>
                        <div className="flex items-center justify-between mb-2">
                            {/* ESQUERDA */}
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className={cn("px-2.5 py-0.5 text-sm font-medium border-0", badgeColors[periodo])}>
                                    <Clock className="mr-1.5 h-3.5 w-3.5" />{periodo}
                                </Badge>
                                
                                {!agendamento && (
                                    <Badge variant="secondary" className={cn("px-2.5 py-0.5 text-xs font-medium border-0", expired ? statusBadgeStyles.encerrado : statusBadgeStyles.disponivel)}>
                                        {expired ? <Lock className="mr-1.5 h-3 w-3"/> : <Unlock className="mr-1.5 h-3 w-3" />}
                                        {expired ? "Encerrado" : "Disponível"}
                                    </Badge>
                                )}

                                {agendamento && (
                                    <Badge variant="secondary" className={cn("px-2.5 py-0.5 text-xs font-medium border-0", agendamento.status === 'confirmado' ? statusBadgeStyles.confirmado : statusBadgeStyles.pendente)}>
                                        {agendamento.status === 'confirmado' ? <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> : <AlertCircle className="mr-1.5 h-3.5 w-3.5" />}
                                        <span className="uppercase">{agendamento.status}</span>
                                    </Badge>
                                )}

                                {agendamento && agendamento.groupId && (
                                    <div title="Parte de uma série de agendamentos">
                                        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                    </div>
                                )}

                                {agendamento && agendamento.observacao && (
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-500 hover:text-blue-700 hover:bg-blue-50">
                                                <Info className="h-4 w-4" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-64 text-sm text-zinc-700 dark:text-zinc-300">
                                            <p className="font-semibold mb-1">Observação:</p>
                                            {agendamento.observacao}
                                        </PopoverContent>
                                    </Popover>
                                )}
                            </div>
                            
                            {/* DIREITA */}
                            <div className="flex items-center gap-1">
                                {agendamento && isAdmin && agendamento.status === 'pendente' && (
                                    <Button 
                                            variant="ghost" size="icon" 
                                            className="h-6 w-6 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                                            onClick={() => onApprove(agendamento.id)} title="Aprovar Agendamento"
                                    >
                                            <Check className="h-4 w-4" />
                                    </Button>
                                )}

                                {agendamento && isAdmin && (
                                    <Button 
                                            variant="ghost" size="icon" 
                                            className="h-6 w-6 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                                            onClick={() => handleInitialDelete(agendamento)} title="Remover Agendamento"
                                    >
                                            <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                        
                        {agendamento ? (
                            <div className="pl-1">
                                <div className="flex items-center gap-2 mt-1">
                                <div className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded-full"><User className="h-4 w-4" /></div>
                                <div>
                                    <span className="block font-bold text-lg text-zinc-800 dark:text-zinc-100 leading-none">{agendamento.docente}</span>
                                    <span className="text-xs text-muted-foreground">{agendamento.disciplina}</span>
                                </div>
                                </div>
                            </div>
                        ) : (
                            !expired && (
                                <div className="mt-2 flex justify-center opacity-60 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" onClick={() => onAddClick(periodo)} className="w-full border-2 border-dashed border-transparent hover:border-primary/20 hover:bg-primary/5 text-primary">
                                    <Plus className="mr-2 h-4 w-4" /> Agendar Horário
                                    </Button>
                                </div>
                            )
                        )}
                        </div>
                    )
                })}
                </div>
            </ScrollArea>
            </DialogContent>
        </Dialog>

        {/* ALERT DIALOG PERSONALIZADO PARA EXCLUSÃO */}
        <AlertDialog open={!!deleteConfirmation} onOpenChange={(val) => !val && setDeleteConfirmation(null)}>
            <AlertDialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-4 top-4 h-6 w-6 text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-sm z-10"
                    onClick={() => setDeleteConfirmation(null)}
                >
                    <X className="h-4 w-4" />
                </Button>

                {deleteStep === 'select-scope' && (
                    <div className="pt-2">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-center">Remover Agendamento em Série</AlertDialogTitle>
                            <AlertDialogDescription className="text-center">
                                Este agendamento se repete em outros dias. O que você deseja remover?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                            <Button 
                                variant="outline" 
                                className="h-auto py-4 px-3 flex flex-col gap-1 items-center justify-center text-center hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                onClick={() => {
                                    setScopeToDelete('single')
                                    setDeleteStep('confirm')
                                }}
                            >
                                <span className="font-semibold text-foreground text-base">Apenas este dia</span>
                                <span className="text-xs text-muted-foreground font-normal">Mantém os outros dias agendados.</span>
                            </Button>
                            
                            <Button 
                                variant="outline" 
                                className="h-auto py-4 px-3 flex flex-col gap-1 items-center justify-center text-center hover:bg-red-50 dark:hover:bg-red-950/20 border-red-100 dark:border-red-900/50"
                                onClick={() => {
                                    setScopeToDelete('series')
                                    setDeleteStep('confirm')
                                }}
                            >
                                <span className="font-semibold text-red-600 dark:text-red-400 text-base">Toda a série</span>
                                <span className="text-xs text-muted-foreground font-normal">Exclui todos os dias vinculados.</span>
                            </Button>
                        </div>
                    </div>
                )}

                {deleteStep === 'confirm' && (
                    <div className="pt-2">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-center">Confirmação Final</AlertDialogTitle>
                            <AlertDialogDescription className="text-center">
                                Tem certeza que deseja remover <strong>{scopeToDelete === 'series' ? 'todos os agendamentos da série' : 'este agendamento'}</strong>?
                                <br/>Esta ação não poderá ser desfeita.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-6 sm:justify-center">
                            <AlertDialogAction 
                                className="bg-red-600 hover:bg-red-700 w-full sm:w-auto min-w-[150px]"
                                onClick={confirmDeletion}
                            >
                                Confirmar Exclusão
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </div>
                )}
            </AlertDialogContent>
        </AlertDialog>
      </>
    )
}

// --- FORMULÁRIO DE ADIÇÃO (VALIDAÇÃO DE DATA E TURNO CORRIGIDA) ---
function AppointmentFormDialog({ isOpen, onClose, formData, onSave, laboratorios, currentUser, isRangeMode }: any) {
    const [docente, setDocente] = React.useState("")
    const [disciplina, setDisciplina] = React.useState("")
    const [labId, setLabId] = React.useState("")
    const [observacao, setObservacao] = React.useState("") // Estado para observação
    
    // Novo Estado de Data (String YYYY-MM-DD)
    const [startDate, setStartDate] = React.useState<Date | undefined>(undefined)
    const [endDate, setEndDate] = React.useState<Date | undefined>(undefined)

    const [selectedPeriodos, setSelectedPeriodos] = React.useState<Periodo[]>([])

    const isAdmin = currentUser?.role === "ADMIN"
    
    // CORREÇÃO: Pegar data local (sem UTC) para validar o "hoje" corretamente
    const getLocalTodayStr = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    const todayStr = getLocalTodayStr();
    
    // HOJE (ZERADO PARA COMPARAÇÃO VISUAL)
    const today = new Date();
    today.setHours(0,0,0,0);
  
    React.useEffect(() => {
        if(isOpen && formData) {
            if (currentUser) {
                setDocente(currentUser.nome)
            } else {
                setDocente("") 
            }
            setDisciplina("")
            setLabId(formData.labIdPre || "")
            setObservacao("") // Resetar observação
            
            if (formData.periodoPre) {
                setSelectedPeriodos([formData.periodoPre])
            } else {
                setSelectedPeriodos([])
            }

            const y = formData.year;
            // CRIA DATA A PARTIR DO FORMDATA (CUIDADO COM MÊS: 0-11)
            const initialDate = new Date(y, formData.month, formData.day);
            setStartDate(initialDate);
            
            // SE FOR MODO RANGE, DATA FINAL COMEÇA COMO DIA SEGUINTE
            // SE FOR MODO SINGLE, DATA FINAL É O PRÓPRIO DIA
            if (isRangeMode) {
                const nextDay = new Date(initialDate);
                nextDay.setDate(nextDay.getDate() + 1);
                setEndDate(nextDay);
            } else {
                setEndDate(initialDate);
            }
        }
    }, [isOpen, formData, currentUser, isRangeMode])

    // Handler para mudança da data inicial
    const handleStartDateSelect = (date: Date | undefined) => {
        if (!date) return;
        setStartDate(date);

        // Se data final for menor ou igual à nova data inicial, empurra ela pra frente (dia + 1)
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);

        if (!endDate || endDate < nextDay) {
            setEndDate(nextDay);
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if(!docente || !labId || selectedPeriodos.length === 0 || !startDate || !endDate) {
            toast.error("Preencha todos os campos obrigatórios.")
            return
        }

        // Validação da observação no modo série
        if (isRangeMode && !observacao.trim()) {
            toast.error("Observação obrigatória", { description: "Por favor, justifique o agendamento em série." })
            return
        }

        // Formata para enviar ao onSave (mantendo compatibilidade com o resto do código)
        // OBS: Usamos a string YYYY-MM-DD para o endDateStr
        const yEnd = endDate.getFullYear();
        const mEnd = String(endDate.getMonth() + 1).padStart(2, '0');
        const dEnd = String(endDate.getDate()).padStart(2, '0');
        const endDateFormatted = `${yEnd}-${mEnd}-${dEnd}`;
        
        onSave({ 
            docente, 
            disciplina, 
            labId: Number(labId),
            startDetails: { d: startDate.getDate(), m: startDate.getMonth(), y: startDate.getFullYear() }, 
            endDateStr: endDateFormatted,
            periodos: selectedPeriodos,
            observacao // Passa a observação
        })
    }

    // Função Lógica de Disponibilidade do Turno (USADA APENAS NO MODO SINGLE)
    const isTurnoDisponivel = (turno: Periodo) => {
        // Se a data escolhida for maior que hoje, tudo bem.
        if (!startDate) return false;

        const startZero = new Date(startDate);
        startZero.setHours(0,0,0,0);

        if (startZero > today) return true;
        
        // Se for data passada (protegido pelo min, mas por segurança)
        if (startZero < today) return false;

        // Se for HOJE, verifica a hora
        const now = new Date();
        const currentHour = now.getHours();

        if (turno === 'Manhã' && currentHour >= 12) return false;
        if (turno === 'Tarde' && currentHour >= 18) return false;
        if (turno === 'Noite' && currentHour >= 23) return false; 

        return true;
    }

    const togglePeriodo = (p: Periodo) => {
        // SE NÃO FOR RANGE, BLOQUEIA CLIQUE DE HORÁRIO PASSADO
        // SE FOR RANGE, PERMITE CLICAR (A lógica de pular é feita no save)
        if (!isRangeMode && !isTurnoDisponivel(p)) return; 

        setSelectedPeriodos(prev => 
            prev.includes(p) ? prev.filter(item => item !== p) : [...prev, p]
        )
    }
  
    if (!formData) return null
  
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>{isRangeMode ? "Novo Agendamento" : "Agendar para o dia"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
             
             {isRangeMode ? (
                // MODO SÉRIE/BOTÃO: Inputs Editáveis
                <div className="grid grid-cols-2 gap-4">
                     <div className="flex flex-col gap-2">
                        <Label htmlFor="startDate" className="text-xs text-muted-foreground uppercase font-semibold">Data Inicial</Label>
                         <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !startDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {startDate ? format(startDate, "PPP", { locale: ptBR }) : <span>Selecione...</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={startDate}
                              onSelect={handleStartDateSelect}
                              initialFocus
                              locale={ptBR}
                              // Bloqueia dias anteriores a hoje
                              disabled={(date) => date < today}
                            />
                          </PopoverContent>
                        </Popover>
                     </div>

                     <div className="flex flex-col gap-2">
                        <Label htmlFor="endDate" className="text-xs text-muted-foreground uppercase font-semibold">Data Final</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !endDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {endDate ? format(endDate, "PPP", { locale: ptBR }) : <span>Selecione...</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={endDate}
                              onSelect={setEndDate}
                              initialFocus
                              locale={ptBR}
                              // Bloqueia dias anteriores ou iguais à data inicial (garante mínimo 2 dias)
                              disabled={(date) => !startDate || date <= startDate}
                            />
                          </PopoverContent>
                        </Popover>
                     </div>
                </div>
             ) : (
                // MODO CALENDÁRIO: Texto Fixo
                <div className="flex flex-col gap-2">
                    <Label className="text-xs text-muted-foreground uppercase font-semibold">Data do Agendamento</Label>
                    <div className="flex items-center justify-center p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-md border text-sm font-medium w-full text-zinc-600 dark:text-zinc-400 cursor-not-allowed">
                        <CalendarDays className="mr-2 h-4 w-4 opacity-50"/>
                        {formData.day}/{formData.month + 1}/{formData.year}
                    </div>
                </div>
             )}
             
             {/* SELEÇÃO DE TURNOS */}
             <div className="flex flex-col gap-2">
                <Label className="text-xs text-muted-foreground uppercase font-semibold mb-1">Turnos</Label>
                <div className="flex gap-2">
                    {(["Manhã", "Tarde", "Noite"] as Periodo[]).map((p) => {
                        const isSelected = selectedPeriodos.includes(p);
                        // No modo Range, sempre disponível visualmente (mas filtrado no backend/save)
                        const isAvailable = isRangeMode ? true : isTurnoDisponivel(p);

                        return (
                            <div 
                                key={p}
                                onClick={() => togglePeriodo(p)}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 p-2.5 rounded-md border transition-all select-none text-sm font-medium",
                                    !isAvailable && "opacity-40 cursor-not-allowed bg-zinc-100 dark:bg-zinc-800",
                                    isAvailable && "cursor-pointer",
                                    isAvailable && isSelected 
                                        ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                                        : isAvailable && "bg-background hover:bg-zinc-50 dark:hover:bg-zinc-800 border-dashed"
                                )}
                                title={!isAvailable ? "Horário indisponível para hoje" : ""}
                            >
                                {isSelected ? <CheckCircle2 className="h-4 w-4"/> : <div className="w-4 h-4 rounded-full border border-zinc-300 dark:border-zinc-600"/>}
                                {p}
                            </div>
                        )
                    })}
                </div>
             </div>
             
             <Separator className="my-2"/>

            {/* 1. NOME DOCENTE */}
             <div className="grid gap-2">
                <Label htmlFor="docente" className="flex items-center justify-between">
                    Nome do Docente {isAdmin && <span className="text-xs text-blue-600 flex items-center gap-1"><Pencil className="w-3 h-3"/> Editável (Admin)</span>}
                </Label>
                <div className="relative">
                    <Input 
                        id="docente" 
                        placeholder="Ex: Prof. Carlos Silva" 
                        value={docente} 
                        onChange={(e) => setDocente(e.target.value)} 
                        readOnly={!isAdmin} 
                        className={cn(!isAdmin && "bg-muted text-muted-foreground cursor-not-allowed border-dashed focus-visible:ring-0")} 
                        tabIndex={!isAdmin ? -1 : 0}
                        required 
                    />
                    {!isAdmin && (<div className="absolute inset-y-0 right-3 flex items-center pointer-events-none"><span className="text-xs text-muted-foreground bg-background px-1 border rounded shadow-sm">Seu nome</span></div>)}
                </div>
             </div>

             {/* 2. LABORATÓRIO */}
             <div className="grid gap-2 w-full">
                <Label htmlFor="lab">Laboratório</Label>
                <Select value={labId} onValueChange={setLabId} disabled>
                  <SelectTrigger className="w-full bg-muted text-muted-foreground opacity-100 cursor-not-allowed">
                    <SelectValue placeholder="Laboratório" />
                  </SelectTrigger>
                  <SelectContent>
                    {laboratorios.map((lab: any) => (<SelectItem key={lab.id} value={String(lab.id)}>{lab.nome}</SelectItem>))}
                  </SelectContent>
                </Select>
             </div>

             {/* 3. DISCIPLINA */}
             <div className="grid gap-2">
                <Label htmlFor="disciplina">Disciplina / Curso <span className="text-xs font-normal text-muted-foreground ml-2">(Opcional)</span></Label>
                <Input id="disciplina" placeholder="Ex: Algoritmos e Lógica" value={disciplina} onChange={(e) => setDisciplina(e.target.value)} />
             </div>

             {/* 4. OBSERVAÇÃO (APENAS RANGE MODE) */}
             {isRangeMode && (
                <div className="grid gap-2">
                    <Label htmlFor="obs">Observação / Justificativa <span className="text-red-500">*</span></Label>
                    <textarea 
                        id="obs" 
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Descreva o motivo do agendamento em série..." 
                        value={observacao} 
                        onChange={(e) => setObservacao(e.target.value)} 
                        required
                    />
                </div>
             )}
             
             <div className="grid grid-cols-2 gap-4 pt-4">
                 <Button type="button" variant="outline" onClick={onClose} className="w-full">
                   Cancelar
                 </Button>
                 <Button type="submit" className="w-full">
                   {isRangeMode 
                    ? "Confirmar"
                    : "Confirmar"}
                 </Button>
             </div>
          </form>
        </DialogContent>
      </Dialog>
    )
}