import { AppSidebar } from "@/components/app-sidebar"
import { DataTable } from "./data-table"
import { EquipamentoControls } from "@/components/equipamento-controls"

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

import { getEquipamentosAction, getSalasOptionsAction } from "@/app/actions/equipamentos"

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"

type SearchParams = Promise<{ 
  term?: string;
  salaId?: string;
  status?: string;
  estoque?: string;
}>

export default async function Page(props: { searchParams: SearchParams }) {
  const params = await props.searchParams;

  // Busca dados do banco (Server-Side)
  const [data, salasOptions] = await Promise.all([
    getEquipamentosAction({
      term: params.term,
      salaId: params.salaId,
      status: params.status,
      estoque: params.estoque
    }),
    getSalasOptionsAction()
  ])
    
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
                  <BreadcrumbLink >Equipamentos</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Consultar Equipamentos</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        
        <div className="flex-1">
          <div className="container mx-auto py-6 px-4 md:py-10 space-y-4 max-w-6xl">
             <EquipamentoControls salas={salasOptions} />
             
             {/* Passamos data e salasOptions para o DataTable lidar */}
             <DataTable data={data} salasOptions={salasOptions} />
          </div>
        </div>
        
      </SidebarInset>
    </SidebarProvider>
  );
}