import { AIMessage, BaseMessage, HumanMessage } from '@langchain/core/messages';
import { ChatOllama } from '@langchain/ollama';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Message } from '@prisma/client';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class LlmService {
  private readonly model = new ChatOllama({ model: 'gemma3', temperature: 1 });

  async sendMessageToModel(currentMessage: string, historyMessages: Message[], imageFilename?: string) {
    const chatHistoty: BaseMessage[] = historyMessages.map((message) => {
      return message.role === 'USER' ? new HumanMessage(message.content) : new AIMessage(message.content);
    });

    if (imageFilename) {
      const imagePath = join(process.cwd(), 'uploads/images', imageFilename);
      if (existsSync(imagePath)) {
        try {
          const imageData = await readFile(imagePath);
          const base64Image = imageData.toString('base64');

          const humanMultiModalMessage = new HumanMessage({
            content: [
              {
                type: 'text',
                text: currentMessage,
              },
              {
                type: 'image_url',
                image_url: `data:image/jpeg;base64,${base64Image}`,
              },
            ],
          });

          const response = await this.model.invoke([...chatHistoty, humanMultiModalMessage]);
          return response.content;
        } catch (error) {
          console.error('[ERROR PROCESSING IMAGE]', error);
          throw new InternalServerErrorException('Error processing image');
        }
      }
    }

    const systemPrompt = `
    You are an intelligent and concise assistant. Never mention that you are an AI model. 
    Respond naturally and helpfully, like a real human assistant. 
    Always consider the full conversation history when forming your answers. 
    Do not repeat information from the user's message unless necessary. 
    Avoid giving instructions about how to use the assistant or model. 
    Just provide useful, direct answers based on the current and previous messages.
    If you don't know what to answer, just say "I don't know".
    `;
    const promt = ChatPromptTemplate.fromMessages([
      ['system', systemPrompt],
      new MessagesPlaceholder('history'),
      ['human', '{input}'],
    ]);

    const chain = promt.pipe(this.model).pipe(new StringOutputParser());

    const response = await chain.invoke({
      input: currentMessage,
      history: chatHistoty,
    });

    return response;
  }

  async checkHealth(): Promise<boolean> {
    try {
      const prompt = ChatPromptTemplate.fromMessages([
        ['system', 'You shoud get answear pong'],
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
