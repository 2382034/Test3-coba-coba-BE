// src/user/profile.dto.ts
import { UserRole } from "./user.entity"; // Pastikan path ke user.entity.ts benar
                                       // Jika user.entity.ts ada di src/user/, maka './user.entity' sudah benar.

export class ProfileDto { // <--- PASTIKAN ADA 'export' DAN NAMA KELASNYA 'ProfileDto'
  id: number;
  username: string;
  email: string;
  role: UserRole; // Atau string jika Anda tidak menggunakan tipe enum/literal
  profilePicture?: string; // Opsional
  bio?: string;            // Opsional
  createdAt: Date;
  updatedAt: Date;
  // Tambahkan atau kurangi field sesuai dengan apa yang ingin Anda tampilkan di profil
}