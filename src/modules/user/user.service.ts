import { 
  Injectable, 
  Logger, 
  NotFoundException, 
  ConflictException, 
  InternalServerErrorException, 
  BadRequestException,
  UnprocessableEntityException 
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { hash } from 'bcrypt';
import { Prisma } from '@prisma/client';
import { UserExistsException } from './exceptions/user-exists.exception';
import { toTitleCase } from '../../utils/titleCase';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateUserDto) {
    try {
      // Validate email format
      if (!this.isValidEmail(createDto.email_id)) {
        throw new BadRequestException('Invalid email format');
      }

      // Check for existing email
      const existingUser = await this.prisma.user.findUnique({
        where: { email_id: createDto.email_id }
      });

      if (existingUser) {
        throw new UserExistsException(createDto.email_id);
      }

      // Validate contact number
      if (!this.isValidContactNumber(createDto.contact_number)) {
        throw new BadRequestException('Contact number must be exactly 10 digits');
      }

      if (createDto.alternate_contact_number && 
          !this.isValidContactNumber(createDto.alternate_contact_number)) {
        throw new BadRequestException('Alternate contact number must be exactly 10 digits');
      }

      // Hash password
      const hashedPassword = await this.hashPassword(createDto.password);

      const user = await this.prisma.user.create({
        data: {
          ...createDto,
          name: toTitleCase(createDto.name),
          contact_number: BigInt(createDto.contact_number),
          alternate_contact_number: createDto.alternate_contact_number 
            ? BigInt(createDto.alternate_contact_number) 
            : null,
          password: hashedPassword
        },
        select: this.userSelect
      });

      return this.transformUser(user);
    } catch (error) {
      this.handleError(error, 'create user');
    }
  }

  async findAll(schoolId?: number) {
    try {
      const users = await this.prisma.user.findMany({
        where: schoolId ? {
          user_schools: { some: { school_id: schoolId } }
        } : undefined,
        select: this.userSelect
      });

      return users.map(user => this.transformUser(user));
    } catch (error) {
      this.handleError(error, 'fetch users');
    }
  }

  async findOne(id: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: {
          ...this.userSelect,
          user_schools: {
            include: { school: true }
          }
        }
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return this.transformUser(user);
    } catch (error) {
      this.handleError(error, `fetch user ${id}`);
    }
  }

  async update(id: number, updateDto: UpdateUserDto) {
    try {
      await this.findOne(id);

      if (updateDto.email_id) {
        if (!this.isValidEmail(updateDto.email_id)) {
          throw new BadRequestException('Invalid email format');
        }

        const existingUser = await this.prisma.user.findFirst({
          where: { 
            email_id: updateDto.email_id,
            NOT: { id }
          }
        });

        if (existingUser) {
          throw new UserExistsException(updateDto.email_id);
        }
      }

      if (updateDto.contact_number && !this.isValidContactNumber(updateDto.contact_number)) {
        throw new BadRequestException('Invalid contact number format');
      }

      if (updateDto.alternate_contact_number && 
          !this.isValidContactNumber(updateDto.alternate_contact_number)) {
        throw new BadRequestException('Invalid alternate contact number format');
      }

      const dataToUpdate: any = { 
        ...updateDto,
        name: updateDto.name ? toTitleCase(updateDto.name) : undefined,
        contact_number: updateDto.contact_number ? BigInt(updateDto.contact_number) : undefined,
        alternate_contact_number: updateDto.alternate_contact_number 
          ? BigInt(updateDto.alternate_contact_number) 
          : null
      };
      if (updateDto.password) {
        dataToUpdate.password = await this.hashPassword(updateDto.password);
      }

      const user = await this.prisma.user.update({
        where: { id },
        data: dataToUpdate,
        select: this.userSelect
      });

      return this.transformUser(user);
    } catch (error) {
      this.handleError(error, `update user ${id}`);
    }
  }

  async remove(id: number): Promise<void> {
    try {
      await this.findOne(id);

      // Check for related records
      const hasSchools = await this.prisma.user_School.count({
        where: { user_id: id }
      });

      if (hasSchools) {
        throw new UnprocessableEntityException(
          'Cannot delete user because they are associated with schools. Please remove school associations first.'
        );
      }

      await this.prisma.user.delete({
        where: { id }
      });
    } catch (error) {
      this.handleError(error, `delete user ${id}`);
    }
  }

  private readonly userSelect = {
    id: true,
    email_id: true,
    name: true,
    contact_number: true,
    alternate_contact_number: true,
    highest_qualification: true,
    status: true,
    created_at: true,
    updated_at: true
  };

  private transformUser(user: any) {
    return {
      ...user,
      contact_number: user.contact_number.toString(),
      alternate_contact_number: user.alternate_contact_number?.toString() || null
    };
  }

  private async hashPassword(password: string): Promise<string> {
    try {
      return await hash(password, 10);
    } catch (error) {
      this.logger.error('Failed to hash password:', error);
      throw new InternalServerErrorException('Failed to process password');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidContactNumber(number: string): boolean {
    return /^\d{10}$/.test(number);
  }

  private handleError(error: any, operation: string) {
    this.logger.error(`Failed to ${operation}:`, error);
    
    if (error instanceof NotFoundException || 
        error instanceof BadRequestException || 
        error instanceof ConflictException ||
        error instanceof UnprocessableEntityException ||
        error instanceof UserExistsException) {
      throw error;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException('User with this email already exists');
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
    }

    throw new InternalServerErrorException(`Failed to ${operation}`);
  }
} 