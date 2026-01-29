"use server"

import { db } from "@/db";
import { usuarios, perfis } from "@/db/migrations/schema"; 
import { asc, eq, ilike, or, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type FiltrosUsuario = {
  term?: string;
  perfil?: string;
  status?: string;
}

export async function getUsuariosAction(filtros?: FiltrosUsuario) {
  try {
    let query = db
      .select({
        id: usuarios.idUsuario,
        nome: usuarios.nome,
        email: usuarios.email,
        ativo: usuarios.ativo,
        idPerfil: usuarios.idPerfil,
        nomePerfil: perfis.descricaoPerfil,
        departamento: usuarios.departamento // 1. ADICIONADO AQUI
      })
      .from(usuarios)
      .leftJoin(perfis, eq(usuarios.idPerfil, perfis.idPerfil))
      .$dynamic();

    const conditions = [];

    if (filtros?.term) {
      conditions.push(
        or(
          ilike(usuarios.nome, `%${filtros.term}%`),
          ilike(usuarios.email, `%${filtros.term}%`)
        )
      );
    }

    if (filtros?.perfil && filtros.perfil !== "all") {
      conditions.push(eq(usuarios.idPerfil, Number(filtros.perfil)));
    }

    if (filtros?.status && filtros.status !== "all") {
      const isAtivo = filtros.status === "ativo";
      conditions.push(eq(usuarios.ativo, isAtivo));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const data = await query.orderBy(asc(usuarios.nome));
    return data;

  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return [];
  }
}

// 2. ATUALIZADO A ASSINATURA DA FUNÇÃO E O UPDATE
export async function updateUsuarioAction(id: number, data: { 
    nome: string; 
    email: string; 
    idPerfil: number; 
    departamento?: string | null 
}) {
  try {
    await db
      .update(usuarios)
      .set({
        nome: data.nome,
        email: data.email,
        idPerfil: data.idPerfil,
        departamento: data.departamento // Inserido no banco
      })
      .where(eq(usuarios.idUsuario, id));

    // Revalida a página para atualizar a tabela imediatamente
    revalidatePath("/cadastroUsuarios/exibirUsuarios");
    
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return { success: false, error: "Erro ao atualizar usuário." };
  }
}

export async function toggleStatusUsuarioAction(id: number, novoStatus: boolean) {
  try {
    await db
      .update(usuarios)
      .set({ ativo: novoStatus })
      .where(eq(usuarios.idUsuario, id));

    revalidatePath("/cadastroUsuarios/exibirUsuarios");
    return { success: true };
  } catch (error) {
    console.error("Erro ao alterar status:", error);
    return { success: false, error: "Erro ao alterar status do usuário." };
  }
}

export async function deleteUsuarioAction(id: number) {
  try {
    await db.delete(usuarios).where(eq(usuarios.idUsuario, id));
    revalidatePath("/cadastroUsuarios/exibirUsuarios");
    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar usuário:", error);
    return { success: false, error: "Não foi possível excluir o usuário." };
  }
}

export async function getPerfisOptionsAction() {
    return await db.select().from(perfis);
}