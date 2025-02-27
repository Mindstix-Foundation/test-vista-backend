import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../auth.service';
import { Request } from 'express';
import { Inject, forwardRef } from '@nestjs/common';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // First run the default JWT guard
      const isJwtValid = await super.canActivate(context) as boolean;
      if (!isJwtValid) {
        return false;
      }

      // Then check if token is blacklisted
      const request = context.switchToHttp().getRequest();
      const token = this.extractTokenFromHeader(request);
      
      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      const isBlacklisted = await this.authService?.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been invalidated');
      }

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token or session expired');
    }
  }

  private extractTokenFromHeader(request: Request): string {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
} 