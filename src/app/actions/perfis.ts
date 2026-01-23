"use server"

import { db } from "@/db";
import { perfis } from "@/db/migrations/schema"; 
import { asc, eq, ilike, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type FiltrosPerfil = {
  term?: string;
  type?: string;
}

export async function getPerfisAction(filtros?: FiltrosPerfil) {
  try {
    let query = db.select().from(perfis).$dynamic();
    
    const conditions = [];

    if (filtros?.term) {
      conditions.push(ilike(perfis.descricaoPerfil, `%${filtros.term}%`));
    }

    if (filtros?.type && filtros.type !== "all") {
      const isAdmin = filtros.type === "admin";
      conditions.push(eq(perfis.isAdmin, isAdmin));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const data = await query.orderBy(asc(perfis.descricaoPerfil));
    
    return data.map(p => ({
        id: Number(p.idPerfil),
        descricao: p.descricaoPerfil,
        isAdmin: p.isAdmin
    }));

  } catch (error) {
    console.error("Erro ao buscar perfis:", error);
    return [];
  }
}

export async function updatePerfilAction(id: number, data: { descricao: string; isAdmin: boolean }) {
  try {
    await db
      .update(perfis)
      .set({
        descricaoPerfil: data.descricao,
        isAdmin: data.isAdmin
      })
      .where(eq(perfis.idPerfil, id));

    revalidatePath("/dashboard/perfis");
    
    return { success: true };
    
  } catch (error) {
    return { success: false, error: "Erro ao atualizar perfil." };
  }
}

export async function deletePerfilAction(id: number) {
  try {
    await db.delete(perfis).where(eq(perfis.idPerfil, id));
    revalidatePath("/dashboard/perfis");
    
    return { success: true };
    
  } catch (error) {
    return { success: false, error: "Não é possível excluir este perfil pois existem usuários vinculados a ele." };
  }
}