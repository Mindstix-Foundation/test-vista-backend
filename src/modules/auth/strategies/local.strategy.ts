import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email_id',
      passwordField: 'password',
    });
  }

  async validate(email_id: string, password: string): Promise<any> {
    try {
      const user = await this.authService.validateUser(email_id, password);
      if (!user) {
        throw new UnauthorizedException('Invalid email or password');
      }
      return user;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(
        error.message || 'Authentication failed. Please try again.'
      );
    }
  }
} 