import { Controller, Post, UseGuards, Request, Body, Get, HttpStatus, HttpCode, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { ForgotPasswordDto, ResetPasswordDto, ChangePasswordDto } from './dto/password.dto';
import { UserService } from '../user/user.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService
  ) {}

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: 'Login user' })
  @ApiBody({
    type: LoginDto,
    description: 'User credentials'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Login successful' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    try {
      const result = await this.authService.login(loginDto);
      return {
        statusCode: HttpStatus.OK,
        message: 'Login successful',
        data: {
          user: {
            id: result.id,
            email_id: result.email_id,
            name: result.name,
            roles: result.roles,
            contact_number: result.contact_number,
            alternate_contact_number: result.alternate_contact_number,
            highest_qualification: result.highest_qualification,
            status: result.status,
            schools: result.schools || []
          },
          access_token: result.access_token
        }
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Successfully logged out' })
  async logout(@Request() req) {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      await this.authService.blacklistToken(token);
    }
    return {
      statusCode: HttpStatus.OK,
      message: 'Successfully logged out'
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns user profile' })
  async getProfile(@Request() req) {
    const userProfile = await this.userService.findOne(req.user.id);
    
    return {
      statusCode: HttpStatus.OK,
      data: userProfile
    };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Reset email sent successfully',
    schema: {
      example: {
        message: 'Password reset email sent'
      }
    }
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'User not found' 
  })
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using token' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Password reset successful',
    schema: {
      example: {
        message: 'Password successfully reset'
      }
    }
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Invalid or expired reset token' 
  })
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Password changed successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Current password is incorrect' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid password format' })
  async changePassword(
    @Request() req,
    @Body() changePasswordDto: ChangePasswordDto
  ) {
    return await this.authService.changePassword(
      req.user.id,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword
    );
  }
} 