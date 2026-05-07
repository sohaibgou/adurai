"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Copy,
  Check,
  PenTool,
  Image as ImageIcon,
  Wand2,
  Loader2,
  Monitor,
  Smartphone,
  Clapperboard,
  AlertCircle,
  Download,
  Upload,
} from "lucide-react";
import type { CampaignSummary } from "@/lib/types";

/* ── Types ─────────────────────────────────────────────── */

interface CreativeStudioProps {
  summaries: CampaignSummary[];
  winners?: string[];
}

interface CopyVariant {
  hookType: string;
  hookNumber: number;
  primaryText: string;
  headline: string;
  description: string;
}

interface CreativeConcept {
  name: string;
  format: string;
  visualDescription: string;
  headlineOverlay: string;
  subtextOverlay: string;
  whyItWorks: string;
  imagePrompt: string;
}

type Tab = "copy" | "creatives";

/* ── Hook badge colors ─────────────────────────────────── */

const HOOK_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Pain Point":        { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" },
  "Curiosity Gap":     { bg: "#f5f3ff", text: "#7c3aed", border: "#ddd6fe" },
  "Social Proof":      { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe" },
  "Direct Offer":      { bg: "#ecfdf5", text: "#059669", border: "#a7f3d0" },
  "Pattern Interrupt":  { bg: "#fffbeb", text: "#d97706", border: "#fde68a" },
};

const HOOK_ICONS: Record<string, string> = {
  "Pain Point": "😤",
  "Curiosity Gap": "🤔",
  "Social Proof": "⭐",
  "Direct Offer": "💰",
  "Pattern Interrupt": "⚡",
};

/* ── Format badge config ───────────────────────────────── */

const FORMAT_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  "Feed 1080x1080":        { icon: Monitor, color: "#6c5ce7", bg: "#f5f3ff" },
  "Story 1080x1920":       { icon: Smartphone, color: "#00cec9", bg: "#ecfeff" },
  "Reel Cover 1080x1920":  { icon: Clapperboard, color: "#e17055", bg: "#fff7ed" },
};

/* ── Copy button ───────────────────────────────────────── */

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer hover:shadow-sm"
      style={{
        backgroundColor: copied ? "#ecfdf5" : "#f8fafc",
        color: copied ? "#059669" : "#64748b",
        border: `1px solid ${copied ? "#a7f3d0" : "#e2e8f0"}`,
      }}
    >
      {copied ? <><Check className="w-3 h-3" />Copied</> : <><Copy className="w-3 h-3" />{label || "Copy"}</>}
    </button>
  );
}

/* ── Toast notification ────────────────────────────────── */

function Toast({ type, message }: { type: "success" | "error"; message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.97 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-sm font-medium pointer-events-none"
      style={{
        background: type === "success" ? "#ecfdf5" : "#fef2f2",
        border: `1px solid ${type === "success" ? "#a7f3d0" : "#fecaca"}`,
        color: type === "success" ? "#059669" : "#dc2626",
        maxWidth: 340,
      }}
    >
      {type === "success"
        ? <Check className="w-4 h-4 flex-shrink-0" />
        : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
      <span className="leading-snug">{message}</span>
    </motion.div>
  );
}

/* ── Canvas composite download ──────────────────────────── */

async function downloadComposite(
  backgroundUrl: string,
  productPreview: string | undefined,
  filename: string,
) {
  const SIZE = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;

  // Draw background
  await new Promise<void>((resolve, reject) => {
    const bg = new Image();
    bg.onload = () => { ctx.drawImage(bg, 0, 0, SIZE, SIZE); resolve(); };
    bg.onerror = reject;
    bg.src = backgroundUrl;
  });

  // Draw product centered in the middle third
  if (productPreview) {
    await new Promise<void>((resolve) => {
      const prod = new Image();
      prod.onload = () => {
        const prodSize = Math.round(SIZE * 0.52);
        const x = Math.round((SIZE - prodSize) / 2);
        const y = Math.round((SIZE - prodSize) / 2);
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.18)";
        ctx.shadowBlur = 32;
        ctx.shadowOffsetY = 8;
        ctx.drawImage(prod, x, y, prodSize, prodSize);
        ctx.restore();
        resolve();
      };
      prod.onerror = () => resolve(); // skip product if it fails
      prod.src = productPreview;
    });
  }

  const url = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}

/* ── Single concept card ───────────────────────────────── */

function ConceptCard({
  concept,
  index,
  productImagePreview,
  productDescription,
}: {
  concept: CreativeConcept;
  index: number;
  productImagePreview?: string;
  productDescription?: string;
}) {
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [downloading, setDownloading] = useState(false);

  const formatKey = concept.format || "Feed 1080x1080";
  const fmtCfg = FORMAT_CONFIG[formatKey] || FORMAT_CONFIG["Feed 1080x1080"];
  const FormatIcon = fmtCfg.icon;
  const filename = `${concept.name.replace(/\s+/g, "-").toLowerCase()}.png`;

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), type === "success" ? 3000 : 5000);
  }

  async function generateImage() {
    setImageLoading(true);
    setImageError(null);
    setBackgroundUrl(null);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);

    try {
      console.log("[ConceptCard] Sending generation request...");
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headlineOverlay: concept.headlineOverlay,
          subtextOverlay: concept.subtextOverlay,
          productDescription,
        }),
        signal: controller.signal,
      });

      const data = await res.json();
      console.log("[ConceptCard] Got response:", res.status, Object.keys(data));

      if (!res.ok || data.error) {
        throw new Error(data.error || `Server error ${res.status}`);
      }
      if (!data.backgroundUrl) {
        throw new Error("Server returned no image data");
      }

      setBackgroundUrl(data.backgroundUrl);
      showToast("success", "Creative generated!");
    } catch (err) {
      const msg = err instanceof Error
        ? (err.name === "AbortError" ? "Request timed out after 60s — try again" : err.message)
        : "Something went wrong";
      console.error("[ConceptCard] Error:", msg);
      setImageError(msg);
      showToast("error", `Generation failed: ${msg}`);
    } finally {
      clearTimeout(timeout);
      setImageLoading(false);
    }
  }

  async function handleDownload() {
    if (!backgroundUrl) return;
    setDownloading(true);
    try {
      await downloadComposite(backgroundUrl, productImagePreview, filename);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      <AnimatePresence>{toast && <Toast type={toast.type} message={toast.message} />}</AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.12, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-xl border border-card-border overflow-hidden hover:shadow-lg transition-all"
      >
        {/* Dark header */}
        <div className="px-6 py-4 bg-gray-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-white/40 text-xs font-bold tracking-widest uppercase">
              Concept {index + 1}
            </span>
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: fmtCfg.bg, color: fmtCfg.color }}
            >
              <FormatIcon className="w-3 h-3" />
              {formatKey}
            </div>
          </div>
          <CopyButton text={concept.visualDescription} label="Copy Brief" />
        </div>

        {/* White body */}
        <div className="bg-white px-6 py-5 space-y-5">
          <h4 className="text-lg font-bold text-foreground">{concept.name}</h4>

          <div>
            <p className="text-[11px] font-semibold text-muted uppercase tracking-widest mb-2">Visual Description</p>
            <div className="px-4 py-3 rounded-lg bg-surface border border-card-border">
              <p className="text-foreground text-sm leading-relaxed select-all">{concept.visualDescription}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] font-semibold text-muted uppercase tracking-widest mb-2">Headline Overlay</p>
              <div className="px-4 py-3 rounded-lg bg-surface border border-card-border flex items-center justify-between">
                <p className="text-foreground font-bold select-all">{concept.headlineOverlay}</p>
                <CopyButton text={concept.headlineOverlay} />
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-muted uppercase tracking-widest mb-2">Subtext</p>
              <div className="px-4 py-3 rounded-lg bg-surface border border-card-border flex items-center justify-between">
                <p className="text-foreground text-sm select-all">{concept.subtextOverlay}</p>
                <CopyButton text={concept.subtextOverlay} />
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg bg-purple/5 border border-purple/10">
            <Sparkles className="w-4 h-4 text-purple flex-shrink-0 mt-0.5" />
            <p className="text-sm text-foreground leading-relaxed">
              <span className="font-semibold">Why it works:</span> {concept.whyItWorks}
            </p>
          </div>

          {/* Generate button */}
          {!backgroundUrl && !imageLoading && (
            <button
              onClick={generateImage}
              className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl text-sm font-semibold transition-all cursor-pointer
                bg-gradient-to-r from-purple to-teal text-white
                hover:shadow-lg hover:shadow-purple/20 hover:-translate-y-0.5 active:translate-y-0"
            >
              <Wand2 className="w-4 h-4" />
              {imageError ? "Try Again" : "Generate with AI"}
            </button>
          )}

          {/* Loading state */}
          {imageLoading && (
            <div className="w-full flex flex-col items-center justify-center gap-3 py-10 rounded-xl bg-surface border border-card-border">
              <Loader2 className="w-8 h-8 text-purple animate-spin" />
              <p className="text-sm text-muted font-medium">Generating ad layout…</p>
              <p className="text-xs text-muted/60">gpt-image-1 · up to 60 seconds</p>
            </div>
          )}

          {/* Error state */}
          {imageError && !imageLoading && !backgroundUrl && (
            <div className="w-full rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-700 font-medium">Generation failed</p>
                  <p className="text-xs text-red-600 mt-0.5 leading-relaxed">{imageError}</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Composite preview ── */}
          {backgroundUrl && (
            <div className="rounded-xl overflow-hidden border border-card-border">
              {/* CSS composite: background + product overlay */}
              <div className="relative w-full" style={{ aspectRatio: "1/1" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={backgroundUrl}
                  alt="Ad background"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {productImagePreview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={productImagePreview}
                    alt="Product"
                    className="absolute object-contain"
                    style={{
                      width: "52%",
                      height: "52%",
                      left: "50%",
                      top: "50%",
                      transform: "translate(-50%, -50%)",
                      filter: "drop-shadow(0 8px 28px rgba(0,0,0,0.22))",
                    }}
                  />
                )}
              </div>

              {/* Toolbar */}
              <div className="flex items-center justify-between px-4 py-3 bg-surface border-t border-card-border">
                <p className="text-xs text-muted">
                  {productImagePreview ? "AI background + your product" : "AI background — upload product to composite"}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple/10 text-purple text-xs font-medium hover:bg-purple/20 transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    {downloading
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : <Download className="w-3 h-3" />}
                    Download
                  </button>
                  <button
                    onClick={() => { setBackgroundUrl(null); setImageError(null); generateImage(); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer hover:shadow-sm"
                    style={{ backgroundColor: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0" }}
                  >
                    <Wand2 className="w-3 h-3" />
                    Regenerate
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}

/* ── Product image upload zone ─────────────────────────── */

function ProductImageUpload({
  preview,
  onImage,
}: {
  preview: string | null;
  onImage: (base64: string, mimeType: string, name: string) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [name, setName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      setName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        // Strip the data URL prefix to get raw base64
        const base64 = dataUrl.split(",")[1];
        onImage(base64, file.type, file.name);
      };
      reader.readAsDataURL(file);
    },
    [onImage],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  return (
    <div
      className="rounded-xl border transition-all duration-300"
      style={{
        borderColor: isDragging ? "#6c5ce7" : preview ? "#a3e6d0" : "#f0f0f5",
        boxShadow: isDragging ? "0 0 0 3px rgba(108,92,231,0.15)" : "none",
        background: "#ffffff",
      }}
    >
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Your Product Image</p>
            <p className="text-xs text-muted mt-0.5">Upload your product photo to generate real ad creatives</p>
          </div>
          {preview && (
            <div className="flex items-center gap-2">
              <div
                className="w-12 h-12 rounded-lg overflow-hidden border flex-shrink-0"
                style={{ borderColor: "#a3e6d0" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Product preview" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-green/15 flex items-center justify-center flex-shrink-0">
                    <Check className="w-2.5 h-2.5 text-green" strokeWidth={3} />
                  </div>
                  <span className="text-xs font-medium text-green">Ready to generate</span>
                </div>
                <p className="text-xs text-muted truncate max-w-[120px]">{name}</p>
              </div>
            </div>
          )}
        </div>

        <label
          htmlFor="creative-product-image"
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          className="flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 border border-dashed"
          style={{
            borderColor: isDragging ? "#6c5ce7" : "#e2e8f0",
            background: isDragging ? "rgba(108,92,231,0.04)" : "#fafafa",
          }}
          onMouseEnter={(e) => {
            if (!isDragging) (e.currentTarget as HTMLLabelElement).style.borderColor = "#c4bef0";
          }}
          onMouseLeave={(e) => {
            if (!isDragging) (e.currentTarget as HTMLLabelElement).style.borderColor = "#e2e8f0";
          }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-200"
            style={{ background: isDragging ? "rgba(108,92,231,0.12)" : "#f0f0f5" }}
          >
            <Upload className="w-4 h-4" style={{ color: isDragging ? "#6c5ce7" : "#9ca3af" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground">
              {preview ? "Replace image" : "Drop image here or click to browse"}
            </p>
            <p className="text-xs text-muted mt-0.5">JPG, PNG or WEBP</p>
          </div>
          {preview && (
            <span
              className="text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0"
              style={{ background: "#f0f0f5", color: "#6b7280" }}
            >
              Replace
            </span>
          )}
        </label>
        <input
          ref={inputRef}
          id="creative-product-image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) processFile(file);
          }}
        />
      </div>
    </div>
  );
}

/* ── Main component ────────────────────────────────────── */

export default function CreativeStudio({ summaries, winners }: CreativeStudioProps) {
  const [activeTab, setActiveTab] = useState<Tab>("copy");
  const [productDesc, setProductDesc] = useState("");
  const [copyLoading, setCopyLoading] = useState(false);
  const [creativeLoading, setCreativeLoading] = useState(false);
  const [copyVariants, setCopyVariants] = useState<CopyVariant[]>([]);
  const [creativeConcepts, setCreativeConcepts] = useState<CreativeConcept[]>([]);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [creativeError, setCreativeError] = useState<string | null>(null);

  // Product image state (creatives tab only)
  const [productImageBase64, setProductImageBase64] = useState<string | null>(null);
  const [productImageType, setProductImageType] = useState<string>("image/png");
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null);

  const suggestedProduct = summaries.map((s) => s.campaignName).join(", ");

  const handleProductImage = useCallback((base64: string, mimeType: string) => {
    setProductImageBase64(base64);
    setProductImageType(mimeType);
    setProductImagePreview(`data:${mimeType};base64,${base64}`);
  }, []);

  async function generateCopy() {
    if (!productDesc.trim()) return;
    setCopyLoading(true);
    setCopyError(null);
    try {
      const res = await fetch("/api/generate-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaigns: summaries.map((c) => ({
            campaignName: c.campaignName,
            spend: c.spend,
            roas: c.roas,
            ctr: c.ctr,
            conversions: c.conversions,
            objective: c.objective,
          })),
          productDescription: productDesc,
          winners,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate copy");
      }
      const data = await res.json();
      setCopyVariants(data.variants || []);
    } catch (err) {
      setCopyError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setCopyLoading(false);
    }
  }

  async function generateCreatives() {
    if (!productDesc.trim() || !productImageBase64) return;
    setCreativeLoading(true);
    setCreativeError(null);
    try {
      const res = await fetch("/api/generate-creative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productDescription: productDesc,
          campaigns: summaries.map((c) => ({
            campaignName: c.campaignName,
            spend: c.spend,
            roas: c.roas,
            ctr: c.ctr,
            conversions: c.conversions,
            objective: c.objective,
          })),
          winners,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate creatives");
      }
      const data = await res.json();
      setCreativeConcepts(data.concepts || []);
    } catch (err) {
      setCreativeError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setCreativeLoading(false);
    }
  }

  function handleGenerate() {
    if (activeTab === "copy") generateCopy();
    else generateCreatives();
  }

  const isLoading = activeTab === "copy" ? copyLoading : creativeLoading;
  const error = activeTab === "copy" ? copyError : creativeError;

  // Generate button is disabled if: no product desc, loading, OR (creatives tab + no image)
  const generateDisabled =
    !productDesc.trim() ||
    isLoading ||
    (activeTab === "creatives" && !productImageBase64);

  function buildFullCopy(v: CopyVariant) {
    return `${v.primaryText}\n\n${v.headline}\n${v.description}`;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="card overflow-hidden">
        {/* Header */}
        <div className="px-7 py-6 border-b border-card-border bg-gradient-to-r from-purple/5 to-teal/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple to-teal flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-semibold text-foreground">Creative Studio</h2>
              <p className="text-muted text-sm">Generate scroll-stopping ad copy and creative concepts</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-card-border">
          <button
            onClick={() => setActiveTab("copy")}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-medium transition-all cursor-pointer ${
              activeTab === "copy"
                ? "text-purple border-b-2 border-purple bg-purple/5"
                : "text-muted hover:text-foreground"
            }`}
          >
            <PenTool className="w-4 h-4" />
            Ad Copy Generator
          </button>
          <button
            onClick={() => setActiveTab("creatives")}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-medium transition-all cursor-pointer ${
              activeTab === "creatives"
                ? "text-purple border-b-2 border-purple bg-purple/5"
                : "text-muted hover:text-foreground"
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Creative Concepts
          </button>
        </div>

        {/* Input area */}
        <div className="p-7 space-y-5">
          {/* Product image upload — creatives tab only */}
          {activeTab === "creatives" && (
            <ProductImageUpload
              preview={productImagePreview}
              onImage={handleProductImage}
            />
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Describe your product or offer
            </label>
            <textarea
              value={productDesc}
              onChange={(e) => setProductDesc(e.target.value)}
              placeholder={`e.g., "Premium leather sneakers for men, $129, free shipping, 30-day returns"\n\nYour campaigns: ${suggestedProduct}`}
              className="w-full h-24 px-4 py-3 rounded-xl border border-card-border bg-surface text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple/30 focus:border-purple/50 transition-all placeholder:text-muted/50"
            />
          </div>

          <div className="flex items-center gap-3">
            <div
              className="relative"
              title={
                activeTab === "creatives" && !productImageBase64
                  ? "Upload your product image first"
                  : undefined
              }
            >
              <button
                onClick={handleGenerate}
                disabled={generateDisabled}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple text-white text-sm font-medium transition-all hover:shadow-lg hover:shadow-purple/20 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none cursor-pointer"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                {isLoading
                  ? activeTab === "copy" ? "Writing copy..." : "Designing concepts..."
                  : activeTab === "copy" ? "Generate 5 Ad Variants" : "Generate 3 Concepts"}
              </button>
            </div>
            {activeTab === "creatives" && !productImageBase64 && !creativeLoading && (
              <p className="text-xs text-muted flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 flex-shrink-0" />
                Upload your product image first
              </p>
            )}
            {activeTab === "copy" && !copyLoading && (
              <p className="text-xs text-muted">
                5 hook types: Pain Point, Curiosity, Social Proof, Offer, Pattern Interrupt
              </p>
            )}
            {activeTab === "creatives" && productImageBase64 && !creativeLoading && (
              <p className="text-xs text-muted">
                3 concepts for Feed, Story, and Reel — each with AI image generation
              </p>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* ── Ad Copy Results ───────────────────────── */}
        <AnimatePresence mode="wait">
          {activeTab === "copy" && copyVariants.length > 0 && (
            <motion.div
              key="copy-results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-card-border"
            >
              <div className="p-7 space-y-5">
                {copyVariants.map((variant, i) => {
                  const colors = HOOK_COLORS[variant.hookType] || HOOK_COLORS["Pain Point"];
                  const icon = HOOK_ICONS[variant.hookType] || "📝";
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className="rounded-xl border overflow-hidden transition-all hover:shadow-md"
                      style={{ borderColor: colors.border }}
                    >
                      <div className="px-5 py-3 flex items-center justify-between" style={{ backgroundColor: colors.bg }}>
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{icon}</span>
                          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: colors.text }}>
                            Hook {variant.hookNumber}
                          </span>
                          <span className="text-xs" style={{ color: colors.text, opacity: 0.4 }}>|</span>
                          <span className="text-xs font-semibold" style={{ color: colors.text }}>
                            {variant.hookType}
                          </span>
                        </div>
                        <CopyButton text={buildFullCopy(variant)} label="Copy All" />
                      </div>
                      <div className="px-5 py-5 bg-white space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-[11px] font-semibold text-muted uppercase tracking-widest">Primary Text</p>
                            <CopyButton text={variant.primaryText} />
                          </div>
                          <div className="px-4 py-3 rounded-lg bg-surface border border-card-border">
                            {variant.primaryText.split("\\n").map((line, li) => (
                              <p key={li} className="text-foreground text-[15px] leading-relaxed select-all" style={{ marginTop: li > 0 ? 4 : 0 }}>
                                {line}
                              </p>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-[11px] font-semibold text-muted uppercase tracking-widest">Headline</p>
                              <CopyButton text={variant.headline} />
                            </div>
                            <div className="px-4 py-3 rounded-lg bg-surface border border-card-border">
                              <p className="text-foreground font-bold text-base select-all">{variant.headline}</p>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-[11px] font-semibold text-muted uppercase tracking-widest">Description</p>
                              <CopyButton text={variant.description} />
                            </div>
                            <div className="px-4 py-3 rounded-lg bg-surface border border-card-border">
                              <p className="text-foreground text-sm select-all">{variant.description}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ── Creative Concepts Results ────────────── */}
          {activeTab === "creatives" && creativeConcepts.length > 0 && (
            <motion.div
              key="creative-results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-card-border"
            >
              <div className="p-7 space-y-6">
                {creativeConcepts.map((concept, i) => (
                  <ConceptCard
                    key={i}
                    concept={concept}
                    index={i}
                    productImagePreview={productImagePreview ?? undefined}
                    productDescription={productDesc}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
