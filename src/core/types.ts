import { User, Team } from '@prisma/client';

export type UserRole = 'ADMIN' | 'DRIVER' | 'RESERVE';
export type PlatformType = 'PC_STEAM' | 'PC_EA' | 'PC_XBOX' | 'PC_EPIC' | 'PLAYSTATION' | 'XBOX' | 'PC' | 'PS5';
export type AttendanceStatus = 'ATTENDING' | 'ABSENT' | 'RESERVE';
export type RaceStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type SeasonStatus = 'UPCOMING' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';

export interface PlatformOption {
  id: string;
  category: 'PC' | 'CONSOLE';
  name: string;
  badge: string;
  placeholder: string;
}

export const PLATFORM_OPTIONS: PlatformOption[] = [
  { id: 'PC_STEAM', category: 'PC', name: 'PC – Steam', badge: 'Steam', placeholder: 'Steam Profilname' },
  { id: 'PC_EA', category: 'PC', name: 'PC – EA App', badge: 'EA App', placeholder: 'EA App Name' },
  { id: 'PC_XBOX', category: 'PC', name: 'PC – Xbox App', badge: 'Xbox PC', placeholder: 'Xbox Gamertag' },
  { id: 'PC_EPIC', category: 'PC', name: 'PC – Epic Games', badge: 'Epic', placeholder: 'Epic Games Name' },
  { id: 'PLAYSTATION', category: 'CONSOLE', name: 'PlayStation (PSN)', badge: 'PSN', placeholder: 'PSN Online-ID' },
  { id: 'XBOX', category: 'CONSOLE', name: 'Xbox Series X/S / One', badge: 'Xbox', placeholder: 'Xbox Gamertag' },
];

export function getPlatformBadge(platform?: string | null): string {
  switch (platform) {
    case 'PC_STEAM': return 'Steam';
    case 'PC_EA': return 'EA App';
    case 'PC_XBOX': return 'Xbox PC';
    case 'PC_EPIC': return 'Epic';
    case 'PLAYSTATION':
    case 'PS5': return 'PSN';
    case 'XBOX': return 'Xbox';
    default: return platform || 'PC';
  }
}

export function getPlatformFullName(platform?: string | null): string {
  const match = PLATFORM_OPTIONS.find((p) => p.id === platform);
  return match ? match.name : (platform || 'PC');
}

export interface SessionUser {
  id: string;
  discordId: string;
  discordUsername: string;
  discordAvatar: string | null;
  gamertag: string | null;
  eaId: string | null;
  platform: string | null;
  platformUsername: string | null;
  raceNumber: number | null;
  assists: string | null;
  experience: string | null;
  role: string;
  isAdmin?: boolean;
  hasDriverRole?: boolean;
  teamId: string | null;
  team?: Team | null;
}

declare module 'express-session' {
  interface SessionData {
    user?: SessionUser;
    oauthState?: string;
    flashMessage?: {
      type: 'success' | 'danger' | 'warning' | 'info';
      text: string;
    };
  }
}

