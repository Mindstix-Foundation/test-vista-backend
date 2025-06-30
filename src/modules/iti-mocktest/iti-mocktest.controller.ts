import { Controller, Post, Get, Body, Param, ParseIntPipe, HttpStatus, UseGuards, Request, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ItiMocktestService } from './iti-mocktest.service';
import { ItiStudentRegistrationDto, ItiStudentLoginDto } from './dto/iti-student-registration.dto';

@ApiTags('iti-mocktest')
@Controller('iti-mocktest')
export class ItiMocktestController {
  constructor(private readonly itiMocktestService: ItiMocktestService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register ITI student with simplified form' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Student registered successfully and auto-logged in' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Roll number already exists in this college' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'School standard combination not found' })
  async registerStudent(@Body() registrationDto: ItiStudentRegistrationDto) {
    return await this.itiMocktestService.registerStudent(registrationDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login ITI student with roll number and college' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Login successful' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid roll number or college' })
  async loginStudent(@Body() loginDto: ItiStudentLoginDto) {
    return await this.itiMocktestService.loginStudent(loginDto);
  }

  @Get('boards')
  @ApiOperation({ summary: 'Get all boards for ITI registration' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Boards retrieved successfully' })
  async getBoards() {
    return await this.itiMocktestService.getBoards();
  }

  @Get('schools/:boardId')
  @ApiOperation({ summary: 'Get schools by board ID' })
  @ApiParam({ name: 'boardId', type: Number, description: 'Board ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Schools retrieved successfully' })
  async getSchoolsByBoard(@Param('boardId', ParseIntPipe) boardId: number) {
    return await this.itiMocktestService.getSchoolsByBoard(boardId);
  }

  @Get('standards/:schoolId')
  @ApiOperation({ summary: 'Get standards by school ID' })
  @ApiParam({ name: 'schoolId', type: Number, description: 'School ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Standards retrieved successfully' })
  async getStandardsBySchool(@Param('schoolId', ParseIntPipe) schoolId: number) {
    return await this.itiMocktestService.getStandardsBySchool(schoolId);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get ITI student profile' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid token or session expired' })
  async getStudentProfile(@Request() req: any) {
    return await this.itiMocktestService.getStudentProfile(req.user.id);
  }

  @Get('students')
  @ApiOperation({ summary: 'Get ITI students by school and standard' })
  @ApiQuery({ name: 'schoolId', type: 'number', description: 'School ID' })
  @ApiQuery({ name: 'standardId', type: 'number', description: 'Standard ID' })
  async getStudentsBySchoolAndStandard(
    @Query('schoolId') schoolId: string,
    @Query('standardId') standardId: string,
  ) {
    const schoolIdNum = parseInt(schoolId, 10);
    const standardIdNum = parseInt(standardId, 10);
    
    if (isNaN(schoolIdNum) || isNaN(standardIdNum)) {
      throw new BadRequestException('Invalid schoolId or standardId');
    }
    
    return this.itiMocktestService.getStudentsBySchoolAndStandard(schoolIdNum, standardIdNum);
  }
} 