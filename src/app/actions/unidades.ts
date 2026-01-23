"use server"

import { db } from "@/db";
import { unidades } from "@/db/migrations/schema"; 
import { asc, eq, ilike } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getUnidadesAction(term?: string) {
  try {
    let query = db.select().from(unidades).$dynamic();

    if (term) {
      query = query.where(ilike(unidades.descricaoUnidade, `%${term}%`));
    }

    const data = await query.orderBy(asc(unidades.idUnidade));

    return data.map(u => ({
      id: Number(u.idUnidade),
      descricao: u.descricaoUnidade,
    }));
  } catch (error) {
    console.error("Erro ao buscar unidades:", error);
    return [];
  }
}

export async function updateUnidadeAction(id: number, descricao: string) {
  try {
    await db
      .update(unidades)
      .set({ descricaoUnidade: descricao })
      .where(eq(unidades.idUnidade, id));

    revalidatePath("/dashboard/unidades");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Erro ao atualizar unidade." };
  }
}

export async function deleteUnidadeAction(id: number) {
  try {
    await db.delete(unidades).where(eq(unidades.idUnidade, id));
    revalidatePath("/dashboard/unidades");
    return { success: true };
  } catch (error) {
    
    return { success: false, error: "Não é possível excluir: existem registros (salas/usuários) vinculados a esta unidade." };
  }
}