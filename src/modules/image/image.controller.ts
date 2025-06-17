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
  Query,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageService } from './image.service';
import { CreateImageDto, ImageUploadDto } from './dto/image.dto';
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
  @ApiBearerAuth()
  @Roles('ADMIN', 'TEACHER')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Create a new image' })
  @ApiResponse({ status: 201, description: 'Image created successfully' })
  async create(@Body() createImageDto: CreateImageDto) {
    return this.imageService.create(createImageDto);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @Roles('ADMIN', 'TEACHER')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Image file upload with optional custom dimensions',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        width: {
          type: 'number',
          description: 'Custom width in pixels (optional)',
        },
        height: {
          type: 'number',
          description: 'Custom height in pixels (optional)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Image uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        image_url: { type: 'string' },
        original_filename: { type: 'string' },
        file_size: { type: 'number' },
        file_type: { type: 'string' },
        width: { type: 'number' },
        height: { type: 'number' }
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file format or size',
  })
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('width') width?: string,
    @Body('height') height?: string
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    
    // Convert string values to numbers if provided
    const customWidth = width ? parseInt(width, 10) : undefined;
    const customHeight = height ? parseInt(height, 10) : undefined;
    
    return this.imageService.uploadImage(file, customWidth, customHeight);
  }

  @Post('upload-and-create')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @Roles('ADMIN', 'TEACHER')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Image file upload and create with optional custom dimensions',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        width: {
          type: 'number',
          description: 'Custom width in pixels (optional)',
        },
        height: {
          type: 'number',
          description: 'Custom height in pixels (optional)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Image uploaded and created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number' }
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file format or size',
  })
  async uploadAndCreate(
    @UploadedFile() file: Express.Multer.File,
    @Body('width') width?: string,
    @Body('height') height?: string
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    
    // Convert string values to numbers if provided
    const customWidth = width ? parseInt(width, 10) : undefined;
    const customHeight = height ? parseInt(height, 10) : undefined;
    
    const imageId = await this.imageService.uploadAndCreateImage(file, customWidth, customHeight);
    return { id: imageId };
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