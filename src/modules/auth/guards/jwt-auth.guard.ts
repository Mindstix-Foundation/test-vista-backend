import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Inject,
  forwardRef
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../auth.service';

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
      // Get the request
      const request = context.switchToHttp().getRequest();
      
      // Extract token
      const token = this.extractTokenFromHeader(request);
      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      // Check if token is blacklisted
      const isBlacklisted = await this.authService?.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been invalidated');
      }

      // Validate JWT token
      const isValid = await super.canActivate(context);
      if (!isValid) {
        throw new UnauthorizedException('Invalid token');
      }

      return true;
    } catch (error) {
      this.handleError(error);
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private handleError(error: any) {
    if (error instanceof UnauthorizedException) {
      throw error;
    }
    throw new UnauthorizedException('Invalid token or session expired');
  }
} 