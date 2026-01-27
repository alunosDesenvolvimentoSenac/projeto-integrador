CREATE TABLE "checklist_itens" (
	"id_checklist_item" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "checklist_itens_id_checklist_item_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"id_checklist" bigint NOT NULL,
	"id_equipamento" bigint NOT NULL,
	"quantidade_correta" boolean DEFAULT true NOT NULL,
	"possui_avaria" boolean DEFAULT false NOT NULL,
	"detalhes_avaria" jsonb,
	"observacao" text
);
--> statement-breakpoint
ALTER TABLE "areas" ALTER COLUMN "id_area" SET MAXVALUE 9223372036854775807;--> statement-breakpoint
ALTER TABLE "checklists" ALTER COLUMN "id_checklist" SET MAXVALUE 9223372036854775807;--> statement-breakpoint
ALTER TABLE "equipamentos" ALTER COLUMN "id_equipamento" SET MAXVALUE 9223372036854775807;--> statement-breakpoint
ALTER TABLE "perfis" ALTER COLUMN "id_perfil" SET MAXVALUE 9223372036854775807;--> statement-breakpoint
ALTER TABLE "salas" ALTER COLUMN "id_sala" SET MAXVALUE 9223372036854775807;--> statement-breakpoint
ALTER TABLE "turmas" ALTER COLUMN "id_turma" SET MAXVALUE 9223372036854775807;--> statement-breakpoint
ALTER TABLE "unidades" ALTER COLUMN "id_unidade" SET MAXVALUE 9223372036854775807;--> statement-breakpoint
ALTER TABLE "usuarios" ALTER COLUMN "id_usuario" SET MAXVALUE 9223372036854775807;--> statement-breakpoint
ALTER TABLE "checklists" ADD COLUMN "limpeza_ok" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "checklists" ADD COLUMN "disciplina" varchar(255);--> statement-breakpoint
ALTER TABLE "equipamentos" ADD COLUMN "caminho_imagem" varchar(500);--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "ativo" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "checklist_itens" ADD CONSTRAINT "fk_itens_checklist" FOREIGN KEY ("id_checklist") REFERENCES "public"."checklists"("id_checklist") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agendamentos" DROP COLUMN "docente";