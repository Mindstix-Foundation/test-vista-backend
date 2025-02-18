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

  async findAll() {
    try {
      return await this.prisma.topic.findMany({
        include: {
          chapter: true,
        },
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
      await this.findOne(id);

      await this.prisma.topic.delete({
        where: { id },
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
} 