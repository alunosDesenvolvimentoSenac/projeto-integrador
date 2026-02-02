"use server"

import { db } from "@/db";
import { agendamentos, usuarios, salas, checklists } from "@/db/migrations/schema"; 
import { asc, eq, and } from "drizzle-orm"; 
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

export async function getUsersOptionsAction() {
  try {
    return await db
      .select({ 
        id: usuarios.idUsuario, 
        nome: usuarios.nome 
      })
      .from(usuarios)
      .orderBy(asc(usuarios.nome));
  } catch (error) {
    return [];
  }
}

// --- SALVAR NOVO AGENDAMENTO ---
export async function saveAgendamentoAction(items: any[], targetUserId: number, requesterId: number) {
  try {
    const usuarioRequester = await db
      .select({ idPerfil: usuarios.idPerfil })
      .from(usuarios)
      .where(eq(usuarios.idUsuario, requesterId))
      .limit(1);

    if (!usuarioRequester.length) {
        return { success: false, error: "Usuário solicitante não encontrado." };
    }

    const isAdmin = usuarioRequester[0].idPerfil === 1; 
    
    console.log(`Agendamento - Requester: ${requesterId} (Admin: ${isAdmin}) -> Target: ${targetUserId}`);

    const inserts: any[] = [];

    for (const item of items) {
      const h = HORARIOS[item.periodo as keyof typeof HORARIOS] || HORARIOS['Manhã'];
      const inicio = new Date(item.ano, item.mes, item.dia, h.start, 0, 0);
      const fim = new Date(item.ano, item.mes, item.dia, h.end, 0, 0);

      const dayOfWeek = inicio.getDay(); 
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      if (isWeekend && !isAdmin) {
         continue; 
      }

      inserts.push({
        dataHorarioInicio: inicio.toISOString(),
        dataHorarioFim: fim.toISOString(),
        status: (['pendente', 'confirmado', 'concluido'].includes(item.status) ? item.status : 'pendente') as any,
        idSala: Number(item.labId), 
        idUsuario: Number(targetUserId), 
        observacao: item.observacao || null,
        codigoSerie: item.groupId || null,
        disciplina: item.disciplina || null,
      });
    }

    if (inserts.length === 0) {
        return { success: false, error: "Agendamento não permitido (Fim de semana restrito)." };
    }

    await db.insert(agendamentos).values(inserts);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Falha ao salvar." };
  }
}

// --- EXCLUIR AGENDAMENTO ---
export async function deleteAgendamentoAction(id: number) {
  try {
    // Como não estamos em transação, a ordem importa. 
    // Se o banco não tiver ON DELETE CASCADE configurado na FK, delete o checklist primeiro.
    // Se tiver configurado no schema (como parece ter), pode deletar direto o agendamento.
    await db.delete(checklists).where(eq(checklists.idAgendamento, id)); // Garante a exclusão
    await db.delete(agendamentos).where(eq(agendamentos.idAgendamento, id));
    
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) { return { success: false, error: String(error) }; }
}

export async function deleteSerieAction(codigoSerie: string, status?: string) {
  try {
    // Busca IDs para deletar checklists manualmente (segurança contra falta de transaction)
    const agendamentosDaSerie = await db.select({ id: agendamentos.idAgendamento })
        .from(agendamentos)
        .where(eq(agendamentos.codigoSerie, codigoSerie));
    
    for (const ag of agendamentosDaSerie) {
        await db.delete(checklists).where(eq(checklists.idAgendamento, ag.id));
    }

    if (status) await db.delete(agendamentos).where(and(eq(agendamentos.codigoSerie, codigoSerie), eq(agendamentos.status, status as any)));
    else await db.delete(agendamentos).where(eq(agendamentos.codigoSerie, codigoSerie));
    
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) { return { success: false, error: String(error) }; }
}

// --- APROVAÇÃO (CORRIGIDO: REMOVIDO TRANSACTION) ---
export async function approveAgendamentoAction(id: number) {
  try {
    // 1. Atualiza status do agendamento para Confirmado
    await db.update(agendamentos)
        .set({ status: 'confirmado' })
        .where(eq(agendamentos.idAgendamento, id));
    
    // 2. Verifica se checklist existe
    const exists = await db.select().from(checklists).where(eq(checklists.idAgendamento, id));
    
    // 3. Se não existe, CRIA com status 'aberto'
    if (exists.length === 0) {
        await db.insert(checklists).values({
            idAgendamento: id,
            status: 'aberto', 
            materialOk: true,
            limpezaOk: true,
            observacao: '',
            dataChecklist: new Date().toISOString()
        });
    }
    
    revalidatePath("/dashboard");
    revalidatePath("/solicitacoesAgendamentos"); // Adicionei o path que você mostrou no log
    return { success: true };

  } catch (error) { 
      console.error("Erro ao aprovar:", error);
      return { success: false, error: String(error) }; 
  }
}

// --- APROVAÇÃO EM SÉRIE (CORRIGIDO: REMOVIDO TRANSACTION) ---
export async function approveSerieAction(codigoSerie: string) {
  try {
    const items = await db.select({ id: agendamentos.idAgendamento })
        .from(agendamentos)
        .where(eq(agendamentos.codigoSerie, codigoSerie));

    // 1. Aprova todos
    await db.update(agendamentos)
        .set({ status: 'confirmado' })
        .where(eq(agendamentos.codigoSerie, codigoSerie));

    // 2. Cria checklists 'aberto' para todos
    for (const item of items) {
        const exists = await db.select().from(checklists).where(eq(checklists.idAgendamento, item.id));
        if (exists.length === 0) {
            await db.insert(checklists).values({
                idAgendamento: item.id,
                status: 'aberto',
                materialOk: true,
                limpezaOk: true,
                observacao: '',
                dataChecklist: new Date().toISOString()
            });
        }
    }

    revalidatePath("/dashboard");
    revalidatePath("/solicitacoesAgendamentos");
    return { success: true };
  } catch (error) { return { success: false, error: String(error) }; }
}

export async function getSalasAction() {
  try {
    const data = await db.select({ id: salas.idSala, nome: salas.descricaoSala, codigo: salas.codigoSala }).from(salas).orderBy(asc(salas.codigoSala));
    console.log("Salas encontradas no banco:", data.length);
    return data.map(s => ({ ...s, id: Number(s.id) }));
  } catch (error) { 
    console.error("ERRO CRÍTICO AO BUSCAR SALAS:", error);
    return []; 
  }
}