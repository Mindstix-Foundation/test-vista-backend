import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ItiMocktestController } from './iti-mocktest.controller';
import { ItiMocktestService } from './iti-mocktest.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET || 'your-secret-key',
        signOptions: { expiresIn: '24h' },
      }),
    }),
  ],
  controllers: [ItiMocktestController],
  providers: [ItiMocktestService],
  exports: [ItiMocktestService],
})
export class ItiMocktestModule {} 