import { FormularioEquipamento } from "@/components/formularioEquipamento";
import { listarSalas } from "@/app/actions/admin";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default async function Page() {
  
  // Busca a lista de salas para preencher o select
  const listaSalas = await listarSalas();

  return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          {/* Header padrão com borda inferior */}
          <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/dashboard">
                      Sistema de reserva
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Cadastrar Equipamentos</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          
          {/* Container padrão com fundo cinza e espaçamento superior */}
          <div className="flex min-h-svh flex-col items-center gap-6 bg-muted/50 p-6 pt-20 md:p-10 md:pt-24">
            <div className="flex w-full max-w-sm flex-col gap-6">
              
              <FormularioEquipamento salas={listaSalas} />
              
            </div>
          </div>
          
        </SidebarInset>
      </SidebarProvider>
  );
}