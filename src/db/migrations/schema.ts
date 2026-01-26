import { pgTable, index, foreignKey, bigint, timestamp, varchar, integer, boolean, unique, text, pgEnum, jsonb } from "drizzle-orm/pg-core"

// 1. Enums e Tabelas Base (Sem dependências)
export const statusAgendamento = pgEnum("status_agendamento", ['pendente', 'confirmado', 'concluido'])

export const unidades = pgTable("unidades", {
    idUnidade: bigint("id_unidade", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    descricaoUnidade: varchar("descricao_unidade", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const areas = pgTable("areas", {
    idArea: bigint("id_area", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    descricaoArea: varchar("descricao_area", { length: 255 }).notNull(),
});

export const perfis = pgTable("perfis", {
    idPerfil: bigint("id_perfil", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    descricaoPerfil: varchar("descricao_perfil", { length: 50 }).notNull(),
    isAdmin: boolean("is_admin").default(false).notNull(),
});

// 2. Tabelas com dependências simples
export const salas = pgTable("salas", {
    idSala: bigint("id_sala", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    codigoSala: varchar("codigo_sala", { length: 50 }).notNull(),
    descricaoSala: varchar("descricao_sala", { length: 255 }).notNull(),
    capacidade: integer().notNull(),
    idArea: bigint("id_area", { mode: "number" }).notNull(),
    idUnidade: bigint("id_unidade", { mode: "number" }).notNull(),
}, (table) => [
    foreignKey({ columns: [table.idArea], foreignColumns: [areas.idArea], name: "fk_salas_area" }),
    foreignKey({ columns: [table.idUnidade], foreignColumns: [unidades.idUnidade], name: "fk_salas_unidade" }),
]);

export const usuarios = pgTable("usuarios", {
    idUsuario: bigint("id_usuario", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    uidFirebase: varchar("uid_firebase", { length: 128 }).notNull(),
    nome: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 255 }).notNull(),
    matricula: varchar({ length: 50 }),
    ativo: boolean("ativo").default(true).notNull(),
    idUnidade: bigint("id_unidade", { mode: "number" }).notNull(),
    idPerfil: bigint("id_perfil", { mode: "number" }).notNull(),
}, (table) => [
    index("idx_usuarios_uid").using("btree", table.uidFirebase.asc().nullsLast().op("text_ops")),
    foreignKey({ columns: [table.idUnidade], foreignColumns: [unidades.idUnidade], name: "fk_usuarios_unidade" }),
    foreignKey({ columns: [table.idPerfil], foreignColumns: [perfis.idPerfil], name: "fk_usuarios_perfil" }),
    unique("usuarios_uid_firebase_key").on(table.uidFirebase),
    unique("usuarios_email_key").on(table.email),
]);

export const turmas = pgTable("turmas", {
    idTurma: bigint("id_turma", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    codigoTurma: varchar("codigo_turma", { length: 50 }).notNull(),
    descricaoTurma: varchar("descricao_turma", { length: 255 }).notNull(),
    periodo: varchar({ length: 50 }).notNull(),
    idArea: bigint("id_area", { mode: "number" }).notNull(),
    idUnidade: bigint("id_unidade", { mode: "number" }).notNull(),
}, (table) => [
    foreignKey({ columns: [table.idArea], foreignColumns: [areas.idArea], name: "fk_turmas_area" }),
    foreignKey({ columns: [table.idUnidade], foreignColumns: [unidades.idUnidade], name: "fk_turmas_unidade" }),
]);

// 3. Tabelas principais (Agendamentos e Equipamentos)
export const agendamentos = pgTable("agendamentos", {
    idAgendamento: bigint("id_agendamento", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    dataHorarioInicio: timestamp("data_horario_inicio", { withTimezone: true, mode: 'string' }).notNull(),
    dataHorarioFim: timestamp("data_horario_fim", { withTimezone: true, mode: 'string' }).notNull(),
    status: statusAgendamento().default('pendente').notNull(),
    idSala: bigint("id_sala", { mode: "number" }).notNull(),
    idUsuario: bigint("id_usuario", { mode: "number" }).notNull(),
    idTurma: bigint("id_turma", { mode: "number" }),
    observacao: text("observacao"),
    disciplina: varchar("disciplina", { length: 255 }),
    codigoSerie: varchar("codigo_serie", { length: 50 }),
}, (table) => [
    index("idx_agend_periodo").using("btree", table.dataHorarioInicio.asc().nullsLast().op("timestamptz_ops"), table.dataHorarioFim.asc().nullsLast().op("timestamptz_ops")),
    index("idx_agend_serie").using("btree", table.codigoSerie.asc().nullsLast().op("text_ops")),
    foreignKey({ columns: [table.idSala], foreignColumns: [salas.idSala], name: "fk_agend_sala" }),
    foreignKey({ columns: [table.idUsuario], foreignColumns: [usuarios.idUsuario], name: "fk_agend_usuario" }),
    foreignKey({ columns: [table.idTurma], foreignColumns: [turmas.idTurma], name: "fk_agend_turma" }),
]);

export const equipamentos = pgTable("equipamentos", {
    idEquipamento: bigint("id_equipamento", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    descricao: varchar({ length: 255 }).notNull(),
    quantidade: integer().default(1).notNull(),
    ativo: boolean().default(true).notNull(),
    observacao: text(),
    // ADICIONADO AQUI:
    caminhoImagem: varchar("caminho_imagem", { length: 500 }), 
    idSala: bigint("id_sala", { mode: "number" }).notNull(),
}, (table) => [
    foreignKey({ columns: [table.idSala], foreignColumns: [salas.idSala], name: "fk_equipamentos_sala" }).onUpdate("cascade"),
]);

// 4. Checklist
export const checklists = pgTable("checklists", {
    idChecklist: bigint("id_checklist", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    dataChecklist: timestamp("data_checklist", { withTimezone: true, mode: 'string' }).defaultNow(),
    materialOk: boolean("material_ok").default(false).notNull(),
    observacao: text(),
    disciplina: varchar("disciplina", { length: 255 }),
    idAgendamento: bigint("id_agendamento", { mode: "number" }).notNull(),
}, (table) => [
    foreignKey({ columns: [table.idAgendamento], foreignColumns: [agendamentos.idAgendamento], name: "fk_checklist_agendamento" }).onDelete("cascade"),
]);

export const checklistItens = pgTable("checklist_itens", {
    idChecklistItem: bigint("id_checklist_item", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    idChecklist: bigint("id_checklist", { mode: "number" }).notNull(),
    idEquipamento: bigint("id_equipamento", { mode: "number" }).notNull(),
    quantidadeCorreta: boolean("quantidade_correta").default(true).notNull(),
    possuiAvaria: boolean("possui_avaria").default(false).notNull(),
    detalhesAvaria: jsonb("detalhes_avaria"), // JSON: { faltando: boolean, quebrado: boolean, outros: boolean }
    observacao: text("observacao"),
}, (table) => [
    foreignKey({ columns: [table.idChecklist], foreignColumns: [checklists.idChecklist], name: "fk_itens_checklist" }).onDelete("cascade"),
]);