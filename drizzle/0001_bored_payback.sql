CREATE TABLE "academic_terms" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"academic_year" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"stats" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "breaks" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"term_id" text NOT NULL,
	"department_id" text,
	"name" text NOT NULL,
	"day_index" integer,
	"start_period" integer NOT NULL,
	"duration_periods" integer DEFAULT 1 NOT NULL,
	"start_time" text,
	"end_time" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "college_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"code" text DEFAULT '' NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"city" text DEFAULT '' NOT NULL,
	"state" text DEFAULT '' NOT NULL,
	"pincode" text DEFAULT '' NOT NULL,
	"website" text DEFAULT '' NOT NULL,
	"contact_email" text DEFAULT '' NOT NULL,
	"contact_phone" text DEFAULT '' NOT NULL,
	"academic_year" text DEFAULT '' NOT NULL,
	"logo_data_url" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"term_id" text NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"working_days" jsonb NOT NULL,
	"periods_per_day" integer DEFAULT 6 NOT NULL,
	"period_timings" jsonb,
	"effective_from" text,
	"mentors" text,
	"status" text DEFAULT 'CONFIGURATION_INCOMPLETE' NOT NULL,
	"generation_settings_overrides" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "faculty" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"term_id" text NOT NULL,
	"department_id" text NOT NULL,
	"faculty_code" text NOT NULL,
	"name" text NOT NULL,
	"subject_ids" jsonb NOT NULL,
	"section_ids" jsonb NOT NULL,
	"availability" jsonb NOT NULL,
	"preferred_slots" jsonb NOT NULL,
	"max_periods_per_day" integer,
	"max_periods_per_week" integer,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "generation_audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"term_id" text NOT NULL,
	"department_id" text NOT NULL,
	"seed" integer,
	"status" text NOT NULL,
	"duration_ms" integer,
	"nodes_explored" integer,
	"final_score" double precision,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"term_id" text NOT NULL,
	"department_id" text,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"capacity" integer DEFAULT 60 NOT NULL,
	"type" text DEFAULT 'GENERAL' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sections" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"term_id" text NOT NULL,
	"department_id" text NOT NULL,
	"name" text NOT NULL,
	"year" integer NOT NULL,
	"semester" integer NOT NULL,
	"student_count" integer DEFAULT 60 NOT NULL,
	"subject_requirements" jsonb NOT NULL,
	"room_no" text,
	"class_advisor" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"term_id" text NOT NULL,
	"department_id" text NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"course_code" text,
	"sessions_per_week" integer DEFAULT 4 NOT NULL,
	"duration_periods" integer DEFAULT 1 NOT NULL,
	"eligible_faculty_ids" jsonb NOT NULL,
	"eligible_section_ids" jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timetables" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"term_id" text NOT NULL,
	"department_id" text NOT NULL,
	"status" text NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"configuration_snapshot" jsonb NOT NULL,
	"entries" jsonb NOT NULL,
	"validation_summary" jsonb,
	"generation_metadata" jsonb,
	"version_history" jsonb,
	"is_published" boolean DEFAULT false NOT NULL,
	"public_slug" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "timetables_public_slug_unique" UNIQUE("public_slug")
);
--> statement-breakpoint
ALTER TABLE "academic_terms" ADD CONSTRAINT "academic_terms_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "breaks" ADD CONSTRAINT "breaks_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "breaks" ADD CONSTRAINT "breaks_term_id_academic_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."academic_terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "breaks" ADD CONSTRAINT "breaks_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "college_profiles" ADD CONSTRAINT "college_profiles_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_term_id_academic_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."academic_terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faculty" ADD CONSTRAINT "faculty_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faculty" ADD CONSTRAINT "faculty_term_id_academic_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."academic_terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faculty" ADD CONSTRAINT "faculty_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generation_audit_logs" ADD CONSTRAINT "generation_audit_logs_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_term_id_academic_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."academic_terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sections" ADD CONSTRAINT "sections_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sections" ADD CONSTRAINT "sections_term_id_academic_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."academic_terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sections" ADD CONSTRAINT "sections_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_term_id_academic_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."academic_terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetables" ADD CONSTRAINT "timetables_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetables" ADD CONSTRAINT "timetables_term_id_academic_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."academic_terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetables" ADD CONSTRAINT "timetables_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "academic_terms_user_id_idx" ON "academic_terms" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "breaks_user_term_idx" ON "breaks" USING btree ("user_id","term_id");--> statement-breakpoint
CREATE UNIQUE INDEX "college_profiles_user_id_idx" ON "college_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "departments_user_term_idx" ON "departments" USING btree ("user_id","term_id");--> statement-breakpoint
CREATE INDEX "faculty_department_id_idx" ON "faculty" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "faculty_user_term_idx" ON "faculty" USING btree ("user_id","term_id");--> statement-breakpoint
CREATE INDEX "generation_logs_user_idx" ON "generation_audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "generation_logs_dept_idx" ON "generation_audit_logs" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "rooms_user_term_idx" ON "rooms" USING btree ("user_id","term_id");--> statement-breakpoint
CREATE INDEX "rooms_department_id_idx" ON "rooms" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "sections_department_id_idx" ON "sections" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "sections_user_term_idx" ON "sections" USING btree ("user_id","term_id");--> statement-breakpoint
CREATE INDEX "subjects_department_id_idx" ON "subjects" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "subjects_user_term_idx" ON "subjects" USING btree ("user_id","term_id");--> statement-breakpoint
CREATE UNIQUE INDEX "timetables_user_term_dept_idx" ON "timetables" USING btree ("user_id","term_id","department_id");--> statement-breakpoint
CREATE INDEX "timetables_department_id_idx" ON "timetables" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "timetables_public_slug_idx" ON "timetables" USING btree ("public_slug");