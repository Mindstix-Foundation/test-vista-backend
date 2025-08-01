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
        let testAttemptId: number | undefined;
        
        const currentAttempt = assignment.test_attempts.find(attempt => attempt.status === 'in_progress');
        const completedAttempt = assignment.test_attempts.find(attempt => attempt.status === 'completed');
        const totalQuestions = assignment.test_paper.test_paper_questions.length;
        
        // If test is completed, get the attempt ID for viewing results
        if (status === 'completed' && completedAttempt) {
          testAttemptId = completedAttempt.id;
        }
        
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
          assignedBy: assignment.assigned_by.name,
          test_attempt_id: testAttemptId
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
          timeRemaining: this.calculateRemainingTime(ongoingAttempt.started_at, assignment.time_limit_minutes || assignment.test_paper.duration_minutes || 60),
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
        timeRemaining: this.calculateRemainingTime(attempt.started_at, assignment.time_limit_minutes || assignment.test_paper.duration_minutes || 60),
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
        },
        include: {
          test_assignment: {
            include: {
              test_paper: {
                select: {
                  negative_marking: true,
                  negative_marks_per_question: true
                }
              }
            }
          }
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

      // Get question data to calculate marks
      let isCorrect = null;
      let marksObtained = 0;

      if (dto.selected_option_id !== null && dto.selected_option_id !== undefined) {
        // Get the question details to check correctness and marks
        const questionData = await this.prisma.test_Paper_Question.findFirst({
          where: {
            test_paper_id: attempt.test_assignment.test_paper_id,
            question_id: dto.question_id,
            question_text_id: dto.question_text_id
          },
          include: {
            question_text: {
              include: {
                mcq_options: true
              }
            }
          }
        });

        if (questionData) {
          // Check if the selected option is correct
          const correctOption = questionData.question_text.mcq_options.find(opt => opt.is_correct);
          const selectedOption = questionData.question_text.mcq_options.find(opt => opt.id === dto.selected_option_id);
          
          if (correctOption && selectedOption && selectedOption.is_correct) {
            isCorrect = true;
            marksObtained = questionData.marks;
            console.log(`Question ${dto.question_id}: Correct answer, marks awarded: ${marksObtained}`);
          } else {
            isCorrect = false;
            // Apply negative marking if enabled
            if (attempt.test_assignment.test_paper.negative_marking) {
              const deduction = attempt.test_assignment.test_paper.negative_marks_per_question || 0;
              marksObtained = -deduction;
            } else {
              marksObtained = 0;
            }
            console.log(`Question ${dto.question_id}: Wrong answer, marks: ${marksObtained}`);
          }
        }
      }

      console.log('Attempting to upsert answer...');

      // Upsert the answer with calculated marks
      await this.prisma.student_Answer.upsert({
        where: {
          test_attempt_id_question_id: {
            test_attempt_id: dto.test_attempt_id,
            question_id: dto.question_id
          }
        },
        update: {
          selected_option_id: dto.selected_option_id,
          is_correct: isCorrect,
          marks_obtained: marksObtained,
          time_spent_seconds: dto.time_spent_seconds,
          is_flagged: dto.is_flagged || false,
          answered_at: new Date()
        },
        create: {
          test_attempt_id: dto.test_attempt_id,
          question_id: dto.question_id,
          question_text_id: dto.question_text_id,
          selected_option_id: dto.selected_option_id,
          is_correct: isCorrect,
          marks_obtained: marksObtained,
          time_spent_seconds: dto.time_spent_seconds,
          is_flagged: dto.is_flagged || false
        }
      });

      console.log('Answer upserted successfully with marks:', marksObtained);
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
        // Format percentage to 2 decimal places
        const formattedPercentage = Math.round(existingResult.percentage * 100) / 100;
        
        // Check if chapter-wise analysis needs sequenceNumber (for backward compatibility)
        let chapterWiseAnalysis = existingResult.chapter_wise_analysis;
        if (Array.isArray(chapterWiseAnalysis) && chapterWiseAnalysis.length > 0) {
          // Check if sequenceNumber is missing from the first chapter
          const firstChapter = chapterWiseAnalysis[0] as any;
          if (firstChapter && typeof firstChapter.sequenceNumber === 'undefined') {
            // Recalculate chapter-wise analysis to include sequenceNumber
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

            chapterWiseAnalysis = await this.calculateChapterWiseAnalysis(attemptId, answers, questions);
            
            // Update the existing result with the new chapter-wise analysis
            await this.prisma.student_Result.update({
              where: { id: existingResult.id },
              data: { chapter_wise_analysis: chapterWiseAnalysis }
            });
          }
        }

        // Always recalculate recommendations using the latest logic
        const { strengths, weaknesses, recommendations } = this.calculateStrengthsAndWeaknesses(chapterWiseAnalysis);
        
        // Update the existing result with new recommendations
        await this.prisma.student_Result.update({
          where: { id: existingResult.id },
          data: { 
            strengths: strengths,
            weaknesses: weaknesses,
            recommendations: recommendations
          }
        });

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
          percentage: formattedPercentage,
          grade: existingResult.grade,
          rank_in_standard: existingResult.rank_in_standard,
          time_taken_seconds: existingResult.time_taken_seconds,
          performance_level: existingResult.performance_level,
          chapter_wise_analysis: chapterWiseAnalysis,
          strengths: strengths,
          weaknesses: weaknesses,
          recommendations: recommendations,
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

      // Calculate scores using pre-calculated marks from Student_Answer table
      for (const answer of answers) {
        if (answer.selected_option_id !== null && answer.selected_option_id !== undefined) {
          // Use the pre-calculated values from submitAnswer
          if (answer.is_correct === true) {
            correctAnswers++;
          } else if (answer.is_correct === false) {
            wrongAnswers++;
          }
          
          // Add the marks obtained (could be positive for correct, negative for wrong with negative marking, or 0)
          obtainedMarks += answer.marks_obtained || 0;
        }
      }

      const totalQuestions = questions.length;
      const attemptedQuestions = answers.filter(a => a.selected_option_id !== null).length;
      const skippedQuestions = totalQuestions - attemptedQuestions;
      const totalMarks = attempt.test_assignment.test_paper.pattern.total_marks;
      const percentage = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 100 * 100) / 100 : 0;

      // Determine performance level
      let performanceLevel = 'poor';
      if (percentage >= 70) performanceLevel = 'excellent';
      else if (percentage >= 50) performanceLevel = 'good';
      else if (percentage >= 30) performanceLevel = 'average';

      // Calculate chapter-wise analysis
      const chapterWiseAnalysis = await this.calculateChapterWiseAnalysis(attemptId, answers, questions);
      
      // Calculate strengths and weaknesses based on chapter performance
      const { strengths, weaknesses, recommendations } = this.calculateStrengthsAndWeaknesses(chapterWiseAnalysis);

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
          performance_level: performanceLevel,
          chapter_wise_analysis: chapterWiseAnalysis,
          strengths: strengths,
          weaknesses: weaknesses,
          recommendations: recommendations
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

      // Get the test attempt to find the test paper ID
      const testAttempt = await this.prisma.test_Attempt.findFirst({
        where: {
          id: attemptId,
          student_id: student.id
        },
        include: {
          test_assignment: {
            select: {
              test_paper_id: true
            }
          }
        }
      });

      if (!testAttempt) {
        throw new NotFoundException('Test attempt not found');
      }

      // Get all questions from the test paper
      const testPaperQuestions = await this.prisma.test_Paper_Question.findMany({
        where: {
          test_paper_id: testAttempt.test_assignment.test_paper_id
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
        orderBy: { question_order: 'asc' }
      });

      // Get student answers
      const answers = await this.prisma.student_Answer.findMany({
        where: {
          test_attempt_id: attemptId,
          test_attempt: {
            student_id: student.id
          }
        }
      });

      // Create a map of answers by question_id for quick lookup
      const answerMap = new Map();
      answers.forEach(answer => {
        answerMap.set(answer.question_id, answer);
      });

      const detailedQuestions = testPaperQuestions.map(tpq => {
        const answer = answerMap.get(tpq.question_id);
        const correctOptionIndex = tpq.question_text.mcq_options.findIndex(opt => opt.is_correct);
        
        if (answer) {
          // Question was attempted
          const selectedOptionIndex = answer.selected_option_id ? 
            tpq.question_text.mcq_options.findIndex(opt => opt.id === answer.selected_option_id) : 
            -1;
          
          return {
            question_id: tpq.question_id,
            question_text: tpq.question_text.question_text,
            question_image: tpq.question_text.image?.image_url,
            options: tpq.question_text.mcq_options.map(opt => opt.option_text || ''),
            option_images: tpq.question_text.mcq_options.map(opt => opt.image?.image_url || null),
            option_ids: tpq.question_text.mcq_options.map(opt => opt.id),
            correct_option: correctOptionIndex,
            selected_option: answer.selected_option_id,
            selected_option_index: selectedOptionIndex,
            is_correct: answer.is_correct,
            marks_obtained: answer.marks_obtained || 0,
            time_spent_seconds: answer.time_spent_seconds,
            is_flagged: answer.is_flagged
          };
        } else {
          // Question was not attempted
          return {
            question_id: tpq.question_id,
            question_text: tpq.question_text.question_text,
            question_image: tpq.question_text.image?.image_url,
            options: tpq.question_text.mcq_options.map(opt => opt.option_text || ''),
            option_images: tpq.question_text.mcq_options.map(opt => opt.image?.image_url || null),
            option_ids: tpq.question_text.mcq_options.map(opt => opt.id),
            correct_option: correctOptionIndex,
            selected_option: null,
            selected_option_index: -1,
            is_correct: null,
            marks_obtained: 0,
            time_spent_seconds: 0,
            is_flagged: false
          };
        }
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

  // Helper method to calculate chapter-wise analysis
  private async calculateChapterWiseAnalysis(attemptId: number, answers: any[], questions: any[]): Promise<any> {
    try {
      // Get the test attempt to find the test paper ID
      const testAttempt = await this.prisma.test_Attempt.findUnique({
        where: { id: attemptId },
        include: {
          test_assignment: {
            select: {
              test_paper_id: true
            }
          }
        }
      });

      if (!testAttempt) {
        return {};
      }

      // Get chapter information for each question through the question_topics relationship
      const questionsWithChapters = await this.prisma.test_Paper_Question.findMany({
        where: { 
          test_paper_id: testAttempt.test_assignment.test_paper_id
        },
        include: {
          question: {
            include: {
              question_topics: {
                include: {
                  topic: {
                    include: {
                      chapter: {
                        select: {
                          id: true,
                          name: true,
                          sequential_chapter_number: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      // Create a map of question to chapter
      const questionToChapterMap = new Map();
      const chapterSequenceMap = new Map(); // Map to store chapter sequence numbers
      questionsWithChapters.forEach(q => {
        // Get the first topic's chapter (most questions belong to one chapter)
        const firstTopic = q.question.question_topics[0];
        if (firstTopic && firstTopic.topic && firstTopic.topic.chapter) {
          const chapter = firstTopic.topic.chapter;
          questionToChapterMap.set(q.question_id, chapter);
          chapterSequenceMap.set(chapter.name, chapter.sequential_chapter_number);
        }
      });

      // Debug logging for development
      if (process.env.NODE_ENV === 'development') {
        console.log('=== Chapter-wise Analysis Debug ===');
        console.log('Total questions in test paper:', questions.length);
        console.log('Questions with chapter mapping:', questionToChapterMap.size);
        console.log('Chapter mapping debug:', Array.from(questionToChapterMap.entries()).map(([qId, chapter]) => ({
          questionId: qId,
          chapterName: chapter.name,
          chapterId: chapter.id,
          sequenceNumber: chapter.sequential_chapter_number
        })));

        console.log('Chapter sequence map:', Array.from(chapterSequenceMap.entries()).map(([name, seq]) => ({
          chapterName: name,
          sequenceNumber: seq
        })));

        // If no chapters found, let's debug the structure
        if (questionToChapterMap.size === 0) {
          console.log('No chapters found! Debugging question structure:');
          questionsWithChapters.forEach((q, index) => {
            console.log(`Question ${index + 1}:`, {
              questionId: q.question_id,
              questionTopicsCount: q.question.question_topics.length,
              firstTopicDetails: q.question.question_topics[0] ? {
                topicId: q.question.question_topics[0].topic_id,
                topicName: q.question.question_topics[0].topic?.name,
                chapterDetails: q.question.question_topics[0].topic?.chapter
              } : 'No topics'
            });
          });
        }
      }

      // Initialize chapter stats with all questions in each chapter
      const chapterStats = new Map();
      
      // First, count all questions in each chapter (from the test paper)
      questions.forEach(question => {
        const chapter = questionToChapterMap.get(question.question_id);
        if (!chapter) {
          console.warn(`Question ${question.question_id} has no chapter mapping, skipping from chapter-wise analysis`);
          return;
        }
        
        const chapterName = chapter.name;
        if (!chapterStats.has(chapterName)) {
          chapterStats.set(chapterName, {
            total: 0,
            correct: 0,
            wrong: 0,
            skipped: 0,
            totalMarks: 0,
            obtainedMarks: 0
          });
        }
        
        const stats = chapterStats.get(chapterName);
        stats.total++; // Count all questions in this chapter
        stats.totalMarks += question.marks || 0; // Add total marks for this question
      });

      // Debug logging for development
      if (process.env.NODE_ENV === 'development') {
        console.log('Processing answers. Total answers:', answers.length);
        console.log('Question to chapter mapping size:', questionToChapterMap.size);
        console.log('Chapter stats after counting all questions:', Array.from(chapterStats.entries()).map(([name, stats]) => ({
          chapterName: name,
          total: stats.total,
          totalMarks: stats.totalMarks
        })));
        console.log('Sample answers:', answers.slice(0, 3).map(a => ({
          questionId: a.question_id,
          selectedOptionId: a.selected_option_id,
          isCorrect: a.is_correct,
          marksObtained: a.marks_obtained
        })));
      }
      
      // Now process student answers to update correct/wrong/skipped counts
      // Create a map of all questions for faster lookup
      const questionMap = new Map();
      questions.forEach(q => questionMap.set(q.question_id, q));
      
      // For questions that have no student answer, they are considered skipped
      questions.forEach(question => {
        const chapter = questionToChapterMap.get(question.question_id);
        if (!chapter) return;
        
        const chapterName = chapter.name;
        const stats = chapterStats.get(chapterName);
        if (!stats) return;
        
        // Check if student answered this question
        const studentAnswer = answers.find(a => a.question_id === question.question_id);
        
        if (!studentAnswer || studentAnswer.selected_option_id === null || studentAnswer.selected_option_id === undefined) {
          // Question was skipped
          stats.skipped++;
          if (process.env.NODE_ENV === 'development') {
            console.log(`Question ${question.question_id} in chapter ${chapterName}: SKIPPED`);
          }
        } else {
          // Question was attempted - use the pre-calculated values from submitAnswer
          if (studentAnswer.is_correct === true) {
            stats.correct++;
            if (process.env.NODE_ENV === 'development') {
              console.log(`Question ${question.question_id} in chapter ${chapterName}: CORRECT, marks: ${studentAnswer.marks_obtained}`);
            }
          } else if (studentAnswer.is_correct === false) {
            stats.wrong++;
            if (process.env.NODE_ENV === 'development') {
              console.log(`Question ${question.question_id} in chapter ${chapterName}: WRONG, marks: ${studentAnswer.marks_obtained}`);
            }
          }
          
          // Add the marks obtained (pre-calculated in submitAnswer)
          stats.obtainedMarks += studentAnswer.marks_obtained || 0;
        }
      });

      // Debug logging for development
      if (process.env.NODE_ENV === 'development') {
        console.log('Final chapter stats:', Array.from(chapterStats.entries()).map(([name, stats]) => ({
          chapterName: name,
          total: stats.total,
          correct: stats.correct,
          wrong: stats.wrong,
          skipped: stats.skipped,
          totalMarks: stats.totalMarks,
          obtainedMarks: stats.obtainedMarks
        })));
      }

      // Convert to final format with performance levels and sort by sequence
      const chapterEntries = Array.from(chapterStats.entries()).map(([chapterName, stats]) => {
        // Calculate percentage as correct answers out of total questions in chapter
        const percentage = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
        let performanceLevel = 'poor';
        if (percentage >= 70) performanceLevel = 'excellent';
        else if (percentage >= 50) performanceLevel = 'good';
        else if (percentage >= 30) performanceLevel = 'average';
        
        return {
          chapterName,
          sequenceNumber: chapterSequenceMap.get(chapterName) || 999, // Default to 999 if not found
          stats: {
            total: stats.total,
            correct: stats.correct,
            wrong: stats.wrong,
            skipped: stats.skipped,
            percentage: Math.round(percentage * 100) / 100,
            totalMarks: stats.totalMarks,
            obtainedMarks: stats.obtainedMarks,
            performanceLevel: performanceLevel
          }
        };
      });

      // Debug logging for development
      if (process.env.NODE_ENV === 'development') {
        console.log('Chapter entries before sorting:', chapterEntries.map(e => ({
          name: e.chapterName,
          sequenceNumber: e.sequenceNumber,
          total: e.stats.total,
          correct: e.stats.correct,
          percentage: e.stats.percentage
        })));
      }

      // Sort by sequence number
      chapterEntries.sort((a, b) => a.sequenceNumber - b.sequenceNumber);

      // Debug logging for development
      if (process.env.NODE_ENV === 'development') {
        console.log('Chapter entries after sorting:', chapterEntries.map(e => ({
          name: e.chapterName,
          sequenceNumber: e.sequenceNumber,
          total: e.stats.total,
          correct: e.stats.correct,
          percentage: e.stats.percentage
        })));
        
        // Verify total questions match
        const totalQuestionsInChapters = chapterEntries.reduce((sum, e) => sum + e.stats.total, 0);
        console.log(`Total questions in chapters: ${totalQuestionsInChapters}, Expected: ${questions.length}`);
        console.log('=== End Chapter-wise Analysis Debug ===');
      }

      // Return as array to preserve order
      const chapterWiseAnalysis = chapterEntries.map(entry => ({
        chapterName: entry.chapterName,
        sequenceNumber: entry.sequenceNumber,
        ...entry.stats
      }));

      if (process.env.NODE_ENV === 'development') {
        console.log('Final chapter-wise analysis:', chapterWiseAnalysis);
      }
      return chapterWiseAnalysis;
    } catch (error) {
      console.error('Error calculating chapter-wise analysis:', error);
      return {};
    }
  }

  // Helper method to calculate strengths and weaknesses
  private calculateStrengthsAndWeaknesses(chapterWiseAnalysis: any): { strengths: string[], weaknesses: string[], recommendations: string[] } {
    const strengths = [];
    const weaknesses = [];
    const averageChapters = [];
    const recommendations = [];

    if (Array.isArray(chapterWiseAnalysis)) {
      chapterWiseAnalysis.forEach((chapter: any) => {
        if (chapter.performanceLevel === 'excellent' || chapter.performanceLevel === 'good') {
          strengths.push(chapter.chapterName);
        } else if (chapter.performanceLevel === 'poor') {
          weaknesses.push(chapter.chapterName);
        } else if (chapter.performanceLevel === 'average') {
          averageChapters.push(chapter.chapterName);
        }
      });
    } else {
      // Fallback for object format (backwards compatibility)
      Object.entries(chapterWiseAnalysis).forEach(([chapterName, stats]: [string, any]) => {
        if (stats.performanceLevel === 'excellent' || stats.performanceLevel === 'good') {
          strengths.push(chapterName);
        } else if (stats.performanceLevel === 'poor') {
          weaknesses.push(chapterName);
        } else if (stats.performanceLevel === 'average') {
          averageChapters.push(chapterName);
        }
      });
    }

    // Create specific and educational recommendations
    if (weaknesses.length > 0) {
      recommendations.push(`🔴 Critical Focus Areas: ${weaknesses.join(', ')} - These topics require immediate attention. Consider reviewing fundamentals, practicing more problems, and seeking additional help from teachers or study materials.`);
    }
    
    if (averageChapters.length > 0) {
      recommendations.push(`🟡 Areas for Enhancement: ${averageChapters.join(', ')} - You have a basic understanding but need to strengthen your concepts. Focus on solving varied problem types and clarifying doubts to achieve mastery.`);
    }
    
    if (strengths.length > 0) {
      recommendations.push(`🟢 Strong Performance: ${strengths.join(', ')} - Excellent work! Continue regular practice and try advanced problems to maintain and further improve your expertise in these areas.`);
    }

    return { strengths, weaknesses, recommendations };
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
      const completedStudentResults: any[] = [];

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

          // Store completed student results for chapter-wise analysis
          if (result.chapter_wise_analysis) {
            completedStudentResults.push(result.chapter_wise_analysis);
          }

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
        const passedStudents = percentages.filter(perc => perc >= 40).length;
        passRate = (passedStudents / completedStudents) * 100;
      }

      // Calculate aggregated chapter-wise analysis
      const chapterWiseAnalysis = this.calculateAggregatedChapterWiseAnalysis(completedStudentResults);

      // Calculate class strengths, weaknesses, and recommendations
      const {
        classStrengths,
        classWeaknesses,
        classAverageAreas,
        classRecommendations
      } = this.calculateClassStrengthsAndWeaknesses(chapterWiseAnalysis);

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
        chapter_wise_analysis: chapterWiseAnalysis,
        class_strengths: classStrengths,
        class_weaknesses: classWeaknesses,
        class_average_areas: classAverageAreas,
        class_recommendations: classRecommendations,
        results: results
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to get test paper results');
    }
  }

  // Helper method to calculate aggregated chapter-wise analysis
  private calculateAggregatedChapterWiseAnalysis(completedStudentResults: any[]): any[] {
    if (!completedStudentResults || completedStudentResults.length === 0) {
      return [];
    }

    try {
      // Map to store aggregated chapter data
      const chapterAggregation = new Map<string, {
        totalStudents: number;
        totalQuestions: number;
        totalCorrect: number;
        totalWrong: number;
        totalSkipped: number;
        totalMarks: number;
        totalObtainedMarks: number;
        sequenceNumber?: number;
      }>();

      // Process each student's chapter-wise analysis
      for (const studentChapterAnalysis of completedStudentResults) {
        if (!Array.isArray(studentChapterAnalysis)) {
          continue;
        }

        for (const chapterData of studentChapterAnalysis) {
          const chapterName = chapterData.chapterName;
          
          if (!chapterAggregation.has(chapterName)) {
            chapterAggregation.set(chapterName, {
              totalStudents: 0,
              totalQuestions: 0,
              totalCorrect: 0,
              totalWrong: 0,
              totalSkipped: 0,
              totalMarks: 0,
              totalObtainedMarks: 0
            });
          }

          const aggregatedData = chapterAggregation.get(chapterName)!;
          aggregatedData.totalStudents++;
          aggregatedData.totalQuestions += chapterData.total || 0;
          aggregatedData.totalCorrect += chapterData.correct || 0;
          aggregatedData.totalWrong += chapterData.wrong || 0;
          aggregatedData.totalSkipped += chapterData.skipped || 0;
          aggregatedData.totalMarks += chapterData.totalMarks || 0;
          aggregatedData.totalObtainedMarks += chapterData.obtainedMarks || 0;
        }
      }

      // Convert to final format with averages
      const result = Array.from(chapterAggregation.entries()).map(([chapterName, data]) => {
        const avgTotal = data.totalStudents > 0 ? data.totalQuestions / data.totalStudents : 0;
        const avgCorrect = data.totalStudents > 0 ? data.totalCorrect / data.totalStudents : 0;
        const avgWrong = data.totalStudents > 0 ? data.totalWrong / data.totalStudents : 0;
        const avgSkipped = data.totalStudents > 0 ? data.totalSkipped / data.totalStudents : 0;
        const avgTotalMarks = data.totalStudents > 0 ? data.totalMarks / data.totalStudents : 0;
        const avgObtainedMarks = data.totalStudents > 0 ? data.totalObtainedMarks / data.totalStudents : 0;

        // Calculate percentage based on average correct vs average total
        const percentage = avgTotal > 0 ? (avgCorrect / avgTotal) * 100 : 0;

        // Determine performance level
        let performanceLevel = 'poor';
        if (percentage >= 70) performanceLevel = 'excellent';
        else if (percentage >= 50) performanceLevel = 'good';
        else if (percentage >= 30) performanceLevel = 'average';

        return {
          chapterName,
          total: Math.round(avgTotal * 100) / 100,
          correct: Math.round(avgCorrect * 100) / 100,
          wrong: Math.round(avgWrong * 100) / 100,
          skipped: Math.round(avgSkipped * 100) / 100,
          percentage: Math.round(percentage * 100) / 100,
          totalMarks: Math.round(avgTotalMarks * 100) / 100,
          obtainedMarks: Math.round(avgObtainedMarks * 100) / 100,
          performanceLevel,
          studentsCount: data.totalStudents
        };
      });

      // Sort by chapter name for consistent ordering
      result.sort((a, b) => a.chapterName.localeCompare(b.chapterName));

      return result;
    } catch (error) {
      console.error('Error calculating aggregated chapter-wise analysis:', error);
      return [];
    }
  }

  // Helper method to calculate class strengths, weaknesses, and teacher-focused recommendations
  private calculateClassStrengthsAndWeaknesses(chapterWiseAnalysis: any[]): {
    classStrengths: string[];
    classWeaknesses: string[];
    classAverageAreas: string[];
    classRecommendations: string[];
  } {
    const classStrengths = [];
    const classWeaknesses = [];
    const classAverageAreas = [];
    const classRecommendations = [];

    if (Array.isArray(chapterWiseAnalysis)) {
      chapterWiseAnalysis.forEach((chapter: any) => {
        if (chapter.performanceLevel === 'excellent' || chapter.performanceLevel === 'good') {
          classStrengths.push(chapter.chapterName);
        } else if (chapter.performanceLevel === 'poor') {
          classWeaknesses.push(chapter.chapterName);
        } else if (chapter.performanceLevel === 'average') {
          classAverageAreas.push(chapter.chapterName);
        }
      });
    }

    // Create teacher-focused recommendations
    if (classWeaknesses.length > 0) {
      classRecommendations.push(
        `🔴 Critical Focus Areas: ${classWeaknesses.join(', ')} - Consider reviewing teaching methods, providing additional practice materials, and offering extra support sessions. Students are struggling with fundamental concepts in these areas.`
      );
    }
    
    if (classAverageAreas.length > 0) {
      classRecommendations.push(
        `🟡 Areas for Enhancement: ${classAverageAreas.join(', ')} - Students need more guided practice and concept clarification. Consider using different teaching approaches, visual aids, or peer learning activities to strengthen understanding.`
      );
    }
    
    if (classStrengths.length > 0) {
      classRecommendations.push(
        `🟢 Strong Performance: ${classStrengths.join(', ')} - Excellent teaching! Your current approach is working well. Continue this methodology and consider challenging students with advanced problems to further enhance their skills.`
      );
    }

    return {
      classStrengths,
      classWeaknesses,
      classAverageAreas,
      classRecommendations
    };
  }

  async getChapterStudentDetails(teacherId: number, testPaperId: number, chapterName: string): Promise<any> {
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

      const students = [];

      // Process each assignment to extract chapter-specific data
      for (const assignment of assignments) {
        const latestAttempt = assignment.test_attempts[0];
        
        if (latestAttempt && latestAttempt.status === 'completed' && latestAttempt.student_result) {
          const result = latestAttempt.student_result;
          
          // Extract chapter-wise analysis for this student
          const chapterWiseAnalysis = result.chapter_wise_analysis;
          
          if (Array.isArray(chapterWiseAnalysis)) {
            // Find the specific chapter data
            const chapterData = chapterWiseAnalysis.find((chapter: any) => 
              chapter.chapterName === chapterName
            ) as any;
            
            if (chapterData) {
              const total = Number(chapterData.total || 0);
              const correct = Number(chapterData.correct || 0);
              const wrong = Number(chapterData.wrong || 0);
              const skipped = Number(chapterData.skipped || 0);
              const percentage = Number(chapterData.percentage || 0);
              const performanceLevel = String(chapterData.performanceLevel || 'poor');
              
              students.push({
                studentId: assignment.student.id,
                name: assignment.student.user.name,
                rollNumber: assignment.student.student_id,
                totalQuestions: total,
                attempted: total - skipped,
                correct: correct,
                wrong: wrong,
                skipped: skipped,
                percentage: percentage,
                performanceLevel: performanceLevel,
                status: 'completed' as const
              });
            }
          }
        } else {
          // Student hasn't completed the test
          students.push({
            studentId: assignment.student.id,
            name: assignment.student.user.name,
            rollNumber: assignment.student.student_id,
            totalQuestions: 0,
            attempted: 0,
            correct: 0,
            wrong: 0,
            skipped: 0,
            percentage: 0,
            performanceLevel: 'poor',
            status: 'pending' as const
          });
        }
      }

      return {
        test_paper_id: testPaperId,
        test_paper_name: testPaper.name,
        subject: testPaper.pattern.subject.name,
        standard: testPaper.pattern.standard.name,
        total_marks: testPaper.pattern.total_marks,
        duration_minutes: testPaper.duration_minutes || 0,
        chapter_name: chapterName,
        students: students
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to get chapter student details');
    }
  }
} 