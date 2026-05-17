"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Download,
  RefreshCw,
  ImageIcon,
  Loader2,
  Upload,
  X,
  Copy,
  Check,
  Image,
  FileText,
} from "lucide-react";
import type { CampaignSummary } from "@/lib/types";

/* ── Props ───────────────────────────────────────────────── */

interface CreativeStudioProps {
  summaries:  CampaignSummary[];
  winners?:   string[];
  isPaid?:    boolean;
  isAdmin?:   boolean;
  onPaywall?: (reason: "image" | "copy") => void;
}

interface ReferenceImage {
  file:       File;
  previewUrl: string;
}

interface AdCopyVariant {
  hookType:    string;
  primaryText: string;
  headline:    string;
  description: string;
  cta:         string;
}

interface CreativeImage {
  url:        string;
  angle?:     string;
  headline?:  string;
  rationale?: string;
}

interface CreativeBrief {
  angle:     string;
  prompt:    string;
  headline:  string;
  rationale: string;
}

interface ArabicTextData {
  headline:    string;
  subheadline: string;
  cta:         string;
}

/* ── Colour maps ─────────────────────────────────────────── */

const HOOK_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Pain Point":        { bg: "#fff1f2", text: "#e11d48", border: "#fecdd3" },
  "Curiosity Gap":     { bg: "#fefce8", text: "#ca8a04", border: "#fde68a" },
  "Social Proof":      { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" },
  "Direct Offer":      { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe" },
  "Pattern Interrupt": { bg: "#faf5ff", text: "#7c3aed", border: "#ddd6fe" },
};

function hookColor(hookType: string) {
  return HOOK_COLORS[hookType] ?? { bg: "#f8f8fc", text: "#6b7280", border: "#e5e7eb" };
}

const ANGLE_COLORS = [
  { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe" }, // blue   — Hero Product Shot
  { bg: "#fdf4ff", text: "#9333ea", border: "#f3e8ff" }, // purple — Lifestyle/Emotion
  { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" }, // green  — Social Proof
  { bg: "#fff7ed", text: "#ea580c", border: "#fed7aa" }, // orange — Pattern Interrupt
];

const LANGUAGES = ["English", "French", "Arabic"];

const CREATIVE_LIMIT = 3;

function getImageCount(): number {
  try { return parseInt(localStorage.getItem("adur_image_count") ?? "0", 10) || 0; } catch { return 0; }
}
function getCopyCount(): number {
  try { return parseInt(localStorage.getItem("adur_copy_count") ?? "0", 10) || 0; } catch { return 0; }
}
function incrementImageCount(): number {
  const next = getImageCount() + 1;
  try { localStorage.setItem("adur_image_count", String(next)); } catch { /* noop */ }
  return next;
}
function incrementCopyCount(): number {
  const next = getCopyCount() + 1;
  try { localStorage.setItem("adur_copy_count", String(next)); } catch { /* noop */ }
  return next;
}

/* ── Arabic font loader ─────────────────────────────────── */

let arabicFontLoaded = false;

async function ensureArabicFont(): Promise<void> {
  if (arabicFontLoaded) return;
  // Inject Google Fonts link if not already present
  if (!document.getElementById("adur-cairo-font")) {
    const link  = document.createElement("link");
    link.id     = "adur-cairo-font";
    link.rel    = "stylesheet";
    link.href   = "https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap";
    document.head.appendChild(link);
  }
  // Wait for the font to be ready (with 3 s timeout fallback)
  try {
    await Promise.race([
      document.fonts.load("900 16px Cairo"),
      new Promise<void>((_, rej) => setTimeout(() => rej(new Error("timeout")), 3000)),
    ]);
  } catch {
    /* fall back to system sans-serif */
  }
  arabicFontLoaded = true;
}

/* ── Canvas overlay: Arabic text on top of a generated image ── */

async function applyArabicOverlay(
  imageUrl:   string,
  arabicText: ArabicTextData,
): Promise<string> {
  await ensureArabicFont();

  // Load the source image into an <img>
  const img = new window.Image();
  img.crossOrigin = "anonymous";
  await new Promise<void>((resolve, reject) => {
    img.onload  = () => resolve();
    img.onerror = () => reject(new Error("image load failed"));
    img.src     = imageUrl;
  });

  const size   = img.naturalWidth  || 1024;
  const canvas = document.createElement("canvas");
  canvas.width  = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  // 1 — Draw base image
  ctx.drawImage(img, 0, 0, size, size);

  const pad = Math.round(size * 0.048);

  // 2 — Top gradient (headline + subheadline background)
  const topGrad = ctx.createLinearGradient(0, 0, 0, size * 0.44);
  topGrad.addColorStop(0,   "rgba(0,0,0,0.80)");
  topGrad.addColorStop(1,   "rgba(0,0,0,0)");
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, size, size * 0.44);

  // 3 — Bottom gradient (CTA background)
  const botGrad = ctx.createLinearGradient(0, size * 0.70, 0, size);
  botGrad.addColorStop(0, "rgba(0,0,0,0)");
  botGrad.addColorStop(1, "rgba(0,0,0,0.76)");
  ctx.fillStyle = botGrad;
  ctx.fillRect(0, size * 0.70, size, size * 0.30);

  ctx.direction = "rtl";

  // 4 — Headline (top, right-aligned)
  const hlSize = Math.round(size * 0.075);
  ctx.font         = `900 ${hlSize}px Cairo, Arial`;
  ctx.fillStyle    = "#ffffff";
  ctx.textAlign    = "right";
  ctx.shadowColor  = "rgba(0,0,0,0.55)";
  ctx.shadowBlur   = Math.round(size * 0.018);
  ctx.fillText(arabicText.headline, size - pad, Math.round(size * 0.150));

  // 5 — Subheadline (below headline)
  const shSize = Math.round(size * 0.043);
  ctx.font      = `400 ${shSize}px Cairo, Arial`;
  ctx.fillStyle = "rgba(255,255,255,0.88)";
  ctx.shadowBlur = Math.round(size * 0.010);
  ctx.fillText(arabicText.subheadline, size - pad, Math.round(size * 0.252));

  // 6 — CTA pill button (bottom center)
  ctx.shadowBlur = 0;
  const ctaSize  = Math.round(size * 0.040);
  ctx.font       = `700 ${ctaSize}px Cairo, Arial`;
  ctx.textAlign  = "center";

  const ctaMetrics  = ctx.measureText(arabicText.cta);
  const ctaPadX     = size * 0.065;
  const ctaBtnW     = ctaMetrics.width + ctaPadX * 2;
  const ctaBtnH     = size * 0.074;
  const ctaBtnX     = (size - ctaBtnW) / 2;
  const ctaBtnY     = size * 0.855;
  const ctaRadius   = ctaBtnH / 2;

  // Draw pill
  ctx.beginPath();
  ctx.moveTo(ctaBtnX + ctaRadius, ctaBtnY);
  ctx.lineTo(ctaBtnX + ctaBtnW - ctaRadius, ctaBtnY);
  ctx.arcTo(ctaBtnX + ctaBtnW, ctaBtnY, ctaBtnX + ctaBtnW, ctaBtnY + ctaBtnH, ctaRadius);
  ctx.lineTo(ctaBtnX + ctaBtnW, ctaBtnY + ctaBtnH - ctaRadius);
  ctx.arcTo(ctaBtnX + ctaBtnW, ctaBtnY + ctaBtnH, ctaBtnX + ctaBtnW - ctaRadius, ctaBtnY + ctaBtnH, ctaRadius);
  ctx.lineTo(ctaBtnX + ctaRadius, ctaBtnY + ctaBtnH);
  ctx.arcTo(ctaBtnX, ctaBtnY + ctaBtnH, ctaBtnX, ctaBtnY + ctaBtnH - ctaRadius, ctaRadius);
  ctx.lineTo(ctaBtnX, ctaBtnY + ctaRadius);
  ctx.arcTo(ctaBtnX, ctaBtnY, ctaBtnX + ctaRadius, ctaBtnY, ctaRadius);
  ctx.closePath();

  const btnGrad = ctx.createLinearGradient(ctaBtnX, ctaBtnY, ctaBtnX + ctaBtnW, ctaBtnY);
  btnGrad.addColorStop(0, "#6c5ce7");
  btnGrad.addColorStop(1, "#e040fb");
  ctx.fillStyle = btnGrad;
  ctx.fill();

  // CTA text
  ctx.fillStyle = "#ffffff";
  ctx.fillText(arabicText.cta, size / 2, ctaBtnY + ctaBtnH * 0.64);

  return canvas.toDataURL("image/png");
}

/* ── Main component ──────────────────────────────────────── */

export default function CreativeStudio({ summaries: _s, winners: _w, isPaid = false, isAdmin = false, onPaywall }: CreativeStudioProps) {
  /* ── Tab ─────────────────────────────────────────── */
  const [activeTab, setActiveTab] = useState<"creative" | "adcopy">("creative");

  /* ════════════════════════════════════════════════════════
     CREATIVE TAB STATE
  ════════════════════════════════════════════════════════ */
  const [prompt,    setPrompt]    = useState("");
  const [refImage,  setRefImage]  = useState<ReferenceImage | null>(null);
  const imageInputRef             = useRef<HTMLInputElement>(null);

  const [loading,       setLoading]       = useState(false);
  const [progress,      setProgress]      = useState(0);
  const [images,        setImages]        = useState<CreativeImage[]>([]);
  const [briefs,        setBriefs]        = useState<CreativeBrief[]>([]);
  const [error,         setError]         = useState<string | null>(null);
  const [promptUsed,    setPromptUsed]    = useState("");
  const [hoveredIdx,    setHoveredIdx]    = useState<number | null>(null);
  const [regenMap,      setRegenMap]      = useState<Record<number, boolean>>({});
  const [isArabicMode,  setIsArabicMode]  = useState(false);
  const [arabicTexts,   setArabicTexts]   = useState<ArabicTextData[]>([]);

  const [imageUsage, setImageUsage] = useState(0);
  const [copyUsage,  setCopyUsage]  = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Progress bar (60 s window for 4 parallel images) ── */
  useEffect(() => {
    if (!loading) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    setProgress(0);
    const start = Date.now();
    timerRef.current = setInterval(() => {
      setProgress(Math.min(88, ((Date.now() - start) / 60_000) * 100));
    }, 150);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [loading]);

  /* ── Hydrate usage counts from localStorage ─────── */
  useEffect(() => {
    setImageUsage(getImageCount());
    setCopyUsage(getCopyCount());
  }, []);

  /* ── Image upload helpers ────────────────────────── */
  function readImageFile(file: File) {
    if (file.size > 10 * 1024 * 1024) { alert("Image must be under 10 MB."); return; }
    setRefImage({ file, previewUrl: URL.createObjectURL(file) });
  }
  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (f) readImageFile(f); e.target.value = "";
  }
  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith("image/")) readImageFile(f);
  }
  function clearImage() {
    if (refImage) URL.revokeObjectURL(refImage.previewUrl);
    setRefImage(null);
  }

  /* ── API call ────────────────────────────────────── */
  async function callGenerateApi(
    p: string,
    arabicMode: boolean,
  ): Promise<{ images: CreativeImage[]; briefs: CreativeBrief[]; arabicTexts?: ArabicTextData[] }> {
    if (refImage) {
      const fd = new FormData();
      fd.append("image",    refImage.file, refImage.file.name || "product.jpg");
      fd.append("prompt",   p.trim());
      fd.append("isArabic", String(arabicMode));
      const res  = await fetch("/api/generate-creative-with-image", { method: "POST", body: fd });
      const data = await res.json() as { images?: CreativeImage[]; briefs?: CreativeBrief[]; arabicTexts?: ArabicTextData[]; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? `Error ${res.status}`);
      return { images: data.images ?? [], briefs: data.briefs ?? [], arabicTexts: data.arabicTexts };
    }

    const res  = await fetch("/api/generate-creative", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ prompt: p.trim(), isArabic: arabicMode }),
    });
    const data = await res.json() as {
      images?:      CreativeImage[];
      briefs?:      CreativeBrief[];
      arabicTexts?: ArabicTextData[];
      error?:       string;
    };
    if (!res.ok || data.error) throw new Error(data.error ?? `Error ${res.status}`);
    return { images: data.images ?? [], briefs: data.briefs ?? [], arabicTexts: data.arabicTexts };
  }

  async function generate() {
    if (!prompt.trim() || loading) return;
    if (!isAdmin && !isPaid && getImageCount() >= CREATIVE_LIMIT) { onPaywall?.("image"); return; }

    const arabicMode = /arabic/i.test(prompt);
    setIsArabicMode(arabicMode);
    setArabicTexts([]);
    setLoading(true); setError(null); setImages([]); setBriefs([]); setRegenMap({});

    try {
      const { images: newImages, briefs: newBriefs, arabicTexts: newArabicTexts } =
        await callGenerateApi(prompt, arabicMode);

      // If Arabic mode, composite each image with the Arabic text overlay
      let finalImages = newImages;
      if (arabicMode && newArabicTexts && newArabicTexts.length > 0) {
        setArabicTexts(newArabicTexts);
        finalImages = await Promise.all(
          newImages.map(async (img, i) => {
            const txt = newArabicTexts[i];
            if (!txt) return img;
            try {
              const composited = await applyArabicOverlay(img.url, txt);
              return { ...img, url: composited };
            } catch {
              return img;
            }
          })
        );
      }

      setImages(finalImages);
      setBriefs(newBriefs);
      setPromptUsed(prompt.trim());
      setProgress(100);
      if (!isPaid) { const next = incrementImageCount(); setImageUsage(next); }
    } catch {
      setError("Generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function regenerateOne(index: number) {
    setRegenMap((p) => ({ ...p, [index]: true }));
    try {
      const briefPrompt = briefs[index]?.prompt || promptUsed || prompt;
      const res  = await fetch("/api/generate-creative-one", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ prompt: briefPrompt, isArabic: isArabicMode }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) {
        let finalUrl = data.url;
        if (isArabicMode && arabicTexts[index]) {
          try {
            finalUrl = await applyArabicOverlay(data.url, arabicTexts[index]);
          } catch { /* keep raw url */ }
        }
        setImages((prev) => {
          const next = [...prev];
          next[index] = { ...next[index], url: finalUrl };
          return next;
        });
      }
    } catch { /* silent */ } finally {
      setRegenMap((p) => ({ ...p, [index]: false }));
    }
  }

  async function downloadImage(img: CreativeImage, index: number) {
    try {
      const res  = await fetch(img.url);
      const blob = await res.blob();
      const obj  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      const slug = img.angle ? img.angle.replace(/\s+/g, "-").toLowerCase() + "-" : "";
      a.href     = obj;
      a.download = `adurai-${slug}${index + 1}.png`;
      a.click();
      URL.revokeObjectURL(obj);
    } catch {
      window.open(img.url, "_blank");
    }
  }

  /* ════════════════════════════════════════════════════════
     AD COPY TAB STATE
  ════════════════════════════════════════════════════════ */
  const [copyProduct,  setCopyProduct]  = useState("");
  const [copyAudience, setCopyAudience] = useState("");
  const [copyBenefit,  setCopyBenefit]  = useState("");
  const [copyLang,     setCopyLang]     = useState("English");
  const [copyLoading,  setCopyLoading]  = useState(false);
  const [copyVariants, setCopyVariants] = useState<AdCopyVariant[]>([]);
  const [copyError,    setCopyError]    = useState<string | null>(null);
  const [copiedIdx,    setCopiedIdx]    = useState<number | null>(null);

  async function generateAdCopy() {
    if (!copyProduct.trim() || copyLoading) return;
    if (!isAdmin && !isPaid && getCopyCount() >= CREATIVE_LIMIT) { onPaywall?.("copy"); return; }
    setCopyLoading(true); setCopyError(null); setCopyVariants([]);
    try {
      const res  = await fetch("/api/generate-ad-copy", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          productDescription: copyProduct,
          targetAudience:     copyAudience,
          mainBenefit:        copyBenefit,
          language:           copyLang,
        }),
      });
      const data = await res.json() as { variants?: AdCopyVariant[]; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? `Error ${res.status}`);
      setCopyVariants(data.variants ?? []);
      if (!isPaid) { const next = incrementCopyCount(); setCopyUsage(next); }
    } catch (err) {
      setCopyError(err instanceof Error ? err.message : "Failed to generate. Try again.");
    } finally {
      setCopyLoading(false);
    }
  }

  function copyToClipboard(variant: AdCopyVariant, idx: number) {
    const parts = [
      variant.primaryText,
      `HEADLINE: ${variant.headline}`,
      variant.description ? `DESCRIPTION: ${variant.description}` : null,
      `CTA: ${variant.cta}`,
    ].filter(Boolean);
    navigator.clipboard.writeText(parts.join("\n\n")).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    });
  }

  /* ── Render ──────────────────────────────────────── */
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="card overflow-hidden"
    >
      {/* ── Tab bar ── */}
      <div className="flex border-b border-[#f0f0f5] bg-white px-6 pt-5">
        <div className="flex gap-1 p-1 rounded-xl bg-[#f4f4f8]">
          {(["creative", "adcopy"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer"
              style={{
                background: activeTab === tab ? "#ffffff" : "transparent",
                color:      activeTab === tab ? "#0a0a0f"  : "#6b7280",
                boxShadow:  activeTab === tab ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {tab === "creative"
                ? <><Image className="w-3.5 h-3.5" /> Creative</>
                : <><FileText className="w-3.5 h-3.5" /> Ad Copy</>
              }
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* ════════════════════════════════════════════
            CREATIVE TAB
        ════════════════════════════════════════════ */}
        {activeTab === "creative" && (
          <motion.div
            key="creative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col lg:flex-row min-h-[640px]"
          >
            {/* LEFT — Controls */}
            <div className="w-full lg:w-[40%] bg-white flex flex-col gap-6 p-6 border-b lg:border-b-0 lg:border-r border-[#f0f0f5]">

              <div>
                <h2 className="font-heading text-xl font-bold text-[#0a0a0f] leading-tight tracking-tight">
                  Creative Studio
                </h2>
                <p className="text-sm text-[#6b7280] mt-1">
                  Generate 4 scroll-stopping ad creatives
                </p>
              </div>

              {/* Image upload */}
              <div className="space-y-2">
                {refImage ? (
                  <div className="flex items-center gap-3 p-3 rounded-2xl border border-[#e8e8f0] bg-[#f8f8fc]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={refImage.previewUrl}
                      alt="Product"
                      className="w-16 h-16 rounded-xl object-cover border border-[#e0e0f0] flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] inline-block" />
                        Ready
                      </span>
                      <p className="text-xs text-[#6b7280] mt-1 truncate">{refImage.file.name}</p>
                    </div>
                    <button
                      onClick={clearImage}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-[#9ca3af] hover:text-red-400 transition-colors cursor-pointer flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => imageInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onDragEnter={(e) => e.preventDefault()}
                    className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed border-[#e0e0f0] hover:border-[#6c5ce7]/40 hover:bg-[#6c5ce7]/[0.02] transition-all duration-200 cursor-pointer group"
                  >
                    <div className="w-11 h-11 rounded-2xl bg-[#f4f4f8] flex items-center justify-center group-hover:bg-[#6c5ce7]/8 transition-colors">
                      <Upload className="w-5 h-5 text-[#9ca3af] group-hover:text-[#6c5ce7] transition-colors" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-[#0a0a0f]">Upload your product image</p>
                      <p className="text-xs text-[#9ca3af] mt-0.5">JPG, PNG, WEBP</p>
                    </div>
                  </div>
                )}
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>

              {/* Prompt */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-[#0a0a0f]">Describe your ad</label>
                  {/arabic/i.test(prompt) && (
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                      style={{ background: "rgba(108,92,231,0.10)", color: "#6c5ce7", border: "1px solid rgba(108,92,231,0.22)" }}
                    >
                      🌙 Arabic overlay
                    </span>
                  )}
                </div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) generate();
                  }}
                  placeholder="e.g. Premium supplement for men, dark powerful background, bold headline"
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-[#e8e8f0] bg-[#f8f8fc] text-[#0a0a0f] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#6c5ce7]/25 focus:border-[#6c5ce7]/40 transition-all placeholder:text-[#9ca3af] leading-relaxed"
                />
                <p className="text-[11px] text-[#9ca3af] leading-relaxed">
                  Mention <span className="font-semibold text-[#6c5ce7]">&quot;Arabic&quot;</span> in your prompt to generate clean images with browser-rendered Arabic text overlay.
                </p>
              </div>

              {/* Usage counter + Generate button */}
              <div className="flex flex-col gap-3">
                {!isPaid && (() => {
                  const remaining = CREATIVE_LIMIT - imageUsage;
                  const isExhausted = remaining <= 0;
                  const isLast      = remaining === 1;
                  const color = isExhausted ? "#e17055" : isLast ? "#f59e0b" : "#10b981";
                  const bg    = isExhausted ? "rgba(225,112,85,0.06)" : isLast ? "rgba(245,158,11,0.06)" : "rgba(16,185,129,0.06)";
                  const border= isExhausted ? "rgba(225,112,85,0.20)" : isLast ? "rgba(245,158,11,0.20)" : "rgba(16,185,129,0.20)";
                  const barBg = isExhausted ? "#e17055" : isLast ? "#f59e0b" : "linear-gradient(90deg, #6c5ce7, #e040fb)";
                  const label = isExhausted ? "No generations left" : `${remaining} generation${remaining === 1 ? "" : "s"} remaining`;
                  return (
                    <div className="rounded-xl px-4 py-3" style={{ background: bg, border: `1px solid ${border}` }}>
                      <div className="flex items-center justify-between mb-2">
                        <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: "var(--font-inter)" }}>
                          {label}
                        </span>
                        {isLast && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b", background: "rgba(245,158,11,0.14)", padding: "2px 8px", borderRadius: 100, fontFamily: "var(--font-inter)" }}>
                            Last free!
                          </span>
                        )}
                        {isExhausted && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#e17055", background: "rgba(225,112,85,0.12)", padding: "2px 8px", borderRadius: 100, fontFamily: "var(--font-inter)" }}>
                            Upgrade to continue
                          </span>
                        )}
                      </div>
                      <div style={{ height: 4, borderRadius: 100, background: "#e5e7eb", overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: 100, width: `${Math.min(100, (imageUsage / CREATIVE_LIMIT) * 100)}%`, background: barBg, transition: "width 0.6s ease" }} />
                      </div>
                    </div>
                  );
                })()}

                {!isPaid && imageUsage >= CREATIVE_LIMIT ? (
                  <button
                    onClick={() => onPaywall?.("image")}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 cursor-pointer"
                    style={{ background: "linear-gradient(135deg, #6c5ce7, #e040fb)", color: "#ffffff", boxShadow: "0 4px 20px rgba(108,92,231,0.3)" }}
                  >
                    <Sparkles className="w-4 h-4" /> Upgrade to Continue
                  </button>
                ) : (
                  <button
                    onClick={generate}
                    disabled={!prompt.trim() || loading}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: (!prompt.trim() || loading) ? "#e8e8f0" : "linear-gradient(135deg, #6c5ce7 0%, #5a4dd4 50%, #00cec9 100%)",
                      color:      (!prompt.trim() || loading) ? "#9ca3af" : "#ffffff",
                      boxShadow:  (!prompt.trim() || loading) ? "none" : "0 4px 20px rgba(108,92,231,0.3)",
                    }}
                  >
                    {loading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                      : <><Sparkles className="w-4 h-4" /> Generate 4 Creatives</>
                    }
                  </button>
                )}

                {!loading && images.length === 0 && !error && (
                  <p className="text-xs text-[#9ca3af] text-center leading-relaxed">
                    Adur designs 4 unique creative concepts — Hero Shot, Lifestyle, Social Proof, and Pattern Interrupt
                  </p>
                )}
              </div>
            </div>

            {/* RIGHT — Output */}
            <div className="w-full lg:w-[60%] bg-[#f8f8fc] flex flex-col p-6 overflow-y-auto">
              <AnimatePresence mode="wait">

                {/* ── Loading ── */}
                {loading && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col gap-5"
                  >
                    {/* 2×2 skeleton grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="flex flex-col gap-2">
                          <div className="aspect-square rounded-2xl bg-gradient-to-br from-[#e8e8f5] to-[#dcdcf0] animate-pulse" />
                          <div className="h-3.5 rounded-lg bg-[#e8e8f0] animate-pulse w-2/3" />
                          <div className="h-3   rounded-lg bg-[#ebebf5] animate-pulse w-1/2" />
                        </div>
                      ))}
                    </div>
                    {/* Status */}
                    <div className="text-center space-y-2">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 text-[#6c5ce7] animate-spin" />
                        <p className="text-sm font-semibold text-[#0a0a0f]">
                          Adur is designing 4 creative concepts...
                        </p>
                      </div>
                      <p className="text-xs text-[#9ca3af]">This takes about 30–60 seconds</p>
                      <div className="w-48 h-1 rounded-full bg-[#e0e0f0] overflow-hidden mx-auto">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width:      `${progress}%`,
                            background: "linear-gradient(90deg, #6c5ce7, #00cec9)",
                          }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── Error ── */}
                {!loading && error && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center gap-5"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-2xl">
                      ⚠️
                    </div>
                    <p className="text-sm font-semibold text-[#0a0a0f]">
                      Generation failed. Please try again.
                    </p>
                    <button
                      onClick={generate}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer"
                      style={{ background: "#6c5ce7" }}
                    >
                      <RefreshCw className="w-4 h-4" /> Try Again
                    </button>
                  </motion.div>
                )}

                {/* ── Empty ── */}
                {!loading && !error && images.length === 0 && (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center gap-5"
                  >
                    <div className="grid grid-cols-2 gap-3 w-full">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="aspect-square rounded-2xl bg-[#ebebf3] border-2 border-dashed border-[#dcdcec] flex items-center justify-center"
                        >
                          <ImageIcon className="w-5 h-5 text-[#c4c4d8]" />
                        </div>
                      ))}
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-[#0a0a0f]">
                        4 creative concepts will appear here
                      </p>
                      <p className="text-xs text-[#9ca3af] mt-1">
                        Hero Shot · Lifestyle · Social Proof · Pattern Interrupt
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* ── 2×2 Image grid ── */}
                {!loading && images.length > 0 && (
                  <motion.div
                    key="images"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="grid grid-cols-2 gap-4">
                      {images.map((img, i) => {
                        const isRegen = regenMap[i] ?? false;
                        const isHover = hoveredIdx === i && !isRegen;
                        const color   = ANGLE_COLORS[i % ANGLE_COLORS.length];

                        return (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{
                              delay:    i * 0.08,
                              duration: 0.35,
                              ease:     [0.22, 1, 0.36, 1],
                            }}
                            className="flex flex-col gap-2"
                          >
                            {/* Angle badge */}
                            {img.angle && (
                              <span
                                className="self-start inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border leading-none"
                                style={{
                                  background:  color.bg,
                                  color:       color.text,
                                  borderColor: color.border,
                                }}
                              >
                                {img.angle}
                              </span>
                            )}

                            {/* Image — always 1:1 square */}
                            <div
                              className="relative w-full aspect-square rounded-2xl overflow-hidden bg-[#e0e0ec] shadow-sm"
                              onMouseEnter={() => setHoveredIdx(i)}
                              onMouseLeave={() => setHoveredIdx(null)}
                            >
                              {isRegen ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-[#f0f0f8]">
                                  <Loader2 className="w-5 h-5 text-[#6c5ce7] animate-spin" />
                                </div>
                              ) : (
                                <>
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={img.url}
                                    alt={img.angle ?? `Creative ${i + 1}`}
                                    className="absolute inset-0 w-full h-full object-fill"
                                  />
                                  <AnimatePresence>
                                    {isHover && (
                                      <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute inset-0 flex items-center justify-center"
                                        style={{
                                          background:    "rgba(10,10,15,0.45)",
                                          backdropFilter: "blur(2px)",
                                        }}
                                      >
                                        <button
                                          onClick={() => downloadImage(img, i)}
                                          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-[#0a0a0f] text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer shadow-lg"
                                        >
                                          <Download className="w-3.5 h-3.5" /> Download
                                        </button>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </>
                              )}
                            </div>

                            {/* Headline */}
                            {img.headline && (
                              <p className="text-xs font-bold text-[#0a0a0f] leading-snug line-clamp-2">
                                {img.headline}
                              </p>
                            )}

                            {/* Why it works */}
                            {img.rationale && (
                              <p className="text-[10px] text-[#9ca3af] leading-relaxed line-clamp-2">
                                {img.rationale}
                              </p>
                            )}

                            {/* Action buttons */}
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => downloadImage(img, i)}
                                disabled={isRegen}
                                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-semibold transition-colors cursor-pointer disabled:opacity-40"
                                style={{
                                  background: "rgba(108,92,231,0.08)",
                                  color:      "#6c5ce7",
                                  border:     "1px solid rgba(108,92,231,0.15)",
                                }}
                              >
                                <Download className="w-3 h-3" /> Download
                              </button>
                              <button
                                onClick={() => regenerateOne(i)}
                                disabled={isRegen}
                                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-semibold border border-[#e8e8f0] bg-white text-[#6b7280] hover:text-[#0a0a0f] hover:border-[#d1d5db] transition-colors cursor-pointer disabled:opacity-40"
                              >
                                <RefreshCw className={`w-3 h-3 ${isRegen ? "animate-spin" : ""}`} />
                                Regenerate
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════
            AD COPY TAB
        ════════════════════════════════════════════ */}
        {activeTab === "adcopy" && (
          <motion.div
            key="adcopy"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col lg:flex-row min-h-[640px]"
          >
            {/* LEFT — Inputs */}
            <div className="w-full lg:w-[40%] bg-white flex flex-col gap-5 p-6 border-b lg:border-b-0 lg:border-r border-[#f0f0f5]">

              <div>
                <h2 className="font-heading text-xl font-bold text-[#0a0a0f] leading-tight tracking-tight">Ad Copy</h2>
                <p className="text-sm text-[#6b7280] mt-1">Generate 5 high-converting ad variants</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#0a0a0f]">Describe your product</label>
                <textarea
                  value={copyProduct}
                  onChange={(e) => setCopyProduct(e.target.value)}
                  placeholder="e.g. Collagen supplement for women 35+, unflavoured powder, 30-day supply"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-[#e8e8f0] bg-[#f8f8fc] text-[#0a0a0f] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#6c5ce7]/25 focus:border-[#6c5ce7]/40 transition-all placeholder:text-[#9ca3af] leading-relaxed"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#0a0a0f]">Who is your target customer?</label>
                <input
                  type="text"
                  value={copyAudience}
                  onChange={(e) => setCopyAudience(e.target.value)}
                  placeholder="e.g. Women 35-55, health-conscious, busy moms"
                  className="w-full px-4 py-3 rounded-xl border border-[#e8e8f0] bg-[#f8f8fc] text-[#0a0a0f] text-sm focus:outline-none focus:ring-2 focus:ring-[#6c5ce7]/25 focus:border-[#6c5ce7]/40 transition-all placeholder:text-[#9ca3af]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#0a0a0f]">What is the #1 benefit?</label>
                <input
                  type="text"
                  value={copyBenefit}
                  onChange={(e) => setCopyBenefit(e.target.value)}
                  placeholder="e.g. Reduces joint pain and improves skin within 30 days"
                  className="w-full px-4 py-3 rounded-xl border border-[#e8e8f0] bg-[#f8f8fc] text-[#0a0a0f] text-sm focus:outline-none focus:ring-2 focus:ring-[#6c5ce7]/25 focus:border-[#6c5ce7]/40 transition-all placeholder:text-[#9ca3af]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#0a0a0f]">Language</label>
                <select
                  value={copyLang}
                  onChange={(e) => setCopyLang(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#e8e8f0] bg-[#f8f8fc] text-[#0a0a0f] text-sm focus:outline-none focus:ring-2 focus:ring-[#6c5ce7]/25 focus:border-[#6c5ce7]/40 transition-all cursor-pointer"
                >
                  {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              {/* Usage counter + Generate button */}
              <div className="flex flex-col gap-3 mt-auto">
                {!isPaid && (() => {
                  const remaining = CREATIVE_LIMIT - copyUsage;
                  const isExhausted = remaining <= 0;
                  const isLast      = remaining === 1;
                  const color = isExhausted ? "#e17055" : isLast ? "#f59e0b" : "#10b981";
                  const bg    = isExhausted ? "rgba(225,112,85,0.06)" : isLast ? "rgba(245,158,11,0.06)" : "rgba(16,185,129,0.06)";
                  const border= isExhausted ? "rgba(225,112,85,0.20)" : isLast ? "rgba(245,158,11,0.20)" : "rgba(16,185,129,0.20)";
                  const barBg = isExhausted ? "#e17055" : isLast ? "#f59e0b" : "linear-gradient(90deg, #6c5ce7, #e040fb)";
                  const label = isExhausted ? "No generations left" : `${remaining} generation${remaining === 1 ? "" : "s"} remaining`;
                  return (
                    <div className="rounded-xl px-4 py-3" style={{ background: bg, border: `1px solid ${border}` }}>
                      <div className="flex items-center justify-between mb-2">
                        <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: "var(--font-inter)" }}>
                          {label}
                        </span>
                        {isLast && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b", background: "rgba(245,158,11,0.14)", padding: "2px 8px", borderRadius: 100, fontFamily: "var(--font-inter)" }}>
                            Last free!
                          </span>
                        )}
                        {isExhausted && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#e17055", background: "rgba(225,112,85,0.12)", padding: "2px 8px", borderRadius: 100, fontFamily: "var(--font-inter)" }}>
                            Upgrade to continue
                          </span>
                        )}
                      </div>
                      <div style={{ height: 4, borderRadius: 100, background: "#e5e7eb", overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: 100, width: `${Math.min(100, (copyUsage / CREATIVE_LIMIT) * 100)}%`, background: barBg, transition: "width 0.6s ease" }} />
                      </div>
                    </div>
                  );
                })()}

                {!isPaid && copyUsage >= CREATIVE_LIMIT ? (
                  <button
                    onClick={() => onPaywall?.("copy")}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 cursor-pointer"
                    style={{ background: "linear-gradient(135deg, #6c5ce7, #e040fb)", color: "#ffffff", boxShadow: "0 4px 20px rgba(108,92,231,0.3)" }}
                  >
                    <Sparkles className="w-4 h-4" /> Upgrade to Continue
                  </button>
                ) : (
                  <button
                    onClick={generateAdCopy}
                    disabled={!copyProduct.trim() || copyLoading}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: (!copyProduct.trim() || copyLoading) ? "#e8e8f0" : "linear-gradient(135deg, #6c5ce7 0%, #5a4dd4 50%, #00cec9 100%)",
                      color:      (!copyProduct.trim() || copyLoading) ? "#9ca3af" : "#ffffff",
                      boxShadow:  (!copyProduct.trim() || copyLoading) ? "none" : "0 4px 20px rgba(108,92,231,0.3)",
                    }}
                  >
                    {copyLoading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Writing...</>
                      : <><Sparkles className="w-4 h-4" /> Generate Ad Copy</>
                    }
                  </button>
                )}
              </div>
            </div>

            {/* RIGHT — Results */}
            <div className="w-full lg:w-[60%] bg-[#f8f8fc] flex flex-col p-6 overflow-y-auto">
              <AnimatePresence mode="wait">

                {copyLoading && (
                  <motion.div
                    key="copy-loading"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center gap-4"
                  >
                    <Loader2 className="w-8 h-8 text-[#6c5ce7] animate-spin" />
                    <p className="text-sm font-semibold text-[#0a0a0f]">Adur is writing your ad copy...</p>
                    <p className="text-xs text-[#9ca3af]">Crafting 5 high-converting variants…</p>
                  </motion.div>
                )}

                {!copyLoading && copyError && (
                  <motion.div
                    key="copy-error"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center gap-3"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-2xl">⚠️</div>
                    <p className="text-sm font-semibold text-red-600 text-center">{copyError}</p>
                    <button
                      onClick={generateAdCopy}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer"
                      style={{ background: "#6c5ce7" }}
                    >
                      <RefreshCw className="w-4 h-4" /> Try Again
                    </button>
                  </motion.div>
                )}

                {!copyLoading && !copyError && copyVariants.length === 0 && (
                  <motion.div
                    key="copy-empty"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center gap-4"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-[#ebebf3] flex items-center justify-center">
                      <FileText className="w-7 h-7 text-[#c4c4d8]" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-[#0a0a0f]">5 ad variants will appear here</p>
                      <p className="text-xs text-[#9ca3af] mt-1">Fill in your product details and click Generate</p>
                    </div>
                  </motion.div>
                )}

                {!copyLoading && copyVariants.length > 0 && (
                  <motion.div
                    key="copy-variants"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="space-y-3"
                  >
                    {copyVariants.map((v, i) => {
                      const color    = hookColor(v.hookType);
                      const isCopied = copiedIdx === i;
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.07, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                          className="bg-white rounded-2xl border border-[#f0f0f5] p-4 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border"
                              style={{ background: color.bg, color: color.text, borderColor: color.border }}
                            >
                              {v.hookType}
                            </span>
                            <button
                              onClick={() => copyToClipboard(v, i)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                              style={{
                                background:  isCopied ? "#ecfdf5" : "#f8f8fc",
                                color:       isCopied ? "#059669" : "#6b7280",
                                border:      `1px solid ${isCopied ? "#a7f3d0" : "#e8e8f0"}`,
                              }}
                            >
                              {isCopied
                                ? <><Check className="w-3 h-3" /> Copied</>
                                : <><Copy  className="w-3 h-3" /> Copy</>
                              }
                            </button>
                          </div>

                          <p className="text-sm text-[#0a0a0f] leading-relaxed whitespace-pre-line">{v.primaryText}</p>

                          <div className="px-3 py-2.5 rounded-xl bg-[#f8f8fc] border border-[#f0f0f5] space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-[#9ca3af]">Headline</p>
                            <p className="text-base font-bold text-[#0a0a0f] leading-snug">{v.headline}</p>
                            {v.description && (
                              <p className="text-xs text-[#6b7280] italic leading-relaxed pt-0.5">{v.description}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-[#9ca3af]">CTA</span>
                            <span
                              className="px-3 py-1 rounded-full text-xs font-bold"
                              style={{
                                background: "rgba(108,92,231,0.08)",
                                color:      "#6c5ce7",
                                border:     "1px solid rgba(108,92,231,0.15)",
                              }}
                            >
                              {v.cta}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  );
}
