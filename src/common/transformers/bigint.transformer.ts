import { Prisma } from '@prisma/client';

export const bigIntTransformer = {
  to: (value: string | null): bigint | null => {
    return value ? BigInt(value) : null;
  },
  from: (value: bigint | null): string | null => {
    return value?.toString() || null;
  },
}; 