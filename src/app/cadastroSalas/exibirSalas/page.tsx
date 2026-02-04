import { AppSidebar } from "@/components/app-sidebar"
import { DataTable } from "./data-table"
import { SalaControls } from "@/components/sala-controls"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"

// Actions
import { getSalasAction, getAreasOptionsAction, getUnidadesOptionsAction } from "@/app/actions/salas"

type SearchParams = Promise<{ term?: string }>

export default async function Page(props: { searchParams: SearchParams }) {
  const params = await props.searchParams;
  const termoBusca = params.term || "";

  // Busca TUDO no servidor (Paralelo)
  const [areasOptions, unidadesOptions, data] = await Promise.all([
    getAreasOptionsAction(),
    getUnidadesOptionsAction(),
    getSalasAction(termoBusca)
  ]);

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
                  <BreadcrumbLink href="#">Salas</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Consultar Salas</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        
        <div className="flex-1">
          <div className="container mx-auto py-6 px-4 md:py-10 space-y-4">
             {/* Agora SalaControls ACEITA as props areas e unidades */}
             <SalaControls areas={areasOptions} unidades={unidadesOptions} />
             
             <DataTable 
                data={data} 
                areasOptions={areasOptions} 
                unidadesOptions={unidadesOptions} 
             />
          </div>
        </div>
        
      </SidebarInset>
    </SidebarProvider>
  );
}