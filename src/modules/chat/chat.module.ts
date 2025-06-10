import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { LlmModule } from '../llm/llm.module';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [LlmModule, FilesModule],
  providers: [ChatService],
  controllers: [ChatController],
})
export class ChatModule {}
