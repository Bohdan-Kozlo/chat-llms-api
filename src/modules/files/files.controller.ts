import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Param,
  Delete,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return {
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: this.filesService.getImageUrl(file.filename),
    };
  }

  @Delete(':filename')
  deleteFile(@Param('filename') filename: string) {
    const deleted = this.filesService.deleteImage(filename);
    if (!deleted) {
      throw new NotFoundException('File not found');
    }
    return { success: true };
  }
}
