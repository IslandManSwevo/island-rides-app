import type { Extra, ProtectionPlan, Vehicle } from '@prisma/client';

/** KeyLo guest-side service fee, basis points of the trip subtotal. */
export const SERVICE_FEE_BPS = 1200;
export const YOUNG_DRIVER_AGE = 25;

export interface QuoteInput {
  vehicle: Vehicle;
  plan: ProtectionPlan;
  nights: number;
  pickupKind: 'host_location' | 'airport' | 'delivery';
  extras: Extra[];
  guestAge?: number;
}

export interface QuoteBreakdown {
  nightlyRateCents: number;
  nights: number;
  baseCents: number;
  durationDiscountCents: number;
  extrasCents: number;
  deliveryCents: number;
  youngDriverCents: number;
  protectionCents: number;
  serviceFeeCents: number;
  totalCents: number;
  hostEarningsCents: number;
  depositCents: number;
}

/**
 * The checkout math — server-authoritative (design/05-api-spec.md,
 * POST /bookings/quote). Weekly/monthly discounts apply at 7+/28+ nights;
 * protection is a % of the discounted subtotal; the host split comes from
 * their plan tier and excludes guest-side fees.
 */
export function quote(input: QuoteInput, hostSplitBps: number): QuoteBreakdown {
  const { vehicle, plan, nights, pickupKind, extras, guestAge } = input;

  const baseCents = vehicle.dailyRateCents * nights;

  let discountBps = 0;
  if (nights >= 28) discountBps = vehicle.monthlyDiscountBps;
  else if (nights >= 7) discountBps = vehicle.weeklyDiscountBps;
  const durationDiscountCents = Math.round((baseCents * discountBps) / 10_000);

  const subtotalCents = baseCents - durationDiscountCents;

  const extrasCents = extras.reduce(
    (sum, extra) => sum + (extra.perTrip ? extra.priceCents : extra.priceCents * nights),
    0
  );

  const deliveryCents =
    pickupKind === 'airport' ? vehicle.airportFeeCents : pickupKind === 'delivery' ? vehicle.deliveryFeeCents : 0;

  const youngDriverCents =
    guestAge !== undefined && guestAge < YOUNG_DRIVER_AGE ? vehicle.youngDriverFeeCents * nights : 0;

  const protectionCents = Math.round((subtotalCents * plan.feeBps) / 10_000);
  const serviceFeeCents = Math.round((subtotalCents * SERVICE_FEE_BPS) / 10_000);

  const totalCents =
    subtotalCents + extrasCents + deliveryCents + youngDriverCents + protectionCents + serviceFeeCents;

  // Host earns their split of the trip subtotal plus their own add-ons in full.
  const hostEarningsCents =
    Math.round((subtotalCents * hostSplitBps) / 10_000) + extrasCents + deliveryCents;

  return {
    nightlyRateCents: vehicle.dailyRateCents,
    nights,
    baseCents,
    durationDiscountCents,
    extrasCents,
    deliveryCents,
    youngDriverCents,
    protectionCents,
    serviceFeeCents,
    totalCents,
    hostEarningsCents,
    depositCents: vehicle.securityDepositCents,
  };
}
