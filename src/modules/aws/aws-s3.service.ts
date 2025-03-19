import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import * as sharp from 'sharp';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

@Injectable()
export class AwsS3Service {
  private readonly s3Client: S3Client;
  private readonly logger = new Logger(AwsS3Service.name);
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      },
    });
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME');
  }

  async uploadFile(file: Express.Multer.File): Promise<{
    url: string;
    metadata: {
      originalFilename: string;
      fileSize: number;
      fileType: string;
      width: number;
      height: number;
    };
  }> {
    try {
      // Validate file type
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/webp'];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          `Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`,
        );
      }

      // Get image dimensions and validate
      const imageInfo = await sharp(file.buffer).metadata();
      const { width, height } = imageInfo;

      // Validate file size (e.g., between 10KB and 5MB)
      const minSize = 10 * 1024; // 10KB
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size < minSize || file.size > maxSize) {
        throw new BadRequestException(
          `File size must be between ${minSize / 1024}KB and ${maxSize / 1024 / 1024}MB`,
        );
      }

      // Validate dimensions (e.g., minimum 100x100, maximum 4000x4000)
      const minDimension = 100;
      const maxDimension = 4000;
      if (
        !width || !height ||
        width < minDimension || height < minDimension ||
        width > maxDimension || height > maxDimension
      ) {
        throw new BadRequestException(
          `Image dimensions must be between ${minDimension}x${minDimension} and ${maxDimension}x${maxDimension} pixels`,
        );
      }

      // Generate a unique filename
      const timestamp = Date.now();
      const key = `images/${timestamp}-${file.originalname.replace(/\s/g, '_')}`;

      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Body: file.buffer,
        Key: key,
        ContentType: file.mimetype,
      });

      await this.s3Client.send(command);
      
      // Construct the URL (format depends on your S3 configuration)
      const region = this.configService.get<string>('AWS_REGION');
      const url = `https://${this.bucketName}.s3.${region}.amazonaws.com/${key}`;
      
      this.logger.log(`File uploaded successfully to ${url}`);

      return {
        url,
        metadata: {
          originalFilename: file.originalname,
          fileSize: file.size,
          fileType: file.mimetype,
          width,
          height,
        },
      };
    } catch (error) {
      this.logger.error('Error uploading file to S3:', error);
      throw error;
    }
  }

  async deleteFile(imageUrl: string): Promise<void> {
    try {
      // Extract the key from the URL
      const key = imageUrl.split('/').slice(3).join('/');
      
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      
      await this.s3Client.send(command);
      
      this.logger.log(`File deleted successfully: ${key}`);
    } catch (error) {
      this.logger.error('Error deleting file from S3:', error);
      throw error;
    }
  }

  async generatePresignedUrl(imageUrl: string, expiresIn = 3600): Promise<string> {
    try {
      // Extract the key from the URL
      const urlParts = new URL(imageUrl);
      const key = urlParts.pathname.substring(1); // Remove leading slash
      
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      
      // Generate pre-signed URL that expires in 1 hour (or custom duration)
      const presignedUrl = await getSignedUrl(this.s3Client, command, { 
        expiresIn: expiresIn 
      });
      
      this.logger.log(`Generated pre-signed URL for ${key} (expires in ${expiresIn} seconds)`);
      return presignedUrl;
    } catch (error) {
      this.logger.error('Error generating pre-signed URL:', error);
      throw new InternalServerErrorException('Failed to generate pre-signed URL for image');
    }
  }
} 