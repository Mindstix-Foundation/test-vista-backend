import { Module } from '@nestjs/common';
import { BoardManagementController } from './board-management.controller';
import { BoardManagementService } from './board-management.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { StandardModule } from '../standard/standard.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    StandardModule,
  ],
  controllers: [BoardManagementController],
  providers: [BoardManagementService],
})
export class BoardManagementModule {}
