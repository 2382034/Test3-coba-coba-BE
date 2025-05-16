// DataMahasiswa/data.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// MulterModule is still needed if you use memoryStorage in controller, but dest is not strictly necessary for memoryStorage
// import { MulterModule } from '@nestjs/platform-express'; 
// ServeStaticModule and MAHASISWA_FOTO_PATH likely not needed if photos are on Vercel Blob
// import { ServeStaticModule } from '@nestjs/serve-static';
// import { join } from 'path';
// import { MAHASISWA_FOTO_PATH } from './constants';

import { DataService } from './data.service';
import { DataController } from './data.controller';
import { Prodi, Mahasiswa, Alamat } from './data.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Prodi, Mahasiswa, Alamat]),
    // MulterModule.register({ // This default 'dest' is not used by FileInterceptor with memoryStorage
    //   // dest: `./${MAHASISWA_FOTO_PATH}`,
    // }),
    // Remove ServeStaticModule if photos are served directly from Vercel Blob URL stored in DB
    // ServeStaticModule.forRoot({
    //   rootPath: join(__dirname, '..', '..', MAHASISWA_FOTO_PATH),
    //   serveRoot: `/${MAHASISWA_FOTO_PATH}`,
    // }),
  ],
  controllers: [DataController],
  providers: [DataService],
  exports: [DataService]
})
export class DataMahasiswaModule {}