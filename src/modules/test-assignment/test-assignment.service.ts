import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { 
  CreateTestAssignmentDto, 
  BulkAssignTestDto, 
  GetTestAssignmentsQueryDto,
  RemoveTestAssignmentDto,
  BulkRemoveTestAssignmentDto,
  TestAssignmentResponseDto
} from './dto/test-assignment.dto';

@Injectable()
export class TestAssignmentService {
  constructor(private prisma: PrismaService) {}

  private readonly assignmentSelect = {
    id: true,
    student_id: true,
    test_paper_id: true,
    assigned_by_user_id: true,
    assigned_date: true,
    due_date: true,
    available_from: true,
    max_attempts: true,
    time_limit_minutes: true,
    status: true,
    created_at: true,
    updated_at: true,
    student: {
      select: {
        id: true,
        student_id: true,
        user: {
          select: {
            id: true,
            name: true,
            email_id: true
          }
        }
      }
    },
    test_paper: {
      select: {
        id: true,
        name: true,
        duration_minutes: true,
        pattern: {
          select: {
            id: true,
            total_marks: true,
            subject: {
              select: {
                id: true,
                name: true
              }
            },
            standard: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    },
    assigned_by: {
      select: {
        id: true,
        name: true,
        email_id: true
      }
    }
  };

  async assignTest(teacherId: number, dto: CreateTestAssignmentDto): Promise<TestAssignmentResponseDto> {
    try {
      // Verify student exists
      const student = await this.prisma.student.findUnique({
        where: { id: dto.student_id },
        include: {
          school_standard: {
            include: {
              standard: true,
              school: true
            }
          }
        }
      });

      if (!student) {
        throw new NotFoundException(`Student with ID ${dto.student_id} not found`);
      }

      // Verify test paper exists and belongs to teacher
      const testPaper = await this.prisma.test_Paper.findUnique({
        where: { id: dto.test_paper_id },
        include: {
          pattern: {
            include: {
              subject: true,
              standard: true
            }
          }
        }
      });

      if (!testPaper) {
        throw new NotFoundException(`Test paper with ID ${dto.test_paper_id} not found`);
      }

      if (testPaper.user_id !== teacherId) {
        throw new BadRequestException('You can only assign your own test papers');
      }

      // Verify teacher teaches this subject to this student's standard
      const teacherSubject = await this.prisma.teacher_Subject.findFirst({
        where: {
          user_id: teacherId,
          subject_id: testPaper.pattern.subject.id,
          school_standard: {
            standard_id: testPaper.pattern.standard.id,
            school_id: student.school_standard.school.id
          }
        }
      });

      if (!teacherSubject) {
        throw new BadRequestException(
          'You do not teach this subject to this student\'s standard in their school'
        );
      }

      // Check if assignment already exists
      const existingAssignment = await this.prisma.test_Assignment.findUnique({
        where: {
          student_id_test_paper_id: {
            student_id: dto.student_id,
            test_paper_id: dto.test_paper_id
          }
        }
      });

      if (existingAssignment) {
        throw new ConflictException('Test is already assigned to this student');
      }

      // Create the assignment
      const assignment = await this.prisma.test_Assignment.create({
        data: {
          student_id: dto.student_id,
          test_paper_id: dto.test_paper_id,
          assigned_by_user_id: teacherId,
          due_date: new Date(dto.due_date),
          available_from: new Date(dto.available_from),
          max_attempts: dto.max_attempts || 1,
          time_limit_minutes: dto.time_limit_minutes
        },
        select: this.assignmentSelect
      });

      return assignment;
    } catch (error) {
      if (error instanceof NotFoundException || 
          error instanceof BadRequestException || 
          error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to assign test');
    }
  }

  async bulkAssignTest(teacherId: number, dto: BulkAssignTestDto): Promise<{ assigned: number; failed: any[] }> {
    try {
      // Verify test paper exists and belongs to teacher
      const testPaper = await this.prisma.test_Paper.findUnique({
        where: { id: dto.test_paper_id },
        include: {
          pattern: {
            include: {
              subject: true,
              standard: true
            }
          }
        }
      });

      if (!testPaper) {
        throw new NotFoundException(`Test paper with ID ${dto.test_paper_id} not found`);
      }

      if (testPaper.user_id !== teacherId) {
        throw new BadRequestException('You can only assign your own test papers');
      }

      // Get all students and verify they exist and are in correct standard/school
      const students = await this.prisma.student.findMany({
        where: {
          id: { in: dto.student_ids }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email_id: true
            }
          },
          school_standard: {
            include: {
              standard: true,
              school: true
            }
          }
        }
      });

      if (students.length !== dto.student_ids.length) {
        const foundIds = students.map(s => s.id);
        const missingIds = dto.student_ids.filter(id => !foundIds.includes(id));
        throw new NotFoundException(`Students not found: ${missingIds.join(', ')}`);
      }

      // Verify teacher teaches this subject to all students
      const validStudents = [];
      const failedStudents = [];

      for (const student of students) {
        const teacherSubject = await this.prisma.teacher_Subject.findFirst({
          where: {
            user_id: teacherId,
            subject_id: testPaper.pattern.subject.id,
            school_standard: {
              standard_id: testPaper.pattern.standard.id,
              school_id: student.school_standard.school.id
            }
          }
        });

        if (teacherSubject) {
          // Check if assignment already exists
          const existingAssignment = await this.prisma.test_Assignment.findUnique({
            where: {
              student_id_test_paper_id: {
                student_id: student.id,
                test_paper_id: dto.test_paper_id
              }
            }
          });

          if (!existingAssignment) {
            validStudents.push(student.id);
          } else {
            failedStudents.push({
              student_id: student.id,
              student_name: student.user?.name || 'Unknown',
              reason: 'Test already assigned'
            });
          }
        } else {
          failedStudents.push({
            student_id: student.id,
            student_name: student.user?.name || 'Unknown',
            reason: 'Teacher does not teach this subject to this student'
          });
        }
      }

      // Create assignments for valid students
      const assignmentData = validStudents.map(studentId => ({
        student_id: studentId,
        test_paper_id: dto.test_paper_id,
        assigned_by_user_id: teacherId,
        due_date: new Date(dto.due_date),
        available_from: new Date(dto.available_from),
        max_attempts: dto.max_attempts || 1,
        time_limit_minutes: dto.time_limit_minutes
      }));

      if (assignmentData.length > 0) {
        await this.prisma.test_Assignment.createMany({
          data: assignmentData
        });
      }

      return {
        assigned: assignmentData.length,
        failed: failedStudents
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to bulk assign test');
    }
  }

  async removeTestAssignment(teacherId: number, dto: RemoveTestAssignmentDto): Promise<{ message: string }> {
    try {
      // Find the assignment and verify teacher ownership
      const assignment = await this.prisma.test_Assignment.findUnique({
        where: {
          student_id_test_paper_id: {
            student_id: dto.student_id,
            test_paper_id: dto.test_paper_id
          }
        },
        include: {
          test_paper: true,
          student: {
            include: {
              user: true
            }
          }
        }
      });

      if (!assignment) {
        throw new NotFoundException('Test assignment not found');
      }

      if (assignment.test_paper.user_id !== teacherId) {
        throw new BadRequestException('You can only remove assignments for your own test papers');
      }

      // Check if student has already started the test
      const testAttempts = await this.prisma.test_Attempt.findMany({
        where: {
          test_assignment_id: assignment.id
        }
      });

      if (testAttempts.length > 0) {
        throw new BadRequestException('Cannot remove assignment - student has already started the test');
      }

      // Remove the assignment
      await this.prisma.test_Assignment.delete({
        where: { id: assignment.id }
      });

      return {
        message: `Test assignment removed successfully for student ${assignment.student.user.name}`
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to remove test assignment');
    }
  }

  async bulkRemoveTestAssignment(teacherId: number, dto: BulkRemoveTestAssignmentDto): Promise<{ removed: number; failed: any[] }> {
    try {
      // Find all assignments for the given students and test paper
      const assignments = await this.prisma.test_Assignment.findMany({
        where: {
          student_id: { in: dto.student_ids },
          test_paper_id: dto.test_paper_id
        },
        include: {
          test_paper: true,
          student: {
            include: {
              user: true
            }
          },
          test_attempts: true
        }
      });

      // Verify teacher owns the test paper
      if (assignments.length > 0 && assignments[0].test_paper.user_id !== teacherId) {
        throw new BadRequestException('You can only remove assignments for your own test papers');
      }

      const validAssignments = [];
      const failedRemovals = [];

      for (const assignment of assignments) {
        if (assignment.test_attempts.length > 0) {
          failedRemovals.push({
            student_id: assignment.student_id,
            student_name: assignment.student.user.name,
            reason: 'Student has already started the test'
          });
        } else {
          validAssignments.push(assignment.id);
        }
      }

      // Find students that don't have assignments
      const foundStudentIds = assignments.map(a => a.student_id);
      const missingStudentIds = dto.student_ids.filter(id => !foundStudentIds.includes(id));

      for (const studentId of missingStudentIds) {
        failedRemovals.push({
          student_id: studentId,
          student_name: 'Unknown',
          reason: 'Assignment not found'
        });
      }

      // Remove valid assignments
      if (validAssignments.length > 0) {
        await this.prisma.test_Assignment.deleteMany({
          where: {
            id: { in: validAssignments }
          }
        });
      }

      return {
        removed: validAssignments.length,
        failed: failedRemovals
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to bulk remove test assignments');
    }
  }

  async getTestAssignments(query: GetTestAssignmentsQueryDto): Promise<TestAssignmentResponseDto[]> {
    try {
      const where: any = {};

      if (query.student_id) {
        where.student_id = query.student_id;
      }

      if (query.test_paper_id) {
        where.test_paper_id = query.test_paper_id;
      }

      if (query.status) {
        where.status = query.status;
      }

      if (query.assigned_by_user_id) {
        where.assigned_by_user_id = query.assigned_by_user_id;
      }

      const assignments = await this.prisma.test_Assignment.findMany({
        where,
        select: this.assignmentSelect,
        orderBy: {
          assigned_date: 'desc'
        }
      });

      return assignments;
    } catch (error) {
      throw new BadRequestException('Failed to fetch test assignments');
    }
  }

  async getTeacherTestAssignments(teacherId: number, query?: Partial<GetTestAssignmentsQueryDto>): Promise<TestAssignmentResponseDto[]> {
    try {
      const where: any = {
        assigned_by_user_id: teacherId
      };

      if (query?.student_id) {
        where.student_id = query.student_id;
      }

      if (query?.test_paper_id) {
        where.test_paper_id = query.test_paper_id;
      }

      if (query?.status) {
        where.status = query.status;
      }

      const assignments = await this.prisma.test_Assignment.findMany({
        where,
        select: this.assignmentSelect,
        orderBy: {
          assigned_date: 'desc'
        }
      });

      return assignments;
    } catch (error) {
      throw new BadRequestException('Failed to fetch teacher test assignments');
    }
  }
} 