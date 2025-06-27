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
  StudentAssignedTestDto
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
    description: 'Student can see their own assigned tests with status filtering'
  })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by test status (upcoming, active, completed, absent)' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Student\'s assigned tests',
    type: [StudentAssignedTestDto]
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized - Student authentication required'
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Forbidden - Student role required'
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

  @Get(':id')
  @Roles('ADMIN', 'TEACHER', 'STUDENT')
  @ApiOperation({ 
    summary: 'Get test assignment by ID',
    description: 'Get specific test assignment details'
  })
  @ApiParam({ name: 'id', description: 'Test Assignment ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Test assignment details',
    type: TestAssignmentResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Test assignment not found'
  })
  async getTestAssignmentById(@Param('id') id: string) {
    // This method would need to be implemented in the service
    throw new BadRequestException('Method not implemented yet');
  }
} 