import { describe, expect, it } from 'vitest';
import { createInitialReviewState, sm2 } from '@/lib/srs/sm2';

const TODAY = new Date('2026-01-15T12:00:00Z');

describe('createInitialReviewState', () => {
  it('starts every card at the textbook SM-2 defaults', () => {
    expect(createInitialReviewState()).toEqual({
      easeFactor: 2.5,
      intervalDays: 1,
      repetitions: 0,
    });
  });
});

describe('sm2', () => {
  it('schedules the first correct review 1 day out without changing ease factor', () => {
    const result = sm2(createInitialReviewState(), true, TODAY);
    expect(result.intervalDays).toBe(1);
    expect(result.repetitions).toBe(1);
    expect(result.easeFactor).toBe(2.5); // quality 4 is the neutral point
    expect(result.dueAt).toBe('2026-01-16');
  });

  it('schedules the second consecutive correct review 6 days out', () => {
    const afterFirst = sm2(createInitialReviewState(), true, TODAY);
    const afterSecond = sm2(afterFirst, true, TODAY);
    expect(afterSecond.intervalDays).toBe(6);
    expect(afterSecond.repetitions).toBe(2);
  });

  it('multiplies the interval by ease factor from the third correct review onward', () => {
    let state = sm2(createInitialReviewState(), true, TODAY); // interval 1
    state = sm2(state, true, TODAY); // interval 6
    state = sm2(state, true, TODAY); // interval round(6 * 2.5) = 15
    expect(state.intervalDays).toBe(15);
    expect(state.repetitions).toBe(3);
  });

  it('lengthens the interval across a long correct streak (docs/01: correct answers lengthen the interval)', () => {
    let state = sm2(createInitialReviewState(), true, TODAY);
    const intervals: number[] = [state.intervalDays];
    for (let i = 1; i < 6; i++) {
      state = sm2(state, true, TODAY);
      intervals.push(state.intervalDays);
    }
    for (let i = 1; i < intervals.length; i++) {
      expect(intervals[i]).toBeGreaterThanOrEqual(intervals[i - 1]);
    }
    expect(intervals[intervals.length - 1]).toBeGreaterThan(intervals[0]);
  });

  it('resets repetitions and interval to 1 on an incorrect answer (docs/01: wrong answers shorten the interval)', () => {
    let state = sm2(createInitialReviewState(), true, TODAY);
    state = sm2(state, true, TODAY); // interval 6, repetitions 2
    state = sm2(state, false, TODAY);
    expect(state.intervalDays).toBe(1);
    expect(state.repetitions).toBe(0);
  });

  it('lowers ease factor on an incorrect answer (docs/01: wrong answers lower ease)', () => {
    const state = sm2(createInitialReviewState(), false, TODAY);
    expect(state.easeFactor).toBeLessThan(2.5);
  });

  it('never lets ease factor drop below the SM-2 floor of 1.3', () => {
    let state = sm2(createInitialReviewState(), false, TODAY);
    for (let i = 1; i < 20; i++) {
      state = sm2(state, false, TODAY);
    }
    expect(state.easeFactor).toBeGreaterThanOrEqual(1.3);
    expect(state.easeFactor).toBe(1.3);
  });

  it('computes dueAt across a month boundary correctly', () => {
    const lateMonth = new Date('2026-01-30T00:00:00Z');
    let state = sm2(createInitialReviewState(), true, lateMonth); // interval 1 -> due 2026-01-31
    state = sm2(state, true, lateMonth); // interval 6 -> due 2026-02-05
    expect(state.dueAt).toBe('2026-02-05');
  });

  it('keeps memoryStrength within the documented 0-100 bounds', () => {
    let state = sm2(createInitialReviewState(), true, TODAY);
    expect(state.memoryStrength).toBeGreaterThanOrEqual(0);
    expect(state.memoryStrength).toBeLessThanOrEqual(100);
    for (let i = 1; i < 10; i++) {
      state = sm2(state, true, TODAY);
      expect(state.memoryStrength).toBeGreaterThanOrEqual(0);
      expect(state.memoryStrength).toBeLessThanOrEqual(100);
    }
  });

  it('increases memoryStrength across a consistent correct streak', () => {
    let state = sm2(createInitialReviewState(), true, TODAY);
    const early = state.memoryStrength;
    for (let i = 0; i < 5; i++) {
      state = sm2(state, true, TODAY);
    }
    expect(state.memoryStrength).toBeGreaterThan(early);
  });

  it('drops memoryStrength after an incorrect answer following a correct streak', () => {
    let state = sm2(createInitialReviewState(), true, TODAY);
    for (let i = 1; i < 4; i++) {
      state = sm2(state, true, TODAY);
    }
    const beforeMiss = state.memoryStrength;
    state = sm2(state, false, TODAY);
    expect(state.memoryStrength).toBeLessThan(beforeMiss);
  });
});
