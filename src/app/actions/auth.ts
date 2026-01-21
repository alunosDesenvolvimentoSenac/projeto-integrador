'use server'

import { db } from "@/db";
import { perfis, unidades, usuarios } from "@/db/migrations/schema";
import { eq } from "drizzle-orm";

export async function sincronizarUsuario(uid: string, email: string, nome: string) {
  // 1. Verifica se o usuário já existe no Neon
  const usuarioExiste = await db.query.usuarios.findFirst({
    where: eq(usuarios.uidFirebase, uid)
  });

  if (usuarioExiste) {
    // Convertendo BigInt para number antes de retornar
    return {
      status: 'ok',
      usuario: {
        ...usuarioExiste,
        idUsuario: Number(usuarioExiste.idUsuario),
        idUnidade: Number(usuarioExiste.idUnidade),
        idPerfil: Number(usuarioExiste.idPerfil)
      }
    };
  }

  // 2. Se não existe, cria um novo
  try {
    const novoUsuario = await db.insert(usuarios).values({
      uidFirebase: uid,
      email: email,
      nome: nome,
      idUnidade: 1, // Ajuste conforme sua regra de negócio
      idPerfil: 4,  // ID do perfil padrão (ex: Aluno)
      ativo: true,  // Garante que nasce ativo
    }).returning();

    const usuarioCriado = novoUsuario[0];

    return {
      status: 'criado',
      usuario: {
        ...usuarioCriado,
        idUsuario: Number(usuarioCriado.idUsuario),
        idUnidade: Number(usuarioCriado.idUnidade),
        idPerfil: Number(usuarioCriado.idPerfil)
      }
    };
  } catch (error) {
    console.error("Erro ao sincronizar usuário:", error);
    return { status: 'erro' };
  }
}

export async function verificarPermissaoUsuario(uidFirebase: string) {
  try {
    const resultado = await db
      .select({
        usuario: usuarios,
        perfil: perfis,
      })
      .from(usuarios)
      .innerJoin(perfis, eq(usuarios.idPerfil, perfis.idPerfil))
      .where(eq(usuarios.uidFirebase, uidFirebase));

    const usuarioEncontrado = resultado[0];

    if (!usuarioEncontrado) {
      return { sucesso: false, mensagem: "Usuário não cadastrado no sistema escolar." };
    }

    if (usuarioEncontrado.usuario.ativo === false) {
        return { 
            sucesso: false, 
            mensagem: "Seu acesso está suspenso." 
        };
    }

    const usuarioSerializado = {
      ...usuarioEncontrado.usuario,
      idUsuario: Number(usuarioEncontrado.usuario.idUsuario),
      idUnidade: Number(usuarioEncontrado.usuario.idUnidade),
      idPerfil: Number(usuarioEncontrado.usuario.idPerfil),
      perfil: {
        ...usuarioEncontrado.perfil,
        idPerfil: Number(usuarioEncontrado.perfil.idPerfil)
      }
    };

    return {
      sucesso: true,
      usuario: usuarioSerializado
    };

  } catch (error) {
    console.error("Erro no server action:", error);
    return { sucesso: false, mensagem: "Erro de conexão com o banco de dados." };
  }
}

export async function getDadosUsuarioSidebar(uidFirebase: string) {
  try {
    const resultado = await db
      .select({
        idUsuario: usuarios.idUsuario,
        nomeUsuario: usuarios.nome,
        nomeUnidade: unidades.descricaoUnidade,
        cargo: perfis.descricaoPerfil,
        // Adicionando permissão para ver na sidebar se necessário
        idPerfil: perfis.idPerfil
      })
      .from(usuarios)
      .innerJoin(unidades, eq(usuarios.idUnidade, unidades.idUnidade))
      .innerJoin(perfis, eq(usuarios.idPerfil, perfis.idPerfil))
      .where(eq(usuarios.uidFirebase, uidFirebase));

    if (!resultado[0]) return null;
    return {
      ...resultado[0],
      idUsuario: Number(resultado[0].idUsuario),
      // Adicionando conversão para number caso precise usar na lógica da sidebar
      id_perfil: Number(resultado[0].idPerfil)
    };
  } catch (error) {
    console.error("Erro ao buscar dados da sidebar:", error);
    return null;
  }
}