"use server"

import { db } from "@/db";
import { equipamentos, salas } from "@/db/migrations/schema"; 
import { asc, eq, ilike, and, gt, gte, lt } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type FiltrosEquipamento = {
  term?: string;
  salaId?: string;
  status?: string;
  estoque?: string;
}

export async function getEquipamentosAction(filtros?: FiltrosEquipamento) {
  try {
    let query = db
      .select({
        id: equipamentos.idEquipamento,
        descricao: equipamentos.descricao,
        quantidade: equipamentos.quantidade,
        ativo: equipamentos.ativo,
        observacao: equipamentos.observacao,
        idSala: equipamentos.idSala,
        nomeSala: salas.descricaoSala,
        codigoSala: salas.codigoSala
      })
      .from(equipamentos)
      .innerJoin(salas, eq(equipamentos.idSala, salas.idSala))
      .$dynamic();

    const conditions = [];

    if (filtros?.term) {
      conditions.push(ilike(equipamentos.descricao, `%${filtros.term}%`));
    }

    if (filtros?.salaId && filtros.salaId !== "all") {
      conditions.push(eq(equipamentos.idSala, Number(filtros.salaId)));
    }

    if (filtros?.status && filtros.status !== "all") {
      const isAtivo = filtros.status === "ativo";
      conditions.push(eq(equipamentos.ativo, isAtivo));
    }

    if (filtros?.estoque && filtros.estoque !== "all") {
      if (filtros.estoque === "sem") {
        conditions.push(eq(equipamentos.quantidade, 0));
      } else if (filtros.estoque === "baixo") {

        conditions.push(and(gt(equipamentos.quantidade, 0), lt(equipamentos.quantidade, 5)));
      } else if (filtros.estoque === "normal") {

        conditions.push(gte(equipamentos.quantidade, 5));
      }
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const data = await query.orderBy(asc(equipamentos.descricao));

    return data.map(e => ({
      ...e,
      id: Number(e.id),
      idSala: Number(e.idSala)
    }));
  } catch (error) {
    console.error("Erro ao buscar equipamentos:", error);
    return [];
  }
}

export async function updateEquipamentoAction(id: number, data: any) {
  try {
    await db.update(equipamentos).set(data).where(eq(equipamentos.idEquipamento, id));
    revalidatePath("/dashboard/equipamentos");
    return { success: true };
  } catch (error) { return { success: false, error: "Erro ao atualizar." }; }
}

export async function deleteEquipamentoAction(id: number) {
  try {
    await db.delete(equipamentos).where(eq(equipamentos.idEquipamento, id));
    revalidatePath("/dashboard/equipamentos");
    return { success: true };
  } catch (error) { return { success: false, error: "Erro ao excluir." }; }
}

export async function getSalasOptionsAction() {
    return await db.select({
        id: salas.idSala,
        nome: salas.descricaoSala,
        codigo: salas.codigoSala
    }).from(salas).orderBy(asc(salas.descricaoSala));
}