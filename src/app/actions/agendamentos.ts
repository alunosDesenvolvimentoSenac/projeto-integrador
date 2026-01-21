"use server"

import { db } from "@/db";
import { agendamentos, usuarios, salas } from "@/db/migrations/schema"; 
import { asc, eq, and } from "drizzle-orm"; // ADICIONADO 'and' AQUI
import { revalidatePath } from "next/cache";

const HORARIOS = {
  Manhã: { start: 8, end: 12 },
  Tarde: { start: 13, end: 17 },
  Noite: { start: 19, end: 23 },
};

// --- BUSCAR AGENDAMENTOS ---
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
        // Novos campos
        observacao: agendamentos.observacao,
        codigoSerie: agendamentos.codigoSerie,
        disciplina: agendamentos.disciplina 
      })
      .from(agendamentos)
      .leftJoin(usuarios, eq(agendamentos.idUsuario, usuarios.idUsuario));

    const formatted = data.map((item) => {
      const date = new Date(item.inicio);
      const hour = date.getHours();
      
      let periodo = "Manhã";
      if (hour >= 13 && hour < 18) periodo = "Tarde";
      if (hour >= 19) periodo = "Noite";

      return {
        id: item.id,
        dia: date.getDate(),
        mes: date.getMonth(),
        ano: date.getFullYear(),
        periodo: periodo,
        status: item.status,
        docente: item.nomeUsuario || "Desconhecido", 
        disciplina: item.disciplina, 
        labId: item.idSala,
        groupId: item.codigoSerie, 
        observacao: item.observacao 
      };
    });

    return formatted;
  } catch (error) {
    console.error("Erro ao buscar:", error);
    return [];
  }
}

// --- SALVAR (Com Série, Observação e Status Dinâmico) ---
export async function saveAgendamentoAction(items: any[], userId: number) {
  try {
    const inserts = items.map(item => {
      const h = HORARIOS[item.periodo as keyof typeof HORARIOS];
      const inicio = new Date(item.ano, item.mes, item.dia, h.start, 0, 0);
      const fim = new Date(item.ano, item.mes, item.dia, h.end, 0, 0);

      return {
        dataHorarioInicio: inicio.toISOString(),
        dataHorarioFim: fim.toISOString(),
        // Aceita o status vindo do front (confirmado/pendente)
        status: (item.status as 'pendente' | 'confirmado') || 'pendente',
        
        idSala: Number(item.labId), 
        idUsuario: Number(userId),  
        
        idTurma: null, 
        observacao: item.observacao ?? null,
        codigoSerie: item.groupId ?? null,
        disciplina: item.disciplina ?? null 
      };
    });

    await db.insert(agendamentos).values(inserts);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Erro detalhado ao salvar:", error);
    return { success: false, error: String(error) };
  }
}

// --- DELETAR ÚNICO ---
export async function deleteAgendamentoAction(id: number) {
  try {
    await db.delete(agendamentos).where(eq(agendamentos.idAgendamento, id));
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// --- DELETAR SÉRIE INTEIRA (FILTRANDO POR STATUS) ---
// Atualizado para aceitar 'status' e usar 'and()'
export async function deleteSerieAction(codigoSerie: string, status?: string) {
  try {
    if (status) {
        // Se passar status, deleta apenas os itens daquela série com aquele status
        await db.delete(agendamentos)
            .where(
                and(
                    eq(agendamentos.codigoSerie, codigoSerie),
                    eq(agendamentos.status, status as any)
                )
            );
    } else {
        // Fallback: se não passar status (uso antigo), deleta tudo da série
        await db.delete(agendamentos).where(eq(agendamentos.codigoSerie, codigoSerie));
    }
    
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// --- APROVAR ÚNICO ---
export async function approveAgendamentoAction(id: number) {
  try {
    await db
      .update(agendamentos)
      .set({ status: 'confirmado' })
      .where(eq(agendamentos.idAgendamento, id));
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// --- APROVAR SÉRIE INTEIRA ---
export async function approveSerieAction(codigoSerie: string) {
  try {
    await db
      .update(agendamentos)
      .set({ status: 'confirmado' })
      .where(eq(agendamentos.codigoSerie, codigoSerie));
      
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// --- BUSCAR SALAS ---
export async function getSalasAction() {
  try {
    const data = await db
      .select({
        id: salas.idSala,
        nome: salas.descricaoSala,
        codigo: salas.codigoSala
      })
      .from(salas)
      .orderBy(asc(salas.codigoSala));
      
    return data;
  } catch (error) {
    console.error("Erro ao buscar salas:", error);
    return [];
  }
}