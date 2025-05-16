import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    // ManyToOne, // Uncomment if you implement the User relation
    // JoinColumn, // Uncomment if you implement the User relation
  } from 'typeorm';
  // import { User } from '../user/user.entity'; // Uncomment if you implement the User relation
  
  @Entity('postings') // Table name in the database
  export class Posting {
    @PrimaryGeneratedColumn()
    id: number;
  
    // Map the 'userId' property (camelCase) to the 'user_id' column (snake_case)
    @Column({ name: 'user_id' })
    userId: number;
  
    // --- Optional User Relation ---
    // @ManyToOne(() => User)
    // @JoinColumn({ name: 'user_id' }) // TypeORM defaults to propertyName + Id -> user_id
    // user: User;
    // -----------------------------
  
    @Column({ length: 255 }) // Added length consistent with DTO example
    title: string;
  
    @Column('text') // Suitable for longer content
    content: string;
  
    // Map the 'imageUrl' property to the 'image_url' column
    @Column({ type: 'varchar', length: 2048, nullable: true, name: 'image_url' })
    imageUrl?: string; // Property remains camelCase in your code
  
    // Map the 'createdAt' property (camelCase) to the 'created_at' column (snake_case)
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date; // Property remains camelCase for consistency
  
    // Map the 'updatedAt' property (camelCase) to the 'updated_at' column (snake_case)
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date; // Property remains camelCase for consistency
  }