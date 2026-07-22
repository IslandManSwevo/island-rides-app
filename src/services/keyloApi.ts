/**
 * Typed client for the KeyLo API (backend/, design/05-api-spec.md).
 * Rebuilt screens consume this; the legacy domain services are retired
 * screen-by-screen as each surface moves onto it.
 */

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export interface ApiIsland {
  id: string;
  name: string;
  features: string[];
}

export interface ApiVehiclePhoto {
  id: string;
  key: string;
  kind: string;
  isPrimary: boolean;
}

export interface ApiVehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  vehicleType: string;
  driveSide: 'LHD' | 'RHD';
  seats: number;
  transmission?: string | null;
  fuelType?: string | null;
  description?: string | null;
  features: string[];
  dailyRateCents: number;
  securityDepositCents: number;
  deliveryAvailable: boolean;
  deliveryFeeCents: number;
  airportPickup: boolean;
  airportFeeCents: number;
  instantBook: boolean;
  islandId: string;
  address?: string | null;
  verificationStatus?: 'unverified' | 'pending' | 'verified' | 'rejected';
  unlistedAt?: string | null;
  photos: ApiVehiclePhoto[];
  extras?: { id: string; name: string; priceCents: number; perTrip: boolean }[];
  host?: {
    id: string;
    displayName?: string | null;
    handle?: string | null;
    bio?: string | null;
    responseTimeMins?: number | null;
    user?: { firstName: string; avatarKey?: string | null; createdAt: string };
  };
}

export interface VehicleSearchParams {
  island?: string;
  start?: string;
  end?: string;
  type?: string;
  seats?: number;
  instantBook?: boolean;
  cursor?: string;
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
  depositCents: number;
}

export class KeyloApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = 'KeyloApiError';
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = (body as { error?: { code?: string; message?: string } }).error;
    throw new KeyloApiError(err?.code ?? 'SERVER_ERROR', err?.message ?? `Request failed (${res.status})`, res.status);
  }
  return body as T;
}

export const formatDollars = (cents: number): string =>
  `$${(cents / 100).toLocaleString('en-US', { maximumFractionDigits: cents % 100 === 0 ? 0 : 2 })}`;

export type ApiBookingStatus =
  | 'pending'
  | 'confirmed'
  | 'active'
  | 'completed'
  | 'reviewed'
  | 'cancelled'
  | 'declined'
  | 'expired';

export interface ApiBooking {
  id: string;
  status: ApiBookingStatus;
  startAt: string;
  endAt: string;
  pickupKind: string;
  flightNumber?: string | null;
  totalCents: number;
  approvalDeadline?: string | null;
  vehicle?: ApiVehicle;
}

export interface ApiProtectionPlan {
  id: string;
  name: string;
  feeBps: number;
  deductibleCents: number;
}

export const keyloApi = {
  islands: () => request<{ islands: ApiIsland[] }>('/v1/islands'),

  protectionPlans: () => request<{ plans: ApiProtectionPlan[] }>('/v1/protection-plans'),

  searchVehicles: (params: VehicleSearchParams = {}) => {
    const query = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== null && v !== '')
          .map(([k, v]) => [k, String(v)])
      )
    ).toString();
    return request<{ vehicles: ApiVehicle[]; nextCursor: string | null }>(
      `/v1/vehicles${query ? `?${query}` : ''}`
    );
  },

  vehicle: (id: string) => request<{ vehicle: ApiVehicle }>(`/v1/vehicles/${id}`),

  quote: (input: {
    vehicleId: string;
    startAt: string;
    endAt: string;
    pickupKind?: 'host_location' | 'airport' | 'delivery';
    protectionPlanId?: string;
    extraIds?: string[];
  }) => request<{ quote: QuoteBreakdown }>('/v1/bookings/quote', { method: 'POST', body: JSON.stringify(input) }),

  createBooking: (
    input: {
      vehicleId: string;
      startAt: string;
      endAt: string;
      pickupKind?: 'host_location' | 'airport' | 'delivery';
      protectionPlanId?: string;
      extraIds?: string[];
      flightNumber?: string;
      requestMessage?: string;
    },
    accessToken: string
  ) =>
    request<{ booking: { id: string; status: string }; approveUrl: string }>('/v1/bookings', {
      method: 'POST',
      body: JSON.stringify(input),
      headers: { Authorization: `Bearer ${accessToken}` },
    }),

  myBookings: (accessToken: string, role: 'guest' | 'host' = 'guest') =>
    request<{ bookings: ApiBooking[] }>(`/v1/bookings?role=${role}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),

  checkIn: (
    bookingId: string,
    payload: { odometer?: number; fuelLevel?: number; photoKeys?: string[]; notes?: string },
    accessToken: string
  ) =>
    request<{ success: boolean; tripActive: boolean }>(`/v1/bookings/${bookingId}/check-in`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { Authorization: `Bearer ${accessToken}` },
    }),

  storefront: (handle: string, source?: string) =>
    request<{ storefront: ApiStorefront }>(`/v1/hosts/@${handle}${source ? `?source=${source}` : ''}`),

  hostStorefront: (accessToken: string) =>
    request<{ storefront: { handle: string | null; displayName: string | null } }>('/v1/hosts/me/storefront', {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),

  // ---- Host mode ----

  hostDashboard: (accessToken: string) =>
    request<{ dashboard: ApiHostDashboard }>('/v1/hosts/me/dashboard', {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),

  hostVehicles: (accessToken: string) =>
    request<{ vehicles: (ApiVehicle & { _count?: { bookings: number } })[] }>('/v1/hosts/me/vehicles', {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),

  hostEarnings: (accessToken: string) =>
    request<{ earnings: ApiHostEarnings }>('/v1/hosts/me/earnings', {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),

  approveBooking: (bookingId: string, accessToken: string) =>
    request<{ booking: ApiBooking }>(`/v1/bookings/${bookingId}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    }),

  declineBooking: (bookingId: string, reason: string | undefined, accessToken: string) =>
    request<{ booking: ApiBooking }>(`/v1/bookings/${bookingId}/decline`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
};

export interface ApiStorefront {
  handle: string | null;
  displayName: string | null;
  tagline: string | null;
  bannerKey: string | null;
  bio: string | null;
  responseTimeMins: number | null;
  vehicles: ApiVehicle[];
}

export interface ApiHostBookingSummary extends ApiBooking {
  guest?: { firstName: string; lastName: string; verificationStatus: string };
  vehicle?: ApiVehicle & { make: string; model: string };
}

export interface ApiHostDashboard {
  pendingRequests: ApiHostBookingSummary[];
  todayPickups: ApiHostBookingSummary[];
  todayReturns: ApiHostBookingSummary[];
  monthEarningsCents: number;
  activeTrips: number;
  fleetSize: number;
}

export interface ApiHostEarnings {
  perVehicle: { vehicleId: string; name: string; trips: number; earningsCents: number }[];
  payouts: { id: string; amountCents: number; status: string; scheduledFor: string }[];
  splitBps: number;
  payoutEnabled: boolean;
}
