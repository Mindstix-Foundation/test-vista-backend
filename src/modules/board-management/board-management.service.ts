import { 
  Injectable, 
  Logger, 
  NotFoundException,
  InternalServerErrorException 
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BoardService } from '../board/board.service';
import { AddressService } from '../address/address.service';
import { InstructionMediumService } from '../instruction_medium/instruction-medium.service';
import { StandardService } from '../standard/standard.service';
import { SubjectService } from '../subject/subject.service';
import { CreateBoardManagementDto } from './dto/create-board-management.dto';
import { UpdateBoardManagementDto } from './dto/update-board-management.dto';
import { UpdateInstructionMediumWithIdDto, UpdateStandardWithIdDto, UpdateSubjectWithIdDto } from './dto/update-with-id.dto';
import { BoardManagementData } from './interfaces/board-management.interface';

@Injectable()
export class BoardManagementService {
  private readonly logger = new Logger(BoardManagementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly boardService: BoardService,
    private readonly addressService: AddressService,
    private readonly instructionMediumService: InstructionMediumService,
    private readonly standardService: StandardService,
    private readonly subjectService: SubjectService,
  ) {}

  async create(createDto: CreateBoardManagementDto): Promise<BoardManagementData> {
    return await this.prisma.$transaction(async (prisma) => {
      try {
        // Create address first
        const address = await this.addressService.create(createDto.address);

        // Create board with address
        const boardData = {
          ...createDto.board,
          address_id: address.id,
        };
        const board = await this.boardService.create(boardData);

        // Create instruction mediums
        const instructionMediums = await Promise.all(
          createDto.instructionMediums.map((medium) =>
            this.instructionMediumService.create({
              name: medium.name,
              board_id: board.id,
            }),
          ),
        );

        // Create standards
        const standards = await Promise.all(
          createDto.standards.map((standard) =>
            this.standardService.create({
              name: standard.name,
              board_id: board.id,
            }),
          ),
        );

        // Create subjects
        const subjects = await Promise.all(
          createDto.subjects.map((subject) =>
            this.subjectService.create({
              name: subject.name,
              board_id: board.id,
            }),
          ),
        );

        return {
          board,
          address,
          instruction_mediums: instructionMediums,
          standards,
          subjects,
        };
      } catch (error) {
        this.logger.error('Failed to create board management:', error);
        throw error;
      }
    });
  }

  async findAll(): Promise<BoardManagementData[]> {
    try {
      // Get all board IDs first with minimal data
      const boardsMinimal = await this.boardService.findAllWithoutPagination();
      
      // Then fetch complete data for each board individually
      return Promise.all(
        boardsMinimal.data.map(async (boardMinimal) => {
          // Get the complete board data with all fields
          const board = await this.boardService.findOne(boardMinimal.id);
          
          return {
            board,
            address: await this.addressService.findOne(board.address_id),
            instruction_mediums: await this.instructionMediumService.findByBoard(board.id),
            standards: await this.standardService.findByBoard(board.id),
            subjects: await this.subjectService.findByBoard(board.id),
          };
        })
      );
    } catch (error) {
      this.logger.error('Failed to fetch all boards:', error);
      throw new InternalServerErrorException('Failed to fetch all boards');
    }
  }

  async findOne(id: number): Promise<BoardManagementData> {
    try {
      const board = await this.boardService.findOne(id);
      if (!board) {
        throw new NotFoundException(`Board with ID ${id} not found`);
      }

      return {
        board,
        address: await this.addressService.findOne(board.address_id),
        instruction_mediums: await this.instructionMediumService.findByBoard(id),
        standards: await this.standardService.findByBoard(id),
        subjects: await this.subjectService.findByBoard(id),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to fetch board with ID ${id}:`, error);
      throw new InternalServerErrorException(`Failed to fetch board with ID ${id}`);
    }
  }

  async remove(id: number) {
    try {
      const board = await this.boardService.findOne(id);
      if (!board) {
        throw new NotFoundException(`Board with ID ${id} not found`);
      }

      await this.prisma.$transaction(async (prisma) => {
        // Delete all related entities first
        const mediumIds = (await this.instructionMediumService.findByBoard(id)).map(m => m.id);
        const standardIds = (await this.standardService.findByBoard(id)).map(s => s.id);
        const subjectIds = (await this.subjectService.findByBoard(id)).map(s => s.id);

        for (const mediumId of mediumIds) {
          await this.instructionMediumService.remove(mediumId);
        }
        for (const standardId of standardIds) {
          await this.standardService.remove(standardId);
        }
        for (const subjectId of subjectIds) {
          await this.subjectService.remove(subjectId);
        }

        // Delete the board
        await this.boardService.remove(id);

        // Delete the address
        await this.addressService.remove(board.address_id);
      });

      return { message: `Board with ID ${id} and all related entities deleted successfully` };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to delete board with ID ${id}:`, error);
      throw new InternalServerErrorException(`Failed to delete board with ID ${id}`);
    }
  }

  async update(id: number, updateDto: UpdateBoardManagementDto): Promise<BoardManagementData> {
    return await this.prisma.$transaction(async (prisma) => {
      try {
        // Get the existing board
        const existingBoard = await this.boardService.findOne(id);
        if (!existingBoard) {
          throw new NotFoundException(`Board with ID ${id} not found`);
        }

        // Update board if provided
        let updatedBoard = existingBoard;
        if (updateDto.board) {
          // Get the updated board with all fields
          updatedBoard = await this.boardService.update(id, updateDto.board);
          // No need to manually merge fields as findOne now returns properly structured data
        }

        // Update address if provided
        if (updateDto.address) {
          await this.addressService.update(existingBoard.address_id, updateDto.address);
        }

        // Update child entities
        await this.updateChildEntities(id, updateDto);

        // Return updated data
        return {
          board: updatedBoard,
          address: await this.addressService.findOne(existingBoard.address_id),
          instruction_mediums: await this.instructionMediumService.findByBoard(id),
          standards: await this.standardService.findByBoard(id),
          subjects: await this.subjectService.findByBoard(id),
        };
      } catch (error) {
        this.logger.error(`Failed to update board management with ID ${id}:`, error);
        throw error;
      }
    });
  }

  /**
   * Updates child entities (instruction mediums, standards, subjects) for a board
   */
  private async updateChildEntities(boardId: number, updateDto: UpdateBoardManagementDto): Promise<void> {
    // Update instruction mediums if provided
    if (updateDto.instructionMediums) {
      await Promise.all(
        updateDto.instructionMediums.map(async (medium: UpdateInstructionMediumWithIdDto) => {
          return medium.id
            ? this.instructionMediumService.update(medium.id, medium)
            : this.instructionMediumService.create({
                name: medium.name,
                board_id: boardId,
              });
        }),
      );
    }

    // Update standards if provided
    if (updateDto.standards) {
      await Promise.all(
        updateDto.standards.map(async (standard: UpdateStandardWithIdDto) => {
          return standard.id
            ? this.standardService.update(standard.id, standard)
            : this.standardService.create({
                name: standard.name,
                board_id: boardId,
              });
        }),
      );
    }

    // Update subjects if provided
    if (updateDto.subjects) {
      await Promise.all(
        updateDto.subjects.map(async (subject: UpdateSubjectWithIdDto) => {
          return subject.id
            ? this.subjectService.update(subject.id, subject)
            : this.subjectService.create({
                name: subject.name,
                board_id: boardId,
              });
        }),
      );
    }
  }

  private async getNextSequenceNumber(boardId: number): Promise<number> {
    const highestSequence = await this.prisma.standard.findFirst({
      where: { board_id: boardId },
      orderBy: { sequence_number: 'desc' },
      select: { sequence_number: true }
    });
    
    return highestSequence ? highestSequence.sequence_number + 1 : 0;
  }
} 