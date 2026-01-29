import { FormularioUsuario } from "@/components/formulario-usuario"; 
import { listarUnidades, listarPerfis } from "@/app/actions/admin";
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
  
  const [listaUnidades, listaPerfis] = await Promise.all([
    listarUnidades(),
    listarPerfis()
  ]);

  return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          {/* Header idêntico ao de Salas: com border-b e bg-background */}
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
                    <BreadcrumbLink >
                      Usuários
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Cadastrar Usuários</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          
          {/* Container idêntico ao de Salas: bg-muted/50 e padding-top ajustado */}
          <div className="flex min-h-svh flex-col items-center gap-6 bg-muted/50 p-6 pt-20 md:p-10 md:pt-24">
            <div className="flex w-full max-w-sm flex-col gap-6">
              
                <FormularioUsuario unidades={listaUnidades} perfis={listaPerfis} />
                
            </div>
          </div>
          
        </SidebarInset>
      </SidebarProvider>
  );
}