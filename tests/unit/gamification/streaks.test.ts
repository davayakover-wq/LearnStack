import { describe, expect, it } from 'vitest';
import { computeStreakUpdate, type StreakState } from '@/lib/gamification/streaks';

const TODAY = new Date('2026-01-15T12:00:00Z');

describe('computeStreakUpdate', () => {
  it('starts a brand-new streak at 1 on first-ever activity', () => {
    const state: StreakState = {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
    };
    const result = computeStreakUpdate(state, TODAY);
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
    expect(result.lastActivityDate).toBe('2026-01-15');
    expect(result.streakBroken).toBe(false);
    expect(result.freezeUsed).toBe(false);
  });

  it('is a no-op when activity is already recorded today', () => {
    const state: StreakState = {
      currentStreak: 5,
      longestStreak: 5,
      lastActivityDate: '2026-01-15',
    };
    const result = computeStreakUpdate(state, TODAY);
    expect(result).toEqual({
      currentStreak: 5,
      longestStreak: 5,
      lastActivityDate: '2026-01-15',
      streakExtended: false,
      freezeUsed: false,
      streakBroken: false,
    });
  });

  it('extends the streak by 1 on a consecutive day', () => {
    const state: StreakState = {
      currentStreak: 5,
      longestStreak: 5,
      lastActivityDate: '2026-01-14',
    };
    const result = computeStreakUpdate(state, TODAY);
    expect(result.currentStreak).toBe(6);
    expect(result.longestStreak).toBe(6);
    expect(result.freezeUsed).toBe(false);
    expect(result.streakBroken).toBe(false);
  });

  it('covers exactly one missed day with the grace/freeze mechanic', () => {
    const state: StreakState = {
      currentStreak: 5,
      longestStreak: 5,
      lastActivityDate: '2026-01-13', // 2 days ago
    };
    const result = computeStreakUpdate(state, TODAY);
    expect(result.currentStreak).toBe(6);
    expect(result.freezeUsed).toBe(true);
    expect(result.streakBroken).toBe(false);
  });

  it('breaks the streak back to 1 after missing two or more consecutive days', () => {
    const state: StreakState = {
      currentStreak: 10,
      longestStreak: 10,
      lastActivityDate: '2026-01-11', // 4 days ago — a 3-day gap
    };
    const result = computeStreakUpdate(state, TODAY);
    expect(result.currentStreak).toBe(1);
    expect(result.streakBroken).toBe(true);
    expect(result.freezeUsed).toBe(false);
  });

  it('preserves the historical longestStreak even after the current streak breaks', () => {
    const state: StreakState = {
      currentStreak: 20,
      longestStreak: 20,
      lastActivityDate: '2026-01-01', // long gap, definitely broken
    };
    const result = computeStreakUpdate(state, TODAY);
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(20);
  });

  it('updates longestStreak when a new streak surpasses the old record', () => {
    const state: StreakState = {
      currentStreak: 3,
      longestStreak: 3,
      lastActivityDate: '2026-01-14',
    };
    const result = computeStreakUpdate(state, TODAY);
    expect(result.currentStreak).toBe(4);
    expect(result.longestStreak).toBe(4);
  });
});
