import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  Query,
} from '@nestjs/common';
import { TopicService } from './topic.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';

@ApiTags('topics')
@Controller('topics')
export class TopicController {
  constructor(private readonly topicService: TopicService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new topic' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Topic created successfully' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Topic already exists' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  async create(@Body() createTopicDto: CreateTopicDto) {
    return await this.topicService.create(createTopicDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all topics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns all topics' })
  @ApiQuery({ name: 'chapterId', required: false, type: Number })
  findAll(@Query('chapterId') chapterId?: string) {
    return this.topicService.findAll(chapterId ? +chapterId : undefined);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a topic by id' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Topic found' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Topic not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.topicService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a topic' })
  @ApiResponse({ status: HttpStatus.OK, description: 'The topic has been successfully updated.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Topic not found' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateTopicDto: UpdateTopicDto) {
    return this.topicService.update(id, updateTopicDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a topic' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Topic deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Topic not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.topicService.remove(id);
  }

  @Put('reorder/:chapterId/:topicId')
  @ApiOperation({ summary: 'Reorder a topic within a chapter' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Topic reordered successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Topic not found or does not belong to the chapter' })
  async reorder(
    @Param('chapterId', ParseIntPipe) chapterId: number,
    @Param('topicId', ParseIntPipe) topicId: number,
    @Body() data: { sequential_topic_number: number }
  ) {
    return await this.topicService.reorderTopic(chapterId, topicId, data.sequential_topic_number);
  }
} 