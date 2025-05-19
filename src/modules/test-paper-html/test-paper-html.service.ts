import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AwsS3Service } from '../aws/aws-s3.service';
import { TestPaperDto, ChapterWeightageDto, InstructionMediumPdfDto } from './dto/create-test-paper.dto';

@Injectable()
export class TestPaperHtmlService {
  private readonly logger = new Logger(TestPaperHtmlService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly awsS3Service: AwsS3Service,
  ) {}

  async createTestPaper(userId: number, schoolId: number, createTestPaperDto: TestPaperDto) {
    try {
      // Check if pattern exists
      const pattern = await this.prisma.pattern.findUnique({
        where: { id: createTestPaperDto.pattern_id },
      });

      if (!pattern) {
        throw new NotFoundException(`Pattern with ID ${createTestPaperDto.pattern_id} not found`);
      }

      // Create test paper with the origin type
      const testPaper = await this.prisma.test_Paper.create({
        data: {
          name: createTestPaperDto.name,
          exam_time: createTestPaperDto.exam_time,
          user: { connect: { id: userId } },
          school: { connect: { id: schoolId } },
          pattern: { connect: { id: createTestPaperDto.pattern_id } },
          test_paper_origin_type: createTestPaperDto.test_paper_origin_type,
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

  async getTestPapersByUserAndSchool(userId: number, schoolId: number) {
    try {
      const testPapers = await this.prisma.test_Paper.findMany({
        where: {
          user_id: userId,
          school_id: schoolId
        },
        include: {
          html_files: {
            include: {
              instruction_medium: true
            }
          },
          test_paper_chapters: {
            include: {
              chapter: true
            }
          },
          pattern: true,
          user: {
            select: {
              id: true,
              name: true,
              email_id: true
            }
          },
          school: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          created_at: 'desc' // Most recent first
        }
      });

      if (testPapers.length === 0) {
        throw new NotFoundException(`No test papers found for user ID ${userId} and school ID ${schoolId}`);
      }

      return testPapers;
    } catch (error) {
      this.logger.error(`Error fetching test papers for user ${userId} and school ${schoolId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getTestPaperFiles(testPaperId: number) {
    try {
      const testPaper = await this.prisma.test_Paper.findUnique({
        where: { id: testPaperId },
        include: {
          html_files: {
            include: {
              instruction_medium: true
            }
          },
          test_paper_chapters: {
            include: {
              chapter: true
            }
          },
          pattern: true,
          user: {
            select: {
              id: true,
              name: true,
              email_id: true
            }
          },
          school: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      if (!testPaper) {
        throw new NotFoundException(`Test paper with ID ${testPaperId} not found`);
      }
      
      // Generate presigned URLs for all HTML files
      if (testPaper.html_files && testPaper.html_files.length > 0) {
        for (const htmlFile of testPaper.html_files) {
          try {
            if (!htmlFile.content_url) {
              this.logger.warn(`HTML file ${htmlFile.id} has no content_url`);
              continue;
            }
            
            // Generate a presigned URL that expires in 1 hour (3600 seconds)
            const presignedUrl = await this.awsS3Service.generatePresignedUrl(htmlFile.content_url, 3600);
            
            // Add the presigned URL to the file object
            htmlFile['presigned_url'] = presignedUrl;
            
            // Update access count and last_accessed
            await this.prisma.hTML_File.update({
              where: { id: htmlFile.id },
              data: {
                access_count: { increment: 1 },
                last_accessed: new Date()
              }
            });
          } catch (error) {
            this.logger.error(`Error generating presigned URL for file ${htmlFile.id}: ${error.message}`);
            // Continue with other files even if this one fails
          }
        }
      }

      return testPaper;
    } catch (error) {
      this.logger.error(`Error fetching test paper with ID ${testPaperId}: ${error.message}`, error.stack);
      throw error;
    }
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
    try {
      // Find the HTML file
      const htmlFile = await this.prisma.hTML_File.findUnique({
        where: {
          test_paper_id_instruction_medium_id: {
            test_paper_id: testPaperId,
            instruction_medium_id: instructionMediumId
          }
        },
      });

      if (!htmlFile) {
        throw new NotFoundException(`HTML file not found for test paper ID ${testPaperId} and instruction medium ID ${instructionMediumId}`);
      }

      // Delete the file from S3
      await this.awsS3Service.deleteFile(htmlFile.content_url);

      // Delete the database record
      await this.prisma.hTML_File.delete({
        where: { id: htmlFile.id },
      });

      return { message: 'HTML file deleted successfully' };
    } catch (error) {
      this.logger.error(`Error deleting HTML file: ${error.message}`, error.stack);
      throw error;
    }
  }

  async deleteTestPaper(testPaperId: number) {
    try {
      // Find the test paper to check if it exists
      const testPaper = await this.prisma.test_Paper.findUnique({
        where: { id: testPaperId },
        include: {
          html_files: true,
          test_paper_chapters: true
        }
      });

      if (!testPaper) {
        throw new NotFoundException(`Test paper with ID ${testPaperId} not found`);
      }

      // Delete all associated files from S3
      for (const htmlFile of testPaper.html_files) {
        try {
          await this.awsS3Service.deleteFile(htmlFile.content_url);
        } catch (fileError) {
          this.logger.warn(`Could not delete file ${htmlFile.content_url} from storage: ${fileError.message}`);
          // Continue with other files even if one fails
        }
      }

      // Delete the test paper - this will cascade delete html_files and test_paper_chapters
      // thanks to the onDelete: Cascade relation in the Prisma schema
      await this.prisma.test_Paper.delete({
        where: { id: testPaperId }
      });

      return { 
        message: 'Test paper deleted successfully',
        deleted_files_count: testPaper.html_files.length,
        deleted_chapters_count: testPaper.test_paper_chapters.length
      };
    } catch (error) {
      this.logger.error(`Error deleting test paper: ${error.message}`, error.stack);
      throw error;
    }
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

  async createTestPaperWithContent(
    userId: number,
    schoolId: number,
    dto: TestPaperDto,
    files: Array<Express.Multer.File>,
  ) {
    try {
      // Check if pattern exists
      const pattern = await this.prisma.pattern.findUnique({
        where: { id: dto.pattern_id },
      });

      if (!pattern) {
        throw new NotFoundException(`Pattern with ID ${dto.pattern_id} not found`);
      }

      // Check if all instruction mediums exist
      if (!dto.instruction_mediums || dto.instruction_mediums.length === 0) {
        throw new BadRequestException('At least one valid instruction medium ID is required');
      }

      const foundMediums = await this.prisma.instruction_Medium.findMany({
        where: { id: { in: dto.instruction_mediums } },
      });

      if (foundMediums.length !== dto.instruction_mediums.length) {
        const foundIds = foundMediums.map(medium => medium.id);
        const missingIds = dto.instruction_mediums.filter(id => !foundIds.includes(id));
        throw new NotFoundException(`Instruction medium IDs not found: ${missingIds.join(', ')}`);
      }

      // Check if all chapters exist
      if (!dto.chapters || dto.chapters.length === 0) {
        throw new BadRequestException('At least one valid chapter ID is required');
      }

      // Validate that chapters and weightages arrays have the same length
      if (dto.chapters.length !== dto.weightages.length) {
        throw new BadRequestException(`Number of chapters (${dto.chapters.length}) does not match number of weightages (${dto.weightages.length})`);
      }

      const foundChapters = await this.prisma.chapter.findMany({
        where: { id: { in: dto.chapters } },
      });

      if (foundChapters.length !== dto.chapters.length) {
        const foundIds = foundChapters.map(chapter => chapter.id);
        const missingIds = dto.chapters.filter(id => !foundIds.includes(id));
        throw new NotFoundException(`Chapter IDs not found: ${missingIds.join(', ')}`);
      }

      // Parse exam time from human-readable format to HH:MM:SS
      const examTime = this.parseExamTime(dto.exam_time);

      // Create test paper
      const testPaper = await this.prisma.test_Paper.create({
        data: {
          name: dto.name,
          exam_time: examTime,
          user: { connect: { id: userId } },
          school: { connect: { id: schoolId } },
          pattern: { connect: { id: dto.pattern_id } },
          test_paper_origin_type: dto.test_paper_origin_type,
        },
      });

      // Create chapter weightages
      const chapterWeightages = await Promise.all(
        dto.chapters.map((chapterId, index) => 
          this.prisma.test_Paper_Chapter.create({
            data: {
              test_paper: { connect: { id: testPaper.id } },
              chapter: { connect: { id: chapterId } },
              weightage: dto.weightages[index],
            },
          })
        )
      );

      // Process each instruction medium with its corresponding HTML file
      const htmlFiles = await Promise.all(
        dto.instruction_mediums.map((mediumId, index) => {
          const file = files[index];
          if (!file) {
            throw new BadRequestException(`Missing file for instruction medium ID ${mediumId}`);
          }

          // Validate file content type
          if (!file.mimetype.includes('application/pdf') && !file.originalname.endsWith('.pdf')) {
            throw new BadRequestException(`File for instruction medium ID ${mediumId} must be PDF`);
          }

          // Generate filename
          const finalFilename = `test-paper-${testPaper.id}-medium-${mediumId}.pdf`;

          // First medium is always the default
          const isDefault = index === 0;

          return this.uploadAndCreateHtmlFile(
            testPaper.id,
            mediumId,
            file.buffer,
            finalFilename,
            isDefault
          );
        })
      );

      return {
        test_paper: testPaper,
        chapter_weightages: chapterWeightages,
        html_files: htmlFiles,
      };
    } catch (error) {
      this.logger.error(`Error creating test paper with content: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Helper function to upload HTML file to S3 and create a database record
   */
  private async uploadAndCreateHtmlFile(
    testPaperId: number,
    instructionMediumId: number,
    fileBuffer: Buffer,
    filename: string,
    isDefaultMedium?: boolean
  ) {
    // Upload to S3
    const uploadResult = await this.awsS3Service.uploadTestPaperContent(
      fileBuffer,
      filename,
      'application/pdf',
    );

    // Check if there are existing HTML files for this test paper
    const htmlFilesCount = await this.prisma.hTML_File.count({
      where: { test_paper_id: testPaperId }
    });

    // Create HTML file record
    return this.prisma.hTML_File.create({
      data: {
        test_paper: { connect: { id: testPaperId } },
        instruction_medium: { connect: { id: instructionMediumId } },
        content_url: uploadResult.url,
        file_size: uploadResult.metadata.fileSize,
        is_pdf: true,
        is_default_medium: isDefaultMedium !== undefined ? isDefaultMedium : htmlFilesCount === 0, // Mark as default if specified or if it's the first one
      },
    });
  }

  /**
   * Helper function to parse human-readable exam time into proper DateTime format for Prisma
   */
  private parseExamTime(examTimeStr: string): string {
    let hours = 0;
    let minutes = 0;
    
    // Extract hours
    const hoursMatch = examTimeStr.match(/(\d+)\s*hour/i);
    if (hoursMatch) {
      hours = parseInt(hoursMatch[1], 10);
    }
    
    // Extract minutes
    const minutesMatch = examTimeStr.match(/(\d+)\s*minute/i);
    if (minutesMatch) {
      minutes = parseInt(minutesMatch[1], 10);
    }
    
    // Create a base date for today at 00:00:00
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Add the hours and minutes to the base date
    today.setHours(today.getHours() + hours);
    today.setMinutes(today.getMinutes() + minutes);
    
    // Format as ISO-8601 DateTime string which Prisma expects
    return today.toISOString();
  }

  async getFilteredTestPapers(userId?: number, schoolId?: number) {
    try {
      // Build the filter object based on provided parameters
      const filterConditions: any = {};
      
      if (userId !== undefined) {
        filterConditions.user_id = userId;
      }
      
      if (schoolId !== undefined) {
        filterConditions.school_id = schoolId;
      }

      // Execute query with constructed filter
      const testPapers = await this.prisma.test_Paper.findMany({
        where: filterConditions,
        include: {
          html_files: {
            include: {
              instruction_medium: true
            }
          },
          test_paper_chapters: {
            include: {
              chapter: true
            }
          },
          pattern: true,
          user: {
            select: {
              id: true,
              name: true,
              email_id: true
            }
          },
          school: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          created_at: 'desc' // Most recent first
        }
      });

      if (testPapers.length === 0) {
        // Construct appropriate error message based on the filters applied
        let filterDesc = [];
        if (userId !== undefined) filterDesc.push(`user ID ${userId}`);
        if (schoolId !== undefined) filterDesc.push(`school ID ${schoolId}`);
        
        const errorMsg = filterDesc.length > 0 
          ? `No test papers found for ${filterDesc.join(' and ')}`
          : 'No test papers found';
        
        throw new NotFoundException(errorMsg);
      }
      
      // Generate presigned URLs for HTML files
      if (testPapers.length > 0) {
        for (const testPaper of testPapers) {
          if (testPaper.html_files && testPaper.html_files.length > 0) {
            for (const htmlFile of testPaper.html_files) {
              try {
                if (!htmlFile.content_url) {
                  this.logger.warn(`HTML file ${htmlFile.id} has no content_url`);
                  continue;
                }
                
                // Generate a presigned URL that expires in 1 hour (3600 seconds)
                const presignedUrl = await this.awsS3Service.generatePresignedUrl(htmlFile.content_url, 3600);
                
                // Add the presigned URL to the file object
                htmlFile['presigned_url'] = presignedUrl;
              } catch (error) {
                this.logger.error(`Error generating presigned URL for file ${htmlFile.id}: ${error.message}`);
                // Continue with other files even if this one fails
              }
            }
          }
        }
      }

      return testPapers;
    } catch (error) {
      this.logger.error(`Error fetching filtered test papers: ${error.message}`, error.stack);
      throw error;
    }
  }
} 