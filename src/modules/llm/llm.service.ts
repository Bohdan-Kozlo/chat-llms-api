import { AIMessage, BaseMessage, HumanMessage } from '@langchain/core/messages';
import { ChatOllama } from '@langchain/ollama';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Message } from '@prisma/client';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { promises as fsPromises } from 'fs';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LlmService {
  private readonly model: ChatOllama;
  private readonly imageDir: string;

  constructor(private configService: ConfigService) {
    const model = this.configService.getOrThrow<string>('LLM_MODEL_DEFAULT');
    const temperature = Number(this.configService.getOrThrow<string>('LLM_MODEL_TEMPERATURE'));
    this.model = new ChatOllama({ model, temperature });
    this.imageDir = join(process.cwd(), this.configService.getOrThrow<string>('UPLOADS_IMAGES_PATH'));
  }

  async sendMessageToModel(currentMessage: string, historyMessages: Message[], imageFilename?: string) {
    const chatHistory: BaseMessage[] = historyMessages.map((message) =>
      message.role === 'USER' ? new HumanMessage(message.content) : new AIMessage(message.content),
    );

    if (imageFilename) {
      return this.handleImageMessage(currentMessage, chatHistory, imageFilename);
    }

    const prompt = this.createPrompt();
    const chain = prompt.pipe(this.model).pipe(new StringOutputParser());
    const response = await chain.invoke({
      input: currentMessage,
      history: chatHistory,
    });
    return response;
  }

  private async handleImageMessage(currentMessage: string, chatHistory: BaseMessage[], imageFilename: string) {
    const imagePath = join(this.imageDir, imageFilename);
    try {
      await fsPromises.access(imagePath);
      const systemPrompt = this.getSystemPrompt();
      const humanMultiModalMessage = await this.createHumanMessageWithImage(currentMessage, imagePath);
      const messages = [new AIMessage(systemPrompt), ...chatHistory, humanMultiModalMessage];
      const response = await this.model.invoke(messages);
      return response.content;
    } catch (error) {
      console.error('[ERROR PROCESSING IMAGE]', error);
      throw new InternalServerErrorException('Error processing image');
    }
  }

  private async createHumanMessageWithImage(text: string, imagePath: string): Promise<HumanMessage> {
    const imageData = await fsPromises.readFile(imagePath);
    const base64Image = imageData.toString('base64');
    return new HumanMessage({
      content: [
        { type: 'text', text },
        { type: 'image_url', image_url: `data:image/jpeg;base64,${base64Image}` },
      ],
    });
  }

  private getSystemPrompt(): string {
    return `
    You are an intelligent and concise assistant. Never mention that you are an AI model. 
    Respond naturally and helpfully, like a real human assistant. 
    Always consider the full conversation history when forming your answers. 
    Do not repeat information from the user's message unless necessary. 
    Avoid giving instructions about how to use the assistant or model. 
    Just provide useful, direct answers based on the current and previous messages.
    If you don't know what to answer, just say "I don't know".
    `;
  }

  private createPrompt() {
    return ChatPromptTemplate.fromMessages([
      ['system', this.getSystemPrompt()],
      new MessagesPlaceholder('history'),
      ['human', '{input}'],
    ]);
  }

  async checkHealth(): Promise<boolean> {
    try {
      const prompt = ChatPromptTemplate.fromMessages([
        ['system', 'You should get answer pong'],
        ['human', 'ping'],
      ]);
      const chain = RunnableSequence.from([prompt, this.model, new StringOutputParser()]);
      const result = await chain.invoke({});
      return typeof result === 'string' && result.length > 0;
    } catch (error) {
      console.error('[LLM HEALTH CHECK FAILED]', error);
      throw new InternalServerErrorException('LLM service is unavailable');
    }
  }
}
