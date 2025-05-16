// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../user/user.module';     // Impor UsersModule untuk mengakses UsersService
import { PassportModule } from '@nestjs/passport';    // Sering digunakan, meskipun tidak wajib untuk JWT dasar
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config'; // Diperlukan untuk konfigurasi JWT dari .env

@Module({
  imports: [
    ConfigModule, // Pastikan ConfigModule tersedia (bisa juga diimpor di AppModule dengan isGlobal: true)
    UsersModule,  // Impor UsersModule agar AuthService bisa meng-inject UsersService
    PassportModule.register({ defaultStrategy: 'jwt' }), // Konfigurasi Passport jika Anda menggunakan strategi JWT
    JwtModule.registerAsync({
      imports: [ConfigModule], // JwtModule perlu akses ke ConfigService
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '3600s', // Durasi token, contoh: 1 jam
        },
      }),
      global: true, // PENTING: Membuat JwtService tersedia secara global untuk AuthGuard
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    // Tidak perlu UsersService di sini karena sudah di-handle oleh UsersModule
    // Tidak perlu JwtStrategy di sini kecuali Anda secara eksplisit mendefinisikannya dan tidak menggunakan default dari PassportModule
  ],
  exports: [
    AuthService, // Ekspor AuthService jika modul lain perlu menggunakannya
    // Tidak perlu ekspor JwtModule jika global: true sudah diatur
  ],
})
export class AuthModule {}