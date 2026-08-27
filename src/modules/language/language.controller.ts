import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LanguageService } from './language.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('languages')
@Controller('languages')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class LanguageController {
  constructor(private readonly languageService: LanguageService) {}

  @Get()
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({
    summary: 'List global exam languages (unique English, Hindi, Marathi…)',
    description:
      'Used by competitive/entrance Question Bank. Each language exposes a canonical instruction_medium_id for translation APIs.',
  })
  findAll() {
    return this.languageService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Get language by id' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.languageService.findOne(id);
  }
}
