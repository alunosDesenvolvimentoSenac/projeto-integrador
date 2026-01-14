import { FormularioUsuario } from "@/components/formulario-usuario"; 
import { listarUnidades, listarPerfis } from "@/app/actions/admin";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default async function Page() {
  
  const [listaUnidades, listaPerfis] = await Promise.all([
    listarUnidades(),
    listarPerfis()
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
                    <BreadcrumbLink href="/dashboard">Sistema LabManager</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Cadastrar Usuários</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          
          <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center p-6 md:p-10">
            {/* REMOVI AS BORDAS AQUI (max-w-sm w-full apenas para largura) */}
            <div className="w-full max-w-sm">
                <FormularioUsuario unidades={listaUnidades} perfis={listaPerfis} />
            </div>
          </div>
          
        </SidebarInset>
      </SidebarProvider>
    
  );
}