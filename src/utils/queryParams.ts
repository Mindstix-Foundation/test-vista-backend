import { BadRequestException } from '@nestjs/common';

export function parseQueryParams(params: Record<string, any>, intFields: string[]) {
  const parsedParams: Record<string, any> = {};

  for (const field of intFields) {
    if (params[field]) {
      const parsed = parseInt(params[field], 10);
      if (isNaN(parsed)) {
        throw new BadRequestException(`Invalid value for ${field}. Expected a number.`);
      }
      parsedParams[field] = parsed;
    }
  }

  return parsedParams;
}