import { AppSidebar } from "@/components/app-sidebar"
import { DataTable } from "./data-table"
import { SalaControls } from "@/components/sala-controls" // Importe o componente criado acima

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

import { columns } from "./columns"
import { getSalasAction } from "@/app/actions/salas" // Ajuste o caminho da action

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"

// Ajuste para Next.js 15: searchParams como Promise
type SearchParams = Promise<{ term?: string }>

export default async function Page(props: { searchParams: SearchParams }) {
  const params = await props.searchParams;

  // Busca os dados filtrados no servidor
  const data = await getSalasAction(params.term)
    
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
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
                  <BreadcrumbPage>Gerenciar Salas</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        
        <div className="flex-1">
          <div className="container mx-auto py-6 px-4 md:py-10 space-y-4">
             {/* Controles: Filtros e Botão Nova Sala */}
             <SalaControls />
             
             {/* Tabela de Dados */}
             <DataTable columns={columns} data={data} />
          </div>
        </div>
        
      </SidebarInset>
    </SidebarProvider>
  );
}