'use server'

import { db } from "@/db";
import { agendamentos, salas, usuarios, turmas, perfis } from "@/db/migrations/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
// Adicione 'differenceInCalendarDays' nas importações
import { addDays, isWeekend, differenceInCalendarDays } from "date-fns";

// --- CONFIGURAÇÃO DOS TURNOS ---
const TURNOS = {
  "Manhã": { start: "07:00", end: "12:00" },
  "Tarde": { start: "13:00", end: "18:00" },
  "Noite": { start: "19:00", end: "22:00" }
};

// --- LEITURA (MANTENHA IGUAL) ---
export async function listarSalas() {
  try {
    const result = await db.select({
      id: salas.idSala,
      nome: salas.descricaoSala,
      codigo: salas.codigoSala // <--- Buscando o código
    })
    .from(salas)
    .orderBy(salas.descricaoSala);
    return result;
  } catch (error) {
    console.error("Erro ao listar salas:", error);
    return [];
  }
}

// --- LEITURA ---
export async function buscarAgendamentosDoMes(mes: number, ano: number, idSala: number) {
  try {
    const inicioMes = new Date(ano, mes, 1).toISOString();
    const fimMes = new Date(ano, mes + 1, 0, 23, 59, 59).toISOString();

    const dados = await db.select({
      id: agendamentos.idAgendamento,
      dataInicio: agendamentos.dataHorarioInicio,
      dataFim: agendamentos.dataHorarioFim,
      status: agendamentos.status,
      docente: usuarios.nome,
      // Agora pegamos direto da tabela agendamentos, já que é texto livre
      disciplina: agendamentos.disciplina,
      observacao: agendamentos.observacao
    })
    .from(agendamentos)
    .innerJoin(usuarios, eq(agendamentos.idUsuario, usuarios.idUsuario))
    .where(
      and(
        eq(agendamentos.idSala, idSala),
        gte(agendamentos.dataHorarioInicio, inicioMes),
        lte(agendamentos.dataHorarioInicio, fimMes)
      )
    );

    return dados.map(item => {
      const hora = new Date(item.dataInicio).getUTCHours(); 
      let periodo: "Manhã" | "Tarde" | "Noite" = "Manhã";
      if (hora >= 12 && hora < 18) periodo = "Tarde";
      if (hora >= 18) periodo = "Noite";

      return {
        ...item,
        periodo,
        // Fallback visual se estiver vazio
        disciplina: item.disciplina || "Sem disciplina informada" 
      };
    });

  } catch (error) {
    console.error("Erro busca:", error);
    return [];
  }
}


// --- ESCRITA ---
export async function salvarAgendamento(data: {
  dateRange: { from: Date, to: Date },
  periodo: "Manhã" | "Tarde" | "Noite",
  idSala: number,
  uidUsuario: string, 
  // Recebendo os dois campos
  disciplina: string, 
  observacao: string 
}) {
  try {
    // 1. Identificar Usuário
    const usuarioInfo = await db.select({
        idUsuario: usuarios.idUsuario,
        isAdmin: perfis.isAdmin
    })
    .from(usuarios)
    .innerJoin(perfis, eq(usuarios.idPerfil, perfis.idPerfil))
    .where(eq(usuarios.uidFirebase, data.uidUsuario))
    .limit(1);

    if (!usuarioInfo[0]) return { success: false, message: "Usuário não encontrado." };

    const { idUsuario, isAdmin } = usuarioInfo[0];
    const statusInicial = isAdmin ? "confirmado" : "pendente";

    // 2. Loop de Datas
    const horarioDefinido = TURNOS[data.periodo];
    const diasTotais = differenceInCalendarDays(data.dateRange.to || data.dateRange.from, data.dateRange.from);
    const promisesDeInsercao = [];

    for (let i = 0; i <= diasTotais; i++) {
        const dataAtual = addDays(data.dateRange.from, i);

        if (!isWeekend(dataAtual)) {
            const ano = dataAtual.getFullYear();
            const mes = String(dataAtual.getMonth() + 1).padStart(2, '0');
            const dia = String(dataAtual.getDate()).padStart(2, '0');
            const dataBaseISO = `${ano}-${mes}-${dia}`;

            promisesDeInsercao.push(
                db.insert(agendamentos).values({
                    idSala: data.idSala,
                    idUsuario: idUsuario,
                    dataHorarioInicio: new Date(`${dataBaseISO}T${horarioDefinido.start}:00`).toISOString(),
                    dataHorarioFim: new Date(`${dataBaseISO}T${horarioDefinido.end}:00`).toISOString(),
                    status: statusInicial,
                    idTurma: null, // Importante ser null
                    // Salvando os inputs
                    disciplina: data.disciplina || null,
                    observacao: data.observacao || null
                })
            );
        }
    }

    if (promisesDeInsercao.length === 0) return { success: false, message: "Datas inválidas." };

    await Promise.all(promisesDeInsercao);
    revalidatePath("/dashboard");
    
    return { success: true, message: "Agendamento realizado com sucesso!" };

  } catch (error: any) {
    console.error("Erro ao salvar:", error);
    if (error.code === '23P01') return { success: false, message: "Conflito de horário." };
    return { success: false, message: "Erro interno." };
  }
}

export async function responderSolicitacao(
  idAgendamento: number, 
  acao: "aprovar" | "rejeitar", 
  uidUsuarioLogado: string
) {
  try {
    // 1. Verifica segurança: O usuário logado é ADMIN?
    const adminCheck = await db.select({ isAdmin: perfis.isAdmin })
      .from(usuarios)
      .innerJoin(perfis, eq(usuarios.idPerfil, perfis.idPerfil))
      .where(eq(usuarios.uidFirebase, uidUsuarioLogado))
      .limit(1);

    if (!adminCheck[0] || !adminCheck[0].isAdmin) {
        return { success: false, message: "Sem permissão." };
    }

    // 2. Executa a ação
    if (acao === "aprovar") {
        await db.update(agendamentos)
            .set({ status: 'confirmado' })
            .where(eq(agendamentos.idAgendamento, idAgendamento));
            
        revalidatePath("/dashboard");
        return { success: true, message: "Agendamento confirmado!" };
    } 
    else {
        // Se rejeitar, EXCLUI o registro para liberar o horário (conforme sua regra anterior)
        await db.delete(agendamentos)
            .where(eq(agendamentos.idAgendamento, idAgendamento));
            
        revalidatePath("/dashboard");
        return { success: true, message: "Solicitação rejeitada e removida." };
    }

  } catch (error) {
    console.error(error);
    return { success: false, message: "Erro ao processar solicitação." };
  }
}

export async function excluirAgendamento(
  idAgendamento: number, 
  uidUsuarioLogado: string
) {
  try {
    // 1. Verifica se é Admin
    const adminCheck = await db.select({ isAdmin: perfis.isAdmin })
      .from(usuarios)
      .innerJoin(perfis, eq(usuarios.idPerfil, perfis.idPerfil))
      .where(eq(usuarios.uidFirebase, uidUsuarioLogado))
      .limit(1);

    if (!adminCheck[0] || !adminCheck[0].isAdmin) {
        return { success: false, message: "Apenas administradores podem excluir agendamentos confirmados." };
    }

    // 2. Deleta o registro
    await db.delete(agendamentos)
        .where(eq(agendamentos.idAgendamento, idAgendamento));
        
    revalidatePath("/dashboard");
    return { success: true, message: "Agendamento excluído do sistema." };

  } catch (error) {
    console.error("Erro ao excluir:", error);
    return { success: false, message: "Erro ao tentar excluir." };
  }
}