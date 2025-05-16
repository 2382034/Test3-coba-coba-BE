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

@Entity('recipes')
export class Recipe {
  @PrimaryGeneratedColumn()
  id: number;

  // Map the 'userId' property (camelCase) to the 'user_id' column (snake_case)
  @Column({ name: 'user_id' })
  userId: number;

  // --- Optional User Relation ---
  // If you uncomment this, @JoinColumn already correctly specifies 'user_id'
  // @ManyToOne(() => User)
  // @JoinColumn({ name: 'user_id' })
  // user: User;
  // -----------------------------

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column('text')
  ingredients: string;

  @Column('text')
  instructions: string;

  // Map the 'prepTime' property to the 'prep_time' column
  @Column({ type: 'int', name: 'prep_time' })
  prepTime: number; // Property remains camelCase in your code

  // Map the 'cookTime' property to the 'cook_time' column
  @Column({ type: 'int', name: 'cook_time' })
  cookTime: number; // Property remains camelCase in your code

  @Column({ type: 'int', nullable: true }) // Assuming column name is 'servings'
  servings?: number;

  // Map the 'imageUrl' property to the 'image_url' column
  @Column({ type: 'varchar', length: 2048, nullable: true, name: 'image_url' })
  imageUrl?: string; // Property remains camelCase in your code

  // Map the 'createdAt' property (camelCase) to the 'created_at' column (snake_case)
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date; // Changed property name to camelCase for consistency

  // Map the 'updatedAt' property (camelCase) to the 'updated_at' column (snake_case)
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date; // Changed property name to camelCase for consistency
}