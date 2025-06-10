import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ConfigService } from '@nestjs/config';
import { LlmService } from '../llm/llm.service';
import { MessageRole } from '@prisma/client';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private llmService: LlmService,
  ) {}

  async createChat(dto: CreateChatDto, userId?: string) {
    return this.prisma.chat.create({
      data: {
        ...dto,
        llModel: this.configService.getOrThrow('LLM_MODEL_DEFAULT'),
        userId: userId,
      },
    });
  }

  async getChatsToUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.chat.findMany({
      where: { userId },
    });
  }

  async getAllMessagesByChatId(chatId: string, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId, user: user },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    return this.prisma.message.findMany({
      where: { chat },
      orderBy: { createdAt: 'asc' },
    });
  }

  async sendMessage(chatId: string, dto: SendMessageDto, userId?: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
    });
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    if (userId && chat.userId && chat.userId !== userId) {
      throw new UnauthorizedException('You do not have access to this chat');
    }

    const messages = await this.prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
      take: dto.amountMessagesHistory,
    });

    const reply = await this.llmService.sendMessageToModel(dto.content, messages, dto.imageFilename);

    await this.prisma.message.create({
      data: {
        chatId,
        content: dto.content,
        role: MessageRole.USER,
        imageUrl: dto.imageFilename ? `/uploads/images/${dto.imageFilename}` : null,
      },
    });

    await this.prisma.message.create({
      data: {
        chatId,
        content: reply as string,
        role: MessageRole.ASSISTANT,
      },
    });

    return { message: reply };
  }
}
