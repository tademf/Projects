/**
 * NEXUS Remote — Root component.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, LayoutDashboard, MousePointer2 } from "lucide-react";
import { useAuth } from "./hooks/useAuth";
import { PairingPage } from "./pages/PairingPage";
import { DashboardPage } from "./pages/DashboardPage";
import { TouchpadPage } from "./pages/TouchpadPage";

function App() {
  const { isPaired, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"dashboard" | "touchpad">(
    "dashboard",
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-nexus-bg flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="text-nexus-cyan" size={32} />
        </motion.div>
      </div>
    );
  }

  if (!isPaired) {
    return <PairingPage />;
  }

  return (
    <div className="min-h-screen bg-nexus-bg">
      {/* Page Content */}
      <div className="pb-20">
        {activeTab === "dashboard" ? <DashboardPage /> : <TouchpadPage />}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full bg-nexus-surface border-t border-white/5 flex justify-around py-3 z-50">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === "dashboard" ? "text-nexus-cyan" : "text-nexus-text-dim"}`}
        >
          <LayoutDashboard size={22} />
          <span className="text-[10px] font-medium">Dashboard</span>
        </button>
        <button
          onClick={() => setActiveTab("touchpad")}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === "touchpad" ? "text-nexus-cyan" : "text-nexus-text-dim"}`}
        >
          <MousePointer2 size={22} />
          <span className="text-[10px] font-medium">Touchpad</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
