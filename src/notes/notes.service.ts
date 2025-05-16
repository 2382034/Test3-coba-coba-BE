import { Injectable} from '@nestjs/common';
import { Notes } from './notes.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Notes) private notesRepository: Repository<Notes>,
  ) {}

  async save(user: Notes): Promise<Notes> {
    return this.notesRepository.save(user);
  }

  async findByUserId(
    userId: number,
    page: number,
    limit: number,
  ): Promise<Notes[]> {
    return await this.notesRepository.find({
      where: { user_id: userId },
      skip: (page - 1) * limit,
      take: limit,
      order: {
        created_at: 'DESC',
      },
    });
  }

  async findByUserIdAndNoteId(userId: number, noteId: number): Promise<Notes> {
    const note = await this.notesRepository.findOne({
      where: {
        user_id: userId,
        id: noteId,
      },
    });
    if (!note) {
      return new Notes();
    }
    return note;
  }

  async deleteById(noteId: number) {
    await this.notesRepository.delete({ id: noteId });
  }
}