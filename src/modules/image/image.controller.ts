import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ImageService } from './image.service';
import { CreateImageDto } from './dto/image.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('images')
@Controller('images')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  @Post()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Create a new image' })
  @ApiResponse({ status: 201, description: 'Image created successfully' })
  async create(@Body() createDto: CreateImageDto) {
    return await this.imageService.create(createDto);
  }

  @Get(':id')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Get image by ID' })
  @ApiResponse({ status: 200, description: 'Returns the image' })
  @ApiResponse({ status: 404, description: 'Image not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.imageService.findOne(id);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete an image' })
  @ApiResponse({ status: 200, description: 'Image deleted successfully' })
  @ApiResponse({ status: 404, description: 'Image not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.imageService.remove(id);
  }
} 