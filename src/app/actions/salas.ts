"use server"

import { db } from "@/db";
import { salas } from "@/db/migrations/schema"; 
import { asc, eq, ilike, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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
      capacidade: sala.capacidade 
    }));
  } catch (error) {
    console.error("Erro ao buscar salas:", error);
    return [];
  }
}

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
  } catch (error) {
    return { success: false, error: "Não foi possível excluir. Verifique se há agendamentos vinculados." };
  }
}