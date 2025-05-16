import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUrl,
  MaxLength, // Optional: Add length constraints if needed
} from 'class-validator';

export class CreatePostingDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255) // Example max length
  @ApiProperty({ example: 'My First Blog Post', description: 'Title of the posting' })
  title: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'This is the content of my first blog post...', description: 'Main content of the posting' })
  content: string; // Using 'text' type in entity, so no explicit length limit here usually

  @IsOptional()
  @IsUrl({}, { message: 'Image URL must be a valid URL (http or https)' })
  @MaxLength(2048) // Match entity length constraint
  @ApiProperty({ example: 'https://example.com/post-image.jpg', description: 'URL for the posting image (optional)', required: false })
  imageUrl?: string;
}

// Reusing the DTO for updates, meaning all fields are expected on PUT.
// A PATCH operation would typically use a separate DTO with all fields optional.
export class UpdatePostingDTO extends CreatePostingDTO {}