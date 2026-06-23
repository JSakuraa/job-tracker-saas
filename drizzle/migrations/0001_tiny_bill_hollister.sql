CREATE TYPE "public"."company_source" AS ENUM('application', 'companies_tab', 'contact');--> statement-breakpoint
CREATE TYPE "public"."relationship_type" AS ENUM('established_connection', 'cold_outreach');--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"rank" integer,
	"notes" text,
	"source" "company_source" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "companies_user_id_name_unique" UNIQUE("user_id","name")
);
--> statement-breakpoint
INSERT INTO "companies" ("user_id", "name", "rank", "notes", "source")
SELECT "user_id", lower(trim("company_name")), "rank", "notes", 'companies_tab'
FROM "ranked_employers"
ON CONFLICT ("user_id", "name") DO NOTHING;--> statement-breakpoint
CREATE TABLE "connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"email" varchar(255),
	"linkedin_url" varchar(500),
	"phone_number" varchar(50),
	"company_id" uuid,
	"relationship_type" "relationship_type" NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "job_applications" ADD COLUMN "company_id" uuid;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connections" ADD CONSTRAINT "connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connections" ADD CONSTRAINT "connections_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "companies_user_id_rank_idx" ON "companies" USING btree ("user_id","rank");--> statement-breakpoint
CREATE INDEX "companies_user_id_name_idx" ON "companies" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "connections_user_id_idx" ON "connections" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "connections_user_id_relationship_type_idx" ON "connections" USING btree ("user_id","relationship_type");--> statement-breakpoint
CREATE INDEX "connections_company_id_idx" ON "connections" USING btree ("company_id");--> statement-breakpoint
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
UPDATE "job_applications" ja
SET "company_id" = c."id"
FROM "companies" c
WHERE c."user_id" = ja."user_id"
  AND c."name" = lower(trim(ja."company_name"));