import { 
  Controller, 
  Get, 
  Post, 
  Delete, 
  Body, 
  Param, 
  ParseIntPipe, 
  UseGuards,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Query
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageService } from './image.service';
import { CreateImageDto } from './dto/image.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
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

  @Post('upload')
  @Roles('ADMIN', 'TEACHER')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'The image file to upload',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Upload a new image' })
  @ApiResponse({ status: 201, description: 'Image uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file format or size' })
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return await this.imageService.uploadImage(file);
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
    return { message: 'Image deleted successfully' };
  }

  @Get('presigned/:id')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Get pre-signed URL for image' })
  @ApiResponse({ status: 200, description: 'Returns pre-signed URL for direct S3 access' })
  @ApiResponse({ status: 404, description: 'Image not found' })
  async getPresignedUrl(
    @Param('id', ParseIntPipe) id: number,
    @Query('expiresIn') expiresIn?: number
  ) {
    const presignedUrl = await this.imageService.getPresignedUrl(id, expiresIn);
    return { presignedUrl };
  }
} 