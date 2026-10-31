/**
 * NEXUS Remote — useAuth hook.
 *
 * Central state for pairing/auth:
 *   - isPaired:      does the user have a valid token?
 *   - isLoading:     are we checking / verifying right now?
 *   - deviceName:    name of the paired device (from backend)
 *   - error:         last error message (shown in UI)
 *
 * On mount: if a token exists, verify it with backend.
 * If valid → isPaired = true. If not → clear + isPaired = false.
 */

import { useCallback, useEffect, useState } from "react";
import { authApi, tokenStore, ApiError } from "../services/api";
import type { AuthState } from "../types/auth";

// Stable per-browser device identifier (used as device_fingerprint).
// Generated once on first use, then persisted in localStorage.
const FINGERPRINT_KEY = "nexus.fingerprint";

function getOrCreateFingerprint(): string {
  let fp = localStorage.getItem(FINGERPRINT_KEY);
  // If it's missing OR too short (causing a 422 error), generate a new one
  if (!fp || fp.length < 16) {
    // Fallback to Math.random if crypto.randomUUID is unavailable
    const raw =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID().replace(/-/g, "")
        : Math.random().toString(36).substring(2) + Date.now().toString(36);

    // Force it to be at least 16 chars, max 32
    fp = (raw + "0000000000000000").substring(0, 32);
    localStorage.setItem(FINGERPRINT_KEY, fp);
  }
  return fp;
}

// Human-readable default device name (user can override in settings later)
function guessDeviceName(): string {
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return "Android Phone";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS Device";
  if (/Windows/i.test(ua)) return "Windows PC";
  if (/Mac/i.test(ua)) return "Mac";
  if (/Linux/i.test(ua)) return "Linux";
  return "Unknown Device";
}

export interface UseAuthResult extends AuthState {
  pair: (pin: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export function useAuth(): UseAuthResult {
  const [state, setState] = useState<AuthState>({
    isPaired: false,
    isLoading: true, // start loading — we don't know yet
    deviceName: null,
    error: null,
  });

  // -------------------------------------------------------------------------
  // On mount: check existing token
  // -------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function checkExistingToken() {
      if (!tokenStore.exists()) {
        if (!cancelled) {
          setState({
            isPaired: false,
            isLoading: false,
            deviceName: null,
            error: null,
          });
        }
        return;
      }

      try {
        const result = await authApi.verify();
        if (!cancelled) {
          if (result.valid) {
            setState({
              isPaired: true,
              isLoading: false,
              deviceName: result.device_name ?? null,
              error: null,
            });
          } else {
            tokenStore.clear();
            setState({
              isPaired: false,
              isLoading: false,
              deviceName: null,
              error: null,
            });
          }
        }
      } catch (err) {
        if (!cancelled) {
          // Network error or backend down — don't clear the token,
          // user might just be temporarily offline.
          tokenStore.clear();
          setState({
            isPaired: false,
            isLoading: false,
            deviceName: null,
            error:
              err instanceof ApiError
                ? err.message
                : "Unable to verify session",
          });
        }
      }
    }

    checkExistingToken();
    return () => {
      cancelled = true;
    };
  }, []);

  // -------------------------------------------------------------------------
  // pair(pin) — exchange PIN for token
  // -------------------------------------------------------------------------
  const pair = useCallback(async (pin: string) => {
    setState((s) => ({ ...s, isLoading: true, error: null }));

    try {
      const result = await authApi.pair({
        pin,
        device_name: guessDeviceName(),
        device_fingerprint: getOrCreateFingerprint(),
      });
      tokenStore.set(result.token);
      setState({
        isPaired: true,
        isLoading: false,
        deviceName: result.device_name,
        error: null,
      });
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Unable to pair. Check your PIN and try again.";
      setState({
        isPaired: false,
        isLoading: false,
        deviceName: null,
        error: msg,
      });
      throw err; // let the caller (pairing page) also react if needed
    }
  }, []);

  // -------------------------------------------------------------------------
  // logout() — revoke token on backend + clear local storage
  // -------------------------------------------------------------------------
  const logout = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      await authApi.disconnect();
    } catch {
      // Ignore network errors on logout — always clear locally
    }
    tokenStore.clear();
    setState({
      isPaired: false,
      isLoading: false,
      deviceName: null,
      error: null,
    });
  }, []);

  // -------------------------------------------------------------------------
  // clearError() — dismiss an error message in UI
  // -------------------------------------------------------------------------
  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }));
  }, []);

  return { ...state, pair, logout, clearError };
}
