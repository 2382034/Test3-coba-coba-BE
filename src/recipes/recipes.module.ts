import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Recipe } from './recipes.entity'; // Import Recipe entity
import { RecipesController } from './recipes.controller'; // Import Recipes controller
import { RecipesService } from './recipes.service'; // Import Recipes service
// Import AuthModule if Guards depend on it, or ensure necessary providers are global/exported
// import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Recipe]), // Register the Recipe entity/repository
    // AuthModule, // Import AuthModule if JwtAuthGuard or related services are defined there and not global
  ],
  controllers: [RecipesController], // Declare the controller for this module
  providers: [RecipesService], // Declare the service for this module
  // exports: [RecipesService] // Export service only if needed by other modules
})
export class RecipesModule {}