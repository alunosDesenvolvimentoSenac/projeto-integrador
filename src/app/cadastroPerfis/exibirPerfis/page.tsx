import { AppSidebar } from "@/components/app-sidebar"
import { DataTable } from "./data-table"
import { PerfilControls } from "@/components/perfil-controls"

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

import { columns } from "./columns"
import { getPerfisAction } from "@/app/actions/perfis"

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"

type SearchParams = Promise<{ term?: string; type?: string }>

export default async function Page(props: { searchParams: SearchParams }) {
  const params = await props.searchParams;

  const data = await getPerfisAction({
    term: params.term,
    type: params.type
  })
    
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
                  <BreadcrumbLink >Perfis</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Consultar Perfis</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        
        <div className="flex-1">
          <div className="container mx-auto py-6 px-4 md:py-10 space-y-4 max-w-4xl">
             <PerfilControls />
             <DataTable columns={columns} data={data} />
          </div>
        </div>
        
      </SidebarInset>
    </SidebarProvider>
  );
}