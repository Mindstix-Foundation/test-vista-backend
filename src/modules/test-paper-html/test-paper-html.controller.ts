import { Controller, Post, Delete, Body, Param, UseInterceptors, ParseIntPipe, BadRequestException, Query, Logger, Get, Req, UploadedFiles } from '@nestjs/common';
import { TestPaperHtmlService } from './test-paper-html.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiQuery, ApiResponse, ApiParam } from '@nestjs/swagger';
import { TestPaperDto } from './dto/create-test-paper.dto';

@ApiTags('test-paper-html')
@Controller('test-paper-html')
export class TestPaperHtmlController {
  private readonly logger = new Logger(TestPaperHtmlController.name);
  
  constructor(private readonly testPaperHtmlService: TestPaperHtmlService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get test papers with optional filters',
    description: 'Retrieves test papers with optional filtering by userId and/or schoolId. If no filters are provided, returns all test papers.'
  })
  @ApiQuery({ 
    name: 'userId', 
    required: false, 
    type: Number,
    description: 'Optional: Filter test papers by user ID'
  })
  @ApiQuery({ 
    name: 'schoolId', 
    required: false, 
    type: Number,
    description: 'Optional: Filter test papers by school ID'
  })
  @ApiResponse({
    status: 200,
    description: 'The test papers have been successfully retrieved',
  })
  @ApiResponse({ status: 404, description: 'No test papers found with the provided filters' })
  async getTestPapers(
    @Query('userId') userIdString?: string,
    @Query('schoolId') schoolIdString?: string
  ) {
    try {
      // Parse userId and schoolId if provided
      const userId = userIdString ? parseInt(userIdString, 10) : undefined;
      const schoolId = schoolIdString ? parseInt(schoolIdString, 10) : undefined;
      
      return await this.testPaperHtmlService.getFilteredTestPapers(userId, schoolId);
    } catch (error) {
      this.logger.error(`Error fetching test papers: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get a specific test paper by ID',
    description: 'Retrieves a specific test paper by its ID, including all associated files and chapters'
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'The ID of the test paper to retrieve',
    type: Number
  })
  @ApiResponse({
    status: 200,
    description: 'The test paper has been successfully retrieved',
  })
  @ApiResponse({ status: 404, description: 'Test paper not found' })
  async getTestPaperById(
    @Param('id', ParseIntPipe) id: number
  ) {
    try {
      return await this.testPaperHtmlService.getTestPaperFiles(id);
    } catch (error) {
      this.logger.error(`Error fetching test paper by id: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('create')
  @ApiOperation({ 
    summary: 'Create a new test paper with content',
    description: `Creates a new test paper with chapters weightages and uploads PDF files for multiple instruction mediums.
    
    This endpoint allows you to:
    1. Create a new test paper record with metadata
    2. Add multiple chapters with their weightages
    3. Upload PDF files for multiple instruction mediums
    
    Use multipart/form-data to upload files and include all fields in the form data.
    
    IMPORTANT: 
    - Provide chapters as an array of chapter IDs: [1, 2, 3, 4]
    - Provide weightages as a matching array of numbers: [30, 25, 25, 20]
    - Provide instruction_mediums as an array of medium IDs: [1, 2]
    - Upload files in the same order as the instruction_mediums
    - The first medium in the array will be set as the default medium
    - Each file should be uploaded with the field name 'files'
    - Only PDF files are supported
    
    Example request:
    - chapters: [1, 2, 3, 4]               (Chapter IDs)
    - weightages: [30, 25, 25, 20]        (Percentage weightage for each chapter)
    - instruction_mediums: [1, 2]          (Medium IDs, first one is default)
    - files[0]: English PDF file
    - files[1]: Hindi PDF file`
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'exam_time', 'pattern_id', 'chapters', 'weightages', 'instruction_mediums'],
      properties: {
        name: { 
          type: 'string', 
          example: 'Mathematics Quarterly Test - Q1 2025',
          description: 'The name/title of the test paper'
        },
        exam_time: { 
          type: 'string', 
          example: '1 hour 45 minutes',
          description: 'The duration of the exam in human-readable format'
        },
        pattern_id: { 
          type: 'number', 
          example: 1,
          description: 'The ID of the pattern (question structure) to use for this test paper'
        },
        test_paper_origin_type: { 
          type: 'string', 
          enum: ['board', 'other', 'both'],
          example: 'board',
          description: 'The origin type of the test paper - board, other source, or both'
        },
        chapters: {
          type: 'array',
          items: {
            type: 'number'
          },
          example: [1, 2, 3, 4],
          description: 'Array of chapter IDs'
        },
        weightages: {
          type: 'array',
          items: {
            type: 'number'
          },
          example: [30, 25, 25, 20],
          description: 'Array of weightages matching the chapters array position'
        },
        instruction_mediums: {
          type: 'array',
          items: {
            type: 'number'
          },
          example: [1, 2],
          description: 'Array of instruction medium IDs (must match with uploaded files by position, first medium is default)'
        },
        'files': {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Multiple PDF files to upload, one for each instruction medium'
        },
      },
    },
  })
  @ApiQuery({ 
    name: 'userId', 
    required: true, 
    type: Number,
    description: 'The ID of the user creating the test paper'
  })
  @ApiQuery({ 
    name: 'schoolId', 
    required: true, 
    type: Number,
    description: 'The ID of the school this test paper belongs to'
  })
  @ApiResponse({
    status: 201,
    description: 'The test paper and its content have been successfully created',
  })
  @ApiResponse({ status: 400, description: 'Bad request, invalid data, missing files, or mismatched instruction mediums and files' })
  @ApiResponse({ status: 404, description: 'Pattern, chapter, or instruction medium not found' })
  @UseInterceptors(FilesInterceptor('files'))
  async createTestPaper(
    @Query('userId', ParseIntPipe) userId: number,
    @Query('schoolId', ParseIntPipe) schoolId: number,
    @Body() testPaperDto: TestPaperDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Req() request: any,
  ) {
    this.logger.debug('==== START REQUEST DEBUGGING ====');
    this.logger.debug(`Request Query: userId=${userId}, schoolId=${schoolId}`);
    
    // Log initial request data
    this.logRequestData(request, testPaperDto);
    
    // Process and fix data
    this.processRequestData(testPaperDto, request.body);
    
    // Validate files
    this.validateFiles(files, testPaperDto);

    try {
      this.logger.debug('Calling service.createTestPaperWithContent');
      const result = await this.testPaperHtmlService.createTestPaperWithContent(
        userId,
        schoolId,
        testPaperDto,
        files
      );
      this.logger.debug('Service call successful');
      this.logger.debug('==== END REQUEST DEBUGGING ====');
      return result;
    } catch (error) {
      this.logger.error(`Error creating test paper: ${error.message}`, error.stack);
      this.logger.debug('==== END REQUEST DEBUGGING (WITH ERROR) ====');
      throw error;
    }
  }

  /**
   * Log detailed request data for debugging purposes
   */
  private logRequestData(request: any, testPaperDto: TestPaperDto): void {
    // Log raw body data with types
    this.logger.debug('Raw Request Body Data Types:');
    for (const key in request.body) {
      this.logger.debug(`${key}: ${typeof request.body[key]}, Value: ${request.body[key]}`);
    }
    
    this.logger.debug(`Raw Body Object: ${JSON.stringify(testPaperDto)}`);
    
    // Log chapters data
    this.logFieldData('Chapters', request.body.chapters, testPaperDto.chapters);
    
    // Log weightages data
    this.logFieldData('Weightages', request.body.weightages, testPaperDto.weightages);
    
    // Log instruction mediums data
    this.logFieldData('Instruction Mediums', request.body.instruction_mediums, testPaperDto.instruction_mediums);
  }

  /**
   * Log detailed information about a specific field from both raw body and DTO
   */
  private logFieldData(fieldName: string, rawValue: any, dtoValue: any): void {
    // Log raw data
    this.logger.debug(`${fieldName} as received:`);
    if (rawValue) {
      this.logger.debug(`Type: ${typeof rawValue}`);
      this.logger.debug(`Raw value: ${rawValue}`);
    } else {
      this.logger.debug('Not present in raw body');
    }
    
    // Log DTO data
    this.logger.debug(`DTO ${fieldName.toLowerCase()} as received:`);
    if (dtoValue) {
      this.logger.debug(`Type: ${typeof dtoValue}`);
      this.logger.debug(`Is Array: ${Array.isArray(dtoValue)}`);
      this.logger.debug(`Value: ${JSON.stringify(dtoValue)}`);
    } else {
      this.logger.debug('Not present in DTO');
    }
  }

  /**
   * Process and fix request data, handling string-to-array conversions and fallbacks
   */
  private processRequestData(testPaperDto: TestPaperDto, rawBody: any): void {
    // Fix instruction mediums
    this.tryParseArrayField(testPaperDto, rawBody, 'instruction_mediums');
    
    // Fix chapters
    this.tryParseArrayField(testPaperDto, rawBody, 'chapters');
    
    // Set fallbacks if needed
    this.setFallbackValues(testPaperDto);
    
    // Log final values
    this.logger.debug('Final processed values:');
    this.logger.debug(`instruction_mediums: ${JSON.stringify(testPaperDto.instruction_mediums)}`);
    this.logger.debug(`chapters: ${JSON.stringify(testPaperDto.chapters)}`);
  }

  /**
   * Try to parse a string field into an array and update the DTO
   */
  private tryParseArrayField(testPaperDto: TestPaperDto, rawBody: any, fieldName: string): void {
    if (rawBody[fieldName] && typeof rawBody[fieldName] === 'string') {
      try {
        this.logger.debug(`Attempting to manually parse ${fieldName} from raw string`);
        const manuallyParsed = JSON.parse(rawBody[fieldName]);
        this.logger.debug(`Manually parsed: ${JSON.stringify(manuallyParsed)}`);
        
        if (Array.isArray(manuallyParsed) && manuallyParsed.length > 0) {
          testPaperDto[fieldName] = manuallyParsed;
          this.logger.debug(`Successfully replaced ${fieldName} with manually parsed value`);
        }
      } catch (error) {
        this.logger.debug(`Error manually parsing ${fieldName}: ${error.message}`);
      }
    }
  }

  /**
   * Set fallback values for missing or invalid arrays
   */
  private setFallbackValues(testPaperDto: TestPaperDto): void {
    // Fallback for instruction_mediums
    if (!this.isValidArray(testPaperDto.instruction_mediums)) {
      this.logger.debug('Using fallback for instruction_mediums');
      testPaperDto.instruction_mediums = [5]; // Using ID 5 as a fallback
    }
    
    // Fallback for chapters
    if (!this.isValidArray(testPaperDto.chapters)) {
      this.logger.debug('Using fallback for chapters');
      testPaperDto.chapters = [1, 2];
    }
    
    // Fallback for weightages
    if (!this.isValidArray(testPaperDto.weightages)) {
      this.logger.debug('Using fallback for weightages');
      testPaperDto.weightages = [50, 50];
    }
  }

  /**
   * Check if a value is a valid non-empty array
   */
  private isValidArray(value: any): boolean {
    return value && Array.isArray(value) && value.length > 0;
  }

  /**
   * Validate uploaded files against requirements
   */
  private validateFiles(files: Array<Express.Multer.File>, testPaperDto: TestPaperDto): void {
    // Log files details
    this.logFilesInfo(files);
    
    // Validate that files are provided
    if (!files || files.length === 0) {
      this.logger.debug('No files provided - throwing BadRequestException');
      throw new BadRequestException('At least one PDF file is required');
    }
    
    // Validate that the number of files matches the number of instruction mediums
    if (files.length !== testPaperDto.instruction_mediums.length) {
      this.logger.debug(`Mismatch: ${files.length} files vs ${testPaperDto.instruction_mediums.length} instruction mediums`);
      throw new BadRequestException(
        `Number of files (${files.length}) does not match number of instruction mediums (${testPaperDto.instruction_mediums.length})`
      );
    }
  }

  /**
   * Log information about uploaded files
   */
  private logFilesInfo(files: Array<Express.Multer.File>): void {
    this.logger.debug(`Received ${files ? files.length : 0} files`);
    if (files && files.length > 0) {
      files.forEach((file, index) => {
        this.logger.debug(`File ${index}: ${file.originalname}, ${file.mimetype}, ${file.size} bytes`);
      });
    } else {
      this.logger.debug('No files provided');
    }
  }

  @Delete(':testPaperId')
  @ApiOperation({ 
    summary: 'Delete a test paper and all associated files',
    description: 'Deletes the test paper, all associated files across all instruction mediums, and related data'
  })
  @ApiParam({
    name: 'testPaperId',
    required: true,
    description: 'The ID of the test paper to delete',
    type: Number
  })
  @ApiResponse({
    status: 200,
    description: 'The test paper and all associated files have been successfully deleted',
  })
  @ApiResponse({ status: 404, description: 'Test paper not found' })
  async deleteTestPaper(
    @Param('testPaperId', ParseIntPipe) testPaperId: number
  ) {
    return this.testPaperHtmlService.deleteTestPaper(testPaperId);
  }
} 