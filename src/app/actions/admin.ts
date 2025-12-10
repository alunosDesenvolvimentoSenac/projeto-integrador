'use server'

import { db } from "@/db";
import { usuarios, unidades, perfis } from "@/db/migrations/schema";
import { eq } from "drizzle-orm";

// 1. Busca as unidades para preencher o Select do formulário
export async function listarUnidades() {
  return await db.select().from(unidades);
}

// NOVA FUNÇÃO: Busca perfis para preencher o dropdown
export async function listarPerfis() {
  return await db.select().from(perfis);
}

// ATUALIZADA: Salva o usuário no banco com o perfil escolhido
export async function cadastrarUsuarioNoBanco(
  uid: string, 
  nome: string, 
  email: string, 
  idUnidade: number,
  idPerfil: number // Agora é dinâmico, não mais fixo = 2
) {
  try {
    await db.insert(usuarios).values({
      uidFirebase: uid,
      nome: nome,
      email: email,
      idUnidade: idUnidade,
      idPerfil: idPerfil,
    });

    return { success: true, message: "Usuário cadastrado com sucesso!" };
  } catch (error) {
    console.error("Erro ao salvar usuário:", error);
    return { success: false, message: "Erro ao vincular dados no sistema." };
  }
}



// Busca perfis para preencher o dropdown
export async function listarPerfis() {
  return await db.select().from(perfis);
}

// Salva o usuário no banco com o perfil selecionado
export async function cadastrarUsuarioNoBanco(
  uid: string, 
  nome: string, 
  email: string, 
  idUnidade: number,
  idPerfil: number // Agora recebemos o perfil dinamicamente
) {
  try {
    await db.insert(usuarios).values({
      uidFirebase: uid,
      nome: nome,
      email: email,
      idUnidade: idUnidade,
      idPerfil: idPerfil,
    });

    return { success: true, message: "Usuário cadastrado com sucesso!" };
  } catch (error) {
    console.error("Erro ao salvar usuário:", error);
    return { success: false, message: "Erro ao vincular dados no sistema." };
  }
}