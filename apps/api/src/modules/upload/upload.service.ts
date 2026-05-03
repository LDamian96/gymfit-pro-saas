import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

// Tipos de carpeta para organizar imágenes en Cloudinary
type ImageFolder = 'avatars' | 'exercises' | 'facilities' | 'landing' | 'proofs' | 'progress';

@Injectable()
export class UploadService {
  private readonly baseFolder: string;

  constructor(private configService: ConfigService) {
    // Configurar Cloudinary
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });
    this.baseFolder = this.configService.get('CLOUDINARY_FOLDER') || 'gym-app';
  }

  async uploadImage(
    file: Express.Multer.File,
    folder: ImageFolder,
  ): Promise<{ url: string; publicId: string }> {
    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('La imagen no puede superar 5MB');
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Solo se permiten imágenes JPG, PNG, WebP o GIF');
    }

    // Subir a Cloudinary en carpeta organizada: gym-app/<folder>/
    const result = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: `${this.baseFolder}/${folder}`,
              resource_type: 'image',
              transformation: [
                { quality: 'auto', fetch_format: 'auto' },
                { width: 1200, crop: 'limit' },
              ],
            },
            (error, result) => {
              if (error || !result) {
                reject(error || new Error('Error al subir imagen'));
              } else {
                resolve(result);
              }
            },
          )
          .end(file.buffer);
      },
    );

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  }

  async uploadVideo(
    file: Express.Multer.File,
    folder: ImageFolder,
  ): Promise<{ url: string; publicId: string }> {
    // Validar tamaño (50MB máximo para videos)
    if (file.size > 50 * 1024 * 1024) {
      throw new BadRequestException('El video no puede superar 50MB');
    }

    // Validar tipo
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/mov'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Solo se permiten videos MP4, WebM o MOV');
    }

    const result = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: `${this.baseFolder}/${folder}`,
              resource_type: 'video',
              transformation: [
                { quality: 'auto' },
                { width: 720, crop: 'limit' },
              ],
            },
            (error, result) => {
              if (error || !result) {
                reject(error || new Error('Error al subir video'));
              } else {
                resolve(result);
              }
            },
          )
          .end(file.buffer);
      },
    );

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  }

  async deleteImage(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }

  async deleteVideo(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
  }
}
