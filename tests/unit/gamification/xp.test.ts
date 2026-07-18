import { describe, expect, it } from 'vitest';
import { levelProgress, xpForLevel } from '@/lib/gamification/xp';

describe('xpForLevel', () => {
  it('requires 0 XP for level 1', () => {
    expect(xpForLevel(1)).toBe(0);
  });

  it('requires 100 XP for level 2', () => {
    expect(xpForLevel(2)).toBe(100);
  });

  it('requires 300 XP for level 3', () => {
    expect(xpForLevel(3)).toBe(300);
  });

  it('grows quadratically (level 10 costs far more than 10x level 1->2)', () => {
    const level2Cost = xpForLevel(2) - xpForLevel(1);
    const level10Cost = xpForLevel(10) - xpForLevel(9);
    expect(level10Cost).toBeGreaterThan(level2Cost * 5);
  });
});

describe('levelProgress', () => {
  it('starts a brand-new user at level 1 with 0 progress', () => {
    const result = levelProgress(0);
    expect(result).toEqual({
      level: 1,
      xpIntoLevel: 0,
      xpForNextLevel: 100,
      progress: 0,
    });
  });

  it('reports partial progress within the current level', () => {
    const result = levelProgress(50);
    expect(result.level).toBe(1);
    expect(result.xpIntoLevel).toBe(50);
    expect(result.xpForNextLevel).toBe(100);
    expect(result.progress).toBe(0.5);
  });

  it('rolls over to the next level exactly at the threshold', () => {
    const result = levelProgress(100);
    expect(result.level).toBe(2);
    expect(result.xpIntoLevel).toBe(0);
    expect(result.xpForNextLevel).toBe(200); // xpForLevel(3) - xpForLevel(2) = 300 - 100
  });

  it('handles large XP totals by advancing through every intermediate level', () => {
    // xpForLevel(5) = 50*5*4 = 1000
    const result = levelProgress(1000);
    expect(result.level).toBe(5);
    expect(result.xpIntoLevel).toBe(0);
  });

  it('never divides by zero and always returns a finite progress ratio', () => {
    for (const xp of [0, 1, 99, 100, 101, 5000]) {
      const result = levelProgress(xp);
      expect(Number.isFinite(result.progress)).toBe(true);
      expect(result.progress).toBeGreaterThanOrEqual(0);
    }
  });
});
