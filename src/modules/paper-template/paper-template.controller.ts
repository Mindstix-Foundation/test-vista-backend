import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaperTemplateService } from './paper-template.service';
import {
  CreatePaperTemplateDto,
  UpdatePaperTemplateDto,
  PaperTemplateFilterDto,
  CreateMockTestDto,
} from './dto/paper-template.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('paper-templates')
@Controller('paper-templates')
export class PaperTemplateController {
  constructor(private readonly service: PaperTemplateService) {}

  @Get('filter')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({
    summary: 'Filter paper templates by program/stage/delivery/marks/category',
    description: 'Generic replacement for /pattern-filter and /mcq-pattern-filter across all exam categories',
  })
  filter(@Query() filter: PaperTemplateFilterDto) {
    return this.service.filter(filter);
  }

  @Get('unique-marks')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Unique total_marks values for filtered templates' })
  uniqueMarks(@Query() filter: PaperTemplateFilterDto) {
    return this.service.uniqueMarks(filter);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Get paper template with sections and rules' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Create paper template with sections' })
  create(@Body() dto: CreatePaperTemplateDto) {
    return this.service.create(dto);
  }

  @Post('create-mock-test')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({
    summary: 'Create online mock test from a paper template (competitive/entrance)',
    description: 'Instantiates a Test_Paper with frozen questions drawn from the program syllabus. No school required.',
  })
  createMockTest(@Request() req, @Body() dto: CreateMockTestDto) {
    return this.service.createMockTest(req.user.id, dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Update paper template' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePaperTemplateDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete paper template' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
