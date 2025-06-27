import { Module } from '@nestjs/common';
import { TestAssignmentController } from './test-assignment.controller';
import { TestAssignmentService } from './test-assignment.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [TestAssignmentController],
  providers: [TestAssignmentService, PrismaService],
  exports: [TestAssignmentService]
})
export class TestAssignmentModule {} 