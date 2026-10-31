/**
 * NEXUS Remote — Root component.
 *
 * Routing logic (no react-router yet — simple conditional):
 *   - isLoading      → splash screen
 *   - isPaired       → Dashboard (placeholder for Phase 3.5)
 *   - not paired     → PairingPage
 */

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useAuth } from "./hooks/useAuth";
import { PairingPage } from "./pages/PairingPage";
import { DashboardPage } from "./pages/DashboardPage";

function App() {
  const { isPaired, isLoading } = useAuth();

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

  return isPaired ? <DashboardPage /> : <PairingPage />;
}

export default App;
