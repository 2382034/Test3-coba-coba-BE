import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { JwtPayloadDto } from 'src/auth/dto/jwt-payload.dto';
import { CreateNoteDTO } from './create-note.dto';
import { NotesService } from './notes.service';
import { Notes } from './notes.entity';
import { ApiParam, ApiQuery, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('notes')
@Controller('note')
export class NoteController {
  constructor(private readonly noteService: NotesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new note' })
  @ApiResponse({ status: 201, description: 'Note created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Req() request: Request, @Body() createNoteDTO: CreateNoteDTO) {
    const notes: Notes = new Notes();
    const userJwtPayload: JwtPayloadDto = request['user'];
    notes.content = createNoteDTO.content;
    notes.title = createNoteDTO.title;
    notes.user_id = userJwtPayload.sub;
    await this.noteService.save(notes);
  }

  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  async findAll(
    @Req() request: Request,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<Notes[]> {
    const userJwtPayload: JwtPayloadDto = request['user'];
    return await this.noteService.findByUserId(userJwtPayload.sub, page, limit);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: Number, description: 'ID of the note' })
  async findOne(
    @Req() request: Request,
    @Param('id') id: number,
  ): Promise<Notes> {
    const userJwtPayload: JwtPayloadDto = request['user'];
    return await this.noteService.findByUserIdAndNoteId(userJwtPayload.sub, id);
  }

  @Put(':id')
  @ApiParam({ name: 'id', type: Number, description: 'ID of the note' })
  async updateOne(
    @Req() request: Request,
    @Param('id') id: number,
    @Body() createNoteDTO: CreateNoteDTO,
  ) {
    const userJwtPayload: JwtPayloadDto = request['user'];
    const note: Notes = await this.noteService.findByUserIdAndNoteId(
      userJwtPayload.sub,
      id,
    );
    if (note.id == null) {
      throw new NotFoundException();
    }
    note.content = createNoteDTO.content;
    note.title = createNoteDTO.title;
    await this.noteService.save(note);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', type: Number, description: 'ID of the note' })
  async deleteOne(@Req() request: Request, @Param('id') id: number) {
    const userJwtPayload: JwtPayloadDto = request['user'];
    const note: Notes = await this.noteService.findByUserIdAndNoteId(
      userJwtPayload.sub,
      id,
    );
    if (note.id == null) {
      throw new NotFoundException();
    }
    await this.noteService.deleteById(id);
  }
}