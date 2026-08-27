import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const PLATFORM_BOARD_ABBR = 'PLAT-LANG';
const PLATFORM_BOARD_NAME = 'Platform Languages';

@Injectable()
export class LanguageService implements OnModuleInit {
  private readonly logger = new Logger(LanguageService.name);
  private ensurePromise: Promise<void> | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      await this.ensurePlatformMediums();
    } catch (error) {
      this.logger.warn(
        `Language platform medium bootstrap deferred: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  /** Active languages with canonical instruction_medium_id for QTTM / translations. */
  async findAll() {
    await this.ensurePlatformMediums();
    return this.prisma.language.findMany({
      where: { is_active: true },
      orderBy: { sequence_number: 'asc' },
      include: {
        instruction_medium: {
          select: { id: true, instruction_medium: true, board_id: true },
        },
      },
    });
  }

  async findOne(id: number) {
    await this.ensurePlatformMediums();
    const language = await this.prisma.language.findUnique({
      where: { id },
      include: {
        instruction_medium: {
          select: { id: true, instruction_medium: true, board_id: true },
        },
      },
    });
    if (!language) {
      throw new NotFoundException(`Language ${id} not found`);
    }
    return language;
  }

  /**
   * Ensures each Language has a platform Instruction_Medium so existing
   * translation APIs (instruction_medium_id) keep working for exam questions.
   */
  async ensurePlatformMediums(): Promise<void> {
    this.ensurePromise ??= this.doEnsurePlatformMediums().catch((error) => {
      this.ensurePromise = null;
      throw error;
    });
    return this.ensurePromise;
  }

  private async doEnsurePlatformMediums(): Promise<void> {
    const languages = await this.prisma.language.findMany({
      orderBy: { sequence_number: 'asc' },
    });
    if (!languages.length) {
      this.logger.warn('No Language rows found; run migration 20260710110000_exam_languages');
      return;
    }

    const needsMedium = languages.some((l) => !l.instruction_medium_id);
    if (!needsMedium) return;

    const board = await this.ensurePlatformBoard();

    for (const language of languages) {
      if (language.instruction_medium_id) continue;

      let medium = await this.prisma.instruction_Medium.findFirst({
        where: {
          board_id: board.id,
          instruction_medium: language.name,
        },
      });

      if (!medium) {
        medium = await this.prisma.instruction_Medium.create({
          data: {
            board_id: board.id,
            instruction_medium: language.name,
            language_id: language.id,
          },
        });
      } else if (!medium.language_id) {
        medium = await this.prisma.instruction_Medium.update({
          where: { id: medium.id },
          data: { language_id: language.id },
        });
      }

      await this.prisma.language.update({
        where: { id: language.id },
        data: { instruction_medium_id: medium.id },
      });

      this.logger.log(
        `Linked language ${language.code} → instruction_medium ${medium.id}`,
      );
    }
  }

  private async ensurePlatformBoard() {
    const existing = await this.prisma.board.findUnique({
      where: { abbreviation: PLATFORM_BOARD_ABBR },
    });
    if (existing) return existing;

    // Minimal address for the platform board (required by schema)
    let country = await this.prisma.country.findFirst({
      where: { name: 'India' },
    });
    if (!country) {
      country = await this.prisma.country.create({ data: { name: 'India' } });
    }

    let state = await this.prisma.state.findFirst({
      where: { country_id: country.id, name: 'Maharashtra' },
    });
    if (!state) {
      state = await this.prisma.state.create({
        data: { country_id: country.id, name: 'Maharashtra' },
      });
    }

    let city = await this.prisma.city.findFirst({
      where: { state_id: state.id, name: 'Pune' },
    });
    if (!city) {
      city = await this.prisma.city.create({
        data: { state_id: state.id, name: 'Pune' },
      });
    }

    const address = await this.prisma.address.create({
      data: {
        city_id: city.id,
        postal_code: '000000',
        street: 'Platform Languages (system)',
      },
    });

    return this.prisma.board.create({
      data: {
        name: PLATFORM_BOARD_NAME,
        abbreviation: PLATFORM_BOARD_ABBR,
        address_id: address.id,
      },
    });
  }
}
