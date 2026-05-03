import {
  Controller,
  Post,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/v1/upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder: string,
  ) {
    const validFolders = ['avatars', 'exercises', 'facilities', 'landing', 'proofs', 'progress'];
    const safeFolder = validFolders.includes(folder) ? folder : 'landing';

    return this.uploadService.uploadImage(
      file,
      safeFolder as 'avatars' | 'exercises' | 'facilities' | 'landing' | 'proofs' | 'progress',
    );
  }

  @Post('video')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    }),
  )
  async uploadVideo(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder: string,
  ) {
    const validFolders = ['exercises', 'landing', 'progress'];
    const safeFolder = validFolders.includes(folder) ? folder : 'exercises';
    return this.uploadService.uploadVideo(
      file,
      safeFolder as 'exercises' | 'landing' | 'progress',
    );
  }

  @Delete('image/:publicId')
  async deleteImage(@Param('publicId') publicId: string) {
    const decoded = decodeURIComponent(publicId);
    await this.uploadService.deleteImage(decoded);
    return null;
  }
}
