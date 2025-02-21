import { PartialType } from '@nestjs/swagger';
import { CreateSubsectionQuestionTypeDto } from './create-subsection-question-type.dto';

export class UpdateSubsectionQuestionTypeDto extends PartialType(CreateSubsectionQuestionTypeDto) {} 