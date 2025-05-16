// src/user/user.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

// Definisikan tipe untuk role jika Anda ingin lebih ketat
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

@Entity('users') // Pastikan nama tabel sesuai dengan migrasi ('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  email: string;

  @Column({ name: 'password_hash', type: 'text' }) // Sesuaikan nama kolom
  passwordHash: string; // Nama properti bisa berbeda dari nama kolom

  @Column({ type: 'varchar', length: 50, default: 'user' })
  role: UserRole; // Gunakan tipe UserRole

  @Column({ name: 'profile_picture', type: 'text', nullable: true })
  profilePicture?: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}
