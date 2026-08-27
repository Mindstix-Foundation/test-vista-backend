import { Module } from '@nestjs/common';
import { SyllabusService } from './syllabus.service';
import { SyllabusBridgeService } from './syllabus-bridge.service';
import { SyllabusController } from './syllabus.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SyllabusController],
  providers: [SyllabusService, SyllabusBridgeService],
  exports: [SyllabusService, SyllabusBridgeService],
})
export class SyllabusModule {}
