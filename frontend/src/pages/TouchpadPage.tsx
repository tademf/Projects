import { useRef, useState, useEffect } from "react";
import { tokenStore, BACKEND_URL } from "../services/api";
import { MousePointer2, Move } from "lucide-react";

export function TouchpadPage() {
  const touchpadRef = useRef<HTMLDivElement>(null);
  const lastTouch = useRef<{ x: number; y: number } | null>(null);
  const [isClicking, setIsClicking] = useState(false);

  // WebSocket reference
  const ws = useRef<WebSocket | null>(null);

  // Sensitivity
  const SENSITIVITY = 1.8;

  useEffect(() => {
    // Connect to a dedicated mouse WebSocket
    const token = tokenStore.get();
    if (!token) return;

    const wsUrl =
      BACKEND_URL.replace(/^http/, "ws") + `/ws/system?token=${token}`;
    ws.current = new WebSocket(wsUrl);

    return () => {
      ws.current?.close();
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

    // Send instantly via WebSocket (no HTTP overhead!)
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

  const sendClick = (button: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: "mouse_click", button }));
    }
  };

  const handleLeftClick = () => {
    setIsClicking(true);
    sendClick("left");
    setTimeout(() => setIsClicking(false), 200);
  };

  const handleRightClick = () => {
    sendClick("right");
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
