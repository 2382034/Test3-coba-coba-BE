import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Posting } from './posting.entity'; // Import the Posting entity

@Injectable()
export class PostingsService {
  constructor(
    @InjectRepository(Posting) // Inject the Posting repository
    private postingsRepository: Repository<Posting>,
  ) {}

  /**
   * Saves (creates or updates) a posting.
   * @param posting The posting entity to save.
   * @returns The saved posting entity.
   */
  async save(posting: Posting): Promise<Posting> {
    // TypeORM handles mapping entity properties (camelCase) to column names (snake_case)
    return this.postingsRepository.save(posting);
  }

  /**
   * Finds postings belonging to a specific user with pagination.
   * @param userIdParam The ID of the user.
   * @param page The page number (1-based).
   * @param limit The number of items per page.
   * @returns A promise resolving to an array of postings.
   */
  async findByUserId(
    userIdParam: number,
    page: number,
    limit: number,
  ): Promise<Posting[]> {
    const skip = (page > 0 ? page - 1 : 0) * limit;
    const take = limit > 0 ? limit : 10; // Default limit

    return await this.postingsRepository.find({
      // Use entity property names (camelCase) in 'where' and 'order'
      where: { userId: userIdParam },
      skip: skip,
      take: take,
      order: {
        createdAt: 'DESC', // Order by entity property name
      },
    });
  }

  /**
   * Finds a single posting by its ID, ensuring it belongs to the specified user.
   * @param userIdParam The ID of the user.
   * @param postingId The ID of the posting.
   * @returns The found posting entity, or null if not found or not owned by the user.
   */
  async findByUserIdAndPostingId(userIdParam: number, postingId: number): Promise<Posting | null> {
    const posting = await this.postingsRepository.findOne({
      // Use entity property names (camelCase) in 'where'
      where: {
        userId: userIdParam,
        id: postingId,
      },
    });
    return posting || null;
  }

  /**
   * Deletes a posting by its ID. Ownership should be checked *before* calling this.
   * @param postingId The ID of the posting to delete.
   * @returns A promise resolving when the deletion is complete.
   * @throws NotFoundException if the posting with the given ID doesn't exist.
   */
  async deleteById(postingId: number): Promise<void> {
    const result = await this.postingsRepository.delete({ id: postingId });
    if (result.affected === 0) {
        // Throw error if no rows were affected (posting didn't exist)
        throw new NotFoundException(`Posting with ID ${postingId} not found.`);
    }
  }
}