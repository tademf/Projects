/**
 * NEXUS Remote — Auth-related TypeScript types.
 *
 * Mirrors the backend Pydantic models so the frontend is type-safe.
 * If the backend adds a field later, TypeScript will flag it here.
 */

// ---------------------------------------------------------------------------
// Device
// ---------------------------------------------------------------------------
export interface Device {
  device_id: number;
  device_name: string;
  device_fingerprint: string;
  paired_at: string; // ISO datetime
  last_seen_at: string; // ISO datetime
  is_active: boolean;
}

// ---------------------------------------------------------------------------
// Pairing
// ---------------------------------------------------------------------------
export interface PairRequest {
  pin: string;
  device_name: string;
  device_fingerprint: string;
}

export interface PairResponse {
  token: string;
  device_id: number;
  device_name: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Verify
// ---------------------------------------------------------------------------
export interface VerifyResponse {
  valid: boolean;
  device_id?: number;
  device_name?: string;
}

// ---------------------------------------------------------------------------
// Auth state (used by useAuth hook)
// ---------------------------------------------------------------------------
export interface AuthState {
  isPaired: boolean;
  isLoading: boolean;
  deviceName: string | null;
  error: string | null;
}
