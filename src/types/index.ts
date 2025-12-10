export type Periodo = "Manhã" | "Tarde" | "Noite";

export interface AgendamentoComDetalhes {
  id: number;
  dataInicio: string;
  dataFim: string;
  status: "pendente" | "confirmado" | "concluido";
  docente: string;
  periodo: Periodo;
  // Novos campos (podem ser null)
  disciplina: string | null; 
  observacao: string | null;
}

export interface Sala {
  id: number;
  nome: string;
  codigo: string;
}