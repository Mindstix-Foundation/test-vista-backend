import { Controller, Post, Get, Delete, Body, Param, UseInterceptors, UploadedFile, ParseIntPipe, BadRequestException, Put, Query } from '@nestjs/common';
import { TestPaperHtmlService } from './test-paper-html.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
import { UploadHtmlDto } from './dto/upload-html.dto';
import { CreateTestPaperDto } from './dto/create-test-paper.dto';

@ApiTags('test-paper-html')
@Controller('test-paper-html')
export class TestPaperHtmlController {
  constructor(private readonly testPaperHtmlService: TestPaperHtmlService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new test paper' })
  @ApiQuery({ name: 'userId', required: true, type: Number })
  @ApiQuery({ name: 'schoolId', required: true, type: Number })
  async createTestPaper(
    @Query('userId', ParseIntPipe) userId: number,
    @Query('schoolId', ParseIntPipe) schoolId: number,
    @Body() createTestPaperDto: CreateTestPaperDto,
  ) {
    return this.testPaperHtmlService.createTestPaper(
      userId,
      schoolId,
      createTestPaperDto
    );
  }

  @Post('upload-html/:testPaperId')
  @ApiOperation({ summary: 'Upload test paper HTML content for a specific instruction medium' })
  @ApiQuery({ name: 'instructionMediumId', required: true, type: Number })
  async uploadHtml(
    @Param('testPaperId', ParseIntPipe) testPaperId: number,
    @Query('instructionMediumId', ParseIntPipe) instructionMediumId: number,
    @Body() uploadHtmlDto: UploadHtmlDto,
  ) {
    const { htmlContent, filename } = uploadHtmlDto;
    const finalFilename = filename || `test-paper-${testPaperId}-medium-${instructionMediumId}.html`;
    
    return this.testPaperHtmlService.uploadTestPaperHtml(
      testPaperId,
      htmlContent,
      finalFilename,
      instructionMediumId
    );
  }

  @Post('upload-pdf/:testPaperId')
  @ApiOperation({ summary: 'Upload test paper as PDF for a specific instruction medium' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiQuery({ name: 'instructionMediumId', required: true, type: Number })
  @UseInterceptors(FileInterceptor('file'))
  async uploadPdf(
    @Param('testPaperId', ParseIntPipe) testPaperId: number,
    @Query('instructionMediumId', ParseIntPipe) instructionMediumId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('PDF file is required');
    }
    
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('File must be a PDF');
    }
    
    return this.testPaperHtmlService.uploadTestPaperPdf(
      testPaperId,
      file.buffer,
      file.originalname,
      instructionMediumId
    );
  }

  @Get(':testPaperId')
  @ApiOperation({ summary: 'Get all files for a test paper' })
  async getTestPaperFiles(
    @Param('testPaperId', ParseIntPipe) testPaperId: number
  ) {
    return this.testPaperHtmlService.getTestPaperFiles(testPaperId);
  }

  @Get(':testPaperId/medium/:instructionMediumId')
  @ApiOperation({ summary: 'Get a specific file for a test paper by instruction medium' })
  async getTestPaperFile(
    @Param('testPaperId', ParseIntPipe) testPaperId: number,
    @Param('instructionMediumId', ParseIntPipe) instructionMediumId: number
  ) {
    return this.testPaperHtmlService.getTestPaperFile(testPaperId, instructionMediumId);
  }

  @Delete(':testPaperId/medium/:instructionMediumId')
  @ApiOperation({ summary: 'Delete a specific file for a test paper by instruction medium' })
  async deleteTestPaperFile(
    @Param('testPaperId', ParseIntPipe) testPaperId: number,
    @Param('instructionMediumId', ParseIntPipe) instructionMediumId: number
  ) {
    return this.testPaperHtmlService.deleteTestPaperFile(testPaperId, instructionMediumId);
  }

  @Put(':testPaperId/medium/:instructionMediumId/set-default')
  @ApiOperation({ summary: 'Set a specific medium as default for a test paper' })
  async setDefaultMedium(
    @Param('testPaperId', ParseIntPipe) testPaperId: number,
    @Param('instructionMediumId', ParseIntPipe) instructionMediumId: number
  ) {
    return this.testPaperHtmlService.setDefaultMedium(testPaperId, instructionMediumId);
  }
} 