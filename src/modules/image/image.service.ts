import { Injectable, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateImageDto } from './dto/image.dto';

@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateImageDto) {
    try {
      return await this.prisma.image.create({
        data: createDto
      });
    } catch (error) {
      this.logger.error('Failed to create image:', error);
      throw new InternalServerErrorException('Failed to create image');
    }
  }

  async findOne(id: number) {
    try {
      const image = await this.prisma.image.findUnique({
        where: { id },
        include: {
          question_texts: {
            select: {
              id: true,
              question_text: true
            }
          },
          mcq_options: {
            select: {
              id: true,
              option_text: true
            }
          },
          match_pairs_left: {
            select: {
              id: true,
              left_text: true,
              right_text: true
            }
          },
          match_pairs_right: {
            select: {
              id: true,
              left_text: true,
              right_text: true
            }
          }
        }
      });

      if (!image) {
        throw new NotFoundException(`Image with ID ${id} not found`);
      }

      return image;
    } catch (error) {
      this.logger.error(`Failed to fetch image ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch image');
    }
  }

  async remove(id: number): Promise<void> {
    try {
      const image = await this.findOne(id);

      // Log what will be deleted and where the image is used
      this.logger.log(`Deleting image ${id} (${image.image_url}) which is used in:
        - ${image.question_texts.length} question texts
        - ${image.mcq_options.length} MCQ options
        - ${image.match_pairs_left.length} match pairs (left side)
        - ${image.match_pairs_right.length} match pairs (right side)`);

      await this.prisma.image.delete({
        where: { id }
      });

      this.logger.log(`Successfully deleted image ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete image ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete image');
    }
  }
} 