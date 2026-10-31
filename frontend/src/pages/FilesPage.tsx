import { useState, useEffect, useRef } from "react";
import { request, BACKEND_URL, tokenStore } from "../services/api";
import {
  FolderUp,
  Download,
  File as FileIcon,
  UploadCloud,
} from "lucide-react";

interface FileInfo {
  name: string;
  size: number;
  modified: number;
}

export function FilesPage() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = async () => {
    try {
      const data = await request<{ files: FileInfo[] }>("/files/list");
      setFiles(data.files);
    } catch (err) {
      console.error("Failed to fetch files", err);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = tokenStore.get();
      const res = await fetch(`${BACKEND_URL}/files/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      await fetchFiles();
    } catch (err) {
      alert("Upload failed. Check the console.");
      console.error(err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownload = async (filename: string) => {
    const token = tokenStore.get();
    const url = `${BACKEND_URL}/files/download/${encodeURIComponent(filename)}`;

    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();

      const a = document.createElement("a");
      a.href = window.URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert("Download failed");
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col p-4 max-w-md mx-auto">
      <header className="mb-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-nexus-text flex items-center gap-2">
            <FolderUp size={20} className="text-nexus-cyan" />
            Files
          </h1>
          <p className="text-xs text-nexus-text-muted mt-1">
            Saved to PC: ~/NexusTransfers
          </p>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="p-3 bg-nexus-cyan text-nexus-bg rounded-full shadow-lg active:scale-95 transition-all disabled:opacity-50"
        >
          <UploadCloud size={24} />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleUpload}
          className="hidden"
        />
      </header>

      <div className="flex-1 overflow-y-auto space-y-2 pb-4">
        {files.length === 0 ? (
          <div className="text-center text-nexus-text-dim mt-10">
            <FileIcon size={48} className="mx-auto mb-2 opacity-30" />
            <p>No files yet.</p>
            <p className="text-sm">Tap the upload button to send a file.</p>
          </div>
        ) : (
          files.map((file) => (
            <div
              key={file.name}
              className="flex items-center justify-between bg-nexus-surface p-3 rounded-xl border border-white/5"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <FileIcon size={20} className="text-nexus-cyan shrink-0" />
                <div className="truncate">
                  <p className="text-sm text-nexus-text truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-nexus-text-muted">
                    {formatSize(file.size)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDownload(file.name)}
                className="p-2 text-nexus-text-muted hover:text-nexus-cyan transition-colors"
              >
                <Download size={20} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
