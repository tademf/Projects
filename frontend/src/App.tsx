import { useState } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  LayoutDashboard,
  MousePointer2,
  Keyboard,
  PlayCircle,
} from "lucide-react";
import { useAuth } from "./hooks/useAuth";
import { PairingPage } from "./pages/PairingPage";
import { DashboardPage } from "./pages/DashboardPage";
import { TouchpadPage } from "./pages/TouchpadPage";
import { KeyboardPage } from "./pages/KeyboardPage";
import { MediaPage } from "./pages/MediaPage";

type Tab = "dashboard" | "touchpad" | "keyboard" | "media";

function App() {
  const { isPaired, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

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

  if (!isPaired) return <PairingPage />;

  return (
    <div className="min-h-screen bg-nexus-bg">
      <div className="pb-20">
        {activeTab === "dashboard" && <DashboardPage />}
        {activeTab === "touchpad" && <TouchpadPage />}
        {activeTab === "keyboard" && <KeyboardPage />}
        {activeTab === "media" && <MediaPage />}
      </div>

      {/* Bottom Navigation (4 items) */}
      <nav className="fixed bottom-0 w-full bg-nexus-surface border-t border-white/5 flex justify-around py-3 z-50">
        <NavButton
          icon={<LayoutDashboard size={20} />}
          label="Home"
          active={activeTab === "dashboard"}
          onClick={() => setActiveTab("dashboard")}
        />
        <NavButton
          icon={<MousePointer2 size={20} />}
          label="Touch"
          active={activeTab === "touchpad"}
          onClick={() => setActiveTab("touchpad")}
        />
        <NavButton
          icon={<Keyboard size={20} />}
          label="Keyboard"
          active={activeTab === "keyboard"}
          onClick={() => setActiveTab("keyboard")}
        />
        <NavButton
          icon={<PlayCircle size={20} />}
          label="Media"
          active={activeTab === "media"}
          onClick={() => setActiveTab("media")}
        />
      </nav>
    </div>
  );
}

function NavButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-colors ${active ? "text-nexus-cyan" : "text-nexus-text-dim"}`}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

export default App;
