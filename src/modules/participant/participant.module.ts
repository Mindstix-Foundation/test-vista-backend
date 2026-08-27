import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ParticipantService } from './participant.service';
import { ParticipantController } from './participant.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { InstitutionModule } from '../institution/institution.module';

@Module({
  imports: [
    PrismaModule,
    InstitutionModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET || 'your-secret-key',
        signOptions: { expiresIn: '24h' },
      }),
    }),
  ],
  controllers: [ParticipantController],
  providers: [ParticipantService],
  exports: [ParticipantService],
})
export class ParticipantModule {}
