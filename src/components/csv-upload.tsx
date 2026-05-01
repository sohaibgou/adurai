"use client";

import { useCallback, useState } from "react";
import { Upload, FileText, AlertCircle } from "lucide-react";

interface CSVUploadProps {
  onFileSelected: (file: File) => void;
  isLoading: boolean;
}

export default function CSVUpload({ onFileSelected, isLoading }: CSVUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      if (!file.name.endsWith(".csv")) {
        setError("Please upload a CSV file.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be under 10MB.");
        return;
      }
      setFileName(file.name);
      onFileSelected(file);
    },
    [onFileSelected],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <label
        htmlFor="csv-upload"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative flex flex-col items-center justify-center w-full p-10 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ${
          isDragging
            ? "border-purple bg-purple/10 scale-[1.02]"
            : "border-card-border bg-card-bg hover:border-purple/50 hover:bg-purple/5"
        } ${isLoading ? "pointer-events-none opacity-60" : ""}`}
      >
        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 rounded-full border-2 border-purple/30" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple animate-spin" />
            </div>
            <p className="text-muted text-sm">Analyzing your campaigns...</p>
          </div>
        ) : fileName ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-purple/15 flex items-center justify-center">
              <FileText className="w-7 h-7 text-purple" />
            </div>
            <div className="text-center">
              <p className="text-foreground font-medium">{fileName}</p>
              <p className="text-muted text-sm mt-1">Drop another file or click to replace</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-purple/10 flex items-center justify-center">
              <Upload className="w-7 h-7 text-purple" />
            </div>
            <div className="text-center">
              <p className="text-foreground font-medium">
                Drop your Meta Ads CSV here
              </p>
              <p className="text-muted text-sm mt-1">
                or click to browse — exports from Meta Ads Manager
              </p>
            </div>
          </div>
        )}
        <input
          id="csv-upload"
          type="file"
          accept=".csv"
          className="hidden"
          disabled={isLoading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </label>
      {error && (
        <div className="flex items-center gap-2 mt-3 text-red text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
