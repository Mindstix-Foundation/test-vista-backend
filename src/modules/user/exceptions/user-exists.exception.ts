import { ConflictException } from '@nestjs/common';

export class UserExistsException extends ConflictException {
  constructor(email: string) {
    super(`User with email ${email} already exists`);
  }
} 