// DataMahasiswa/data.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express'; // Import MulterModule
import { ServeStaticModule } from '@nestjs/serve-static'; // Import ServeStaticModule
import { join } from 'path'; // For path joining

import { DataService } from './data.service';
import { DataController } from './data.controller';
import { Prodi, Mahasiswa, Alamat } from './data.entity';
import { MAHASISWA_FOTO_PATH } from './constants';

@Module({
  imports: [
    TypeOrmModule.forFeature([Prodi, Mahasiswa, Alamat]),
    MulterModule.register({
      dest: `./${MAHASISWA_FOTO_PATH}`, // Default destination, can be overridden in FileInterceptor
    }),
    // Serve static files from the uploads directory
    // This allows accessing photos via a URL like /data/mahasiswa/foto/filename.jpg (if controller path is /data/mahasiswa/foto)
    // Or more generally, if you want /uploads/mahasiswa-fotos/filename.jpg to work directly:
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', MAHASISWA_FOTO_PATH), // Adjust path based on your project structure
                                                                // Assuming this module is in src/DataMahasiswa
                                                                // and uploads is at project root
      serveRoot: `/${MAHASISWA_FOTO_PATH}`, // Access files via /uploads/mahasiswa-fotos/filename.jpg
    }),
  ],
  controllers: [DataController],
  providers: [DataService],
  exports: [DataService]
})
export class DataMahasiswaModule {}