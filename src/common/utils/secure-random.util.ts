import { randomBytes, randomInt } from 'node:crypto';

/** Cryptographically strong float in [0, 1). */
export function randomUnitInterval(): number {
  return randomInt(0, 2 ** 30) / 2 ** 30;
}

export function randomChance(probability: number): boolean {
  return randomUnitInterval() < probability;
}

export function randomIndex(length: number): number {
  if (length <= 0) {
    throw new RangeError('Cannot pick from an empty collection');
  }
  return randomInt(0, length);
}

export function pickRandom<T>(items: readonly T[]): T {
  return items[randomIndex(items.length)];
}

export function shuffleInPlace<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

export function shuffledCopy<T>(items: readonly T[]): T[] {
  return shuffleInPlace([...items]);
}

export function randomHexToken(length: number): string {
  return randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length)
    .toUpperCase();
}
