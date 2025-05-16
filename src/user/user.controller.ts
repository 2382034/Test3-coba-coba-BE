// src/user/user.controller.ts
import { Controller, Get, Req, UseGuards, NotFoundException, ParseIntPipe, Param } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { UsersService } from './user.service';
// import { User } from './user.entity'; // User tidak perlu diimpor di sini jika hanya digunakan sebagai tipe di service
import { ProfileDto } from './profile.dto'; // DIPERBAIKI PATH
import { Request } from 'express';
import { UserRole } from './user.entity'; // Impor UserRole jika digunakan di AuthenticatedRequest

interface AuthenticatedRequest extends Request {
  user: {
    sub: number;
    username: string;
    email: string; // Pastikan ada jika digunakan
    role: UserRole; // Atau string
  };
}

@Controller('users')
export class UserController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AuthGuard)
  @Get('profile')
  async getMyProfile(@Req() request: AuthenticatedRequest): Promise<ProfileDto> {
    const userId = request.user.sub;
    const userEntity = await this.usersService.findOneById(userId);

    if (!userEntity) {
      throw new NotFoundException('User tidak ditemukan.');
    }

    const profile: ProfileDto = {
      id: userEntity.id,
      username: userEntity.username,
      email: userEntity.email,
      role: userEntity.role,
      profilePicture: userEntity.profilePicture,
      bio: userEntity.bio,
      createdAt: userEntity.createdAt,
      updatedAt: userEntity.updatedAt,
    };
    return profile;
  }
  async someControllerMethod(@Param('userId', ParseIntPipe) userId: number) { // Contoh penggunaan
    const userEntity = await this.usersService.findOneById(userId);
    if (!userEntity) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }
    // ... lakukan sesuatu dengan userEntity ...
}
}