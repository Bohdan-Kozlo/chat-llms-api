import { IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @MinLength(5)
  content: string;

  @IsNumber()
  amountMessagesHistory: number;

  @IsOptional()
  @IsString()
  imageFilename?: string;
}
