import { Module } from '@nestjs/common';
import { ImageService } from './image.service';
import { ImageController } from './image.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AwsModule } from '../aws/aws.module';

@Module({
  imports: [PrismaModule, AwsModule],
  controllers: [ImageController],
  providers: [ImageService],
  exports: [ImageService]
})
export class ImageModule {} 