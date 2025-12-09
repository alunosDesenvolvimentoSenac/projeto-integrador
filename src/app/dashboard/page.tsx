import { DashboardView } from "@/components/dashboard/dashboard-view"
import { listarSalas } from "@/app/actions/agendamento"
import { db } from "@/db"
import { usuarios, perfis } from "@/db/migrations/schema"
import { eq } from "drizzle-orm"
import { headers } from "next/headers" // Opcional dependendo da auth, mas vamos buscar via Server Action auxiliar ou Client

// Helper para pegar dados do usuário logado (simulado ou via auth cookie se tiver)
// Nota: Como estamos usando Firebase no Client, a validação visual será passada via props,
// mas a validação real de segurança acontece na Server Action 'responderSolicitacao'.

export default async function DashboardPage() {
  const salas = await listarSalas();

  return (
    <DashboardView salasIniciais={salas} />
  )
}