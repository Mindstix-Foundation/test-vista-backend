import { Injectable, Logger, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { toTitleCase } from '../../utils/titleCase';

@Injectable()
export class TopicService {
  private readonly logger = new Logger(TopicService.name);

  constructor(private prisma: PrismaService) {}

  async create(createTopicDto: CreateTopicDto) {
    try {
      const chapter = await this.prisma.chapter.findUnique({
        where: { id: createTopicDto.chapter_id },
      });

      if (!chapter) {
        throw new NotFoundException('Chapter not found');
      }

      const existingTopic = await this.prisma.topic.findFirst({
        where: {
          chapter_id: createTopicDto.chapter_id,
          sequential_topic_number: createTopicDto.sequential_topic_number,
        },
      });

      if (existingTopic) {
        throw new ConflictException(
          `Topic with sequence number ${createTopicDto.sequential_topic_number} already exists for this chapter`,
        );
      }

      const topicData = {
        ...createTopicDto,
        name: toTitleCase(createTopicDto.name),
      };

      return await this.prisma.topic.create({
        data: topicData,
        include: {
          chapter: true,
        },
      });
    } catch (error) {
      this.logger.error('Failed to create topic:', error);
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create topic');
    }
  }

  async findAll(chapterId?: number) {
    try {
      return await this.prisma.topic.findMany({
        where: chapterId ? {
          chapter_id: chapterId
        } : undefined,
        include: {
          chapter: true
        },
        orderBy: {
          sequential_topic_number: 'asc'
        }
      });
    } catch (error) {
      this.logger.error('Failed to fetch topics:', error);
      throw new InternalServerErrorException('Failed to fetch topics');
    }
  }

  async findOne(id: number) {
    try {
      const topic = await this.prisma.topic.findUnique({
        where: { id },
        include: {
          chapter: true,
        },
      });

      if (!topic) {
        throw new NotFoundException('Topic not found');
      }

      return topic;
    } catch (error) {
      this.logger.error(`Failed to fetch topic ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch topic');
    }
  }

  async update(id: number, updateTopicDto: UpdateTopicDto) {
    try {
      const existingTopic = await this.findOne(id);

      if (updateTopicDto.chapter_id) {
        const chapter = await this.prisma.chapter.findUnique({
          where: { id: updateTopicDto.chapter_id },
        });

        if (!chapter) {
          throw new NotFoundException('Chapter not found');
        }
      }

      if (updateTopicDto.sequential_topic_number) {
        const duplicateSequence = await this.prisma.topic.findFirst({
          where: {
            id: { not: id },
            chapter_id: updateTopicDto.chapter_id || existingTopic.chapter_id,
            sequential_topic_number: updateTopicDto.sequential_topic_number,
          },
        });

        if (duplicateSequence) {
          throw new ConflictException(
            `Topic with sequence number ${updateTopicDto.sequential_topic_number} already exists for this chapter`,
          );
        }
      }

      const topicData = {
        ...updateTopicDto,
        name: updateTopicDto.name ? toTitleCase(updateTopicDto.name) : undefined,
      };

      return await this.prisma.topic.update({
        where: { id },
        data: topicData,
        include: {
          chapter: true,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to update topic ${id}:`, error);
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update topic');
    }
  }

  async remove(id: number) {
    try {
      const topicToDelete = await this.findOne(id);
      const currentPosition = topicToDelete.sequential_topic_number;

      await this.prisma.$transaction(async (tx) => {
        // First delete the topic
        await tx.topic.delete({
          where: { id }
        });

        // Update sequence numbers for remaining topics one by one
        const topicsToUpdate = await tx.topic.findMany({
          where: {
            chapter_id: topicToDelete.chapter_id,
            sequential_topic_number: {
              gt: currentPosition
            }
          },
          orderBy: {
            sequential_topic_number: 'asc'
          }
        });

        for (const topic of topicsToUpdate) {
          await tx.topic.update({
            where: { id: topic.id },
            data: {
              sequential_topic_number: topic.sequential_topic_number - 1
            }
          });
        }
      });

      return { message: 'Topic deleted successfully' };
    } catch (error) {
      this.logger.error(`Failed to delete topic ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete topic');
    }
  }

  async reorderTopic(topicId: number, newPosition: number, chapterId?: number) {
    try {
        this.logger.log(`Starting reorder for topic ${topicId} to position ${newPosition}`);
        
        const currentTopic = await this.prisma.topic.findUnique({
            where: { id: topicId },
            select: {
                id: true,
                chapter_id: true,
                sequential_topic_number: true
            }
        });

        if (!currentTopic) {
            throw new NotFoundException(`Topic with ID ${topicId} not found`);
        }

        this.logger.log(`Found current topic: ${JSON.stringify(currentTopic)}`);

        if (chapterId && chapterId !== currentTopic.chapter_id) {
            throw new ConflictException('Topic does not belong to the specified chapter');
        }

        const totalTopics = await this.prisma.topic.count({
            where: { chapter_id: currentTopic.chapter_id }
        });

        this.logger.log(`Total topics in chapter: ${totalTopics}`);

        if (newPosition < 1 || newPosition > totalTopics) {
            throw new ConflictException(`New position must be between 1 and ${totalTopics}`);
        }

        const currentPosition = currentTopic.sequential_topic_number;

        if (currentPosition === newPosition) {
            return await this.findOne(topicId);
        }

        try {
            await this.prisma.$transaction(async (tx) => {
                // First move to temporary position
                this.logger.log(`Moving topic ${topicId} to temporary position`);
                await tx.topic.update({
                    where: { id: topicId },
                    data: { sequential_topic_number: 999 }
                });

                if (currentPosition < newPosition) {
                    // Moving to a later position (e.g., 2->5)
                    for (let i = currentPosition + 1; i <= newPosition; i++) {
                        await tx.topic.updateMany({
                            where: {
                                chapter_id: currentTopic.chapter_id,
                                sequential_topic_number: i
                            },
                            data: {
                                sequential_topic_number: i - 1
                            }
                        });
                    }
                } else {
                    // Moving to an earlier position (e.g., 5->2)
                    for (let i = currentPosition - 1; i >= newPosition; i--) {
                        await tx.topic.updateMany({
                            where: {
                                chapter_id: currentTopic.chapter_id,
                                sequential_topic_number: i
                            },
                            data: {
                                sequential_topic_number: i + 1
                            }
                        });
                    }
                }

                // Finally, move to new position
                this.logger.log(`Moving topic to final position ${newPosition}`);
                await tx.topic.update({
                    where: { id: topicId },
                    data: { sequential_topic_number: newPosition }
                });
            });

            return await this.findOne(topicId);
        } catch (txError) {
            this.logger.error(`Transaction failed: ${txError.message}`, txError.stack);
            throw new InternalServerErrorException(`Failed to reorder: ${txError.message}`);
        }
    } catch (error) {
        this.logger.error(`Reorder failed for topic ${topicId}: ${error.message}`, error.stack);
        if (error instanceof NotFoundException || error instanceof ConflictException) {
            throw error;
        }
        throw new InternalServerErrorException(`Failed to reorder topic: ${error.message}`);
    }
  }
} 