import { Module } from '@nestjs/common';
import { UserSchoolService } from './user-school.service';
import { UserSchoolController } from './user-school.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UserSchoolController],
  providers: [UserSchoolService],
  exports: [UserSchoolService]
})
export class UserSchoolModule {} 