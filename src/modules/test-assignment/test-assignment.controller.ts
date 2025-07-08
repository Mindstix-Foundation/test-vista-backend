import { 
  Controller, 
  Get, 
  Post, 
  Delete,
  Body, 
  Param, 
  Query, 
  UseGuards, 
  HttpStatus,
  Request,
  BadRequestException,
  NotFoundException
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiParam, 
  ApiQuery 
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TestAssignmentService } from './test-assignment.service';
import { 
  CreateTestAssignmentDto, 
  BulkAssignTestDto, 
  GetTestAssignmentsQueryDto,
  RemoveTestAssignmentDto,
  BulkRemoveTestAssignmentDto,
  TestAssignmentResponseDto,
  StudentAssignedTestDto,
  ExamInstructionsDto,
  ExamDataDto,
  StartExamDto,
  SubmitAnswerDto,
  SubmitExamDto,
  ExamResultDto,
  DetailedReportDto,
  TestAttemptStatusDto,
  SubmitExamResponseDto,
  TestPaperResultsResponseDto
} from './dto/test-assignment.dto';

@ApiTags('test-assignments')
@Controller('test-assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TestAssignmentController {
  constructor(private readonly testAssignmentService: TestAssignmentService) {}

  @Post()
  @Roles('TEACHER')
  @ApiOperation({ 
    summary: 'Assign test to a student',
    description: 'Teacher assigns a test paper to a specific student'
  })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Test assigned successfully',
    type: TestAssignmentResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid request data or business logic violation'
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: 'Test is already assigned to this student'
  })
  async assignTest(
    @Request() req: any,
    @Body() dto: CreateTestAssignmentDto
  ) {
    try {
      const teacherId = req.user.id;
      return await this.testAssignmentService.assignTest(teacherId, dto);
    } catch (error) {
      console.error('Error in assignTest:', error);
      throw error;
    }
  }

  @Post('bulk')
  @Roles('TEACHER')
  @ApiOperation({ 
    summary: 'Bulk assign test to multiple students',
    description: 'Teacher assigns a test paper to multiple students at once'
  })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Bulk assignment completed',
    schema: {
      type: 'object',
      properties: {
        assigned: { type: 'number', description: 'Number of students successfully assigned' },
        failed: { 
          type: 'array', 
          description: 'List of failed assignments with reasons',
          items: {
            type: 'object',
            properties: {
              student_id: { type: 'number' },
              student_name: { type: 'string' },
              reason: { type: 'string' }
            }
          }
        }
      }
    }
  })
  async bulkAssignTest(
    @Request() req: any,
    @Body() dto: BulkAssignTestDto
  ) {
    try {
      const teacherId = req.user.id;
      return await this.testAssignmentService.bulkAssignTest(teacherId, dto);
    } catch (error) {
      console.error('Error in bulkAssignTest:', error);
      throw error;
    }
  }

  @Delete()
  @Roles('TEACHER')
  @ApiOperation({ 
    summary: 'Remove test assignment from a student',
    description: 'Teacher removes a test assignment from a specific student'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Test assignment removed successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' }
      }
    }
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Test assignment not found'
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Cannot remove assignment - student has already started the test'
  })
  async removeTestAssignment(
    @Request() req: any,
    @Body() dto: RemoveTestAssignmentDto
  ) {
    try {
      const teacherId = req.user.id;
      return await this.testAssignmentService.removeTestAssignment(teacherId, dto);
    } catch (error) {
      console.error('Error in removeTestAssignment:', error);
      throw error;
    }
  }

  @Delete('bulk')
  @Roles('TEACHER')
  @ApiOperation({ 
    summary: 'Bulk remove test assignments from multiple students',
    description: 'Teacher removes test assignments from multiple students at once'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Bulk removal completed',
    schema: {
      type: 'object',
      properties: {
        removed: { type: 'number', description: 'Number of assignments successfully removed' },
        failed: { 
          type: 'array', 
          description: 'List of failed removals with reasons',
          items: {
            type: 'object',
            properties: {
              student_id: { type: 'number' },
              student_name: { type: 'string' },
              reason: { type: 'string' }
            }
          }
        }
      }
    }
  })
  async bulkRemoveTestAssignment(
    @Request() req: any,
    @Body() dto: BulkRemoveTestAssignmentDto
  ) {
    try {
      const teacherId = req.user.id;
      return await this.testAssignmentService.bulkRemoveTestAssignment(teacherId, dto);
    } catch (error) {
      console.error('Error in bulkRemoveTestAssignment:', error);
      throw error;
    }
  }

  @Get()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ 
    summary: 'Get test assignments',
    description: 'Admin can see all assignments, teachers see their own assignments'
  })
  @ApiQuery({ name: 'student_id', required: false, description: 'Filter by student ID' })
  @ApiQuery({ name: 'test_paper_id', required: false, description: 'Filter by test paper ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by assignment status' })
  @ApiQuery({ name: 'assigned_by_user_id', required: false, description: 'Filter by teacher ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'List of test assignments',
    type: [TestAssignmentResponseDto]
  })
  async getTestAssignments(
    @Query() query: GetTestAssignmentsQueryDto,
    @Request() req: any
  ) {
    const userRole = req.user.roles?.[0]?.role?.role_name;
    
    if (userRole === 'TEACHER') {
      // Teachers only see their own assignments
      return await this.testAssignmentService.getTeacherTestAssignments(req.user.id, query);
    }
    
    // Admin can see all assignments
    return await this.testAssignmentService.getTestAssignments(query);
  }

  @Get('teacher/my-assignments')
  @Roles('TEACHER')
  @ApiOperation({ 
    summary: 'Get teacher\'s test assignments',
    description: 'Teacher can see their own test assignments'
  })
  @ApiQuery({ name: 'student_id', required: false, description: 'Filter by student ID' })
  @ApiQuery({ name: 'test_paper_id', required: false, description: 'Filter by test paper ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by assignment status' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Teacher\'s test assignments',
    type: [TestAssignmentResponseDto]
  })
  async getMyTestAssignments(
    @Query() query: Partial<GetTestAssignmentsQueryDto>,
    @Request() req: any
  ) {
    return await this.testAssignmentService.getTeacherTestAssignments(req.user.id, query);
  }

  @Get('student/my-tests')
  @Roles('STUDENT')
  @ApiOperation({ 
    summary: 'Get student\'s assigned tests',
    description: 'Student gets their own assigned tests with status filtering'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Student assigned tests retrieved successfully',
    type: [StudentAssignedTestDto]
  })
  @ApiQuery({ 
    name: 'status', 
    required: false, 
    description: 'Filter by test status (assigned, active, completed, expired)' 
  })
  async getStudentAssignedTests(
    @Request() req: any,
    @Query('status') status?: string
  ) {
    try {
      const userId = req.user.id;
      return await this.testAssignmentService.getStudentAssignedTests(userId, status);
    } catch (error) {
      console.error('Error in getStudentAssignedTests:', error);
      throw error;
    }
  }

  // New student exam endpoints

  @Get('student/exam/:assignmentId/instructions')
  @Roles('STUDENT')
  @ApiOperation({ 
    summary: 'Get exam instructions',
    description: 'Student gets exam instructions and details before starting'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Exam instructions retrieved successfully',
    type: ExamInstructionsDto
  })
  @ApiParam({ name: 'assignmentId', description: 'Test assignment ID' })
  async getExamInstructions(
    @Request() req: any,
    @Param('assignmentId') assignmentId: string
  ) {
    try {
      const userId = req.user.id;
      return await this.testAssignmentService.getExamInstructions(userId, parseInt(assignmentId));
    } catch (error) {
      console.error('Error in getExamInstructions:', error);
      throw error;
    }
  }

  @Post('student/exam/start')
  @Roles('STUDENT')
  @ApiOperation({ 
    summary: 'Start exam',
    description: 'Student starts an assigned exam and creates a test attempt'
  })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Exam started successfully',
    type: ExamDataDto
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Cannot start exam (not available, already completed, etc.)'
  })
  async startExam(
    @Request() req: any,
    @Body() dto: StartExamDto
  ) {
    try {
      const userId = req.user.id;
      return await this.testAssignmentService.startExam(userId, dto);
    } catch (error) {
      console.error('Error in startExam:', error);
      throw error;
    }
  }

  @Get('student/exam/:attemptId/status')
  @Roles('STUDENT')
  @ApiOperation({ 
    summary: 'Get exam attempt status',
    description: 'Get current status of an ongoing exam attempt'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Exam attempt status retrieved successfully',
    type: TestAttemptStatusDto
  })
  @ApiParam({ name: 'attemptId', description: 'Test attempt ID' })
  async getExamAttemptStatus(
    @Request() req: any,
    @Param('attemptId') attemptId: string
  ) {
    try {
      const userId = req.user.id;
      return await this.testAssignmentService.getExamAttemptStatus(userId, parseInt(attemptId));
    } catch (error) {
      console.error('Error in getExamAttemptStatus:', error);
      throw error;
    }
  }

  @Post('student/exam/answer')
  @Roles('STUDENT')
  @ApiOperation({ 
    summary: 'Submit answer for a question',
    description: 'Student submits or updates answer for a specific question'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Answer submitted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        is_correct: { type: 'boolean', description: 'Only returned after exam submission' }
      }
    }
  })
  async submitAnswer(
    @Request() req: any,
    @Body() dto: SubmitAnswerDto
  ) {
    try {
      const userId = req.user.id;
      return await this.testAssignmentService.submitAnswer(userId, dto);
    } catch (error) {
      console.error('Error in submitAnswer:', error);
      throw error;
    }
  }

  @Post('student/exam/submit')
  @Roles('STUDENT')
  @ApiOperation({ 
    summary: 'Submit exam',
    description: 'Student submits the complete exam for evaluation'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Exam submitted successfully',
    type: SubmitExamResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Cannot submit exam (already submitted, invalid attempt, etc.)'
  })
  async submitExam(
    @Request() req: any,
    @Body() dto: SubmitExamDto
  ) {
    try {
      const userId = req.user.id;
      return await this.testAssignmentService.submitExam(userId, dto);
    } catch (error) {
      console.error('Error in submitExam:', error);
      throw error;
    }
  }

  @Get('student/exam/:attemptId/result')
  @Roles('STUDENT')
  @ApiOperation({ 
    summary: 'Get exam result',
    description: 'Student gets their exam result after submission'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Exam result retrieved successfully',
    type: ExamResultDto
  })
  @ApiParam({ name: 'attemptId', description: 'Test attempt ID' })
  async getExamResult(
    @Request() req: any,
    @Param('attemptId') attemptId: string
  ) {
    try {
      const userId = req.user.id;
      return await this.testAssignmentService.getExamResult(userId, parseInt(attemptId));
    } catch (error) {
      console.error('Error in getExamResult:', error);
      throw error;
    }
  }

  @Get('student/exam/:attemptId/detailed-report')
  @Roles('STUDENT')
  @ApiOperation({ 
    summary: 'Get detailed exam report',
    description: 'Student gets detailed question-by-question analysis of their exam'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Detailed exam report retrieved successfully',
    type: DetailedReportDto
  })
  @ApiParam({ name: 'attemptId', description: 'Test attempt ID' })
  async getDetailedReport(
    @Request() req: any,
    @Param('attemptId') attemptId: string
  ) {
    try {
      const userId = req.user.id;
      return await this.testAssignmentService.getDetailedReport(userId, parseInt(attemptId));
    } catch (error) {
      console.error('Error in getDetailedReport:', error);
      throw error;
    }
  }

  @Get(':id')
  @Roles('ADMIN', 'TEACHER', 'STUDENT')
  @ApiOperation({ 
    summary: 'Get test assignment by ID',
    description: 'Get specific test assignment details'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Test assignment retrieved successfully',
    type: TestAssignmentResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Test assignment not found'
  })
  @ApiParam({ name: 'id', description: 'Test assignment ID' })
  async getTestAssignmentById(@Param('id') id: string) {
    try {
      return await this.testAssignmentService.getTestAssignmentById(parseInt(id));
    } catch (error) {
      console.error('Error in getTestAssignmentById:', error);
      throw error;
    }
  }

  @Get('test-paper/:testPaperId/results')
  @Roles('TEACHER')
  @ApiOperation({ 
    summary: 'Get test paper results',
    description: 'Get all student results for a specific test paper with ranking based on marks and time'
  })
  @ApiParam({ 
    name: 'testPaperId', 
    description: 'Test Paper ID',
    example: 1
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Test paper results retrieved successfully',
    type: TestPaperResultsResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Test paper not found'
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'You can only view results for your own test papers'
  })
  async getTestPaperResults(
    @Request() req: any,
    @Param('testPaperId') testPaperId: string
  ) {
    try {
      const teacherId = req.user.id;
      const testPaperIdNumber = parseInt(testPaperId);
      
      if (isNaN(testPaperIdNumber)) {
        throw new BadRequestException('Invalid test paper ID');
      }
      
      return await this.testAssignmentService.getTestPaperResults(teacherId, testPaperIdNumber);
    } catch (error) {
      console.error('Error in getTestPaperResults:', error);
      throw error;
    }
  }
} 