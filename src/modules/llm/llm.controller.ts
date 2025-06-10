import { Controller, Get, UseGuards } from '@nestjs/common';
import { LlmService } from './llm.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('llm')
@UseGuards(JwtAuthGuard)
export class LlmController {
  constructor(private llmService: LlmService) {}

  @Get('health')
  async checkHealth() {
    return {
      status: await this.llmService.checkHealth(),
    };
  }
}
