// DataMahasiswa/migrations/YYYYMMDDHHMMSS-CreateDataMahasiswaTables.ts
// (Ganti YYYYMMDDHHMMSS dengan timestamp aktual)

import { MigrationInterface, QueryRunner } from "typeorm";

// Ganti timestamp ini dengan yang Anda gunakan
export class CreateDataMahasiswaTables1747235485388 implements MigrationInterface {
    // Ganti timestamp ini dengan yang Anda gunakan
    name = 'CreateDataMahasiswaTables1747235485388'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Create 'prodi' table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "prodi" (
                "id" SERIAL PRIMARY KEY,
                "nama_prodi" VARCHAR(255) UNIQUE NOT NULL,
                "fakultas" VARCHAR(255) NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
            );
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_PRODI_NAMA_PRODI" ON "prodi" ("nama_prodi");
        `);

        // 2. Create 'mahasiswa' table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "mahasiswa" (
                "id" SERIAL PRIMARY KEY,
                "nama" VARCHAR(255) NOT NULL,
                "nim" VARCHAR(50) UNIQUE NOT NULL,
                "prodi_id" INTEGER NULL,
                "foto" VARCHAR(1024) NULL,
                "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
            );
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_MAHASISWA_NIM" ON "mahasiswa" ("nim");
        `);

        // 3. Create 'alamat' table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "alamat" (
                "id" SERIAL PRIMARY KEY,
                "mahasiswa_id" INTEGER UNIQUE NOT NULL,
                "jalan" VARCHAR(255) NOT NULL,
                "kota" VARCHAR(100) NOT NULL,
                "provinsi" VARCHAR(100) NOT NULL,
                "kode_pos" VARCHAR(10) NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
            );
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_ALAMAT_MAHASISWA_ID" ON "alamat" ("mahasiswa_id");
        `);

        // Add foreign key constraints

        // Foreign key for mahasiswa.prodi_id -> prodi.id
        // Hapus constraint jika sudah ada, lalu tambahkan lagi
        await queryRunner.query(`
            ALTER TABLE "mahasiswa"
            DROP CONSTRAINT IF EXISTS "FK_mahasiswa_prodi";
        `);
        await queryRunner.query(`
            ALTER TABLE "mahasiswa"
            ADD CONSTRAINT "FK_mahasiswa_prodi"
            FOREIGN KEY ("prodi_id")
            REFERENCES "prodi"("id")
            ON DELETE SET NULL
            ON UPDATE CASCADE;
        `);

        // Foreign key for alamat.mahasiswa_id -> mahasiswa.id
        // Hapus constraint jika sudah ada, lalu tambahkan lagi
        await queryRunner.query(`
            ALTER TABLE "alamat"
            DROP CONSTRAINT IF EXISTS "FK_alamat_mahasiswa";
        `);
        await queryRunner.query(`
            ALTER TABLE "alamat"
            ADD CONSTRAINT "FK_alamat_mahasiswa"
            FOREIGN KEY ("mahasiswa_id")
            REFERENCES "mahasiswa"("id")
            ON DELETE CASCADE
            ON UPDATE CASCADE;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints first
        await queryRunner.query(`
            ALTER TABLE "alamat" DROP CONSTRAINT IF EXISTS "FK_alamat_mahasiswa";
        `);
        await queryRunner.query(`
            ALTER TABLE "mahasiswa" DROP CONSTRAINT IF EXISTS "FK_mahasiswa_prodi";
        `);

        // Drop tables
        await queryRunner.query(`DROP TABLE IF EXISTS "alamat";`);
        await queryRunner.query(`DROP TABLE IF EXISTS "mahasiswa";`);
        await queryRunner.query(`DROP TABLE IF EXISTS "prodi";`);

        // Indeks biasanya terhapus otomatis dengan tabel, jadi tidak perlu drop manual
        // kecuali Anda punya alasan khusus.
    }
}