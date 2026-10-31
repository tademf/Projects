import { useRef, useState, useEffect } from "react";
import { tokenStore, BACKEND_URL } from "../services/api";
import { MousePointer2, Move, Mouse } from "lucide-react";

export function TouchpadPage() {
  const touchpadRef = useRef<HTMLDivElement>(null);
  const lastTouch = useRef<{ x: number; y: number } | null>(null);
  const [isClicking, setIsClicking] = useState(false);

  // WebSocket reference
  const ws = useRef<WebSocket | null>(null);

  // Sensitivity (2.0 feels like a standard Windows mouse)
  const SENSITIVITY = 2.0;

  useEffect(() => {
    const token = tokenStore.get();
    if (!token) return;

    const wsUrl =
      BACKEND_URL.replace(/^http/, "ws") + `/ws/system?token=${token}`;
    ws.current = new WebSocket(wsUrl);

    return () => {
      ws.current?.close();
    };
  }, []);

  // 🛑 PREVENT BROWSER NATIVE TOUCH ACTIONS (Scroll, Zoom, Back swipe)
  useEffect(() => {
    const el = touchpadRef.current;
    if (!el) return;

    const preventDefault = (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault();
    };

    // Passive: false is required to allow preventDefault to work
    el.addEventListener("touchstart", preventDefault, { passive: false });
    el.addEventListener("touchmove", preventDefault, { passive: false });
    el.addEventListener("touchend", preventDefault, { passive: false });
    el.addEventListener("contextmenu", preventDefault);

    return () => {
      el.removeEventListener("touchstart", preventDefault);
      el.removeEventListener("touchmove", preventDefault);
      el.removeEventListener("touchend", preventDefault);
      el.removeEventListener("contextmenu", preventDefault);
    };
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    lastTouch.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!lastTouch.current) return;
    const touch = e.touches[0];

    // Calculate delta
    const dx = (touch.clientX - lastTouch.current.x) * SENSITIVITY;
    const dy = (touch.clientY - lastTouch.current.y) * SENSITIVITY;

    lastTouch.current = { x: touch.clientX, y: touch.clientY };

    // Send instantly via WebSocket
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const sendDx = Math.round(dx);
      const sendDy = Math.round(dy);
      if (sendDx !== 0 || sendDy !== 0) {
        ws.current.send(
          JSON.stringify({
            type: "mouse_move",
            dx: sendDx,
            dy: sendDy,
          }),
        );
      }
    }
  };

  const handleTouchEnd = () => {
    lastTouch.current = null;
  };

  // We keep the click buttons separate so you don't accidentally click while dragging
  const sendClick = (button: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: "mouse_click", button }));
    }
  };

  const handleLeftClick = () => {
    setIsClicking(true);
    sendClick("left");
    setTimeout(() => setIsClicking(false), 150);
  };

  const handleRightClick = () => {
    sendClick("right");
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col p-4 max-w-md mx-auto select-none">
      <header className="mb-4">
        <h1 className="text-xl font-bold text-nexus-text flex items-center gap-2">
          <MousePointer2 size={20} className="text-nexus-cyan" />
          Touchpad
        </h1>
        <p className="text-xs text-nexus-text-muted mt-1">
          Drag to move cursor
        </p>
      </header>

      {/* Touchpad Area */}
      <div
        ref={touchpadRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="flex-1 bg-nexus-surface border border-white/5 rounded-3xl flex flex-col items-center justify-center relative touch-none select-none overscroll-none"
      >
        <div className="text-nexus-text-dim flex flex-col items-center gap-2 opacity-30 pointer-events-none">
          <Mouse size={64} strokeWidth={1.5} />
          <span className="text-sm font-medium mt-2">Drag to move</span>
        </div>
      </div>

      {/* Click Buttons */}
      <div className="grid grid-cols-2 gap-3 mt-4 mb-4">
        <button
          onClick={handleLeftClick}
          className={`py-6 rounded-xl font-bold text-lg transition-all active:scale-95 ${
            isClicking
              ? "bg-nexus-cyan text-nexus-bg shadow-lg shadow-nexus-cyan/30"
              : "bg-nexus-surface text-nexus-text border border-white/5 hover:bg-nexus-surface-elevated"
          }`}
        >
          Left Click
        </button>
        <button
          onClick={handleRightClick}
          className="py-6 rounded-xl font-bold text-lg bg-nexus-surface text-nexus-text border border-white/5 hover:bg-nexus-surface-elevated active:scale-95 transition-all"
        >
          Right Click
        </button>
      </div>
    </div>
  );
}
