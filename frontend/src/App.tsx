/**
 * NEXUS Remote — Root component (Phase 3.3 test page)
 *
 * This is a temporary page to verify the dark theme, Tailwind, fonts,
 * icons, and Framer Motion all work together. In Phase 3.4 we'll
 * replace it with the real Pairing + Dashboard pages.
 */

import { motion } from "framer-motion";
import { Cpu, MemoryStick, HardDrive, Wifi, Battery } from "lucide-react";

function App() {
  return (
    <div className="min-h-screen bg-nexus-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-nexus-cyan nexus-glow">
            NEXUS Remote
          </h1>
          <p className="text-nexus-text-muted mt-2">
            Your PC. Your Phone. One Connected Experience.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={<Cpu />} label="CPU" value="24%" accent="cyan" />
          <StatCard
            icon={<MemoryStick />}
            label="RAM"
            value="82%"
            accent="blue"
          />
          <StatCard
            icon={<HardDrive />}
            label="Disk"
            value="79%"
            accent="cyan"
          />
          <StatCard
            icon={<Wifi />}
            label="Network"
            value="12ms"
            accent="blue"
          />
        </div>

        {/* Battery pill */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="nexus-card mt-3 flex items-center justify-between"
        >
          <div className="flex items-center gap-2 text-nexus-text-muted">
            <Battery size={18} />
            <span className="text-sm">Battery</span>
          </div>
          <span className="text-nexus-text font-semibold">57%</span>
        </motion.div>

        {/* Footer */}
        <div className="text-center mt-8 text-nexus-text-dim text-xs">
          Phase 3.3 — Theme test
        </div>
      </motion.div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: "cyan" | "blue";
}

function StatCard({ icon, label, value, accent }: StatCardProps) {
  const accentColor = accent === "cyan" ? "text-nexus-cyan" : "text-nexus-blue";
  return (
    <motion.div whileHover={{ scale: 1.02 }} className="nexus-card">
      <div className={`flex items-center gap-2 mb-2 ${accentColor}`}>
        {icon}
        <span className="text-xs text-nexus-text-muted uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className="text-2xl font-bold text-nexus-text">{value}</div>
    </motion.div>
  );
}

export default App;
