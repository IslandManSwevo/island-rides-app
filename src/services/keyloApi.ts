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

export const keyloApi = {
  islands: () => request<{ islands: ApiIsland[] }>('/v1/islands'),

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

  storefront: (handle: string, source?: string) =>
    request<{ storefront: unknown }>(`/v1/hosts/@${handle}${source ? `?source=${source}` : ''}`),
};
