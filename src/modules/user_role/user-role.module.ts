import { Module } from '@nestjs/common';
import { UserRoleService } from './user-role.service';
import { UserRoleController } from './user-role.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UserRoleController],
  providers: [UserRoleService],
  exports: [UserRoleService]
})
export class UserRoleModule {} 