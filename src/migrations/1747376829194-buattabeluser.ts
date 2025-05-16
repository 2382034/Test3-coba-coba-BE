import { MigrationInterface, QueryRunner } from "typeorm";

export class Buattabeluser1747376829194 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "users" (
            "id" SERIAL PRIMARY KEY,
            "username" VARCHAR(50) UNIQUE NOT NULL,
            "email" VARCHAR(100) UNIQUE NOT NULL,
            "password_hash" TEXT NOT NULL,
            "role" VARCHAR(50) NOT NULL DEFAULT 'user',
            "profile_picture" TEXT,
            "bio" TEXT,
            "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
    `);
    // Opsional: Tambahkan indeks untuk pencarian yang lebih cepat jika diperlukan
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_USERS_USERNAME" ON "users" ("username")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_USERS_EMAIL" ON "users" ("email")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Hapus indeks dulu jika ada
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_USERS_EMAIL"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_USERS_USERNAME"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users";`);
  }
}
