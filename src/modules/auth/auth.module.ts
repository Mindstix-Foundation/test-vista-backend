import { Module, forwardRef } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UserModule } from '../user/user.module';
import { RoleModule } from '../role/role.module';
import { RolesGuard } from './guards/roles.guard';
import { AuthenticatedGuard } from './guards/authenticated.guard';
import { PrismaModule } from '../../prisma/prisma.module';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';

@Module({
  imports: [
    forwardRef(() => UserModule),
    forwardRef(() => RoleModule),
    PassportModule,
    PrismaModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { 
          expiresIn: '510m' // 8.5 hours
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    JwtAuthGuard,
    LocalAuthGuard,
    RolesGuard,
    AuthenticatedGuard
  ],
  controllers: [AuthController],
  exports: [
    AuthService,
    JwtAuthGuard,
    LocalAuthGuard,
    RolesGuard,
    AuthenticatedGuard
  ]
})
export class AuthModule {} 