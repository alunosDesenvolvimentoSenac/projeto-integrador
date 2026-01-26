"use server"

import { db } from "@/db"; // Certifique-se que seu 'db' é inicializado com { schema }
import { salas, equipamentos } from "@/db/migrations/schema"; // Ajuste o caminho se necessário
import { asc, eq, ilike, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getSalasAction(term?: string) {
  try {
    // Usamos 'db.query' (Relational Query API) para facilitar trazer dados aninhados
    const data = await db.query.salas.findMany({
      // AQUI A MÁGICA: Traz os equipamentos vinculados automaticamente
      with: {
        equipamentos: true, 
      },
      // Filtro de busca
      where: term ? (salas, { or, ilike }) => or(
          ilike(salas.descricaoSala, `%${term}%`),
          ilike(salas.codigoSala, `%${term}%`)
      ) : undefined,
      // Ordenação
      orderBy: (salas, { asc }) => [asc(salas.descricaoSala)],
    });

    // Mapeamos para o formato que o frontend espera
    return data.map(sala => ({
      id: sala.idSala,
      nome: sala.descricaoSala,
      codigo: sala.codigoSala,
      capacidade: sala.capacidade,
      equipamentos: sala.equipamentos // Agora isso existe e é um array
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
    console.error("Erro delete sala:", error);
    return { success: false, error: "Não foi possível excluir. Verifique se há agendamentos ou equipamentos vinculados." };
  }
}