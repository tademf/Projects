/**
 * NEXUS Remote — useSystemStats hook.
 * Connects to the backend WebSocket (/ws/system) and streams live stats.
 */

import { useEffect, useRef, useState } from "react";
import { tokenStore, BACKEND_URL } from "../services/api";

export interface SystemStats {
  cpu: { percent: number; cores_logical: number };
  ram: {
    percent: number;
    used_gb: number;
    total_gb: number;
    available_gb: number;
  };
  disk: { percent: number; used_gb: number; total_gb: number; free_gb: number };
  network: { bytes_sent_total: number; bytes_recv_total: number };
  battery: {
    percent: number;
    plugged: boolean;
    seconds_left: number | null;
  } | null;
  uptime_seconds: number;
}

export interface DeviceInfo {
  hostname: string;
  os: string;
  cpu_model: string;
  cpu_cores_physical: number;
  cpu_cores_logical: number;
  cpu_freq_mhz: number;
  total_ram_gb: number;
}

export function useSystemStats() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [uptimeHuman, setUptimeHuman] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const token = tokenStore.get();
    if (!token) {
      setError("Not authenticated");
      return;
    }

    // Convert http:// to ws://
    const wsUrl =
      BACKEND_URL.replace(/^http/, "ws") + `/ws/system?token=${token}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "hello") {
          setDevice(payload.device);
        } else if (payload.type === "stats") {
          setStats(payload.data);
          setUptimeHuman(payload.uptime_human);
        }
      } catch (err) {
        console.error("Failed to parse WS message", err);
      }
    };

    ws.onerror = () => {
      setError("WebSocket error");
      setIsConnected(false);
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, []);

  return { stats, device, uptimeHuman, isConnected, error };
}
