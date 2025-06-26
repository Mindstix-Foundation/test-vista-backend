import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    // Log for debugging
    this.logger.debug(`Required roles: ${requiredRoles.join(', ')}`);
    this.logger.debug(`User roles: ${user.roles ? user.roles.join(', ') : 'none'}`);
    this.logger.debug(`User object:`, JSON.stringify(user, null, 2));

    if (!user || !user.roles) {
      this.logger.warn('User or user roles not found');
      return false;
    }

    const hasRole = requiredRoles.some((role) => user.roles.includes(role));
    this.logger.debug(`Access granted: ${hasRole}`);
    
    return hasRole;
  }
} 