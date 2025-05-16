// src/auth/dto/register.dto.ts (atau di mana pun DTO ini berada)
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '../../user/user.entity'; // Asumsi UserRole diekspor dari user.entity

export class RegisterDTO { // Ubah nama kelas menjadi PascalCase (konvensi)
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'johndoe', description: 'Username pengguna' })
  username: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail() // Tambahkan validasi email
  @ApiProperty({ example: 'john.doe@example.com', description: 'Email pengguna' })
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password minimal 8 karakter' }) // Tambahkan validasi panjang password
  @ApiProperty({ example: 'P@$$wOrd123', description: 'Password pengguna (minimal 8 karakter)' })
  password: string;

  @IsOptional() // Buat opsional jika tidak selalu dikirim atau jika ada default
  @IsString()
  @IsIn(['user', 'admin'] as UserRole[]) // Validasi bahwa role adalah 'user' atau 'admin'
  @ApiProperty({
    example: 'user',
    description: 'Peran pengguna (user atau admin)',
    enum: ['user', 'admin'],
    required: false, // Jika opsional
  })
  role?: UserRole; // Atau string jika Anda tidak menggunakan tipe UserRole
}