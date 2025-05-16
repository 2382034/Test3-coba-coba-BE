// src/user/create-user.dto.ts
import { IsString, IsEmail, MinLength, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { UserRole } from './user.entity'; // Impor UserRole enum yang baru

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Username tidak boleh kosong' })
  @MinLength(3, { message: 'Username minimal 3 karakter' })
  username: string;

  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  password: string;

  @IsOptional()
  // --- PERUBAHAN DIMULAI DI SINI ---
  // Sekarang @IsEnum akan bekerja dengan UserRole enum
  @IsEnum(UserRole, { message: `Role harus berupa salah satu dari: ${Object.values(UserRole).join(', ')}` })
  // --- PERUBAHAN BERAKHIR DI SINI ---
  role?: UserRole;
}