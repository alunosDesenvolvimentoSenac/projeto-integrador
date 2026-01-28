"use server"

import { db } from "@/db";
import { agendamentos, usuarios, salas } from "@/db/migrations/schema"; 
import { asc, eq, and } from "drizzle-orm"; 
import { revalidatePath } from "next/cache";

const HORARIOS = {
  Manhã: { start: 8, end: 12 },
  Tarde: { start: 13, end: 17 },
  Noite: { start: 19, end: 23 },
};

// ==========================================================
// --- ACTIONS DO DASHBOARD ---
// ==========================================================

export async function getAgendamentosAction() {
  try {
    const data = await db
      .select({
        id: agendamentos.idAgendamento,
        inicio: agendamentos.dataHorarioInicio,
        fim: agendamentos.dataHorarioFim,
        status: agendamentos.status,
        idSala: agendamentos.idSala,
        nomeUsuario: usuarios.nome,
        observacao: agendamentos.observacao,
        codigoSerie: agendamentos.codigoSerie,
        disciplina: agendamentos.disciplina,
      })
      .from(agendamentos)
      .leftJoin(usuarios, eq(agendamentos.idUsuario, usuarios.idUsuario));

    return data.map((item) => {
      const date = new Date(item.inicio);
      const hour = date.getHours();
      let periodo = "Manhã";
      if (hour >= 13 && hour < 18) periodo = "Tarde";
      if (hour >= 19) periodo = "Noite";

      return {
        id: Number(item.id),
        dia: date.getDate(),
        mes: date.getMonth(),
        ano: date.getFullYear(),
        periodo: periodo,
        status: item.status,
        docente: item.nomeUsuario || "Desconhecido", 
        disciplina: item.disciplina || "", 
        labId: Number(item.idSala),
        groupId: item.codigoSerie, 
        observacao: item.observacao || "",
      };
    });
  } catch (error) {
    console.error("Erro ao buscar agendamentos:", error);
    return [];
  }
}

export async function saveAgendamentoAction(items: any[], userId: number) {
  try {
    // 1. VERIFICAÇÃO DE PERMISSÃO NO SERVIDOR
    const usuarioBanco = await db
      .select({ 
        idPerfil: usuarios.idPerfil 
      })
      .from(usuarios)
      .where(eq(usuarios.idUsuario, userId))
      .limit(1);

    if (!usuarioBanco.length) {
        return { success: false, error: "Usuário não encontrado." };
    }

    // ATENÇÃO: Verifique se no seu banco id_perfil 1 é realmente ADMIN.
    const isAdmin = usuarioBanco[0].idPerfil === 1; 
    
    // Debug no terminal do servidor para ver quem está tentando salvar
    console.log(`Tentativa de agendamento por UserID: ${userId}. É Admin? ${isAdmin}`);

    const inserts: any[] = [];

    for (const item of items) {
      const h = HORARIOS[item.periodo as keyof typeof HORARIOS] || HORARIOS['Manhã'];
      
      // Cria a data usando o dia/mês/ano explícitos que vieram do front
      const inicio = new Date(item.ano, item.mes, item.dia, h.start, 0, 0);
      const fim = new Date(item.ano, item.mes, item.dia, h.end, 0, 0);

      // --- VALIDAÇÃO ROBUSTA DE FIM DE SEMANA ---
      // getDay(): 0 = Domingo, 1 = Segunda ... 6 = Sábado
      // Usamos a data criada localmente com os dados numéricos para garantir precisão
      const dayOfWeek = inicio.getDay(); 
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      // Log para debug se necessário
      // console.log(`Data: ${item.dia}/${item.mes + 1}/${item.ano} - DiaSemana: ${dayOfWeek} - FimDeSemana? ${isWeekend}`);

      // SE É FIM DE SEMANA E NÃO É ADMIN, PULA FORA
      if (isWeekend && !isAdmin) {
         continue; // Pula este item do loop, não adiciona no array 'inserts'
      }
      // ----------------------------------------------

      inserts.push({
        dataHorarioInicio: inicio.toISOString(),
        dataHorarioFim: fim.toISOString(),
        status: (['pendente', 'confirmado', 'concluido'].includes(item.status) ? item.status : 'pendente') as any,
        idSala: Number(item.labId), 
        idUsuario: Number(userId),  
        observacao: item.observacao || null,
        codigoSerie: item.groupId || null,
        disciplina: item.disciplina || null,
      });
    }

    // Se a lista estiver vazia (tudo foi filtrado), retorna erro
    if (inserts.length === 0) {
        return { success: false, error: "Agendamento não permitido para fins de semana." };
    }

    await db.insert(agendamentos).values(inserts);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Falha ao salvar." };
  }
}

export async function deleteAgendamentoAction(id: number) {
  try {
    await db.delete(agendamentos).where(eq(agendamentos.idAgendamento, id));
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function deleteSerieAction(codigoSerie: string, status?: string) {
  try {
    if (status) {
      await db.delete(agendamentos).where(and(eq(agendamentos.codigoSerie, codigoSerie), eq(agendamentos.status, status as any)));
    } else {
      await db.delete(agendamentos).where(eq(agendamentos.codigoSerie, codigoSerie));
    }
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function approveAgendamentoAction(id: number) {
  try {
    await db.update(agendamentos).set({ status: 'confirmado' }).where(eq(agendamentos.idAgendamento, id));
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function approveSerieAction(codigoSerie: string) {
  try {
    await db.update(agendamentos).set({ status: 'confirmado' }).where(eq(agendamentos.codigoSerie, codigoSerie));
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function getSalasAction() {
  try {
    const data = await db.select({ id: salas.idSala, nome: salas.descricaoSala, codigo: salas.codigoSala }).from(salas).orderBy(asc(salas.codigoSala));
    return data.map(s => ({ ...s, id: Number(s.id) }));
  } catch (error) { return []; }
}