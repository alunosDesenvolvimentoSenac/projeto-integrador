import { FormularioSala } from "@/components/formularioSala";
import { listarUnidades, listarAreas } from "@/app/actions/admin";
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
  
  const [listaUnidades, listaAreas] = await Promise.all([
    listarUnidades(),
    listarAreas()
  ]);

  return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          {/* ADICIONADO: 'border-b bg-background' para criar a listra e garantir o fundo branco no header */}
          <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              
              {/* Esta é a listra vertical pequena */}
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink >
                      Salas
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Cadastrar Salas</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          
          {/* RESTAURADO: 'bg-muted/50' para dar o contraste de fundo padrão */}
          <div className="flex min-h-svh flex-col items-center gap-6 bg-muted/50 p-6 pt-20 md:p-10 md:pt-24">
            <div className="flex w-full max-w-sm flex-col gap-6">
              
              <FormularioSala unidades={listaUnidades} areas={listaAreas} />
              
            </div>
          </div>
          
        </SidebarInset>
      </SidebarProvider>
  );
}