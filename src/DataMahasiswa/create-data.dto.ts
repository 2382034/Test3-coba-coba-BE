// DataMahasiswa/create-data.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsOptional,
  MinLength,
  ValidateNested,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { Type, Transform } from 'class-transformer'; // CORRECTED IMPORT FOR Transform

// --- Prodi DTOs ---
export class CreateProdiDto {
  @IsString()
  @IsNotEmpty()
  nama_prodi: string;

  @IsString()
  @IsNotEmpty()
  fakultas: string;
}

export class UpdateProdiDto {
  @IsString()
  @IsOptional()
  nama_prodi?: string;

  @IsString()
  @IsOptional()
  fakultas?: string;
}

// --- Alamat DTO (untuk Mahasiswa) ---
export class CreateAlamatDto {
  @IsString()
  @IsNotEmpty()
  jalan: string;

  @IsString()
  @IsNotEmpty()
  kota: string;

  @IsString()
  @IsNotEmpty()
  provinsi: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => typeof value === 'string' ? value.replace(/\s+/g, '') : value)
  kode_pos: string;
}

export class UpdateAlamatDto {
  @IsString()
  @IsOptional()
  jalan?: string;

  @IsString()
  @IsOptional()
  kota?: string;

  @IsString()
  @IsOptional()
  provinsi?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.replace(/\s+/g, '') : value)
  kode_pos?: string;
}

// --- Mahasiswa DTOs ---
export class CreateMahasiswaDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase().replace(/\b\w/g, char => char.toUpperCase()) : value)
  nama: string;

  @IsString()
  @IsNotEmpty()
  nim: string;

  @IsString()
  @IsOptional()
  foto?: string;

  @IsNumber()
  @IsNotEmpty()
  prodi_id: number;

  @ValidateNested()
  @Type(() => CreateAlamatDto)
  @IsNotEmpty()
  alamat: CreateAlamatDto;
}

export class UpdateMahasiswaDto {
  @IsString()
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase().replace(/\b\w/g, char => char.toUpperCase()) : value)
  nama?: string;

  @IsString()
  @IsOptional()
  nim?: string;

  @IsString()
  @IsOptional()
  foto?: string;

  @IsNumber()
  @IsOptional()
  prodi_id?: number | null;

  @ValidateNested()
  @Type(() => UpdateAlamatDto)
  @IsOptional()
  alamat?: UpdateAlamatDto | null;
}

export enum SortMahasiswaBy {
  NAMA = 'nama',
  NIM = 'nim',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class FindMahasiswaQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  prodi_id?: number;

  @IsOptional()
  @IsEnum(SortMahasiswaBy)
  sortBy?: SortMahasiswaBy = SortMahasiswaBy.NAMA;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.ASC;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number = 10;
}