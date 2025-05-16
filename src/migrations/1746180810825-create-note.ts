import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateNote1746180810825 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
              CREATE TABLE notes (
                  id SERIAL PRIMARY KEY,
                  user_id INTEGER NOT NULL,
                  title VARCHAR(255) NOT NULL,
                  content TEXT,
                  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
                  CONSTRAINT fk_user
                      FOREIGN KEY(user_id) 
                      REFERENCES Users(id)
                      ON DELETE CASCADE
              );
            `);
      }
    
      public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE notes;`)
      }
    }