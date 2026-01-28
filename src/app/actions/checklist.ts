"use server"

import { db } from "@/db"
import { agendamentos, checklists, checklistItens, equipamentos, salas, usuarios } from "@/db/migrations/schema"
import { eq, and, notExists, desc, sql, inArray } from "drizzle-orm" 
import { revalidatePath } from "next/cache"

export async function getRelatoriosPendentesAction() {
  return await db
    .select({
      id: agendamentos.idAgendamento,
      inicio: agendamentos.dataHorarioInicio,
      docente: usuarios.nome,
      idUsuario: usuarios.idUsuario,
      disciplina: agendamentos.disciplina,
      salaNome: salas.descricaoSala,
      idSala: agendamentos.idSala,
      groupId: agendamentos.codigoSerie 
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
    )
    .orderBy(agendamentos.dataHorarioInicio)
}

export async function getEquipamentosDaSalaAction(idSala: number) {
  return await db.select().from(equipamentos).where(eq(equipamentos.idSala, idSala))
}

type ChecklistPayload = {
  idAgendamento: number; 
  groupId?: string; 
  materialOk: boolean;
  limpezaOk: boolean;
  observacaoGeral: string;
  disciplina?: string | null; 
  itens: any[];
};

export async function salvarChecklistAction(data: ChecklistPayload) {
  try {
    console.log("Salvando status geral do checklist:", { material: data.materialOk, limpeza: data.limpezaOk });

    let idsParaSalvar: number[] = [];

    if (data.groupId) {
        const agendamentosSerie = await db
            .select({ id: agendamentos.idAgendamento })
            .from(agendamentos)
            .where(and(
                eq(agendamentos.codigoSerie, data.groupId),
                eq(agendamentos.status, 'confirmado'),
                notExists(
                    db.select().from(checklists).where(eq(checklists.idAgendamento, agendamentos.idAgendamento))
                )
            ));
        
        idsParaSalvar = agendamentosSerie.map(a => a.id);
    } else {
        const id = Number(data.idAgendamento);
        if (!isNaN(id)) {
            idsParaSalvar = [id];
        }
    }

    if (idsParaSalvar.length === 0) {
        return { success: false, error: "Nenhum agendamento pendente encontrado." };
    }

    for (const idAgendamento of idsParaSalvar) {
        await db
          .insert(checklists)
          .values({
            idAgendamento: idAgendamento,
            materialOk: data.materialOk,
            limpezaOk: data.limpezaOk,
            observacao: data.observacaoGeral || "",
            disciplina: data.disciplina,
            dataChecklist: new Date().toISOString(),
          });
    }

    await db.update(agendamentos)
        .set({ status: 'concluido' }) 
        .where(inArray(agendamentos.idAgendamento, idsParaSalvar));

    revalidatePath("/dashboard/meus-agendamentos");
    revalidatePath("/relatorios");
    return { success: true };

  } catch (error) {
    console.error("Erro ao salvar checklist:", error);
    return { success: false, error: String(error) };
  }
}

export async function getSalasOptionsAction() {
  return await db
    .select({ id: salas.idSala, nome: salas.descricaoSala })
    .from(salas)
    .orderBy(salas.descricaoSala)
}

type HistoricoFilters = {
  search?: string
  data?: string
  idSala?: string
  status?: 'todos' | 'ok' | 'avaria'
}

export async function getHistoricoChecklistsAction(filters?: HistoricoFilters) {
  try {
    const conditions = []

    if (filters?.search) {
      conditions.push(
        sql`(${usuarios.nome} ILIKE ${`%${filters.search}%`} OR ${salas.descricaoSala} ILIKE ${`%${filters.search}%`})`
      )
    }

    if (filters?.idSala && filters.idSala !== "all") {
      conditions.push(eq(salas.idSala, Number(filters.idSala)))
    }

    if (filters?.status && filters.status !== 'todos') {
      const isOk = filters.status === 'ok'
      conditions.push(eq(checklists.materialOk, isOk))
    }

    if (filters?.data) {
      conditions.push(sql`DATE(${checklists.dataChecklist}) = DATE(${filters.data})`)
    }

    return await db
      .select({
        idChecklist: checklists.idChecklist,
        data: checklists.dataChecklist,
        inicio: agendamentos.dataHorarioInicio,
        materialOk: checklists.materialOk,
        limpezaOk: checklists.limpezaOk,
        salaNome: salas.descricaoSala,
        docente: usuarios.nome,
        idAgendamento: agendamentos.idAgendamento,
        groupId: agendamentos.codigoSerie
      })
      .from(checklists)
      .innerJoin(agendamentos, eq(checklists.idAgendamento, agendamentos.idAgendamento))
      .innerJoin(salas, eq(agendamentos.idSala, salas.idSala))
      .innerJoin(usuarios, eq(agendamentos.idUsuario, usuarios.idUsuario))
      .where(and(...conditions))
      .orderBy(desc(checklists.dataChecklist))
      .limit(50);
  } catch (e) {
    console.error(e)
    return [];
  }
}

export async function getDetalhesDoChecklistAction(idChecklist: number) {
  try {
    const checklistData = await db
      .select({ 
        observacaoGeral: checklists.observacao,
        limpezaOk: checklists.limpezaOk,
        materialOk: checklists.materialOk
      })
      .from(checklists)
      .where(eq(checklists.idChecklist, idChecklist))
      .limit(1);

    if (!checklistData.length) throw new Error("Checklist não encontrado");

    return {
      observacaoGeral: checklistData[0].observacaoGeral ?? "",
      limpezaOk: checklistData[0].limpezaOk,
      materialOk: checklistData[0].materialOk,
      itens: []
    };

  } catch (e) {
    console.error("Erro na action getDetalhes:", e);
    throw new Error("Falha interna ao buscar detalhes."); 
  }
}