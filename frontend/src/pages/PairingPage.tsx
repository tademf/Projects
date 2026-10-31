/**
 * NEXUS Remote — Pairing page.
 *
 * The user enters the 6-digit PIN shown in the PC's server terminal.
 * On submit → useAuth().pair(pin) → token stored → App routes to dashboard.
 */

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Lock, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const PIN_LENGTH = 6;

export function PairingPage() {
  const { pair, isLoading, error, clearError } = useAuth();
  const [digits, setDigits] = useState<string[]>(Array(PIN_LENGTH).fill(""));
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // -------------------------------------------------------------------------
  // Input handling
  // -------------------------------------------------------------------------
  const setDigitAt = (index: number, value: string) => {
    setDigits((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleChange = (index: number, raw: string) => {
    const cleaned = raw.replace(/\D/g, ""); // digits only
    if (!cleaned) {
      setDigitAt(index, "");
      return;
    }
    // If user pasted/typed multiple digits, distribute
    const chars = cleaned.split("");
    setDigits((prev) => {
      const next = [...prev];
      for (let i = 0; i < chars.length && index + i < PIN_LENGTH; i++) {
        next[index + i] = chars[i];
      }
      return next;
    });
    // Move focus
    const lastFilled = Math.min(index + chars.length, PIN_LENGTH - 1);
    inputRefs.current[lastFilled]?.focus();
    // Auto-submit if all filled
    const candidate = digits.map((d, i) =>
      i >= index && i < index + chars.length ? chars[i - index] : d,
    );
    if (
      candidate.every((c) => c !== "") &&
      candidate.join("").length === PIN_LENGTH
    ) {
      handleSubmit(candidate.join(""));
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < PIN_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === "Enter") {
      const pin = digits.join("");
      if (pin.length === PIN_LENGTH) handleSubmit(pin);
    }
  };

  const handleSubmit = async (pin?: string) => {
    const candidate = pin ?? digits.join("");
    if (candidate.length !== PIN_LENGTH) return;
    clearError();
    try {
      await pair(candidate);
      // Parent App will see isPaired=true and route to dashboard
    } catch {
      // Error shown via `error` state from useAuth
      setDigits(Array(PIN_LENGTH).fill(""));
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    }
  };

  const isComplete =
    digits.every((d) => d !== "") && digits.join("").length === PIN_LENGTH;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-nexus-bg flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo + title */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-nexus-surface border border-nexus-cyan/20 mb-4 nexus-glow"
          >
            <Lock className="text-nexus-cyan" size={28} />
          </motion.div>
          <h1 className="text-3xl font-bold text-nexus-cyan">NEXUS Remote</h1>
          <p className="text-nexus-text-muted mt-2 text-sm">
            Enter the PIN shown on your PC
          </p>
        </div>

        {/* PIN inputs */}
        <div className="flex justify-center gap-2 mb-6">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="tel"
              inputMode="numeric"
              maxLength={6}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              disabled={isLoading}
              className="w-12 h-14 text-center text-2xl font-bold bg-nexus-surface border border-white/10 rounded-xl text-nexus-text focus:outline-none focus:border-nexus-cyan transition-colors disabled:opacity-50"
            />
          ))}
        </div>

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 bg-nexus-danger/10 border border-nexus-danger/30 rounded-xl p-3 mb-4"
          >
            <AlertCircle
              className="text-nexus-danger shrink-0 mt-0.5"
              size={18}
            />
            <span className="text-nexus-danger text-sm">{error}</span>
          </motion.div>
        )}

        {/* Connect button */}
        <button
          onClick={() => handleSubmit()}
          disabled={!isComplete || isLoading}
          className="w-full h-14 rounded-xl bg-gradient-to-r from-nexus-cyan to-nexus-blue text-nexus-bg font-bold text-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-nexus-cyan/30 active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Connecting...
            </>
          ) : (
            <>
              Connect
              <ArrowRight size={20} />
            </>
          )}
        </button>

        {/* Hint */}
        <div className="text-center mt-6 text-xs text-nexus-text-dim">
          The PIN appears in the terminal window running{" "}
          <code className="text-nexus-text-muted bg-nexus-surface px-1.5 py-0.5 rounded">
            uvicorn
          </code>{" "}
          on your PC.
        </div>
      </motion.div>
    </div>
  );
}
