import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Posting } from './posting.entity';         // Corrected import
import { PostingsController } from './posting.controller'; // Corrected import
import { PostingsService } from './posting.service';    // Corrected import
// import { AuthModule } from '../auth/auth.module'; // Uncomment if needed

@Module({
  imports: [
    TypeOrmModule.forFeature([Posting]), // Register the Posting entity/repository
    // AuthModule, // Import if guards/services from AuthModule are needed and not global
  ],
  controllers: [PostingsController],   // Declare the controller
  providers: [PostingsService],     // Declare the service
  // exports: [PostingsService] // Only if needed by other modules
})
export class PostingsModule {} // Use plural for module name consistency