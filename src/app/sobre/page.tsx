"use client"

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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Info, Users, GraduationCap, Code2, Database, SearchCheck, Briefcase } from "lucide-react"

// Dados da Equipe baseados na documentação 
const equipe = [
  { 
    papel: "Professor Orientador", 
    nome: "Luis Gustavo Fogaroli", 
    icon: GraduationCap,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
  },
  { 
    papel: "Product Owner", 
    nome: "Paulo Moreno", 
    icon: Briefcase,
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
  },
  { 
    papel: "Scrum Masters", 
    membros: ["Lucas Mori", "André Passoni"], 
    icon: Users,
    color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
  },
  { 
    papel: "Development Team", 
    membros: ["Fabio Silveira", "Lucas Prado"], 
    icon: Code2,
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
  },
  { 
    papel: "Quality Assurance (QA)", 
    membros: ["Luise Alberti", "Nicolas Faria"], 
    icon: SearchCheck,
    color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
  },
  { 
    papel: "Database Administrator (DBA)", 
    nome: "Francisco Ferreira", 
    icon: Database,
    color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400"
  },
  { 
    papel: "Business Analysts", 
    membros: ["Rita Nakamura", "Vitor Goulart"], 
    icon: Info,
    color: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
  },
]

export default function SobrePage() {
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
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Sobre o Projeto</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-8 p-4 md:p-8 max-w-5xl mx-auto w-full">
          
          {/* Seção de Introdução */}
          <div className="space-y-4 text-center md:text-left">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Sistema de Agendamento de Salas
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
              Uma solução desenvolvida para modernizar, centralizar e assegurar o processo de gestão de agendamentos 
              de laboratórios e recursos didáticos no ambiente educacional do Senac Minas.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* O Projeto */}
            <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Info className="h-5 w-5 text-primary" />
                  Sobre a Solução
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-zinc-600 dark:text-zinc-400 leading-relaxed">
                <p>
                  Este projeto nasce da necessidade de mitigar erros operacionais decorrentes do uso de ferramentas manuais, 
                  como planilhas compartilhadas, que anteriormente causavam duplicidade de reservas e dificuldades na gestão 
                  da informação.
                </p>
                <p>
                  O sistema funciona como uma <strong>Aplicação Web Progressiva (PWA)</strong>, acessível via computadores e 
                  dispositivos móveis, entregando uma interface visual intuitiva (Calendário) integrada a um sistema seguro 
                  que impede automaticamente conflitos de horário.
                </p>
              </CardContent>
            </Card>

            {/* Créditos da Equipe */}
            <div className="md:col-span-2">
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <Users className="h-6 w-6" /> Créditos & Equipe
              </h2>
              
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {equipe.map((item, index) => (
                  <Card key={index} className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                      <Badge variant="secondary" className={`mb-1 ${item.color} border-0`}>
                        {item.papel}
                      </Badge>
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col gap-3 mt-2">
                        {item.nome ? (
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600">
                                {item.nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{item.nome}</span>
                          </div>
                        ) : (
                          item.membros?.map((membro, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600">
                                  {membro.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{membro}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <footer className="text-center text-sm text-muted-foreground mt-8 pb-4">
            <p>Desenvolvido como parte do Projeto Integrador - Senac Minas</p>
            <p className="text-xs mt-1">Versão 1.0.0</p>
          </footer>

        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}