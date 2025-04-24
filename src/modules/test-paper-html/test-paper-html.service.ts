import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AwsS3Service } from '../aws/aws-s3.service';
import { CreateTestPaperDto } from './dto/create-test-paper.dto';

@Injectable()
export class TestPaperHtmlService {
  private readonly logger = new Logger(TestPaperHtmlService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly awsS3Service: AwsS3Service,
  ) {}

  async createTestPaper(userId: number, schoolId: number, createTestPaperDto: CreateTestPaperDto) {
    try {
      // Check if pattern exists
      const pattern = await this.prisma.pattern.findUnique({
        where: { id: createTestPaperDto.pattern_id },
      });

      if (!pattern) {
        throw new NotFoundException(`Pattern with ID ${createTestPaperDto.pattern_id} not found`);
      }

      // Create test paper
      const testPaper = await this.prisma.test_Paper.create({
        data: {
          name: createTestPaperDto.name,
          exam_time: createTestPaperDto.exam_time,
          user: { connect: { id: userId } },
          school: { connect: { id: schoolId } },
          pattern: { connect: { id: createTestPaperDto.pattern_id } },
          test_paper_origin_id: createTestPaperDto.test_paper_origin_id,
        },
      });

      return testPaper;
    } catch (error) {
      this.logger.error(`Error creating test paper: ${error.message}`, error.stack);
      throw error;
    }
  }

  async uploadTestPaperHtml(
    testPaperId: number,
    htmlContent: string,
    filename: string,
    instructionMediumId: number,
  ) {
    try {
      // Check if test paper exists
      const testPaper = await this.prisma.test_Paper.findUnique({
        where: { id: testPaperId },
      });

      if (!testPaper) {
        throw new NotFoundException(`Test paper with ID ${testPaperId} not found`);
      }

      // Check if HTML file for this test paper and instruction medium already exists
      const existingHtml = await this.prisma.hTML_File.findUnique({
        where: { 
          test_paper_id_instruction_medium_id: {
            test_paper_id: testPaperId,
            instruction_medium_id: instructionMediumId
          }
        },
      });

      // Convert HTML string to Buffer
      const contentBuffer = Buffer.from(htmlContent, 'utf-8');
      
      // Upload to S3
      const uploadResult = await this.awsS3Service.uploadTestPaperContent(
        contentBuffer,
        filename,
        'text/html',
      );

      // Create or update the HTML file record
      if (existingHtml) {
        // If HTML already exists, update it and delete the old file from S3
        await this.awsS3Service.deleteFile(existingHtml.content_url);
        
        return await this.prisma.hTML_File.update({
          where: { id: existingHtml.id },
          data: {
            content_url: uploadResult.url,
            file_size: uploadResult.metadata.fileSize,
            is_pdf: false,
            updated_at: new Date(),
            version: { increment: 1 }, // Increment version number
          },
        });
      } else {
        // Check if this is the first HTML file for this test paper
        const htmlFilesCount = await this.prisma.hTML_File.count({
          where: { test_paper_id: testPaperId }
        });

        // Create new record
        return await this.prisma.hTML_File.create({
          data: {
            test_paper: { connect: { id: testPaperId } },
            instruction_medium: { connect: { id: instructionMediumId } },
            content_url: uploadResult.url,
            file_size: uploadResult.metadata.fileSize,
            is_pdf: false,
            is_default_medium: htmlFilesCount === 0 // Mark as default if it's the first one
          },
        });
      }
    } catch (error) {
      this.logger.error(`Error uploading test paper HTML: ${error.message}`, error.stack);
      throw error;
    }
  }

  async uploadTestPaperPdf(
    testPaperId: number,
    pdfContent: Buffer,
    filename: string,
    instructionMediumId: number,
  ) {
    try {
      // Check if test paper exists
      const testPaper = await this.prisma.test_Paper.findUnique({
        where: { id: testPaperId },
      });

      if (!testPaper) {
        throw new NotFoundException(`Test paper with ID ${testPaperId} not found`);
      }

      // Check if HTML file for this test paper and instruction medium already exists
      const existingFile = await this.prisma.hTML_File.findUnique({
        where: { 
          test_paper_id_instruction_medium_id: {
            test_paper_id: testPaperId,
            instruction_medium_id: instructionMediumId
          }
        },
      });
      
      // Upload to S3
      const uploadResult = await this.awsS3Service.uploadTestPaperContent(
        pdfContent,
        filename,
        'application/pdf',
      );

      // Create or update the HTML file record
      if (existingFile) {
        // If record already exists, update it and delete the old file from S3
        await this.awsS3Service.deleteFile(existingFile.content_url);
        
        return await this.prisma.hTML_File.update({
          where: { id: existingFile.id },
          data: {
            content_url: uploadResult.url,
            file_size: uploadResult.metadata.fileSize,
            is_pdf: true,
            updated_at: new Date(),
            version: { increment: 1 }, // Increment version number
          },
        });
      } else {
        // Check if this is the first HTML file for this test paper
        const htmlFilesCount = await this.prisma.hTML_File.count({
          where: { test_paper_id: testPaperId }
        });

        // Create new record
        return await this.prisma.hTML_File.create({
          data: {
            test_paper: { connect: { id: testPaperId } },
            instruction_medium: { connect: { id: instructionMediumId } },
            content_url: uploadResult.url,
            file_size: uploadResult.metadata.fileSize,
            is_pdf: true,
            is_default_medium: htmlFilesCount === 0 // Mark as default if it's the first one
          },
        });
      }
    } catch (error) {
      this.logger.error(`Error uploading test paper PDF: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getTestPaperFiles(testPaperId: number) {
    const testPaper = await this.prisma.test_Paper.findUnique({
      where: { id: testPaperId },
      include: {
        html_files: {
          include: {
            instruction_medium: true
          }
        }
      }
    });

    if (!testPaper) {
      throw new NotFoundException(`Test paper with ID ${testPaperId} not found`);
    }

    return testPaper;
  }

  async getTestPaperFile(testPaperId: number, instructionMediumId: number) {
    const htmlFile = await this.prisma.hTML_File.findUnique({
      where: { 
        test_paper_id_instruction_medium_id: {
          test_paper_id: testPaperId,
          instruction_medium_id: instructionMediumId
        }
      },
      include: {
        instruction_medium: true
      }
    });

    if (!htmlFile) {
      throw new NotFoundException(`File for test paper ID ${testPaperId} with instruction medium ID ${instructionMediumId} not found`);
    }

    // Update access count and last_accessed
    await this.prisma.hTML_File.update({
      where: { id: htmlFile.id },
      data: {
        access_count: { increment: 1 },
        last_accessed: new Date()
      }
    });

    return htmlFile;
  }

  async deleteTestPaperFile(testPaperId: number, instructionMediumId: number) {
    const htmlFile = await this.prisma.hTML_File.findUnique({
      where: { 
        test_paper_id_instruction_medium_id: {
          test_paper_id: testPaperId,
          instruction_medium_id: instructionMediumId
        }
      }
    });

    if (!htmlFile) {
      throw new NotFoundException(`File for test paper ID ${testPaperId} with instruction medium ID ${instructionMediumId} not found`);
    }

    // Delete file from S3
    await this.awsS3Service.deleteFile(htmlFile.content_url);

    // Delete record from database
    return await this.prisma.hTML_File.delete({
      where: { id: htmlFile.id },
    });
  }

  async setDefaultMedium(testPaperId: number, instructionMediumId: number) {
    // First check if the file exists
    const htmlFile = await this.prisma.hTML_File.findUnique({
      where: { 
        test_paper_id_instruction_medium_id: {
          test_paper_id: testPaperId,
          instruction_medium_id: instructionMediumId
        }
      }
    });

    if (!htmlFile) {
      throw new NotFoundException(`File for test paper ID ${testPaperId} with instruction medium ID ${instructionMediumId} not found`);
    }

    // Clear any existing default
    await this.prisma.hTML_File.updateMany({
      where: { test_paper_id: testPaperId },
      data: { is_default_medium: false }
    });

    // Set the new default
    return await this.prisma.hTML_File.update({
      where: { id: htmlFile.id },
      data: { is_default_medium: true }
    });
  }
} 