import { Injectable, Logger, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { RoleService } from '../role/role.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly roleService: RoleService,
    private readonly jwtService: JwtService,
    private prisma: PrismaService
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
    try {
      const blacklistedToken = await this.prisma.blacklisted_Token.findUnique({
        where: { token }
      });
      return !!blacklistedToken;
    } catch (error) {
      this.logger.error('Token blacklist check error:', error);
      return true; // Fail secure - treat errors as blacklisted
    }
  }
} 