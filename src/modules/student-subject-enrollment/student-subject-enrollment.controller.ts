import { 
  Controller, 
  Get, 
  Post, 
  Put, 
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
import { StudentSubjectEnrollmentService } from './student-subject-enrollment.service';
import { 
  CreateStudentSubjectEnrollmentDto, 
  UpdateEnrollmentStatusDto, 
  GetEnrollmentsQueryDto,
  GetEnrolledStudentsQueryDto,
  StudentSubjectEnrollmentResponseDto,
  EnrolledStudentResponseDto
} from './dto/student-subject-enrollment.dto';

@ApiTags('student-subject-enrollments')
@Controller('student-subject-enrollments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class StudentSubjectEnrollmentController {
  constructor(private readonly enrollmentService: StudentSubjectEnrollmentService) {}

  @Post()
  @Roles('STUDENT')
  @ApiOperation({ 
    summary: 'Create subject enrollment request',
    description: 'Student creates a request to enroll in a subject with a specific teacher'
  })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Enrollment request created successfully',
    type: StudentSubjectEnrollmentResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid request data or business logic violation'
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: 'Student already has enrollment/request for this teacher-subject'
  })
  async createEnrollmentRequest(
    @Request() req: any,
    @Body() dto: CreateStudentSubjectEnrollmentDto
  ) {
    try {
      // Get student ID from the authenticated user
      const studentId = req.user.student?.id;
      if (!studentId) {
        throw new BadRequestException('Student profile not found for authenticated user');
      }
      
      return await this.enrollmentService.createEnrollmentRequest(studentId, dto);
    } catch (error) {
      console.error('Error in createEnrollmentRequest:', error);
      throw error;
    }
  }

  @Put(':id/status')
  @Roles('TEACHER')
  @ApiOperation({ 
    summary: 'Update enrollment request status',
    description: 'Teacher approves or rejects a student enrollment request'
  })
  @ApiParam({ name: 'id', description: 'Enrollment ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Enrollment status updated successfully',
    type: StudentSubjectEnrollmentResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Enrollment not found'
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Teacher can only update their own subject enrollments'
  })
  async updateEnrollmentStatus(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: UpdateEnrollmentStatusDto
  ) {
    const teacherId = req.user.id;
    return await this.enrollmentService.updateEnrollmentStatus(+id, teacherId, dto);
  }

  @Get()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ 
    summary: 'Get all enrollment requests',
    description: 'Admin can see all enrollments, teachers see their subject enrollments'
  })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by enrollment status' })
  @ApiQuery({ name: 'student_id', required: false, description: 'Filter by student ID' })
  @ApiQuery({ name: 'teacher_subject_id', required: false, description: 'Filter by teacher subject ID' })
  @ApiQuery({ name: 'academic_year', required: false, description: 'Filter by academic year' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'List of enrollment requests',
    type: [StudentSubjectEnrollmentResponseDto]
  })
  async getEnrollments(
    @Query() query: GetEnrollmentsQueryDto,
    @Request() req: any
  ) {
    const userRole = req.user.roles?.[0]?.role?.role_name;
    
    if (userRole === 'TEACHER') {
      // Teachers only see their own subject enrollments
      return await this.enrollmentService.getTeacherEnrollmentRequests(req.user.id, query);
    }
    
    // Admin can see all enrollments
    return await this.enrollmentService.getEnrollments(query);
  }

  @Get('student/my-enrollments')
  @Roles('STUDENT')
  @ApiOperation({ 
    summary: 'Get student\'s own enrollments',
    description: 'Student can see their own enrollment requests and approved enrollments'
  })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by enrollment status' })
  @ApiQuery({ name: 'academic_year', required: false, description: 'Filter by academic year' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Student\'s enrollment requests',
    type: [StudentSubjectEnrollmentResponseDto]
  })
  async getMyEnrollments(
    @Query() query: Partial<GetEnrollmentsQueryDto>,
    @Request() req: any
  ) {
    try {
      const studentId = req.user.student?.id;
      if (!studentId) {
        throw new BadRequestException('Student profile not found for authenticated user');
      }
      
      return await this.enrollmentService.getStudentEnrollments(studentId, query);
    } catch (error) {
      console.error('Error in getMyEnrollments:', error);
      throw error;
    }
  }

  @Get('student/available-subjects')
  @Roles('STUDENT')
  @ApiOperation({ 
    summary: 'Get available subjects for student enrollment',
    description: 'Returns subjects and teachers available for the student to request enrollment'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Available subjects and teachers for enrollment'
  })
  async getAvailableSubjects(@Request() req: any) {
    try {
      const studentId = req.user.student?.id;
      if (!studentId) {
        throw new BadRequestException('Student profile not found for authenticated user');
      }
      
      return await this.enrollmentService.getAvailableSubjectsForStudent(studentId);
    } catch (error) {
      console.error('Error in getAvailableSubjects:', error);
      throw error;
    }
  }

  @Get('teacher/my-requests')
  @Roles('TEACHER')
  @ApiOperation({ 
    summary: 'Get teacher\'s enrollment requests',
    description: 'Teacher can see enrollment requests for their subjects'
  })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by enrollment status' })
  @ApiQuery({ name: 'academic_year', required: false, description: 'Filter by academic year' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Teacher\'s enrollment requests',
    type: [StudentSubjectEnrollmentResponseDto]
  })
  async getMyEnrollmentRequests(
    @Query() query: Partial<GetEnrollmentsQueryDto>,
    @Request() req: any
  ) {
    return await this.enrollmentService.getTeacherEnrollmentRequests(req.user.id, query);
  }

  @Delete(':id')
  @Roles('STUDENT')
  @ApiOperation({ 
    summary: 'Cancel enrollment request',
    description: 'Student can cancel their pending enrollment request'
  })
  @ApiParam({ name: 'id', description: 'Enrollment ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Enrollment request cancelled successfully'
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Enrollment not found'
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Can only cancel pending requests or not owned by student'
  })
  async cancelEnrollmentRequest(
    @Param('id') id: string,
    @Request() req: any
  ) {
    try {
      const studentId = req.user.student?.id;
      if (!studentId) {
        throw new BadRequestException('Student profile not found for authenticated user');
      }
      
      return await this.enrollmentService.cancelEnrollmentRequest(+id, studentId);
    } catch (error) {
      console.error('Error in cancelEnrollmentRequest:', error);
      throw error;
    }
  }

  @Get(':id')
  @Roles('ADMIN', 'TEACHER', 'STUDENT')
  @ApiOperation({ 
    summary: 'Get enrollment by ID',
    description: 'Get specific enrollment details'
  })
  @ApiParam({ name: 'id', description: 'Enrollment ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Enrollment details',
    type: StudentSubjectEnrollmentResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Enrollment not found'
  })
  async getEnrollmentById(@Param('id') id: string) {
    return await this.enrollmentService.getEnrollmentById(+id);
  }

  @Get('teacher/enrolled-students')
  @Roles('TEACHER')
  @ApiOperation({ 
    summary: 'Get enrolled students for teacher by standard and subject',
    description: 'Returns students who are enrolled and approved for the teacher\'s subject in a specific standard. Used for test assignment.'
  })
  @ApiQuery({ name: 'standard_id', description: 'Standard ID to filter students', type: Number })
  @ApiQuery({ name: 'subject_id', description: 'Subject ID to filter students', type: Number })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'List of enrolled students for the teacher',
    type: [EnrolledStudentResponseDto]
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Teacher does not teach the specified subject in the specified standard'
  })
  async getEnrolledStudentsForTeacher(
    @Query() query: GetEnrolledStudentsQueryDto,
    @Request() req: any
  ) {
    try {
      const teacherId = req.user.id;
      return await this.enrollmentService.getEnrolledStudentsForTeacher(teacherId, query);
    } catch (error) {
      console.error('Error in getEnrolledStudentsForTeacher:', error);
      throw error;
    }
  }
} 