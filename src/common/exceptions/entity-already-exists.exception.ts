import { ConflictException } from '@nestjs/common';

export class EntityAlreadyExistsException extends ConflictException {
  constructor(entityName: string) {
    super(`${entityName} already exists`);
  }
} 