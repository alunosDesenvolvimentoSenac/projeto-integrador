'use server'

import { db } from "@/db";
import { perfis, usuarios } from "@/db/migrations/schema";
import { eq } from "drizzle-orm";

export async function sincronizarUsuario(uid: string, email: string, nome: string) {
  // 1. Verifica se o usuário já existe no Neon
  const usuarioExiste = await db.query.usuarios.findFirst({
    where: eq(usuarios.uidFirebase, uid)
  });

  if (usuarioExiste) {
    return { status: 'ok', usuario: usuarioExiste };
  }

  // 2. Se não existe, cria um novo (Perfil padrão: Aluno/Consulta - ajuste o ID conforme seu seed)
  // Supondo que ID 4 seja "Consulta" ou "Aluno"
  try {
    const novoUsuario = await db.insert(usuarios).values({
        uidFirebase: uid,
        email: email,
        nome: nome,
        idUnidade: 1, // Defina um padrão ou lógica para isso
        idPerfil: 4,  // ID do perfil padrão
        // matricula: "PENDENTE" 
    }).returning();
    
    return { status: 'criado', usuario: novoUsuario[0] };
  } catch (error) {
    console.error("Erro ao sincronizar usuário:", error);
    return { status: 'erro' };
  }
}

export async function verificarPermissaoUsuario(uidFirebase: string) {
  try {
    // ABORDAGEM CORRIGIDA: Usando db.select com innerJoin
    // Isso imita o SQL: SELECT * FROM usuarios INNER JOIN perfis ON ...
    const resultado = await db
      .select({
        usuario: usuarios,
        perfil: perfis, // Traz os dados do perfil separados
      })
      .from(usuarios)
      .innerJoin(perfis, eq(usuarios.idPerfil, perfis.idPerfil)) // O JOIN explícito
      .where(eq(usuarios.uidFirebase, uidFirebase));
    
    // O .select retorna sempre um array. Pegamos o primeiro item.
    const usuarioEncontrado = resultado[0];

    if (!usuarioEncontrado) {
      return { sucesso: false, mensagem: "Usuário não cadastrado no sistema escolar." };
    }

    // Agora seus dados estão organizados assim:
    // usuarioEncontrado.usuario (dados do user)
    // usuarioEncontrado.perfil (dados do perfil, ex: is_admin)

    return { 
      sucesso: true, 
      usuario: {
        ...usuarioEncontrado.usuario,
        perfil: usuarioEncontrado.perfil // Acoplamos o perfil dentro do objeto usuario para facilitar
      }
    };

  } catch (error) {
    console.error("Erro no server action:", error);
    return { sucesso: false, mensagem: "Erro de conexão com o banco de dados." };
  }
}