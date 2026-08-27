import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { StudentGroupController } from './student-group.controller';
import { StudentGroupService } from './student-group.service';

@Module({
  imports: [PrismaModule],
  controllers: [StudentGroupController],
  providers: [StudentGroupService],
  exports: [StudentGroupService],
})
export class StudentGroupModule {}
