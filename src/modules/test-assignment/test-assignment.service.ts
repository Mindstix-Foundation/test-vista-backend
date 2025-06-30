import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
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
  TestPaperResultsResponseDto,
  TestPaperResultDto
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
          },
          school: true
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
          },
          school: true
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

      // For ITI students workflow: Allow assignment to all students in the same standard and school
      // Skip teacher-student enrollment verification as ITI students don't go through enrollment
      const validStudents = [];
      const failedStudents = [];

      for (const student of students) {
        // Verify student is in the correct standard and school for this test paper
        const isCorrectStandardAndSchool = 
          student.school_standard.standard.id === testPaper.pattern.standard.id &&
          student.school_standard.school.id === testPaper.school.id;

        if (isCorrectStandardAndSchool) {
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
            reason: 'Student is not in the correct standard or school for this test'
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

  async getStudentAssignedTests(userId: number, statusFilter?: string): Promise<StudentAssignedTestDto[]> {
    try {
      // First, get the student record from the user ID
      const student = await this.prisma.student.findUnique({
        where: { user_id: userId },
        select: { id: true }
      });

      if (!student) {
        throw new NotFoundException('Student profile not found');
      }

      // Get all test assignments for this student
      const assignments = await this.prisma.test_Assignment.findMany({
        where: {
          student_id: student.id
        },
        include: {
          test_paper: {
            include: {
              pattern: {
                include: {
                  subject: true,
                  standard: true
                }
              },
              test_paper_questions: {
                select: {
                  id: true
                }
              }
            }
          },
          assigned_by: {
            select: {
              name: true
            }
          },
          test_attempts: {
            select: {
              id: true,
              status: true,
              started_at: true,
              submitted_at: true,
              student_answers: {
                select: {
                  id: true,
                  selected_option_id: true
                }
              }
            },
            orderBy: {
              started_at: 'desc'
            }
          }
        },
        orderBy: {
          assigned_date: 'desc'
        }
      });

      const now = new Date();
      
      // Transform assignments to the required format
      const transformedAssignments = assignments.map(assignment => {
        const availableFrom = new Date(assignment.available_from);
        const dueDate = new Date(assignment.due_date);
        
        // Determine status based on the logic provided
        let status: string;
        const hasCompletedAttempts = assignment.test_attempts.some(attempt => attempt.status === 'completed');
        const totalAttempts = assignment.test_attempts.length;
        const maxAttemptsReached = totalAttempts >= assignment.max_attempts;
        
        if (hasCompletedAttempts || maxAttemptsReached) {
          status = 'completed';
        } else if (availableFrom > now) {
          status = 'upcoming';
        } else if (availableFrom <= now && now <= dueDate) {
          status = 'active';
        } else { // due_date < now
          status = 'absent';
        }

        // Calculate progress based on current attempt
        let progress = 0;
        let remainingTime = '';
        
        const currentAttempt = assignment.test_attempts.find(attempt => attempt.status === 'in_progress');
        const totalQuestions = assignment.test_paper.test_paper_questions.length;
        
        if (currentAttempt && totalQuestions > 0) {
          const answeredQuestions = currentAttempt.student_answers.filter(answer => answer.selected_option_id !== null).length;
          progress = Math.round((answeredQuestions / totalQuestions) * 100);
          
          // Calculate remaining time
          const testDurationMs = (assignment.time_limit_minutes || assignment.test_paper.duration_minutes || 0) * 60 * 1000;
          const elapsedMs = now.getTime() - new Date(currentAttempt.started_at).getTime();
          const remainingMs = Math.max(0, testDurationMs - elapsedMs);
          
          if (remainingMs > 0) {
            const remainingMinutes = Math.floor(remainingMs / (1000 * 60));
            const remainingSeconds = Math.floor((remainingMs % (1000 * 60)) / 1000);
            remainingTime = `${remainingMinutes}:${remainingSeconds.toString().padStart(2, '0')}`;
          } else {
            remainingTime = '0:00';
          }
        }

        return {
          id: assignment.id,
          title: assignment.test_paper.name,
          status,
          dueDate: dueDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          }),
          availableDate: availableFrom.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          duration: assignment.time_limit_minutes || assignment.test_paper.duration_minutes || 0,
          questions: totalQuestions,
          maxScore: assignment.test_paper.pattern.total_marks,
          progress,
          remainingTime,
          subject: assignment.test_paper.pattern.subject.name,
          standard: assignment.test_paper.pattern.standard.name,
          assignedBy: assignment.assigned_by.name
        };
      });

      // Filter by status if provided
      if (statusFilter) {
        return transformedAssignments.filter(assignment => assignment.status === statusFilter);
      }

      return transformedAssignments;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch student assigned tests');
    }
  }

  async getTestAssignmentById(id: number): Promise<TestAssignmentResponseDto> {
    try {
      const assignment = await this.prisma.test_Assignment.findUnique({
        where: { id },
        select: this.assignmentSelect
      });

      if (!assignment) {
        throw new NotFoundException(`Test assignment with ID ${id} not found`);
      }

      return assignment;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve test assignment');
    }
  }

  // New student exam methods

  async getExamInstructions(userId: number, assignmentId: number): Promise<ExamInstructionsDto> {
    try {
      // First get the student record
      const student = await this.prisma.student.findUnique({
        where: { user_id: userId }
      });

      if (!student) {
        throw new NotFoundException('Student record not found');
      }

      // Get the assignment and verify it belongs to this student
      const assignment = await this.prisma.test_Assignment.findFirst({
        where: {
          id: assignmentId,
          student_id: student.id
        },
        include: {
          test_paper: {
            include: {
              pattern: {
                include: {
                  subject: true,
                  standard: true
                }
              }
            }
          }
        }
      });

      if (!assignment) {
        throw new NotFoundException('Test assignment not found or not assigned to you');
      }

      // Check if exam is available
      const now = new Date();
      if (now < assignment.available_from) {
        throw new BadRequestException('Exam is not yet available');
      }

      if (now > assignment.due_date) {
        throw new BadRequestException('Exam deadline has passed');
      }

      // Get existing attempts count
      const existingAttempts = await this.prisma.test_Attempt.count({
        where: {
          student_id: student.id,
          test_assignment_id: assignment.id
        }
      });

      // Calculate attempts left
      const attemptsLeft = Math.max(0, assignment.max_attempts - existingAttempts);

      // Get question count from test paper
      const questionCount = await this.prisma.test_Paper_Question.count({
        where: { test_paper_id: assignment.test_paper_id }
      });

      return {
        id: assignment.id,
        title: assignment.test_paper.name,
        subject: assignment.test_paper.pattern.subject.name,
        standard: assignment.test_paper.pattern.standard.name,
        duration_minutes: assignment.time_limit_minutes || assignment.test_paper.duration_minutes || 60,
        total_questions: questionCount,
        total_marks: assignment.test_paper.pattern.total_marks,
        instructions: assignment.test_paper.instructions,
        negative_marking: assignment.test_paper.negative_marking,
        negative_marks_per_question: assignment.test_paper.negative_marks_per_question,
        max_attempts: assignment.max_attempts,
        attempts_left: attemptsLeft,
        available_from: assignment.available_from,
        due_date: assignment.due_date,
        status: assignment.status
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to get exam instructions');
    }
  }

  // Helper method to create a seeded random number generator
  private createSeededRandom(seed: number) {
    let x = Math.sin(seed) * 10000;
    return function() {
      x = Math.sin(x) * 10000;
      return x - Math.floor(x);
    };
  }

  // Helper method to shuffle array using seeded random
  private shuffleArray<T>(array: T[], seed: number): T[] {
    const shuffled = [...array];
    const random = this.createSeededRandom(seed);
    
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
  }

  // Helper method to randomize questions based on student ID
  private randomizeQuestions(questions: any[], studentId: number, shouldRandomize: boolean) {
    if (!shouldRandomize) {
      return questions.sort((a, b) => a.question_order - b.question_order);
    }
    
    // Use student ID as seed for consistent randomization per student
    const seed = studentId * 1000; // Multiply to get better distribution
    return this.shuffleArray(questions, seed);
  }

  // Helper method to randomize options based on student ID and question ID
  private randomizeOptions(options: any[], optionIds: any[], optionImages: any[], studentId: number, questionId: number, shouldRandomize: boolean) {
    if (!shouldRandomize || options.length <= 1) {
      return { options, optionIds, optionImages };
    }
    
    // Create combined array to maintain relationships
    const combined = options.map((option, index) => ({
      option: option,
      optionId: optionIds[index],
      optionImage: optionImages[index]
    }));
    
    // Use student ID + question ID as seed for unique randomization per question per student
    const seed = studentId * 10000 + questionId;
    const shuffled = this.shuffleArray(combined, seed);
    
    return {
      options: shuffled.map(item => item.option),
      optionIds: shuffled.map(item => item.optionId),
      optionImages: shuffled.map(item => item.optionImage)
    };
  }

  async startExam(userId: number, dto: StartExamDto): Promise<ExamDataDto> {
    try {
      // Get student record
      const student = await this.prisma.student.findUnique({
        where: { user_id: userId }
      });

      if (!student) {
        throw new NotFoundException('Student record not found');
      }

      // Verify assignment belongs to student
      const assignment = await this.prisma.test_Assignment.findFirst({
        where: {
          id: dto.assignment_id,
          student_id: student.id
        },
        include: {
          test_paper: {
            include: {
              pattern: {
                include: {
                  subject: true,
                  standard: true
                }
              }
            }
          }
        }
      });

      if (!assignment) {
        throw new NotFoundException('Test assignment not found');
      }

      // Check if exam is available
      const now = new Date();
      if (now < assignment.available_from) {
        throw new BadRequestException('Exam is not yet available');
      }

      if (now > assignment.due_date) {
        throw new BadRequestException('Exam deadline has passed');
      }

      // Check for ongoing attempt first - if exists, return it instead of creating new one
      const ongoingAttempt = await this.prisma.test_Attempt.findFirst({
        where: {
          student_id: student.id,
          test_assignment_id: assignment.id,
          status: 'in_progress'
        }
      });

      if (ongoingAttempt) {
        // Resume existing attempt - get questions and return exam data
        const questions = await this.prisma.test_Paper_Question.findMany({
          where: { test_paper_id: assignment.test_paper_id },
          include: {
            question_text: {
              include: {
                image: true,
                mcq_options: {
                  include: {
                    image: true
                  },
                  orderBy: { id: 'asc' }
                }
              }
            }
          },
          orderBy: { question_order: 'asc' }
        });

        // Apply randomization based on test paper settings
        const randomizedQuestions = this.randomizeQuestions(
          questions, 
          student.id, 
          assignment.test_paper.randomize_questions
        );

        const examQuestions = randomizedQuestions.map(q => {
          const baseOptions = q.question_text.mcq_options.map(opt => opt.option_text || '');
          const baseOptionIds = q.question_text.mcq_options.map(opt => opt.id);
          const baseOptionImages = q.question_text.mcq_options.map(opt => opt.image?.image_url || null);

          // Apply option randomization
          const { options, optionIds, optionImages } = this.randomizeOptions(
            baseOptions,
            baseOptionIds,
            baseOptionImages,
            student.id,
            q.question_id,
            assignment.test_paper.randomize_options
          );

          return {
            id: q.id,
            question_id: q.question_id,
            question_text_id: q.question_text_id,
            question_text: q.question_text.question_text,
            question_image: q.question_text.image?.image_url,
            options,
            option_ids: optionIds,
            option_images: optionImages,
            section_id: q.section_id,
            subsection_id: q.subsection_id,
            question_order: q.question_order,
            marks: q.marks,
            is_mandatory: q.is_mandatory
          };
        });

        return {
          assignment_id: assignment.id,
          test_paper_id: assignment.test_paper_id,
          title: assignment.test_paper.name,
          subject: assignment.test_paper.pattern.subject.name,
          standard: assignment.test_paper.pattern.standard.name,
          duration_minutes: assignment.time_limit_minutes || assignment.test_paper.duration_minutes || 60,
          total_marks: assignment.test_paper.pattern.total_marks,
          instructions: assignment.test_paper.instructions,
          negative_marking: assignment.test_paper.negative_marking,
          negative_marks_per_question: assignment.test_paper.negative_marks_per_question,
          randomize_questions: assignment.test_paper.randomize_questions,
          randomize_options: assignment.test_paper.randomize_options,
          questions: examQuestions,
          start_time: ongoingAttempt.started_at,
          attempt_number: ongoingAttempt.attempt_number,
          attemptId: ongoingAttempt.id
        };
      }

      // Check completed attempts only (not in_progress attempts)
      const completedAttempts = await this.prisma.test_Attempt.count({
        where: {
          student_id: student.id,
          test_assignment_id: assignment.id,
          status: 'completed'
        }
      });

      if (completedAttempts >= assignment.max_attempts) {
        throw new BadRequestException('Maximum attempts exceeded');
      }

      // Get total attempts (for attempt number)
      const totalAttempts = await this.prisma.test_Attempt.count({
        where: {
          student_id: student.id,
          test_assignment_id: assignment.id
        }
      });

      // Create new attempt
      const attempt = await this.prisma.test_Attempt.create({
        data: {
          student_id: student.id,
          test_assignment_id: assignment.id,
          attempt_number: totalAttempts + 1,
          status: 'in_progress'
        }
      });

      // Get questions for the exam
      const questions = await this.prisma.test_Paper_Question.findMany({
        where: { test_paper_id: assignment.test_paper_id },
        include: {
          question_text: {
            include: {
              image: true,
              mcq_options: {
                include: {
                  image: true
                },
                orderBy: { id: 'asc' }
              }
            }
          }
        },
        orderBy: { question_order: 'asc' }
      });

      // Apply randomization based on test paper settings
      const randomizedQuestions = this.randomizeQuestions(
        questions, 
        student.id, 
        assignment.test_paper.randomize_questions
      );

      const examQuestions = randomizedQuestions.map(q => {
        const baseOptions = q.question_text.mcq_options.map(opt => opt.option_text || '');
        const baseOptionIds = q.question_text.mcq_options.map(opt => opt.id);
        const baseOptionImages = q.question_text.mcq_options.map(opt => opt.image?.image_url || null);

        // Apply option randomization
        const { options, optionIds, optionImages } = this.randomizeOptions(
          baseOptions,
          baseOptionIds,
          baseOptionImages,
          student.id,
          q.question_id,
          assignment.test_paper.randomize_options
        );

        return {
          id: q.id,
          question_id: q.question_id,
          question_text_id: q.question_text_id,
          question_text: q.question_text.question_text,
          question_image: q.question_text.image?.image_url,
          options,
          option_ids: optionIds,
          option_images: optionImages,
          section_id: q.section_id,
          subsection_id: q.subsection_id,
          question_order: q.question_order,
          marks: q.marks,
          is_mandatory: q.is_mandatory
        };
      });

      // Update assignment status to active
      await this.prisma.test_Assignment.update({
        where: { id: assignment.id },
        data: { status: 'active' }
      });

      return {
        assignment_id: assignment.id,
        test_paper_id: assignment.test_paper_id,
        title: assignment.test_paper.name,
        subject: assignment.test_paper.pattern.subject.name,
        standard: assignment.test_paper.pattern.standard.name,
        duration_minutes: assignment.time_limit_minutes || assignment.test_paper.duration_minutes || 60,
        total_marks: assignment.test_paper.pattern.total_marks,
        instructions: assignment.test_paper.instructions,
        negative_marking: assignment.test_paper.negative_marking,
        negative_marks_per_question: assignment.test_paper.negative_marks_per_question,
        randomize_questions: assignment.test_paper.randomize_questions,
        randomize_options: assignment.test_paper.randomize_options,
        questions: examQuestions,
        start_time: attempt.started_at,
        attempt_number: attempt.attempt_number,
        attemptId: attempt.id
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to start exam');
    }
  }

  private calculateRemainingTime(startedAt: Date, durationMinutes: number): number {
    const now = new Date();
    const elapsedMs = now.getTime() - startedAt.getTime();
    const durationMs = durationMinutes * 60 * 1000;
    const remainingMs = Math.max(0, durationMs - elapsedMs);
    return Math.floor(remainingMs / 1000); // Return remaining seconds
  }

  async getExamAttemptStatus(userId: number, attemptId: number): Promise<TestAttemptStatusDto> {
    try {
      // Get student record
      const student = await this.prisma.student.findUnique({
        where: { user_id: userId }
      });

      if (!student) {
        throw new NotFoundException('Student record not found');
      }

      // Get attempt
      const attempt = await this.prisma.test_Attempt.findFirst({
        where: {
          id: attemptId,
          student_id: student.id
        },
        include: {
          test_assignment: {
            include: {
              test_paper: true
            }
          }
        }
      });

      if (!attempt) {
        throw new NotFoundException('Test attempt not found');
      }

      // Count answered questions
      const answeredCount = await this.prisma.student_Answer.count({
        where: {
          test_attempt_id: attemptId,
          selected_option_id: { not: null }
        }
      });

      // Get total questions
      const totalQuestions = await this.prisma.test_Paper_Question.count({
        where: { test_paper_id: attempt.test_assignment.test_paper_id }
      });

      // Calculate time remaining
      const durationMs = (attempt.test_assignment.time_limit_minutes || attempt.test_assignment.test_paper.duration_minutes || 60) * 60 * 1000;
      const elapsedMs = Date.now() - attempt.started_at.getTime();
      const timeRemainingSeconds = Math.max(0, Math.floor((durationMs - elapsedMs) / 1000));

      return {
        test_attempt_id: attempt.id,
        status: attempt.status,
        current_question: attempt.current_question,
        time_remaining_seconds: timeRemainingSeconds,
        questions_answered: answeredCount,
        total_questions: totalQuestions
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to get exam attempt status');
    }
  }

  async submitAnswer(userId: number, dto: SubmitAnswerDto): Promise<{ message: string }> {
    try {
      console.log('submitAnswer called with:', { userId, dto });
      
      // Get student record
      const student = await this.prisma.student.findUnique({
        where: { user_id: userId }
      });

      console.log('Student found:', student ? { id: student.id, student_id: student.student_id } : 'null');

      if (!student) {
        console.error('Student record not found for user_id:', userId);
        throw new NotFoundException('Student record not found');
      }

      // Verify attempt belongs to student and is in progress
      const attempt = await this.prisma.test_Attempt.findFirst({
        where: {
          id: dto.test_attempt_id,
          student_id: student.id,
          status: 'in_progress'
        }
      });

      console.log('Test attempt found:', attempt ? { id: attempt.id, status: attempt.status, student_id: attempt.student_id } : 'null');

      if (!attempt) {
        // Check if attempt exists but with different status
        const anyAttempt = await this.prisma.test_Attempt.findFirst({
          where: {
            id: dto.test_attempt_id,
            student_id: student.id
          }
        });
        
        if (anyAttempt) {
          console.error('Test attempt found but status is:', anyAttempt.status);
          throw new BadRequestException(`Test attempt is not in progress. Current status: ${anyAttempt.status}`);
        } else {
          console.error('No test attempt found for attempt_id:', dto.test_attempt_id, 'and student_id:', student.id);
          throw new NotFoundException('Active test attempt not found');
        }
      }

      console.log('Attempting to upsert answer...');

      // Upsert the answer
      await this.prisma.student_Answer.upsert({
        where: {
          test_attempt_id_question_id: {
            test_attempt_id: dto.test_attempt_id,
            question_id: dto.question_id
          }
        },
        update: {
          selected_option_id: dto.selected_option_id,
          time_spent_seconds: dto.time_spent_seconds,
          is_flagged: dto.is_flagged || false,
          answered_at: new Date()
        },
        create: {
          test_attempt_id: dto.test_attempt_id,
          question_id: dto.question_id,
          question_text_id: dto.question_text_id,
          selected_option_id: dto.selected_option_id,
          time_spent_seconds: dto.time_spent_seconds,
          is_flagged: dto.is_flagged || false
        }
      });

      console.log('Answer upserted successfully');
      return { message: 'Answer submitted successfully' };
    } catch (error) {
      console.error('Error in submitAnswer:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to submit answer');
    }
  }

  async submitExam(userId: number, dto: SubmitExamDto): Promise<SubmitExamResponseDto> {
    try {
      console.log('=== SUBMIT EXAM DEBUG ===');
      console.log('userId:', userId);
      console.log('dto:', dto);

      // Find student
      const student = await this.prisma.student.findUnique({
        where: { user_id: userId }
      });

      if (!student) {
        throw new NotFoundException('Student record not found');
      }

      // Verify attempt exists and is in progress
      const attempt = await this.prisma.test_Attempt.findFirst({
        where: {
          id: dto.test_attempt_id,
          student_id: student.id,
          status: 'in_progress'
        },
        include: {
          test_assignment: true
        }
      });

      if (!attempt) {
        throw new NotFoundException('Active test attempt not found');
      }

      // Simply mark the exam as completed
      const submittedAt = new Date();
      const timeTakenSeconds = Math.floor((submittedAt.getTime() - attempt.started_at.getTime()) / 1000);

      await this.prisma.test_Attempt.update({
        where: { id: dto.test_attempt_id },
        data: {
          status: 'completed',
          submitted_at: submittedAt,
          time_taken_seconds: timeTakenSeconds
        }
      });

      // Update assignment status to completed
      await this.prisma.test_Assignment.update({
        where: { id: attempt.test_assignment_id },
        data: { status: 'completed' }
      });

      console.log('Exam submitted successfully');

      return {
        message: 'Exam submitted successfully',
        test_attempt_id: dto.test_attempt_id,
        submitted_at: submittedAt
      };

    } catch (error) {
      console.error('Error in submitExam:', error);
      throw error;
    }
  }

  async getExamResult(userId: number, attemptId: number): Promise<ExamResultDto> {
    try {
      // Get student record
      const student = await this.prisma.student.findUnique({
        where: { user_id: userId }
      });

      if (!student) {
        throw new NotFoundException('Student record not found');
      }

      // Get the test attempt
      const attempt = await this.prisma.test_Attempt.findFirst({
        where: {
          id: attemptId,
          student_id: student.id,
          status: 'completed'
        },
        include: {
          test_assignment: {
            include: {
              test_paper: {
                include: {
                  pattern: {
                    include: {
                      subject: true,
                      standard: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!attempt) {
        throw new NotFoundException('Completed test attempt not found');
      }

      // Check if result already exists
      let existingResult = await this.prisma.student_Result.findFirst({
        where: {
          test_attempt_id: attemptId,
          student_id: student.id
        }
      });

      // If result exists, return it
      if (existingResult) {
        return {
          id: existingResult.id,
          test_attempt_id: existingResult.test_attempt_id,
          title: attempt.test_assignment.test_paper.name,
          subject: attempt.test_assignment.test_paper.pattern.subject.name,
          total_questions: existingResult.total_questions,
          attempted_questions: existingResult.attempted_questions,
          correct_answers: existingResult.correct_answers,
          wrong_answers: existingResult.wrong_answers,
          skipped_questions: existingResult.skipped_questions,
          total_marks: existingResult.total_marks,
          obtained_marks: existingResult.obtained_marks,
          percentage: existingResult.percentage,
          grade: existingResult.grade,
          rank_in_standard: existingResult.rank_in_standard,
          time_taken_seconds: existingResult.time_taken_seconds,
          performance_level: existingResult.performance_level,
          chapter_wise_analysis: existingResult.chapter_wise_analysis,
          strengths: existingResult.strengths as string[],
          weaknesses: existingResult.weaknesses as string[],
          recommendations: existingResult.recommendations as string[],
          submitted_at: attempt.submitted_at || existingResult.created_at
        };
      }

      // Calculate results on-demand
      const questions = await this.prisma.test_Paper_Question.findMany({
        where: { test_paper_id: attempt.test_assignment.test_paper_id },
        include: {
          question_text: {
            include: {
              mcq_options: true
            }
          }
        }
      });

      const answers = await this.prisma.student_Answer.findMany({
        where: { test_attempt_id: attemptId },
        include: {
          question_text: {
            include: {
              mcq_options: true
            }
          }
        }
      });

      let correctAnswers = 0;
      let wrongAnswers = 0;
      let obtainedMarks = 0;

      // Calculate scores
      for (const answer of answers) {
        if (answer.selected_option_id !== null && answer.selected_option_id !== undefined) {
          const correctOption = answer.question_text.mcq_options.find(opt => opt.is_correct);
          const selectedOption = answer.question_text.mcq_options.find(opt => opt.id === answer.selected_option_id);
          
          if (correctOption && selectedOption && selectedOption.is_correct) {
            correctAnswers++;
            const questionData = questions.find(q => q.question_id === answer.question_id);
            const marks = questionData?.marks || 0;
            obtainedMarks += marks;
            
            // Update answer with correct status
            await this.prisma.student_Answer.update({
              where: { id: answer.id },
              data: {
                is_correct: true,
                marks_obtained: marks
              }
            });
          } else {
            wrongAnswers++;
            let deduction = 0;
            if (attempt.test_assignment.test_paper.negative_marking) {
              deduction = attempt.test_assignment.test_paper.negative_marks_per_question || 0;
              obtainedMarks -= deduction;
            }
            
            // Update answer with incorrect status
            await this.prisma.student_Answer.update({
              where: { id: answer.id },
              data: {
                is_correct: false,
                marks_obtained: -deduction
              }
            });
          }
        }
      }

      const totalQuestions = questions.length;
      const attemptedQuestions = answers.filter(a => a.selected_option_id !== null).length;
      const skippedQuestions = totalQuestions - attemptedQuestions;
      const totalMarks = attempt.test_assignment.test_paper.pattern.total_marks;
      const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;

      // Determine performance level
      let performanceLevel = 'poor';
      if (percentage >= 90) performanceLevel = 'excellent';
      else if (percentage >= 75) performanceLevel = 'good';
      else if (percentage >= 60) performanceLevel = 'average';

      // Create result record for future use
      const result = await this.prisma.student_Result.create({
        data: {
          student_id: student.id,
          test_attempt_id: attemptId,
          total_questions: totalQuestions,
          attempted_questions: attemptedQuestions,
          correct_answers: correctAnswers,
          wrong_answers: wrongAnswers,
          skipped_questions: skippedQuestions,
          total_marks: totalMarks,
          obtained_marks: obtainedMarks,
          percentage: percentage,
          time_taken_seconds: attempt.time_taken_seconds || 0,
          performance_level: performanceLevel
        }
      });

      return {
        id: result.id,
        test_attempt_id: attemptId,
        title: attempt.test_assignment.test_paper.name,
        subject: attempt.test_assignment.test_paper.pattern.subject.name,
        total_questions: totalQuestions,
        attempted_questions: attemptedQuestions,
        correct_answers: correctAnswers,
        wrong_answers: wrongAnswers,
        skipped_questions: skippedQuestions,
        total_marks: totalMarks,
        obtained_marks: obtainedMarks,
        percentage: percentage,
        grade: result.grade,
        rank_in_standard: result.rank_in_standard,
        time_taken_seconds: attempt.time_taken_seconds || 0,
        performance_level: performanceLevel,
        chapter_wise_analysis: result.chapter_wise_analysis,
        strengths: result.strengths as string[],
        weaknesses: result.weaknesses as string[],
        recommendations: result.recommendations as string[],
        submitted_at: attempt.submitted_at || result.created_at
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to get exam result');
    }
  }

  async getDetailedReport(userId: number, attemptId: number): Promise<DetailedReportDto> {
    try {
      // Get student record
      const student = await this.prisma.student.findUnique({
        where: { user_id: userId }
      });

      if (!student) {
        throw new NotFoundException('Student record not found');
      }

      // Get result
      const result = await this.getExamResult(userId, attemptId);

      // Get detailed answers
      const answers = await this.prisma.student_Answer.findMany({
        where: {
          test_attempt_id: attemptId,
          test_attempt: {
            student_id: student.id
          }
        },
        include: {
          question_text: {
            include: {
              image: true,
              mcq_options: {
                include: {
                  image: true
                },
                orderBy: { id: 'asc' }
              }
            }
          }
        },
        orderBy: { question_id: 'asc' }
      });

      const detailedQuestions = answers.map(answer => {
        const correctOptionIndex = answer.question_text.mcq_options.findIndex(opt => opt.is_correct);
        const selectedOptionIndex = answer.selected_option_id ? 
          answer.question_text.mcq_options.findIndex(opt => opt.id === answer.selected_option_id) : 
          -1;
        
        return {
          question_id: answer.question_id,
          question_text: answer.question_text.question_text,
          question_image: answer.question_text.image?.image_url,
          options: answer.question_text.mcq_options.map(opt => opt.option_text || ''),
          option_images: answer.question_text.mcq_options.map(opt => opt.image?.image_url || null),
          option_ids: answer.question_text.mcq_options.map(opt => opt.id),
          correct_option: correctOptionIndex,
          selected_option: answer.selected_option_id,
          selected_option_index: selectedOptionIndex,
          is_correct: answer.is_correct,
          marks_obtained: answer.marks_obtained || 0,
          time_spent_seconds: answer.time_spent_seconds,
          is_flagged: answer.is_flagged
        };
      });

      return {
        result,
        questions: detailedQuestions
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to get detailed report');
    }
  }

  async getTestPaperResults(teacherId: number, testPaperId: number): Promise<TestPaperResultsResponseDto> {
    try {
      // Verify test paper exists and belongs to teacher
      const testPaper = await this.prisma.test_Paper.findUnique({
        where: { id: testPaperId },
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
        throw new NotFoundException(`Test paper with ID ${testPaperId} not found`);
      }

      if (testPaper.user_id !== teacherId) {
        throw new BadRequestException('You can only view results for your own test papers');
      }

      // Get all assignments for this test paper
      const assignments = await this.prisma.test_Assignment.findMany({
        where: { 
          test_paper_id: testPaperId,
          assigned_by_user_id: teacherId
        },
        include: {
          student: {
            include: {
              user: true
            }
          },
          test_attempts: {
            include: {
              student_result: true
            },
            orderBy: { attempt_number: 'desc' },
            take: 1 // Get latest attempt
          }
        }
      });

      const results: TestPaperResultDto[] = [];
      const completedResults: Array<{ marks: number; time: number; percentage: number }> = [];

      // Process each assignment
      for (const assignment of assignments) {
        const latestAttempt = assignment.test_attempts[0];
        
        if (latestAttempt && latestAttempt.status === 'completed' && latestAttempt.student_result) {
          const result = latestAttempt.student_result;
          completedResults.push({
            marks: result.obtained_marks,
            time: result.time_taken_seconds,
            percentage: result.percentage
          });

          results.push({
            rank: 0, // Will be calculated later
            student_name: assignment.student.user.name,
            roll_number: assignment.student.student_id,
            marks_obtained: result.obtained_marks,
            total_marks: result.total_marks,
            time_taken_seconds: result.time_taken_seconds,
            percentage: result.percentage,
            status: 'completed',
            submitted_at: latestAttempt.submitted_at,
            student_id: assignment.student.id,
            test_attempt_id: latestAttempt.id
          });
        } else {
          // Student hasn't completed the test
          results.push({
            rank: 0,
            student_name: assignment.student.user.name,
            roll_number: assignment.student.student_id,
            marks_obtained: 0,
            total_marks: testPaper.pattern.total_marks,
            time_taken_seconds: 0,
            percentage: 0,
            status: 'pending',
            student_id: assignment.student.id
          });
        }
      }

      // Sort results: pending students first (rank 0), then completed students by marks (desc) and time (asc)
      results.sort((a, b) => {
        if (a.status === 'pending' && b.status === 'completed') return -1;
        if (a.status === 'completed' && b.status === 'pending') return 1;
        if (a.status === 'pending' && b.status === 'pending') return 0;
        
        // Both completed - sort by marks (desc), then by time (asc)
        if (a.marks_obtained !== b.marks_obtained) {
          return b.marks_obtained - a.marks_obtained;
        }
        return a.time_taken_seconds - b.time_taken_seconds;
      });

      // Assign ranks
      let currentRank = 1;
      for (let i = 0; i < results.length; i++) {
        if (results[i].status === 'pending') {
          results[i].rank = 0;
        } else {
          if (i > 0 && results[i].status === 'completed' && results[i-1].status === 'completed') {
            // If marks and time are same as previous, keep same rank
            if (results[i].marks_obtained === results[i-1].marks_obtained && 
                results[i].time_taken_seconds === results[i-1].time_taken_seconds) {
              results[i].rank = results[i-1].rank;
            } else {
              results[i].rank = currentRank;
            }
          } else {
            results[i].rank = currentRank;
          }
          currentRank++;
        }
      }

      // Calculate statistics
      const totalStudents = assignments.length;
      const completedStudents = completedResults.length;
      const pendingStudents = totalStudents - completedStudents;
      
      let highestScore = 0;
      let averageScore = 0;
      let lowestScore = 0;
      let passRate = 0;

      if (completedResults.length > 0) {
        // Use marks for highest/lowest/average (not percentage)
        const marks = completedResults.map(r => r.marks);
        const percentages = completedResults.map(r => r.percentage);
        
        highestScore = Math.max(...marks);
        lowestScore = Math.min(...marks);
        averageScore = marks.reduce((sum, mark) => sum + mark, 0) / marks.length;
        
        // Pass rate based on percentage >= 40%
        const passedStudents = percentages.filter(percentage => percentage >= 40).length;
        passRate = (passedStudents / completedStudents) * 100;
      }

      return {
        test_paper_id: testPaperId,
        test_paper_name: testPaper.name,
        subject: testPaper.pattern.subject.name,
        standard: testPaper.pattern.standard.name,
        total_marks: testPaper.pattern.total_marks,
        duration_minutes: testPaper.duration_minutes || 0,
        total_students: totalStudents,
        completed_students: completedStudents,
        pending_students: pendingStudents,
        highest_score: Math.round(highestScore * 100) / 100,
        average_score: Math.round(averageScore * 100) / 100,
        lowest_score: Math.round(lowestScore * 100) / 100,
        pass_rate: Math.round(passRate * 100) / 100,
        results: results
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to get test paper results');
    }
  }
} 