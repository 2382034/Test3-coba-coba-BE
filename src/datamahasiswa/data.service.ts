// DataMahasiswa/data.service.ts
import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, DeepPartial, Not, ILike } from 'typeorm'; // Menambahkan Like, Not, ILike
import { Prodi, Mahasiswa, Alamat } from './data.entity';
import {
  CreateProdiDto, UpdateProdiDto,
  CreateMahasiswaDto, UpdateMahasiswaDto,
  FindMahasiswaQueryDto, SortOrder,
  CreateAlamatDto, UpdateAlamatDto, SortMahasiswaBy
} from './create-data.dto';
// fs, path, dan MAHASISWA_FOTO_PATH tidak diperlukan jika Vercel Blob adalah satu-satunya sumber
// dan tidak ada operasi file lokal untuk foto

@Injectable()
export class DataService {
  constructor(
    @InjectRepository(Prodi)
    private prodiRepository: Repository<Prodi>,
    @InjectRepository(Mahasiswa)
    private mahasiswaRepository: Repository<Mahasiswa>,
    @InjectRepository(Alamat)
    private alamatRepository: Repository<Alamat>,
    private dataSource: DataSource,
  ) {}

  // --- Validasi/Normalisasi Kustom ---
  private async validateNIMUniqueness(nim: string, currentMahasiswaId?: number): Promise<void> {
    const queryOptions: any = { nim };
    if (currentMahasiswaId) {
      queryOptions.id = Not(currentMahasiswaId); // Periksa NIM untuk mahasiswa lain
    }
    const existingMahasiswa = await this.mahasiswaRepository.findOne({ where: queryOptions });
    if (existingMahasiswa) {
      throw new BadRequestException(`NIM "${nim}" sudah digunakan oleh mahasiswa lain.`);
    }
  }

  private isValidAlamat(alamat: CreateAlamatDto | UpdateAlamatDto): boolean {
    if (!alamat) return true; // Jika tidak ada alamat yang diberikan (mis. pembaruan sebagian), anggap valid untuk pemeriksaan ini
    
    if (alamat.kode_pos && !/^\d{5}$/.test(alamat.kode_pos.replace(/\s+/g, ''))) { // Hapus spasi sebelum pemeriksaan
      throw new BadRequestException('Format Kode Pos tidak valid. Harus terdiri dari 5 angka.');
    }
    return true;
  }

  // private normalizeNama(nama: string): string { // DTO @Transform menangani ini
  //   if (!nama) return nama;
  //   return nama.trim().toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
  // }

  // --- Metode Layanan Prodi ---
  async createProdi(createProdiDto: CreateProdiDto): Promise<Prodi> {
    const prodi = this.prodiRepository.create(createProdiDto);
    try {
      return await this.prodiRepository.save(prodi);
    } catch (error) {
      if (error.code === '23505') { // Pelanggaran batasan unik (unique constraint violation)
        throw new BadRequestException('Nama prodi sudah ada.');
      }
      console.error('Error saat membuat prodi:', error);
      throw new InternalServerErrorException('Gagal membuat prodi.');
    }
  }

  findAllProdi(): Promise<Prodi[]> {
    return this.prodiRepository.find();
  }

  async findOneProdi(id: number): Promise<Prodi> {
    const prodi = await this.prodiRepository.findOneBy({ id });
    if (!prodi) {
      throw new NotFoundException(`Prodi dengan ID "${id}" tidak ditemukan.`);
    }
    return prodi;
  }

  async updateProdi(id: number, updateProdiDto: UpdateProdiDto): Promise<Prodi> {
    const prodiToUpdate = await this.findOneProdi(id); // Memastikan prodi ada
    this.prodiRepository.merge(prodiToUpdate, updateProdiDto);
    try {
      return await this.prodiRepository.save(prodiToUpdate);
    } catch (error) {
      if (error.code === '23505') {
        throw new BadRequestException('Nama prodi sudah ada (konflik dengan data lain).');
      }
      console.error('Error saat memperbarui prodi:', error);
      throw new InternalServerErrorException('Gagal memperbarui prodi.');
    }
  }

  async removeProdi(id: number): Promise<void> {
    const result = await this.prodiRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Prodi dengan ID "${id}" tidak ditemukan.`);
    }
  }

  // --- Metode Layanan Mahasiswa ---
  async createMahasiswa(createMahasiswaDto: CreateMahasiswaDto): Promise<Mahasiswa> {
    const { prodi_id, alamat: alamatDto, nim, nama, ...mahasiswaData } = createMahasiswaDto;

    await this.validateNIMUniqueness(nim);
    this.isValidAlamat(alamatDto); 

    const prodi = await this.findOneProdi(prodi_id); // Akan melempar NotFoundException jika prodi tidak ditemukan

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Alamat dibuat terlebih dahulu karena Mahasiswa mungkin bergantung pada ID-nya jika tidak menggunakan cascade dengan benar,
      // atau hanya untuk memastikan itu ada sebelum diasosiasikan. Dengan cascade, TypeORM menangani urutannya.
      const alamat = queryRunner.manager.create(Alamat, alamatDto);
      // Tidak perlu menyimpan alamat secara terpisah jika cascade:true pada Mahasiswa.alamat

      const mahasiswa = queryRunner.manager.create(Mahasiswa, {
        ...mahasiswaData,
        nim,
        nama, // DTO @Transform seharusnya menangani kapitalisasi
        prodi: prodi, // Tetapkan objek prodi penuh
        prodi_id: prodi.id, // Juga tetapkan FK secara eksplisit
        alamat: alamat, // Tetapkan objek alamat untuk di-cascade
      });
      
      // Foto mahasiswa akan null pada awalnya atau dapat diatur jika createMahasiswaDto menyertakannya
      // dan itu hanya URL (bukan unggahan file yang ditangani oleh metode ini).
      // Pengaturan saat ini: foto diunggah melalui endpoint terpisah.

      const savedMahasiswa = await queryRunner.manager.save(Mahasiswa, mahasiswa); // Ini juga akan menyimpan alamat yang di-cascade
      await queryRunner.commitTransaction();
      
      // Ambil ulang untuk memastikan semua relasi (terutama yang eager) dimuat seperti yang diharapkan oleh frontend
      return await this.mahasiswaRepository.findOneOrFail({ 
        where: { id: savedMahasiswa.id },
        relations: ['prodi', 'alamat'],
      });

    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      if (error.code === '23505' && error.detail && error.detail.includes('(nim)')) {
        throw new BadRequestException('NIM sudah digunakan.');
      }
      console.error('Error saat membuat mahasiswa:', error);
      throw new InternalServerErrorException('Gagal membuat mahasiswa.');
    } finally {
      await queryRunner.release();
    }
  }

  async findAllMahasiswa(queryDto: FindMahasiswaQueryDto): Promise<{ data: Mahasiswa[], count: number, currentPage: number, totalPages: number }> {
    const { search, prodi_id, sortBy = SortMahasiswaBy.NAMA, sortOrder = SortOrder.ASC, page = 1, limit = 10 } = queryDto;
    const skip = (page - 1) * limit;

    const query = this.mahasiswaRepository.createQueryBuilder('mahasiswa')
      .leftJoinAndSelect('mahasiswa.prodi', 'prodi')
      .leftJoinAndSelect('mahasiswa.alamat', 'alamat');

    if (search) {
      query.andWhere('(mahasiswa.nama ILIKE :search OR mahasiswa.nim ILIKE :search)', { search: `%${search}%` });
    }

    if (prodi_id) {
      query.andWhere('mahasiswa.prodi_id = :prodi_id', { prodi_id });
    }
    
    query.orderBy(`mahasiswa.${sortBy}`, sortOrder); 
    query.skip(skip).take(limit);

    const [data, count] = await query.getManyAndCount();
    const totalPages = Math.ceil(count / limit);
    
    return { data, count, currentPage: Number(page), totalPages };
  }

  async findOneMahasiswa(id: number): Promise<Mahasiswa> {
    const mahasiswa = await this.mahasiswaRepository.findOne({ 
        where: { id },
        relations: ['prodi', 'alamat'], // Pastikan relasi dimuat
    });
    if (!mahasiswa) {
      throw new NotFoundException(`Mahasiswa dengan ID "${id}" tidak ditemukan.`);
    }
    return mahasiswa;
  }

  async updateMahasiswa(id: number, updateMahasiswaDto: UpdateMahasiswaDto): Promise<Mahasiswa> {
    // Ambil mahasiswa yang ada beserta relasinya
    const mahasiswaToUpdate = await this.mahasiswaRepository.findOne({
        where: { id },
        relations: ['prodi', 'alamat'], 
    });

    if (!mahasiswaToUpdate) {
        throw new NotFoundException(`Mahasiswa dengan ID "${id}" tidak ditemukan.`);
    }
    
    const { prodi_id, alamat: alamatDto, nim, nama, foto, ...otherMahasiswaData } = updateMahasiswaDto;

    if (nim && nim !== mahasiswaToUpdate.nim) {
      await this.validateNIMUniqueness(nim, id);
    }

    if (alamatDto) {
        this.isValidAlamat(alamatDto as UpdateAlamatDto);
    }
    
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        // Gabungkan data dasar. DTO @Transform menangani kapitalisasi nama.
        // 'foto' mungkin diteruskan sebagai null atau URL baru jika tidak ditangani oleh endpoint terpisah.
        // Jika 'foto' berasal dari DTO ini, diasumsikan sebagai URL.
        // Jika 'foto' di DTO adalah undefined, itu tidak akan menimpa yang ada. Jika null, akan menimpa.
        const updatePayload: Partial<Mahasiswa> = { ...otherMahasiswaData };
        if (nama !== undefined) updatePayload.nama = nama; // DTO Transform menanganinya
        if (nim !== undefined) updatePayload.nim = nim;
        if (foto !== undefined) updatePayload.foto = foto; // foto bisa diatur menjadi null di sini

        this.mahasiswaRepository.merge(mahasiswaToUpdate, updatePayload);

        // Tangani perubahan Prodi
        if (Object.prototype.hasOwnProperty.call(updateMahasiswaDto, 'prodi_id')) {
            if (updateMahasiswaDto.prodi_id === null) {
                mahasiswaToUpdate.prodi = null;
                mahasiswaToUpdate.prodi_id = null; 
            } else if (updateMahasiswaDto.prodi_id !== undefined) { 
                const prodi = await this.prodiRepository.findOneBy({ id: updateMahasiswaDto.prodi_id });
                if (!prodi) {
                    throw new BadRequestException(`Prodi dengan ID ${updateMahasiswaDto.prodi_id} tidak ditemukan.`);
                }
                mahasiswaToUpdate.prodi = prodi;
                mahasiswaToUpdate.prodi_id = prodi.id; 
            }
            // Jika prodi_id adalah undefined di DTO, prodi tidak diubah.
        }

        // Tangani perubahan Alamat
        if (Object.prototype.hasOwnProperty.call(updateMahasiswaDto, 'alamat')) {
            if (updateMahasiswaDto.alamat === null) { // Hapus alamat secara eksplisit
                if (mahasiswaToUpdate.alamat) {
                    await queryRunner.manager.remove(Alamat, mahasiswaToUpdate.alamat); 
                    mahasiswaToUpdate.alamat = null; 
                }
            } else if (updateMahasiswaDto.alamat) { // Perbarui atau buat alamat
                if (mahasiswaToUpdate.alamat) { // Alamat ada, gabungkan perubahan
                    // Pastikan menggunakan manager dari queryRunner untuk operasi dalam transaksi
                    queryRunner.manager.merge(Alamat, mahasiswaToUpdate.alamat, updateMahasiswaDto.alamat as Partial<Alamat>);
                } else { // Alamat tidak ada, buat baru dan tetapkan
                    const newAlamat = queryRunner.manager.create(Alamat, updateMahasiswaDto.alamat as DeepPartial<Alamat>);
                    mahasiswaToUpdate.alamat = newAlamat; // Akan di-cascade saat disimpan
                }
            }
             // Jika alamat adalah undefined di DTO, itu tidak diubah.
        }
        
        // Simpan mahasiswa. Alamat yang di-cascade akan disimpan.
        const savedResult = await queryRunner.manager.save(Mahasiswa, mahasiswaToUpdate);
        await queryRunner.commitTransaction();
        
        // Ambil ulang untuk memastikan semua relasi dimuat dengan benar
        return await this.mahasiswaRepository.findOneOrFail({
            where: { id: savedResult.id },
            relations: ['prodi', 'alamat'],
        });

    } catch (error) {
        if (queryRunner.isTransactionActive) {
            await queryRunner.rollbackTransaction();
        }
        if (error instanceof BadRequestException || error instanceof NotFoundException) {
            throw error;
        }
        if (error.code === '23505' && error.detail && error.detail.includes('nim')) {
            throw new BadRequestException('NIM sudah digunakan.');
        }
        console.error('Error saat memperbarui mahasiswa:', error.message, error.stack);
        throw new InternalServerErrorException('Gagal memperbarui mahasiswa.');
    } finally {
        if (!queryRunner.isReleased) {
            await queryRunner.release();
        }
    }
  }

  async updateMahasiswaFoto(id: number, fotoUrlFromBlob: string): Promise<Mahasiswa> {
    const mahasiswa = await this.findOneMahasiswa(id); // findOneMahasiswa sudah melempar NotFoundException

    // Foto lama di Vercel Blob seharusnya sudah dihapus oleh controller
    // *sebelum* memanggil metode layanan ini jika foto baru diunggah.
    // Metode layanan ini hanya memperbarui catatan DB dengan URL baru.
    mahasiswa.foto = fotoUrlFromBlob; // Simpan URL lengkap dari Vercel Blob
    await this.mahasiswaRepository.save(mahasiswa);
    return mahasiswa;
  }

  async removeMahasiswa(id: number): Promise<void> {
    // Controller seharusnya sudah memanggil findOneMahasiswa untuk mendapatkan data (mis. URL foto untuk dihapus dari Blob)
    // dan menangani penghapusan Vercel Blob. Metode layanan ini berfokus pada penghapusan catatan DB.
    // Kita masih bisa memanggil findOneMahasiswa di sini untuk memastikan itu ada sebelum mencoba menghapus,
    // atau mengandalkan controller yang telah melakukannya.
    const mahasiswa = await this.findOneMahasiswa(id); // Memastikan itu ada dan melempar NotFound jika tidak.
    
    // Penghapusan cascade untuk Alamat ditangani oleh TypeORM/DB berdasarkan relasi Mahasiswa.alamat (`cascade: true`, `onDelete: 'CASCADE'`).
    // Tidak perlu menghapus catatan Alamat secara manual di sini jika cascade diatur dengan benar.

    const result = await this.mahasiswaRepository.delete(id);
    if (result.affected === 0) {
      // Kasus ini idealnya ditangkap oleh findOneMahasiswa di atas jika dipanggil.
      throw new NotFoundException(`Mahasiswa dengan ID "${id}" tidak ditemukan.`);
    }
  }
}