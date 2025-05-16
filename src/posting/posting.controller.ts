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
    UseGuards, // Consider adding UseGuards if auth is strictly required globally
  } from '@nestjs/common';
  import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiQuery,
    ApiBearerAuth,
  } from '@nestjs/swagger';
  
  import { JwtPayloadDto } from '../auth/dto/jwt-payload.dto'; // Assuming path is correct
  import { CreatePostingDTO, UpdatePostingDTO } from './create-posting.dto'; // Correct DTO path
  import { PostingsService } from './posting.service'; // Correct service path
  import { Posting } from './posting.entity'; // Correct entity path
  import { Request } from 'express';
  // import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Uncomment if needed
  
  @ApiTags('postings')
  @ApiBearerAuth() // Indicates JWT Bearer token is expected for documented endpoints
  // @UseGuards(JwtAuthGuard) // Apply guard to all routes in this controller if needed
  @Controller('postings') // Base path for routes in this controller
  export class PostingsController {
    constructor(private readonly postingsService: PostingsService) {}
  
    @Post()
    // @UseGuards(JwtAuthGuard) // Or apply guard per-route
    @ApiOperation({ summary: 'Create a new posting' })
    @ApiResponse({ status: 201, description: 'Posting created successfully.', type: Posting })
    @ApiResponse({ status: 400, description: 'Bad Request (validation failed)' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async create(
      @Req() request: Request,
      @Body() createPostingDTO: CreatePostingDTO,
    ): Promise<Posting> {
      const userJwtPayload = request['user'] as JwtPayloadDto; // Assumes guard populates req.user
      const posting = new Posting();
      posting.title = createPostingDTO.title;
      posting.content = createPostingDTO.content;
      posting.imageUrl = createPostingDTO.imageUrl;
      posting.userId = userJwtPayload.sub; // Link posting to the logged-in user
  
      return await this.postingsService.save(posting);
    }
  
    @Get()
    // @UseGuards(JwtAuthGuard) // Or apply guard per-route
    @ApiOperation({ summary: 'Get all postings for the logged-in user (paginated)' })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Page number for pagination' })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Number of items per page' })
    @ApiResponse({ status: 200, description: 'List of postings retrieved successfully.', type: [Posting] })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async findAll(
      @Req() request: Request,
      @Query('page') page: string = '1',
      @Query('limit') limit: string = '10',
    ): Promise<Posting[]> {
      const userJwtPayload = request['user'] as JwtPayloadDto;
      const pageNumber = parseInt(page, 10) || 1;
      const limitNumber = parseInt(limit, 10) || 10;
  
      return await this.postingsService.findByUserId(userJwtPayload.sub, pageNumber, limitNumber);
    }
  
    @Get(':id')
    // @UseGuards(JwtAuthGuard) // Or apply guard per-route
    @ApiOperation({ summary: 'Get a specific posting by ID' })
    @ApiParam({ name: 'id', type: Number, description: 'ID of the posting to retrieve' })
    @ApiResponse({ status: 200, description: 'Posting details retrieved successfully.', type: Posting })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Posting not found or not owned by user' })
    async findOne(
      @Req() request: Request,
      @Param('id', ParseIntPipe) id: number,
    ): Promise<Posting> {
      const userJwtPayload = request['user'] as JwtPayloadDto;
      const posting = await this.postingsService.findByUserIdAndPostingId(userJwtPayload.sub, id);
      if (!posting) {
        // Throw standard NestJS exception
        throw new NotFoundException(`Posting with ID ${id} not found or access denied.`);
      }
      return posting;
    }
  
    @Put(':id')
    // @UseGuards(JwtAuthGuard) // Or apply guard per-route
    @ApiOperation({ summary: 'Update an existing posting' })
    @ApiParam({ name: 'id', type: Number, description: 'ID of the posting to update' })
    @ApiResponse({ status: 200, description: 'Posting updated successfully.', type: Posting })
    @ApiResponse({ status: 400, description: 'Bad Request (validation failed)' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Posting not found or not owned by user' })
    async updateOne(
      @Req() request: Request,
      @Param('id', ParseIntPipe) id: number,
      @Body() updatePostingDTO: UpdatePostingDTO,
    ): Promise<Posting> {
      const userJwtPayload = request['user'] as JwtPayloadDto;
      // First, verify the posting exists and belongs to the user
      const existingPosting = await this.postingsService.findByUserIdAndPostingId(userJwtPayload.sub, id);
      if (!existingPosting) {
        throw new NotFoundException(`Posting with ID ${id} not found or access denied.`);
      }
  
      // Update properties from DTO
      existingPosting.title = updatePostingDTO.title;
      existingPosting.content = updatePostingDTO.content;
      existingPosting.imageUrl = updatePostingDTO.imageUrl;
      // userId is not updated
  
      // Save the updated entity
      return await this.postingsService.save(existingPosting);
    }
  
    @Delete(':id')
    @ApiOperation({ summary: 'Delete a posting by ID' })
    @ApiParam({ name: 'id', type: Number, description: 'ID of the posting to delete' })
    @ApiResponse({ status: 204, description: 'Posting deleted successfully (No Content)' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Posting not found or not owned by user' })
    async deleteOne(
      @Req() request: Request,
      @Param('id', ParseIntPipe) id: number,
    ): Promise<void> { // Return type is void for 204 response
      const userJwtPayload = request['user'] as JwtPayloadDto;
      // Verify ownership before deleting
      const posting = await this.postingsService.findByUserIdAndPostingId(userJwtPayload.sub, id);
      if (!posting) {
        throw new NotFoundException(`Posting with ID ${id} not found or access denied.`);
      }
      // Perform the deletion
      await this.postingsService.deleteById(id);
      // No need to return anything for a 204 response
    }
  }