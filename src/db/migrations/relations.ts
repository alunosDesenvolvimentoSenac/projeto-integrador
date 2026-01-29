import { relations } from "drizzle-orm/relations";
import { salas, agendamentos, usuarios, turmas, areas, unidades, equipamentos, checklists, perfis } from "./schema";

export const agendamentosRelations = relations(agendamentos, ({one, many}) => ({
	sala: one(salas, {
		fields: [agendamentos.idSala],
		references: [salas.idSala]
	}),
	usuario: one(usuarios, {
		fields: [agendamentos.idUsuario],
		references: [usuarios.idUsuario]
	}),
	turma: one(turmas, {
		fields: [agendamentos.idTurma],
		references: [turmas.idTurma]
	}),
	checklists: many(checklists),
}));

export const salasRelations = relations(salas, ({one, many}) => ({
	agendamentos: many(agendamentos),
	area: one(areas, {
		fields: [salas.idArea],
		references: [areas.idArea]
	}),
	unidade: one(unidades, {
		fields: [salas.idUnidade],
		references: [unidades.idUnidade]
	}),
	equipamentos: many(equipamentos),
}));

export const usuariosRelations = relations(usuarios, ({one, many}) => ({
	agendamentos: many(agendamentos),
	unidade: one(unidades, {
		fields: [usuarios.idUnidade],
		references: [unidades.idUnidade]
	}),
	perfi: one(perfis, {
		fields: [usuarios.idPerfil],
		references: [perfis.idPerfil]
	}),
}));

export const turmasRelations = relations(turmas, ({one, many}) => ({
	agendamentos: many(agendamentos),
	area: one(areas, {
		fields: [turmas.idArea],
		references: [areas.idArea]
	}),
	unidade: one(unidades, {
		fields: [turmas.idUnidade],
		references: [unidades.idUnidade]
	}),
}));

export const areasRelations = relations(areas, ({many}) => ({
	salas: many(salas),
	turmas: many(turmas),
}));

export const unidadesRelations = relations(unidades, ({many}) => ({
	salas: many(salas),
	turmas: many(turmas),
	usuarios: many(usuarios),
}));

export const equipamentosRelations = relations(equipamentos, ({one}) => ({
	sala: one(salas, {
		fields: [equipamentos.idSala],
		references: [salas.idSala]
	}),
}));

export const checklistsRelations = relations(checklists, ({one}) => ({
	agendamento: one(agendamentos, {
		fields: [checklists.idAgendamento],
		references: [agendamentos.idAgendamento]
	}),
}));

export const perfisRelations = relations(perfis, ({many}) => ({
	usuarios: many(usuarios),
}));