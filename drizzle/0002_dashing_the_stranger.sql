CREATE TABLE "institution_members" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'FACULTY' NOT NULL,
	"department_id" text,
	"faculty_id" text,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_invitations" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'FACULTY' NOT NULL,
	"department_id" text,
	"faculty_id" text,
	"invited_by" text NOT NULL,
	"token" text NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "member_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "institution_members" ADD CONSTRAINT "institution_members_institution_id_user_profiles_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institution_members" ADD CONSTRAINT "institution_members_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institution_members" ADD CONSTRAINT "institution_members_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institution_members" ADD CONSTRAINT "institution_members_faculty_id_faculty_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."faculty"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_invitations" ADD CONSTRAINT "member_invitations_institution_id_user_profiles_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_invitations" ADD CONSTRAINT "member_invitations_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_invitations" ADD CONSTRAINT "member_invitations_faculty_id_faculty_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."faculty"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_invitations" ADD CONSTRAINT "member_invitations_invited_by_user_profiles_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "members_inst_user_idx" ON "institution_members" USING btree ("institution_id","user_id");--> statement-breakpoint
CREATE INDEX "members_user_id_idx" ON "institution_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "members_dept_id_idx" ON "institution_members" USING btree ("department_id");--> statement-breakpoint
CREATE UNIQUE INDEX "invitations_inst_email_idx" ON "member_invitations" USING btree ("institution_id","email");--> statement-breakpoint
CREATE INDEX "invitations_token_idx" ON "member_invitations" USING btree ("token");