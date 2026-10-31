import { request } from "../services/api";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Volume1,
} from "lucide-react";

export function MediaPage() {
  const sendMedia = (action: string) => {
    request("/input/media", { method: "POST", body: { action } }).catch(
      () => {},
    );
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col p-4 max-w-md mx-auto justify-center">
      <header className="mb-8 text-center">
        <h1 className="text-xl font-bold text-nexus-text">Media Control</h1>
        <p className="text-xs text-nexus-text-muted mt-1">
          Control playback and volume
        </p>
      </header>

      {/* Playback */}
      <div className="flex justify-center items-center gap-6 mb-12">
        <button
          onClick={() => sendMedia("prev")}
          className="p-4 text-nexus-text-muted hover:text-nexus-cyan transition-colors active:scale-95"
        >
          <SkipBack size={32} />
        </button>
        <button
          onClick={() => sendMedia("playpause")}
          className="p-6 bg-nexus-cyan text-nexus-bg rounded-full shadow-lg shadow-nexus-cyan/20 active:scale-95 transition-all"
        >
          <Play size={32} className="ml-1" />
        </button>
        <button
          onClick={() => sendMedia("next")}
          className="p-4 text-nexus-text-muted hover:text-nexus-cyan transition-colors active:scale-95"
        >
          <SkipForward size={32} />
        </button>
      </div>

      {/* Volume */}
      <div className="flex justify-center items-center gap-4 bg-nexus-surface p-4 rounded-2xl border border-white/5">
        <button
          onClick={() => sendMedia("voldown")}
          className="p-3 text-nexus-text-muted hover:text-nexus-cyan transition-colors active:scale-95"
        >
          <Volume1 size={24} />
        </button>
        <button
          onClick={() => sendMedia("mute")}
          className="p-3 text-nexus-text-muted hover:text-nexus-danger transition-colors active:scale-95"
        >
          <VolumeX size={24} />
        </button>
        <button
          onClick={() => sendMedia("volup")}
          className="p-3 text-nexus-text-muted hover:text-nexus-cyan transition-colors active:scale-95"
        >
          <Volume2 size={24} />
        </button>
      </div>
    </div>
  );
}
