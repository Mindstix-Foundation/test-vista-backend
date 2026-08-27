import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

const LOGIN_EMAIL_BODY_FIELD = 'email_id';
const LOGIN_CREDENTIAL_BODY_FIELD = 'password';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: LOGIN_EMAIL_BODY_FIELD,
      passwordField: LOGIN_CREDENTIAL_BODY_FIELD,
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