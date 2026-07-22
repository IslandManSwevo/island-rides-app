import { BookingStatus } from '@prisma/client';

/**
 * The booking lifecycle from design/02-user-flows.md — the server is the only
 * authority on transitions; clients can merely request them.
 *
 *   pending   → confirmed (host approves; payment captured)
 *   pending   → declined | expired
 *   confirmed → active (both parties check in) | cancelled
 *   active    → completed (both check out, or auto after 24h)
 *   completed → reviewed
 */
type Actor = 'guest' | 'host' | 'system';

const TRANSITIONS: Record<BookingStatus, Partial<Record<BookingStatus, Actor[]>>> = {
  pending: {
    confirmed: ['host', 'system'],
    declined: ['host'],
    expired: ['system'],
    cancelled: ['guest'],
  },
  confirmed: {
    active: ['system'], // fired when the second TripInspection(check_in) lands
    cancelled: ['guest', 'host'],
  },
  active: {
    completed: ['system'],
  },
  completed: {
    reviewed: ['system'],
  },
  reviewed: {},
  cancelled: {},
  declined: {},
  expired: {},
};

export function canTransition(from: BookingStatus, to: BookingStatus, actor: Actor): boolean {
  return TRANSITIONS[from]?.[to]?.includes(actor) ?? false;
}

export class IllegalTransitionError extends Error {
  constructor(from: BookingStatus, to: BookingStatus, actor: Actor) {
    super(`Illegal booking transition ${from} -> ${to} by ${actor}`);
    this.name = 'IllegalTransitionError';
  }
}

export function assertTransition(from: BookingStatus, to: BookingStatus, actor: Actor): void {
  if (!canTransition(from, to, actor)) throw new IllegalTransitionError(from, to, actor);
}
