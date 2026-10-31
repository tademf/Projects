import { useRef, useState } from "react";
import { request } from "../services/api";
import { MousePointer2, Move } from "lucide-react";

export function TouchpadPage() {
  const touchpadRef = useRef<HTMLDivElement>(null);
  const lastTouch = useRef<{ x: number; y: number } | null>(null);
  const [isClicking, setIsClicking] = useState(false);

  // Sensitivity multiplier (adjust this if cursor moves too fast/slow)
  const SENSITIVITY = 1.5;

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    lastTouch.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!lastTouch.current) return;
    const touch = e.touches[0];

    const dx = (touch.clientX - lastTouch.current.x) * SENSITIVITY;
    const dy = (touch.clientY - lastTouch.current.y) * SENSITIVITY;

    lastTouch.current = { x: touch.clientX, y: touch.clientY };

    request("/input/mouse/move", {
      method: "POST",
      body: { dx: Math.round(dx), dy: Math.round(dy) },
    }).catch(() => {});
  };

  const handleTouchEnd = () => {
    lastTouch.current = null;
  };

  const handleLeftClick = async () => {
    setIsClicking(true);
    try {
      await request("/input/mouse/click", {
        method: "POST",
        body: { button: "left" },
      });
    } catch (err) {
      console.error(err);
    }
    setTimeout(() => setIsClicking(false), 200);
  };

  const handleRightClick = async () => {
    try {
      await request("/input/mouse/click", {
        method: "POST",
        body: { button: "right" },
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col p-4 max-w-md mx-auto">
      <header className="mb-4">
        <h1 className="text-xl font-bold text-nexus-text flex items-center gap-2">
          <MousePointer2 size={20} className="text-nexus-cyan" />
          Touchpad
        </h1>
        <p className="text-xs text-nexus-text-muted mt-1">
          Drag to move • Tap buttons to click
        </p>
      </header>

      {/* Touchpad Area */}
      <div
        ref={touchpadRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="flex-1 bg-nexus-surface border border-white/5 rounded-3xl flex items-center justify-center relative touch-none select-none"
      >
        <div className="text-nexus-text-dim flex flex-col items-center gap-2 opacity-30 pointer-events-none">
          <Move size={48} />
          <span className="text-sm font-medium">Drag to move cursor</span>
        </div>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-3 mt-4 mb-4">
        <button
          onClick={handleLeftClick}
          className={`py-4 rounded-xl font-bold text-lg transition-all active:scale-95 ${
            isClicking
              ? "bg-nexus-cyan text-nexus-bg"
              : "bg-nexus-surface text-nexus-text border border-white/5"
          }`}
        >
          Left Click
        </button>
        <button
          onClick={handleRightClick}
          className="py-4 rounded-xl font-bold text-lg bg-nexus-surface text-nexus-text border border-white/5 active:scale-95 transition-all"
        >
          Right Click
        </button>
      </div>
    </div>
  );
}
