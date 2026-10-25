DROP INDEX "timetables_user_term_dept_idx";--> statement-breakpoint
ALTER TABLE "timetables" ADD COLUMN "name" text DEFAULT 'Untitled timetable' NOT NULL;--> statement-breakpoint
ALTER TABLE "timetables" ADD COLUMN "description" text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE INDEX "timetables_user_term_dept_idx" ON "timetables" USING btree ("user_id","term_id","department_id");