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
  "Noite": { start: "19:00", end: "22:30" }
};

// --- LEITURA (MANTENHA IGUAL) ---
export async function listarSalas() {
  /* ... (código anterior mantido) ... */
  try {
    const result = await db.select({
      id: salas.idSala,
      nome: salas.descricaoSala
    })
    .from(salas)
    .orderBy(salas.descricaoSala);
    return result;
  } catch (error) {
    return [];
  }
}

export async function buscarAgendamentosDoMes(mes: number, ano: number, idSala: number) {
  /* ... (código anterior mantido) ... */
  try {
    const inicioMes = new Date(ano, mes, 1).toISOString();
    const fimMes = new Date(ano, mes + 1, 0, 23, 59, 59).toISOString();

    const dados = await db.select({
      id: agendamentos.idAgendamento,
      dataInicio: agendamentos.dataHorarioInicio,
      dataFim: agendamentos.dataHorarioFim,
      status: agendamentos.status,
      docente: usuarios.nome,
      disciplina: turmas.descricaoTurma 
    })
    .from(agendamentos)
    .innerJoin(usuarios, eq(agendamentos.idUsuario, usuarios.idUsuario))
    .leftJoin(turmas, eq(agendamentos.idTurma, turmas.idTurma))
    .where(
      and(
        eq(agendamentos.idSala, idSala),
        gte(agendamentos.dataHorarioInicio, inicioMes),
        lte(agendamentos.dataHorarioInicio, fimMes)
      )
    );

    return dados.map(item => {
      const hora = new Date(item.dataInicio).getUTCHours(); // Use UTC para consistência
      let periodo: "Manhã" | "Tarde" | "Noite" = "Manhã";
      
      if (hora >= 12 && hora < 18) periodo = "Tarde";
      if (hora >= 18) periodo = "Noite";

      return {
        ...item,
        periodo,
        disciplina: item.disciplina || "Reserva de Horário" 
      };
    });

  } catch (error) {
    return [];
  }
}

// --- ESCRITA (CORRIGIDA) ---

export async function salvarAgendamento(data: {
  dateRange: { from: Date, to: Date },
  periodo: "Manhã" | "Tarde" | "Noite",
  idSala: number,
  uidUsuario: string, 
  disciplina: string 
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

    if (!usuarioInfo[0]) {
        return { success: false, message: "Usuário não encontrado." };
    }

    const { idUsuario, isAdmin } = usuarioInfo[0];
    const statusInicial = isAdmin ? "confirmado" : "pendente";

    // 2. Lógica de Loop Robusta (Baseada em dias corridos)
    const horarioDefinido = TURNOS[data.periodo];
    
    // Calcula quantos dias existem entre o início e o fim (Ex: 8 a 12 = 4 dias de diferença)
    // Se from e to forem iguais, diferença é 0.
    const diasTotais = differenceInCalendarDays(
        data.dateRange.to || data.dateRange.from, 
        data.dateRange.from
    );

    const promisesDeInsercao = [];

    // Loop de 0 até diasTotais (garante inclusão do último dia)
    for (let i = 0; i <= diasTotais; i++) {
        
        // Calcula a data atual somando 'i' dias à data inicial
        const dataAtual = addDays(data.dateRange.from, i);

        // Pula fins de semana
        if (!isWeekend(dataAtual)) {
            
            // Formata data YYYY-MM-DD
            const ano = dataAtual.getFullYear();
            const mes = String(dataAtual.getMonth() + 1).padStart(2, '0');
            const dia = String(dataAtual.getDate()).padStart(2, '0');
            const dataBaseISO = `${ano}-${mes}-${dia}`;

            // Cria horários
            const inicioISO = new Date(`${dataBaseISO}T${horarioDefinido.start}:00`).toISOString();
            const fimISO = new Date(`${dataBaseISO}T${horarioDefinido.end}:00`).toISOString();

            promisesDeInsercao.push(
                db.insert(agendamentos).values({
                    idSala: data.idSala,
                    idUsuario: idUsuario,
                    dataHorarioInicio: inicioISO,
                    dataHorarioFim: fimISO,
                    status: statusInicial,
                })
            );
        }
    }

    if (promisesDeInsercao.length === 0) {
        return { success: false, message: "Nenhum dia válido selecionado (FDS ignorado)." };
    }

    // Executa tudo
    await Promise.all(promisesDeInsercao);

    revalidatePath("/dashboard");
    
    return { 
        success: true, 
        message: isAdmin 
            ? "Agendamento(s) realizado(s) com sucesso!" 
            : "Sua solicitação foi enviada!" 
    };

  } catch (error: any) {
    console.error("Erro ao salvar:", error);
    
    if (error.code === '23P01') {
      return { success: false, message: "Conflito: Já existe agendamento neste horário." };
    }

    return { success: false, message: "Erro interno ao processar agendamento." };
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