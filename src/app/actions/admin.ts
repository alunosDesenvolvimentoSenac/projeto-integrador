'use server'

import { db } from "@/db";
import { usuarios, unidades, perfis, salas, areas, equipamentos } from "@/db/migrations/schema";
import { eq } from "drizzle-orm";

export async function listarUnidades() {
  return await db.select().from(unidades);
}

export async function listarPerfis() {
  return await db.select().from(perfis);
}

export async function listarAreas() {
  return await db.select().from(areas);
}


export async function cadastrarUsuarioNoBanco(
  uid: string, 
  nome: string, 
  email: string, 
  idUnidade: number,
  idPerfil: number
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

export async function cadastrarDocenteNoBanco(
  uid: string, 
  nome: string, 
  email: string, 
  idUnidade: number
) {
  try {
    const ID_PERFIL_DOCENTE = 2; 

    await db.insert(usuarios).values({
      uidFirebase: uid,
      nome: nome,
      email: email,
      idUnidade: idUnidade,
      idPerfil: ID_PERFIL_DOCENTE,
    });

    return { success: true, message: "Cadastro realizado com sucesso!" };
  } catch (error) {
    console.error("Erro ao salvar docente no banco:", error);
    return { success: false, message: "Erro ao vincular dados no sistema." };
  }
}

export async function cadastrarUnidadeNoBanco(descricao: string) {
  try {
    await db.insert(unidades).values({
      descricaoUnidade: descricao,
    });

    return { success: true, message: "Unidade cadastrada com sucesso!" };
  } catch (error) {
    console.error("Erro ao cadastrar unidade:", error);
    return { success: false, message: "Erro ao salvar no banco de dados." };
  }
}

export async function cadastrarSalaNoBanco(dados: {
    codigoSala: string;
    descricaoSala: string;
    capacidade: number;
    idUnidade: number;
    idArea: number;
}) {
    try {
        await db.insert(salas).values({
            codigoSala: dados.codigoSala,
            descricaoSala: dados.descricaoSala,
            capacidade: dados.capacidade,
            idUnidade: dados.idUnidade,
            idArea: dados.idArea,
        });

        return { success: true, message: "Sala criada com sucesso!" };
    } catch (error) {
        console.error("Erro ao criar sala:", error);
        return { success: false, message: "Erro ao criar sala no banco de dados." };
    }
}

export async function listarSalas() {
  return await db.select().from(salas);
}

export async function cadastrarEquipamentoNoBanco(dados: {
  descricao: string;
  quantidade: number;
  observacao?: string;
  idSala: number;
  ativo: boolean;
}) {
  try {
    await db.insert(equipamentos).values({
      descricao: dados.descricao,
      quantidade: dados.quantidade,
      observacao: dados.observacao,
      idSala: dados.idSala,
      ativo: dados.ativo,
    });

    return { success: true, message: "Equipamento cadastrado com sucesso!" };
  } catch (error) {
    console.error("Erro ao cadastrar equipamento:", error);
    return { success: false, message: "Erro ao salvar no banco de dados." };
  }
}

export async function cadastrarPerfilNoBanco(dados: { descricao: string; isAdmin: boolean }) {
  try {
    await db.insert(perfis).values({
      descricaoPerfil: dados.descricao,
      isAdmin: dados.isAdmin,
    });

    return { success: true, message: "Perfil cadastrado com sucesso!" };
  } catch (error) {
    console.error("Erro ao cadastrar perfil:", error);
    return { success: false, message: "Erro ao salvar no banco de dados." };
  }
}