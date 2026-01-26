"use server"

import { db } from "@/db";
import { agendamentos, usuarios, salas, equipamentos, checklists, checklistItens } from "@/db/migrations/schema"; 
import { asc, eq, and, notExists } from "drizzle-orm"; 
import { revalidatePath } from "next/cache";

const HORARIOS = {
  Manhã: { start: 8, end: 12 },
  Tarde: { start: 13, end: 17 },
  Noite: { start: 19, end: 23 },
};

// ==========================================================
// --- ACTIONS DO DASHBOARD (NÃO APAGUE ESTAS) ---
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
    const inserts = items.map(item => {
      const h = HORARIOS[item.periodo as keyof typeof HORARIOS] || HORARIOS['Manhã'];
      const inicio = new Date(item.ano, item.mes, item.dia, h.start, 0, 0);
      const fim = new Date(item.ano, item.mes, item.dia, h.end, 0, 0);

      return {
        dataHorarioInicio: inicio.toISOString(),
        dataHorarioFim: fim.toISOString(),
        status: (['pendente', 'confirmado', 'concluido'].includes(item.status) ? item.status : 'pendente') as any,
        idSala: Number(item.labId), 
        idUsuario: Number(userId),  
        observacao: item.observacao || null,
        codigoSerie: item.groupId || null,
        disciplina: item.disciplina || null,
      };
    });

    await db.insert(agendamentos).values(inserts);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
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

// ==========================================================
// --- ACTIONS NOVAS (PARA O RELATÓRIO/CHECKLIST) ---
// ==========================================================

export async function getRelatoriosPendentesAction() {
  try {
    return await db
      .select({
        id: agendamentos.idAgendamento,
        inicio: agendamentos.dataHorarioInicio,
        docente: usuarios.nome,
        disciplina: agendamentos.disciplina,
        salaNome: salas.descricaoSala,
        idSala: agendamentos.idSala
      })
      .from(agendamentos)
      .innerJoin(usuarios, eq(agendamentos.idUsuario, usuarios.idUsuario))
      .innerJoin(salas, eq(agendamentos.idSala, salas.idSala))
      .where(
        and(
          eq(agendamentos.status, 'confirmado'),
          notExists(
            db.select().from(checklists).where(eq(checklists.idAgendamento, agendamentos.idAgendamento))
          )
        )
      );
  } catch (e) { return []; }
}

export async function getEquipamentosDaSalaAction(idSala: number) {
  return await db.select().from(equipamentos).where(eq(equipamentos.idSala, idSala));
}

export async function salvarChecklistCompletoAction(idAgendamento: number, materialOk: boolean, itens: any[]) {
  try {
    return await db.transaction(async (tx) => {
      const [checklist] = await tx.insert(checklists).values({
        idAgendamento: idAgendamento,
        materialOk: materialOk,
      }).returning();

      const valuesParaInserir = itens.map(it => ({
        idChecklist: checklist.idChecklist,
        idEquipamento: it.idEquipamento,
        quantidadeCorreta: it.quantidadeCorreta,
        possuiAvaria: it.possuiAvaria,
        detalhesAvaria: it.detalhesAvaria,
        observacao: it.observacao
      }));

      await tx.insert(checklistItens).values(valuesParaInserir);

      await tx.update(agendamentos).set({ status: 'concluido' }).where(eq(agendamentos.idAgendamento, idAgendamento));

      revalidatePath("/dashboard");
      return { success: true };
    });
  } catch (e) {
    return { success: false, error: String(e) };
  }
}