// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common'; // Tambahkan ConflictException
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../user/user.service';
import { CreateUserDto } from '../user/create-user.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../user/user.entity';

export interface JwtPayload {
  sub: number; // User ID
  username: string;
  role: UserRole; // Sertakan role di payload JWT
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<Omit<User, 'passwordHash'> | null> {
    const user = await this.usersService.findOneByEmail(email); // Pastikan findOneByEmail ada di UsersService
    if (user && user.passwordHash && await bcrypt.compare(pass, user.passwordHash)) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async register(createUserDto: CreateUserDto) {
    const existingUserByEmail = await this.usersService.findOneByEmail(createUserDto.email);
    if (existingUserByEmail) {
      // Gunakan ConflictException untuk error duplikasi yang lebih spesifik
      throw new ConflictException('Email sudah terdaftar.');
    }
    // Anda mungkin juga ingin mengecek username jika unik
    if (createUserDto.username) { // Cek jika username ada di DTO
        const existingUserByUsername = await this.usersService.findOneByUsername(createUserDto.username);
        if (existingUserByUsername) {
            throw new ConflictException('Username sudah terdaftar.');
        }
    }


    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Tentukan role:
    // 1. Ambil dari DTO jika ada (misalnya, jika admin membuat user).
    // 2. Jika tidak ada di DTO (registrasi publik), default ke 'user'.
    const roleToSave: UserRole = createUserDto.role || UserRole.USER;

    // Pastikan struktur data ini cocok dengan parameter metode `create` di `UsersService`
    // Dan pastikan `usersService.create` benar-benar menyimpan semua field ini.
    const userToCreateData = {
      username: createUserDto.username,
      email: createUserDto.email,
      passwordHash: hashedPassword,
      role: roleToSave, // Simpan role yang sudah ditentukan
      // Jika ada field lain seperti profilePicture, bio, dll. dari DTO, tambahkan di sini
    };

    // Asumsi: this.usersService.create menerima objek dengan properti di atas
    // dan menggunakan userRepository.create() dan userRepository.save()
    let newUser: User;
    try {
        newUser = await this.usersService.create(userToCreateData);
    } catch (error) {
        // Tangani error spesifik dari service jika perlu, atau biarkan NestJS yang menangani
        // Contoh: jika service melempar error karena validasi internal
        throw new BadRequestException('Gagal membuat pengguna: ' + error.message);
    }


    const payload: JwtPayload = {
        username: newUser.username,
        sub: newUser.id,
        role: newUser.role, // Role dari newUser yang baru dibuat
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role, // Pastikan role dikembalikan
      },
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Email atau password salah.');
    }

    const payload: JwtPayload = {
        username: user.username,
        sub: user.id,
        role: user.role, // Pastikan role ada di objek user dari validateUser
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role, // Pastikan role dikembalikan
      },
    };
  }
}