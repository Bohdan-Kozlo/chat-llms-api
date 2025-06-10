import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

@Injectable()
export class FilesService {
  constructor(private configService: ConfigService) {}

  getImageUrl(filename: string): string {
    const baseUrl =
      this.configService.get<string>('APP_URL') || `http://localhost:${this.configService.get('PORT') || 3000}`;
    return `${baseUrl}/uploads/images/${filename}`;
  }

  getImagePath(filename: string): string {
    return join(process.cwd(), 'uploads/images', filename);
  }

  deleteImage(filename: string): boolean {
    const filePath = this.getImagePath(filename);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
      return true;
    }
    return false;
  }
}
