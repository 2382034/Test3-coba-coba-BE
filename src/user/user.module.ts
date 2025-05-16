// src/user/user.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersService } from './user.service';
import { UserController } from './user.controller'; // Asumsi Anda memiliki UserController

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), // Daftarkan entitas User di sini
  ],
  controllers: [UserController],       // Daftarkan UserController di sini
  providers: [UsersService],          // Sediakan UsersService
  exports: [UsersService],            // PENTING: Ekspor UsersService agar bisa digunakan modul lain (seperti AuthModule)
})
export class UsersModule {}