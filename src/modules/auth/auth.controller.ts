import { Controller, Post, UseGuards, Request, Body, Get, HttpStatus, HttpCode, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
            roles: result.roles
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
    return {
      statusCode: HttpStatus.OK,
      data: req.user
    };
  }
} 