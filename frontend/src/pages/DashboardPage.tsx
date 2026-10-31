import { motion } from "framer-motion";
import {
  Cpu,
  MemoryStick,
  HardDrive,
  Battery,
  Wifi,
  Power,
  Server,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useSystemStats } from "../hooks/useSystemStats";

export function DashboardPage() {
  const { deviceName, logout } = useAuth();
  const { stats, device, uptimeHuman, isConnected } = useSystemStats();

  return (
    <div className="min-h-screen bg-nexus-bg p-4 pb-20">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <header className="flex items-center justify-between pt-4 pb-2">
          <div>
            <h1 className="text-xl font-bold text-nexus-text flex items-center gap-2">
              <Server size={20} className="text-nexus-cyan" />
              {device?.hostname || "Connecting..."}
            </h1>
            <p className="text-xs text-nexus-text-muted mt-1">
              {device?.os} • {deviceName}
            </p>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-xs font-medium border ${
              isConnected
                ? "bg-nexus-success/10 text-nexus-success border-nexus-success/20"
                : "bg-nexus-danger/10 text-nexus-danger border-nexus-danger/20"
            }`}
          >
            {isConnected ? "● Live" : "○ Disconnected"}
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<Cpu />}
            label="CPU"
            value={stats ? `${stats.cpu.percent}%` : "--"}
            sub={device ? `${device.cpu_cores_logical} cores` : ""}
            color="cyan"
          />
          <StatCard
            icon={<MemoryStick />}
            label="RAM"
            value={stats ? `${stats.ram.percent}%` : "--"}
            sub={stats ? `${stats.ram.used_gb} / ${stats.ram.total_gb} GB` : ""}
            color="blue"
          />
          <StatCard
            icon={<HardDrive />}
            label="Disk"
            value={stats ? `${stats.disk.percent}%` : "--"}
            sub={stats ? `${stats.disk.free_gb} GB free` : ""}
            color="cyan"
          />
          <StatCard
            icon={<Wifi />}
            label="Uptime"
            value={uptimeHuman || "--"}
            sub="Since last boot"
            color="blue"
          />
        </div>

        {/* Battery */}
        {stats?.battery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="nexus-card flex items-center justify-between"
          >
            <div className="flex items-center gap-2 text-nexus-text-muted">
              <Battery
                size={18}
                className={stats.battery.plugged ? "text-nexus-success" : ""}
              />
              <span className="text-sm">
                Battery {stats.battery.plugged && "(Charging)"}
              </span>
            </div>
            <span className="text-nexus-text font-bold">
              {stats.battery.percent}%
            </span>
          </motion.div>
        )}

        {/* Disconnect */}
        <button
          onClick={() => logout()}
          className="w-full mt-6 flex items-center justify-center gap-2 py-3 rounded-xl bg-nexus-surface border border-white/5 text-nexus-danger hover:bg-nexus-surface-elevated transition-colors"
        >
          <Power size={18} />
          Disconnect
        </button>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: "cyan" | "blue";
}) {
  const accent = color === "cyan" ? "text-nexus-cyan" : "text-nexus-blue";
  return (
    <motion.div whileHover={{ scale: 1.02 }} className="nexus-card">
      <div className={`flex items-center gap-2 mb-2 ${accent}`}>
        {icon}
        <span className="text-xs text-nexus-text-muted uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className="text-2xl font-bold text-nexus-text">{value}</div>
      <div className="text-xs text-nexus-text-dim mt-1">{sub}</div>
    </motion.div>
  );
}
