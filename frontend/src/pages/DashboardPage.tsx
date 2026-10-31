/**
 * NEXUS Remote — Dashboard placeholder.
 *
 * Phase 3.5 will replace this with live WebSocket-fed CPU/RAM cards.
 */

import { motion } from "framer-motion";
import { LogOut, Construction } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export function DashboardPage() {
  const { deviceName, logout } = useAuth();

  return (
    <div className="min-h-screen bg-nexus-bg flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md text-center"
      >
        <Construction className="text-nexus-cyan mx-auto mb-4" size={48} />
        <h1 className="text-2xl font-bold text-nexus-cyan mb-2">Paired!</h1>
        <p className="text-nexus-text-muted mb-1">
          Connected as{" "}
          <span className="text-nexus-text font-semibold">
            {deviceName ?? "Unknown"}
          </span>
        </p>
        <p className="text-nexus-text-dim text-sm mb-8">
          Dashboard coming in Phase 3.5
        </p>
        <button
          onClick={() => logout()}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-nexus-surface border border-white/10 text-nexus-text hover:border-nexus-danger/40 transition-colors"
        >
          <LogOut size={18} />
          Disconnect
        </button>
      </motion.div>
    </div>
  );
}
