"use server"

import { db } from "@/db";
import { salas, equipamentos } from "@/db/migrations/schema"; 
import { asc, eq, ilike, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// --- BUSCAR SALAS ---
export async function getSalasAction(term?: string) {
  try {
    let query = db.select().from(salas);

    if (term) {
      query.where(
        or(
          ilike(salas.descricaoSala, `%${term}%`),
          ilike(salas.codigoSala, `%${term}%`)
        )
      );
    }

    const salasResult = await query.orderBy(asc(salas.descricaoSala));
    const equipamentosResult = await db.select().from(equipamentos);
    const formatted = salasResult.map((sala) => {
    const equipsDaSala = equipamentosResult.filter(e => e.idSala === sala.idSala);

      return {
        id: sala.idSala,
        nome: sala.descricaoSala,
        codigo: sala.codigoSala,
        capacidade: sala.capacidade,
        equipamentos: equipsDaSala.map(e => ({
          idEquipamento: e.idEquipamento,
          descricao: e.descricao,
          quantidade: e.quantidade,
          ativo: e.ativo
        }))
      };
    });

    return formatted;
  } catch (error) {
    console.error("Erro ao buscar salas:", error);
    return [];
  }
}

// --- ATUALIZAR SALA ---
export async function updateSalaAction(id: number, data: { nome: string; codigo: string; capacidade: number }) {
  try {
    await db
      .update(salas)
      .set({
        descricaoSala: data.nome,
        codigoSala: data.codigo,
        capacidade: data.capacidade 
      })
      .where(eq(salas.idSala, id));

    revalidatePath("/dashboard/salas");
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar sala:", error);
    return { success: false, error: "Erro ao atualizar dados da sala." };
  }
}

export async function deleteSalaAction(id: number) {
  try {
    await db.delete(salas).where(eq(salas.idSala, id));
    
    revalidatePath("/dashboard/salas");
    return { success: true };
  } catch (error: any) {
    console.error("Erro delete sala:", error);
    
    if (error.code === '23503') {
        return { success: false, error: "Não é possível excluir: existem equipamentos ou agendamentos vinculados a esta sala." };
    }

    return { success: false, error: "Erro ao excluir sala." };
  }
}