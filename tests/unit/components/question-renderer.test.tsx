import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  isResponseComplete,
  QuestionRenderer,
} from '@/components/quiz/question-renderer';
import type { QuestionForPlayer } from '@/lib/data/lessons';
import type { QuestionResponseInput } from '@/lib/validations/lesson';

function makeQuestion(
  type: QuestionForPlayer['type'],
  overrides: Partial<QuestionForPlayer> = {},
): QuestionForPlayer {
  return {
    id: 'q1',
    type,
    prompt: 'What is 2 + 2?',
    promptMediaUrl: null,
    metadata: {},
    answers: [
      { id: 'a1', content: 'Four', sortOrder: 0 },
      { id: 'a2', content: 'Five', sortOrder: 1 },
    ],
    ...overrides,
  };
}

function renderQuestion(
  type: QuestionForPlayer['type'],
  value: QuestionResponseInput = {},
  onChange = vi.fn(),
) {
  const question = makeQuestion(type);
  render(<QuestionRenderer question={question} value={value} onChange={onChange} />);
  return { question, onChange };
}

describe('QuestionRenderer dispatch', () => {
  it('renders MultipleChoiceQuestion for multiple_choice', () => {
    renderQuestion('multiple_choice');
    expect(screen.getByText('Four')).toBeInTheDocument();
    expect(screen.getByText('Five')).toBeInTheDocument();
  });

  it('renders MultipleChoiceQuestion for image_choice (shares the same UI)', () => {
    renderQuestion('image_choice');
    expect(screen.getByText('Four')).toBeInTheDocument();
  });

  it('renders TextAnswerQuestion for fill_blank', () => {
    renderQuestion('fill_blank');
    expect(screen.getByPlaceholderText('Type your answer…')).toBeInTheDocument();
  });

  it('renders TextAnswerQuestion for typing', () => {
    renderQuestion('typing');
    expect(screen.getByPlaceholderText('Type your answer…')).toBeInTheDocument();
  });

  it('renders SequenceQuestion for ordering', () => {
    renderQuestion('ordering');
    expect(screen.getAllByLabelText('Move up').length).toBeGreaterThan(0);
  });

  it('renders SequenceQuestion for matching', () => {
    renderQuestion('matching');
    expect(screen.getAllByLabelText('Move up').length).toBeGreaterThan(0);
  });

  it('renders SequenceQuestion for drag_drop', () => {
    renderQuestion('drag_drop');
    expect(screen.getAllByLabelText('Move up').length).toBeGreaterThan(0);
  });

  it('calls onChange with the selected answerId when a multiple-choice option is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderQuestion('multiple_choice', {}, onChange);
    await user.click(screen.getByText('Four'));
    expect(onChange).toHaveBeenCalledWith({ answerId: 'a1' });
  });

  it('calls onChange with typed text for a text-answer question', async () => {
    // A controlled wrapper mirroring how the real lesson/quiz player feeds
    // `value` back in — a static, never-updated `value` prop would make a
    // controlled <Input> reset after every keystroke, which is a test-setup
    // artifact, not real app behavior.
    function ControlledTyping() {
      const [value, setValue] = useState<QuestionResponseInput>({});
      return (
        <QuestionRenderer
          question={makeQuestion('typing')}
          value={value}
          onChange={setValue}
        />
      );
    }
    const user = userEvent.setup();
    render(<ControlledTyping />);
    await user.type(screen.getByPlaceholderText('Type your answer…'), 'hi');
    expect(screen.getByPlaceholderText('Type your answer…')).toHaveValue('hi');
  });
});

describe('isResponseComplete', () => {
  it('requires an answerId for multiple_choice/image_choice', () => {
    const q = makeQuestion('multiple_choice');
    expect(isResponseComplete(q, {})).toBe(false);
    expect(isResponseComplete(q, { answerId: 'a1' })).toBe(true);
  });

  it('requires non-empty trimmed text for fill_blank/typing', () => {
    const q = makeQuestion('fill_blank');
    expect(isResponseComplete(q, {})).toBe(false);
    expect(isResponseComplete(q, { text: '   ' })).toBe(false);
    expect(isResponseComplete(q, { text: 'answer' })).toBe(true);
  });

  it('requires answerIds to match the answers length for ordering/matching/drag_drop', () => {
    const q = makeQuestion('ordering');
    expect(isResponseComplete(q, {})).toBe(false);
    expect(isResponseComplete(q, { answerIds: ['a1'] })).toBe(false);
    expect(isResponseComplete(q, { answerIds: ['a1', 'a2'] })).toBe(true);
  });
});
