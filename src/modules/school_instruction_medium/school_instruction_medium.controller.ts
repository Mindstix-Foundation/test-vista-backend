import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe, HttpStatus, HttpCode, Query, PipeTransform, Injectable, ArgumentMetadata, BadRequestException, UseGuards } from '@nestjs/common';
import { SchoolInstructionMediumService } from './school_instruction_medium.service';
import { CreateSchoolInstructionMediumDto } from './dto/school-instruction-medium.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Injectable()
class OptionalParseIntPipe implements PipeTransform<string | undefined, number | undefined> {
  transform(value: string | undefined, metadata: ArgumentMetadata): number | undefined {
    if (!value) return undefined;
    
    // Handle case when value is already a number
    if (typeof value === 'number') return value;
    
    // Handle string case
    if (typeof value === 'string' && value.trim() === '') return undefined;
    
    const val = parseInt(value);
    if (isNaN(val)) {
      throw new BadRequestException('Validation failed (numeric string is expected)');
    }
    return val;
  }
}

@ApiTags('school-instruction-mediums')
@Controller('school-instruction-mediums')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SchoolInstructionMediumController {
  constructor(private readonly service: SchoolInstructionMediumService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new school instruction medium mapping' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Successfully created' })
  async create(@Body() createDto: CreateSchoolInstructionMediumDto) {
    return await this.service.create(createDto);
  }

  @Get()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Get all school instruction medium mappings' })
  @ApiQuery({ name: 'instructionMediumId', required: false, type: Number })
  async findAll(
    @Query('instructionMediumId', new OptionalParseIntPipe()) instructionMediumId?: number
  ) {
    return await this.service.findAll(instructionMediumId);
  }

  @Get('school/:schoolId')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Get instruction mediums for a specific school' })
  async findBySchool(@Param('schoolId', ParseIntPipe) schoolId: number) {
    return await this.service.findBySchool(schoolId);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a school instruction medium mapping' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.service.remove(id);
  }
}
