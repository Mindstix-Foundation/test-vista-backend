import { Injectable, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateImageDto } from './dto/image.dto';
import { AwsS3Service } from '../aws/aws-s3.service';

@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly awsS3Service: AwsS3Service
  ) {}

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

  async uploadImage(file: Express.Multer.File, customWidth?: number, customHeight?: number) {
    try {
      // Upload to S3 and get metadata
      const { url, metadata } = await this.awsS3Service.uploadFile(file);
      
      // Use custom dimensions if provided, otherwise use actual image dimensions
      const finalWidth = customWidth ?? metadata.width;
      const finalHeight = customHeight ?? metadata.height;
      
      // Create image record in database
      const image = await this.prisma.image.create({
        data: {
          image_url: url,
          original_filename: metadata.originalFilename,
          file_size: metadata.fileSize,
          file_type: metadata.fileType,
          width: finalWidth,
          height: finalHeight
        }
      });
      
      this.logger.log(`Created image record with ID ${image.id} (${customWidth || customHeight ? 'custom' : 'actual'} dimensions: ${finalWidth}x${finalHeight})`);
      
      // Return the data in the format expected by frontend
      return {
        id: image.id,
        image_url: image.image_url,
        original_filename: image.original_filename,
        file_size: image.file_size,
        file_type: image.file_type,
        width: image.width,
        height: image.height
      };
    } catch (error) {
      this.logger.error('Failed to upload image:', error);
      throw error;
    }
  }

  async uploadAndCreateImage(file: Express.Multer.File, customWidth?: number, customHeight?: number): Promise<number> {
    try {
      // Upload to S3 and get metadata
      const { url, metadata } = await this.awsS3Service.uploadFile(file);
      
      // Use custom dimensions if provided, otherwise use actual image dimensions
      const finalWidth = customWidth ?? metadata.width;
      const finalHeight = customHeight ?? metadata.height;
      
      // Create image record in database
      const image = await this.prisma.image.create({
        data: {
          image_url: url,
          original_filename: metadata.originalFilename,
          file_size: metadata.fileSize,
          file_type: metadata.fileType,
          width: finalWidth,
          height: finalHeight
        }
      });
      
      this.logger.log(`Created image record with ID ${image.id} (${customWidth || customHeight ? 'custom' : 'actual'} dimensions: ${finalWidth}x${finalHeight})`);
      return image.id;
    } catch (error) {
      this.logger.error('Failed to upload and create image:', error);
      throw error;
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
              question_text: true,
              question: {
                select: {
                  id: true
                }
              },
              question_text_topics: {
                select: {
                  is_verified: true,
                  instruction_medium: true
                }
              }
            }
          },
          mcq_options: {
            select: {
              id: true,
              option_text: true,
              question_text: {
                select: {
                  id: true,
                  question: {
                    select: {
                      id: true
                    }
                  },
                  question_text_topics: {
                    select: {
                      is_verified: true,
                      instruction_medium: true
                    }
                  }
                }
              }
            }
          },
          match_pairs_left: {
            select: {
              id: true,
              left_text: true,
              right_text: true,
              question_text: {
                select: {
                  id: true,
                  question: {
                    select: {
                      id: true
                    }
                  },
                  question_text_topics: {
                    select: {
                      is_verified: true,
                      instruction_medium: true
                    }
                  }
                }
              }
            }
          },
          match_pairs_right: {
            select: {
              id: true,
              left_text: true,
              right_text: true,
              question_text: {
                select: {
                  id: true,
                  question: {
                    select: {
                      id: true
                    }
                  },
                  question_text_topics: {
                    select: {
                      is_verified: true,
                      instruction_medium: true
                    }
                  }
                }
              }
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
      const image = await this.findImageWithUsages(id);
      if (!image) {
        throw new NotFoundException(`Image with ID ${id} not found`);
      }

      const affectedQuestionTextTopics = this.collectAffectedQuestionTextTopicIds(image);
      this.logImageDeletion(id, image, affectedQuestionTextTopics);

      await this.awsS3Service.deleteFile(image.image_url);
      await this.prisma.image.delete({ where: { id } });
      await this.markQuestionTextTopicsUnverified(affectedQuestionTextTopics);

      this.logger.log(`Successfully deleted image ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete image ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete image');
    }
  }

  private findImageWithUsages(id: number) {
    const questionTextUsageSelect = {
      id: true,
      question: { select: { id: true } },
      question_text_topics: true,
    };
    return this.prisma.image.findUnique({
      where: { id },
      include: {
        question_texts: { select: questionTextUsageSelect },
        mcq_options: {
          select: {
            id: true,
            question_text: { select: questionTextUsageSelect },
          },
        },
        match_pairs_left: {
          select: {
            id: true,
            question_text: { select: questionTextUsageSelect },
          },
        },
        match_pairs_right: {
          select: {
            id: true,
            question_text: { select: questionTextUsageSelect },
          },
        },
      },
    });
  }

  private collectTopicIds(
    topics: Array<{ id: number }> | undefined,
    into: Set<number>,
  ): void {
    if (!topics) {
      return;
    }
    for (const topic of topics) {
      into.add(topic.id);
    }
  }

  private collectAffectedQuestionTextTopicIds(
    image: Awaited<ReturnType<ImageService['findImageWithUsages']>>,
  ): Set<number> {
    const affected = new Set<number>();
    if (!image) {
      return affected;
    }
    for (const qt of image.question_texts) {
      this.collectTopicIds(qt.question_text_topics, affected);
    }
    for (const item of [...image.mcq_options, ...image.match_pairs_left, ...image.match_pairs_right]) {
      this.collectTopicIds(item.question_text?.question_text_topics, affected);
    }
    return affected;
  }

  private logImageDeletion(
    id: number,
    image: NonNullable<Awaited<ReturnType<ImageService['findImageWithUsages']>>>,
    affectedQuestionTextTopics: Set<number>,
  ): void {
    this.logger.log(`Deleting image ${id} (${image.image_url}) which is used in:
        - ${image.question_texts.length} question texts
        - ${image.mcq_options.length} MCQ options
        - ${image.match_pairs_left.length} match pairs (left side)
        - ${image.match_pairs_right.length} match pairs (right side)
        - Affecting ${affectedQuestionTextTopics.size} question text topic relationships
        All references will be set to null due to onDelete: SetNull`);
  }

  private async markQuestionTextTopicsUnverified(topicIds: Set<number>): Promise<void> {
    if (topicIds.size === 0) {
      return;
    }
    await this.prisma.question_Text_Topic_Medium.updateMany({
      where: { id: { in: Array.from(topicIds) } },
      data: { is_verified: false },
    });
    this.logger.log(
      `Marked ${topicIds.size} question text topic relationships as unverified due to image deletion`,
    );
  }

  async getPresignedUrl(id: number, expiresIn?: number): Promise<string> {
    try {
      const image = await this.prisma.image.findUnique({
        where: { id }
      });

      if (!image) {
        throw new NotFoundException(`Image with ID ${id} not found`);
      }

      return await this.awsS3Service.generatePresignedUrl(image.image_url, expiresIn);
    } catch (error) {
      this.logger.error(`Failed to generate pre-signed URL for image ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to generate pre-signed URL');
    }
  }
}