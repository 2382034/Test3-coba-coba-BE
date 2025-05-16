import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Notes } from "./notes.entity";
import { NoteController } from "./notes.controller";
import { NotesService } from "./notes.service";

@Module({
    imports: [TypeOrmModule.forFeature([Notes])],
    controllers: [NoteController],
    providers: [NotesService]
})
export class NotesModule {}