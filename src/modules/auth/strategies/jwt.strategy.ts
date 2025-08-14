import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    if (!payload) {
      throw new UnauthorizedException('Invalid token payload');
    }

    this.logger.debug('JWT payload:', JSON.stringify(payload, null, 2));

    // Load full user data including student profile if applicable
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email_id: true,
        name: true,
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
        student: {
          select: {
            id: true,
            student_id: true,
            school_standard_id: true,
            school_standard: {
              select: {
                id: true,
                school: {
                  select: {
                    id: true,
                    name: true
                  }
                },
                standard: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      this.logger.warn(`User not found for ID: ${payload.sub}`);
      throw new UnauthorizedException('User not found');
    }

    const userRoles = user.user_roles.map(ur => ur.role.role_name);
    this.logger.debug(`User found: ${user.email_id}, Roles: ${userRoles.join(', ')}, Student: ${user.student ? 'Yes' : 'No'}`);

    return {
      id: user.id,
      email_id: user.email_id,
      name: user.name,
      roles: userRoles,
      student: user.student
    };
  }
} 