// DataMahasiswa/data.service.ts
import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, DeepPartial, Like, Not, ILike } from 'typeorm'; // Added Like, Not, ILike
import { Prodi, Mahasiswa, Alamat } from './data.entity';
import {
  CreateProdiDto, UpdateProdiDto,
  CreateMahasiswaDto, UpdateMahasiswaDto,
  FindMahasiswaQueryDto, SortOrder, // Import new DTO and Enum
  CreateAlamatDto, UpdateAlamatDto, SortMahasiswaBy // For custom address validation
} from './create-data.dto';
import * as fs from 'fs'; // For file system operations (deleting old photo)
import * as path from 'path'; // For path operations
import { MAHASISWA_FOTO_PATH } from './constants';



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

  // --- Custom Validation/Normalization ---
  private async validateNIMUniqueness(nim: string, currentMahasiswaId?: number): Promise<void> {
    const queryOptions: any = { nim };
    if (currentMahasiswaId) {
      queryOptions.id = Not(currentMahasiswaId); // Check NIM for other students
    }
    const existingMahasiswa = await this.mahasiswaRepository.findOne({ where: queryOptions });
    if (existingMahasiswa) {
      throw new BadRequestException(`NIM "${nim}" sudah digunakan oleh mahasiswa lain.`);
    }
  }

  private isValidAlamat(alamat: CreateAlamatDto | UpdateAlamatDto): boolean {
    if (!alamat) return true; // If no alamat provided (e.g. partial update), consider it valid for this check
    
    // Example: Kode Pos must be 5 digits
    if (alamat.kode_pos && !/^\d{5}$/.test(alamat.kode_pos.replace(/\s+/g, ''))) { // Remove spaces before check
      throw new BadRequestException('Format Kode Pos tidak valid. Harus terdiri dari 5 angka.');
    }
    // Add more address validation rules as needed
    // e.g., check if provinsi is in a predefined list, etc.
    return true;
  }

  private normalizeNama(nama: string): string {
    if (!nama) return nama;
    return nama.trim().toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
  }

  // --- Prodi Service Methods --- (No change)
  async createProdi(createProdiDto: CreateProdiDto): Promise<Prodi> {
    const prodi = this.prodiRepository.create(createProdiDto);
    try {
      return await this.prodiRepository.save(prodi);
    } catch (error) {
      if (error.code === '23505') {
        throw new BadRequestException('Nama prodi sudah ada.');
      }
      console.error('Error creating prodi:', error);
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
    const result = await this.prodiRepository.update(id, updateProdiDto);
    if (result.affected === 0) {
      throw new NotFoundException(`Prodi dengan ID "${id}" tidak ditemukan.`);
    }
    return this.findOneProdi(id);
  }

  async removeProdi(id: number): Promise<void> {
    const result = await this.prodiRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Prodi dengan ID "${id}" tidak ditemukan.`);
    }
  }

  // --- Mahasiswa Service Methods ---
  async createMahasiswa(createMahasiswaDto: CreateMahasiswaDto): Promise<Mahasiswa> {
    const { prodi_id, alamat: alamatDto, nim, nama, ...mahasiswaData } = createMahasiswaDto;

    // Custom NIM validation
    await this.validateNIMUniqueness(nim);

    // Custom Alamat validation
    this.isValidAlamat(alamatDto); 

    // Normalize Nama (DTO transform handles this, but can be done here too)
    // const normalizedNama = this.normalizeNama(nama);

    const prodi = await this.findOneProdi(prodi_id);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const alamat = queryRunner.manager.create(Alamat, alamatDto);
      const mahasiswa = queryRunner.manager.create(Mahasiswa, {
        ...mahasiswaData,
        nim, // Use original nim
        nama, // Use DTO transformed nama or normalizedNama if done here
        prodi: prodi,
        alamat: alamat,
      });
      
      const savedMahasiswa = await queryRunner.manager.save(Mahasiswa, mahasiswa);
      await queryRunner.commitTransaction();
      
      return await this.mahasiswaRepository.findOneOrFail({ 
        where: { id: savedMahasiswa.id },
        relations: ['prodi', 'alamat'], // Ensure relations are loaded
      });

    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof BadRequestException) throw error; // Re-throw custom validation errors
      if (error.code === '23505' && error.detail && error.detail.includes('(nim)')) {
        throw new BadRequestException('NIM sudah digunakan.');
      }
      console.error('Error creating mahasiswa:', error);
      throw new InternalServerErrorException('Gagal membuat mahasiswa.');
    } finally {
      await queryRunner.release();
    }
  }

  async findAllMahasiswa(queryDto: FindMahasiswaQueryDto): Promise<{ data: Mahasiswa[], count: number, currentPage: number, totalPages: number }> {
    const { search, prodi_id, sortBy, sortOrder, page = 1, limit = 10 } = queryDto;
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

    // CORRECTED/SIMPLIFIED SORTING:
    // sortBy is guaranteed to be 'nama' or 'nim' by DTO validation and default value.
    query.orderBy(`mahasiswa.${sortBy}`, sortOrder); 
    
    query.skip(skip).take(limit);

    const [data, count] = await query.getManyAndCount();
    const totalPages = Math.ceil(count / limit);
    
    return { data, count, currentPage: Number(page), totalPages };
  }

  async findOneMahasiswa(id: number): Promise<Mahasiswa> {
    const mahasiswa = await this.mahasiswaRepository.findOne({ 
        where: { id },
        relations: ['prodi', 'alamat'], // Eager load relations
    });
    if (!mahasiswa) {
      throw new NotFoundException(`Mahasiswa dengan ID "${id}" tidak ditemukan.`);
    }
    return mahasiswa;
  }

  async updateMahasiswa(id: number, updateMahasiswaDto: UpdateMahasiswaDto): Promise<Mahasiswa> {
    const mahasiswaToUpdate = await this.mahasiswaRepository.findOne({
        where: { id },
        relations: ['prodi', 'alamat'], 
    });

    if (!mahasiswaToUpdate) {
        throw new NotFoundException(`Mahasiswa dengan ID "${id}" tidak ditemukan.`);
    }
    
    const { prodi_id, alamat: alamatDto, nim, nama, ...mahasiswaData } = updateMahasiswaDto;

    // Custom NIM validation if NIM is being changed
    if (nim && nim !== mahasiswaToUpdate.nim) {
      await this.validateNIMUniqueness(nim, id);
    }

    // Custom Alamat validation
    if (alamatDto) {
        this.isValidAlamat(alamatDto as UpdateAlamatDto); // Cast to UpdateAlamatDto
    }
    
    // Normalize Nama if provided (DTO transform handles this, but can be done here too)
    // if (nama) {
    //   mahasiswaData.nama = this.normalizeNama(nama);
    // }


    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        // Merge basic data (including potentially normalized nama from DTO or service)
        this.mahasiswaRepository.merge(mahasiswaToUpdate, { ...mahasiswaData, nim, nama } as Partial<Mahasiswa>);


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
        }

        if (Object.prototype.hasOwnProperty.call(updateMahasiswaDto, 'alamat')) {
            if (updateMahasiswaDto.alamat === null) {
                if (mahasiswaToUpdate.alamat) {
                    await queryRunner.manager.remove(Alamat, mahasiswaToUpdate.alamat); 
                    mahasiswaToUpdate.alamat = null; 
                }
            } else if (updateMahasiswaDto.alamat) { 
                if (mahasiswaToUpdate.alamat) {
                    this.alamatRepository.merge(mahasiswaToUpdate.alamat, updateMahasiswaDto.alamat as Partial<Alamat>);
                } else {
                    const newAlamat = this.alamatRepository.create(updateMahasiswaDto.alamat as DeepPartial<Alamat>);
                    mahasiswaToUpdate.alamat = newAlamat;
                }
            }
        }
        
        const savedResult = await queryRunner.manager.save(Mahasiswa, mahasiswaToUpdate);
        await queryRunner.commitTransaction();
        
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
        console.error('Error updating mahasiswa:', error.message, error.stack);
        throw new InternalServerErrorException('Gagal memperbarui mahasiswa.');
    } finally {
        if (!queryRunner.isReleased) {
            await queryRunner.release();
        }
    }
  }

  async updateMahasiswaFoto(id: number, fotoFilename: string): Promise<Mahasiswa> {
    const mahasiswa = await this.findOneMahasiswa(id); // findOneMahasiswa already throws NotFoundException

    // Delete old photo if it exists
    if (mahasiswa.foto) {
      const oldFotoPath = path.join(`./${MAHASISWA_FOTO_PATH}`, mahasiswa.foto);
      if (fs.existsSync(oldFotoPath)) {
        try {
          fs.unlinkSync(oldFotoPath);
        } catch (err) {
          console.error('Failed to delete old photo:', oldFotoPath, err);
          // Decide if this should be a critical error. Usually not.
        }
      }
    }

    mahasiswa.foto = fotoFilename; // filename will be like 'uuid.ext'
    await this.mahasiswaRepository.save(mahasiswa);
    return mahasiswa;
  }


  async removeMahasiswa(id: number): Promise<void> {
    const mahasiswa = await this.findOneMahasiswa(id); // Check if exists and get data

    // Delete associated photo file
    if (mahasiswa.foto) {
      const fotoPath = path.join(`./${MAHASISWA_FOTO_PATH}`, mahasiswa.foto);
      if (fs.existsSync(fotoPath)) {
        try {
          fs.unlinkSync(fotoPath);
        } catch (err) {
          console.error('Failed to delete photo on removeMahasiswa:', fotoPath, err);
          // Log error, but proceed with DB deletion
        }
      }
    }

    const result = await this.mahasiswaRepository.delete(id); // Cascade delete for Alamat is handled by DB/TypeORM
    if (result.affected === 0) {
      // This case should ideally be caught by findOneMahasiswa above
      throw new NotFoundException(`Mahasiswa dengan ID "${id}" tidak ditemukan.`);
    }
  }
}