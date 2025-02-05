import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RoleService {
  private readonly logger = new Logger(RoleService.name);

  constructor(private prisma: PrismaService) {}

  async findAll() {
    try {
      return await this.prisma.role.findMany({
        select: {
          id: true,
          role_name: true
        }
      });
    } catch (error) {
      this.logger.error('Failed to fetch roles:', error);
      throw error;
    }
  }

  async findOne(id: number) {
    try {
      const role = await this.prisma.role.findUnique({
        where: { id },
        select: {
          id: true,
          role_name: true,
          user_roles: {
            select: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email_id: true
                }
              }
            }
          }
        }
      });

      if (!role) {
        throw new NotFoundException(`Role with ID ${id} not found`);
      }

      return {
        ...role,
        users: role.user_roles.map(ur => ur.user)
      };
    } catch (error) {
      this.logger.error(`Failed to fetch role ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw error;
    }
  }
} 