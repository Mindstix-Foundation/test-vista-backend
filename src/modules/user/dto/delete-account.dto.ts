import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export const DeleteAccountModes = ['simple', 'transfer_admin', 'delete_org'] as const;
export type DeleteAccountMode = (typeof DeleteAccountModes)[number];

export class DeleteMyAccountDto {
  @ApiProperty({ description: 'Current account password for confirmation' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  password: string;

  @ApiPropertyOptional({
    enum: DeleteAccountModes,
    description:
      'Teacher org-admin path: transfer_admin (promote then delete) or delete_org (hard-delete org then delete). Omit/simple for free teachers, non-admin teachers, and students.',
  })
  @IsOptional()
  @IsIn(DeleteAccountModes)
  mode?: DeleteAccountMode;

  @ApiPropertyOptional({
    description: 'Active teacher membership id to promote (required when mode=transfer_admin)',
  })
  @ValidateIf((o) => o.mode === 'transfer_admin')
  @Type(() => Number)
  @IsInt()
  promote_membership_id?: number;

  @ApiPropertyOptional({
    description: 'Must be true when mode=delete_org (hard-delete organization)',
  })
  @ValidateIf((o) => o.mode === 'delete_org')
  @IsBoolean()
  confirm_delete_org?: boolean;
}
