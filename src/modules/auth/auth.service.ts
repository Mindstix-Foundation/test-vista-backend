import { Injectable, Logger, UnauthorizedException, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { RoleService } from '../role/role.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password.dto';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private tokenBlacklist: Set<string> = new Set();

  constructor(
    private readonly userService: UserService,
    private readonly roleService: RoleService,
    private readonly jwtService: JwtService,
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async validateUser(email_id: string, password: string): Promise<any> {
    try {
      const user = await this.userService.findByEmail(email_id);
      
      if (!user) {
        this.logger.warn(`Login attempt failed: User not found with email ${email_id}`);
        throw new UnauthorizedException('Invalid email or password');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        this.logger.warn(`Login attempt failed: Invalid password for user ${email_id}`);
        throw new UnauthorizedException('Invalid email or password');
      }

      // Check if user has any roles
      const userRoles = await this.prisma.user_Role.findMany({
        where: { user_id: user.id },
        include: { role: true }
      });

      if (!userRoles.length) {
        this.logger.warn(`Login attempt failed: No roles assigned to user ${email_id}`);
        throw new UnauthorizedException('User has no assigned roles. Please contact administrator.');
      }

      const { password: _, ...result } = user;
      return {
        ...result,
        roles: userRoles.map(ur => ur.role.role_name)
      };
    } catch (error) {
      this.logger.error('User validation error:', error);
      throw error;
    }
  }

  async login(loginDto: LoginDto) {
    try {
      const user = await this.validateUser(loginDto.email_id, loginDto.password);
      
      const payload = {
        email_id: user.email_id,
        sub: user.id,
        roles: user.roles
      };

      return {
        id: user.id,
        email_id: user.email_id,
        roles: user.roles,
        access_token: this.jwtService.sign(payload)
      };
    } catch (error) {
      this.logger.error('Login error:', error);
      throw error;
    }
  }

  async blacklistToken(token: string): Promise<void> {
    try {
      const decoded = this.jwtService.decode(token);
      if (!decoded || typeof decoded === 'string') {
        throw new UnauthorizedException('Invalid token format');
      }

      await this.prisma.blacklisted_Token.upsert({
        where: { token },
        update: {
          expires_at: new Date((decoded.exp * 1000))
        },
        create: {
          token,
          expires_at: new Date((decoded.exp * 1000))
        }
      });

      // Also add to in-memory blacklist for faster lookup
      this.tokenBlacklist.add(token);
    } catch (error) {
      this.logger.error('Token blacklisting error:', error);
      throw error;
    }
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    // First check in-memory cache for faster lookup
    if (this.tokenBlacklist.has(token)) {
      return true;
    }

    // Check database for blacklisted tokens
    try {
      const blacklistedToken = await this.prisma.blacklisted_Token.findUnique({
        where: { 
          token,
        }
      });

      if (blacklistedToken) {
        // Check if token has expired
        if (blacklistedToken.expires_at > new Date()) {
          // Add to in-memory cache for future fast lookups
          this.tokenBlacklist.add(token);
          return true;
        } else {
          // Token has expired, remove from database
          await this.prisma.blacklisted_Token.delete({
            where: { token }
          });
        }
      }

      // Also check for user-specific invalidation
      try {
        const decoded = this.jwtService.decode(token);
        if (decoded && typeof decoded === 'object' && decoded.sub) {
          const userId = decoded.sub;
          
          // Check if there's a user invalidation token for this user
          const userInvalidationTokens = await this.prisma.blacklisted_Token.findMany({
            where: {
              token: {
                startsWith: `USER_INVALIDATION_${userId}_`
              },
              expires_at: {
                gt: new Date()
              }
            }
          });

          if (userInvalidationTokens.length > 0) {
            // User has been invalidated, blacklist this token too
            this.tokenBlacklist.add(token);
            return true;
          }
        }
      } catch (decodeError) {
        this.logger.warn('Failed to decode token for user invalidation check:', decodeError);
      }

      return false;
    } catch (error) {
      this.logger.error('Error checking token blacklist:', error);
      // In case of database error, fall back to in-memory check
      return this.tokenBlacklist.has(token);
    }
  }

  async invalidateToken(token: string): Promise<void> {
    this.tokenBlacklist.add(token);
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    try {
      // Check if email format is valid (you might want to add more validation)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(forgotPasswordDto.email)) {
        throw new UnauthorizedException('Invalid email format');
      }

      // Check if user exists with the given email_id
      const user = await this.prisma.user.findUnique({
        where: { email_id: forgotPasswordDto.email }
      });

      // Always log the attempt, but don't expose if user exists or not
      if (!user) {
        this.logger.warn(`Password reset attempted for non-existent email: ${forgotPasswordDto.email}`);
        // Return success message even if user doesn't exist
        return { message: 'If your email is registered with us, you will receive a password reset link shortly.' };
      }

      // Generate reset token only if user exists
      const token = this.jwtService.sign(
        { 
          email_id: user.email_id,
          type: 'password_reset'
        },
        { expiresIn: '15m' }
      );

      // Store reset token in database
      await this.prisma.password_Reset.create({
        data: {
          token,
          user_id: user.id,
          expires_at: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
          used: false
        },
      });

      // Send email only if user exists
      const transporter = nodemailer.createTransport({
        host: this.configService.get('SMTP_HOST'),
        port: this.configService.get('SMTP_PORT'),
        auth: {
          user: this.configService.get('SMTP_USER'),
          pass: this.configService.get('SMTP_PASS'),
        },
      });

      await transporter.sendMail({
        from: this.configService.get('SMTP_FROM'),
        to: user.email_id,
        subject: 'Password Reset Request - TEST VISTA',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8f9fa; line-height: 1.6;">
            <!-- Main Container -->
            <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border: 1px solid #dee2e6; border-radius: 8px;">
              
              <!-- Header Section -->
              <div style="background-color: #212529; color: #ffffff; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="margin: 0; font-size: 24px; font-weight: bold;">TEST VISTA</h1>
                <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.9;">Password Reset Request</p>
              </div>

              <!-- Content Section -->
              <div style="padding: 30px;">
                <h2 style="margin: 0 0 20px; font-size: 20px; color: #212529; font-weight: 600;">
                  Reset Your Password
                </h2>

                <p style="margin: 0 0 20px; font-size: 16px; color: #495057;">
                  Hello,
                </p>

                <p style="margin: 0 0 25px; font-size: 16px; color: #495057;">
                  We received a request to reset the password for your TEST VISTA account. 
                  Click the button below to reset your password:
                </p>

                <!-- Reset Button -->
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${this.configService.get('FRONTEND_URL')}/reset-password?token=${token}" 
                     style="display: inline-block; padding: 12px 24px; background-color: #198754; 
                            color: #ffffff; text-decoration: none; border-radius: 4px; 
                            font-weight: 600; font-size: 16px; border: 1px solid #198754;">
                    Reset Password
                  </a>
                </div>

                <!-- Important Notice -->
                <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 15px; margin: 25px 0;">
                  <p style="margin: 0; font-size: 14px; color: #856404;">
                    <strong>Important:</strong> This password reset link will expire in 15 minutes for your security.
                  </p>
                </div>

                <!-- Security Information -->
                <div style="border: 1px solid #dee2e6; border-radius: 4px; padding: 20px; margin: 25px 0; background-color: #f8f9fa;">
                  <h4 style="margin: 0 0 15px; font-size: 16px; color: #212529;">Security Information</h4>
                  <ul style="margin: 0; padding-left: 20px; color: #495057; font-size: 14px;">
                    <li style="margin-bottom: 8px;">If you didn't request this password reset, please ignore this email</li>
                    <li style="margin-bottom: 8px;">Never share this reset link with anyone</li>
                    <li style="margin-bottom: 8px;">Choose a strong password for your account</li>
                    <li>Contact support if you have any concerns</li>
                  </ul>
                </div>

                <!-- Alternative Link -->
                <div style="margin: 25px 0; padding: 15px; background-color: #e9ecef; border-radius: 4px;">
                  <p style="margin: 0 0 8px; font-size: 12px; color: #495057; font-weight: 600;">
                    Having trouble with the button? Copy and paste this link into your browser:
                  </p>
                  <p style="margin: 0; font-size: 11px; color: #6c757d; word-break: break-all; font-family: monospace;">
                    ${this.configService.get('FRONTEND_URL')}/reset-password?token=${token}
                  </p>
                </div>
              </div>

              <!-- Footer -->
              <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6; border-radius: 0 0 8px 8px;">
                <p style="margin: 0 0 8px; font-size: 14px; color: #212529; font-weight: 600;">
                  TEST VISTA
                </p>
                <p style="margin: 0 0 8px; font-size: 12px; color: #6c757d;">
                  Transforming Testing Experience
                </p>
                <p style="margin: 0 0 15px; font-size: 11px; color: #6c757d;">
                  This is an automated message. Please do not reply to this email.
                </p>
                <p style="margin: 0; font-size: 10px; color: #adb5bd;">
                  &copy; ${new Date().getFullYear()} TEST VISTA. All rights reserved.
                </p>
              </div>
            </div>
          </body>
          </html>
        `
      });

      this.logger.log(`Password reset email sent to: ${user.email_id}`);
      
      // Return the same message whether user exists or not
      return { 
        message: 'If your email is registered with us, you will receive a password reset link shortly.' 
      };

    } catch (error) {
      this.logger.error('Password reset request failed:', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // Generic error message to avoid information disclosure
      throw new InternalServerErrorException('Unable to process your request');
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    try {
      const payload = this.jwtService.verify(resetPasswordDto.token);
      
      const resetRecord = await this.prisma.password_Reset.findFirst({
        where: {
          token: resetPasswordDto.token,
          used: false,
          expires_at: {
            gt: new Date(),
          },
        },
      });

      if (!resetRecord) {
        throw new UnauthorizedException('Invalid or expired reset token');
      }

      const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);

      // Update password
      await this.prisma.user.update({
        where: { email_id: payload.email_id },
        data: { password: hashedPassword },
      });

      // Invalidate reset token
      await this.prisma.password_Reset.update({
        where: { id: resetRecord.id },
        data: { used: true },
      });

      return { message: 'Password successfully reset' };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }
  }

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string
  ): Promise<{ message: string }> {
    try {
      // Get user with current password
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        throw new BadRequestException('Current password is incorrect');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await this.prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
      });

      // Invalidate all existing tokens (optional)
      await this.invalidateUserTokens(userId);

      return { message: 'Password changed successfully' };
    } catch (error) {
      this.logger.error('Failed to change password:', error);
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to change password');
    }
  }

  // Helper method to invalidate tokens (optional)
  private async invalidateUserTokens(userId: number): Promise<void> {
    try {
      // Add token to blacklist or invalidate existing sessions
      // Implementation depends on your token management strategy
    } catch (error) {
      this.logger.error('Failed to invalidate tokens:', error);
    }
  }

  /**
   * Invalidate all tokens for a specific user by blacklisting them
   * This will effectively log out the user from all devices
   */
  async invalidateAllUserTokens(userId: number): Promise<void> {
    try {
      // Since we can't easily track all tokens for a user without a session store,
      // we'll implement a user-based blacklist approach by creating a special entry
      
      // Create a special blacklist entry that will invalidate all tokens for this user
      // We'll use a special token format to indicate user-wide invalidation
      const userInvalidationToken = `USER_INVALIDATION_${userId}_${Date.now()}`;
      
      await this.prisma.blacklisted_Token.create({
        data: {
          token: userInvalidationToken,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
        }
      });

      // Also add to in-memory blacklist
      this.tokenBlacklist.add(userInvalidationToken);

      this.logger.log(`Invalidated all tokens for user ID: ${userId}`);
    } catch (error) {
      this.logger.error('Failed to invalidate user tokens:', error);
      throw error;
    }
  }

  async getFullUserProfile(userId: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email_id: true,
          contact_number: true,
          alternate_contact_number: true,
          highest_qualification: true,
          status: true,
          created_at: true,
          updated_at: true,
          user_roles: {
            select: {
              role: {
                select: {
                  id: true,
                  role_name: true
                }
              }
            }
          },
          user_schools: {
            select: {
              school: {
                select: {
                  id: true,
                  name: true,
                  board: true
                }
              }
            }
          },
          teacher_subjects: {
            select: {
              id: true,
              school_standard: {
                select: {
                  id: true,
                  standard: {
                    select: {
                      id: true,
                      name: true,
                      sequence_number: true
                    }
                  }
                }
              },
              subject: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          student: {
            select: {
              id: true,
              student_id: true,
              date_of_birth: true,
              enrollment_date: true,
              status: true,
              school_standard: {
                select: {
                  id: true,
                  school: {
                    select: {
                      id: true,
                      name: true,
                      board: {
                        select: {
                          id: true,
                          name: true,
                          abbreviation: true
                        }
                      }
                    }
                  },
                  standard: {
                    select: {
                      id: true,
                      name: true,
                      sequence_number: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Get user roles
      const roles = user.user_roles.map(ur => ur.role.role_name);
      
      // Check if user is a student
      const isStudent = roles.includes('STUDENT');
      
      if (isStudent && user.student) {
        // Return student-specific profile
        return {
          id: user.id,
          name: user.name,
          email_id: user.email_id,
          contact_number: user.contact_number,
          alternate_contact_number: user.alternate_contact_number,
          student_id: user.student.student_id,
          date_of_birth: user.student.date_of_birth,
          school_name: user.student.school_standard.school.name,
          standard: user.student.school_standard.standard.name,
          roles: user.user_roles.map(ur => ({
            id: ur.role.id,
            name: ur.role.role_name
          }))
        };
      }

      // For admin and teacher roles, return the existing detailed profile
      // Transform the data to a more consumable format
      // Sort teaching subjects first by standard sequence number, then alphabetically by subject name
      const sortedTeachingSubjects = [...user.teacher_subjects]
        .sort((a, b) => {
          // First sort by standard sequence number
          const seqDiff = a.school_standard.standard.sequence_number - b.school_standard.standard.sequence_number;
          if (seqDiff !== 0) return seqDiff;
          
          // Then sort by subject name alphabetically
          return a.subject.name.localeCompare(b.subject.name);
        });

      return {
        id: user.id,
        name: user.name,
        email_id: user.email_id,
        contact_number: user.contact_number,
        alternate_contact_number: user.alternate_contact_number,
        highest_qualification: user.highest_qualification,
        status: user.status,
        created_at: user.created_at,
        updated_at: user.updated_at,
        roles: user.user_roles.map(ur => ({
          id: ur.role.id,
          name: ur.role.role_name
        })),
        schools: user.user_schools.map(us => ({
          id: us.school.id,
          name: us.school.name,
          board: us.school.board
        })),
        teaching_subjects: sortedTeachingSubjects.map(ts => ({
          id: ts.id,
          standard: {
            id: ts.school_standard.standard.id,
            name: ts.school_standard.standard.name,
            sequence_number: ts.school_standard.standard.sequence_number
          },
          subject: {
            id: ts.subject.id,
            name: ts.subject.name
          }
        }))
      };
    } catch (error) {
      this.logger.error('Failed to fetch user profile:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch user profile');
    }
  }
} 