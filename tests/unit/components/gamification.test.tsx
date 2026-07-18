import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { XpGainPopup } from '@/components/gamification/xp-gain-popup';
import { StreakFlame } from '@/components/gamification/streak-flame';
import { AchievementToast } from '@/components/gamification/achievement-toast';
import { LevelUpOverlay } from '@/components/gamification/level-up-overlay';
import { CelebrationSequence } from '@/components/gamification/celebration-sequence';
import type { UnlockedAchievement, CompletionRewards } from '@/lib/data/gamification';

function makeAchievement(
  overrides: Partial<UnlockedAchievement> = {},
): UnlockedAchievement {
  return {
    id: 'ach1',
    slug: 'first-lesson',
    name: 'First Steps',
    description: 'Complete your first lesson.',
    icon: null,
    xpBonus: 10,
    ...overrides,
  };
}

function makeRewards(overrides: Partial<CompletionRewards> = {}): CompletionRewards {
  return {
    xpAwarded: 10,
    coinsAwarded: 0,
    newXp: 10,
    newLevel: 1,
    leveledUp: false,
    streak: { current: 1, longest: 1, extended: true, freezeUsed: false, broken: false },
    unlockedAchievements: [],
    ...overrides,
  };
}

describe('XpGainPopup', () => {
  it('renders the awarded XP amount', () => {
    render(<XpGainPopup amount={25} />);
    expect(screen.getByText('+25 XP')).toBeInTheDocument();
  });

  it('renders nothing for a zero or negative amount', () => {
    const { container } = render(<XpGainPopup amount={0} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('StreakFlame', () => {
  it('always renders the flame icon regardless of the pulse prop', () => {
    const { container: withoutPulse } = render(<StreakFlame />);
    expect(withoutPulse.querySelector('svg')).toBeInTheDocument();
    const { container: withPulse } = render(<StreakFlame pulse />);
    expect(withPulse.querySelector('svg')).toBeInTheDocument();
  });
});

describe('AchievementToast', () => {
  it('shows nothing when achievement is null even if open is true', () => {
    render(<AchievementToast achievement={null} open onOpenChange={() => {}} />);
    expect(screen.queryByText('Achievement unlocked!')).not.toBeInTheDocument();
  });

  it('renders the achievement name, description, and XP bonus when open', () => {
    render(
      <AchievementToast
        achievement={makeAchievement({ name: 'Perfectionist', xpBonus: 20 })}
        open
        onOpenChange={() => {}}
      />,
    );
    expect(screen.getByText('Achievement unlocked!')).toBeInTheDocument();
    expect(screen.getByText('Perfectionist')).toBeInTheDocument();
    expect(screen.getByText('+20 XP bonus')).toBeInTheDocument();
  });

  it('omits the XP bonus line when xpBonus is 0', () => {
    render(
      <AchievementToast
        achievement={makeAchievement({ xpBonus: 0 })}
        open
        onOpenChange={() => {}}
      />,
    );
    expect(screen.queryByText(/XP bonus/)).not.toBeInTheDocument();
  });
});

describe('LevelUpOverlay', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <LevelUpOverlay level={5} open={false} onDismiss={() => {}} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the reached level when open', () => {
    render(<LevelUpOverlay level={5} open onDismiss={() => {}} />);
    expect(screen.getByText('Level 5!')).toBeInTheDocument();
  });

  it('calls onDismiss when the Continue button is clicked', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(<LevelUpOverlay level={3} open onDismiss={onDismiss} />);
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(onDismiss).toHaveBeenCalled();
  });
});

describe('CelebrationSequence', () => {
  it('renders nothing when rewards is null', () => {
    const { container } = render(<CelebrationSequence rewards={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the XP popup when xpAwarded is positive', () => {
    render(<CelebrationSequence rewards={makeRewards({ xpAwarded: 15 })} />);
    expect(screen.getByText('+15 XP')).toBeInTheDocument();
  });

  it('does not render the XP popup when xpAwarded is zero', () => {
    render(<CelebrationSequence rewards={makeRewards({ xpAwarded: 0 })} />);
    expect(screen.queryByText(/XP$/)).not.toBeInTheDocument();
  });

  it('shows the first unlocked achievement before any level-up overlay', () => {
    render(
      <CelebrationSequence
        rewards={makeRewards({
          leveledUp: true,
          newLevel: 4,
          unlockedAchievements: [makeAchievement({ name: 'On Fire' })],
        })}
      />,
    );
    expect(screen.getByText('On Fire')).toBeInTheDocument();
    expect(screen.queryByText('Level 4!')).not.toBeInTheDocument();
  });

  it('steps to the level-up overlay once the achievement is dismissed', async () => {
    const user = userEvent.setup();
    render(
      <CelebrationSequence
        rewards={makeRewards({
          leveledUp: true,
          newLevel: 4,
          unlockedAchievements: [makeAchievement({ name: 'On Fire' })],
        })}
      />,
    );
    // Dismiss the achievement dialog by pressing Escape (Dialog's own
    // onOpenChange(false) path), advancing the sequence's internal index.
    await user.keyboard('{Escape}');
    expect(await screen.findByText('Level 4!')).toBeInTheDocument();
  });

  it('shows the level-up overlay immediately when there are no achievements to step through', () => {
    render(
      <CelebrationSequence rewards={makeRewards({ leveledUp: true, newLevel: 2 })} />,
    );
    expect(screen.getByText('Level 2!')).toBeInTheDocument();
  });

  it('shows no level-up overlay when leveledUp is false', () => {
    render(<CelebrationSequence rewards={makeRewards({ leveledUp: false })} />);
    expect(screen.queryByText(/^Level \d+!$/)).not.toBeInTheDocument();
  });
});
