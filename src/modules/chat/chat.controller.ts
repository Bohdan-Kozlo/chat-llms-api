import { Body, Controller, Get, Param, Post, UploadedFile, UseInterceptors, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from '../files/files.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private chatService: ChatService,
    private filesService: FilesService,
  ) {}

  @Post()
  async createChat(@Body() dto: CreateChatDto, @CurrentUser('id') userId: string) {
    return this.chatService.createChat(dto, userId);
  }

  @Get()
  async getAllChats(@CurrentUser('id') userId: string) {
    return this.chatService.getChatsToUserById(userId);
  }

  @Get(':chatId')
  async getChatById(@Param('chatId') chatId: string, @CurrentUser('id') userId: string) {
    return this.chatService.getAllMessagesByChatId(chatId, userId);
  }

  @Post(':chatId/message')
  async sendMessage(@Param('chatId') chatId: string, @Body() dto: SendMessageDto, @CurrentUser('id') userId: string) {
    return this.chatService.sendMessage(chatId, dto, userId);
  }

  @Post(':chatId/upload-image')
  @UseInterceptors(FileInterceptor('image'))
  uploadImage(@Param('chatId') chatId: string, @UploadedFile() file: Express.Multer.File) {
    return {
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: this.filesService.getImageUrl(file.filename),
    };
  }
}
