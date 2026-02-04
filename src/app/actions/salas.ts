"use server"

import { db } from "@/db";
import { salas, areas, unidades } from "@/db/migrations/schema"; 
import { asc, eq, ilike, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// --- 1. BUSCAR OPÇÕES PARA OS SELECTS ---

export async function getAreasOptionsAction() {
  try {
    const data = await db.select({
      id: areas.idArea,
      nome: areas.descricaoArea
    }).from(areas).orderBy(asc(areas.descricaoArea));
    return data;
  } catch (error) {
    console.error("Erro ao buscar áreas:", error);
    return [];
  }
}

export async function getUnidadesOptionsAction() {
  try {
    const data = await db.select({
      id: unidades.idUnidade,
      nome: unidades.descricaoUnidade
    }).from(unidades).orderBy(asc(unidades.descricaoUnidade));
    return data;
  } catch (error) {
    console.error("Erro ao buscar unidades:", error);
    return [];
  }
}

// --- 2. LISTAGEM DE SALAS ---

export async function getSalasAction(term?: string) {
  try {
    let query = db.select().from(salas).$dynamic(); 

    if (term) {
      query = query.where(
        or(
          ilike(salas.descricaoSala, `%${term}%`), 
          ilike(salas.codigoSala, `%${term}%`)     
        )
      );
    }

    const data = await query.orderBy(asc(salas.descricaoSala));

    return data.map(sala => ({
      id: sala.idSala,
      nome: sala.descricaoSala,
      codigo: sala.codigoSala,
      capacidade: sala.capacidade,
      // Novos campos mapeados para o frontend
      idArea: sala.idArea,
      idUnidade: sala.idUnidade,
      status: sala.status
    }));
  } catch (error) {
    console.error("Erro ao buscar salas:", error);
    return [];
  }
}

// --- 3. ATUALIZAÇÃO ---

interface UpdateSalaDTO {
    nome: string;
    codigo: string;
    capacidade: number;
    idArea: number;
    idUnidade: number;
    status: boolean;
}

export async function updateSalaAction(id: number, data: UpdateSalaDTO) {
  try {
    await db
      .update(salas)
      .set({
        descricaoSala: data.nome,
        codigoSala: data.codigo,
        capacidade: data.capacidade,
        idArea: data.idArea,
        idUnidade: data.idUnidade,
        status: data.status
      })
      .where(eq(salas.idSala, id));

    // Revalida a página para mostrar os dados novos
    revalidatePath("/cadastroSalas/exibirSalas");
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar sala:", error);
    return { success: false, error: "Erro ao atualizar dados da sala. Verifique os campos." };
  }
}

interface CreateSalaDTO {
    nome: string;
    codigo: string;
    capacidade: number;
    idArea: number;
    idUnidade: number;
}

export async function createSalaAction(data: CreateSalaDTO) {
  try {
    await db.insert(salas).values({
      descricaoSala: data.nome,
      codigoSala: data.codigo,
      capacidade: data.capacidade,
      idArea: data.idArea,
      idUnidade: data.idUnidade,
      status: true // Padrão ativo ao criar
    });

    revalidatePath("/cadastroSalas/exibirSalas");
    return { success: true };
  } catch (error) {
    console.error("Erro ao criar sala:", error);
    return { success: false, error: "Erro ao cadastrar sala." };
  }
}
// --- 4. EXCLUSÃO ---

export async function deleteSalaAction(id: number) {
  try {
    await db.delete(salas).where(eq(salas.idSala, id));
    
    revalidatePath("/cadastroSalas/exibirSalas");
    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar sala:", error);
    // Retorna erro amigável, geralmente por violação de Foreign Key (agendamentos existentes)
    return { success: false, error: "Não foi possível excluir. Verifique se há agendamentos ou equipamentos vinculados a esta sala." };
  }
}