"use client";

import { useCallback, useState } from "react";
import { Upload, FileText, AlertCircle } from "lucide-react";
import FadeIn from "@/components/fade-in";

interface UploadSectionProps {
  onFileSelected: (file: File) => void;
  isLoading: boolean;
}

export default function UploadSection({ onFileSelected, isLoading }: UploadSectionProps) {
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

  return (
    <section id="upload-zone" className="relative py-20 px-6">
      <div className="relative z-10 max-w-2xl mx-auto">
        <FadeIn>
          <label
            htmlFor="csv-upload-hero"
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            className={`glass-upload relative flex flex-col items-center justify-center w-full rounded-2xl cursor-pointer ${
              isLoading ? "pointer-events-none opacity-60" : ""
            } ${isDragging ? "!border-purple !shadow-[0_8px_40px_rgba(108,92,231,0.18)]" : ""}`}
          >
            <div className={`w-full p-10 m-3 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-colors duration-300 ${
              isDragging ? "border-purple/60" : "border-card-border"
            }`}>
              {isLoading ? (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="relative w-14 h-14">
                    <div className="absolute inset-0 rounded-full border-2 border-purple/20" />
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple animate-spin" />
                  </div>
                  <p className="text-muted text-sm font-medium">Analyzing your campaigns...</p>
                </div>
              ) : fileName ? (
                <div className="flex flex-col items-center gap-3 py-4">
                  <div className="w-14 h-14 rounded-xl bg-purple/10 flex items-center justify-center">
                    <FileText className="w-7 h-7 text-purple" />
                  </div>
                  <p className="text-foreground font-medium">{fileName}</p>
                  <p className="text-muted text-sm">Drop another file or click to replace</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-4">
                  <div className="w-14 h-14 rounded-xl bg-purple/10 flex items-center justify-center">
                    <Upload className="w-7 h-7 text-purple" />
                  </div>
                  <p className="text-foreground font-semibold text-lg">Drop your Meta Ads CSV here</p>
                  <p className="text-muted text-sm">or click to browse — exports from Meta Ads Manager</p>
                </div>
              )}
            </div>
            <input
              id="csv-upload-hero"
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
        </FadeIn>

        {error && (
          <div className="flex items-center justify-center gap-2 mt-4 text-red text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <FadeIn delay={0.15}>
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
            {["No login required", "AI-powered insights", "Data stays private"].map((text) => (
              <span key={text} className="flex items-center gap-2 text-muted text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-green flex-shrink-0" />
                {text}
              </span>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
