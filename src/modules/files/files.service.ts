import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fsPromises } from 'fs';
import { join } from 'path';

@Injectable()
export class FilesService {
  constructor(private configService: ConfigService) {}

  getImageUrl(filename: string): string {
    const baseUrl = this.configService.getOrThrow<string>('APP_URL');
    const imagesPath = this.configService.getOrThrow<string>('UPLOADS_IMAGES_PATH');
    return `${baseUrl}/${imagesPath}/${filename}`;
  }

  getImagePath(filename: string): string {
    const imagesPath = this.configService.getOrThrow<string>('UPLOADS_IMAGES_PATH');
    return join(process.cwd(), imagesPath, filename);
  }

  async deleteImage(filename: string): Promise<boolean> {
    const filePath = this.getImagePath(filename);
    try {
      await fsPromises.access(filePath);
      await fsPromises.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
