import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { JwtPayloadDto } from '../auth/dto/jwt-payload.dto';
import { CreateRecipeDTO, UpdateRecipeDTO } from './create-recipes.dto';
import { RecipesService } from './recipes.service';
import { Recipe } from './recipes.entity';
// Import Request type from express if not globally available
import { Request } from 'express';


@ApiTags('recipes')
@ApiBearerAuth()

@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new recipe' })
  @ApiResponse({ status: 201, description: 'Recipe created successfully.', type: Recipe })
  @ApiResponse({ status: 400, description: 'Bad Request (validation failed)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Req() request: Request, // Explicitly type Request if needed
    @Body() createRecipeDTO: CreateRecipeDTO,
  ): Promise<Recipe> {
    const userJwtPayload = request['user'] as JwtPayloadDto; // Type assertion
    const recipe = new Recipe();
    recipe.name = createRecipeDTO.name;
    recipe.description = createRecipeDTO.description;
    recipe.ingredients = createRecipeDTO.ingredients;
    recipe.instructions = createRecipeDTO.instructions;
    recipe.prepTime = createRecipeDTO.prepTime;
    recipe.cookTime = createRecipeDTO.cookTime;
    recipe.servings = createRecipeDTO.servings;
    recipe.imageUrl = createRecipeDTO.imageUrl;
    // --- PERBAIKAN DI SINI ---
    recipe.userId = userJwtPayload.sub; // Set properti 'userId' (camelCase)

    // Service's save method handles the rest
    return await this.recipesService.save(recipe);
  }

  @Get()
  @ApiOperation({ summary: 'Get all recipes for the logged-in user (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Page number for pagination' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Number of items per page' })
  @ApiResponse({ status: 200, description: 'List of recipes retrieved successfully.', type: [Recipe] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Req() request: Request,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ): Promise<Recipe[]> {
    const userJwtPayload = request['user'] as JwtPayloadDto;
    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;
    // No change needed here, call to service is correct
    return await this.recipesService.findByUserId(userJwtPayload.sub, pageNumber, limitNumber);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific recipe by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID of the recipe to retrieve' })
  @ApiResponse({ status: 200, description: 'Recipe details retrieved successfully.', type: Recipe })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Recipe not found or not owned by user' })
  async findOne(
    @Req() request: Request,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Recipe> {
    const userJwtPayload = request['user'] as JwtPayloadDto;
    // No change needed here, call to service is correct
    const recipe = await this.recipesService.findByUserIdAndRecipeId(userJwtPayload.sub, id);
    if (!recipe) {
      throw new NotFoundException(`Recipe with ID ${id} not found or access denied.`);
    }
    return recipe;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing recipe' })
  @ApiParam({ name: 'id', type: Number, description: 'ID of the recipe to update' })
  @ApiResponse({ status: 200, description: 'Recipe updated successfully.', type: Recipe })
  @ApiResponse({ status: 400, description: 'Bad Request (validation failed)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Recipe not found or not owned by user' })
  async updateOne(
    @Req() request: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRecipeDTO: UpdateRecipeDTO,
  ): Promise<Recipe> {
    const userJwtPayload = request['user'] as JwtPayloadDto;
    // Fetching uses the corrected service method
    const existingRecipe = await this.recipesService.findByUserIdAndRecipeId(userJwtPayload.sub, id);
    if (!existingRecipe) {
      throw new NotFoundException(`Recipe with ID ${id} not found or access denied.`);
    }

    // Update properties - userId is not updated here, which is correct
    existingRecipe.name = updateRecipeDTO.name;
    existingRecipe.description = updateRecipeDTO.description;
    existingRecipe.ingredients = updateRecipeDTO.ingredients;
    existingRecipe.instructions = updateRecipeDTO.instructions;
    existingRecipe.prepTime = updateRecipeDTO.prepTime;
    existingRecipe.cookTime = updateRecipeDTO.cookTime;
    existingRecipe.servings = updateRecipeDTO.servings;
    existingRecipe.imageUrl = updateRecipeDTO.imageUrl;

    // Save uses the corrected service method implicitly
    return await this.recipesService.save(existingRecipe);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a recipe by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID of the recipe to delete' })
  @ApiResponse({ status: 204, description: 'Recipe deleted successfully (No Content)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Recipe not found or not owned by user' })
  async deleteOne(
    @Req() request: Request,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    const userJwtPayload = request['user'] as JwtPayloadDto;
    // Verification uses the corrected service method
    const recipe = await this.recipesService.findByUserIdAndRecipeId(userJwtPayload.sub, id);
    if (!recipe) {
      throw new NotFoundException(`Recipe with ID ${id} not found or access denied.`);
    }
    // Deletion uses the correct service method
    await this.recipesService.deleteById(id);
  }
}