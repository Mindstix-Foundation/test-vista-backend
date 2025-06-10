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
              },
              question_text_topics: true
            }
          },
          mcq_options: {
            select: {
              id: true,
              question_text: {
                select: {
                  id: true,
                  question: {
                    select: {
                      id: true
                    }
                  },
                  question_text_topics: true
                }
              }
            }
          },
          match_pairs_left: {
            select: {
              id: true,
              question_text: {
                select: {
                  id: true,
                  question: {
                    select: {
                      id: true
                    }
                  },
                  question_text_topics: true
                }
              }
            }
          },
          match_pairs_right: {
            select: {
              id: true,
              question_text: {
                select: {
                  id: true,
                  question: {
                    select: {
                      id: true
                    }
                  },
                  question_text_topics: true
                }
              }
            }
          }
        }
      });

      if (!image) {
        throw new NotFoundException(`Image with ID ${id} not found`);
      }

      // Get all affected question text topic relationships to mark them as unverified
      const affectedQuestionTextTopics = new Set<number>();
      
      // Add question text topic IDs from question texts
      image.question_texts.forEach(qt => {
        if (qt.question_text_topics) {
          qt.question_text_topics.forEach(qtt => {
            affectedQuestionTextTopics.add(qtt.id);
          });
        }
      });
      
      // Add question text topic IDs from MCQ options
      image.mcq_options.forEach(opt => {
        if (opt.question_text?.question_text_topics) {
          opt.question_text.question_text_topics.forEach(qtt => {
            affectedQuestionTextTopics.add(qtt.id);
          });
        }
      });
      
      // Add question text topic IDs from match pairs (left)
      image.match_pairs_left.forEach(mp => {
        if (mp.question_text?.question_text_topics) {
          mp.question_text.question_text_topics.forEach(qtt => {
            affectedQuestionTextTopics.add(qtt.id);
          });
        }
      });
      
      // Add question text topic IDs from match pairs (right)
      image.match_pairs_right.forEach(mp => {
        if (mp.question_text?.question_text_topics) {
          mp.question_text.question_text_topics.forEach(qtt => {
            affectedQuestionTextTopics.add(qtt.id);
          });
        }
      });

      // Log what will be deleted and where the image is used
      this.logger.log(`Deleting image ${id} (${image.image_url}) which is used in:
        - ${image.question_texts.length} question texts
        - ${image.mcq_options.length} MCQ options
        - ${image.match_pairs_left.length} match pairs (left side)
        - ${image.match_pairs_right.length} match pairs (right side)
        - Affecting ${affectedQuestionTextTopics.size} question text topic relationships
        All references will be set to null due to onDelete: SetNull`);

      // Delete the image from S3
      await this.awsS3Service.deleteFile(image.image_url);

      // Delete the image from database
      await this.prisma.image.delete({
        where: { id }
      });
      
      // Mark all affected question text topics as unverified
      if (affectedQuestionTextTopics.size > 0) {
        await this.prisma.question_Text_Topic_Medium.updateMany({
          where: {
            id: {
              in: Array.from(affectedQuestionTextTopics)
            }
          },
          data: {
            is_verified: false
          }
        });
        
        this.logger.log(`Marked ${affectedQuestionTextTopics.size} question text topic relationships as unverified due to image deletion`);
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