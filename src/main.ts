import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
/* import { LlmService } from './modules/llm/llm.service'; */
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  /*  try {
    const llmService = app.get(LlmService);
    const isLlmHealthy = await llmService.checkHealth();

    if (!isLlmHealthy) {
      logger.error('LLM service health check failed. Application will not start.');
      await app.close();
      process.exit(1);
    }

    logger.log('LLM service health check passed successfully.');
  } catch (error) {
    logger.error(`Failed to connect to LLM service: ${error}`);
    await app.close();
    process.exit(1);
  } */

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  app.use(cookieParser());

  app.useGlobalPipes(new ValidationPipe());

  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(process.env.PORT ?? 3000);
  logger.log(`Application is running on port ${process.env.PORT ?? 3000}`);
}
bootstrap();
