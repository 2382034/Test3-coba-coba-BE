import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsInt,
  Min,
  IsOptional,
  IsUrl,
  IsNumber,
  IsPositive,
} from 'class-validator';

export class CreateRecipeDTO {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Spicy Chicken Curry', description: 'Name of the recipe' })
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'A delicious and spicy chicken curry.', description: 'Brief description of the recipe' })
  description: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: '1 lb Chicken\n1 Onion\n2 cloves Garlic...', description: 'List of ingredients, typically newline-separated' })
  ingredients: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: '1. Chop onions.\n2. Sauté garlic.\n3. Add chicken...', description: 'Step-by-step instructions, typically newline-separated' })
  instructions: string;

  @IsInt() // Ensures it's a whole number
  @Min(0) // Cannot be negative
  @ApiProperty({ example: 15, description: 'Preparation time in minutes' })
  prepTime: number;

  @IsInt() // Ensures it's a whole number
  @Min(0) // Cannot be negative
  @ApiProperty({ example: 30, description: 'Cooking time in minutes' })
  cookTime: number;

  @IsOptional()
  @IsInt() // Ensures it's a whole number
  @IsPositive() // Must be 1 or greater if provided
  @ApiProperty({ example: 4, description: 'Number of servings (optional)', required: false })
  servings?: number;

  @IsOptional()
  @IsUrl({}, { message: 'Image URL must be a valid URL (http or https)' }) // Validates URL format
  @ApiProperty({ example: 'https://example.com/curry.jpg', description: 'URL for the recipe image (optional)', required: false })
  imageUrl?: string;
}

// Note: We'll use a separate DTO for updates if needed, or reuse this one.
// For simplicity, we reuse it, meaning all fields are sent on update.
// A Patch operation might use a different DTO with all fields optional.
export class UpdateRecipeDTO extends CreateRecipeDTO {}