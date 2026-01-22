ALTER TABLE "users" RENAME COLUMN "supabase_id" TO "firebase_uid";
ALTER TABLE "users" DROP CONSTRAINT "users_supabase_id_unique";
ALTER TABLE "users" ADD CONSTRAINT "users_firebase_uid_unique" UNIQUE ("firebase_uid");
