import { NotFoundException } from '@nestjs/common';

export class EntityNotFoundException extends NotFoundException {
  constructor(entityName: string) {
    super(`${entityName} not found`);
  }
} 