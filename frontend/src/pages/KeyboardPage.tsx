import { useState } from "react";
import { request } from "../services/api";
import { Keyboard, CornerDownLeft, Delete, ArrowBigUp } from "lucide-react";

export function KeyboardPage() {
  const [text, setText] = useState("");

  const handleType = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    const diff = newText.slice(text.length); // Get only the newly typed characters
    setText(newText);

    if (diff) {
      request("/input/keyboard/type", {
        method: "POST",
        body: { text: diff },
      }).catch(() => {});
    }
  };

  const sendKey = (key: string) => {
    request("/input/keyboard/press", { method: "POST", body: { key } }).catch(
      () => {},
    );
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col p-4 max-w-md mx-auto">
      <header className="mb-4">
        <h1 className="text-xl font-bold text-nexus-text flex items-center gap-2">
          <Keyboard size={20} className="text-nexus-cyan" />
          Keyboard
        </h1>
        <p className="text-xs text-nexus-text-muted mt-1">
          Type directly to your PC
        </p>
      </header>

      <textarea
        value={text}
        onChange={handleType}
        placeholder="Tap here and type..."
        className="flex-1 w-full bg-nexus-surface border border-white/5 rounded-2xl p-4 text-nexus-text resize-none focus:outline-none focus:border-nexus-cyan/50 mb-4"
      />

      <div className="grid grid-cols-4 gap-2 mb-4">
        <KeyButton
          icon={<CornerDownLeft size={18} />}
          label="Enter"
          onClick={() => sendKey("enter")}
        />
        <KeyButton
          icon={<Delete size={18} />}
          label="Back"
          onClick={() => sendKey("backspace")}
        />
        <KeyButton
          icon={<ArrowBigUp size={18} />}
          label="Tab"
          onClick={() => sendKey("tab")}
        />
        <KeyButton
          icon={<span className="font-bold text-xs">ESC</span>}
          label="Esc"
          onClick={() => sendKey("esc")}
        />
      </div>
    </div>
  );
}

function KeyButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1 py-3 bg-nexus-surface border border-white/5 rounded-xl text-nexus-text-muted active:scale-95 transition-all"
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}
