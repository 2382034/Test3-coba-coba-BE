// src/user/user.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity'; // Pastikan UserRole diimpor

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // --- PASTIKAN METODE INI ADA DAN NAMANYA BENAR ---
  async create(userData: {
    username: string;
    email: string;
    passwordHash: string;
    role: UserRole; // Pastikan tipe UserRole digunakan di sini juga
    profilePicture?: string;
    bio?: string;
  }): Promise<User> {
    const user = this.usersRepository.create(userData);
    return this.usersRepository.save(user);
  }
  // --- AKHIR DARI METODE CREATE ---

  async findOneById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findOneByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  // ... metode lainnya ...
}