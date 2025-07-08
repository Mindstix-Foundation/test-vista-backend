import { Injectable, ConflictException, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ItiStudentRegistrationDto, ItiStudentLoginDto } from './dto/iti-student-registration.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ItiMocktestService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async registerStudent(dto: ItiStudentRegistrationDto) {
    // Check if roll number already exists in the same school
    const existingStudent = await this.prisma.student.findFirst({
      where: {
        student_id: dto.roll_no,
        school_standard: {
          school_id: dto.school_id
        }
      }
    });

    if (existingStudent) {
      throw new ConflictException('Roll number already exists in this college');
    }

    // Find the school standard relationship
    const schoolStandard = await this.prisma.school_Standard.findFirst({
      where: {
        school_id: dto.school_id,
        standard: {
          id: dto.standard_id,
          board_id: dto.board_id
        }
      },
      include: {
        school: true,
        standard: true
      }
    });

    if (!schoolStandard) {
      throw new NotFoundException('School standard combination not found');
    }

    // Generate a simple email from roll number and school name
    const email = `${dto.roll_no.toLowerCase()}@${schoolStandard.school.name.toLowerCase().replace(/\s+/g, '')}.edu`;
    
    // Check if user with this email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email_id: email
      }
    });

    if (existingUser) {
      throw new ConflictException('A student with this roll number already exists in this college. Please use a different roll number or contact your administrator.');
    }
    
    // Generate a simple password (roll number)
    const password = dto.roll_no;
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user first
    const user = await this.prisma.user.create({
      data: {
        email_id: email,
        password: hashedPassword,
        name: dto.name,
        contact_number: '0000000000', // Placeholder
        status: true
      }
    });

    // Assign student role
    const studentRole = await this.prisma.role.findFirst({
      where: { role_name: 'STUDENT' }
    });

    if (studentRole) {
      await this.prisma.user_Role.create({
        data: {
          user_id: user.id,
          role_id: studentRole.id
        }
      });
    }

    // Create student record
    const student = await this.prisma.student.create({
      data: {
        user_id: user.id,
        student_id: dto.roll_no,
        school_standard_id: schoolStandard.id,
        enrollment_date: new Date(),
        status: 'active'
      }
    });

    // Generate JWT token for auto-login
    const payload = { 
      sub: user.id, 
      email_id: user.email_id, 
      roles: ['STUDENT'] 
    };
    const access_token = this.jwtService.sign(payload);

    return {
      message: 'Registration successful',
      student: {
        id: student.id,
        name: user.name,
        roll_no: student.student_id,
        email: user.email_id,
        school: schoolStandard.school.name,
        standard: schoolStandard.standard.name
      },
      access_token,
      user: {
        id: user.id,
        email_id: user.email_id,
        roles: ['STUDENT']
      }
    };
  }

  async loginStudent(dto: ItiStudentLoginDto) {
    // First, let's check if the school-standard-board combination exists
    const schoolStandard = await this.prisma.school_Standard.findFirst({
      where: {
        school_id: dto.school_id,
        standard_id: dto.standard_id,
        school: {
          board_id: dto.board_id
        }
      },
      include: {
        school: {
          include: {
            board: true
          }
        },
        standard: true
      }
    });

    if (!schoolStandard) {
      throw new UnauthorizedException('Invalid board, school, or standard combination. Please check your selections.');
    }

    // Check if there's a student with this roll number in this school
    const studentByRoll = await this.prisma.student.findFirst({
      where: {
        student_id: dto.roll_no,
        school_standard: {
          school_id: dto.school_id
        }
      },
      include: {
        user: true,
        school_standard: {
          include: {
            school: {
              include: {
                board: true
              }
            },
            standard: true
          }
        }
      }
    });

    if (!studentByRoll) {
      throw new UnauthorizedException(`No student found with roll number "${dto.roll_no}" in the selected school. Please check your roll number.`);
    }

    // Check if the name matches
    if (studentByRoll.user.name.toLowerCase() !== dto.name.toLowerCase()) {
      throw new UnauthorizedException(`Name mismatch. Expected "${studentByRoll.user.name}" but got "${dto.name}". Please check your name spelling.`);
    }

    // Check if the standard matches
    if (studentByRoll.school_standard.standard_id !== dto.standard_id) {
      const actualStandard = studentByRoll.school_standard.standard.name;
      throw new UnauthorizedException(`Standard mismatch. Student "${dto.name}" is in "${actualStandard}", not the selected standard. Please select the correct standard.`);
    }

    // Check if the board matches
    if (studentByRoll.school_standard.school.board_id !== dto.board_id) {
      const actualBoard = studentByRoll.school_standard.school.board.name;
      throw new UnauthorizedException(`Board mismatch. Student "${dto.name}" is under "${actualBoard}", not the selected board. Please select the correct board.`);
    }

    // Find student by all provided details for complete verification
    const student = await this.prisma.student.findFirst({
      where: {
        student_id: dto.roll_no,
        school_standard: {
          school_id: dto.school_id,
          standard_id: dto.standard_id,
          school: {
            board_id: dto.board_id
          }
        },
        user: {
          name: dto.name
        }
      },
      include: {
        user: true,
        school_standard: {
          include: {
            school: {
              include: {
                board: true
              }
            },
            standard: true
          }
        }
      }
    });

    if (!student) {
      throw new UnauthorizedException('Login failed due to data mismatch. Please verify all your details are correct.');
    }

    if (!student.user.status) {
      throw new UnauthorizedException('Student account is inactive. Please contact your administrator.');
    }

    // Generate JWT token
    const payload = { 
      sub: student.user.id, 
      email_id: student.user.email_id, 
      roles: ['STUDENT'] 
    };
    const access_token = this.jwtService.sign(payload);

    return {
      message: 'Login successful',
      student: {
        id: student.id,
        name: student.user.name,
        roll_no: student.student_id,
        email: student.user.email_id,
        school: student.school_standard.school.name,
        board: student.school_standard.school.board.name,
        standard: student.school_standard.standard.name
      },
      access_token,
      user: {
        id: student.user.id,
        email_id: student.user.email_id,
        roles: ['STUDENT']
      }
    };
  }

  async getBoards() {
    const boards = await this.prisma.board.findMany({
      select: {
        id: true,
        name: true,
        abbreviation: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return {
      message: 'Boards retrieved successfully',
      data: boards
    };
  }

  async getSchoolsByBoard(boardId: number) {
    const schools = await this.prisma.school.findMany({
      where: {
        board_id: boardId
      },
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return {
      message: 'Schools retrieved successfully',
      data: schools
    };
  }

  async getStandardsBySchool(schoolId: number) {
    const schoolStandards = await this.prisma.school_Standard.findMany({
      where: {
        school_id: schoolId
      },
      include: {
        standard: true
      },
      orderBy: {
        standard: {
          sequence_number: 'asc'
        }
      }
    });

    const standards = schoolStandards.map(ss => ({
      id: ss.standard.id,
      name: ss.standard.name,
      sequence_number: ss.standard.sequence_number
    }));

    return {
      message: 'Standards retrieved successfully',
      data: standards
    };
  }

  async getStudentProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        student: {
          include: {
            school_standard: {
              include: {
                school: {
                  include: {
                    board: true
                  }
                },
                standard: true
              }
            }
          }
        },
        user_roles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.student) {
      throw new NotFoundException('Student profile not found');
    }

    return {
      message: 'Profile retrieved successfully',
      data: {
        id: user.id,
        email_id: user.email_id,
        name: user.name,
        roles: user.user_roles.map(ur => ur.role.role_name),
        student: {
          id: user.student.id,
          roll_no: user.student.student_id,
          school: user.student.school_standard.school.name,
          board: user.student.school_standard.school.board.name,
          standard: user.student.school_standard.standard.name,
          enrollment_date: user.student.enrollment_date,
          status: user.student.status
        }
      }
    };
  }

  async getStudentsBySchoolAndStandard(schoolId: number, standardId: number) {
    const students = await this.prisma.student.findMany({
      where: {
        school_standard: {
          school_id: schoolId,
          standard_id: standardId
        }
      },
      select: {
        id: true,
        student_id: true,
        enrollment_date: true,
        status: true,
        created_at: true, // Include the actual registration timestamp
        updated_at: true,
        user: {
          select: {
            id: true,
            name: true,
            email_id: true
          }
        },
        school_standard: {
          include: {
            school: {
              include: {
                board: true
              }
            },
            standard: true
          }
        }
      },
      orderBy: {
        student_id: 'asc'
      }
    });

    return {
      message: 'Students retrieved successfully',
      statusCode: 200,
      data: students
    };
  }

  async deleteAllStudentsBySchoolAndStandard(schoolId: number, standardId: number) {
    try {
      // First, find all students in this school-standard combination
      const students = await this.prisma.student.findMany({
        where: {
          school_standard: {
            school_id: schoolId,
            standard_id: standardId
          }
        },
        include: {
          user: true
        }
      });

      if (students.length === 0) {
        return {
          message: 'No students found to delete',
          statusCode: 200,
          deleted_count: 0
        };
      }

      const userIds = students.map(student => student.user_id);
      const studentCount = students.length;

      // Delete all students and their associated users in a transaction
      await this.prisma.$transaction(async (prisma) => {
        // Delete all students first (this will cascade delete related records)
        await prisma.student.deleteMany({
          where: {
            school_standard: {
              school_id: schoolId,
              standard_id: standardId
            }
          }
        });

        // Delete all associated users
        await prisma.user.deleteMany({
          where: {
            id: {
              in: userIds
            }
          }
        });
      });

      return {
        message: `Successfully deleted all ${studentCount} students`,
        statusCode: 200,
        deleted_count: studentCount
      };
    } catch (error) {
      console.error('Error deleting all students:', error);
      throw new BadRequestException('Failed to delete all students');
    }
  }
} 