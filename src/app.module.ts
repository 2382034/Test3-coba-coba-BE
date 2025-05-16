// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config'; // ConfigService akan di-provide di sini
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt'; // JwtService akan di-provide di sini
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthGuard } from './auth/auth.guard';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './user/user.module'; // Ganti UserModule menjadi UsersModule
import { RecipesModule } from './recipes/recipes.module';
import { PostingsModule } from './posting/posting.module';
import { NotesModule } from './notes/notes.module';
import { DataMahasiswaModule } from './datamahasiswa/data.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Tetap buat ConfigModule global agar ConfigService mudah di-inject di mana-mana
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule], // Diperlukan agar useFactory bisa inject ConfigService
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('POSTGRES_HOST'),
        port: configService.get<number>('POSTGRES_PORT', 5432), // Menggunakan cara yang lebih baik untuk port
        password: configService.get<string>('POSTGRES_PASSWORD'),
        username: configService.get<string>('POSTGRES_USER'),
        database: configService.get<string>('POSTGRES_DATABASE'),
        migrations: ['dist/migrations/*.js'],
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        autoLoadEntities: true,
        synchronize: false, // Tetap false untuk produksi, gunakan migrasi
        ssl: true, // <-- SSL selalu diaktifkan, seperti kode lama Anda
                   // Anda bisa juga menggunakan { rejectUnauthorized: false } jika itu yang bekerja
                   // ssl: { rejectUnauthorized: false },
      }),
    }),
    AuthModule,  // AuthModule masih perlu diimpor
    UsersModule, // UsersModule masih perlu diimpor
    RecipesModule,
    PostingsModule,
    NotesModule,
    DataMahasiswaModule,
    // JwtModule bisa diimpor di sini jika ingin mengkonfigurasinya secara terpusat
    // dan kemudian JwtService bisa di-provide di bawah.
    // Namun, jika AuthModule sudah mengkonfigurasi JwtModule (meskipun tanpa global:true),
    // maka AuthModule harus MENGEKSPOR JwtModule agar JwtService dari sana bisa di-inject oleh AuthGuard.
    // Untuk kesederhanaan dan meniru "lama", kita akan konfigurasikan JwtModule di sini juga.
    JwtModule.registerAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: async (configService: ConfigService) => ({
            secret: configService.get<string>('JWT_SECRET'),
            signOptions: {
              expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '3600s',
            },
        }),
        // TIDAK ADA global: true di sini
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ConfigService, // Sediakan ConfigService di sini (meskipun ConfigModule sudah global)
    JwtService,    // Sediakan JwtService di sini (akan menggunakan konfigurasi dari JwtModule.registerAsync di atas)
    {
      provide: APP_GUARD,
      useClass: AuthGuard, // AuthGuard akan bisa meng-inject JwtService dan ConfigService dari AppModule ini
    },
  ],
})
export class AppModule {}
