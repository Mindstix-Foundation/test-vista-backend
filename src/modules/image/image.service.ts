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

  async uploadImage(file: Express.Multer.File) {
    try {
      // Upload to S3 and get metadata
      const { url, metadata } = await this.awsS3Service.uploadFile(file);
      
      // Create image record in database
      const image = await this.prisma.image.create({
        data: {
          image_url: url,
          original_filename: metadata.originalFilename,
          file_size: metadata.fileSize,
          file_type: metadata.fileType,
          width: metadata.width,
          height: metadata.height
        }
      });
      
      this.logger.log(`Created image record with ID ${image.id}`);
      return image;
    } catch (error) {
      this.logger.error('Failed to upload image:', error);
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
                  id: true,
                  is_verified: true
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
                  question: {
                    select: {
                      id: true,
                      is_verified: true
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
                  question: {
                    select: {
                      id: true,
                      is_verified: true
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
                  question: {
                    select: {
                      id: true,
                      is_verified: true
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
      // First, find the image to get its S3 URL
      const image = await this.prisma.image.findUnique({
        where: { id },
        include: {
          question_texts: {
            select: {
              id: true,
              question: {
                select: {
                  id: true
                }
              }
            }
          },
          mcq_options: {
            select: {
              id: true,
              question_text: {
                select: {
                  question: {
                    select: {
                      id: true
                    }
                  }
                }
              }
            }
          },
          match_pairs_left: {
            select: {
              id: true,
              question_text: {
                select: {
                  question: {
                    select: {
                      id: true
                    }
                  }
                }
              }
            }
          },
          match_pairs_right: {
            select: {
              id: true,
              question_text: {
                select: {
                  question: {
                    select: {
                      id: true
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

      // Get all affected questions to mark them as unverified
      const affectedQuestionIds = new Set<number>();
      
      // Add question IDs from question texts
      image.question_texts.forEach(qt => {
        if (qt.question?.id) {
          affectedQuestionIds.add(qt.question.id);
        }
      });
      
      // Add question IDs from MCQ options
      image.mcq_options.forEach(opt => {
        if (opt.question_text?.question?.id) {
          affectedQuestionIds.add(opt.question_text.question.id);
        }
      });
      
      // Add question IDs from match pairs (left)
      image.match_pairs_left.forEach(mp => {
        if (mp.question_text?.question?.id) {
          affectedQuestionIds.add(mp.question_text.question.id);
        }
      });
      
      // Add question IDs from match pairs (right)
      image.match_pairs_right.forEach(mp => {
        if (mp.question_text?.question?.id) {
          affectedQuestionIds.add(mp.question_text.question.id);
        }
      });

      // Log what will be deleted and where the image is used
      this.logger.log(`Deleting image ${id} (${image.image_url}) which is used in:
        - ${image.question_texts.length} question texts
        - ${image.mcq_options.length} MCQ options
        - ${image.match_pairs_left.length} match pairs (left side)
        - ${image.match_pairs_right.length} match pairs (right side)
        - Affecting ${affectedQuestionIds.size} questions
        All references will be set to null due to onDelete: SetNull`);

      // Delete the image from S3
      await this.awsS3Service.deleteFile(image.image_url);

      // Delete the image from database
      await this.prisma.image.delete({
        where: { id }
      });
      
      // Mark all affected questions as unverified
      if (affectedQuestionIds.size > 0) {
        await this.prisma.question.updateMany({
          where: {
            id: {
              in: Array.from(affectedQuestionIds)
            }
          },
          data: {
            is_verified: false
          }
        });
        
        this.logger.log(`Marked ${affectedQuestionIds.size} questions as unverified due to image deletion`);
      }

      this.logger.log(`Successfully deleted image ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete image ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete image');
    }
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