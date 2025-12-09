export type Periodo = "Manhã" | "Tarde" | "Noite";

// Tipo retornado pelo banco (Agendamento + Dados relacionados)
export interface AgendamentoComDetalhes {
  id: number;
  dataInicio: string; // Vem como string do Drizzle mode: 'string'
  dataFim: string;
  status: "pendente" | "confirmado" | "concluido";
  docente: string;    // Vem do join com tabela usuarios
  disciplina: string; // Vem do join com turmas (ou placeholder)
  periodo: Periodo;   // Calculado via código baseado na hora
}

export interface Sala {
  id: number;
  nome: string;
}