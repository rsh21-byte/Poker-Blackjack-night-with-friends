export type GameType = 'poker' | 'blackjack';

export interface Player {
  name: string;
  balance: number;
  joinedAt: number;
  status: 'waiting' | 'active' | 'eliminated';
}

export interface PlayerAction {
  type: 'call' | 'raise' | 'fold' | 'check' | 'hit' | 'stand' | 'double' | 'bet';
  amount: number;
}

export interface Round {
  active: boolean;
  baseBet: number;
  status: 'betting' | 'resolved';
  multiplier: number | null;
  winners: Record<string, boolean>;
  actions: Record<string, PlayerAction>;
}

export interface GameMeta {
  createdAt: number;
  hostId: string;
  phase: 'lobby' | 'playing' | 'ended';
  type: GameType;
}

export interface Game {
  meta: GameMeta;
  currentRound: Round | null;
  lastBaseBet?: number;
}

export interface Message {
  id?: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: number;
}

export interface RoundHistory {
  timestamp: number;
  baseBet: number;
  multiplier: number;
  actions: Record<string, PlayerAction>;
  winners: string[];
  balancesAfter: Record<string, number>;
  outcomes?: Record<string, 'win' | 'lose' | 'push' | 'blackjack'>;
}
