import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class JoinInstitutionDto {
  @ApiPropertyOptional({ example: 'Looking to teach Mathematics for Std 10' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  request_message?: string;
}

export class JoinByCodeDto {
  @ApiProperty({ example: 'TV-S-JVRF-5SMQAX' })
  @IsString()
  @Length(3, 32)
  org_code: string;

  @ApiPropertyOptional({ example: 'Looking to teach Mathematics for Std 10' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  request_message?: string;
}

export class JoinCoachingDto {
  @ApiProperty({ example: 12, description: 'School_Standard id under the coaching linked School' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  school_standard_id: number;

  @ApiPropertyOptional({ example: 'Want to join for JEE batch / Std 12 science' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  request_message?: string;
}

export class JoinCoachingByCodeDto {
  @ApiProperty({ example: 'TV-C-XXXX-XXXX' })
  @IsString()
  @Length(3, 32)
  org_code: string;

  @ApiProperty({ example: 12 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  school_standard_id: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 500)
  request_message?: string;
}

export enum MembershipDecisionDto {
  active = 'active',
  rejected = 'rejected',
}

export class RespondMembershipDto {
  @ApiProperty({ enum: MembershipDecisionDto, example: 'active' })
  @IsEnum(MembershipDecisionDto)
  status: MembershipDecisionDto;
}
