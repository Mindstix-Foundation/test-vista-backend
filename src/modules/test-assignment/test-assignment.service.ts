import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
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
import {
  OrgMembershipStatus,
  learnerCanAccessTeacherFeatures,
} from '../../common/utils/org-membership.util';

type ChapterAnalysisChapter = {
  id: number;
  name: string;
  sequential_chapter_number: number | null;
};

type ChapterAnalysisStats = {
  total: number;
  correct: number;
  wrong: number;
  skipped: number;
  totalMarks: number;
  obtainedMarks: number;
};

type ChapterPerformanceBuckets = {
  strengths: string[];
  weaknesses: string[];
  averageChapters: string[];
};

@Injectable()
export class TestAssignmentService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertTeacherHasActiveOrg(teacherId: number) {
    const membership = await this.prisma.institution_Membership.findFirst({
      where: {
        user_id: teacherId,
        status: OrgMembershipStatus.active,
        institution: { is_active: true },
      },
      include: {
        institution: {
          select: { id: true, name: true, school_id: true, institution_type: true, is_active: true },
        },
      },
    });
    if (!membership) {
      throw new ForbiddenException(
        'Join or create a School / Coaching Center before assigning tests. Free teachers can create papers only.',
      );
    }
    return membership;
  }

  private async assertLearnerL1InSameOrg(
    studentUserId: number,
    teacherInstitutionId: number,
  ) {
    const membership = await this.prisma.learner_Institution_Membership.findFirst({
      where: {
        user_id: studentUserId,
        institution_id: teacherInstitutionId,
        status: OrgMembershipStatus.active,
      },
    });
    if (!membership) {
      throw new BadRequestException(
        'Student is not an approved member of your organization',
      );
    }
    return membership;
  }

  private async assertApprovedL2Enrollment(
    studentId: number,
    teacherSubjectId: number,
  ) {
    const enrollment = await this.prisma.student_Subject_Enrollment.findFirst({
      where: {
        student_id: studentId,
        teacher_subject_id: teacherSubjectId,
        status: { in: ['approved', 'active'] },
      },
    });
    if (!enrollment) {
      throw new BadRequestException(
        'Student is not enrolled with you for this subject. Approve an enrollment request or wait for auto-mapping after org approval.',
      );
    }
    return enrollment;
  }

  /**
   * Board/school papers always need Teacher_Subject + approved L2.
   * When the paper has a pattern, match that subject/standard.
   * When pattern is missing (legacy/incomplete papers), still require an
   * approved L2 enrollment with this teacher for the student's school_standard —
   * never allow assign on L1-only membership.
   */
  private async assertBoardPaperL2Gate(params: {
    teacherId: number;
    studentId: number;
    studentSchoolId: number;
    studentSchoolStandardId: number;
    pattern: {
      subject: { id: number };
      standard: { id: number };
    } | null;
  }) {
    const { teacherId, studentId, studentSchoolId, studentSchoolStandardId, pattern } =
      params;

    if (pattern) {
      const teacherSubject = await this.prisma.teacher_Subject.findFirst({
        where: {
          user_id: teacherId,
          subject_id: pattern.subject.id,
          school_standard: {
            standard_id: pattern.standard.id,
            school_id: studentSchoolId,
          },
        },
      });

      if (!teacherSubject) {
        throw new BadRequestException(
          "You do not teach this subject to this student's standard in their school",
        );
      }

      return this.assertApprovedL2Enrollment(studentId, teacherSubject.id);
    }

    // Patternless board paper: require any approved L2 with this teacher
    // for the student's school_standard.
    const teacherSubjects = await this.prisma.teacher_Subject.findMany({
      where: {
        user_id: teacherId,
        school_standard_id: studentSchoolStandardId,
      },
      select: { id: true },
    });

    if (!teacherSubjects.length) {
      throw new BadRequestException(
        "You do not teach any subject for this student's standard. Set Teacher_Subject before assigning.",
      );
    }

    const enrollment = await this.prisma.student_Subject_Enrollment.findFirst({
      where: {
        student_id: studentId,
        teacher_subject_id: { in: teacherSubjects.map((t) => t.id) },
        status: { in: ['approved', 'active'] },
      },
    });

    if (!enrollment) {
      throw new BadRequestException(
        'Student is not enrolled with you for this subject. Approve an enrollment request or wait for auto-mapping after org approval.',
      );
    }

    return enrollment;
  }

  private async assertTeacherCohortTeaching(
    teacherId: number,
    examProgramId: number,
    institutionId: number,
    studentUserId: number,
  ) {
    const teacherCohorts = await this.prisma.teacher_Exam_Cohort.findMany({
      where: {
        user_id: teacherId,
        exam_cohort: {
          exam_program_id: examProgramId,
          OR: [{ institution_id: institutionId }, { institution_id: null }],
        },
      },
      select: { exam_cohort_id: true },
    });
    if (!teacherCohorts.length) {
      throw new BadRequestException(
        'You are not mapped to any cohort for this exam program. Create or claim a cohort first.',
      );
    }
    const cohortIds = teacherCohorts.map((c) => c.exam_cohort_id);

    const participant = await this.prisma.participant.findFirst({
      where: {
        user_id: studentUserId,
        status: 'active',
        exam_cohort_id: { in: cohortIds },
      },
      select: { id: true, exam_cohort_id: true },
    });
    if (!participant) {
      throw new BadRequestException(
        'Student is not assigned to one of your teaching cohorts for this program',
      );
    }
    return participant;
  }

  private async assertLearnerApprovedForTeacherAssignments(userId: number) {
    const student = await this.prisma.student.findUnique({
      where: { user_id: userId },
      select: { id: true, status: true },
    });
    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    const membership = await this.prisma.learner_Institution_Membership.findFirst({
      where: {
        user_id: userId,
        status: {
          in: [
            OrgMembershipStatus.pending,
            OrgMembershipStatus.active,
            OrgMembershipStatus.rejected,
          ],
        },
      },
      orderBy: { created_at: 'desc' },
      select: { status: true },
    });

    if (
      !learnerCanAccessTeacherFeatures({
        studentStatus: student.status,
        membershipStatus: membership?.status,
      })
    ) {
      throw new ForbiddenException(
        'Your school/coaching membership is pending approval. Self-practice is available; teacher-assigned tests unlock after an admin accepts your request.',
      );
    }

    return student;
  }

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

  /**
   * Resolves display/scoring metadata for both paper kinds:
   * board papers (legacy Pattern) and Option C papers (template/program based).
   */
  private paperMeta(testPaper: any): { subject: string; standard: string; total_marks: number } {
    return {
      subject:
        testPaper?.pattern?.subject?.name ??
        testPaper?.exam_program?.name ??
        'Competitive Exam',
      standard:
        testPaper?.pattern?.standard?.name ??
        testPaper?.exam_stage?.name ??
        '',
      total_marks:
        testPaper?.pattern?.total_marks ??
        testPaper?.paper_template?.total_marks ??
        0,
    };
  }

  /** Include block for Option C relations, used alongside legacy pattern includes. */
  private static readonly examPlatformInclude = {
    exam_program: { include: { exam_body: { include: { exam_category: true } } } },
    exam_stage: true,
    paper_template: { include: { sections: true } },
  };

  async assignTest(teacherId: number, dto: CreateTestAssignmentDto): Promise<TestAssignmentResponseDto> {
    try {
      const teacherOrg = await this.assertTeacherHasActiveOrg(teacherId);

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

      await this.assertLearnerL1InSameOrg(student.user_id, teacherOrg.institution_id);

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

      // Exam mocks: program enrollment + cohort teaching graph
      // Board/school papers (including patternless): Teacher_Subject + approved L2
      if (testPaper.exam_program_id) {
        const enrolled = await this.prisma.participant_Program.findFirst({
          where: {
            exam_program_id: testPaper.exam_program_id,
            participant: {
              OR: [
                { student_id: dto.student_id },
                { user_id: student.user_id },
              ],
              status: 'active',
            },
          },
        });
        if (!enrolled) {
          throw new BadRequestException(
            'This student is not enrolled in the exam program for this mock test',
          );
        }

        await this.assertTeacherCohortTeaching(
          teacherId,
          testPaper.exam_program_id,
          teacherOrg.institution_id,
          student.user_id,
        );
      } else {
        await this.assertBoardPaperL2Gate({
          teacherId,
          studentId: dto.student_id,
          studentSchoolId: student.school_standard.school.id,
          studentSchoolStandardId: student.school_standard_id,
          pattern: testPaper.pattern,
        });
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
          error instanceof ConflictException ||
          error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException('Failed to assign test');
    }
  }

  private async resolveBulkAssignStudentIds(
    dto: BulkAssignTestDto,
    institutionId: number,
  ): Promise<number[]> {
    let studentIds = [...(dto.student_ids || [])];
    if (!dto.group_id) {
      return studentIds;
    }

    const group = await this.prisma.student_Group.findFirst({
      where: {
        id: dto.group_id,
        institution_id: institutionId,
      },
      include: {
        members: {
          include: {
            participant: {
              include: {
                student: { select: { id: true } },
                user: { select: { student: { select: { id: true } } } },
              },
            },
          },
        },
      },
    });
    if (!group) {
      throw new NotFoundException(`Student group ${dto.group_id} not found in your organization`);
    }
    const fromGroup = group.members
      .map((m) => m.participant.student?.id ?? m.participant.user?.student?.id)
      .filter((id): id is number => typeof id === 'number');
    return [...new Set([...studentIds, ...fromGroup])];
  }

  private async loadBoardTeacherSubjectIdsForBulkAssign(
    teacherId: number,
    testPaper: {
      exam_program_id: number | null;
      pattern: { subject: { id: number }; standard: { id: number } } | null;
      school_id: number | null;
    },
  ): Promise<number[] | null> {
    if (testPaper.exam_program_id) {
      return null;
    }

    if (testPaper.pattern) {
      const teacherSubject = await this.prisma.teacher_Subject.findFirst({
        where: {
          user_id: teacherId,
          subject_id: testPaper.pattern.subject.id,
          school_standard: {
            standard_id: testPaper.pattern.standard.id,
            ...(testPaper.school_id ? { school_id: testPaper.school_id } : {}),
          },
        },
        select: { id: true },
      });
      if (!teacherSubject) {
        throw new BadRequestException(
          "You do not teach this subject/standard for the paper's school. Assign requires Teacher_Subject.",
        );
      }
      return [teacherSubject.id];
    }

    const teacherSubjects = await this.prisma.teacher_Subject.findMany({
      where: { user_id: teacherId },
      select: { id: true, school_standard_id: true },
    });
    if (!teacherSubjects.length) {
      throw new BadRequestException(
        'You do not teach any subject yet. Set Teacher_Subject before assigning.',
      );
    }
    return teacherSubjects.map((t) => t.id);
  }

  private bulkAssignFailure(
    student: { id: number; user?: { name?: string | null } | null },
    reason: string,
  ) {
    return {
      student_id: student.id,
      student_name: student.user?.name || 'Unknown',
      reason,
    };
  }

  private async validateBulkAssignExamMockStudent(
    student: any,
    testPaper: { exam_program_id: number | null },
    teacherId: number,
    teacherInstitutionId: number,
  ): Promise<{ ok: true } | { ok: false; failure: any }> {
    const examProgramId = testPaper.exam_program_id;
    if (examProgramId == null) {
      return {
        ok: false,
        failure: this.bulkAssignFailure(student, 'Test paper is not linked to an exam program'),
      };
    }
    const enrolled = await this.prisma.participant_Program.findFirst({
      where: {
        exam_program_id: examProgramId,
        participant: {
          OR: [{ student_id: student.id }, { user_id: student.user_id }],
          status: 'active',
        },
      },
    });
    if (!enrolled) {
      return {
        ok: false,
        failure: this.bulkAssignFailure(
          student,
          'Student is not enrolled in the exam program for this mock',
        ),
      };
    }

    try {
      await this.assertTeacherCohortTeaching(
        teacherId,
        examProgramId,
        teacherInstitutionId,
        student.user_id,
      );
    } catch (e) {
      return {
        ok: false,
        failure: this.bulkAssignFailure(
          student,
          (e as Error)?.message || 'Not in your teaching cohort',
        ),
      };
    }

    return { ok: true };
  }

  private validateBulkAssignBoardPaperStudent(
    student: any,
    testPaper: {
      pattern: { standard: { id: number } } | null;
      school: { id: number } | null;
    },
  ): { ok: true } | { ok: false; failure: any } {
    const patternStandardId = testPaper.pattern?.standard.id;
    if (patternStandardId == null) {
      return {
        ok: false,
        failure: this.bulkAssignFailure(student, 'Test paper pattern is missing a standard'),
      };
    }
    const isCorrectStandard =
      student.school_standard.standard.id === patternStandardId;
    const isCorrectStandardAndSchool = testPaper.school
      ? isCorrectStandard && student.school_standard.school.id === testPaper.school.id
      : isCorrectStandard;

    if (!isCorrectStandardAndSchool) {
      return {
        ok: false,
        failure: this.bulkAssignFailure(
          student,
          'Student is not in the correct standard or school for this test',
        ),
      };
    }

    if (!student.subject_enrollments?.length) {
      return {
        ok: false,
        failure: this.bulkAssignFailure(
          student,
          'Student is not enrolled with you for this subject (L2)',
        ),
      };
    }

    return { ok: true };
  }

  private async validateBulkAssignPatternlessBoardStudent(
    student: any,
    teacherId: number,
  ): Promise<{ ok: true } | { ok: false; failure: any }> {
    const hasL2 = await this.prisma.student_Subject_Enrollment.findFirst({
      where: {
        student_id: student.id,
        status: { in: ['approved', 'active'] },
        teacher_subject: {
          user_id: teacherId,
          school_standard_id: student.school_standard_id,
        },
      },
      select: { id: true },
    });
    if (!hasL2) {
      return {
        ok: false,
        failure: this.bulkAssignFailure(
          student,
          'Student is not enrolled with you for this subject (L2)',
        ),
      };
    }
    return { ok: true };
  }

  private async evaluateBulkAssignStudent(params: {
    student: any;
    testPaper: any;
    teacherId: number;
    teacherInstitutionId: number;
    testPaperId: number;
  }): Promise<{ valid: true; studentId: number } | { valid: false; failure: any }> {
    const { student, testPaper, teacherId, teacherInstitutionId, testPaperId } = params;

    if (!student.learner_memberships?.length) {
      return {
        valid: false,
        failure: this.bulkAssignFailure(
          student,
          'Student is not an approved member of your organization',
        ),
      };
    }

    if (testPaper.exam_program_id) {
      const examResult = await this.validateBulkAssignExamMockStudent(
        student,
        testPaper,
        teacherId,
        teacherInstitutionId,
      );
      if (examResult.ok === false) {
        return { valid: false, failure: examResult.failure };
      }
    } else if (testPaper.pattern) {
      const boardResult = this.validateBulkAssignBoardPaperStudent(student, testPaper);
      if (boardResult.ok === false) {
        return { valid: false, failure: boardResult.failure };
      }
    } else {
      const patternlessResult = await this.validateBulkAssignPatternlessBoardStudent(
        student,
        teacherId,
      );
      if (patternlessResult.ok === false) {
        return { valid: false, failure: patternlessResult.failure };
      }
    }

    const existingAssignment = await this.prisma.test_Assignment.findUnique({
      where: {
        student_id_test_paper_id: {
          student_id: student.id,
          test_paper_id: testPaperId,
        },
      },
    });

    if (existingAssignment) {
      return {
        valid: false,
        failure: this.bulkAssignFailure(student, 'Test already assigned'),
      };
    }

    return { valid: true, studentId: student.id };
  }

  async bulkAssignTest(teacherId: number, dto: BulkAssignTestDto): Promise<{ assigned: number; failed: any[] }> {
    try {
      const teacherOrg = await this.assertTeacherHasActiveOrg(teacherId);

      const studentIds = await this.resolveBulkAssignStudentIds(
        dto,
        teacherOrg.institution_id,
      );

      if (!studentIds.length) {
        throw new BadRequestException('Provide student_ids and/or a group_id with members that have student records');
      }

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

      const boardTeacherSubjectIds = await this.loadBoardTeacherSubjectIdsForBulkAssign(
        teacherId,
        testPaper,
      );

      const students = await this.prisma.student.findMany({
        where: {
          id: { in: studentIds }
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
          },
          learner_memberships: {
            where: {
              institution_id: teacherOrg.institution_id,
              status: OrgMembershipStatus.active,
            },
            take: 1,
          },
          subject_enrollments: boardTeacherSubjectIds
            ? {
                where: {
                  teacher_subject_id: { in: boardTeacherSubjectIds },
                  status: { in: ['approved', 'active'] },
                },
              }
            : false,
        }
      });

      if (students.length !== studentIds.length) {
        const foundIds = new Set(students.map(s => s.id));
        const missingIds = studentIds.filter(id => !foundIds.has(id));
        throw new NotFoundException(`Students not found: ${missingIds.join(', ')}`);
      }

      const validStudents = [];
      const failedStudents = [];

      for (const student of students) {
        const outcome = await this.evaluateBulkAssignStudent({
          student,
          testPaper,
          teacherId,
          teacherInstitutionId: teacherOrg.institution_id,
          testPaperId: dto.test_paper_id,
        });
        if (outcome.valid) {
          validStudents.push(outcome.studentId);
        } else if (outcome.valid === false) {
          failedStudents.push(outcome.failure);
        }
      }

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
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
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
      const foundStudentIds = new Set(assignments.map(a => a.student_id));
      const missingStudentIds = dto.student_ids.filter(id => !foundStudentIds.has(id));

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
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
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
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch teacher test assignments');
    }
  }

  /** All past results (teacher-assigned and Smart Tests) for the results page. */
  async getStudentPastResults(userId: number) {
    const student = await this.prisma.student.findUnique({
      where: { user_id: userId },
      select: { id: true },
    });
    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    const results = await this.prisma.student_Result.findMany({
      where: { student_id: student.id },
      orderBy: { created_at: 'desc' },
      include: {
        test_attempt: {
          select: {
            id: true,
            attempt_number: true,
            submitted_at: true,
            time_taken_seconds: true,
            test_assignment: {
              select: {
                id: true,
                assignment_source: true,
                test_paper: {
                  include: {
                    pattern: { include: { subject: true, standard: true } },
                    ...TestAssignmentService.examPlatformInclude,
                  },
                },
              },
            },
          },
        },
      },
    });

    return results.map((r) => {
      const assignment = r.test_attempt.test_assignment;
      const paper = assignment.test_paper;
      const meta = this.paperMeta(paper);
      return {
        result_id: r.id,
        test_attempt_id: r.test_attempt_id,
        assignment_id: assignment.id,
        title: paper.name,
        source: assignment.assignment_source === 'SELF_SMART' ? 'SMART' : 'ASSIGNED',
        subject: meta.subject,
        standard: meta.standard,
        exam_program: paper.exam_program?.name ?? null,
        attempt_number: r.test_attempt.attempt_number,
        total_questions: r.total_questions,
        correct_answers: r.correct_answers,
        total_marks: r.total_marks,
        obtained_marks: r.obtained_marks,
        percentage: r.percentage,
        performance_level: r.performance_level,
        time_taken_seconds: r.time_taken_seconds,
        submitted_at: r.test_attempt.submitted_at ?? r.created_at,
      };
    });
  }

  async getStudentAssignedTests(userId: number, statusFilter?: string): Promise<StudentAssignedTestDto[]> {
    try {
      // Gate: pending learners see no teacher-assigned tests (self-practice / smart tests stay open)
      try {
        await this.assertLearnerApprovedForTeacherAssignments(userId);
      } catch (error) {
        if (error instanceof ForbiddenException) {
          return [];
        }
        throw error;
      }

      // First, get the student record from the user ID
      const student = await this.prisma.student.findUnique({
        where: { user_id: userId },
        select: { id: true }
      });

      if (!student) {
        throw new NotFoundException('Student profile not found');
      }

      // Get teacher-assigned tests only (Smart Tests have their own listing)
      const assignments = await this.prisma.test_Assignment.findMany({
        where: {
          student_id: student.id,
          NOT: { assignment_source: 'SELF_SMART' },
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
              ...TestAssignmentService.examPlatformInclude,
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
                  selected_option_id: true,
                  numeric_answer: true
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
        const hasInProgressAttempt = assignment.test_attempts.some(attempt => attempt.status === 'in_progress');
        const completedAttempts = assignment.test_attempts.filter(attempt => attempt.status === 'completed').length;
        const maxAttemptsReached = completedAttempts >= assignment.max_attempts;

        // Prefer in-progress over "completed" so resume is possible when max_attempts=1
        if (hasInProgressAttempt && !hasCompletedAttempts) {
          status = 'active';
        } else if (hasCompletedAttempts || maxAttemptsReached) {
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
          const answeredQuestions = currentAttempt.student_answers.filter(
            answer => answer.selected_option_id !== null || answer.numeric_answer !== null
          ).length;
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
          maxScore: this.paperMeta(assignment.test_paper).total_marks,
          progress,
          remainingTime,
          subject: this.paperMeta(assignment.test_paper).subject,
          standard: this.paperMeta(assignment.test_paper).standard,
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

  private async assertTeacherAssignmentAccess(userId: number, assignmentSource?: string | null) {
    if (assignmentSource === 'SELF_SMART') return;
    await this.assertLearnerApprovedForTeacherAssignments(userId);
  }

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
              },
              ...TestAssignmentService.examPlatformInclude
            }
          }
        }
      });

      if (!assignment) {
        throw new NotFoundException('Test assignment not found or not assigned to you');
      }

      await this.assertTeacherAssignmentAccess(userId, (assignment as any).assignment_source);

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

      const paper: any = assignment.test_paper;
      const templateSections = (paper.paper_template?.sections ?? [])
        .slice()
        .sort((a: any, b: any) => a.sequence_number - b.sequence_number)
        .map((s: any) => ({
          id: s.id,
          name: s.name,
          total_questions: s.total_questions,
          marks_per_question: s.marks_per_question,
          answer_format: s.answer_format,
          time_limit_minutes: s.time_limit_minutes,
          qualifying_marks: s.qualifying_marks,
          negative_marks_per_question: s.negative_marks_per_question,
        }));

      return {
        id: assignment.id,
        title: assignment.test_paper.name,
        subject: this.paperMeta(assignment.test_paper).subject,
        standard: this.paperMeta(assignment.test_paper).standard,
        duration_minutes: assignment.time_limit_minutes || assignment.test_paper.duration_minutes || 60,
        total_questions: questionCount,
        total_marks: this.paperMeta(assignment.test_paper).total_marks,
        instructions: assignment.test_paper.instructions,
        negative_marking: assignment.test_paper.negative_marking,
        negative_marks_per_question: assignment.test_paper.negative_marks_per_question,
        max_attempts: assignment.max_attempts,
        attempts_left: attemptsLeft,
        available_from: assignment.available_from,
        due_date: assignment.due_date,
        status: assignment.status,
        exam_program: paper.exam_program?.name ?? null,
        exam_category: paper.pattern
          ? 'BOARD'
          : paper.exam_program?.exam_body?.exam_category?.code ?? null,
        sections: templateSections
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof ForbiddenException) {
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

  /**
   * Randomize questions as blocks: standalone items shuffle freely;
   * passage-linked children stay adjacent in group_order.
   */
  private randomizeQuestions(questions: any[], studentId: number, shouldRandomize: boolean) {
    const ordered = [...questions].sort((a, b) => {
      if (a.section_id !== b.section_id) return a.section_id - b.section_id;
      return a.question_order - b.question_order;
    });

    if (!shouldRandomize) {
      return ordered;
    }

    // Shuffle blocks within each section so sectional timing stays intact.
    const bySection = new Map<number, any[]>();
    for (const q of ordered) {
      const list = bySection.get(q.section_id) || [];
      list.push(q);
      bySection.set(q.section_id, list);
    }

    const result: any[] = [];
    let sectionSeed = studentId * 1000;
    for (const [, sectionQuestions] of bySection) {
      const blocks = this.buildQuestionBlocks(sectionQuestions);
      const shuffledBlocks = this.shuffleArray(blocks, sectionSeed++);
      for (const block of shuffledBlocks) {
        result.push(...block);
      }
    }
    return result;
  }

  private buildQuestionBlocks(questions: any[]): any[][] {
    const blocks: any[][] = [];
    const seenGroups = new Set<number>();
    const byGroup = new Map<number, any[]>();

    for (const q of questions) {
      const groupId = q.question_group_id ?? q.question?.question_group_id ?? null;
      if (groupId) {
        const list = byGroup.get(groupId) || [];
        list.push(q);
        byGroup.set(groupId, list);
      }
    }

    for (const q of questions) {
      const groupId = q.question_group_id ?? q.question?.question_group_id ?? null;
      if (!groupId) {
        blocks.push([q]);
        continue;
      }
      if (seenGroups.has(groupId)) continue;
      seenGroups.add(groupId);
      const groupQs = (byGroup.get(groupId) || [q]).sort((a, b) => {
        const ao = a.group_order ?? a.question?.group_order ?? a.question_order;
        const bo = b.group_order ?? b.question?.group_order ?? b.question_order;
        return ao - bo;
      });
      blocks.push(groupQs);
    }
    return blocks;
  }

  private mapExamQuestion(q: any, options: string[], optionIds: number[], optionImages: (string | null)[]) {
    const group = q.question_group || q.question?.question_group || null;
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
      is_mandatory: q.is_mandatory,
      question_group_id: q.question_group_id ?? group?.id ?? null,
      group_order: q.group_order ?? q.question?.group_order ?? null,
      passage_text: group?.passage_text ?? null,
      passage_image: group?.passage_image?.image_url ?? null,
    };
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
              },
              ...TestAssignmentService.examPlatformInclude
            }
          }
        }
      });

      if (!assignment) {
        throw new NotFoundException('Test assignment not found');
      }

      await this.assertTeacherAssignmentAccess(userId, (assignment as any).assignment_source);

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
        const durationMinutes =
          assignment.time_limit_minutes || assignment.test_paper.duration_minutes || 60;
        const expired = await this.finalizeExpiredAttemptIfNeeded(ongoingAttempt, durationMinutes);
        if (expired) {
          throw new BadRequestException(
            'Exam time expired and the attempt was auto-submitted. Open Results to view your score.',
          );
        }
        // Resume existing attempt - get questions and return exam data
        const questions = await this.prisma.test_Paper_Question.findMany({
          where: { test_paper_id: assignment.test_paper_id },
          include: {
            question_group: { include: { passage_image: true } },
            question: {
              select: {
                group_order: true,
                question_group_id: true,
                question_group: { include: { passage_image: true } },
              },
            },
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

          return this.mapExamQuestion(q, options, optionIds, optionImages);
        });

        return {
          assignment_id: assignment.id,
          test_paper_id: assignment.test_paper_id,
          title: assignment.test_paper.name,
          subject: this.paperMeta(assignment.test_paper).subject,
          standard: this.paperMeta(assignment.test_paper).standard,
          duration_minutes: durationMinutes,
          timeRemaining: this.calculateRemainingTime(ongoingAttempt.started_at, durationMinutes),
          total_marks: this.paperMeta(assignment.test_paper).total_marks,
          instructions: assignment.test_paper.instructions,
          negative_marking: assignment.test_paper.negative_marking,
          negative_marks_per_question: assignment.test_paper.negative_marks_per_question,
          randomize_questions: assignment.test_paper.randomize_questions,
          randomize_options: assignment.test_paper.randomize_options,
          sections: assignment.test_paper.paper_template?.sections ?? [],
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
          status: 'in_progress',
          is_practice: assignment.assignment_source === 'SELF_SMART',
        }
      });

      // Get questions for the exam
      const questions = await this.prisma.test_Paper_Question.findMany({
        where: { test_paper_id: assignment.test_paper_id },
        include: {
          question_group: { include: { passage_image: true } },
          question: {
            select: {
              group_order: true,
              question_group_id: true,
              question_group: { include: { passage_image: true } },
            },
          },
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

        return this.mapExamQuestion(q, options, optionIds, optionImages);
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
        subject: this.paperMeta(assignment.test_paper).subject,
        standard: this.paperMeta(assignment.test_paper).standard,
        duration_minutes: assignment.time_limit_minutes || assignment.test_paper.duration_minutes || 60,
        timeRemaining: this.calculateRemainingTime(attempt.started_at, assignment.time_limit_minutes || assignment.test_paper.duration_minutes || 60),
        total_marks: this.paperMeta(assignment.test_paper).total_marks,
        instructions: assignment.test_paper.instructions,
        negative_marking: assignment.test_paper.negative_marking,
        negative_marks_per_question: assignment.test_paper.negative_marks_per_question,
        randomize_questions: assignment.test_paper.randomize_questions,
        randomize_options: assignment.test_paper.randomize_options,
        sections: assignment.test_paper.paper_template?.sections ?? [],
        questions: examQuestions,
        start_time: attempt.started_at,
        attempt_number: attempt.attempt_number,
        attemptId: attempt.id
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException('Failed to start exam');
    }
  }

  private calculateRemainingTime(startedAt: Date, durationMinutes: number): number {
    const nowMs = Date.now();
    const startMs = new Date(startedAt).getTime();
    const durationMs = Math.max(0, durationMinutes) * 60 * 1000;
    // Clamp negative elapsed (clock/TZ skew that places start in the future)
    // so remaining never exceeds the configured duration.
    const elapsedMs = Math.max(0, nowMs - startMs);
    const remainingMs = Math.max(0, durationMs - elapsedMs);
    return Math.floor(remainingMs / 1000);
  }

  /** If an in-progress attempt has no time left, finalize it as submitted. */
  private async finalizeExpiredAttemptIfNeeded(
    attempt: { id: number; started_at: Date; status: string },
    durationMinutes: number,
  ): Promise<boolean> {
    if (attempt.status !== 'in_progress') return false;
    // Use DB clock vs started_at to avoid Node/Postgres timezone skew on remaining time.
    const rows = await this.prisma.$queryRaw<Array<{ elapsed_seconds: number }>>`
      SELECT EXTRACT(EPOCH FROM (NOW() - started_at))::int AS elapsed_seconds
      FROM "Test_Attempt"
      WHERE id = ${attempt.id}
    `;
    const elapsedSeconds = Number(rows?.[0]?.elapsed_seconds ?? 0);
    if (elapsedSeconds < durationMinutes * 60) return false;
    await this.prisma.test_Attempt.update({
      where: { id: attempt.id },
      data: {
        status: 'completed',
        submitted_at: new Date(),
        time_taken_seconds: Math.max(durationMinutes * 60, elapsedSeconds),
        updated_at: new Date(),
      },
    });
    return true;
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

  private async resolveSubmitAnswerAttempt(userId: number, dto: SubmitAnswerDto) {
    const student = await this.prisma.student.findUnique({
      where: { user_id: userId }
    });

    console.log('Student found:', student ? { id: student.id, student_id: student.student_id } : 'null');

    if (!student) {
      console.error('Student record not found for user_id:', userId);
      throw new NotFoundException('Student record not found');
    }

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
                negative_marks_per_question: true,
                paper_template: {
                  select: {
                    nat_tolerance: true,
                    sections: {
                      select: {
                        id: true,
                        name: true,
                        time_limit_minutes: true,
                        negative_marks_per_question: true
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

    console.log('Test attempt found:', attempt ? { id: attempt.id, status: attempt.status, student_id: attempt.student_id } : 'null');

    if (!attempt) {
      const anyAttempt = await this.prisma.test_Attempt.findFirst({
        where: {
          id: dto.test_attempt_id,
          student_id: student.id
        }
      });

      if (anyAttempt) {
        console.error('Test attempt found but status is:', anyAttempt.status);
        throw new BadRequestException(`Test attempt is not in progress. Current status: ${anyAttempt.status}`);
      }
      console.error('No test attempt found for attempt_id:', dto.test_attempt_id, 'and student_id:', student.id);
      throw new NotFoundException('Active test attempt not found');
    }

    return attempt;
  }

  private findQuestionSection(
    attempt: any,
    questionData: { section_id: number } | null,
  ) {
    const templateSections =
      attempt.test_assignment.test_paper.paper_template?.sections ?? [];
    return questionData
      ? templateSections.find((s: { id: number }) => s.id === questionData.section_id)
      : undefined;
  }

  private async enforceSectionTimingForAnswer(
    attempt: any,
    questionSection: { id: number; name: string; time_limit_minutes: number } | undefined,
  ) {
    if (!questionSection?.time_limit_minutes) {
      return;
    }

    const timings: Record<string, string> =
      attempt.section_timings ?? {};
    const key = String(questionSection.id);
    if (!timings[key]) {
      timings[key] = new Date().toISOString();
      await this.prisma.test_Attempt.update({
        where: { id: attempt.id },
        data: {
          section_timings: timings,
          current_section_id: questionSection.id,
          section_started_at: new Date()
        }
      });
      return;
    }

    const elapsedMs = Date.now() - new Date(timings[key]).getTime();
    const limitMs = questionSection.time_limit_minutes * 60 * 1000 + 30_000;
    if (elapsedMs > limitMs) {
      throw new BadRequestException(
        `Time for section "${questionSection.name}" is over`
      );
    }
  }

  private computeAnswerNegativeDeduction(
    attempt: any,
    questionSection: { negative_marks_per_question?: number | null } | undefined,
  ) {
    return attempt.test_assignment.test_paper.negative_marking
      ? questionSection?.negative_marks_per_question ??
          attempt.test_assignment.test_paper.negative_marks_per_question ??
          0
      : 0;
  }

  private scoreNumericAnswer(
    dto: SubmitAnswerDto,
    questionData: any,
    attempt: any,
    negativeDeduction: number,
  ): { isCorrect: boolean | null; marksObtained: number } {
    let isCorrect = null;
    let marksObtained = 0;

    if (!questionData) {
      return { isCorrect, marksObtained };
    }

    const correctOption = questionData.question_text.mcq_options.find((opt: any) => opt.is_correct);
    const correctValue = correctOption ? Number.parseFloat(correctOption.option_text ?? '') : Number.NaN;
    const tolerance = attempt.test_assignment.test_paper.paper_template?.nat_tolerance;

    const numericAnswer = dto.numeric_answer;
    if (numericAnswer == null) {
      return { isCorrect: false, marksObtained: -negativeDeduction };
    }

    const matches =
      !Number.isNaN(correctValue) &&
      (tolerance === null || tolerance === undefined
        ? Math.round(numericAnswer) === Math.round(correctValue)
        : Math.abs(numericAnswer - correctValue) <= tolerance);

    if (matches) {
      isCorrect = true;
      marksObtained = questionData.marks;
    } else {
      isCorrect = false;
      marksObtained = -negativeDeduction;
    }

    return { isCorrect, marksObtained };
  }

  private scoreMcqAnswer(
    dto: SubmitAnswerDto,
    questionData: any,
    negativeDeduction: number,
  ): { isCorrect: boolean | null; marksObtained: number } {
    let isCorrect = null;
    let marksObtained = 0;

    if (!questionData) {
      return { isCorrect, marksObtained };
    }

    const correctOption = questionData.question_text.mcq_options.find((opt: any) => opt.is_correct);
    const selectedOption = questionData.question_text.mcq_options.find(
      (opt: any) => opt.id === dto.selected_option_id,
    );

    if (correctOption && selectedOption?.is_correct) {
      isCorrect = true;
      marksObtained = questionData.marks;
      console.log(`Question ${dto.question_id}: Correct answer, marks awarded: ${marksObtained}`);
    } else {
      isCorrect = false;
      marksObtained = -negativeDeduction;
      console.log(`Question ${dto.question_id}: Wrong answer, marks: ${marksObtained}`);
    }

    return { isCorrect, marksObtained };
  }

  private async upsertNumericStudentAnswer(
    dto: SubmitAnswerDto,
    isCorrect: boolean | null,
    marksObtained: number,
  ) {
    await this.prisma.student_Answer.upsert({
      where: {
        test_attempt_id_question_id: {
          test_attempt_id: dto.test_attempt_id,
          question_id: dto.question_id
        }
      },
      update: {
        numeric_answer: dto.numeric_answer,
        selected_option_id: null,
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
        numeric_answer: dto.numeric_answer,
        is_correct: isCorrect,
        marks_obtained: marksObtained,
        time_spent_seconds: dto.time_spent_seconds,
        is_flagged: dto.is_flagged || false
      }
    });
  }

  private async upsertMcqStudentAnswer(
    dto: SubmitAnswerDto,
    isCorrect: boolean | null,
    marksObtained: number,
  ) {
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
  }

  async submitAnswer(userId: number, dto: SubmitAnswerDto): Promise<{ message: string }> {
    try {
      console.log('submitAnswer called with:', { userId, dto });

      const attempt = await this.resolveSubmitAnswerAttempt(userId, dto);

      const questionData = await this.prisma.test_Paper_Question.findFirst({
        where: {
          test_paper_id: attempt.test_assignment.test_paper_id,
          question_id: dto.question_id,
          question_text_id: dto.question_text_id
        },
        include: {
          question_text: { include: { mcq_options: true } }
        }
      });

      const questionSection = this.findQuestionSection(attempt, questionData);
      await this.enforceSectionTimingForAnswer(attempt, questionSection);

      const negativeDeduction = this.computeAnswerNegativeDeduction(attempt, questionSection);

      if (dto.numeric_answer !== null && dto.numeric_answer !== undefined) {
        const { isCorrect, marksObtained } = this.scoreNumericAnswer(
          dto,
          questionData,
          attempt,
          negativeDeduction,
        );
        await this.upsertNumericStudentAnswer(dto, isCorrect, marksObtained);
        return { message: 'Answer submitted successfully' };
      }

      let isCorrect = null;
      let marksObtained = 0;

      if (dto.selected_option_id !== null && dto.selected_option_id !== undefined) {
        const scored = this.scoreMcqAnswer(dto, questionData, negativeDeduction);
        isCorrect = scored.isCorrect;
        marksObtained = scored.marksObtained;
      }

      console.log('Attempting to upsert answer...');

      await this.upsertMcqStudentAnswer(dto, isCorrect, marksObtained);

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

      // Persist scored result immediately so teachers/Past Results see completion
      await this.ensureStudentResult(student.id, dto.test_attempt_id);

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

  /**
   * Create student_Result for a completed attempt if missing (idempotent).
   * Called from submitExam and getExamResult so results are not lazy-only-on-view.
   */
  private async ensureStudentResult(studentId: number, attemptId: number) {
    const existingResult = await this.prisma.student_Result.findFirst({
      where: {
        test_attempt_id: attemptId,
        student_id: studentId
      }
    });
    if (existingResult) {
      return existingResult;
    }

    const attempt = await this.prisma.test_Attempt.findFirst({
      where: {
        id: attemptId,
        student_id: studentId,
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
                },
                ...TestAssignmentService.examPlatformInclude
              }
            }
          }
        }
      }
    });

    if (!attempt) {
      throw new NotFoundException('Completed test attempt not found');
    }

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

    const isAttempted = (a: { selected_option_id: number | null; numeric_answer: number | null }) =>
      (a.selected_option_id !== null && a.selected_option_id !== undefined) ||
      (a.numeric_answer !== null && a.numeric_answer !== undefined);

    for (const answer of answers) {
      if (isAttempted(answer)) {
        if (answer.is_correct === true) {
          correctAnswers++;
        } else if (answer.is_correct === false) {
          wrongAnswers++;
        }
        obtainedMarks += answer.marks_obtained || 0;
      }
    }

    const totalQuestions = questions.length;
    const attemptedQuestions = answers.filter(isAttempted).length;
    const skippedQuestions = totalQuestions - attemptedQuestions;

    const sectionWiseScores = await this.calculateSectionWiseScores(
      attempt.test_assignment.test_paper_id,
      questions,
      answers
    );
    const totalMarks = this.paperMeta(attempt.test_assignment.test_paper).total_marks;
    const percentage = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 100 * 100) / 100 : 0;

    let performanceLevel = 'poor';
    if (percentage >= 70) performanceLevel = 'excellent';
    else if (percentage >= 50) performanceLevel = 'good';
    else if (percentage >= 30) performanceLevel = 'average';

    const chapterWiseAnalysis = await this.calculateChapterWiseAnalysis(attemptId, answers, questions);
    const { strengths, weaknesses, recommendations } = this.calculateStrengthsAndWeaknesses(chapterWiseAnalysis);

    return this.prisma.student_Result.create({
      data: {
        student_id: studentId,
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
        section_wise_scores: sectionWiseScores ?? undefined,
        strengths: strengths,
        weaknesses: weaknesses,
        recommendations: recommendations
      }
    });
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
                  },
                  ...TestAssignmentService.examPlatformInclude
                }
              }
            }
          }
        }
      });

      if (!attempt) {
        throw new NotFoundException('Completed test attempt not found');
      }

      // Ensure result exists (created on submit; still create here for older attempts)
      let existingResult = await this.ensureStudentResult(student.id, attemptId);

      // Format percentage to 2 decimal places
      const formattedPercentage = Math.round(existingResult.percentage * 100) / 100;

      // Check if chapter-wise analysis needs sequenceNumber (for backward compatibility)
      let chapterWiseAnalysis = existingResult.chapter_wise_analysis;
      if (Array.isArray(chapterWiseAnalysis) && chapterWiseAnalysis.length > 0) {
        const firstChapter = chapterWiseAnalysis[0] as any;
        if (firstChapter && firstChapter.sequenceNumber === undefined) {
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

          existingResult = await this.prisma.student_Result.update({
            where: { id: existingResult.id },
            data: { chapter_wise_analysis: chapterWiseAnalysis }
          });
        }
      }

      // Always recalculate recommendations using the latest logic
      const { strengths, weaknesses, recommendations } = this.calculateStrengthsAndWeaknesses(chapterWiseAnalysis);

      await this.prisma.student_Result.update({
        where: { id: existingResult.id },
        data: {
          strengths: strengths,
          weaknesses: weaknesses,
          recommendations: recommendations
        }
      });

      const standing = await this.computeRankAndPercentile(
        attempt.test_assignment.test_paper_id,
        existingResult.obtained_marks
      );
      const overallQualified = this.computeQualification(
        attempt.test_assignment.test_paper,
        existingResult.section_wise_scores,
        formattedPercentage
      );

      return {
        id: existingResult.id,
        test_attempt_id: existingResult.test_attempt_id,
        title: attempt.test_assignment.test_paper.name,
        subject: this.paperMeta(attempt.test_assignment.test_paper).subject,
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
        section_wise_scores: existingResult.section_wise_scores ?? null,
        overall_qualified: overallQualified,
        rank: standing.rank,
        total_participants: standing.total_participants,
        percentile: standing.percentile,
        strengths: strengths,
        weaknesses: weaknesses,
        recommendations: recommendations,
        submitted_at: attempt.submitted_at || existingResult.created_at
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
          question_group: true,
          question: {
            select: {
              group_order: true,
              question_group: { select: { passage_text: true } },
            },
          },
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
      for (const answer of answers) {
        answerMap.set(answer.question_id, answer);
      }

      const detailedQuestions = testPaperQuestions.map(tpq => {
        const answer = answerMap.get(tpq.question_id);
        const options = tpq.question_text.mcq_options;
        const correctOptionIndex = options.findIndex(opt => opt.is_correct);
        const correctOption = options.find(opt => opt.is_correct);
        const isNumeric =
          options.length === 1 &&
          correctOption?.is_correct === true &&
          !Number.isNaN(Number(correctOption.option_text));

        const correctNumeric = isNumeric ? Number(correctOption?.option_text) : null;
        const answerFormat: 'MCQ' | 'NUMERIC' = isNumeric ? 'NUMERIC' : 'MCQ';
        const numericAnswer = answer?.numeric_answer ?? null;
        const attempted =
          !!answer &&
          ((answer.selected_option_id !== null && answer.selected_option_id !== undefined) ||
            (answer.numeric_answer !== null && answer.numeric_answer !== undefined));
        const passageText =
          tpq.question_group?.passage_text ?? tpq.question?.question_group?.passage_text ?? null;
        const groupOrder = tpq.group_order ?? tpq.question?.group_order ?? null;
        const questionGroupId = tpq.question_group_id ?? null;

        if (attempted && answer) {
          const selectedOptionIndex = answer.selected_option_id
            ? options.findIndex(opt => opt.id === answer.selected_option_id)
            : -1;

          return {
            question_id: tpq.question_id,
            question_text: tpq.question_text.question_text,
            question_image: tpq.question_text.image?.image_url,
            options: options.map(opt => opt.option_text || ''),
            option_images: options.map(opt => opt.image?.image_url || null),
            option_ids: options.map(opt => opt.id),
            correct_option: correctOptionIndex,
            selected_option: answer.selected_option_id,
            selected_option_index: selectedOptionIndex,
            is_correct: answer.is_correct,
            marks_obtained: answer.marks_obtained || 0,
            time_spent_seconds: answer.time_spent_seconds,
            is_flagged: answer.is_flagged,
            answer_format: answerFormat,
            numeric_answer: numericAnswer,
            correct_numeric: correctNumeric,
            question_group_id: questionGroupId,
            group_order: groupOrder,
            passage_text: passageText,
          };
        }

        return {
          question_id: tpq.question_id,
          question_text: tpq.question_text.question_text,
          question_image: tpq.question_text.image?.image_url,
          options: options.map(opt => opt.option_text || ''),
          option_images: options.map(opt => opt.image?.image_url || null),
          option_ids: options.map(opt => opt.id),
          correct_option: correctOptionIndex,
          selected_option: null,
          selected_option_index: -1,
          is_correct: null,
          marks_obtained: 0,
          time_spent_seconds: 0,
          is_flagged: false,
            answer_format: answerFormat,
          numeric_answer: null,
          correct_numeric: correctNumeric,
          question_group_id: questionGroupId,
          group_order: groupOrder,
          passage_text: passageText,
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

  /**
   * Rank + percentile among all students who took the same test paper.
   * One entry per student (their best score across attempts) — exam-style
   * ranking. Rank = 1 + number of higher scores; percentile = % below.
   */
  private async computeRankAndPercentile(testPaperId: number, obtainedMarks: number) {
    const results = await this.prisma.student_Result.findMany({
      where: { test_attempt: { test_assignment: { test_paper_id: testPaperId } } },
      select: {
        obtained_marks: true,
        test_attempt: { select: { student_id: true } },
      },
    });
    const bestByStudent = new Map<number, number>();
    for (const r of results) {
      const sid = r.test_attempt.student_id;
      const best = bestByStudent.get(sid);
      if (best === undefined || r.obtained_marks > best) {
        bestByStudent.set(sid, r.obtained_marks);
      }
    }
    const scores = [...bestByStudent.values()];
    const total = scores.length || 1;
    const higher = scores.filter(s => s > obtainedMarks).length;
    const below = scores.filter(s => s < obtainedMarks).length;
    return {
      rank: higher + 1,
      total_participants: total,
      percentile: Math.round((below / total) * 10000) / 100,
    };
  }

  /**
   * Overall qualification: every sectional cutoff met AND (for qualifying
   * stages like UPSC CSAT) the stage's qualifying percentage reached.
   * Returns null when the paper defines no qualification rules.
   */
  private computeQualification(testPaper: any, sectionScores: any, percentage: number): boolean | null {
    const stage = testPaper?.exam_stage;
    const sections = sectionScores
      ? Object.values(sectionScores).filter((s: any) => s.qualifying_marks !== null && s.qualifying_marks !== undefined)
      : [];
    const hasStagePct = stage?.is_qualifying && stage?.qualifying_pct !== null && stage?.qualifying_pct !== undefined;
    if (!sections.length && !hasStagePct) return null;
    const sectionsOk = sections.every((s: any) => s.qualified === true);
    const stageOk = hasStagePct ? percentage >= stage.qualifying_pct : true;
    return sectionsOk && stageOk;
  }

  /**
   * Aggregates obtained/total marks per section and applies template
   * sectional cutoffs (qualifying_marks) when the paper was created from
   * an Option C paper template. Returns null when no section data exists.
   */
  private async calculateSectionWiseScores(
    testPaperId: number,
    questions: any[],
    answers: any[]
  ): Promise<any> {
    try {
      const testPaper = await this.prisma.test_Paper.findUnique({
        where: { id: testPaperId },
        select: {
          paper_template: {
            select: {
              sections: {
                select: { id: true, name: true, qualifying_marks: true, time_limit_minutes: true }
              }
            }
          }
        }
      });

      const answerByQuestion = new Map<number, any>();
      for (const a of answers) answerByQuestion.set(a.question_id, a);

      const bySection = new Map<number, { obtained: number; total: number; attempted: number; questions: number }>();
      for (const q of questions) {
        const sectionId = q.section_id;
        if (sectionId === null || sectionId === undefined) continue;
        if (!bySection.has(sectionId)) {
          bySection.set(sectionId, { obtained: 0, total: 0, attempted: 0, questions: 0 });
        }
        const bucket = bySection.get(sectionId);
        bucket.total += q.marks || 0;
        bucket.questions++;
        const answer = answerByQuestion.get(q.question_id);
        if (
          answer &&
          ((answer.selected_option_id !== null && answer.selected_option_id !== undefined) ||
            (answer.numeric_answer !== null && answer.numeric_answer !== undefined))
        ) {
          bucket.attempted++;
          bucket.obtained += answer.marks_obtained || 0;
        }
      }

      if (bySection.size === 0) return null;

      const templateSections = testPaper?.paper_template?.sections ?? [];
      const result: Record<string, any> = {};
      for (const [sectionId, stats] of bySection.entries()) {
        const templateSection = templateSections.find((s) => s.id === sectionId);
        const qualifyingMarks = templateSection?.qualifying_marks ?? null;
        result[sectionId] = {
          name: templateSection?.name ?? `Section ${sectionId}`,
          obtained: Math.round(stats.obtained * 100) / 100,
          total: stats.total,
          attempted: stats.attempted,
          questions: stats.questions,
          qualifying_marks: qualifyingMarks,
          qualified: qualifyingMarks === null ? null : stats.obtained >= qualifyingMarks
        };
      }
      return result;
    } catch (error) {
      console.error('Error calculating section-wise scores:', error);
      return null;
    }
  }

  private async calculateChapterWiseAnalysis(attemptId: number, answers: any[], questions: any[]): Promise<any> {
    try {
      const testPaperId = await this.resolveAttemptTestPaperId(attemptId);
      if (testPaperId == null) {
        return {};
      }

      const questionsWithChapters = await this.fetchQuestionsWithChapters(testPaperId);
      const { questionToChapterMap, chapterSequenceMap } =
        this.buildQuestionChapterMaps(questionsWithChapters);
      this.logChapterMappingDebug(questions, questionsWithChapters, questionToChapterMap, chapterSequenceMap);

      const chapterStats = this.initChapterStatsFromQuestions(questions, questionToChapterMap);
      this.logChapterStatsAfterCount(answers, questionToChapterMap, chapterStats);
      this.applyAnswersToChapterStats(questions, answers, questionToChapterMap, chapterStats);
      this.logFinalChapterStats(chapterStats);

      const chapterEntries = this.buildSortedChapterEntries(chapterStats, chapterSequenceMap);
      this.logChapterEntriesDebug(chapterEntries, questions.length);

      const chapterWiseAnalysis = chapterEntries.map((entry) => ({
        chapterName: entry.chapterName,
        sequenceNumber: entry.sequenceNumber,
        ...entry.stats,
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

  private async resolveAttemptTestPaperId(attemptId: number): Promise<number | null> {
    const testAttempt = await this.prisma.test_Attempt.findUnique({
      where: { id: attemptId },
      include: {
        test_assignment: {
          select: { test_paper_id: true },
        },
      },
    });
    return testAttempt?.test_assignment.test_paper_id ?? null;
  }

  private fetchQuestionsWithChapters(testPaperId: number) {
    return this.prisma.test_Paper_Question.findMany({
      where: { test_paper_id: testPaperId },
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
                        sequential_chapter_number: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  private buildQuestionChapterMaps(
    questionsWithChapters: Awaited<ReturnType<TestAssignmentService['fetchQuestionsWithChapters']>>,
  ): {
    questionToChapterMap: Map<number, ChapterAnalysisChapter>;
    chapterSequenceMap: Map<string, number | null>;
  } {
    const questionToChapterMap = new Map<number, ChapterAnalysisChapter>();
    const chapterSequenceMap = new Map<string, number | null>();
    for (const q of questionsWithChapters) {
      const chapter = q.question.question_topics[0]?.topic?.chapter;
      if (!chapter) {
        continue;
      }
      questionToChapterMap.set(q.question_id, chapter);
      chapterSequenceMap.set(chapter.name, chapter.sequential_chapter_number);
    }
    return { questionToChapterMap, chapterSequenceMap };
  }

  private logChapterMappingDebug(
    questions: any[],
    questionsWithChapters: Awaited<ReturnType<TestAssignmentService['fetchQuestionsWithChapters']>>,
    questionToChapterMap: Map<number, ChapterAnalysisChapter>,
    chapterSequenceMap: Map<string, number | null>,
  ): void {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }
    console.log('=== Chapter-wise Analysis Debug ===');
    console.log('Total questions in test paper:', questions.length);
    console.log('Questions with chapter mapping:', questionToChapterMap.size);
    console.log('Chapter mapping debug:', Array.from(questionToChapterMap.entries()).map(([qId, chapter]) => ({
      questionId: qId,
      chapterName: chapter.name,
      chapterId: chapter.id,
      sequenceNumber: chapter.sequential_chapter_number,
    })));
    console.log('Chapter sequence map:', Array.from(chapterSequenceMap.entries()).map(([name, seq]) => ({
      chapterName: name,
      sequenceNumber: seq,
    })));
    if (questionToChapterMap.size > 0) {
      return;
    }
    console.log('No chapters found! Debugging question structure:');
    for (const [index, q] of questionsWithChapters.entries()) {
      const firstTopic = q.question.question_topics[0];
      console.log(`Question ${index + 1}:`, {
        questionId: q.question_id,
        questionTopicsCount: q.question.question_topics.length,
        firstTopicDetails: firstTopic
          ? {
              topicId: firstTopic.topic_id,
              topicName: firstTopic.topic?.name,
              chapterDetails: firstTopic.topic?.chapter,
            }
          : 'No topics',
      });
    }
  }

  private emptyChapterStats(): ChapterAnalysisStats {
    return {
      total: 0,
      correct: 0,
      wrong: 0,
      skipped: 0,
      totalMarks: 0,
      obtainedMarks: 0,
    };
  }

  private initChapterStatsFromQuestions(
    questions: any[],
    questionToChapterMap: Map<number, ChapterAnalysisChapter>,
  ): Map<string, ChapterAnalysisStats> {
    const chapterStats = new Map<string, ChapterAnalysisStats>();
    for (const question of questions) {
      const chapter = questionToChapterMap.get(question.question_id);
      if (!chapter) {
        console.warn(
          `Question ${question.question_id} has no chapter mapping, skipping from chapter-wise analysis`,
        );
        continue;
      }
      let stats = chapterStats.get(chapter.name);
      if (!stats) {
        stats = this.emptyChapterStats();
        chapterStats.set(chapter.name, stats);
      }
      stats.total++;
      stats.totalMarks += question.marks || 0;
    }
    return chapterStats;
  }

  private logChapterStatsAfterCount(
    answers: any[],
    questionToChapterMap: Map<number, ChapterAnalysisChapter>,
    chapterStats: Map<string, ChapterAnalysisStats>,
  ): void {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }
    console.log('Processing answers. Total answers:', answers.length);
    console.log('Question to chapter mapping size:', questionToChapterMap.size);
    console.log(
      'Chapter stats after counting all questions:',
      Array.from(chapterStats.entries()).map(([name, stats]) => ({
        chapterName: name,
        total: stats.total,
        totalMarks: stats.totalMarks,
      })),
    );
    console.log(
      'Sample answers:',
      answers.slice(0, 3).map((a) => ({
        questionId: a.question_id,
        selectedOptionId: a.selected_option_id,
        isCorrect: a.is_correct,
        marksObtained: a.marks_obtained,
      })),
    );
  }

  private applyAnswersToChapterStats(
    questions: any[],
    answers: any[],
    questionToChapterMap: Map<number, ChapterAnalysisChapter>,
    chapterStats: Map<string, ChapterAnalysisStats>,
  ): void {
    for (const question of questions) {
      const chapter = questionToChapterMap.get(question.question_id);
      if (!chapter) {
        continue;
      }
      const stats = chapterStats.get(chapter.name);
      if (!stats) {
        continue;
      }
      this.applyOneAnswerToChapterStats(
        question.question_id,
        chapter.name,
        stats,
        answers.find((a) => a.question_id === question.question_id),
      );
    }
  }

  private applyOneAnswerToChapterStats(
    questionId: number,
    chapterName: string,
    stats: ChapterAnalysisStats,
    studentAnswer: any,
  ): void {
    if (studentAnswer?.selected_option_id == null) {
      stats.skipped++;
      this.logChapterAnswerDebug(questionId, chapterName, 'SKIPPED');
      return;
    }
    if (studentAnswer.is_correct === true) {
      stats.correct++;
      this.logChapterAnswerDebug(questionId, chapterName, 'CORRECT', studentAnswer.marks_obtained);
    } else if (studentAnswer.is_correct === false) {
      stats.wrong++;
      this.logChapterAnswerDebug(questionId, chapterName, 'WRONG', studentAnswer.marks_obtained);
    }
    stats.obtainedMarks += studentAnswer.marks_obtained || 0;
  }

  private logChapterAnswerDebug(
    questionId: number,
    chapterName: string,
    outcome: 'SKIPPED' | 'CORRECT' | 'WRONG',
    marks?: number,
  ): void {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }
    if (outcome === 'SKIPPED') {
      console.log(`Question ${questionId} in chapter ${chapterName}: SKIPPED`);
      return;
    }
    console.log(`Question ${questionId} in chapter ${chapterName}: ${outcome}, marks: ${marks}`);
  }

  private logFinalChapterStats(chapterStats: Map<string, ChapterAnalysisStats>): void {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }
    console.log(
      'Final chapter stats:',
      Array.from(chapterStats.entries()).map(([name, stats]) => ({
        chapterName: name,
        total: stats.total,
        correct: stats.correct,
        wrong: stats.wrong,
        skipped: stats.skipped,
        totalMarks: stats.totalMarks,
        obtainedMarks: stats.obtainedMarks,
      })),
    );
  }

  private chapterPerformanceLevel(percentage: number): string {
    if (percentage >= 70) {
      return 'excellent';
    }
    if (percentage >= 50) {
      return 'good';
    }
    if (percentage >= 30) {
      return 'average';
    }
    return 'poor';
  }

  private buildSortedChapterEntries(
    chapterStats: Map<string, ChapterAnalysisStats>,
    chapterSequenceMap: Map<string, number | null>,
  ) {
    const chapterEntries = Array.from(chapterStats.entries()).map(([chapterName, stats]) => {
      const percentage = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
      return {
        chapterName,
        sequenceNumber: chapterSequenceMap.get(chapterName) || 999,
        stats: {
          total: stats.total,
          correct: stats.correct,
          wrong: stats.wrong,
          skipped: stats.skipped,
          percentage: Math.round(percentage * 100) / 100,
          totalMarks: stats.totalMarks,
          obtainedMarks: stats.obtainedMarks,
          performanceLevel: this.chapterPerformanceLevel(percentage),
        },
      };
    });
    this.logChapterEntriesSnapshot('Chapter entries before sorting:', chapterEntries);
    chapterEntries.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
    return chapterEntries;
  }

  private logChapterEntriesSnapshot(
    label: string,
    chapterEntries: Array<{
      chapterName: string;
      sequenceNumber: number;
      stats: { total: number; correct: number; percentage: number };
    }>,
  ): void {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }
    console.log(
      label,
      chapterEntries.map((e) => ({
        name: e.chapterName,
        sequenceNumber: e.sequenceNumber,
        total: e.stats.total,
        correct: e.stats.correct,
        percentage: e.stats.percentage,
      })),
    );
  }

  private logChapterEntriesDebug(
    chapterEntries: Array<{
      chapterName: string;
      sequenceNumber: number;
      stats: { total: number; correct: number; percentage: number };
    }>,
    expectedQuestionCount: number,
  ): void {
    this.logChapterEntriesSnapshot('Chapter entries after sorting:', chapterEntries);
    if (process.env.NODE_ENV !== 'development') {
      return;
    }
    const totalQuestionsInChapters = chapterEntries.reduce((sum, e) => sum + e.stats.total, 0);
    console.log(`Total questions in chapters: ${totalQuestionsInChapters}, Expected: ${expectedQuestionCount}`);
    console.log('=== End Chapter-wise Analysis Debug ===');
  }

  private calculateStrengthsAndWeaknesses(chapterWiseAnalysis: any): {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  } {
    const buckets = this.collectChapterPerformanceBuckets(chapterWiseAnalysis);
    return {
      strengths: buckets.strengths,
      weaknesses: buckets.weaknesses,
      recommendations: this.buildPerformanceRecommendations(buckets),
    };
  }

  private collectChapterPerformanceBuckets(chapterWiseAnalysis: any): ChapterPerformanceBuckets {
    const buckets: ChapterPerformanceBuckets = {
      strengths: [],
      weaknesses: [],
      averageChapters: [],
    };
    if (Array.isArray(chapterWiseAnalysis)) {
      for (const chapter of chapterWiseAnalysis) {
        this.pushChapterByPerformance(chapter.performanceLevel, chapter.chapterName, buckets);
      }
      return buckets;
    }
    for (const [chapterName, stats] of Object.entries(chapterWiseAnalysis)) {
      this.pushChapterByPerformance(this.performanceLevelOf(stats), chapterName, buckets);
    }
    return buckets;
  }

  private performanceLevelOf(stats: unknown): string | undefined {
    if (!stats || typeof stats !== 'object' || !('performanceLevel' in stats)) {
      return undefined;
    }
    const level = Reflect.get(stats, 'performanceLevel');
    return typeof level === 'string' ? level : undefined;
  }

  private pushChapterByPerformance(
    performanceLevel: string | undefined,
    chapterName: string,
    buckets: ChapterPerformanceBuckets,
  ): void {
    if (performanceLevel === 'excellent' || performanceLevel === 'good') {
      buckets.strengths.push(chapterName);
      return;
    }
    if (performanceLevel === 'poor') {
      buckets.weaknesses.push(chapterName);
      return;
    }
    if (performanceLevel === 'average') {
      buckets.averageChapters.push(chapterName);
    }
  }

  private buildPerformanceRecommendations(buckets: ChapterPerformanceBuckets): string[] {
    const recommendations: string[] = [];
    if (buckets.weaknesses.length > 0) {
      recommendations.push(`🔴 Critical Focus Areas: ${buckets.weaknesses.join(', ')} - These topics require immediate attention. Consider reviewing fundamentals, practicing more problems, and seeking additional help from teachers or study materials.`);
    }
    if (buckets.averageChapters.length > 0) {
      recommendations.push(`🟡 Areas for Enhancement: ${buckets.averageChapters.join(', ')} - You have a basic understanding but need to strengthen your concepts. Focus on solving varied problem types and clarifying doubts to achieve mastery.`);
    }
    if (buckets.strengths.length > 0) {
      recommendations.push(`🟢 Strong Performance: ${buckets.strengths.join(', ')} - Excellent work! Continue regular practice and try advanced problems to maintain and further improve your expertise in these areas.`);
    }
    return recommendations;
  }

  private async loadTeacherOwnedTestPaper(teacherId: number, testPaperId: number) {
    const testPaper = await this.prisma.test_Paper.findUnique({
      where: { id: testPaperId },
      include: {
        pattern: {
          include: {
            subject: true,
            standard: true
          }
        },
        ...TestAssignmentService.examPlatformInclude
      }
    });

    if (!testPaper) {
      throw new NotFoundException(`Test paper with ID ${testPaperId} not found`);
    }

    if (testPaper.user_id !== teacherId) {
      throw new BadRequestException('You can only view results for your own test papers');
    }

    return testPaper;
  }

  private async fetchTestPaperAssignments(teacherId: number, testPaperId: number) {
    return this.prisma.test_Assignment.findMany({
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
          take: 1
        }
      }
    });
  }

  private processTestPaperAssignment(assignment: any, testPaper: any): {
    result: TestPaperResultDto;
    completed?: { marks: number; time: number; percentage: number };
    chapterWiseAnalysis?: any;
    sectionWiseScores?: any;
  } {
    const latestAttempt = assignment.test_attempts[0];

    if (latestAttempt && latestAttempt.status === 'completed' && latestAttempt.student_result) {
      const result = latestAttempt.student_result;
      return {
        result: {
          rank: 0,
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
        },
        completed: {
          marks: result.obtained_marks,
          time: result.time_taken_seconds,
          percentage: result.percentage
        },
        chapterWiseAnalysis: result.chapter_wise_analysis || undefined,
        sectionWiseScores: result.section_wise_scores || undefined,
      };
    }

    return {
      result: {
        rank: 0,
        student_name: assignment.student.user.name,
        roll_number: assignment.student.student_id,
        marks_obtained: 0,
        total_marks: this.paperMeta(testPaper).total_marks,
        time_taken_seconds: 0,
        percentage: 0,
        status: 'pending',
        student_id: assignment.student.id
      },
    };
  }

  private sortTestPaperResults(results: TestPaperResultDto[]) {
    results.sort((a, b) => {
      if (a.status === 'pending' && b.status === 'completed') return -1;
      if (a.status === 'completed' && b.status === 'pending') return 1;
      if (a.status === 'pending' && b.status === 'pending') return 0;

      if (a.marks_obtained !== b.marks_obtained) {
        return b.marks_obtained - a.marks_obtained;
      }
      return a.time_taken_seconds - b.time_taken_seconds;
    });
  }

  private assignRanksToTestPaperResults(results: TestPaperResultDto[]) {
    let currentRank = 1;
    for (let i = 0; i < results.length; i++) {
      if (results[i].status === 'pending') {
        results[i].rank = 0;
        continue;
      }

      if (i > 0 && results[i].status === 'completed' && results[i - 1].status === 'completed') {
        if (
          results[i].marks_obtained === results[i - 1].marks_obtained &&
          results[i].time_taken_seconds === results[i - 1].time_taken_seconds
        ) {
          results[i].rank = results[i - 1].rank;
        } else {
          results[i].rank = currentRank;
        }
      } else {
        results[i].rank = currentRank;
      }
      currentRank++;
    }
  }

  private computeTestPaperScoreStatistics(
    completedResults: Array<{ marks: number; time: number; percentage: number }>,
    completedStudents: number,
  ) {
    let highestScore = 0;
    let averageScore = 0;
    let lowestScore = 0;
    let passRate = 0;

    if (completedResults.length === 0) {
      return { highestScore, averageScore, lowestScore, passRate };
    }

    const marks = completedResults.map(r => r.marks);
    const percentages = completedResults.map(r => r.percentage);

    highestScore = Math.max(...marks);
    lowestScore = Math.min(...marks);
    averageScore = marks.reduce((sum, mark) => sum + mark, 0) / marks.length;

    const passedStudents = percentages.filter(perc => perc >= 40).length;
    passRate = (passedStudents / completedStudents) * 100;

    return { highestScore, averageScore, lowestScore, passRate };
  }

  async getTestPaperResults(teacherId: number, testPaperId: number): Promise<TestPaperResultsResponseDto> {
    try {
      const testPaper = await this.loadTeacherOwnedTestPaper(teacherId, testPaperId);
      const assignments = await this.fetchTestPaperAssignments(teacherId, testPaperId);

      const results: TestPaperResultDto[] = [];
      const completedResults: Array<{ marks: number; time: number; percentage: number }> = [];
      const completedStudentResults: any[] = [];
      const completedSectionScores: any[] = [];

      for (const assignment of assignments) {
        const processed = this.processTestPaperAssignment(assignment, testPaper);
        if (processed.completed) {
          completedResults.push(processed.completed);
        }
        if (processed.chapterWiseAnalysis) {
          completedStudentResults.push(processed.chapterWiseAnalysis);
        }
        if (processed.sectionWiseScores) {
          completedSectionScores.push(processed.sectionWiseScores);
        }
        results.push(processed.result);
      }

      this.sortTestPaperResults(results);
      this.assignRanksToTestPaperResults(results);

      const totalStudents = assignments.length;
      const completedStudents = completedResults.length;
      const pendingStudents = totalStudents - completedStudents;

      const { highestScore, averageScore, lowestScore, passRate } =
        this.computeTestPaperScoreStatistics(completedResults, completedStudents);

      const chapterWiseAnalysis = this.calculateAggregatedChapterWiseAnalysis(completedStudentResults);
      const sectionWiseAnalysis = this.calculateAggregatedSectionWiseAnalysis(completedSectionScores);

      const {
        classStrengths,
        classWeaknesses,
        classAverageAreas,
        classRecommendations
      } = this.calculateClassStrengthsAndWeaknesses(chapterWiseAnalysis);

      return {
        test_paper_id: testPaperId,
        test_paper_name: testPaper.name,
        subject: this.paperMeta(testPaper).subject,
        standard: this.paperMeta(testPaper).standard,
        total_marks: this.paperMeta(testPaper).total_marks,
        duration_minutes: testPaper.duration_minutes || 0,
        total_students: totalStudents,
        completed_students: completedStudents,
        pending_students: pendingStudents,
        highest_score: Math.round(highestScore * 100) / 100,
        average_score: Math.round(averageScore * 100) / 100,
        lowest_score: Math.round(lowestScore * 100) / 100,
        pass_rate: Math.round(passRate * 100) / 100,
        chapter_wise_analysis: chapterWiseAnalysis,
        section_wise_analysis: sectionWiseAnalysis,
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

  private createSectionAggregationBucket(sectionId: string, sectionData: any) {
    return {
      sectionName: sectionData.name ?? `Section ${sectionId}`,
      studentsCount: 0,
      questions: 0,
      attempted: 0,
      obtainedMarks: 0,
      totalMarks: 0,
      qualifyingMarks: sectionData.qualifying_marks ?? null,
      qualifiedCount: 0,
      qualifiedTracked: 0,
    };
  }

  private mergeSectionScoreIntoBucket(bucket: {
    studentsCount: number;
    questions: number;
    attempted: number;
    obtainedMarks: number;
    totalMarks: number;
    qualifyingMarks: number | null;
    qualifiedCount: number;
    qualifiedTracked: number;
  }, sectionData: any) {
    bucket.studentsCount++;
    bucket.questions += sectionData.questions || 0;
    bucket.attempted += sectionData.attempted || 0;
    bucket.obtainedMarks += sectionData.obtained || 0;
    bucket.totalMarks += sectionData.total || 0;
    if (sectionData.qualifying_marks !== null && sectionData.qualifying_marks !== undefined) {
      bucket.qualifyingMarks = sectionData.qualifying_marks;
    }
    if (sectionData.qualified === true || sectionData.qualified === false) {
      bucket.qualifiedTracked++;
      if (sectionData.qualified === true) {
        bucket.qualifiedCount++;
      }
    }
  }

  private formatSectionAggregationBucket(bucket: {
    sectionName: string;
    studentsCount: number;
    questions: number;
    attempted: number;
    obtainedMarks: number;
    totalMarks: number;
    qualifyingMarks: number | null;
    qualifiedCount: number;
    qualifiedTracked: number;
  }) {
    const n = bucket.studentsCount || 1;
    const avgObtained = bucket.obtainedMarks / n;
    const avgTotal = bucket.totalMarks / n;
    const percentage = avgTotal > 0 ? Math.round((avgObtained / avgTotal) * 10000) / 100 : 0;
    return {
      sectionName: bucket.sectionName,
      questions: Math.round((bucket.questions / n) * 100) / 100,
      attempted: Math.round((bucket.attempted / n) * 100) / 100,
      obtainedMarks: Math.round(avgObtained * 100) / 100,
      totalMarks: Math.round(avgTotal * 100) / 100,
      percentage,
      qualifyingMarks: bucket.qualifyingMarks,
      qualifiedRate:
        bucket.qualifiedTracked > 0
          ? Math.round((bucket.qualifiedCount / bucket.qualifiedTracked) * 10000) / 100
          : null,
      studentsCount: bucket.studentsCount,
    };
  }

  /** Aggregate per-student section_wise_scores maps into class averages. */
  private calculateAggregatedSectionWiseAnalysis(completedSectionScores: any[]): any[] {
    if (!completedSectionScores?.length) return [];

    const agg = new Map<
      string,
      ReturnType<TestAssignmentService['createSectionAggregationBucket']>
    >();

    for (const scores of completedSectionScores) {
      if (!scores || typeof scores !== 'object' || Array.isArray(scores)) continue;
      for (const [sectionId, raw] of Object.entries(scores as Record<string, any>)) {
        const sectionData = raw || {};
        const key = String(sectionId);
        let bucket = agg.get(key);
        if (!bucket) {
          bucket = this.createSectionAggregationBucket(key, sectionData);
          agg.set(key, bucket);
        }
        this.mergeSectionScoreIntoBucket(bucket, sectionData);
      }
    }

    return Array.from(agg.values()).map((bucket) => this.formatSectionAggregationBucket(bucket));
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
          
          let aggregatedData = chapterAggregation.get(chapterName);
          if (!aggregatedData) {
            aggregatedData = {
              totalStudents: 0,
              totalQuestions: 0,
              totalCorrect: 0,
              totalWrong: 0,
              totalSkipped: 0,
              totalMarks: 0,
              totalObtainedMarks: 0
            };
            chapterAggregation.set(chapterName, aggregatedData);
          }

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
      for (const chapter of chapterWiseAnalysis) {
        if (chapter.performanceLevel === 'excellent' || chapter.performanceLevel === 'good') {
          classStrengths.push(chapter.chapterName);
        } else if (chapter.performanceLevel === 'poor') {
          classWeaknesses.push(chapter.chapterName);
        } else if (chapter.performanceLevel === 'average') {
          classAverageAreas.push(chapter.chapterName);
        }
      }
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

  private buildChapterStudentDetailFromAssignment(assignment: any, chapterName: string) {
    const latestAttempt = assignment.test_attempts[0];

    if (latestAttempt && latestAttempt.status === 'completed' && latestAttempt.student_result) {
      const result = latestAttempt.student_result;
      const chapterWiseAnalysis = result.chapter_wise_analysis;

      if (!Array.isArray(chapterWiseAnalysis)) {
        return null;
      }

      const chapterData = chapterWiseAnalysis.find(
        (chapter: { chapterName?: string }) => chapter.chapterName === chapterName,
      );

      if (!chapterData) {
        return null;
      }

      const total = Number(chapterData.total || 0);
      const correct = Number(chapterData.correct || 0);
      const wrong = Number(chapterData.wrong || 0);
      const skipped = Number(chapterData.skipped || 0);
      const percentage = Number(chapterData.percentage || 0);
      const performanceLevel = String(chapterData.performanceLevel || 'poor');

      return {
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
      };
    }

    return {
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
    };
  }

  async getChapterStudentDetails(teacherId: number, testPaperId: number, chapterName: string): Promise<any> {
    try {
      const testPaper = await this.loadTeacherOwnedTestPaper(teacherId, testPaperId);
      const assignments = await this.fetchTestPaperAssignments(teacherId, testPaperId);

      const students = [];

      for (const assignment of assignments) {
        const entry = this.buildChapterStudentDetailFromAssignment(assignment, chapterName);
        if (entry) {
          students.push(entry);
        }
      }

      return {
        test_paper_id: testPaperId,
        test_paper_name: testPaper.name,
        subject: this.paperMeta(testPaper).subject,
        standard: this.paperMeta(testPaper).standard,
        total_marks: this.paperMeta(testPaper).total_marks,
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