import { pgTable, index, foreignKey, bigint, timestamp, varchar, integer, boolean, unique, text, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const statusAgendamento = pgEnum("status_agendamento", ['pendente', 'confirmado', 'concluido'])


export const agendamentos = pgTable("agendamentos", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idAgendamento: bigint("id_agendamento", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "agendamentos_id_agendamento_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	dataHorarioInicio: timestamp("data_horario_inicio", { withTimezone: true, mode: 'string' }).notNull(),
	dataHorarioFim: timestamp("data_horario_fim", { withTimezone: true, mode: 'string' }).notNull(),
	status: statusAgendamento().default('pendente').notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idSala: bigint("id_sala", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idUsuario: bigint("id_usuario", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idTurma: bigint("id_turma", { mode: "number" }),
}, (table) => [
	index("idx_agend_periodo").using("btree", table.dataHorarioInicio.asc().nullsLast().op("timestamptz_ops"), table.dataHorarioFim.asc().nullsLast().op("timestamptz_ops")),
	index("idx_agend_sala").using("btree", table.idSala.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.idSala],
			foreignColumns: [salas.idSala],
			name: "fk_agend_sala"
		}),
	foreignKey({
			columns: [table.idUsuario],
			foreignColumns: [usuarios.idUsuario],
			name: "fk_agend_usuario"
		}),
	foreignKey({
			columns: [table.idTurma],
			foreignColumns: [turmas.idTurma],
			name: "fk_agend_turma"
		}),
]);

export const unidades = pgTable("unidades", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idUnidade: bigint("id_unidade", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "unidades_id_unidade_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	descricaoUnidade: varchar("descricao_unidade", { length: 255 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const areas = pgTable("areas", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idArea: bigint("id_area", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "areas_id_area_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	descricaoArea: varchar("descricao_area", { length: 255 }).notNull(),
});

export const salas = pgTable("salas", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idSala: bigint("id_sala", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "salas_id_sala_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	codigoSala: varchar("codigo_sala", { length: 50 }).notNull(),
	descricaoSala: varchar("descricao_sala", { length: 255 }).notNull(),
	capacidade: integer().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idArea: bigint("id_area", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idUnidade: bigint("id_unidade", { mode: "number" }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.idArea],
			foreignColumns: [areas.idArea],
			name: "fk_salas_area"
		}),
	foreignKey({
			columns: [table.idUnidade],
			foreignColumns: [unidades.idUnidade],
			name: "fk_salas_unidade"
		}),
]);

export const perfis = pgTable("perfis", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idPerfil: bigint("id_perfil", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "perfis_id_perfil_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	descricaoPerfil: varchar("descricao_perfil", { length: 50 }).notNull(),
	isAdmin: boolean("is_admin").default(false).notNull(),
});

export const usuarios = pgTable("usuarios", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idUsuario: bigint("id_usuario", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "usuarios_id_usuario_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	uidFirebase: varchar("uid_firebase", { length: 128 }).notNull(),
	nome: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	matricula: varchar({ length: 50 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idUnidade: bigint("id_unidade", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idPerfil: bigint("id_perfil", { mode: "number" }).notNull(),
}, (table) => [
	index("idx_usuarios_uid").using("btree", table.uidFirebase.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.idUnidade],
			foreignColumns: [unidades.idUnidade],
			name: "fk_usuarios_unidade"
		}),
	foreignKey({
			columns: [table.idPerfil],
			foreignColumns: [perfis.idPerfil],
			name: "fk_usuarios_perfil"
		}),
	unique("usuarios_uid_firebase_key").on(table.uidFirebase),
	unique("usuarios_email_key").on(table.email),
]);

export const equipamentos = pgTable("equipamentos", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idEquipamento: bigint("id_equipamento", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "equipamentos_id_equipamento_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	descricao: varchar({ length: 255 }).notNull(),
	quantidade: integer().default(1).notNull(),
	ativo: boolean().default(true).notNull(),
	observacao: text(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idSala: bigint("id_sala", { mode: "number" }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.idSala],
			foreignColumns: [salas.idSala],
			name: "fk_equipamentos_sala"
		}).onUpdate("cascade"),
]);

export const turmas = pgTable("turmas", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idTurma: bigint("id_turma", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "turmas_id_turma_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	codigoTurma: varchar("codigo_turma", { length: 50 }).notNull(),
	descricaoTurma: varchar("descricao_turma", { length: 255 }).notNull(),
	periodo: varchar({ length: 50 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idArea: bigint("id_area", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idUnidade: bigint("id_unidade", { mode: "number" }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.idArea],
			foreignColumns: [areas.idArea],
			name: "fk_turmas_area"
		}),
	foreignKey({
			columns: [table.idUnidade],
			foreignColumns: [unidades.idUnidade],
			name: "fk_turmas_unidade"
		}),
]);

export const checklists = pgTable("checklists", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idChecklist: bigint("id_checklist", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "checklists_id_checklist_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	dataChecklist: timestamp("data_checklist", { withTimezone: true, mode: 'string' }).defaultNow(),
	materialOk: boolean("material_ok").default(false).notNull(),
	observacao: text(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	idAgendamento: bigint("id_agendamento", { mode: "number" }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.idAgendamento],
			foreignColumns: [agendamentos.idAgendamento],
			name: "fk_checklist_agendamento"
		}).onDelete("cascade"),
]);
