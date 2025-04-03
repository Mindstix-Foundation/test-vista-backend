import { Injectable, Logger, NotFoundException, InternalServerErrorException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuestionDto, UpdateQuestionDto, QuestionFilterDto, QuestionSortField, ComplexCreateQuestionDto, CompleteQuestionDto, EditCompleteQuestionDto, RemoveQuestionFromChapterDto, AddTranslationDto } from './dto/question.dto';
import { SortOrder } from '../../common/dto/pagination.dto';
import { Prisma } from '@prisma/client';
import { AwsS3Service } from '../aws/aws-s3.service';

interface QuestionFilters {
  question_type_id?: number;
  topic_id?: number;
  chapter_id?: number;
  page?: number;
  page_size?: number;
  sort_by?: QuestionSortField;
  sort_order?: SortOrder;
  search?: string;
  board_question?: boolean;
  instruction_medium_id?: number;
  is_verified?: boolean;
  translation_status?: string;
}

@Injectable()
export class QuestionService {
  private readonly logger = new Logger(QuestionService.name);

  /**
   * Question and Image Management Strategy
   * 
   * This service implements a file hash comparison approach for handling questions with images:
   * 
   * 1. Questions with the same text content but different images are treated as distinct questions
   * 2. Image uniqueness is determined by comparing image_ids, which are guaranteed to be unique
   * 3. The approach considers two scenarios for image differences:
   *    - One question has an image while the other doesn't
   *    - Both questions have images but with different image_ids
   * 
   * This strategy ensures that educational content with different visual representations
   * is properly managed even when the text content is identical. This is crucial for
   * subjects where the same concept may need different visual explanations.
   * 
   * The implementation is efficient as it:
   * - Doesn't require computing cryptographic hashes of image files
   * - Uses existing database constraints and relationships
   * - Minimizes storage requirements while preserving content distinctions
   */
  constructor(
    private readonly prisma: PrismaService,
    private readonly awsS3Service: AwsS3Service
  ) {}

  // Helper method to transform image data with presigned URLs
  private async transformImageData(image) {
    if (!image) return null;
    
    // Deep clone to avoid mutation
    const imageData = { ...image };
    
    // If no image_url, return the image data as is
    if (!imageData.image_url) {
      this.logger.warn(`Image ${imageData.id} has no image_url`);
      return imageData;
    }
    
    try {
      // Generate presigned URL with 1-hour expiration
      const presignedUrl = await this.awsS3Service.generatePresignedUrl(imageData.image_url, 3600);
      
      // Remove the original URL and add the presigned URL
      const { image_url, ...restImageData } = imageData;
      
      this.logger.debug(`Generated presigned URL for image ${imageData.id}, expires in 1 hour`);
      
      return {
        ...restImageData,
        presigned_url: presignedUrl
      };
    } catch (error) {
      this.logger.error(`Failed to generate presigned URL for image ${imageData.id}:`, error);
      
      // Remove image_url to avoid exposing the direct S3 URL
      const { image_url, ...restImageData } = imageData;
      
      // Return the image data without the URL
      return restImageData;
    }
  }

  // Helper method to apply transformations to question results
  private async transformQuestionResults(questions) {
    if (Array.isArray(questions)) {
      return Promise.all(questions.map(question => this.transformSingleQuestion(question)));
    }
    return this.transformSingleQuestion(questions);
  }

  // Transform a single question and all its nested images
  private async transformSingleQuestion(question) {
    if (!question) return null;
    
    // Clone the question to avoid mutating the original
    const result = { ...question };
    
    // Process question texts and their images
    if (result.question_texts && result.question_texts.length > 0) {
      result.question_texts = await Promise.all(result.question_texts.map(async (text) => {
        if (!text) return null;
        
        // Deep clone to avoid mutation
        const textResult = { ...text };
        
        // IMPORTANT: Preserve the topic information during transformation
        // This ensures topic data isn't lost during image transformation
        if (textResult.topic) {
          this.logger.log(`Preserving topic info for question ${result.id}, text ${textResult.id}: ${JSON.stringify(textResult.topic)}`);
        }
        
        // Transform main image
        if (textResult.image) {
          textResult.image = await this.transformImageData(textResult.image);
          // Log for debugging
          this.logger.debug(`Transformed image ${textResult.image?.id} for question text ${textResult.id}`);
        }
        
        // Transform MCQ option images
        if (textResult.mcq_options && textResult.mcq_options.length > 0) {
          textResult.mcq_options = await Promise.all(textResult.mcq_options.map(async (option) => {
            if (!option) return null;
            
            const optionResult = { ...option };
            if (optionResult.image) {
              optionResult.image = await this.transformImageData(optionResult.image);
              // Log for debugging
              this.logger.debug(`Transformed image ${optionResult.image?.id} for MCQ option ${optionResult.id}`);
            }
            return optionResult;
          }));
        }
        
        // Transform match pair images
        if (textResult.match_pairs && textResult.match_pairs.length > 0) {
          textResult.match_pairs = await Promise.all(textResult.match_pairs.map(async (pair) => {
            if (!pair) return null;
            
            const pairResult = { ...pair };
            if (pairResult.left_image) {
              pairResult.left_image = await this.transformImageData(pairResult.left_image);
              // Log for debugging
              this.logger.debug(`Transformed left image ${pairResult.left_image?.id} for match pair ${pairResult.id}`);
            }
            if (pairResult.right_image) {
              pairResult.right_image = await this.transformImageData(pairResult.right_image);
              // Log for debugging
              this.logger.debug(`Transformed right image ${pairResult.right_image?.id} for match pair ${pairResult.id}`);
            }
            return pairResult;
          }));
        }
        
        return textResult;
      }));
    }
    
    return result;
  }

  async create(createDto: CreateQuestionDto) {
    try {
      // Verify question type exists
      const questionType = await this.prisma.question_Type.findUnique({
        where: { id: createDto.question_type_id }
      });

      if (!questionType) {
        throw new NotFoundException(`Question type with ID ${createDto.question_type_id} not found`);
      }

      const question = await this.prisma.question.create({
        data: createDto,
        include: {
          question_type: true,
          question_texts: {
            include: {
              image: true,
              mcq_options: {
                include: {
                  image: true
                }
              },
              match_pairs: {
                include: {
                  left_image: true,
                  right_image: true
                }
              }
            }
          },
          question_topics: {
            include: {
              topic: true
            }
          }
        }
      });

      // Transform question to include presigned URLs
      return await this.transformSingleQuestion(question);
    } catch (error) {
      this.logger.error('Failed to create question:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create question');
    }
  }

  async findAll(filters: QuestionFilterDto) {
    try {
      const {
        question_type_id,
        topic_id,
        chapter_id,
        board_question,
        instruction_medium_id,
        page = 1,
        page_size = 10,
        sort_by = QuestionSortField.CREATED_AT,
        sort_order = SortOrder.DESC,
        search,
        is_verified,
        translation_status
      } = filters;

      // Add enhanced debugging
      this.logger.log(`ENHANCED DEBUG - findAll called with params:
        - instruction_medium_id: ${instruction_medium_id} (${typeof instruction_medium_id})
        - is_verified: ${is_verified} (${typeof is_verified})
        - chapter_id: ${chapter_id} (${typeof chapter_id})
        - topic_id: ${topic_id} (${typeof topic_id})
        - question_type_id: ${question_type_id} (${typeof question_type_id})
        - board_question: ${board_question} (${typeof board_question})
        - translation_status: ${translation_status} (${typeof translation_status})
        - page: ${page}, page_size: ${page_size}
        - sort_by: ${sort_by}, sort_order: ${sort_order}
        - search: ${search}
      `);

      // Build the where conditions
      const whereConditions: any = {};

      // Basic filters
      if (question_type_id !== undefined) {
        whereConditions.question_type_id = question_type_id;
      }

      if (board_question !== undefined) {
        whereConditions.board_question = board_question;
      }

      // Topic filter - handle both direct topic_id and chapter_id
      if (topic_id !== undefined || chapter_id !== undefined) {
        // Start with empty topic conditions
        const topicConditions: any = {};

        // If we have a specific topic_id, use it
        if (topic_id !== undefined) {
          topicConditions.topic_id = topic_id;
        }

        // If we have a chapter_id, add topic.chapter_id condition
        if (chapter_id !== undefined) {
          topicConditions.topic = {
            chapter_id
          };
        }

        // Add to where conditions
        whereConditions.question_topics = {
          some: topicConditions
        };
      }

      // Build question_texts filter for medium, verification, and search
      let questionTextsFilter: any = undefined;

      if (instruction_medium_id !== undefined || is_verified !== undefined || translation_status !== undefined || search) {
        questionTextsFilter = {
          some: {} // Start with empty condition
        };

        // Medium & verification filter - need to go through question_text_topics
        const qttConditions: any = {};
        let hasQttConditions = false;

        if (instruction_medium_id !== undefined) {
          qttConditions.instruction_medium_id = instruction_medium_id;
          hasQttConditions = true;
        }

        if (is_verified !== undefined) {
          qttConditions.is_verified = is_verified;
          hasQttConditions = true;
        }

        if (translation_status !== undefined) {
          qttConditions.translation_status = translation_status;
          hasQttConditions = true;
        }

        // Only add question_text_topics conditions if we have any
        if (hasQttConditions) {
          questionTextsFilter.some.question_text_topics = {
            some: qttConditions
          };
        }

        // Search filter
        if (search) {
          questionTextsFilter.some.question_text = {
            contains: search,
            mode: 'insensitive' as const
          };
        }

        // Add to where conditions if we have any question_texts conditions
        whereConditions.question_texts = questionTextsFilter;
      }

      // Debug log the constructed query
      this.logger.log(`ENHANCED DEBUG - Constructed query conditions: ${JSON.stringify(whereConditions, null, 2)}`);

      // First, count total questions matching the criteria without pagination
      // This will tell us if there are matching records even if pagination logic has issues
      const totalQuestions = await this.prisma.question.count({
        where: whereConditions
      });

      this.logger.log(`ENHANCED DEBUG - Total matching questions before pagination: ${totalQuestions}`);

      // Early check - if no matching questions, return empty result immediately
      if (totalQuestions === 0) {
        this.logger.log('ENHANCED DEBUG - No matching questions found in count query');
        return {
          data: [],
          pagination: {
            total: 0,
            page,
            page_size,
            total_pages: 0
          }
        };
      }

      // If we reach here, there are matching records according to count query
      // Continue with normal query to fetch actual data

      // Handle sorting: map sort_by to actual DB field
      const orderBy: any = {};
      
      if (sort_by === QuestionSortField.CREATED_AT) {
        // Sort by question_text's created_at field
        orderBy.created_at = sort_order;
      } else if (sort_by === QuestionSortField.UPDATED_AT) {
        // Sort by question_text's updated_at field
        orderBy.updated_at = sort_order;
      } else if (sort_by === QuestionSortField.QUESTION_TYPE) {
        // Sort by question type - first by type name through the relation
        orderBy.question_type = {
          type_name: sort_order
        };
      } else if (sort_by === QuestionSortField.QUESTION_TEXT) {
        // Sort by first question text in question_texts
        orderBy.created_at = sort_order; // Fallback to sort by creation date
      } else {
        // Default sort by creation date of question
        orderBy.created_at = SortOrder.DESC;
      }

      // Log the order by clause for debugging
      this.logger.log(`Sorting with: ${JSON.stringify(orderBy)}`);

      // Pagination
      const skip = (page - 1) * page_size;
      const take = page_size;

      // Query data with pagination
      const questions = await this.prisma.question.findMany({
        where: whereConditions,
        orderBy,
        skip,
        take,
        include: {
          question_type: true,
          question_texts: {
            include: {
              image: true,
              mcq_options: {
                include: {
                  image: true
                }
              },
              match_pairs: {
                include: {
                  left_image: true,
                  right_image: true
                }
              },
              question_text_topics: {
                include: {
                  instruction_medium: true,
                  question_topic: {
                    include: {
                      topic: true
                    }
                  }
                }
              }
            }
          },
          question_topics: {
            include: {
              topic: true
            }
          }
        }
      });
      
      // Log detailed information about all questions to help debug topic information
      questions.forEach(question => {
        this.logger.log(`Debug data for question ID ${question.id}:
          - Question type: ${question.question_type?.type_name || 'unknown'}
          - Question has ${question.question_topics?.length || 0} topics
          - Question topics: ${JSON.stringify(question.question_topics?.map(qt => ({
            id: qt.id,
            topic_id: qt.topic_id,
            topic_name: qt.topic?.name
          })))}
          - Question has ${question.question_texts?.length || 0} texts
          ${question.question_texts?.map(text => 
            `- Text ID ${text.id}: "${text.question_text.substring(0, 20)}..."
             - Has ${text.question_text_topics?.length || 0} text-topic associations
             - Text-topic associations: ${JSON.stringify(text.question_text_topics?.map(qttm => ({
                id: qttm.id,
                question_topic_id: qttm.question_topic_id,
                medium_id: qttm.instruction_medium_id,
                has_topic: qttm.question_topic?.topic != null,
                topic_name: qttm.question_topic?.topic?.name
              })))}`
          ).join('\n')}
        `);
      });
      
      // Post-processing: Map question texts to include translation_status directly
      const processedQuestions = questions.map(question => {
        // Clone the question to avoid modifying the original
        const processedQuestion = { ...question };
        
        // Process each question text to add translation_status
        if (processedQuestion.question_texts) {
          processedQuestion.question_texts = processedQuestion.question_texts.map(text => {
            // Get the translation status from question_text_topics
            // Use explicit type casting to resolve TypeScript errors
            const textWithStatus: any = { ...text };
            if (textWithStatus.question_text_topics && textWithStatus.question_text_topics.length > 0) {
              textWithStatus.translation_status = textWithStatus.question_text_topics[0].translation_status || 'original';
              
              // Format topic information if available from question_text_topics
              if (textWithStatus.question_text_topics[0].question_topic?.topic) {
                const topicData = textWithStatus.question_text_topics[0].question_topic.topic;
                textWithStatus.topic = {
                  id: topicData.id,
                  name: topicData.name,
                  chapter_id: topicData.chapter_id
                };
                this.logger.log(`Service: Found topic in text-topic for question ${question.id}, text ${textWithStatus.id}: ${JSON.stringify(textWithStatus.topic)}`);
              } 
              // If no topic in question_text_topics, try from question_topics
              else if (question.question_topics && question.question_topics.length > 0 && question.question_topics[0].topic) {
                const topicData = question.question_topics[0].topic;
                textWithStatus.topic = {
                  id: topicData.id,
                  name: topicData.name,
                  chapter_id: topicData.chapter_id
                };
                this.logger.log(`Service: Using default topic from question_topics for question ${question.id}, text ${textWithStatus.id}: ${JSON.stringify(textWithStatus.topic)}`);
              }
            } else {
              textWithStatus.translation_status = 'original'; // Default if not found
              
              // If no question_text_topics, try from question_topics
              if (question.question_topics && question.question_topics.length > 0 && question.question_topics[0].topic) {
                const topicData = question.question_topics[0].topic;
                textWithStatus.topic = {
                  id: topicData.id,
                  name: topicData.name,
                  chapter_id: topicData.chapter_id
                };
                this.logger.log(`Service: Using default topic without question_text_topics for question ${question.id}, text ${textWithStatus.id}: ${JSON.stringify(textWithStatus.topic)}`);
              }
            }
            
            return textWithStatus;
          });
        }
        
        return processedQuestion;
      });
      
      // Post-processing: Filter out question_texts that don't meet criteria
      const filteredQuestions = processedQuestions.map(question => {
        const questionCopy = { ...question };
        
        // Filter the question_texts to only include those with matching question_text_topics
        if (instruction_medium_id !== undefined || is_verified !== undefined || translation_status !== undefined) {
          questionCopy.question_texts = questionCopy.question_texts.filter(text => {
            if (!text.question_text_topics || text.question_text_topics.length === 0) {
              return false;
            }
            
            // Check if any question_text_topics matches all criteria
            return text.question_text_topics.some(qttm => {
              let match = true;
              
              if (instruction_medium_id !== undefined) {
                match = match && qttm.instruction_medium_id === instruction_medium_id;
              }
              
              if (is_verified !== undefined) {
                match = match && qttm.is_verified === is_verified;
              }
              
              if (translation_status !== undefined && translation_status !== null && translation_status !== '') {
                this.logger.log(`Checking translation_status: ${qttm.translation_status} against required: ${translation_status}`);
                match = match && qttm.translation_status === translation_status;
              }
              
              return match;
            });
          });
        }
        
        // If after filtering, there are no question_texts left, we set to empty array to avoid null problems
        if (questionCopy.question_texts.length === 0) {
          this.logger.warn(`Question ID ${questionCopy.id} has no matching texts after filtering`);
        }
        
        return questionCopy;
      });

      // Filter out questions that have no question_texts after filtering
      const validQuestions = filteredQuestions.filter(q => q.question_texts.length > 0);
      
      // Add diagnostic logging to see the filtered results
      this.logger.log(`Found ${questions.length} questions initially, ${validQuestions.length} after filtering`);
      if (validQuestions.length > 0) {
        this.logger.log(`First question has ${validQuestions[0].question_texts.length} matching texts`);
      }
      
      // NEW STEP: Ensure topics are properly set before transformation
      const questionsWithTopics = this.ensureTopicsInQuestionData(validQuestions);
      
      // Transform data for response (keeping topics intact)
      const transformedQuestions = await this.transformQuestionResults(questionsWithTopics);
      
      // Final verification of topics
      for (const q of transformedQuestions) {
        for (const text of q.question_texts || []) {
          this.logger.log(`Final check - Question ${q.id}, Text ${text.id}, Topic: ${JSON.stringify(text.topic)}`);
        }
      }
      
      const simplifiedQuestions = this.simplifyQuestionData(transformedQuestions);
      
      // Save the actual total count after all filters applied for accurate pagination
      const actualTotalCount = validQuestions.length;
      
      // If we had to apply post-processing filters, recalculate total count for all matching records
      let totalFilteredCount = totalQuestions;
      if (instruction_medium_id !== undefined || is_verified !== undefined) {
        // If we're filtering by medium or verification status,
        // the actual total count may be different from initial DB query
        // For more accurate counts, we would need a separate count query
        // with all the same filtering logic, but for performance reasons
        // we estimate the total based on our current results
        const filterRatio = actualTotalCount / questions.length || 0;
        totalFilteredCount = Math.ceil(totalQuestions * filterRatio);
        this.logger.log(`Estimated total count after all filters: ${totalFilteredCount}`);
      }
      
      return {
        data: simplifiedQuestions,
        meta: {
          total_count: totalFilteredCount,
          page,
          page_size,
          total_pages: Math.ceil(totalFilteredCount / page_size)
        }
      };
    } catch (error) {
      this.logger.error('Error in findAll questions:', error);
      throw new InternalServerErrorException('Failed to retrieve questions');
    }
  }

  async findOne(id: number) {
    try {
      const question = await this.prisma.question.findUnique({
        where: { id },
        include: {
          question_type: true,
          question_topics: {
            include: {
              topic: true
            }
          },
          question_texts: {
            include: {
              image: true,
              mcq_options: {
                include: {
                  image: true
                }
              },
              match_pairs: {
                include: {
                  left_image: true,
                  right_image: true
                }
              },
              question_text_topics: {
                include: {
                  instruction_medium: true,
                  question_topic: {
                    include: {
                      topic: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!question) {
        throw new NotFoundException(`Question with ID ${id} not found`);
      }

      // First ensure topics are properly preserved/set
      const [questionWithTopics] = this.ensureTopicsInQuestionData([question]);
      
      // Log the topics at each step for debugging
      this.logger.log(`Question ${id} topics after ensuring: ${JSON.stringify(
        questionWithTopics.question_texts?.map(t => ({ text_id: t.id, topic: t.topic }))
      )}`);
      
      // Then transform images to include presigned URLs
      const transformedQuestion = await this.transformSingleQuestion(questionWithTopics);
      
      // Final check to ensure topics weren't lost
      this.logger.log(`Question ${id} topics after transformation: ${JSON.stringify(
        transformedQuestion.question_texts?.map(t => ({ text_id: t.id, topic: t.topic }))
      )}`);
      
      return transformedQuestion;
    } catch (error) {
      this.logger.error(`Error retrieving question with ID ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve question');
    }
  }

  async update(id: number, updateDto: UpdateQuestionDto) {
    try {
      await this.findOne(id);

      if (updateDto.question_type_id) {
        const questionType = await this.prisma.question_Type.findUnique({
          where: { id: updateDto.question_type_id }
        });

        if (!questionType) {
          throw new NotFoundException(`Question type with ID ${updateDto.question_type_id} not found`);
        }
      }

      const updatedQuestion = await this.prisma.question.update({
        where: { id },
        data: updateDto,
        include: {
          question_type: true,
          question_texts: {
            include: {
              image: true,
              mcq_options: {
                include: {
                  image: true
                }
              },
              match_pairs: {
                include: {
                  left_image: true,
                  right_image: true
                }
              }
            }
          },
          question_topics: {
            include: {
              topic: {
                include: {
                  chapter: true
                }
              },
              question_text_topics: {
                include: {
                  instruction_medium: true,
                  question_text: true
                }
              }
            }
          }
        }
      });
      
      // Transform question to include presigned URLs
      return await this.transformSingleQuestion(updatedQuestion);
    } catch (error) {
      this.logger.error(`Failed to update question ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update question');
    }
  }

  async remove(id: number): Promise<void> {
    try {
      const question = await this.prisma.question.findUnique({
        where: { id },
        include: {
          question_texts: {
            include: {
              image: true,
              mcq_options: {
                include: {
                  image: true
                }
              },
              match_pairs: {
                include: {
                  left_image: true,
                  right_image: true
                }
              }
            }
          },
          question_topics: true
        }
      });

      if (!question) {
        throw new NotFoundException(`Question with ID ${id} not found`);
      }

      // Collect images that need to be deleted from S3
      const imagesToDelete = await this.collectImagesToDelete(question);

      // Log what will be deleted
      this.logger.log(`Deleting question ${id} will also delete:
        - ${question.question_texts.length} question texts
        - ${question.question_texts.reduce((sum, qt) => sum + qt.mcq_options.length, 0)} MCQ options
        - ${question.question_texts.reduce((sum, qt) => sum + qt.match_pairs.length, 0)} match pairs
        - ${question.question_topics.length} topic associations
        - ${imagesToDelete.length} unique images from S3 that are not used elsewhere`);

      await this.prisma.question.delete({
        where: { id }
      });

      // After database deletion succeeded, delete images from S3
      if (imagesToDelete.length > 0) {
        try {
          await Promise.all(imagesToDelete.map(async (imageUrl) => {
            await this.awsS3Service.deleteFile(imageUrl);
          }));
          this.logger.log(`Successfully deleted ${imagesToDelete.length} images from S3 for question ${id}`);
        } catch (error) {
          this.logger.error(`Error deleting images from S3 for question ${id}:`, error);
          // We continue even if image deletion fails since the database records are already deleted
        }
      }

      this.logger.log(`Successfully deleted question ${id} and all related records through cascade delete`);
    } catch (error) {
      this.logger.error(`Failed to delete question ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete question');
    }
  }
  
  private async associateWithTopic(questionId: number, topicId: number) {
    try {
      // Check if question exists
      const question = await this.prisma.question.findUnique({
        where: { id: questionId }
      });
      
      if (!question) {
        throw new NotFoundException(`Question with ID ${questionId} not found`);
      }
      
      // Check if topic exists
      const topic = await this.prisma.topic.findUnique({
        where: { id: topicId }
      });
      
      if (!topic) {
        throw new NotFoundException(`Topic with ID ${topicId} not found`);
      }
      
      // Create association (will fail if already exists due to unique constraint)
      return await this.prisma.question_Topic.create({
        data: {
          question_id: questionId,
          topic_id: topicId
        },
        include: {
          question: true,
          topic: true
        }
      });
    } catch (error) {
      this.logger.error(`Failed to associate question ${questionId} with topic ${topicId}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to associate question with topic');
    }
  }
  
  private async removeTopicAssociation(questionId: number, topicId: number) {
    try {
      const association = await this.prisma.question_Topic.findFirst({
        where: {
          question_id: questionId,
          topic_id: topicId
        }
      });
      
      if (!association) {
        throw new NotFoundException(`Association between question ${questionId} and topic ${topicId} not found`);
      }
      
      await this.prisma.question_Topic.delete({
        where: { id: association.id }
      });
      
      this.logger.log(`Successfully removed association between question ${questionId} and topic ${topicId}`);
    } catch (error) {
      this.logger.error(`Failed to remove association between question ${questionId} and topic ${topicId}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to remove topic association');
    }
  }

  async findAllWithoutPagination(filters: Omit<QuestionFilters, 'page' | 'page_size'>) {
    try {
      const {
        question_type_id,
        topic_id,
        chapter_id,
        board_question,
        instruction_medium_id,
        sort_by = QuestionSortField.CREATED_AT,
        sort_order = SortOrder.DESC,
        search,
        is_verified,
        translation_status
      } = filters;
      
      this.logger.log(`Question findAllWithoutPagination called with params: 
        - instruction_medium_id: ${instruction_medium_id} 
        - other filters: ${question_type_id}, ${topic_id}, ${chapter_id}
        - translation_status: ${translation_status}
      `);
      
      // Build where clause
      let where: Prisma.QuestionWhereInput = {};
      const andConditions: Array<Prisma.QuestionWhereInput> = [];
      
      if (question_type_id) {
        where.question_type_id = question_type_id;
      }
      
      if (topic_id) {
        where.question_topics = {
          some: {
            topic_id: topic_id
          }
        };
      }
      
      if (chapter_id) {
        where.question_topics = {
          some: {
            topic: {
              chapter_id: chapter_id
            }
          }
        };
      }
      
      if (board_question !== undefined) {
        where.board_question = board_question;
      }
      
      // Handle medium-related filters
      if (instruction_medium_id !== undefined || is_verified !== undefined || translation_status !== undefined) {
        // Build the filter for medium
        let mediumFilter: any = {};
        
        if (instruction_medium_id !== undefined) {
          mediumFilter.instruction_medium_id = instruction_medium_id;
        }
        
        if (is_verified !== undefined) {
          mediumFilter.is_verified = is_verified;
        }
        
        if (translation_status !== undefined) {
          mediumFilter.translation_status = translation_status;
        }
        
        // Add to where conditions
        where.question_texts = {
          some: {
            question_text_topics: {
              some: mediumFilter
            }
          }
        };
      }
      
      // Add search capability if needed
      if (search) {
        andConditions.push({
          question_texts: {
            some: {
              question_text: {
                contains: search,
                mode: 'insensitive' as const
              }
            }
          }
        });
      }
      
      // If we have AND conditions, add them to the where clause
      if (andConditions.length > 0) {
        where = {
          ...where,
          AND: andConditions
        };
      }
      
      // Build orderBy object
      const orderBy: any = {};
      
      if (sort_by === QuestionSortField.CREATED_AT) {
        // Sort by question_text's created_at field
        orderBy.created_at = sort_order;
      } else if (sort_by === QuestionSortField.UPDATED_AT) {
        // Sort by question_text's updated_at field
        orderBy.updated_at = sort_order;
      } else if (sort_by === QuestionSortField.QUESTION_TYPE) {
        // Sort by question type - first by type name through the relation
        orderBy.question_type = {
          type_name: sort_order
        };
      } else if (sort_by === QuestionSortField.QUESTION_TEXT) {
        // Sort by first question text in question_texts
        orderBy.created_at = sort_order; // Fallback to sort by creation date
      } else {
        // Default sort by creation date of question
        orderBy.created_at = SortOrder.DESC;
      }
      
      // Log the order by clause for debugging
      this.logger.log(`Sorting without pagination with: ${JSON.stringify(orderBy)}`);

      // Get data with sorting but without pagination
      this.logger.log(`Fetching all questions without pagination`);
      const questions = await this.prisma.question.findMany({
        where,
        orderBy,
        include: {
          question_type: true,
          question_topics: {
            include: {
              topic: {
                include: {
                  chapter: true
                }
              },
              question_text_topics: {
                include: {
                  instruction_medium: true,
                  question_text: true
                }
              }
            }
          },
          question_texts: {
            include: {
              image: true,
              mcq_options: {
                include: {
                  image: true
                }
              },
              match_pairs: {
                include: {
                  left_image: true,
                  right_image: true
                }
              }
            }
          }
        }
      });
      
      // Transform questions to include presigned URLs
      const transformedQuestions = await this.transformQuestionResults(questions);
      
      // Filter out questions with empty question_texts arrays when filters are applied
      const filteredQuestions = transformedQuestions.filter(question => {
        // Only filter out empty arrays if we're applying text-specific filters
        if (instruction_medium_id !== undefined && 
            (!question.question_texts || question.question_texts.length === 0)) {
          return false;
        }
        return true;
      });
      
      return filteredQuestions;
    } catch (error) {
      this.logger.error('Failed to fetch questions without pagination:', error);
      throw new InternalServerErrorException('Failed to fetch questions without pagination');
    }
  }

  async findUntranslatedQuestions(
    instruction_medium_id_param: number,
    filters: QuestionFilterDto
  ) {
    try {
      const {
        question_type_id,
        topic_id,
        chapter_id,
        board_question,
        page = 1,
        page_size = 10,
        sort_by = QuestionSortField.CREATED_AT,
        sort_order = SortOrder.DESC,
        search,
        is_verified,
        translation_status
      } = filters;

      // Add diagnostic logging for translation_status
      this.logger.log(`findUntranslatedQuestions translation_status parameter: ${translation_status}`);

      const whereConditions: any = {};

      // Basic filters
      if (question_type_id !== undefined) {
        whereConditions.question_type_id = question_type_id;
      }

      if (board_question !== undefined) {
        whereConditions.board_question = board_question;
      }

      // Handle topic filter
      if (topic_id !== undefined) {
        whereConditions.question_topics = {
          some: {
            topic_id
          }
        };
      }

      // Add chapter filter if specified
      if (chapter_id !== undefined) {
        whereConditions.question_topics = {
          ...(whereConditions.question_topics || {}),
          some: {
            ...(whereConditions.question_topics?.some || {}),
            topic: {
              chapter_id
            }
          }
        };
      }

      // Search filter
      if (search) {
        whereConditions.question_texts = {
          ...(whereConditions.question_texts || {}),
          some: {
            question_text: {
              contains: search,
              mode: 'insensitive' as const
            }
          }
        };
      }

      // NOT EXISTS condition for untranslated questions
      // This is a complex condition:
      // We need questions where NONE of the question_texts have a 
      // matching entry in question_text_topic_medium for the specified medium
      // regardless of verification status
      
      const skip = (page - 1) * page_size;
      const take = page_size;

      // First, get questions where NONE of texts have the specified medium
      // This corrects the previous implementation which was only checking for verified texts
      const untranslatedQuestionIds = await this.prisma.$queryRaw<{ id: number }[]>`
        SELECT DISTINCT q.id
        FROM "Question" q
        WHERE NOT EXISTS (
          SELECT 1 
          FROM "Question_Text" qt 
          JOIN "Question_Text_Topic_Medium" qttm ON qt.id = qttm.question_text_id
          WHERE qt.question_id = q.id 
          AND qttm.instruction_medium_id = ${instruction_medium_id_param}
        )
        ${chapter_id ? 
          Prisma.sql`AND EXISTS (
            SELECT 1 FROM "Question_Topic" qt2
            JOIN "Topic" t ON qt2.topic_id = t.id
            WHERE qt2.question_id = q.id AND t.chapter_id = ${chapter_id}
          )` : 
          Prisma.sql``
        }
        ${is_verified === true ? 
          Prisma.sql`AND EXISTS (
            SELECT 1 
            FROM "Question_Text" qt3 
            JOIN "Question_Text_Topic_Medium" qttm3 ON qt3.id = qttm3.question_text_id
            WHERE qt3.question_id = q.id 
            AND qttm3.is_verified = true
          )` : 
          Prisma.sql``
        }
        ${translation_status ? 
          Prisma.sql`AND EXISTS (
            SELECT 1 
            FROM "Question_Text" qt4 
            JOIN "Question_Text_Topic_Medium" qttm4 ON qt4.id = qttm4.question_text_id
            WHERE qt4.question_id = q.id 
            AND qttm4.translation_status = ${translation_status}
          )` : 
          Prisma.sql``
        }
      `;

      // Extract just the IDs
      const questionIds = untranslatedQuestionIds.map(q => q.id);
      
      // Add diagnostic logging
      this.logger.log(`Found ${questionIds.length} questions with no translations at all for medium ${instruction_medium_id_param}`);
      if (questionIds.length === 0) {
        this.logger.warn(`No untranslated questions found for medium ${instruction_medium_id_param} - check if the medium exists and has questions`);
      }

      // Now add this condition to our where
      const finalWhereConditions = {
        ...whereConditions,
        id: {
          in: questionIds
        }
      };
      
      // Log the final where conditions for debugging
      this.logger.log(`Final where conditions: ${JSON.stringify(finalWhereConditions)}`);

      // Count total matching the criteria
      const totalCount = await this.prisma.question.count({
        where: finalWhereConditions
      });

      // Get the actual data with all the includes we need
      const orderBy: any = {};
      
      if (sort_by === QuestionSortField.CREATED_AT) {
        // Sort by question_text's created_at field
        orderBy.created_at = sort_order;
      } else if (sort_by === QuestionSortField.UPDATED_AT) {
        // Sort by question_text's updated_at field
        orderBy.updated_at = sort_order;
      } else if (sort_by === QuestionSortField.QUESTION_TYPE) {
        // Sort by question type - first by type name through the relation
        orderBy.question_type = {
          type_name: sort_order
        };
      } else if (sort_by === QuestionSortField.QUESTION_TEXT) {
        // Sort by first question text in question_texts
        orderBy.created_at = sort_order; // Fallback to sort by creation date
      } else {
        // Default sort by creation date of question
        orderBy.created_at = SortOrder.DESC;
      }
      
      // Log the order by clause for debugging
      this.logger.log(`Sorting untranslated questions with: ${JSON.stringify(orderBy)}`);

      // Create where condition for question_text_topics
      const questionTextTopicsWhere = {};
      if (is_verified !== undefined) {
        questionTextTopicsWhere['is_verified'] = is_verified;
      }
      if (translation_status !== undefined) {
        questionTextTopicsWhere['translation_status'] = translation_status;
      }

      const questions = await this.prisma.question.findMany({
        where: finalWhereConditions,
        orderBy,
        skip,
        take,
        include: {
          question_type: {
            select: {
              id: true,
              type_name: true
            }
          },
          question_texts: {
            include: {
              image: true,
              mcq_options: {
                include: {
                  image: true
                }
              },
              match_pairs: {
                include: {
                  left_image: true,
                  right_image: true
                }
              },
              question_text_topics: {
                where: Object.keys(questionTextTopicsWhere).length > 0 ? questionTextTopicsWhere : {},
                include: {
                  instruction_medium: {
                    select: {
                      id: true,
                      instruction_medium: true
                    }
                  },
                  question_topic: {
                    include: {
                      topic: {
                        select: {
                          id: true,
                          name: true,
                          chapter_id: true
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          question_topics: {
            include: {
              topic: {
                select: {
                  id: true,
                  name: true,
                  chapter_id: true
                }
              }
            }
          }
        }
      });

      // Transform data to include presigned URLs for all images
      const transformedQuestions = await this.transformQuestionResults(questions);

      // Simplify the response structure for client consumption
      const simplifiedQuestions = transformedQuestions.map(question => {
        return {
          id: question.id,
          question_type_id: question.question_type_id,
          board_question: question.board_question,
          question_type: question.question_type,
          question_texts: question.question_texts.map(text => ({
            id: text.id,
            question_id: text.question_id,
            image_id: text.image_id,
            question_text: text.question_text,
            image: text.image, // Already has presigned_url from transformQuestionResults
            mcq_options: text.mcq_options || [], // Already have presigned_url from transformQuestionResults
            match_pairs: text.match_pairs || [], // Already have presigned_url from transformQuestionResults
            translation_status: text.question_text_topics && text.question_text_topics.length > 0 
              ? text.question_text_topics[0].translation_status
              : 'original',
            topic: text.question_text_topics && text.question_text_topics.length > 0 
              ? {
                  id: text.question_text_topics[0].question_topic?.topic?.id,
                  chapter_id: text.question_text_topics[0].question_topic?.topic?.chapter_id,
                  name: text.question_text_topics[0].question_topic?.topic?.name
                }
              : null
          })),
          question_topics: question.question_topics.map(qt => ({
            id: qt.id,
            topic: {
              id: qt.topic.id,
              name: qt.topic.name,
              chapter_id: qt.topic.chapter_id
            }
          }))
        };
      });

      return {
        data: simplifiedQuestions,
        meta: {
          total_count: totalCount,
          page,
          page_size,
          total_pages: Math.ceil(totalCount / page_size)
        }
      };
    } catch (error) {
      this.logger.error('Error in findUntranslatedQuestions:', error);
      throw new InternalServerErrorException('Failed to retrieve untranslated questions');
    }
  }

  // Create a complete question with all related data in a single transaction
  async createComplete(completeDto: CompleteQuestionDto) {
    try {
      /**
       * Image Comparison Strategy for Duplicate Question Detection:
       * 
       * We identify duplicate questions based on the following criteria:
       * 1. Same question text
       * 2. Same question type 
       * 3. Same image situation
       * 
       * For image comparison (point #3), we use a simplified file hash approach:
       * - If one question has an image and the other doesn't, they're treated as different questions
       * - If both have images but with different image_ids, they're treated as different questions
       * - If both have the same image_id or both have no images, the image situation is considered identical
       * 
       * This approach is efficient because:
       * - It doesn't require calculating cryptographic hashes of image files
       * - It leverages the existing uniqueness of image_ids in the database
       * - It allows questions to be differentiated based on visual content
       * - It supports the educational use case where the same text might need different visual explanations
       */
      const {
        question_type_id,
        board_question,
        question_text_data,
        question_topic_data,
        question_text_topic_medium_data
      } = completeDto;

      return await this.prisma.$transaction(async (prisma) => {
        // Step 1: Validate all referenced entities
        // 1.1 Check if question type exists
        const questionType = await prisma.question_Type.findUnique({
          where: { id: question_type_id }
        });
        if (!questionType) {
          throw new NotFoundException(`Question type with ID ${question_type_id} not found`);
        }

        // 1.2 Check if topic exists
        const topic = await prisma.topic.findUnique({
          where: { id: question_topic_data.topic_id }
        });
        if (!topic) {
          throw new NotFoundException(`Topic with ID ${question_topic_data.topic_id} not found`);
        }

        // 1.3 Check if instruction medium exists (if provided)
        if (question_text_topic_medium_data) {
          const medium = await prisma.instruction_Medium.findUnique({
            where: { id: question_text_topic_medium_data.instruction_medium_id }
          });
          if (!medium) {
            throw new NotFoundException(`Instruction medium with ID ${question_text_topic_medium_data.instruction_medium_id} not found`);
          }
        }

        // 1.4 Check image if provided for question text
        if (question_text_data.image_id) {
          const image = await prisma.image.findUnique({
            where: { id: question_text_data.image_id }
          });
          if (!image) {
            throw new NotFoundException(`Image with ID ${question_text_data.image_id} not found`);
          }
        }

        // 1.5 Check images for MCQ options if provided
        if (question_text_data.mcq_options) {
          for (const option of question_text_data.mcq_options) {
            if (option.image_id) {
              const image = await prisma.image.findUnique({
                where: { id: option.image_id }
              });
              if (!image) {
                throw new NotFoundException(`Image with ID ${option.image_id} for MCQ option not found`);
              }
            }
          }
        }

        // 1.6 Check images for match pairs if provided
        if (question_text_data.match_pairs) {
          for (const pair of question_text_data.match_pairs) {
            if (pair.left_image_id) {
              const leftImage = await prisma.image.findUnique({
                where: { id: pair.left_image_id }
              });
              if (!leftImage) {
                throw new NotFoundException(`Left image with ID ${pair.left_image_id} for match pair not found`);
              }
            }
            if (pair.right_image_id) {
              const rightImage = await prisma.image.findUnique({
                where: { id: pair.right_image_id }
              });
              if (!rightImage) {
                throw new NotFoundException(`Right image with ID ${pair.right_image_id} for match pair not found`);
              }
            }
          }
        }

        // NEW STEP: Check if a question text with the same content already exists
        this.logger.log(`Checking if question text "${question_text_data.question_text.substring(0, 50)}..." already exists`);
        const existingQuestionText = await prisma.question_Text.findFirst({
          where: {
            question_text: question_text_data.question_text
          },
          include: {
            image: true,
            question: {
              include: {
                question_type: true,
                question_topics: {
                  where: {
                    topic_id: question_topic_data.topic_id
                  },
                  include: {
                    topic: true
                  }
                }
              }
            },
            question_text_topics: {
              where: {
                question_topic: {
                  topic_id: question_topic_data.topic_id
                }
              },
              include: {
                instruction_medium: true
              }
            }
          }
        });

        if (existingQuestionText) {
          this.logger.log(`Found existing question text with ID ${existingQuestionText.id}`);
          
          // Check if question types are different
          if (existingQuestionText.question.question_type_id !== question_type_id) {
            this.logger.log(`Question types are different (existing: ${existingQuestionText.question.question_type_id}, new: ${question_type_id}). Creating a new question.`);
            // Skip to creating a new question as different question type means different question
            // No early return here - continue to create a new question below
          } else {
            // Check if images are different - if one has image and other doesn't, or they have different images
            const existingHasImage = existingQuestionText.image_id !== null;
            const newHasImage = question_text_data.image_id !== null;
            
            let differentImageSituation = false;
            
            // Implementation of the file hash comparison approach (Option 3):
            // 1. If one has an image and the other doesn't, they're considered different questions
            // 2. If both have images but with different image_ids, they're considered different questions
            // This approach is simpler and more efficient than generating and comparing actual file hashes
            // since we're relying on unique image_ids which are already guaranteed to be unique
            
            // Case 1: Different image presence (one has image, other doesn't)
            if (existingHasImage !== newHasImage) {
              this.logger.log(`Image presence differs (existing: ${existingHasImage ? 'has image' : 'no image'}, new: ${newHasImage ? 'has image' : 'no image'}). Will create a new question.`);
              differentImageSituation = true;
            } 
            // Case 2: Both have images but they're different
            else if (existingHasImage && newHasImage && existingQuestionText.image_id !== question_text_data.image_id) {
              this.logger.log(`Both have images but they are different (existing: ${existingQuestionText.image_id}, new: ${question_text_data.image_id}). Will create a new question.`);
              differentImageSituation = true;
            }
            
            // If we have different image situation, create a new question
            if (differentImageSituation) {
              this.logger.log('Creating new question due to different image situation');
              // Continue to the creation logic below (no early return)
            }
            // Case 3: Identical text, question type, and image situation
            else {
              // Question types are the same, check if question is associated with the requested topic
              const existingTopicAssociation = existingQuestionText.question.question_topics.length > 0;
              
              if (existingTopicAssociation) {
                this.logger.log(`Question ID ${existingQuestionText.question_id} is already associated with topic ID ${question_topic_data.topic_id}`);
                
                // If medium is specified, check medium association
                if (question_text_topic_medium_data) {
                  const existingMediumAssociation = existingQuestionText.question_text_topics.some(
                    textTopic => textTopic.instruction_medium_id === question_text_topic_medium_data.instruction_medium_id
                  );
                  
                  if (existingMediumAssociation) {
                    // Question with same text already exists for this topic and medium
                    const mediumInfo = await prisma.instruction_Medium.findUnique({
                      where: { id: question_text_topic_medium_data.instruction_medium_id },
                      select: { instruction_medium: true }
                    });
                    
                    const topicName = topic.name;
                    
                    return {
                      message: `Question with the same text already exists for topic "${topicName}" and medium "${mediumInfo?.instruction_medium}"`,
                      existing_question: await this.transformSingleQuestion(existingQuestionText.question),
                      is_duplicate: true
                    };
                  }
                  
                  // Question exists for this topic but not for this medium - add the medium association
                  this.logger.log(`Creating new medium association for existing question text ${existingQuestionText.id}`);
                  
                  // Find the question topic association
                  const questionTopic = existingQuestionText.question.question_topics[0];
                  
                  // Create the question text topic medium association
                  await prisma.question_Text_Topic_Medium.create({
                    data: {
                      question_text_id: existingQuestionText.id,
                      question_topic_id: questionTopic.id,
                      instruction_medium_id: question_text_topic_medium_data.instruction_medium_id,
                      is_verified: false
                    }
                  });
                  
                  // Return the updated question
                  const result = await prisma.question.findUnique({
                    where: { id: existingQuestionText.question_id },
                    include: {
                      question_type: true,
                      question_texts: {
                        include: {
                          image: true,
                          mcq_options: {
                            include: {
                              image: true
                            }
                          },
                          match_pairs: {
                            include: {
                              left_image: true,
                              right_image: true
                            }
                          },
                          question_text_topics: {
                            include: {
                              instruction_medium: true,
                              question_topic: {
                                include: {
                                  topic: true
                                }
                              }
                            }
                          }
                        }
                      },
                      question_topics: {
                        include: {
                          topic: true
                        }
                      }
                    }
                  });
                  
                  return {
                    message: `Added new medium association to existing question`,
                    ...await this.transformSingleQuestion(result),
                    reused_existing_question: true
                  };
                } else {
                  // No medium specified but question already exists for this topic
                  return {
                    message: `Question with the same text already exists for topic "${topic.name}"`,
                    existing_question: await this.transformSingleQuestion(existingQuestionText.question),
                    is_duplicate: true
                  };
                }
              } else {
                // Question text exists but not for this topic - create the topic association
                this.logger.log(`Creating new topic association for existing question ${existingQuestionText.question_id}`);
                
                // Create question topic association
                const questionTopic = await prisma.question_Topic.create({
                  data: {
                    question_id: existingQuestionText.question_id,
                    topic_id: question_topic_data.topic_id
                  }
                });
                
                // Create medium association if specified
                if (question_text_topic_medium_data) {
                  this.logger.log(`Creating medium association for existing question ${existingQuestionText.question_id}`);
                  await prisma.question_Text_Topic_Medium.create({
                    data: {
                      question_text_id: existingQuestionText.id,
                      question_topic_id: questionTopic.id,
                      instruction_medium_id: question_text_topic_medium_data.instruction_medium_id,
                      is_verified: false
                    }
                  });
                }
                
                // Return the updated question
                const result = await prisma.question.findUnique({
                  where: { id: existingQuestionText.question_id },
                  include: {
                    question_type: true,
                    question_texts: {
                      include: {
                        image: true,
                        mcq_options: {
                          include: {
                            image: true
                          }
                        },
                        match_pairs: {
                          include: {
                            left_image: true,
                            right_image: true
                          }
                        },
                        question_text_topics: {
                          include: {
                            instruction_medium: true,
                            question_topic: {
                              include: {
                                topic: true
                              }
                            }
                          }
                        }
                      }
                    },
                    question_topics: {
                      include: {
                        topic: true
                      }
                    }
                  }
                });
                
                return {
                  message: `Added new topic association to existing question`,
                  ...await this.transformSingleQuestion(result),
                  reused_existing_question: true
                };
              }
            }
          }
        }

        // If no existing question text found, create a new question
        this.logger.log(`${existingQuestionText && existingQuestionText.question.question_type_id !== question_type_id 
          ? 'Creating new question because question types are different' 
          : 'No existing question text found, creating new question'}`);
        
        // Step 2: Create the question
        this.logger.log('Creating question with type and board status');
        const question = await prisma.question.create({
          data: {
            question_type_id,
            board_question
          }
        });

        // Step 3: Create the question topic association
        this.logger.log(`Creating question topic association for question ${question.id} with topic ${question_topic_data.topic_id}`);
        const questionTopic = await prisma.question_Topic.create({
          data: {
            question_id: question.id,
            topic_id: question_topic_data.topic_id
          }
        });

        // Step 4: Create the question text
        this.logger.log(`Creating question text for question ${question.id}`);
        const questionText = await prisma.question_Text.create({
          data: {
            question_id: question.id,
            question_text: question_text_data.question_text,
            ...(question_text_data.image_id ? { image_id: question_text_data.image_id } : {})
          }
        });

        // Step 5: Create MCQ options if provided
        if (question_text_data.mcq_options && question_text_data.mcq_options.length > 0) {
          this.logger.log(`Creating ${question_text_data.mcq_options.length} MCQ options for question text ${questionText.id}`);
          await Promise.all(question_text_data.mcq_options.map(option => 
            prisma.mcq_Option.create({
              data: {
                question_text_id: questionText.id,
                option_text: option.option_text,
                is_correct: option.is_correct ?? false,
                ...(option.image_id ? { image_id: option.image_id } : {})
              }
            })
          ));
        }

        // Step 6: Create match pairs if provided
        if (question_text_data.match_pairs && question_text_data.match_pairs.length > 0) {
          this.logger.log(`Creating ${question_text_data.match_pairs.length} match pairs for question text ${questionText.id}`);
          await Promise.all(question_text_data.match_pairs.map(pair => 
            prisma.match_Pair.create({
              data: {
                question_text_id: questionText.id,
                ...(pair.left_text ? { left_text: pair.left_text } : {}),
                ...(pair.right_text ? { right_text: pair.right_text } : {}),
                ...(pair.left_image_id ? { left_image_id: pair.left_image_id } : {}),
                ...(pair.right_image_id ? { right_image_id: pair.right_image_id } : {})
              }
            })
          ));
        }

        // Step 7: Create the question text topic medium association if provided
        if (question_text_topic_medium_data) {
          this.logger.log(`Creating question text topic medium association for question text ${questionText.id} and topic ${questionTopic.id}`);
          await prisma.question_Text_Topic_Medium.create({
            data: {
              question_text_id: questionText.id,
              question_topic_id: questionTopic.id,
              instruction_medium_id: question_text_topic_medium_data.instruction_medium_id,
              is_verified: false, // Always set to false for new entries
              translation_status: question_text_topic_medium_data.translation_status || 'original' // Default to 'original' for new entries
            }
          });
        }

        // Step 8: Return the complete question with all relations
        this.logger.log(`Complete question creation successful, fetching final result for question ${question.id}`);
        const result = await prisma.question.findUnique({
          where: { id: question.id },
          include: {
            question_type: true,
            question_texts: {
              include: {
                image: true,
                mcq_options: {
                  include: {
                    image: true
                  }
                },
                match_pairs: {
                  include: {
                    left_image: true,
                    right_image: true
                  }
                },
                question_text_topics: {
                  include: {
                    instruction_medium: true,
                    question_topic: {
                      include: {
                        topic: true
                      }
                    }
                  }
                }
              }
            },
            question_topics: {
              include: {
                topic: true
              }
            }
          }
        });

        // Transform the result to include presigned URLs for images
        const resultWithUrls = await this.transformSingleQuestion(result);
        
        // Add message if this was created due to different question type
        if (existingQuestionText && existingQuestionText.question.question_type_id !== question_type_id) {
          return {
            ...resultWithUrls,
            message: `Created new question with same text but different question type (${questionType.type_name}) than existing question`,
            different_question_type: true
          };
        }
        
        return resultWithUrls;
      });
    } catch (error) {
      this.logger.error('Failed to create complete question:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create complete question: ' + error.message);
    }
  }

  async updateComplete(id: number, editDto: EditCompleteQuestionDto) {
    const { board_question, question_text_id, question_text_data, question_topic_data } = editDto;

    this.logger.log(`Updating complete question with ID ${id} and question text ID ${question_text_id}`);
    
    /**
     * Image Comparison Strategy:
     * 
     * When updating questions, we need to check if a question with the same text already exists:
     * - If yes, we may be able to reuse that text to reduce database redundancy
     * - However, if the image situations differ (one has image vs. doesn't have, or different images),
     *   we need to create a new question text entry instead of reusing the existing one
     * 
     * This ensures that questions with the same text but different visual content
     * are treated as separate entities, which is important for educational purposes.
     * 
     * The comparison follows the same approach as in createComplete:
     * - Comparing image presence (has image vs. doesn't have image)
     * - Comparing image_ids when both questions have images
     */
    
    // We'll execute all operations in a transaction to ensure data consistency
    return await this.prisma.$transaction(async (prisma) => {
      // 1. Validate that the question exists
      const question = await prisma.question.findUnique({
        where: { id },
        include: {
          question_texts: true,
          question_topics: true
        }
      });

      if (!question) {
        throw new NotFoundException(`Question with ID ${id} not found`);
      }

      // 1.1 Validate that the specified question text exists and belongs to this question
      const questionText = await prisma.question_Text.findFirst({
        where: { 
          id: question_text_id,
          question_id: id
        },
        include: {
          question_text_topics: {
            include: {
              instruction_medium: true
            }
          }
        }
      });

      if (!questionText) {
        throw new NotFoundException(`Question text with ID ${question_text_id} not found for question ${id}`);
      }

      // Determine if this is the original text (with translation_status = "original")
      const isOriginalText = questionText.question_text_topics.some(
        qtt => qtt.translation_status === 'original'
      );

      // If we're editing the original text, we need to identify all co-translated texts
      // to mark them as unverified
      let relatedTranslationIds = [];
      if (isOriginalText) {
        this.logger.log(`Editing original text with ID ${question_text_id}. Will unverify all related translations.`);
        
        // Get the question_topic_ids associated with this text
        const questionTopicIds = questionText.question_text_topics.map(qtt => qtt.question_topic_id);
        
        // Find all text-topic-medium relations that:
        // 1. Have the same question_topic_id as the original text
        // 2. Are for different question_texts (translations)
        // 3. Have translation_status === 'translated'
        // 4. Are verified (is_verified === true)
        const relatedTranslations = await prisma.question_Text_Topic_Medium.findMany({
          where: {
            question_topic_id: { in: questionTopicIds },
            question_text_id: { not: question_text_id }, // Different from the original text
            translation_status: 'translated', // Is a translation
            is_verified: true // Is currently verified
          },
          include: {
            question_text: true,
            instruction_medium: true
          }
        });
        
        relatedTranslationIds = relatedTranslations.map(rt => rt.id);
        
        if (relatedTranslationIds.length > 0) {
          this.logger.log(`Found ${relatedTranslationIds.length} related translations that will be unverified.`);
          
          // Log details of translations being unverified
          for (const rt of relatedTranslations) {
            this.logger.log(`Unverifying translation in ${rt.instruction_medium.instruction_medium} (text ID: ${rt.question_text_id})`);
          }
          
          // Unverify all related translations
          await prisma.question_Text_Topic_Medium.updateMany({
            where: {
              id: { in: relatedTranslationIds }
            },
            data: {
              is_verified: false
            }
          });
        } else {
          this.logger.log(`No related translations found that need to be unverified.`);
        }
      }

      // 2. Check if the question type allows MCQ options or match pairs
      const questionType = await prisma.question_Type.findUnique({
        where: { id: question.question_type_id }
      });

      if (!questionType) {
        throw new NotFoundException(`Question type with ID ${question.question_type_id} not found`);
      }

      // 2.1 Validate topic
      const topic = await prisma.topic.findUnique({
        where: { id: question_topic_data.topic_id }
      });

      if (!topic) {
        throw new NotFoundException(`Topic with ID ${question_topic_data.topic_id} not found`);
      }

      // 2.2 Check image if provided for question text
      if (question_text_data.image_id) {
        const image = await prisma.image.findUnique({
          where: { id: question_text_data.image_id }
        });
        if (!image) {
          throw new NotFoundException(`Image with ID ${question_text_data.image_id} not found`);
        }
      }

      // 3. Update the question board status
      await prisma.question.update({
        where: { id },
        data: { board_question }
      });

      // 4. Update the topic association
      // First, find the existing topic association
      const existingTopic = await prisma.question_Topic.findFirst({
        where: { question_id: id }
      });

      if (existingTopic) {
        // Update existing topic association
        await prisma.question_Topic.update({
          where: { id: existingTopic.id },
          data: { topic_id: question_topic_data.topic_id }
        });
      } else {
        // Create new topic association if doesn't exist (shouldn't happen in normal flow)
        await prisma.question_Topic.create({
          data: {
            question_id: id,
            topic_id: question_topic_data.topic_id
          }
        });
      }

      // 5. Update the specified question text
      await prisma.question_Text.update({
        where: { id: question_text_id },
        data: {
          question_text: question_text_data.question_text,
          image_id: question_text_data.image_id
        }
      });

      // 6. Update MCQ options if provided
      if (question_text_data.mcq_options) {
        // Get existing MCQ options
        const existingOptions = await prisma.mcq_Option.findMany({
          where: { question_text_id: question_text_id }
        });

        // Create a map for easier lookup
        const existingOptionsMap = new Map(existingOptions.map(opt => [opt.id, opt]));
        
        // Keep track of processed options to identify which ones to delete
        const processedOptionIds = new Set();

        // Process each MCQ option
        for (const option of question_text_data.mcq_options) {
          if (option.id) {
            // Update existing option
            if (existingOptionsMap.has(option.id)) {
              await prisma.mcq_Option.update({
                where: { id: option.id },
                data: {
                  option_text: option.option_text,
                  is_correct: option.is_correct,
                  image_id: option.image_id
                }
              });
              processedOptionIds.add(option.id);
            }
          } else {
            // Create new option
            await prisma.mcq_Option.create({
              data: {
                question_text_id: question_text_id,
                option_text: option.option_text,
                is_correct: option.is_correct ?? false,
                image_id: option.image_id
              }
            });
          }
        }

        // Delete options that weren't included in the update
        const optionsToDelete = existingOptions
          .filter(opt => !processedOptionIds.has(opt.id))
          .map(opt => opt.id);
          
        if (optionsToDelete.length > 0) {
          await prisma.mcq_Option.deleteMany({
            where: { id: { in: optionsToDelete } }
          });
        }
      }

      // 7. Update match pairs if provided
      if (question_text_data.match_pairs) {
        // Get existing match pairs
        const existingPairs = await prisma.match_Pair.findMany({
          where: { question_text_id: question_text_id }
        });

        // Create a map for easier lookup
        const existingPairsMap = new Map(existingPairs.map(pair => [pair.id, pair]));
        
        // Keep track of processed pairs to identify which ones to delete
        const processedPairIds = new Set();

        // Process each match pair
        for (const pair of question_text_data.match_pairs) {
          if (pair.id) {
            // Update existing pair
            if (existingPairsMap.has(pair.id)) {
              await prisma.match_Pair.update({
                where: { id: pair.id },
                data: {
                  left_text: pair.left_text,
                  right_text: pair.right_text,
                  left_image_id: pair.left_image_id,
                  right_image_id: pair.right_image_id
                }
              });
              processedPairIds.add(pair.id);
            }
          } else {
            // Create new pair
            await prisma.match_Pair.create({
              data: {
                question_text_id: question_text_id,
                left_text: pair.left_text,
                right_text: pair.right_text,
                left_image_id: pair.left_image_id,
                right_image_id: pair.right_image_id
              }
            });
          }
        }

        // Delete pairs that weren't included in the update
        const pairsToDelete = existingPairs
          .filter(pair => !processedPairIds.has(pair.id))
          .map(pair => pair.id);
          
        if (pairsToDelete.length > 0) {
          await prisma.match_Pair.deleteMany({
            where: { id: { in: pairsToDelete } }
          });
        }
      }

      // 8. Update verification status to false in Question_Text_Topic_Medium
      await prisma.question_Text_Topic_Medium.updateMany({
        where: { question_text_id: question_text_id },
        data: { is_verified: false }
      });

      // 9. Return the updated question with all related data
      const updatedQuestion = await prisma.question.findUnique({
        where: { id },
        include: {
          question_type: true,
          question_texts: {
            where: { id: question_text_id },
            include: {
              image: true,
              mcq_options: {
                include: {
                  image: true
                }
              },
              match_pairs: {
                include: {
                  left_image: true,
                  right_image: true
                }
              },
              question_text_topics: {
                include: {
                  instruction_medium: true,
                  question_topic: {
                    include: {
                      topic: true
                    }
                  }
                }
              }
            }
          },
          question_topics: {
            include: {
              topic: true
            }
          }
        }
      });
      
      // Transform the result to include presigned URLs
      const transformedQuestion = await this.transformSingleQuestion(updatedQuestion);
      
      // Add information about unverified translations if applicable
      if (isOriginalText && relatedTranslationIds.length > 0) {
        this.logger.log(`Updated original text and unverified ${relatedTranslationIds.length} related translations`);
        return {
          ...transformedQuestion,
          translations_unverified: relatedTranslationIds.length,
          message: `Question updated successfully. ${relatedTranslationIds.length} related translations were unverified.`
        };
      }
      
      return transformedQuestion;
    });
  }

  async removeFromChapter(id: number, removeDto: RemoveQuestionFromChapterDto) {
    const { topic_id, instruction_medium_id } = removeDto;

    this.logger.log(`Removing question ID ${id} from topic ID ${topic_id}${instruction_medium_id ? ` with instruction medium ID ${instruction_medium_id}` : ' (all mediums)'}`);
    
    return await this.prisma.$transaction(async (prisma) => {
      // 1. Validate that the question exists
      const question = await prisma.question.findUnique({
        where: { id },
        include: {
          question_topics: true,
          question_texts: {
            include: {
              image: true,
              mcq_options: {
                include: {
                  image: true
                }
              },
              match_pairs: {
                include: {
                  left_image: true,
                  right_image: true
                }
              }
            }
          }
        }
      });

      if (!question) {
        throw new NotFoundException(`Question with ID ${id} not found`);
      }

      // 2. Find the specific question_topic record for this topic
      const questionTopic = await prisma.question_Topic.findFirst({
        where: {
          question_id: id,
          topic_id: topic_id
        }
      });

      if (!questionTopic) {
        throw new NotFoundException(`Question with ID ${id} is not associated with topic ID ${topic_id}`);
      }

      // 3. Find all question_text records for this question
      const questionTexts = await prisma.question_Text.findMany({
        where: { question_id: id }
      });

      if (!questionTexts || questionTexts.length === 0) {
        throw new NotFoundException(`No question texts found for question ID ${id}`);
      }

      // 4. Find and delete all relevant question_text_topic_medium records
      const deletedAssociations = [];
      for (const questionText of questionTexts) {
        // Create the where condition based on whether instruction_medium_id is provided
        const whereCondition: Prisma.Question_Text_Topic_MediumWhereInput = {
          question_text_id: questionText.id,
          question_topic_id: questionTopic.id,
        };
        
        // Only add instruction_medium_id to the condition if it's provided
        if (instruction_medium_id !== undefined) {
          whereCondition.instruction_medium_id = instruction_medium_id;
        }
        
        // Get the associations before deletion for reporting
        const associations = await prisma.question_Text_Topic_Medium.findMany({
          where: whereCondition,
          include: {
            instruction_medium: true
          }
        });
        
        deletedAssociations.push(...associations.map(a => a.instruction_medium_id.toString()));
        
        // Delete the associations
        await prisma.question_Text_Topic_Medium.deleteMany({
          where: whereCondition
        });
      }

      // 5. Check if there are any remaining question_text_topic_medium records for this question_topic
      const remainingAssociations = await prisma.question_Text_Topic_Medium.count({
        where: {
          question_topic_id: questionTopic.id
        }
      });

      // If no instruction_medium_id was specified or there are no remaining associations,
      // we should delete the question_topic
      const shouldDeleteQuestionTopic = instruction_medium_id === undefined || remainingAssociations === 0;

      if (shouldDeleteQuestionTopic) {
        // 6. Check if this is the last question_topic for this question
        const remainingTopics = await prisma.question_Topic.count({
          where: {
            question_id: id,
            NOT: {
              id: questionTopic.id // Exclude the current topic
            }
          }
        });

        // 7. If it's the last topic, delete the entire question
        if (remainingTopics === 0) {
          this.logger.log(`This is the last topic for question ID ${id}. Deleting the entire question.`);
          
          // Collect all images that need to be deleted from S3
          const imagesToDelete = await this.collectImagesToDelete(question);
          
          // Delete the question (will cascade delete all related records)
          await prisma.question.delete({
            where: { id }
          });
          
          // After the database transaction succeeds, delete the images from S3
          if (imagesToDelete.length > 0) {
            this.logger.log(`Deleting ${imagesToDelete.length} images from S3 bucket for question ${id}`);
            try {
              await Promise.all(imagesToDelete.map(async (imageUrl) => {
                await this.awsS3Service.deleteFile(imageUrl);
              }));
              this.logger.log(`Successfully deleted ${imagesToDelete.length} images from S3 for question ${id}`);
            } catch (error) {
              this.logger.error(`Error deleting images from S3 for question ${id}:`, error);
              // We continue even if image deletion fails since the database records are already deleted
            }
          }

          return {
            message: `Question ID ${id} completely deleted as this was the last topic association`,
            removed_from_chapter: true,
            question_deleted: true,
            mediums_removed: deletedAssociations,
            images_deleted: imagesToDelete.length
          };
        } else {
          // 8. If it's not the last topic, just delete this question_topic
          await prisma.question_Topic.delete({
            where: { id: questionTopic.id }
          });

          return {
            message: `Question ID ${id} completely removed from topic ID ${topic_id}`,
            removed_from_chapter: true,
            topic_association_deleted: true,
            question_deleted: false,
            remaining_topic_count: remainingTopics,
            mediums_removed: deletedAssociations
          };
        }
      } else {
        // 9. If we only deleted specific medium associations but the topic still has others
        return {
          message: `Question ID ${id} partially removed from topic ID ${topic_id}`,
          removed_from_chapter: true,
          topic_association_deleted: false,
          medium_associations_deleted: true,
          question_deleted: false,
          mediums_removed: deletedAssociations,
          remaining_medium_associations: remainingAssociations
        };
      }
    });
  }

  // Helper method to collect all image URLs for a question that should be deleted
  private async collectImagesToDelete(question): Promise<string[]> {
    const imageUrls = new Set<string>();
    
    for (const questionText of question.question_texts) {
      // Add question text image if it exists
      if (questionText.image?.image_url) {
        imageUrls.add(questionText.image.image_url);
      }
      
      // Add MCQ option images
      if (questionText.mcq_options) {
        for (const option of questionText.mcq_options) {
          if (option.image?.image_url) {
            imageUrls.add(option.image.image_url);
          }
        }
      }
      
      // Add match pair images (left and right)
      if (questionText.match_pairs) {
        for (const pair of questionText.match_pairs) {
          if (pair.left_image?.image_url) {
            imageUrls.add(pair.left_image.image_url);
          }
          if (pair.right_image?.image_url) {
            imageUrls.add(pair.right_image.image_url);
          }
        }
      }
    }
    
    // Check if these images are used by other questions before deleting
    const imageUrlsArray = Array.from(imageUrls);
    const safeToDelete: string[] = [];
    
    // For each image URL, check if it's used by other questions
    for (const imageUrl of imageUrlsArray) {
      // Extract image ID from the image object
      const imageId = question.question_texts.flatMap(qt => {
        const ids = [];
        if (qt.image?.image_url === imageUrl) ids.push(qt.image.id);
        
        if (qt.mcq_options) {
          qt.mcq_options.forEach(opt => {
            if (opt.image?.image_url === imageUrl) ids.push(opt.image.id);
          });
        }
        
        if (qt.match_pairs) {
          qt.match_pairs.forEach(pair => {
            if (pair.left_image?.image_url === imageUrl) ids.push(pair.left_image.id);
            if (pair.right_image?.image_url === imageUrl) ids.push(pair.right_image.id);
          });
        }
        
        return ids;
      })[0];
      
      if (!imageId) continue;
      
      // Check if the image is used by other questions
      const usageCount = await this.prisma.$queryRaw`
        SELECT COUNT(*) as count FROM (
          SELECT image_id FROM Question_Text WHERE image_id = ${imageId} AND question_id != ${question.id}
          UNION ALL
          SELECT image_id FROM MCQ_Option WHERE image_id = ${imageId} AND question_text_id NOT IN (
            SELECT id FROM Question_Text WHERE question_id = ${question.id}
          )
          UNION ALL
          SELECT left_image_id FROM Match_Pair WHERE left_image_id = ${imageId} AND question_text_id NOT IN (
            SELECT id FROM Question_Text WHERE question_id = ${question.id}
          )
          UNION ALL
          SELECT right_image_id FROM Match_Pair WHERE right_image_id = ${imageId} AND question_text_id NOT IN (
            SELECT id FROM Question_Text WHERE question_id = ${question.id}
          )
        ) as usage
      `;
      
      // If the image is not used by any other questions, it's safe to delete
      if (usageCount[0].count === 0) {
        safeToDelete.push(imageUrl);
      }
    }
    
    this.logger.log(`Found ${safeToDelete.length} images that can be safely deleted for question ${question.id}`);
    return safeToDelete;
  }

  // Simplify questions for API response
  private simplifyQuestionData(questions) {
    if (!Array.isArray(questions)) {
      return this.simplifyQuestionItem(questions);
    }
    
    return questions.map(question => this.simplifyQuestionItem(question));
  }
  
  // Simplify a question object to include only essential fields
  private simplifyQuestionItem(question) {
    if (!question) return null;
    
    // Log the incoming question's topic data
    this.logger.log(`simplifyQuestionItem processing question ${question.id}:
      - Has question_topics: ${question.question_topics && question.question_topics.length > 0 ? 'yes' : 'no'}
      - Number of question_texts: ${question.question_texts?.length || 0}
      - Text 0 has topic?: ${question.question_texts && question.question_texts[0] && question.question_texts[0].topic ? 'yes' : 'no'}
      - Text 0 topic data: ${question.question_texts && question.question_texts[0] && question.question_texts[0].topic ? 
          JSON.stringify(question.question_texts[0].topic) : 'none'}
    `);
    
    // Get the default topic from question_topics as a fallback
    const defaultTopic = question.question_topics && question.question_topics.length > 0 && question.question_topics[0].topic 
      ? {
          id: question.question_topics[0].topic.id,
          name: question.question_topics[0].topic.name,
          chapter_id: question.question_topics[0].topic.chapter_id
        } 
      : null;
    
    // Simplified question object with only required fields
    return {
      id: question.id,
      board_question: question.board_question,
      question_type_id: question.question_type?.id,
      question_type: question.question_type ? {
        id: question.question_type.id,
        type_name: question.question_type.type_name
      } : null,
      question_texts: (question.question_texts || []).map(text => {
        // IMPORTANT: Preserve the topic that was already set in previous processing
        // This ensures we don't lose the topic information we've carefully built
        let finalTopic = text.topic;
        
        // If text doesn't already have a topic but we have a default, use it
        if (!finalTopic && defaultTopic) {
          finalTopic = defaultTopic;
          this.logger.log(`simplifyQuestionItem: Using default topic for question ${question.id}, text ${text.id}`);
        }
        
        // If we still don't have a topic, try other sources
        if (!finalTopic) {
          // Try to get from question_text_topics
          if (text.question_text_topics && text.question_text_topics.length > 0 && 
              text.question_text_topics[0].question_topic?.topic) {
            const topicData = text.question_text_topics[0].question_topic.topic;
            finalTopic = {
              id: topicData.id,
              name: topicData.name,
              chapter_id: topicData.chapter_id
            };
            this.logger.log(`simplifyQuestionItem: Found topic in text_topics for question ${question.id}, text ${text.id}`);
          }
        }
        
        // Log the final topic decision
        this.logger.log(`simplifyQuestionItem: Final topic for question ${question.id}, text ${text.id}: ${JSON.stringify(finalTopic)}`);
        
        // Create the base text object with explicit typing to avoid TypeScript errors
        const textObj: any = {
          id: text.id,
          question_id: text.question_id,
          image_id: text.image_id,
          question_text: text.question_text,
          image: text.image,
          mcq_options: text.mcq_options || [],
          match_pairs: text.match_pairs || [],
          // Set the topic we've determined
          topic: finalTopic
        };
        
        // Add translation_status from question_text_topics if available
        if (text.question_text_topics && text.question_text_topics.length > 0) {
          textObj.translation_status = text.question_text_topics[0].translation_status || 'original';
        } else {
          // Default values if not available
          textObj.translation_status = 'original';
        }
        
        return textObj;
      })
    };
  }

  /**
   * Add a translation for an existing question
   * @param questionId The ID of the question to translate
   * @param translationDto The translation data
   * @returns The created translation details
   */
  async addTranslation(questionId: number, translationDto: AddTranslationDto) {
    // Get the question to translate
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: {
        question_type: true,
        question_texts: {
          include: {
            image: true,
            mcq_options: true,
            match_pairs: true,
            question_text_topics: {
              include: {
                question_topic: {
                  include: {
                    topic: true
                  }
                },
                instruction_medium: true
              }
            }
          }
        },
        question_topics: {
          include: {
            topic: true
          }
        }
      }
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${questionId} not found`);
    }

    // Verify if the question has at least one verified text in another medium
    const hasVerifiedText = question.question_texts.some(text => 
      text.question_text_topics && 
      text.question_text_topics.some(qttm => qttm.is_verified)
    );

    if (!hasVerifiedText) {
      throw new BadRequestException(`Question with ID ${questionId} does not have any verified text. Only verified questions can be translated.`);
    }

    // Check if an existing translation for this medium already exists
    const existingTranslation = question.question_texts.some(text => 
      text.question_text_topics && 
      text.question_text_topics.some(
        qttm => qttm.instruction_medium_id === translationDto.instruction_medium_id
      )
    );

    if (existingTranslation) {
      throw new ConflictException(`Translation for question ID ${questionId} in medium ID ${translationDto.instruction_medium_id} already exists`);
    }

    // Check for image consistency - enforcing that translation follows the same image pattern as source
    const sourceHasImage = question.question_texts.some(text => text.image_id !== null);
    const translationHasImage = translationDto.image_id !== undefined && translationDto.image_id !== null;

    if (sourceHasImage && !translationHasImage) {
      throw new BadRequestException('Original question has an image, but translation does not include an image_id. Please provide an image for consistency.');
    }

    if (!sourceHasImage && translationHasImage) {
      throw new BadRequestException('Original question does not have an image, but translation includes an image_id. Please remove the image_id for consistency.');
    }

    // Get the question type
    const questionType = question.question_type;

    // For MCQ questions, ensure mcq_options are provided
    if (questionType.type_name.toLowerCase().includes('multiple choice') && 
        (!translationDto.mcq_options || translationDto.mcq_options.length === 0)) {
      throw new BadRequestException('MCQ options must be provided for Multiple Choice question types');
    }

    // For matching questions, ensure match_pairs are provided
    if (questionType.type_name.toLowerCase().includes('match') && 
        (!translationDto.match_pairs || translationDto.match_pairs.length === 0)) {
      throw new BadRequestException('Match pairs must be provided for Matching question types');
    }

    // Use transaction to ensure data consistency
    const result = await this.prisma.$transaction(async (prisma) => {
      // 1. Create a new question_text entry
      const newQuestionText = await prisma.question_Text.create({
        data: {
          question_id: questionId,
          question_text: translationDto.question_text,
          image_id: translationDto.image_id || null
        }
      });

      // 2. If it's an MCQ question, create the options
      if (translationDto.mcq_options && translationDto.mcq_options.length > 0) {
        await Promise.all(
          translationDto.mcq_options.map(option => 
            prisma.mcq_Option.create({
              data: {
                question_text_id: newQuestionText.id,
                option_text: option.option_text,
                is_correct: option.is_correct,
                image_id: option.image_id || null
              }
            })
          )
        );
      }

      // 3. If it's a matching question, create the pairs
      if (translationDto.match_pairs && translationDto.match_pairs.length > 0) {
        await Promise.all(
          translationDto.match_pairs.map(pair => 
            prisma.match_Pair.create({
              data: {
                question_text_id: newQuestionText.id,
                left_text: pair.left_text || null,
                right_text: pair.right_text || null,
                left_image_id: pair.left_image_id || null,
                right_image_id: pair.right_image_id || null
              }
            })
          )
        );
      }

      // 4. For each question topic, create a question_text_topic_medium relation
      // Find all topic IDs associated with this question
      const questionTopics = await prisma.question_Topic.findMany({
        where: { question_id: questionId }
      });

      // Create associations for each topic with the new medium
      for (const questionTopic of questionTopics) {
        await prisma.question_Text_Topic_Medium.create({
          data: {
            question_text_id: newQuestionText.id,
            question_topic_id: questionTopic.id,
            instruction_medium_id: translationDto.instruction_medium_id,
            is_verified: false, // Always set to false for new translations
            translation_status: 'translated' // Always set to "translated" for translations
          }
        });
      }

      // Get the medium name for the response
      const medium = await prisma.instruction_Medium.findUnique({
        where: { id: translationDto.instruction_medium_id }
      });

      return {
        message: "Translation added successfully",
        id: questionId,
        question_text_id: newQuestionText.id,
        question_text: translationDto.question_text,
        instruction_medium_id: translationDto.instruction_medium_id,
        medium_name: medium ? medium.instruction_medium : null
      };
    });

    return result;
  }

  /**
   * Get verified question texts for a specific question and topic
   * @param questionId The ID of the question
   * @param topicId The ID of the topic
   * @returns Question data with verified texts sorted by medium name
   */
  async getVerifiedQuestionTexts(questionId: number, topicId: number) {
    try {
      // Check if the question exists
      const question = await this.prisma.question.findUnique({
        where: { id: questionId },
        include: {
          question_type: true
        }
      });

      if (!question) {
        throw new NotFoundException(`Question with ID ${questionId} not found`);
      }

      // Check if topic exists
      const topic = await this.prisma.topic.findUnique({
        where: { id: topicId },
        include: {
          chapter: true
        }
      });

      if (!topic) {
        throw new NotFoundException(`Topic with ID ${topicId} not found`);
      }

      // Check if the question is associated with the topic
      const questionTopic = await this.prisma.question_Topic.findFirst({
        where: {
          question_id: questionId,
          topic_id: topicId
        }
      });

      if (!questionTopic) {
        throw new NotFoundException(`Question with ID ${questionId} is not associated with topic ID ${topicId}`);
      }

      // Get all question texts with their respective mediums that are verified
      const questionTexts = await this.prisma.question_Text.findMany({
        where: { 
          question_id: questionId
        },
        include: {
          image: true,
          mcq_options: {
            include: {
              image: true
            }
          },
          match_pairs: {
            include: {
              left_image: true,
              right_image: true
            }
          },
          question_text_topics: {
            where: {
              question_topic_id: questionTopic.id,
              is_verified: true
            },
            include: {
              instruction_medium: true
            }
          }
        }
      });

      // Filter texts that have verified associations with the specified topic
      const verifiedTexts = questionTexts.filter(text => 
        text.question_text_topics && text.question_text_topics.length > 0
      );

      // Transform all images to include presigned URLs using our standard method
      const transformedTexts = await Promise.all(verifiedTexts.map(async (text) => {
        // Create a fully transformed copy of the text with all images processed
        const transformedText = { ...text };
        
        // Process main image
        if (transformedText.image) {
          transformedText.image = await this.transformImageData(transformedText.image);
        }
        
        // Process MCQ option images
        if (transformedText.mcq_options && transformedText.mcq_options.length > 0) {
          transformedText.mcq_options = await Promise.all(transformedText.mcq_options.map(async (option) => {
            const optionCopy = { ...option };
            if (optionCopy.image) {
              optionCopy.image = await this.transformImageData(optionCopy.image);
            }
            return optionCopy;
          }));
        }
        
        // Process match pair images
        if (transformedText.match_pairs && transformedText.match_pairs.length > 0) {
          transformedText.match_pairs = await Promise.all(transformedText.match_pairs.map(async (pair) => {
            const pairCopy = { ...pair };
            if (pairCopy.left_image) {
              pairCopy.left_image = await this.transformImageData(pairCopy.left_image);
            }
            if (pairCopy.right_image) {
              pairCopy.right_image = await this.transformImageData(pairCopy.right_image);
            }
            return pairCopy;
          }));
        }
        
        // Format the medium information
        const medium = transformedText.question_text_topics[0]?.instruction_medium;
        
        // Return simplified structure with transformed images
        return {
          id: transformedText.id,
          question_text: transformedText.question_text,
          image_id: transformedText.image_id,
          image: transformedText.image,
          medium: medium ? {
            id: medium.id,
            instruction_medium: medium.instruction_medium
          } : null,
          translation_status: transformedText.question_text_topics[0]?.translation_status || 'original',
          mcq_options: transformedText.mcq_options || [],
          match_pairs: transformedText.match_pairs || []
        };
      }));

      // Sort the texts by medium name alphabetically
      const sortedTexts = transformedTexts.sort((a, b) => {
        const mediumA = a.medium?.instruction_medium || '';
        const mediumB = b.medium?.instruction_medium || '';
        return mediumA.localeCompare(mediumB);
      });

      // Construct the final response
      const response = {
        id: question.id,
        question_type: {
          id: question.question_type.id,
          type_name: question.question_type.type_name
        },
        board_question: question.board_question,
        topic: {
          id: topic.id,
          name: topic.name,
          chapter_id: topic.chapter_id
        },
        question_texts: sortedTexts
      };

      return response;
    } catch (error) {
      this.logger.error(`Failed to get verified question texts for question ${questionId} and topic ${topicId}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to get verified question texts');
    }
  }

  // Diagnostic method to check question-topic associations
  async checkQuestionData(id: number) {
    try {
      // Fetch a specific question and all its relationships
      const question = await this.prisma.question.findUnique({
        where: { id },
        include: {
          question_type: true,
          question_texts: {
            include: {
              question_text_topics: {
                include: {
                  question_topic: {
                    include: {
                      topic: true
                    }
                  },
                  instruction_medium: true
                }
              }
            }
          },
          question_topics: {
            include: {
              topic: true
            }
          }
        }
      });
      
      if (!question) {
        throw new NotFoundException(`Question with ID ${id} not found`);
      }
      
      // Format a simplified diagnostic response
      return {
        id: question.id,
        question_type: question.question_type?.type_name,
        has_question_topics: question.question_topics && question.question_topics.length > 0,
        question_topics_count: question.question_topics?.length || 0,
        question_topics: question.question_topics?.map(qt => ({
          id: qt.id,
          topic_id: qt.topic_id,
          topic_name: qt.topic?.name
        })),
        question_texts_count: question.question_texts?.length || 0,
        question_texts: question.question_texts?.map(text => ({
          id: text.id,
          text: text.question_text,
          has_text_topic_medium: text.question_text_topics && text.question_text_topics.length > 0,
          text_topic_medium_count: text.question_text_topics?.length || 0,
          text_topic_medium: text.question_text_topics?.map(ttm => ({
            id: ttm.id,
            question_topic_id: ttm.question_topic_id,
            medium_id: ttm.instruction_medium_id,
            medium_name: ttm.instruction_medium?.instruction_medium,
            translation_status: ttm.translation_status || 'original',
            has_topic: ttm.question_topic?.topic != null,
            topic_id: ttm.question_topic?.topic?.id,
            topic_name: ttm.question_topic?.topic?.name
          }))
        }))
      };
    } catch (error) {
      this.logger.error(`Error in checkQuestionData for question ${id}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve question diagnostic data');
    }
  }

  // Additional diagnostic method to check all questions
  async checkAllQuestionsData() {
    try {
      // Get all questions with minimal data
      const questions = await this.prisma.question.findMany({
        include: {
          question_topics: {
            include: {
              topic: true
            }
          },
          question_texts: {
            include: {
              question_text_topics: {
                include: {
                  instruction_medium: true
                }
              }
            }
          }
        }
      });
      
      return questions.map(q => ({
        id: q.id,
        has_question_topics: q.question_topics && q.question_topics.length > 0,
        question_topics_count: q.question_topics?.length || 0,
        question_topics: q.question_topics?.map(qt => ({
          id: qt.id,
          topic_id: qt.topic_id,
          topic_name: qt.topic?.name
        })),
        question_texts_count: q.question_texts?.length || 0,
        question_texts: q.question_texts?.map(text => ({
          id: text.id,
          text: text.question_text,
          has_text_topic_medium: text.question_text_topics && text.question_text_topics.length > 0,
          text_topic_medium_count: text.question_text_topics?.length || 0,
          text_topic_medium: text.question_text_topics?.map(ttm => ({
            id: ttm.id,
            question_topic_id: ttm.question_topic_id,
            medium_id: ttm.instruction_medium_id,
            medium_name: ttm.instruction_medium?.instruction_medium,
            translation_status: ttm.translation_status || 'original'
          }))
        }))
      }));
    } catch (error) {
      this.logger.error('Error in checkAllQuestionsData:', error);
      throw new InternalServerErrorException('Failed to retrieve all questions diagnostic data');
    }
  }

  /**
   * Utility method to assign a default topic to questions without topics
   * This is helpful for fixing questions that don't have any topic associations
   */
  async assignDefaultTopicToQuestions() {
    try {
      // Step 1: Find all questions without any topics
      const questionsWithoutTopics = await this.prisma.question.findMany({
        where: {
          question_topics: {
            none: {}
          }
        },
        include: {
          question_texts: {
            include: {
              question_text_topics: true
            }
          }
        }
      });
      
      if (questionsWithoutTopics.length === 0) {
        return { message: 'No questions without topics found', affected: 0 };
      }
      
      this.logger.log(`Found ${questionsWithoutTopics.length} questions without topics`);
      
      // Step 2: Find or create a default topic
      let defaultTopic = await this.prisma.topic.findFirst({
        where: {
          name: 'General'
        }
      });
      
      if (!defaultTopic) {
        // Need to find a chapter first
        const chapter = await this.prisma.chapter.findFirst();
        
        if (!chapter) {
          return { message: 'No chapters found in database - cannot create default topic', affected: 0 };
        }
        
        // Create the default topic
        defaultTopic = await this.prisma.topic.create({
          data: {
            name: 'General',
            chapter_id: chapter.id,
            sequential_topic_number: 1
          }
        });
        
        this.logger.log(`Created default topic 'General' with ID ${defaultTopic.id}`);
      }
      
      // Step 3: Create question_topics for each question
      const createdAssociations = [];
      
      for (const question of questionsWithoutTopics) {
        // Create a question_topic association
        const questionTopic = await this.prisma.question_Topic.create({
          data: {
            question_id: question.id,
            topic_id: defaultTopic.id
          }
        });
        
        createdAssociations.push(questionTopic);
        
        // For each question text, create question_text_topic_medium records if needed
        for (const text of question.question_texts) {
          // Skip if it already has question_text_topics
          if (text.question_text_topics && text.question_text_topics.length > 0) {
            continue;
          }
          
          // Find a default medium if needed
          const defaultMedium = await this.prisma.instruction_Medium.findFirst();
          
          if (!defaultMedium) {
            this.logger.warn('No instruction mediums found in database');
            continue;
          }
          
          // Create a question_text_topic_medium association
          try {
            await this.prisma.question_Text_Topic_Medium.create({
              data: {
                question_text_id: text.id,
                question_topic_id: questionTopic.id,
                instruction_medium_id: defaultMedium.id,
                is_verified: false,
                translation_status: 'original'
              }
            });
          } catch (error) {
            this.logger.error(`Failed to create question_text_topic_medium for question_text ${text.id}:`, error);
          }
        }
      }
      
      return {
        message: `Created topic associations for ${questionsWithoutTopics.length} questions`,
        affected: questionsWithoutTopics.length,
        defaultTopic
      };
    } catch (error) {
      this.logger.error('Error in assignDefaultTopicToQuestions:', error);
      throw new InternalServerErrorException('Failed to assign default topics to questions');
    }
  }

  // Add this directly after the post-processing step in findAll
  // Before the transformQuestionResults call
  
  // Ensure topics are preserved in the final data
  private ensureTopicsInQuestionData(questions) {
    return questions.map(question => {
      const result = { ...question };
      
      // Get default topic from question_topics for fallback
      let defaultTopic = null;
      if (question.question_topics && question.question_topics.length > 0 && question.question_topics[0]?.topic) {
        defaultTopic = {
          id: question.question_topics[0].topic.id,
          name: question.question_topics[0].topic.name,
          chapter_id: question.question_topics[0].topic.chapter_id
        };
        this.logger.log(`Found default topic for question ${question.id}: ${JSON.stringify(defaultTopic)}`);
      }
      
      // Process each question text to ensure it has topic data
      if (result.question_texts) {
        result.question_texts = result.question_texts.map(text => {
          const textResult = { ...text };
          
          // Get topic from question_text_topics first
          if (textResult.question_text_topics && textResult.question_text_topics.length > 0 && 
              textResult.question_text_topics[0].question_topic?.topic) {
            const topicData = textResult.question_text_topics[0].question_topic.topic;
            textResult.topic = {
              id: topicData.id,
              name: topicData.name,
              chapter_id: topicData.chapter_id
            };
            this.logger.log(`Found topic in text-topics for question ${question.id}, text ${textResult.id}: ${JSON.stringify(textResult.topic)}`);
          } 
          // Fallback to default topic from question_topics
          else if (defaultTopic) {
            textResult.topic = defaultTopic;
            this.logger.log(`Using default topic for question ${question.id}, text ${textResult.id}: ${JSON.stringify(textResult.topic)}`);
          }
          
          return textResult;
        });
      }
      
      return result;
    });
  }

  async countUntranslatedQuestions(instruction_medium_id_param: number, filters: QuestionFilterDto) {
    try {
      const {
        question_type_id,
        topic_id,
        chapter_id,
        board_question,
        is_verified,
        translation_status
      } = filters;

      // Basic raw query to get untranslated questions count for this medium
      const untranslatedQuestionsCount = await this.prisma.$queryRaw<[{ count: string }]>`
        SELECT COUNT(DISTINCT q.id) as count
        FROM "Question" q
        WHERE NOT EXISTS (
          SELECT 1 
          FROM "Question_Text" qt 
          JOIN "Question_Text_Topic_Medium" qttm ON qt.id = qttm.question_text_id
          WHERE qt.question_id = q.id 
          AND qttm.instruction_medium_id = ${instruction_medium_id_param}
        )
        ${topic_id ? 
          Prisma.sql`AND EXISTS (
            SELECT 1 FROM "Question_Topic" qt1
            WHERE qt1.question_id = q.id AND qt1.topic_id = ${topic_id}
          )` : 
          Prisma.sql``
        }
        ${chapter_id ? 
          Prisma.sql`AND EXISTS (
            SELECT 1 FROM "Question_Topic" qt2
            JOIN "Topic" t ON qt2.topic_id = t.id
            WHERE qt2.question_id = q.id AND t.chapter_id = ${chapter_id}
          )` : 
          Prisma.sql``
        }
        ${question_type_id ? 
          Prisma.sql`AND q.question_type_id = ${question_type_id}` : 
          Prisma.sql``
        }
        ${board_question !== undefined ? 
          Prisma.sql`AND q.board_question = ${board_question}` : 
          Prisma.sql``
        }
        ${is_verified === true ? 
          Prisma.sql`AND EXISTS (
            SELECT 1 
            FROM "Question_Text" qt3 
            JOIN "Question_Text_Topic_Medium" qttm3 ON qt3.id = qttm3.question_text_id
            WHERE qt3.question_id = q.id 
            AND qttm3.is_verified = true
          )` : 
          Prisma.sql``
        }
        ${translation_status ? 
          Prisma.sql`AND EXISTS (
            SELECT 1 
            FROM "Question_Text" qt4 
            JOIN "Question_Text_Topic_Medium" qttm4 ON qt4.id = qttm4.question_text_id
            WHERE qt4.question_id = q.id 
            AND qttm4.translation_status = ${translation_status}
          )` : 
          Prisma.sql``
        }
      `;

      // Extract count value and convert to number
      const count = parseInt(untranslatedQuestionsCount[0]?.count || '0', 10);

      // Add diagnostic logging
      this.logger.log(`Found ${count} untranslated questions for medium ${instruction_medium_id_param}`);
      
      return { 
        count,
        medium_id: instruction_medium_id_param,
        filters: {
          question_type_id,
          topic_id,
          chapter_id,
          board_question,
          is_verified,
          translation_status
        }
      };
    } catch (error) {
      this.logger.error(`Error counting untranslated questions for medium ${instruction_medium_id_param}:`, error);
      throw new InternalServerErrorException('Failed to count untranslated questions');
    }
  }

  async countQuestions(filters: QuestionFilterDto) {
    try {
      const {
        question_type_id,
        topic_id,
        chapter_id,
        board_question,
        instruction_medium_id,
        is_verified,
        translation_status,
        search
      } = filters;

      // Build the where conditions
      const whereConditions: any = {};

      // Basic filters
      if (question_type_id !== undefined) {
        whereConditions.question_type_id = question_type_id;
      }

      if (board_question !== undefined) {
        whereConditions.board_question = board_question;
      }

      // Handle topic filter
      if (topic_id !== undefined) {
        whereConditions.question_topics = {
          some: {
            topic_id
          }
        };
      }

      // Add chapter filter if specified
      if (chapter_id !== undefined) {
        whereConditions.question_topics = {
          ...(whereConditions.question_topics || {}),
          some: {
            ...(whereConditions.question_topics?.some || {}),
            topic: {
              chapter_id
            }
          }
        };
      }

      // Add medium filter if specified
      if (instruction_medium_id !== undefined) {
        whereConditions.question_texts = {
          ...(whereConditions.question_texts || {}),
          some: {
            question_text_topics: {
              some: {
                instruction_medium_id
              }
            }
          }
        };
      }

      // Add verification status filter if specified
      if (is_verified !== undefined) {
        whereConditions.question_texts = {
          ...(whereConditions.question_texts || {}),
          some: {
            question_text_topics: {
              some: {
                is_verified
              }
            }
          }
        };
      }

      // Add translation status filter if specified
      if (translation_status !== undefined) {
        whereConditions.question_texts = {
          ...(whereConditions.question_texts || {}),
          some: {
            question_text_topics: {
              some: {
                translation_status
              }
            }
          }
        };
      }

      // Search filter
      if (search) {
        whereConditions.question_texts = {
          ...(whereConditions.question_texts || {}),
          some: {
            question_text: {
              contains: search,
              mode: 'insensitive' as const
            }
          }
        };
      }

      // Count total questions matching the criteria
      const count = await this.prisma.question.count({
        where: whereConditions
      });

      this.logger.log(`Counted ${count} questions with filters: ${JSON.stringify(filters)}`);

      return {
        count,
        filters: {
          question_type_id,
          topic_id,
          chapter_id,
          board_question,
          instruction_medium_id,
          is_verified,
          translation_status,
          search
        }
      };
    } catch (error) {
      this.logger.error('Error counting questions:', error);
      throw new InternalServerErrorException('Failed to count questions');
    }
  }

  async runDiagnosticQueries(
    instruction_medium_id: number, 
    chapter_id: number, 
    is_verified: boolean
  ) {
    try {
      this.logger.log(`Running diagnostic queries for:
        - instruction_medium_id: ${instruction_medium_id}
        - chapter_id: ${chapter_id}
        - is_verified: ${is_verified}
      `);
      
      // Run direct SQL count query to confirm data exists
      const rawCountResult = await this.prisma.$queryRaw`
        SELECT COUNT(*) as count FROM "Question_Text_Topic_Medium" qttm
        JOIN "Question_Topic" qt ON qttm.question_topic_id = qt.id
        JOIN "Topic" t ON qt.topic_id = t.id
        WHERE qttm.instruction_medium_id = ${instruction_medium_id}
        AND t.chapter_id = ${chapter_id}
        AND qttm.is_verified = ${is_verified};
      `;
      
      // Get question IDs from direct SQL to compare with Prisma query
      const rawQuestionsResult = await this.prisma.$queryRaw`
        SELECT DISTINCT q.id FROM "Question" q
        JOIN "Question_Topic" qt ON q.id = qt.question_id
        JOIN "Topic" t ON qt.topic_id = t.id
        JOIN "Question_Text" qtxt ON q.id = qtxt.question_id
        JOIN "Question_Text_Topic_Medium" qttm ON 
          qtxt.id = qttm.question_text_id AND
          qt.id = qttm.question_topic_id
        WHERE qttm.instruction_medium_id = ${instruction_medium_id}
        AND t.chapter_id = ${chapter_id}
        AND qttm.is_verified = ${is_verified};
      `;
      
      // Now run the same query using Prisma to see the difference
      const whereConditions: any = {
        question_topics: {
          some: {
            topic: {
              chapter_id
            }
          }
        },
        question_texts: {
          some: {
            question_text_topics: {
              some: {
                instruction_medium_id,
                is_verified
              }
            }
          }
        }
      };
      
      // Get count using Prisma
      const prismaCount = await this.prisma.question.count({
        where: whereConditions
      });
      
      // Get question IDs using Prisma
      const prismaQuestions = await this.prisma.question.findMany({
        where: whereConditions,
        select: {
          id: true
        }
      });
      
      return {
        directSqlCount: rawCountResult[0]?.count || 0,
        directSqlQuestionIds: rawQuestionsResult,
        prismaCount,
        prismaQuestionIds: prismaQuestions,
        whereConditions
      };
    } catch (error) {
      this.logger.error('Error running diagnostic queries:', error);
      throw new InternalServerErrorException('Failed to run diagnostic queries');
    }
  }
} 