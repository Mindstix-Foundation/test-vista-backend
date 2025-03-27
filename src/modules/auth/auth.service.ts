import { Injectable, Logger, UnauthorizedException, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { RoleService } from '../role/role.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { ForgotPasswordDto, ResetPasswordDto, ChangePasswordDto } from './dto/password.dto';
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

      await this.prisma.blacklisted_Token.create({
        data: {
          token,
          expires_at: new Date((decoded.exp * 1000))
        }
      });
    } catch (error) {
      this.logger.error('Token blacklisting error:', error);
      throw error;
    }
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    return this.tokenBlacklist.has(token);
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
        subject: 'Password Reset Request',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
            <!-- Main Container -->
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
              <!-- Header with Logo -->
              <div style="text-align: center; padding: 20px; background-color: #ffffff;">
                <img src="cid:logo" 
                     alt="TEST VISTA Logo" 
                     style="width: 200px; max-width: 100%; height: auto;">
              </div>

              <!-- Content Section -->
              <div style="padding: 20px 30px;">
                <h1 style="margin: 0 0 20px; font-size: 24px; color: #2563eb; text-align: center;">
                  Password Reset Request
                </h1>

                <p style="margin: 0 0 20px; font-size: 16px; line-height: 24px; color: #333333;">
                  Hello,
                </p>

                <p style="margin: 0 0 20px; font-size: 16px; line-height: 24px; color: #333333;">
                  We received a request to reset the password for your TEST VISTA account. 
                  To proceed with the password reset, click the button below:
                </p>

                <!-- Reset Button -->
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${this.configService.get('FRONTEND_URL')}/reset-password?token=${token}" 
                     style="display: inline-block; padding: 12px 25px; background-color: #2563eb; 
                              color: #ffffff; text-decoration: none; border-radius: 4px; 
                              font-weight: bold; font-size: 16px;">
                    Reset Password
                  </a>
                </div>

                <p style="margin: 0 0 20px; font-size: 16px; line-height: 24px; color: #333333;">
                  This password reset link will expire in 15 minutes for security reasons.
                </p>

                <!-- Security Notice -->
                <div style="margin: 20px 0; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 10px; font-size: 16px; font-weight: bold; color: #333333;">
                    Important Security Notice:
                  </p>
                  <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                    <li style="margin-bottom: 10px;">If you didn't request this password reset, please ignore this email or contact support.</li>
                    <li style="margin-bottom: 10px;">Never share this reset link with anyone.</li>
                    <li style="margin-bottom: 10px;">Our support team will never ask for your password.</li>
                  </ul>
                </div>

                <!-- Token Info (Development Only) -->
                <div style="margin: 20px 0; padding: 15px; background-color: #f3f4f6; border-radius: 6px;">
                  <p style="margin: 0; font-family: monospace; font-size: 14px;">
                    <strong>Development Mode - Reset Token:</strong><br>
                    ${token}
                  </p>
                </div>
              </div>

              <!-- Footer -->
              <div style="padding: 20px 30px; background-color: #f5f5f5; text-align: center;">
                <p style="margin: 0 0 10px; font-size: 12px; color: #666666;">
                  This is an automated message, please do not reply to this email.
                </p>
                <p style="margin: 0 0 10px; font-size: 12px; color: #2563eb;">
                  TEST VISTA - Transforming Testing Experience
                </p>
                <p style="margin: 0 0 10px; font-size: 12px; color: #666666;">
                  &copy; ${new Date().getFullYear()} TEST VISTA. All rights reserved.
                </p>
                <p style="margin: 0 0 10px; font-size: 12px; color: #4b5563;">
                  If you're having trouble clicking the reset password button, copy and paste the following URL into your web browser:
                </p>
                <p style="margin: 0; font-size: 11px; color: #6b7280; word-break: break-all;">
                  ${this.configService.get('FRONTEND_URL')}/reset-password?token=${token}
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
        attachments: [{
          filename: 'logo.png',
          path: 'https://drive.google.com/uc?export=view&id=1Xbu3xeKFthTqzETOc7bM9sGlN1CZJq2U',
          cid: 'logo'
        }]
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
      const payload = this.jwtService.verify(resetPasswordDto.token) as { email_id: string };
      
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
                  name: true
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
              medium_standard_subject: {
                select: {
                  id: true,
                  subject: {
                    select: {
                      id: true,
                      name: true
                    }
                  },
                  instruction_medium: {
                    select: {
                      id: true,
                      instruction_medium: true
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

      // Transform the data to a more consumable format
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
          name: us.school.name
        })),
        teaching_subjects: user.teacher_subjects.map(ts => ({
          id: ts.id,
          standard: {
            id: ts.school_standard.standard.id,
            name: ts.school_standard.standard.name,
            sequence_number: ts.school_standard.standard.sequence_number
          },
          subject: {
            id: ts.medium_standard_subject.subject.id,
            name: ts.medium_standard_subject.subject.name
          },
          medium: {
            id: ts.medium_standard_subject.instruction_medium.id,
            name: ts.medium_standard_subject.instruction_medium.instruction_medium
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