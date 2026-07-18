import {
  Home,
  BookOpen,
  RotateCcw,
  BarChart3,
  UserRound,
  ShieldCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

// Shared between the desktop sidebar and the mobile tab bar — see
// docs/02-ux-design-system.md ("same five destinations plus admin").
export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/learn', label: 'Learn', icon: BookOpen },
  { href: '/review', label: 'Review', icon: RotateCcw },
  { href: '/stats', label: 'Stats', icon: BarChart3 },
  { href: '/profile', label: 'Profile', icon: UserRound },
];

export const ADMIN_NAV_ITEM: NavItem = {
  href: '/admin',
  label: 'Admin',
  icon: ShieldCheck,
};
