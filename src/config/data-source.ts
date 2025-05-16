import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

ConfigModule.forRoot();
const configService = new ConfigService();

export default new DataSource({
  type: 'postgres',
  host: configService.get<string>('POSTGRES_HOST'),
  port: configService.get<string>('POSTGRES_PORT')
    ? configService.get<number>('POSTGRES_PORT')
    : 5432,
  password: configService.get<string>('POSTGRES_PASSWORD'),
  username: configService.get<string>('POSTGRES_USER'),
  database: configService.get<string>('POSTGRES_DATABASE'),
  migrations: ['src/migrations/**/*{.ts,.js}'],
  migrationsRun: false,
  logging: true,
  ssl: true
});
