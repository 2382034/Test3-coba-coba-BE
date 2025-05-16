// DataMahasiswa/data.entity.ts
import {
    Entity, PrimaryGeneratedColumn, Column, ManyToOne,
    OneToOne, JoinColumn, OneToMany, Index,
  } from 'typeorm';
  
  // --- Prodi Entity (tidak berubah) ---
  @Entity('prodi')
  export class Prodi {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Index({ unique: true })
    @Column()
    nama_prodi: string;
  
    @Column()
    fakultas: string;
  
    @OneToMany(() => Mahasiswa, (mahasiswa) => mahasiswa.prodi)
    mahasiswa: Mahasiswa[];
  }
  
  // --- Mahasiswa Entity (PERHATIKAN NULLABLE) ---
  @Entity('mahasiswa')
  export class Mahasiswa {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column()
    nama: string;
  
    @Index({ unique: true })
    @Column()
    nim: string;
  
    @Column({ type: 'varchar', length: 1024, nullable: true }) // foto bisa null
    foto: string | null;
  
    // Relasi ke Prodi
    @ManyToOne(() => Prodi, (prodi) => prodi.mahasiswa, {
      onDelete: 'SET NULL', // Jika prodi dihapus, prodi_id di mahasiswa jadi NULL
      nullable: true,       // PENTING: Relasi ini bisa tidak ada (prodi_id bisa NULL)
      eager: true,          // Opsional, jika ingin prodi selalu ikut ter-load
    })
    @JoinColumn({ name: 'prodi_id' }) // Nama kolom FK di tabel 'mahasiswa'
    prodi: Prodi | null; // PENTING: Tipe harus Prodi | null
  
    @Column({ type: 'int', name: 'prodi_id', nullable: true })
    prodi_id: number | null;
  
    // Relasi ke Alamat (Mahasiswa 'memiliki' Alamat, tapi FK ada di tabel Alamat)
    @OneToOne(() => Alamat, (alamat) => alamat.mahasiswa, {
      cascade: true,        // Jika Mahasiswa di-save, Alamat terkait ikut di-save/update. Jika Mahasiswa di-remove, Alamat terkait ikut di-remove.
      onDelete: 'CASCADE',  // Jika Mahasiswa dihapus, record Alamat terkait juga dihapus.
      nullable: true,       // PENTING: Mahasiswa bisa ada tanpa Alamat
      eager: true,          // Opsional, jika ingin alamat selalu ikut ter-load
    })
    alamat: Alamat | null; // PENTING: Tipe harus Alamat | null
    // mahasiswaToUpdate: Alamat[]; // This line seems like a leftover and was removed as it's not used.
  }
  
  // --- Alamat Entity (PERHATIKAN FK KE MAHASISWA) ---
  @Entity('alamat')
  export class Alamat {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column()
    jalan: string;
  
    @Column()
    kota: string;
  
    @Column()
    provinsi: string;
  
    @Column()
    kode_pos: string;
  
    @OneToOne(() => Mahasiswa, (mahasiswa) => mahasiswa.alamat, {
      // onDelete: 'CASCADE' tidak perlu di sini jika sudah ada di Mahasiswa.alamat
      // dan mahasiswa_id adalah NOT NULL. Jika mahasiswa dihapus, alamat akan ikut
      // terhapus karena FK constraint atau karena cascade dari Mahasiswa.
    })
    @JoinColumn({ name: 'mahasiswa_id' }) // FK ada di tabel 'alamat' dan menunjuk ke 'mahasiswa.id'
    mahasiswa: Mahasiswa; // Alamat harus memiliki mahasiswa jika mahasiswa_id NOT NULL
  
    @Column({ type: 'int', name: 'mahasiswa_id', unique: true /*, nullable: false */ })
    mahasiswa_id: number;
  }