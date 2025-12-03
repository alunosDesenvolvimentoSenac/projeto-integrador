-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."status_agendamento" AS ENUM('pendente', 'confirmado', 'concluido');--> statement-breakpoint
CREATE TABLE "agendamentos" (
	"id_agendamento" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "agendamentos_id_agendamento_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"data_horario_inicio" timestamp with time zone NOT NULL,
	"data_horario_fim" timestamp with time zone NOT NULL,
	"status" "status_agendamento" DEFAULT 'pendente' NOT NULL,
	"id_sala" bigint NOT NULL,
	"id_usuario" bigint NOT NULL,
	"id_turma" bigint
);
--> statement-breakpoint
CREATE TABLE "unidades" (
	"id_unidade" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "unidades_id_unidade_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"descricao_unidade" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "areas" (
	"id_area" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "areas_id_area_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"descricao_area" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salas" (
	"id_sala" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "salas_id_sala_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"codigo_sala" varchar(50) NOT NULL,
	"descricao_sala" varchar(255) NOT NULL,
	"capacidade" integer NOT NULL,
	"id_area" bigint NOT NULL,
	"id_unidade" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "perfis" (
	"id_perfil" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "perfis_id_perfil_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"descricao_perfil" varchar(50) NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id_usuario" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "usuarios_id_usuario_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"uid_firebase" varchar(128) NOT NULL,
	"nome" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"matricula" varchar(50),
	"id_unidade" bigint NOT NULL,
	"id_perfil" bigint NOT NULL,
	CONSTRAINT "usuarios_uid_firebase_key" UNIQUE("uid_firebase"),
	CONSTRAINT "usuarios_email_key" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "equipamentos" (
	"id_equipamento" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "equipamentos_id_equipamento_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"descricao" varchar(255) NOT NULL,
	"quantidade" integer DEFAULT 1 NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"observacao" text,
	"id_sala" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "turmas" (
	"id_turma" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "turmas_id_turma_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"codigo_turma" varchar(50) NOT NULL,
	"descricao_turma" varchar(255) NOT NULL,
	"periodo" varchar(50) NOT NULL,
	"id_area" bigint NOT NULL,
	"id_unidade" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checklists" (
	"id_checklist" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "checklists_id_checklist_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"data_checklist" timestamp with time zone DEFAULT now(),
	"material_ok" boolean DEFAULT false NOT NULL,
	"observacao" text,
	"id_agendamento" bigint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agendamentos" ADD CONSTRAINT "fk_agend_sala" FOREIGN KEY ("id_sala") REFERENCES "public"."salas"("id_sala") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agendamentos" ADD CONSTRAINT "fk_agend_usuario" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuarios"("id_usuario") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agendamentos" ADD CONSTRAINT "fk_agend_turma" FOREIGN KEY ("id_turma") REFERENCES "public"."turmas"("id_turma") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salas" ADD CONSTRAINT "fk_salas_area" FOREIGN KEY ("id_area") REFERENCES "public"."areas"("id_area") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salas" ADD CONSTRAINT "fk_salas_unidade" FOREIGN KEY ("id_unidade") REFERENCES "public"."unidades"("id_unidade") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuarios" ADD CONSTRAINT "fk_usuarios_unidade" FOREIGN KEY ("id_unidade") REFERENCES "public"."unidades"("id_unidade") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuarios" ADD CONSTRAINT "fk_usuarios_perfil" FOREIGN KEY ("id_perfil") REFERENCES "public"."perfis"("id_perfil") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipamentos" ADD CONSTRAINT "fk_equipamentos_sala" FOREIGN KEY ("id_sala") REFERENCES "public"."salas"("id_sala") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "turmas" ADD CONSTRAINT "fk_turmas_area" FOREIGN KEY ("id_area") REFERENCES "public"."areas"("id_area") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "turmas" ADD CONSTRAINT "fk_turmas_unidade" FOREIGN KEY ("id_unidade") REFERENCES "public"."unidades"("id_unidade") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklists" ADD CONSTRAINT "fk_checklist_agendamento" FOREIGN KEY ("id_agendamento") REFERENCES "public"."agendamentos"("id_agendamento") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_agend_periodo" ON "agendamentos" USING btree ("data_horario_inicio" timestamptz_ops,"data_horario_fim" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_agend_sala" ON "agendamentos" USING btree ("id_sala" int8_ops);--> statement-breakpoint
CREATE INDEX "idx_usuarios_uid" ON "usuarios" USING btree ("uid_firebase" text_ops);
*/