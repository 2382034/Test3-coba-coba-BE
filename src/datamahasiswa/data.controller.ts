// DataMahasiswa/data.controller.ts
import {
  Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UsePipes, ValidationPipe,
  Query,
  UploadedFile,
  UseInterceptors,
  Res, // Masih mungkin dibutuhkan untuk respons lain, tapi tidak untuk serve file lokal
  BadRequestException,
  InternalServerErrorException, // Untuk error server
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer'; // Ganti diskStorage dengan memoryStorage
import { extname, basename } from 'path'; // extname dan basename mungkin masih berguna
import { v4 as uuidv4 } from 'uuid'; // Untuk nama file unik di Blob
import type { Response } from 'express';
import { put, del as deleteBlob } from '@vercel/blob'; // Impor fungsi dari @vercel/blob
import * as fs from 'fs'; // Jika Anda memilih /tmp dan butuh fs
import * as os from 'os'; // Untuk mendapatkan direktori /tmp
import * as path from 'path'; // Untuk path.join

import { DataService } from './data.service';
import {
  CreateProdiDto, UpdateProdiDto,
  CreateMahasiswaDto, UpdateMahasiswaDto,
  FindMahasiswaQueryDto,
} from './create-data.dto';
// MAHASISWA_FOTO_PATH tidak lagi relevan untuk penyimpanan lokal permanen
// tapi bisa digunakan sebagai prefix di Vercel Blob jika diinginkan
const BLOB_FOTO_MAHASISWA_PREFIX = 'mahasiswa-fotos/';

// Helper for Multer file filter (tetap sama)
export const imageFileFilter = (req, file, callback) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) { // i untuk case-insensitive
    return callback(new BadRequestException('Only image files (JPG, JPEG, PNG, GIF) are allowed!'), false);
  }
  callback(null, true);
};

@Controller('data')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
export class DataController {
  constructor(private readonly dataService: DataService) {}

  // --- Prodi Endpoints --- (Tidak berubah)
  @Post('prodi')
  createProdi(@Body() createProdiDto: CreateProdiDto) {
    return this.dataService.createProdi(createProdiDto);
  }

  @Get('prodi')
  findAllProdi() {
    return this.dataService.findAllProdi();
  }

  @Get('prodi/:id')
  findOneProdi(@Param('id', ParseIntPipe) id: number) {
    return this.dataService.findOneProdi(id);
  }

  @Patch('prodi/:id')
  updateProdi(@Param('id', ParseIntPipe) id: number, @Body() updateProdiDto: UpdateProdiDto) {
    return this.dataService.updateProdi(id, updateProdiDto);
  }

  @Delete('prodi/:id')
  removeProdi(@Param('id', ParseIntPipe) id: number) {
    return this.dataService.removeProdi(id);
  }

  // --- Mahasiswa Endpoints ---
  @Post('mahasiswa')
  // Jika createMahasiswa juga melibatkan upload foto secara langsung (bukan endpoint terpisah)
  // maka interceptor akan diletakkan di sini. Tapi karena Anda punya endpoint foto terpisah, ini tetap.
  createMahasiswa(@Body() createMahasiswaDto: CreateMahasiswaDto) {
    return this.dataService.createMahasiswa(createMahasiswaDto);
  }

  @Get('mahasiswa')
  findAllMahasiswa(@Query() query: FindMahasiswaQueryDto) {
    return this.dataService.findAllMahasiswa(query);
  }

  @Get('mahasiswa/:id')
  async findOneMahasiswa(@Param('id', ParseIntPipe) id: number) {
    // Penting: Pastikan dataService.findOneMahasiswa mengembalikan mahasiswa termasuk URL foto dari Blob
    const mahasiswa = await this.dataService.findOneMahasiswa(id);
    if (!mahasiswa) {
        throw new NotFoundException(`Mahasiswa dengan ID ${id} tidak ditemukan.`);
    }
    return mahasiswa;
  }

  @Patch('mahasiswa/:id')
  updateMahasiswa(@Param('id', ParseIntPipe) id: number, @Body() updateMahasiswaDto: UpdateMahasiswaDto) {
    return this.dataService.updateMahasiswa(id, updateMahasiswaDto);
  }

  // Endpoint untuk menghapus mahasiswa, mungkin juga perlu menghapus fotonya dari Blob
  @Delete('mahasiswa/:id')
  async removeMahasiswa(@Param('id', ParseIntPipe) id: number) {
    // 1. Dapatkan informasi mahasiswa, termasuk URL foto lama jika ada
    const mahasiswa = await this.dataService.findOneMahasiswa(id); // Asumsi ini mengambil data termasuk fotoUrl
    if (mahasiswa && mahasiswa.foto) {
      try {
        // Hapus foto lama dari Vercel Blob
        // Pastikan mahasiswa.foto adalah URL lengkap dari Vercel Blob
        await deleteBlob(mahasiswa.foto);
        console.log(`Foto lama ${mahasiswa.foto} berhasil dihapus dari Vercel Blob.`);
      } catch (blobError) {
        console.error(`Gagal menghapus foto lama ${mahasiswa.foto} dari Vercel Blob:`, blobError);
        // Lanjutkan proses penghapusan data mahasiswa meskipun foto gagal dihapus,
        // atau tangani sesuai kebutuhan (misalnya, log untuk penghapusan manual nanti)
      }
    }
    // 2. Hapus data mahasiswa dari database
    return this.dataService.removeMahasiswa(id);
  }


  // Endpoint untuk mengunggah/memperbarui foto Mahasiswa ke Vercel Blob
  @Post('mahasiswa/:id/foto')
  @UseInterceptors(
    FileInterceptor('foto', { // 'foto' adalah field name
      storage: memoryStorage(), // Simpan file di memori sebagai Buffer
      fileFilter: imageFileFilter,
      limits: { fileSize: 1024 * 1024 * 5 }, // 5MB limit
    }),
  )
  async uploadMahasiswaFoto(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File foto diperlukan.');
    }
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        throw new InternalServerErrorException('Konfigurasi penyimpanan Blob tidak ditemukan.');
    }

    // Dapatkan data mahasiswa yang ada untuk menghapus foto lama jika ada
    const existingMahasiswa = await this.dataService.findOneMahasiswa(id);
    if (!existingMahasiswa) {
        throw new NotFoundException(`Mahasiswa dengan ID ${id} tidak ditemukan untuk upload foto.`);
    }

    // Nama file unik untuk Vercel Blob
    const uniqueSuffix = uuidv4();
    const extension = extname(file.originalname);
    const blobFilename = `${BLOB_FOTO_MAHASISWA_PREFIX}${uniqueSuffix}${extension}`;

    try {
      // Unggah file buffer ke Vercel Blob
      const blob = await put(blobFilename, file.buffer, {
        access: 'public', // Membuat file dapat diakses publik
        contentType: file.mimetype, // Penting untuk browser menampilkan gambar dengan benar
        // Anda bisa menambahkan metadata lain jika perlu:
        // addRandomSuffix: false, // Kita sudah buat nama unik
        // cacheControlMaxAge: 3600, // Cache selama 1 jam (opsional)
      });

      // Hapus foto lama dari Vercel Blob jika ada dan berbeda
      if (existingMahasiswa.foto && existingMahasiswa.foto !== blob.url) {
        try {
          await deleteBlob(existingMahasiswa.foto);
          console.log(`Foto lama ${existingMahasiswa.foto} berhasil dihapus dari Vercel Blob.`);
        } catch (blobDeleteError) {
          console.error(`Gagal menghapus foto lama ${existingMahasiswa.foto} dari Vercel Blob:`, blobDeleteError);
          // Lanjutkan meskipun gagal menghapus foto lama, atau tangani error
        }
      }

      // Update path foto di database dengan URL dari Vercel Blob
      return this.dataService.updateMahasiswaFoto(id, blob.url);

    } catch (error) {
      console.error('Error uploading to Vercel Blob:', error);
      throw new InternalServerErrorException('Gagal mengunggah foto.', error.message);
    }
  }

  // Endpoint @Get('mahasiswa/foto/:filename') sudah tidak relevan
  // karena file akan disajikan langsung dari URL Vercel Blob yang disimpan di database.
  // Frontend akan menggunakan URL tersebut (misalnya, mahasiswa.foto) untuk menampilkan gambar.
  // Jika Anda tetap ingin proxy, Anda perlu mengambil dari URL blob dan stream ke klien,
  // tapi itu umumnya tidak diperlukan.
}