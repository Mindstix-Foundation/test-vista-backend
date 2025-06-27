import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { 
  CreateStudentSubjectEnrollmentDto, 
  UpdateEnrollmentStatusDto, 
  GetEnrollmentsQueryDto,
  GetEnrolledStudentsQueryDto,
  EnrollmentStatus 
} from './dto/student-subject-enrollment.dto';

@Injectable()
export class StudentSubjectEnrollmentService {
  constructor(private prisma: PrismaService) {}

  private readonly enrollmentSelect = {
    id: true,
    student_id: true,
    teacher_subject_id: true,
    status: true,
    request_message: true,
    teacher_response: true,
    academic_year: true,
    requested_at: true,
    responded_at: true,
    enrollment_date: true,
    created_at: true,
    updated_at: true,
    student: {
      select: {
        id: true,
        user: {
          select: {
            id: true,
            name: true,
            email_id: true
          }
        }
      }
    },
    teacher_subject: {
      select: {
        id: true,
        user: {
          select: {
            id: true,
            name: true,
            email_id: true
          }
        },
        subject: {
          select: {
            id: true,
            name: true
          }
        },
        school_standard: {
          select: {
            id: true,
            standard: {
              select: {
                id: true,
                name: true
              }
            },
            school: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    }
  };

  async createEnrollmentRequest(studentId: number, dto: CreateStudentSubjectEnrollmentDto) {
    try {
      // Verify student exists
      const student = await this.prisma.student.findUnique({
        where: { id: studentId },
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
        throw new NotFoundException(`Student with ID ${studentId} not found`);
      }

      // Verify teacher subject exists and belongs to the same school-standard
      const teacherSubject = await this.prisma.teacher_Subject.findUnique({
        where: { id: dto.teacher_subject_id },
        include: {
          school_standard: {
            include: {
              standard: true,
              school: true
            }
          },
          subject: true,
          user: true
        }
      });

      if (!teacherSubject) {
        throw new NotFoundException(`Teacher subject with ID ${dto.teacher_subject_id} not found`);
      }

      // Verify the teacher subject belongs to the same school-standard as the student
      if (teacherSubject.school_standard_id !== student.school_standard_id) {
        throw new BadRequestException(
          'Cannot request enrollment for a subject not available in your school-standard'
        );
      }

      // Check if student already has a request/enrollment for this teacher-subject
      const existingEnrollment = await this.prisma.student_Subject_Enrollment.findUnique({
        where: {
          student_id_teacher_subject_id: {
            student_id: studentId,
            teacher_subject_id: dto.teacher_subject_id
          }
        }
      });

      if (existingEnrollment) {
        throw new ConflictException(
          `You already have a ${existingEnrollment.status} enrollment for this subject with this teacher`
        );
      }

      // Create the enrollment request
      const enrollment = await this.prisma.student_Subject_Enrollment.create({
        data: {
          student_id: studentId,
          teacher_subject_id: dto.teacher_subject_id,
          request_message: dto.request_message,
          academic_year: dto.academic_year,
          status: EnrollmentStatus.PENDING
        },
        select: this.enrollmentSelect
      });

      return enrollment;
    } catch (error) {
      if (error instanceof NotFoundException || 
          error instanceof BadRequestException || 
          error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to create enrollment request');
    }
  }

  async updateEnrollmentStatus(enrollmentId: number, teacherId: number, dto: UpdateEnrollmentStatusDto) {
    try {
      // Find the enrollment and verify teacher ownership
      const enrollment = await this.prisma.student_Subject_Enrollment.findUnique({
        where: { id: enrollmentId },
        include: {
          teacher_subject: {
            include: {
              user: true
            }
          }
        }
      });

      if (!enrollment) {
        throw new NotFoundException(`Enrollment with ID ${enrollmentId} not found`);
      }

      // Verify the teacher owns this subject
      if (enrollment.teacher_subject.user_id !== teacherId) {
        throw new BadRequestException('You can only update enrollment requests for your own subjects');
      }

      // Prepare update data
      const updateData: any = {
        status: dto.status,
        teacher_response: dto.teacher_response,
        responded_at: new Date()
      };

      // If approving, set enrollment date
      if (dto.status === EnrollmentStatus.APPROVED || dto.status === EnrollmentStatus.ACTIVE) {
        updateData.enrollment_date = new Date();
      }

      // Update the enrollment
      const updatedEnrollment = await this.prisma.student_Subject_Enrollment.update({
        where: { id: enrollmentId },
        data: updateData,
        select: this.enrollmentSelect
      });

      return updatedEnrollment;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to update enrollment status');
    }
  }

  async getEnrollments(query: GetEnrollmentsQueryDto) {
    try {
      const where: any = {};

      if (query.status) {
        where.status = query.status;
      }

      if (query.student_id) {
        where.student_id = query.student_id;
      }

      if (query.teacher_subject_id) {
        where.teacher_subject_id = query.teacher_subject_id;
      }

      if (query.academic_year) {
        where.academic_year = query.academic_year;
      }

      const enrollments = await this.prisma.student_Subject_Enrollment.findMany({
        where,
        select: this.enrollmentSelect,
        orderBy: {
          requested_at: 'desc'
        }
      });

      return enrollments;
    } catch (error) {
      throw new BadRequestException('Failed to fetch enrollments');
    }
  }

  async getStudentEnrollments(studentId: number, query?: Partial<GetEnrollmentsQueryDto>) {
    try {
      console.log('getStudentEnrollments called with:', { studentId, query });
      
      const where: any = {
        student_id: studentId
      };

      if (query?.status) {
        where.status = query.status;
      }

      if (query?.academic_year) {
        where.academic_year = query.academic_year;
      }

      console.log('Prisma query where clause:', where);

      const enrollments = await this.prisma.student_Subject_Enrollment.findMany({
        where,
        select: this.enrollmentSelect,
        orderBy: {
          requested_at: 'desc'
        }
      });

      console.log('Found enrollments:', enrollments.length);
      return enrollments;
    } catch (error) {
      console.error('Error in getStudentEnrollments:', error);
      throw new BadRequestException(`Failed to fetch student enrollments: ${error.message}`);
    }
  }

  async getTeacherEnrollmentRequests(teacherId: number, query?: Partial<GetEnrollmentsQueryDto>) {
    try {
      const where: any = {
        teacher_subject: {
          user_id: teacherId
        }
      };

      if (query?.status) {
        where.status = query.status;
      }

      if (query?.academic_year) {
        where.academic_year = query.academic_year;
      }

      const enrollments = await this.prisma.student_Subject_Enrollment.findMany({
        where,
        select: this.enrollmentSelect,
        orderBy: {
          requested_at: 'desc'
        }
      });

      return enrollments;
    } catch (error) {
      throw new BadRequestException('Failed to fetch teacher enrollment requests');
    }
  }

  async getAvailableSubjectsForStudent(studentId: number) {
    try {
      console.log('getAvailableSubjectsForStudent called with studentId:', studentId);
      
      // Get student's school-standard
      const student = await this.prisma.student.findUnique({
        where: { id: studentId },
        include: {
          school_standard: {
            include: {
              standard: true,
              school: true
            }
          }
        }
      });

      console.log('Found student:', student ? `ID: ${student.id}, School-Standard: ${student.school_standard_id}` : 'Not found');

      if (!student) {
        throw new NotFoundException(`Student with ID ${studentId} not found`);
      }

      // Get all subjects available for this school-standard
      const availableSubjects = await this.prisma.subject.findMany({
        where: {
          teacher_subjects: {
            some: {
              school_standard_id: student.school_standard_id
            }
          }
        },
        select: {
          id: true,
          name: true,
          teacher_subjects: {
            where: {
              school_standard_id: student.school_standard_id
            },
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email_id: true
                }
              }
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      });

      console.log('Found available subjects:', availableSubjects.length);

      // Get student's existing enrollments to filter out already requested/enrolled subjects
      const existingEnrollments = await this.prisma.student_Subject_Enrollment.findMany({
        where: {
          student_id: studentId
        },
        select: {
          teacher_subject_id: true,
          status: true,
          teacher_subject: {
            select: {
              subject_id: true
            }
          }
        }
      });

      console.log('Existing enrollments:', existingEnrollments.length);

      // Get subject IDs where student has any enrollment (regardless of teacher)
      const enrolledSubjectIds = existingEnrollments.map(e => e.teacher_subject.subject_id);
      const uniqueEnrolledSubjectIds = [...new Set(enrolledSubjectIds)];

      console.log('Enrolled subject IDs:', uniqueEnrolledSubjectIds);

      // Filter out entire subjects where student already has any enrollment/request
      const filteredSubjects = availableSubjects.filter(
        subject => !uniqueEnrolledSubjectIds.includes(subject.id)
      );

      console.log('Filtered subjects after removing enrolled ones:', filteredSubjects.length);
      return filteredSubjects;
    } catch (error) {
      console.error('Error in getAvailableSubjectsForStudent:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to fetch available subjects: ${error.message}`);
    }
  }

  async cancelEnrollmentRequest(enrollmentId: number, studentId: number) {
    try {
      // Find the enrollment and verify student ownership
      const enrollment = await this.prisma.student_Subject_Enrollment.findUnique({
        where: { id: enrollmentId },
        include: {
          student: true,
          teacher_subject: {
            include: {
              subject: true
            }
          }
        }
      });

      if (!enrollment) {
        throw new NotFoundException(`Enrollment request with ID ${enrollmentId} not found`);
      }

      // Verify the student owns this enrollment
      if (enrollment.student_id !== studentId) {
        throw new BadRequestException('You can only cancel your own enrollment requests');
      }

      // Can only cancel pending requests
      if (enrollment.status !== EnrollmentStatus.PENDING) {
        throw new BadRequestException('You can only cancel pending enrollment requests');
      }

      // Delete the enrollment request
      await this.prisma.student_Subject_Enrollment.delete({
        where: { id: enrollmentId }
      });

      return {
        message: `Enrollment request for ${enrollment.teacher_subject.subject.name} has been cancelled successfully`
      };
    } catch (error) {
      if (error instanceof NotFoundException || 
          error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to cancel enrollment request');
    }
  }

  async getEnrollmentById(enrollmentId: number) {
    try {
      const enrollment = await this.prisma.student_Subject_Enrollment.findUnique({
        where: { id: enrollmentId },
        select: this.enrollmentSelect
      });

      if (!enrollment) {
        throw new NotFoundException(`Enrollment with ID ${enrollmentId} not found`);
      }

      return enrollment;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch enrollment');
    }
  }

  async getEnrolledStudentsForTeacher(teacherId: number, query: GetEnrolledStudentsQueryDto) {
    try {
      console.log('getEnrolledStudentsForTeacher called with:', { teacherId, query });

      // First, verify that the teacher teaches this subject in this standard
      const teacherSubject = await this.prisma.teacher_Subject.findFirst({
        where: {
          user_id: teacherId,
          subject_id: query.subject_id,
          school_standard: {
            standard_id: query.standard_id
          }
        },
        include: {
          subject: {
            select: {
              id: true,
              name: true
            }
          },
          school_standard: {
            include: {
              standard: {
                select: {
                  id: true,
                  name: true
                }
              },
              school: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });

      if (!teacherSubject) {
        throw new NotFoundException(
          `Teacher does not teach the specified subject in the specified standard`
        );
      }

      console.log('Found teacher subject:', teacherSubject.id);

      // Build the where clause for filtering enrollments
      const where: any = {
        teacher_subject_id: teacherSubject.id,
        status: {
          in: [EnrollmentStatus.APPROVED, EnrollmentStatus.ACTIVE]
        }
      };

      // Get enrolled students
      const enrollments = await this.prisma.student_Subject_Enrollment.findMany({
        where,
        select: {
          id: true,
          student_id: true,
          academic_year: true,
          enrollment_date: true,
          student: {
            select: {
              id: true,
              student_id: true, // This is the roll number
              user: {
                select: {
                  id: true,
                  name: true,
                  email_id: true
                }
              }
            }
          }
        },
        orderBy: [
          {
            student: {
              student_id: 'asc' // Sort by roll number
            }
          },
          {
            student: {
              user: {
                name: 'asc' // Then by name
              }
            }
          }
        ]
      });

      console.log('Found enrolled students:', enrollments.length);

      // If paper_id is provided, filter by assignment status
      let filteredEnrollments = enrollments;
      let assignedStudentIds = new Set<number>();
      
      if (query.paper_id) {
        // First verify the test paper belongs to the teacher
        const testPaper = await this.prisma.test_Paper.findFirst({
          where: {
            id: query.paper_id,
            user_id: teacherId
          }
        });

        if (!testPaper) {
          throw new NotFoundException('Test paper not found or does not belong to the teacher');
        }

        // Get all assignments for this test paper
        const assignments = await this.prisma.test_Assignment.findMany({
          where: {
            test_paper_id: query.paper_id,
            assigned_by_user_id: teacherId
          },
          select: {
            student_id: true
          }
        });

        assignedStudentIds = new Set(assignments.map(a => a.student_id));

        // Filter based on assigned_only parameter
        if (query.assigned_only === true) {
          // Return only students who are assigned this test
          filteredEnrollments = enrollments.filter(enrollment => 
            assignedStudentIds.has(enrollment.student.id)
          );
        } else if (query.assigned_only === false) {
          // Return only students who are NOT assigned this test
          filteredEnrollments = enrollments.filter(enrollment => 
            !assignedStudentIds.has(enrollment.student.id)
          );
        }
        // If assigned_only is undefined, return all students with assignment status
      }

      // Transform the data to match the response DTO
      const enrolledStudents = filteredEnrollments.map(enrollment => {
        const baseData = {
          id: enrollment.id,
          student_id: enrollment.student.id,
          student_roll_number: enrollment.student.student_id,
          student_name: enrollment.student.user.name,
          student_email: enrollment.student.user.email_id,
          academic_year: enrollment.academic_year,
          enrollment_date: enrollment.enrollment_date,
          subject: teacherSubject.subject,
          standard: teacherSubject.school_standard.standard,
          school: teacherSubject.school_standard.school
        };

        // Add assignment status if paper_id is provided
        if (query.paper_id) {
          return {
            ...baseData,
            is_assigned: assignedStudentIds.has(enrollment.student.id)
          };
        }

        return baseData;
      });

      console.log('Transformed enrolled students:', enrolledStudents.length);
      return enrolledStudents;
    } catch (error) {
      console.error('Error in getEnrolledStudentsForTeacher:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to fetch enrolled students: ${error.message}`);
    }
  }
} 