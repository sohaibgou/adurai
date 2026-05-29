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
  Video,
} from "lucide-react";
import type { CampaignSummary } from "@/lib/types";
import { useAuth } from "@/context/auth-context";

/* ── Props ───────────────────────────────────────────────── */

export interface SavedSession {
  id:            string;
  created_at:    string;
  image_urls:    Array<{ url: string; angle?: string; headline?: string }>;
  copy_variants?: AdCopyVariant[];
  prompt?:       string;
}

interface CreativeStudioProps {
  summaries:        CampaignSummary[];
  winners?:         string[];
  isPaid?:          boolean;
  isAdmin?:         boolean;
  isProPlan?:       boolean;
  onPaywall?:       (reason: "image" | "copy" | "ugc") => void;
  onSaved?:         (id: string) => void;
  onLibraryOpen?:   () => void;   // called when user switches to Library tab
  savedSessions?:   SavedSession[];
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

/* ── Helpers ─────────────────────────────────────────────── */

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
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

/* ── UGC constants ───────────────────────────────────────── */

const UGC_HOOKS = [
  { id: "Problem/Solution",  icon: "🎯", label: "Problem/Solution",  desc: "Start with a pain point your customer feels" },
  { id: "Testimonial Style", icon: "⭐", label: "Testimonial Style", desc: "Feel like a real customer sharing results"    },
  { id: "Shocking Fact",     icon: "😲", label: "Shocking Fact",     desc: "Open with a surprising statistic or claim"   },
  { id: "Direct Offer",      icon: "💰", label: "Direct Offer",      desc: "Lead with your deal or value proposition"    },
] as const;

const UGC_STYLES = [
  "Natural/Authentic",
  "Energetic/Hype",
  "Educational/Trust",
  "Luxury/Premium",
] as const;

/* ── Avatar presets ─────────────────────────────────────────── */
const AVATAR_PRESETS = [
  { id: "sarah",  name: "Sarah",  style: "Casual · Female",       photo: "https://randomuser.me/api/portraits/women/44.jpg" },
  { id: "maya",   name: "Maya",   style: "Professional · Female", photo: "https://randomuser.me/api/portraits/women/71.jpg" },
  { id: "zoe",    name: "Zoe",    style: "Trendy · Female",       photo: "https://randomuser.me/api/portraits/women/23.jpg" },
  { id: "alex",   name: "Alex",   style: "Casual · Male",         photo: "https://randomuser.me/api/portraits/men/32.jpg"   },
  { id: "jordan", name: "Jordan", style: "Professional · Male",   photo: "https://randomuser.me/api/portraits/men/60.jpg"   },
  { id: "marcus", name: "Marcus", style: "Tech · Male",           photo: "https://randomuser.me/api/portraits/men/44.jpg"   },
] as const;

// Monthly generation limits per plan
const UGC_LIMIT: Record<string, number> = { free: 0, starter: 3, pro: 30 };

function getUgcPlan(): "free" | "starter" | "pro" {
  try {
    const p = localStorage.getItem("adur_plan");
    if (p === "pro")     return "pro";
    if (p === "starter") return "starter";
    return "free";
  } catch { return "free"; }
}

function getUgcRawCount(): number {
  try { return parseInt(localStorage.getItem("adur_ugc_count") ?? "0", 10) || 0; } catch { return 0; }
}

function getCurrentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Checks the stored month key, resets counter if it's a new month, returns current count */
function initUgcCount(): number {
  try {
    const stored   = localStorage.getItem("adur_ugc_reset_date") ?? "";
    const monthKey = getCurrentMonthKey();
    if (stored !== monthKey) {
      localStorage.setItem("adur_ugc_count",      "0");
      localStorage.setItem("adur_ugc_reset_date", monthKey);
      return 0;
    }
    return getUgcRawCount();
  } catch { return 0; }
}

function incrementUgcCount(): number {
  const next = getUgcRawCount() + 1;
  try { localStorage.setItem("adur_ugc_count", String(next)); } catch { /* noop */ }
  return next;
}

function getNextResetDate(): string {
  const now   = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return first.toLocaleDateString(undefined, { month: "long", day: "numeric" });
}

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
  btnGrad.addColorStop(0, "#FF3CAC");
  btnGrad.addColorStop(1, "#FF6B35");
  ctx.fillStyle = btnGrad;
  ctx.fill();

  // CTA text
  ctx.fillStyle = "#ffffff";
  ctx.fillText(arabicText.cta, size / 2, ctaBtnY + ctaBtnH * 0.64);

  return canvas.toDataURL("image/png");
}

/* ── Main component ──────────────────────────────────────── */

export default function CreativeStudio({ summaries: _s, winners: _w, isPaid = false, isAdmin = false, isProPlan = false, onPaywall, onSaved, onLibraryOpen, savedSessions = [] }: CreativeStudioProps) {
  /* ── Auth (for hub save) ─────────────────────────── */
  const { session } = useAuth();

  /* ── Tab ─────────────────────────────────────────── */
  const [activeTab, setActiveTab] = useState<"creative" | "adcopy" | "ugc" | "library">("creative");

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

  const [imageUsage,         setImageUsage]         = useState(0);
  const [copyUsage,          setCopyUsage]          = useState(0);
  const [savingToHub,        setSavingToHub]        = useState(false);
  const [savingCopyToHub,    setSavingCopyToHub]    = useState(false);
  const [saveStatus,         setSaveStatus]         = useState<"idle" | "saving" | "ok" | "err">("idle");
  const [expandedHistoryIds, setExpandedHistoryIds] = useState<Set<string>>(new Set());


  // Derived history lists — fully guarded against null/undefined from DB
  const _sessions     = Array.isArray(savedSessions) ? savedSessions : [];
  const imageSessions = _sessions.filter((s) => Array.isArray(s.image_urls) && s.image_urls.length > 0);
  const copySessions  = _sessions.filter((s) => Array.isArray(s.copy_variants) && s.copy_variants.length > 0);

  function toggleHistory(id: string) {
    setExpandedHistoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const timerRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const ugcProgressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ════════════════════════════════════════════════════════
     UGC VIDEO TAB STATE
  ════════════════════════════════════════════════════════ */
  const ugcImageRef                           = useRef<HTMLInputElement>(null);
  const [ugcImage,       setUgcImage]         = useState<{ file: File; previewUrl: string } | null>(null);
  const [ugcProduct,     setUgcProduct]       = useState("");
  const [ugcHook,        setUgcHook]          = useState<string>("Problem/Solution");
  const [ugcStyle,       setUgcStyle]         = useState<string>("Natural/Authentic");
  const [ugcLang,        setUgcLang]          = useState("English");
  const [ugcDuration,    setUgcDuration]      = useState<5 | 10 | 15>(10);
  const [ugcRatio,       setUgcRatio]         = useState<"9:16" | "1:1" | "16:9">("9:16");
  const [ugcLoading,     setUgcLoading]       = useState(false);
  const [ugcStage,       setUgcStage]         = useState(0); // 0=idle 1=script 2=video 3=audio 4=done
  const [ugcProgress,    setUgcProgress]      = useState(0);
  const [ugcScript,      setUgcScript]        = useState<string | null>(null);
  const [ugcHookLine,    setUgcHookLine]      = useState<string | null>(null);
  const [ugcVideoUrl,    setUgcVideoUrl]      = useState<string | null>(null);
  const [ugcClip2Url,    setUgcClip2Url]      = useState<string | null>(null);
  const [ugcNeedsMerge,  setUgcNeedsMerge]   = useState(false);
  const [ugcError,       setUgcError]         = useState<string | null>(null);
  const [ugcScriptOpen,  setUgcScriptOpen]    = useState(false);
  const [ugcScriptCopied, setUgcScriptCopied] = useState(false);
  const [ugcPlan,        setUgcPlan]          = useState<"free" | "starter" | "pro">("free");
  const [ugcUsage,       setUgcUsage]         = useState(0);
  // Avatar UGC extras
  const [ugcAvatar,           setUgcAvatar]          = useState<string>("sarah");
  const [ugcAvatarCustomFile, setUgcAvatarCustomFile] = useState<{ file: File; previewUrl: string } | null>(null);
  const [ugcAvatarModalOpen,  setUgcAvatarModalOpen]  = useState(false);
  const [ugcAvatarModalSel,   setUgcAvatarModalSel]   = useState<string>("sarah");
  const [ugcAvatarModalCustom, setUgcAvatarModalCustom] = useState<{ file: File; previewUrl: string } | null>(null);
  const ugcAvatarFileRef = useRef<HTMLInputElement>(null);
  const [ugcInputMode,   setUgcInputMode]     = useState<"image" | "url">("image");
  const [ugcProductUrl,  setUgcProductUrl]    = useState("");
  const [ugcHasVoiceover, setUgcHasVoiceover] = useState(false);
  const [ugcHasLipsync,  setUgcHasLipsync]    = useState(false);

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

  /* ── UGC video stage-2 progress bar ─────────────── */
  useEffect(() => {
    if (ugcStage !== 2) {
      if (ugcProgressRef.current) { clearInterval(ugcProgressRef.current); ugcProgressRef.current = null; }
      return;
    }
    const start = Date.now();
    ugcProgressRef.current = setInterval(() => {
      setUgcProgress(Math.min(88, ((Date.now() - start) / 100_000) * 100));
    }, 300);
    return () => { if (ugcProgressRef.current) { clearInterval(ugcProgressRef.current); ugcProgressRef.current = null; } };
  }, [ugcStage]);

  /* ── Hydrate usage counts from localStorage (user-scoped) ── */
  useEffect(() => {
    const userId = session?.user?.id;
    try {
      if (userId) {
        const storedUid = localStorage.getItem("adur_creative_user_id");
        if (storedUid !== userId) {
          // Different user on this browser — wipe stale counts
          localStorage.setItem("adur_creative_user_id", userId);
          localStorage.setItem("adur_image_count", "0");
          localStorage.setItem("adur_copy_count", "0");
          setImageUsage(0);
          setCopyUsage(0);
        } else {
          setImageUsage(getImageCount());
          setCopyUsage(getCopyCount());
        }
      } else {
        setImageUsage(getImageCount());
        setCopyUsage(getCopyCount());
      }
    } catch {
      setImageUsage(0);
      setCopyUsage(0);
    }
    setUgcPlan(getUgcPlan());
    setUgcUsage(initUgcCount());
  }, [session?.user?.id]);

  /* ── Sync ugcPlan from subscription props (authoritative over localStorage) ── */
  useEffect(() => {
    if (isAdmin) return;
    if (isProPlan) setUgcPlan("pro");
    else if (isPaid) setUgcPlan("starter");
    else setUgcPlan("free");
  }, [isAdmin, isProPlan, isPaid]);

  /* ── Fetch fresh library data whenever Library tab opens ── */
  useEffect(() => {
    if (activeTab === "library") onLibraryOpen?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

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

  /* ── Hub save helpers ───────────────────────────── */
  async function saveToHub(imgs: CreativeImage[], usedPrompt: string) {
    const token = session?.access_token;
    if (!token) return;
    setSavingToHub(true);
    setSaveStatus("saving");
    try {
      const res  = await fetch("/api/creatives/save", {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({
          images: imgs.map((img) => ({ url: img.url, angle: img.angle, headline: img.headline })),
          prompt: usedPrompt,
        }),
      });
      const data = await res.json() as { id?: string; error?: string };
      if (res.ok && data.id) {
        setSaveStatus("ok");
        onSaved?.(data.id);
      } else {
        setSaveStatus("err");
        console.error("[saveToHub]", data.error ?? `HTTP ${res.status}`);
      }
    } catch (e) {
      setSaveStatus("err");
      console.error("[saveToHub]", e);
    } finally {
      setSavingToHub(false);
      setTimeout(() => setSaveStatus("idle"), 4000);
    }
  }

  async function saveCopyToHub(variants: AdCopyVariant[], description: string) {
    const token = session?.access_token;
    if (!token) return;
    setSavingCopyToHub(true);
    setSaveStatus("saving");
    try {
      const res  = await fetch("/api/creatives/save", {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({
          images:       [],
          copyVariants: variants,
          prompt:       description || undefined,
        }),
      });
      const data = await res.json() as { id?: string; error?: string };
      if (res.ok && data.id) {
        setSaveStatus("ok");
        onSaved?.(data.id);
      } else {
        setSaveStatus("err");
        console.error("[saveCopyToHub]", data.error ?? `HTTP ${res.status}`);
      }
    } catch (e) {
      setSaveStatus("err");
      console.error("[saveCopyToHub]", e);
    } finally {
      setSavingCopyToHub(false);
      setTimeout(() => setSaveStatus("idle"), 4000);
    }
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
      if (!isAdmin && !isPaid) { const next = incrementImageCount(); setImageUsage(next); }
      // Save to creative hub (best-effort, non-blocking)
      saveToHub(finalImages, prompt.trim());
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Generation failed. Please try again.";
      console.error("[creative-studio] generate error:", msg);
      setError(msg);
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

  /* ── UGC image helpers ──────────────────────────── */
  function readUgcImage(file: File) {
    if (file.size > 10 * 1024 * 1024) { alert("Image must be under 10 MB."); return; }
    setUgcImage({ file, previewUrl: URL.createObjectURL(file) });
  }
  function handleUgcImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (f) readUgcImage(f); e.target.value = "";
  }
  function handleUgcDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith("image/")) readUgcImage(f);
  }
  function clearUgcImage() {
    if (ugcImage) URL.revokeObjectURL(ugcImage.previewUrl);
    setUgcImage(null);
  }

  /* ── Generate Avatar UGC video ─────────────────────────── */
  async function generateUgc() {
    const hasProduct = ugcInputMode === "image" ? !!ugcImage : !!ugcProductUrl.trim();
    if (!hasProduct || ugcLoading) return;

    // Re-read plan + count fresh from localStorage (guards against stale closure)
    const currentPlan  = isAdmin ? "pro" : getUgcPlan();
    const currentCount = isAdmin ? 0      : initUgcCount();
    const limit        = isAdmin ? Infinity : (UGC_LIMIT[currentPlan] ?? 0);

    if (!isAdmin && currentPlan === "free")  return;
    if (!isAdmin && currentCount >= limit)   return;

    setUgcLoading(true);
    setUgcError(null);
    setUgcVideoUrl(null);
    setUgcClip2Url(null);
    setUgcScript(null);
    setUgcHookLine(null);
    setUgcNeedsMerge(false);
    setUgcHasVoiceover(false);
    setUgcHasLipsync(false);
    setUgcProgress(0);
    setUgcStage(1); // ✍️ Writing script

    // Stage timers: script→7s, avatar video→15s, voiceover→stage from server, lipsync→server
    const t2 = setTimeout(() => setUgcStage(2), 7_000);
    const t3 = setTimeout(() => setUgcStage(3), 90_000);
    const t4 = setTimeout(() => setUgcStage(4), 130_000);

    try {
      const fd = new FormData();
      if (ugcInputMode === "image" && ugcImage) {
        fd.append("image", ugcImage.file, ugcImage.file.name || "product.jpg");
      } else {
        fd.append("productUrl", ugcProductUrl.trim());
      }
      fd.append("avatarId",           ugcAvatar);
      fd.append("productDescription", ugcProduct);
      fd.append("hookType",           ugcHook);
      fd.append("creatorStyle",       ugcStyle);
      fd.append("language",           ugcLang);
      fd.append("duration",           String(ugcDuration));
      fd.append("aspectRatio",        ugcRatio);

      // Avatar image — custom upload takes priority over preset photo URL
      if (ugcAvatarCustomFile) {
        fd.append("avatarImageFile", ugcAvatarCustomFile.file, ugcAvatarCustomFile.file.name || "avatar.jpg");
      } else {
        const preset = AVATAR_PRESETS.find(a => a.id === ugcAvatar);
        if (preset) fd.append("avatarImageUrl", preset.photo);
      }

      const res  = await fetch("/api/generate-avatar-ugc", { method: "POST", body: fd });
      const data = await res.json() as {
        videoUrl?:      string;
        audioUrl?:      string | null;
        script?:        string;
        hook?:          string;
        duration?:      number;
        hasVoiceover?:  boolean;
        hasLipsync?:    boolean;
        error?:         string;
      };

      clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
      if (!res.ok || data.error) throw new Error(data.error ?? `HTTP ${res.status}`);

      setUgcVideoUrl(data.videoUrl ?? null);
      setUgcScript(data.script ?? null);
      setUgcHookLine(data.hook ?? null);
      setUgcHasVoiceover(data.hasVoiceover ?? false);
      setUgcHasLipsync(data.hasLipsync ?? false);
      setUgcNeedsMerge(false);
      setUgcProgress(100);
      setUgcStage(5); // ✅ Done
      setUgcScriptOpen(true);
      if (!isAdmin) {
        const next = incrementUgcCount();
        setUgcUsage(next);
      }
    } catch (err) {
      clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
      setUgcError(err instanceof Error ? err.message : "Generation failed. Please try again.");
      setUgcStage(0);
    } finally {
      setUgcLoading(false);
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
      const variants = data.variants ?? [];
      setCopyVariants(variants);
      if (!isAdmin && !isPaid) { const next = incrementCopyCount(); setCopyUsage(next); }
      // Build a human-readable description for the library card
      const desc = [copyProduct, copyAudience && `for ${copyAudience}`, copyBenefit && `— ${copyBenefit}`]
        .filter(Boolean).join(" ");
      saveCopyToHub(variants, desc);
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
        <div className="flex gap-1 p-1 rounded-xl bg-[#F7F5F2]">
          {/* Creative tab */}
          <button
            onClick={() => setActiveTab("creative")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer"
            style={{
              background: activeTab === "creative" ? "#ffffff" : "transparent",
              color:      activeTab === "creative" ? "#0a0a0f"  : "#6b7280",
              boxShadow:  activeTab === "creative" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}
          >
            <Image className="w-3.5 h-3.5" /> Creative
          </button>

          {/* Ad Copy tab */}
          <button
            onClick={() => setActiveTab("adcopy")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer"
            style={{
              background: activeTab === "adcopy" ? "#ffffff" : "transparent",
              color:      activeTab === "adcopy" ? "#0a0a0f"  : "#6b7280",
              boxShadow:  activeTab === "adcopy" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}
          >
            <FileText className="w-3.5 h-3.5" /> Ad Copy
          </button>

          {/* UGC Video tab */}
          <button
            onClick={() => setActiveTab("ugc")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer"
            style={{
              background: activeTab === "ugc" ? "#ffffff" : "transparent",
              color:      activeTab === "ugc" ? "#7c3aed"  : "#6b7280",
              boxShadow:  activeTab === "ugc" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}
          >
            <Video className="w-3.5 h-3.5" />
            UGC Video
            <span
              style={{
                fontSize: 8, fontWeight: 800, letterSpacing: "0.06em",
                padding: "2px 5px", borderRadius: 100,
                background: activeTab === "ugc"
                  ? "linear-gradient(135deg,#7c3aed,#a855f7)"
                  : "rgba(124,58,237,0.12)",
                color: activeTab === "ugc" ? "#fff" : "#7c3aed",
              }}
            >
              PRO
            </span>
          </button>

          {/* Library tab */}
          <button
            onClick={() => setActiveTab("library")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer"
            style={{
              background: activeTab === "library" ? "#ffffff" : "transparent",
              color:      activeTab === "library" ? "#0a0a0f"  : "#6b7280",
              boxShadow:  activeTab === "library" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Library
            {_sessions.length > 0 && (
              <span
                className="inline-flex items-center justify-center rounded-full text-[10px] font-bold leading-none"
                style={{
                  minWidth: 18, height: 18, padding: "0 5px",
                  background: activeTab === "library" ? "linear-gradient(135deg,#FF3CAC,#FF6B35)" : "rgba(255,60,172,0.12)",
                  color: activeTab === "library" ? "#fff" : "#FF3CAC",
                }}
              >
                {_sessions.length}
              </span>
            )}
          </button>
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
                  <div className="flex items-center gap-3 p-3 rounded-2xl border border-[#E8E5E0] bg-[#F7F5F2]">
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
                    className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed border-[#e0e0f0] hover:border-[#FF3CAC]/40 hover:bg-[#FF3CAC]/[0.03] transition-all duration-200 cursor-pointer group"
                  >
                    <div className="w-11 h-11 rounded-2xl bg-[#F7F5F2] flex items-center justify-center group-hover:bg-[#FF3CAC]/8 transition-colors">
                      <Upload className="w-5 h-5 text-[#9ca3af] group-hover:text-[#FF3CAC] transition-colors" />
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
                      style={{ background: "rgba(255,60,172,0.10)", color: "#FF3CAC", border: "1px solid rgba(255,60,172,0.22)" }}
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
                  className="w-full px-4 py-3 rounded-xl border border-[#E8E5E0] bg-[#F7F5F2] text-[#0a0a0f] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#FF3CAC]/25 focus:border-[#FF3CAC]/40 transition-all placeholder:text-[#9ca3af] leading-relaxed"
                />
              </div>

              {/* Usage bar + Generate button */}
              <div className="flex flex-col gap-3">

                {/* ── Usage bar — always visible for free users ── */}
                {!isPaid && (() => {
                  const used       = Math.min(imageUsage, CREATIVE_LIMIT);
                  const remaining  = CREATIVE_LIMIT - used;
                  const exhausted  = remaining <= 0;
                  const lastOne    = remaining === 1;
                  return (
                    <div
                      style={{
                        background:   exhausted ? "rgba(225,112,85,0.05)" : "rgba(255,60,172,0.04)",
                        border:       `1px solid ${exhausted ? "rgba(225,112,85,0.20)" : "rgba(255,60,172,0.15)"}`,
                        borderRadius: 14,
                        padding:      "12px 14px",
                      }}
                    >
                      {/* Top row */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <span style={{ fontSize: 18, lineHeight: 1 }}>
                            {exhausted ? "🔒" : lastOne ? "⚡" : "🎨"}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: exhausted ? "#e17055" : "#0D0D12", fontFamily: "var(--font-inter)" }}>
                            {exhausted
                              ? "No free generations left"
                              : `${remaining} free generation${remaining === 1 ? "" : "s"} remaining`}
                          </span>
                        </div>
                        {lastOne && !exhausted && (
                          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "#FF3CAC", background: "rgba(255,60,172,0.10)", padding: "3px 9px", borderRadius: 100, fontFamily: "var(--font-inter)" }}>
                            Last free
                          </span>
                        )}
                        {exhausted && !isAdmin && (
                          <button
                            onClick={() => onPaywall?.("image")}
                            style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: "linear-gradient(135deg, #FF3CAC, #FF6B35)", padding: "4px 12px", borderRadius: 100, border: "none", cursor: "pointer", fontFamily: "var(--font-inter)" }}
                          >
                            Upgrade →
                          </button>
                        )}
                      </div>
                      {/* 3 progress pills */}
                      <div style={{ display: "flex", gap: 5 }}>
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            style={{
                              flex:         1,
                              height:       6,
                              borderRadius: 100,
                              background:   i < used
                                ? (exhausted ? "#e17055" : "linear-gradient(90deg,#FF3CAC,#FF6B35)")
                                : "#E8E5E0",
                              transition:   "background 0.35s ease",
                            }}
                          />
                        ))}
                      </div>
                      {!exhausted && (
                        <p style={{ fontSize: 11, color: "#A8A5A0", marginTop: 7, fontFamily: "var(--font-inter)" }}>
                          {used} of {CREATIVE_LIMIT} free uses
                        </p>
                      )}
                    </div>
                  );
                })()}

                {/* Generate / Upgrade button */}
                {!isAdmin && !isPaid && imageUsage >= CREATIVE_LIMIT ? (
                  <button
                    onClick={() => onPaywall?.("image")}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold cursor-pointer"
                    style={{ background: "linear-gradient(135deg, #FF3CAC, #FF6B35)", color: "#fff", boxShadow: "0 4px 20px rgba(255,60,172,0.32)", border: "none" }}
                  >
                    <Sparkles className="w-4 h-4" /> Upgrade to Starter — $19/mo
                  </button>
                ) : (
                  <button
                    onClick={generate}
                    disabled={!prompt.trim() || loading}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: (!prompt.trim() || loading) ? "#e8e8f0" : "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)",
                      color:      (!prompt.trim() || loading) ? "#9ca3af" : "#ffffff",
                      boxShadow:  (!prompt.trim() || loading) ? "none" : "0 4px 20px rgba(255,60,172,0.3)",
                      border:     "none",
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
            <div className="w-full lg:w-[60%] bg-[#F7F5F2] flex flex-col p-6 overflow-y-auto">
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
                        <Loader2 className="w-4 h-4 text-[#FF3CAC] animate-spin" />
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
                            background: "linear-gradient(90deg, #FF3CAC, #FF6B35)",
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
                      style={{ background: "#FF3CAC" }}
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
                    {/* Save status pill */}
                    {saveStatus !== "idle" && (
                      <div className="flex items-center gap-1.5 mb-3 px-1">
                        {saveStatus === "saving" && <><Loader2 className="w-3 h-3 text-[#FF3CAC] animate-spin" /><span className="text-[11px] text-[#9ca3af] font-medium">Saving to Library…</span></>}
                        {saveStatus === "ok"     && <><Check   className="w-3 h-3 text-[#16a34a]" /><span className="text-[11px] text-[#16a34a] font-semibold">Saved to Library ✓</span></>}
                        {saveStatus === "err"    && <><X       className="w-3 h-3 text-red-500" /><span className="text-[11px] text-red-500 font-semibold">Save failed — run the DB migration first</span></>}
                      </div>
                    )}
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
                                  <Loader2 className="w-5 h-5 text-[#FF3CAC] animate-spin" />
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
                                  background: "rgba(255,60,172,0.08)",
                                  color:      "#FF3CAC",
                                  border:     "1px solid rgba(255,60,172,0.15)",
                                }}
                              >
                                <Download className="w-3 h-3" /> Download
                              </button>
                              <button
                                onClick={() => regenerateOne(i)}
                                disabled={isRegen}
                                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-semibold border border-[#E8E5E0] bg-white text-[#6b7280] hover:text-[#0a0a0f] hover:border-[#d1d5db] transition-colors cursor-pointer disabled:opacity-40"
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
                  className="w-full px-4 py-3 rounded-xl border border-[#E8E5E0] bg-[#F7F5F2] text-[#0a0a0f] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#FF3CAC]/25 focus:border-[#FF3CAC]/40 transition-all placeholder:text-[#9ca3af] leading-relaxed"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#0a0a0f]">Who is your target customer?</label>
                <input
                  type="text"
                  value={copyAudience}
                  onChange={(e) => setCopyAudience(e.target.value)}
                  placeholder="e.g. Women 35-55, health-conscious, busy moms"
                  className="w-full px-4 py-3 rounded-xl border border-[#E8E5E0] bg-[#F7F5F2] text-[#0a0a0f] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3CAC]/25 focus:border-[#FF3CAC]/40 transition-all placeholder:text-[#9ca3af]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#0a0a0f]">What is the #1 benefit?</label>
                <input
                  type="text"
                  value={copyBenefit}
                  onChange={(e) => setCopyBenefit(e.target.value)}
                  placeholder="e.g. Reduces joint pain and improves skin within 30 days"
                  className="w-full px-4 py-3 rounded-xl border border-[#E8E5E0] bg-[#F7F5F2] text-[#0a0a0f] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3CAC]/25 focus:border-[#FF3CAC]/40 transition-all placeholder:text-[#9ca3af]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#0a0a0f]">Language</label>
                <select
                  value={copyLang}
                  onChange={(e) => setCopyLang(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#E8E5E0] bg-[#F7F5F2] text-[#0a0a0f] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3CAC]/25 focus:border-[#FF3CAC]/40 transition-all cursor-pointer"
                >
                  {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              {/* Usage bar + Generate button */}
              <div className="flex flex-col gap-3 mt-auto">

                {/* ── Usage bar — always visible for free users ── */}
                {!isPaid && (() => {
                  const used      = Math.min(copyUsage, CREATIVE_LIMIT);
                  const remaining = CREATIVE_LIMIT - used;
                  const exhausted = remaining <= 0;
                  const lastOne   = remaining === 1;
                  return (
                    <div
                      style={{
                        background:   exhausted ? "rgba(225,112,85,0.05)" : "rgba(255,60,172,0.04)",
                        border:       `1px solid ${exhausted ? "rgba(225,112,85,0.20)" : "rgba(255,60,172,0.15)"}`,
                        borderRadius: 14,
                        padding:      "12px 14px",
                      }}
                    >
                      {/* Top row */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <span style={{ fontSize: 18, lineHeight: 1 }}>
                            {exhausted ? "🔒" : lastOne ? "⚡" : "✍️"}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: exhausted ? "#e17055" : "#0D0D12", fontFamily: "var(--font-inter)" }}>
                            {exhausted
                              ? "No free generations left"
                              : `${remaining} free generation${remaining === 1 ? "" : "s"} remaining`}
                          </span>
                        </div>
                        {lastOne && !exhausted && (
                          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "#FF3CAC", background: "rgba(255,60,172,0.10)", padding: "3px 9px", borderRadius: 100, fontFamily: "var(--font-inter)" }}>
                            Last free
                          </span>
                        )}
                        {exhausted && !isAdmin && (
                          <button
                            onClick={() => onPaywall?.("copy")}
                            style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: "linear-gradient(135deg, #FF3CAC, #FF6B35)", padding: "4px 12px", borderRadius: 100, border: "none", cursor: "pointer", fontFamily: "var(--font-inter)" }}
                          >
                            Upgrade →
                          </button>
                        )}
                      </div>
                      {/* 3 progress pills */}
                      <div style={{ display: "flex", gap: 5 }}>
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            style={{
                              flex:         1,
                              height:       6,
                              borderRadius: 100,
                              background:   i < used
                                ? (exhausted ? "#e17055" : "linear-gradient(90deg,#FF3CAC,#FF6B35)")
                                : "#E8E5E0",
                              transition:   "background 0.35s ease",
                            }}
                          />
                        ))}
                      </div>
                      {!exhausted && (
                        <p style={{ fontSize: 11, color: "#A8A5A0", marginTop: 7, fontFamily: "var(--font-inter)" }}>
                          {used} of {CREATIVE_LIMIT} free uses
                        </p>
                      )}
                    </div>
                  );
                })()}

                {/* Generate / Upgrade button */}
                {!isAdmin && !isPaid && copyUsage >= CREATIVE_LIMIT ? (
                  <button
                    onClick={() => onPaywall?.("copy")}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold cursor-pointer"
                    style={{ background: "linear-gradient(135deg, #FF3CAC, #FF6B35)", color: "#fff", boxShadow: "0 4px 20px rgba(255,60,172,0.32)", border: "none" }}
                  >
                    <Sparkles className="w-4 h-4" /> Upgrade to Starter — $19/mo
                  </button>
                ) : (
                  <button
                    onClick={generateAdCopy}
                    disabled={!copyProduct.trim() || copyLoading}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: (!copyProduct.trim() || copyLoading) ? "#e8e8f0" : "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)",
                      color:      (!copyProduct.trim() || copyLoading) ? "#9ca3af" : "#ffffff",
                      boxShadow:  (!copyProduct.trim() || copyLoading) ? "none" : "0 4px 20px rgba(255,60,172,0.3)",
                      border:     "none",
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
            <div className="w-full lg:w-[60%] bg-[#F7F5F2] flex flex-col p-6 overflow-y-auto">
              <AnimatePresence mode="wait">

                {copyLoading && (
                  <motion.div
                    key="copy-loading"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center gap-4"
                  >
                    <Loader2 className="w-8 h-8 text-[#FF3CAC] animate-spin" />
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
                      style={{ background: "#FF3CAC" }}
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
                    {/* Save status pill */}
                    {saveStatus !== "idle" && (
                      <div className="flex items-center gap-1.5 pb-1 px-1">
                        {saveStatus === "saving" && <><Loader2 className="w-3 h-3 text-[#FF3CAC] animate-spin" /><span className="text-[11px] text-[#9ca3af] font-medium">Saving to Library…</span></>}
                        {saveStatus === "ok"     && <><Check   className="w-3 h-3 text-[#16a34a]" /><span className="text-[11px] text-[#16a34a] font-semibold">Saved to Library ✓</span></>}
                        {saveStatus === "err"    && <><X       className="w-3 h-3 text-red-500" /><span className="text-[11px] text-red-500 font-semibold">Save failed — run the DB migration first</span></>}
                      </div>
                    )}
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

                          <div className="px-3 py-2.5 rounded-xl bg-[#F7F5F2] border border-[#f0f0f5] space-y-1">
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
                                background: "rgba(255,60,172,0.08)",
                                color:      "#FF3CAC",
                                border:     "1px solid rgba(255,60,172,0.15)",
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

        {/* ════════════════════════════════════════════
            UGC VIDEO TAB
        ════════════════════════════════════════════ */}
        {activeTab === "ugc" && (
          <motion.div
            key="ugc"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col lg:flex-row"
            style={{ minHeight: 720 }}
          >

            {/* ── FREE PLAN: full-tab upgrade gate ── */}
            {!isAdmin && ugcPlan === "free" && (
              <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10" style={{ background: "#F7F5F2" }}>
                <div
                  className="w-full rounded-2xl sm:rounded-3xl overflow-hidden"
                  style={{
                    maxWidth: 680,
                    background: "linear-gradient(145deg, #18102e 0%, #1e1040 55%, #2d1060 100%)",
                    boxShadow: "0 24px 80px rgba(124,58,237,0.28), 0 0 0 1px rgba(124,58,237,0.18)",
                  }}
                >
                  {/* Top strip */}
                  <div style={{ height: 3, background: "linear-gradient(90deg, #7c3aed, #a855f7, #ec4899)" }} />

                  <div className="p-5 sm:p-7 lg:p-10">
                    {/* Badge */}
                    <div className="flex items-center gap-2 mb-5">
                      <span
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
                        style={{ background: "rgba(168,85,247,0.18)", border: "1px solid rgba(168,85,247,0.35)", color: "#c084fc" }}
                      >
                        ✦ Paid Feature
                      </span>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
                      {/* Left: copy */}
                      <div className="flex-1 space-y-4 sm:space-y-5">
                        <div>
                          <h2 className="font-heading mb-2" style={{ fontSize: "clamp(22px, 5vw, 28px)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.1, color: "#ffffff" }}>
                            Turn products into<br />viral UGC videos
                          </h2>
                          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, fontFamily: "var(--font-inter)" }}>
                            Upload a product image, pick a style and hook — Adur AI writes the script, generates the video, and delivers a download-ready MP4.
                          </p>
                        </div>

                        {/* Feature list */}
                        <ul className="space-y-2">
                          {[
                            "AI writes a full UGC script for your product",
                            "6 hook styles — Pain Point, Curiosity, Social Proof…",
                            "9:16 vertical format ready for TikTok & Reels",
                            "Download MP4 in seconds",
                          ].map(f => (
                            <li key={f} className="flex items-start gap-2.5">
                              <span style={{ color: "#a855f7", fontSize: 15, marginTop: 1, flexShrink: 0 }}>✓</span>
                              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.70)", fontFamily: "var(--font-inter)", lineHeight: 1.5 }}>{f}</span>
                            </li>
                          ))}
                        </ul>

                        {/* Plan pills */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                            style={{ background: "rgba(255,60,172,0.14)", border: "1px solid rgba(255,60,172,0.30)", color: "#f472b6" }}>
                            Starter — 3 videos / mo
                          </span>
                          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                            style={{ background: "rgba(168,85,247,0.18)", border: "1px solid rgba(168,85,247,0.35)", color: "#c084fc" }}>
                            Pro — 30 videos / mo
                          </span>
                        </div>

                        {/* CTA — centred */}
                        <div className="flex justify-center pt-1">
                          <button
                            onClick={() => onPaywall?.("ugc")}
                            className="flex items-center justify-center gap-2 font-bold text-white cursor-pointer transition-all"
                            style={{
                              padding: "13px 36px",
                              borderRadius: 100,
                              background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                              border: "none",
                              fontSize: 14,
                              fontFamily: "var(--font-inter)",
                              letterSpacing: "-0.01em",
                              boxShadow: "0 4px 24px rgba(124,58,237,0.50)",
                              minWidth: 220,
                              width: "100%",
                              maxWidth: 320,
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 32px rgba(124,58,237,0.65)"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ""; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 24px rgba(124,58,237,0.50)"; }}
                          >
                            Unlock UGC Video →
                          </button>
                        </div>
                      </div>

                      {/* Right: video mockup — hidden on mobile */}
                      <div className="hidden lg:flex flex-shrink-0 items-center justify-center" style={{ width: 150 }}>
                        <div
                          className="relative flex items-center justify-center rounded-2xl"
                          style={{
                            width: 120, height: 200,
                            background: "linear-gradient(180deg, rgba(124,58,237,0.25) 0%, rgba(168,85,247,0.10) 100%)",
                            border: "1.5px solid rgba(168,85,247,0.30)",
                          }}
                        >
                          {/* fake screen lines */}
                          <div className="absolute inset-x-4 top-5 space-y-1.5 opacity-30">
                            {[80, 60, 70, 50].map((w, i) => (
                              <div key={i} style={{ height: 4, borderRadius: 3, background: "rgba(200,150,255,0.7)", width: `${w}%` }} />
                            ))}
                          </div>
                          {/* lock icon */}
                          <div
                            className="flex items-center justify-center rounded-full"
                            style={{ width: 48, height: 48, background: "rgba(124,58,237,0.50)", border: "1.5px solid rgba(168,85,247,0.50)", backdropFilter: "blur(8px)" }}
                          >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                            </svg>
                          </div>
                          {/* bottom label */}
                          <div className="absolute bottom-4 inset-x-3 text-center">
                            <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(200,150,255,0.80)", fontFamily: "var(--font-inter)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                              9:16 · MP4
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── LEFT: Controls (Starter / Pro only) ── */}
            {(isAdmin || ugcPlan !== "free") && (
            <div className="w-full lg:w-[40%] bg-white flex flex-col gap-5 p-6 border-b lg:border-b-0 lg:border-r border-[#f0f0f5] overflow-y-auto">

              <div>
                <h2 className="font-heading text-xl font-bold text-[#0a0a0f] leading-tight tracking-tight">AI Avatar Ads</h2>
                <p className="text-sm text-[#6b7280] mt-1">Pick an avatar · add your product · get a UGC video</p>
              </div>

              {/* ─ Section 0: Avatar selector ─ */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#9ca3af]">CHOOSE AVATAR</p>

                {/* Selected avatar preview */}
                <div className="flex items-center gap-3 p-3 rounded-2xl border border-[#E8E5E0] bg-[#F7F5F2]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ugcAvatarCustomFile?.previewUrl ?? (AVATAR_PRESETS.find(a => a.id === ugcAvatar)?.photo ?? "")}
                    alt="Selected avatar"
                    className="w-12 h-12 rounded-full object-cover border-2 flex-shrink-0"
                    style={{ borderColor: "rgba(124,58,237,0.35)" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#0a0a0f" }}>
                      {ugcAvatarCustomFile ? "Custom avatar" : (AVATAR_PRESETS.find(a => a.id === ugcAvatar)?.name ?? ugcAvatar)}
                    </p>
                    <p style={{ fontSize: 11, color: "#9ca3af" }}>
                      {ugcAvatarCustomFile ? "Your uploaded photo" : (AVATAR_PRESETS.find(a => a.id === ugcAvatar)?.style ?? "")}
                    </p>
                  </div>
                  <button
                    onClick={() => { setUgcAvatarModalSel(ugcAvatar); setUgcAvatarModalCustom(ugcAvatarCustomFile); setUgcAvatarModalOpen(true); }}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all"
                    style={{ background: "rgba(124,58,237,0.08)", color: "#7c3aed", border: "1.5px solid rgba(124,58,237,0.22)" }}
                  >
                    Change
                  </button>
                </div>
              </div>

              {/* ─ Section 1: Product input ─ */}
              <div className="space-y-3">
                {/* Image / URL toggle */}
                <div className="flex gap-1 p-1 rounded-xl" style={{ background: "#F7F5F2", border: "1px solid #E8E5E0" }}>
                  {(["image", "url"] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setUgcInputMode(mode)}
                      className="flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                      style={{
                        background:  ugcInputMode === mode ? "#fff"     : "transparent",
                        color:       ugcInputMode === mode ? "#7c3aed"  : "#9ca3af",
                        boxShadow:   ugcInputMode === mode ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                      }}
                    >
                      {mode === "image" ? "📸 Upload Image" : "🔗 Website URL"}
                    </button>
                  ))}
                </div>

                {ugcInputMode === "image" ? (
                  <>
                    {ugcImage ? (
                      <div className="flex items-center gap-3 p-3 rounded-2xl border border-[#E8E5E0] bg-[#F7F5F2]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={ugcImage.previewUrl} alt="Product" className="w-14 h-14 rounded-xl object-cover border border-[#e0e0f0] flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" /> Ready
                          </span>
                          <p className="text-xs text-[#6b7280] mt-1 truncate">{ugcImage.file.name}</p>
                        </div>
                        <button onClick={clearUgcImage} className="p-1.5 rounded-lg hover:bg-red-50 text-[#9ca3af] hover:text-red-400 transition-colors cursor-pointer">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => ugcImageRef.current?.click()}
                        onDrop={handleUgcDrop}
                        onDragOver={e => e.preventDefault()}
                        className="flex flex-col items-center justify-center gap-2.5 p-6 rounded-2xl border-2 border-dashed border-[#e0e0f0] hover:border-[#7c3aed]/40 hover:bg-[#7c3aed]/[0.025] transition-all cursor-pointer group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-[#F7F5F2] flex items-center justify-center group-hover:bg-[#7c3aed]/8 transition-colors">
                          <Upload className="w-4 h-4 text-[#9ca3af] group-hover:text-[#7c3aed] transition-colors" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold text-[#0a0a0f]">Upload product image</p>
                          <p className="text-[11px] text-[#9ca3af] mt-0.5 leading-snug">JPG, PNG or WEBP</p>
                        </div>
                      </div>
                    )}
                    <input ref={ugcImageRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleUgcImageChange} />
                  </>
                ) : (
                  <div className="space-y-1.5">
                    <input
                      type="url"
                      value={ugcProductUrl}
                      onChange={e => setUgcProductUrl(e.target.value)}
                      placeholder="https://yourproduct.com"
                      className="w-full px-3 py-2.5 rounded-xl border border-[#E8E5E0] bg-[#F7F5F2] text-[#0a0a0f] text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 focus:border-[#7c3aed]/40 transition-all placeholder:text-[#9ca3af]"
                    />
                    <p className="text-[10px] text-[#9ca3af]">We&apos;ll screenshot the page and use it as the product visual</p>
                  </div>
                )}

                {/* Product description */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#9ca3af]">DESCRIBE YOUR PRODUCT</p>
                  <textarea
                    value={ugcProduct}
                    onChange={e => setUgcProduct(e.target.value)}
                    placeholder="e.g. Premium supplement for men that boosts energy and confidence. 299 DH. Natural ingredients."
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E8E5E0] bg-[#F7F5F2] text-[#0a0a0f] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 focus:border-[#7c3aed]/40 transition-all placeholder:text-[#9ca3af] leading-relaxed"
                  />
                </div>
              </div>

              {/* ─ Section 2: Video Style ─ */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#9ca3af]">HOOK TYPE</p>
                <div className="grid grid-cols-2 gap-2">
                  {UGC_HOOKS.map(h => {
                    const sel = ugcHook === h.id;
                    return (
                      <button
                        key={h.id}
                        onClick={() => setUgcHook(h.id)}
                        className="text-left p-3 rounded-xl border-2 transition-all cursor-pointer"
                        style={{
                          background:   sel ? "rgba(124,58,237,0.06)" : "#F7F5F2",
                          borderColor:  sel ? "rgba(124,58,237,0.40)" : "#E8E5E0",
                        }}
                      >
                        <span style={{ fontSize: 18, lineHeight: 1 }}>{h.icon}</span>
                        <p style={{ fontSize: 11, fontWeight: 700, color: sel ? "#7c3aed" : "#0a0a0f", marginTop: 5, lineHeight: 1.2 }}>{h.label}</p>
                        <p style={{ fontSize: 10, color: "#9ca3af", marginTop: 3, lineHeight: 1.35 }}>{h.desc}</p>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#9ca3af]">CREATOR STYLE</p>
                  <select
                    value={ugcStyle}
                    onChange={e => setUgcStyle(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E8E5E0] bg-[#F7F5F2] text-[#0a0a0f] text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 focus:border-[#7c3aed]/40 transition-all cursor-pointer"
                  >
                    {UGC_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* ─ Section 4: Settings ─ */}
              <div className="space-y-4">
                {/* Language */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#9ca3af]">LANGUAGE</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {["English", "French", "Arabic", "Darija"].map(lang => (
                      <button
                        key={lang}
                        onClick={() => setUgcLang(lang)}
                        className="py-2 rounded-xl text-[11px] font-semibold transition-all cursor-pointer"
                        style={{
                          background:  ugcLang === lang ? "rgba(124,58,237,0.10)" : "#F7F5F2",
                          color:       ugcLang === lang ? "#7c3aed" : "#6b7280",
                          border:      `1.5px solid ${ugcLang === lang ? "rgba(124,58,237,0.35)" : "#E8E5E0"}`,
                        }}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#9ca3af]">DURATION</p>
                  <div className="flex gap-2">
                    {([5, 10, 15] as const).map(d => (
                      <button
                        key={d}
                        onClick={() => setUgcDuration(d)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer"
                        style={{
                          background:  ugcDuration === d ? "rgba(124,58,237,0.10)" : "#F7F5F2",
                          color:       ugcDuration === d ? "#7c3aed" : "#6b7280",
                          border:      `2px solid ${ugcDuration === d ? "rgba(124,58,237,0.35)" : "#E8E5E0"}`,
                        }}
                      >
                        {d}s
                      </button>
                    ))}
                  </div>
                </div>

                {/* Aspect ratio */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#9ca3af]">ASPECT RATIO</p>
                  <div className="flex gap-2">
                    {(["9:16", "1:1", "16:9"] as const).map(ratio => {
                      const labels = { "9:16": "Story", "1:1": "Feed", "16:9": "Landscape" };
                      return (
                        <button
                          key={ratio}
                          onClick={() => setUgcRatio(ratio)}
                          className="flex-1 py-2 rounded-xl text-[11px] font-semibold transition-all cursor-pointer text-center"
                          style={{
                            background:  ugcRatio === ratio ? "rgba(124,58,237,0.10)" : "#F7F5F2",
                            color:       ugcRatio === ratio ? "#7c3aed" : "#6b7280",
                            border:      `1.5px solid ${ugcRatio === ratio ? "rgba(124,58,237,0.35)" : "#E8E5E0"}`,
                          }}
                        >
                          <span style={{ fontSize: 9, display: "block", opacity: 0.7 }}>{ratio}</span>
                          {labels[ratio]}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* ─ Generate button / usage gate ─ */}
              {(() => {
                const plan        = isAdmin ? "pro" : ugcPlan;
                const limit       = isAdmin ? 30    : (UGC_LIMIT[plan] ?? 0);
                const used        = isAdmin ? 0     : ugcUsage;
                const exhausted   = !isAdmin && used >= limit;
                const canAccess   = isAdmin || plan !== "free";
                const hasProduct   = ugcInputMode === "image" ? !!ugcImage : !!ugcProductUrl.trim();
                const btnDisabled = !hasProduct || !ugcProduct.trim() || ugcLoading || exhausted;

                return (
                  <div className="mt-auto space-y-2">
                    {/* Free plan — fully locked */}
                    {!canAccess && (
                      <div
                        className="rounded-2xl p-5 text-center space-y-3"
                        style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.18)" }}
                      >
                        <div style={{ fontSize: 26 }}>🔒</div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#0a0a0f", fontFamily: "var(--font-inter)" }}>UGC Video</p>
                          <p style={{ fontSize: 12, color: "#6b7280", fontFamily: "var(--font-inter)", marginTop: 4, lineHeight: 1.5 }}>
                            Available on Starter and Pro plans
                          </p>
                        </div>
                        <button
                          onClick={() => onPaywall?.("image")}
                          className="w-full py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer"
                          style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", border: "none" }}
                        >
                          Upgrade to Starter →
                        </button>
                      </div>
                    )}

                    {/* Starter exhausted — upgrade to Pro */}
                    {canAccess && exhausted && plan === "starter" && (
                      <div
                        className="rounded-2xl p-4 text-center space-y-2.5"
                        style={{ background: "rgba(225,112,85,0.06)", border: "1px solid rgba(225,112,85,0.22)" }}
                      >
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#0a0a0f", fontFamily: "var(--font-inter)" }}>
                          Monthly limit reached
                        </p>
                        <p style={{ fontSize: 12, color: "#6b7280", fontFamily: "var(--font-inter)", lineHeight: 1.5 }}>
                          You&apos;ve used all {limit} UGC videos this month. Upgrade to Pro for 30/month.
                        </p>
                        <button
                          onClick={() => onPaywall?.("image")}
                          className="w-full py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer"
                          style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", border: "none" }}
                        >
                          Upgrade to Pro — 30/month →
                        </button>
                      </div>
                    )}

                    {/* Pro exhausted — show reset date */}
                    {canAccess && exhausted && plan === "pro" && (
                      <div
                        className="rounded-2xl p-4 text-center space-y-1.5"
                        style={{ background: "rgba(124,58,237,0.05)", border: "1px solid rgba(124,58,237,0.16)" }}
                      >
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#0a0a0f", fontFamily: "var(--font-inter)" }}>
                          Monthly limit reached
                        </p>
                        <p style={{ fontSize: 12, color: "#6b7280", fontFamily: "var(--font-inter)", lineHeight: 1.5 }}>
                          You&apos;ve used all {limit} UGC videos this month.
                          <br />Resets on {getNextResetDate()}.
                        </p>
                      </div>
                    )}

                    {/* Generate button — accessible + not exhausted */}
                    {canAccess && !exhausted && (
                      <>
                        <button
                          onClick={generateUgc}
                          disabled={btnDisabled}
                          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            background: btnDisabled ? "#e8e8f0" : "linear-gradient(135deg,#7c3aed 0%,#a855f7 100%)",
                            color:      btnDisabled ? "#9ca3af" : "#fff",
                            boxShadow:  btnDisabled ? "none"    : "0 4px 20px rgba(124,58,237,0.30)",
                            border:     "none",
                          }}
                        >
                          {ugcLoading
                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
                            : <><Video className="w-4 h-4" /> Generate Avatar Ad</>
                          }
                        </button>

                        {/* Counter */}
                        <p className="text-[11px] text-[#9ca3af] text-center" style={{ fontFamily: "var(--font-inter)" }}>
                          {plan === "starter"
                            ? `${used} of ${limit} UGC videos used this month`
                            : `${limit - used} of ${limit} monthly UGC videos remaining`
                          }
                        </p>

                        {!ugcImage && ugcInputMode === "image" && (
                          <p className="text-[11px] text-[#9ca3af] text-center">↑ Upload a product image to enable generation</p>
                        )}
                        {!ugcProductUrl.trim() && ugcInputMode === "url" && (
                          <p className="text-[11px] text-[#9ca3af] text-center">↑ Enter your product URL to enable generation</p>
                        )}
                      </>
                    )}
                  </div>
                );
              })()}

              {/* ─ Script preview ─ */}
              {ugcScript && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#9ca3af]">YOUR UGC SCRIPT</p>
                    <button
                      onClick={() => setUgcScriptOpen(o => !o)}
                      className="text-[11px] font-semibold cursor-pointer"
                      style={{ color: "#7c3aed", background: "none", border: "none" }}
                    >
                      {ugcScriptOpen ? "Hide ▲" : "Show ▼"}
                    </button>
                  </div>
                  {ugcScriptOpen && (
                    <div className="relative">
                      <div
                        className="p-3 rounded-xl text-[12px] leading-relaxed whitespace-pre-line"
                        style={{ background: "#F7F5F2", border: "1px solid #E8E5E0", color: "#374151", maxHeight: 180, overflowY: "auto" }}
                      >
                        {ugcScript}
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(ugcScript);
                          setUgcScriptCopied(true);
                          setTimeout(() => setUgcScriptCopied(false), 2000);
                        }}
                        className="absolute top-2 right-2 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-all"
                        style={{
                          background: ugcScriptCopied ? "#ecfdf5" : "rgba(255,255,255,0.90)",
                          color:      ugcScriptCopied ? "#059669" : "#6b7280",
                          border:     `1px solid ${ugcScriptCopied ? "#a7f3d0" : "#E8E5E0"}`,
                          backdropFilter: "blur(4px)",
                        }}
                      >
                        {ugcScriptCopied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy Script</>}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            )} {/* end (isAdmin || ugcPlan !== "free") left panel */}

            {/* ── RIGHT: Output (Starter / Pro only) ── */}
            {(isAdmin || ugcPlan !== "free") && (
            <div className="w-full lg:w-[60%] bg-[#F7F5F2] flex flex-col p-6 overflow-y-auto">
              <AnimatePresence mode="wait">

                {/* ─ Empty state ─ */}
                {(isAdmin || ugcPlan !== "free") && ugcStage === 0 && !ugcVideoUrl && !ugcError && !ugcLoading && (
                  <motion.div
                    key="ugc-empty"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center gap-6"
                  >
                    <div className="flex items-center justify-center rounded-3xl" style={{ width: 80, height: 80, background: "rgba(124,58,237,0.08)", border: "2px dashed rgba(124,58,237,0.25)" }}>
                      <Video className="w-8 h-8" style={{ color: "rgba(124,58,237,0.45)" }} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-[#0a0a0f]">Your avatar ad will appear here</p>
                      <p className="text-xs text-[#9ca3af] mt-1">Pick an avatar, add your product, click Generate</p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                      {["Perfect for Meta Feed", "Instagram Stories", "TikTok Ads"].map(label => (
                        <span
                          key={label}
                          className="px-3 py-1.5 rounded-full text-[11px] font-semibold"
                          style={{ background: "#fff", border: "1px solid #E8E5E0", color: "#6b7280" }}
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* ─ Error state ─ */}
                {ugcError && !ugcLoading && (
                  <motion.div
                    key="ugc-error"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center gap-4"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-2xl">⚠️</div>
                    <p className="text-sm font-semibold text-[#0a0a0f] text-center max-w-xs">{ugcError}</p>
                    <button
                      onClick={generateUgc}
                      disabled={ugcInputMode === "image" ? !ugcImage : !ugcProductUrl.trim()}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer"
                      style={{ background: "#7c3aed" }}
                    >
                      <RefreshCw className="w-4 h-4" /> Try Again
                    </button>
                  </motion.div>
                )}

                {/* ─ Generation stages ─ */}
                {ugcLoading && (
                  <motion.div
                    key="ugc-loading"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center gap-8"
                  >
                    {/* Stage steps */}
                    <div className="w-full max-w-sm space-y-3">
                      {[
                        { stage: 1, icon: "✍️", label: "Writing UGC script…"      },
                        { stage: 2, icon: "🎥", label: "Generating avatar video…"  },
                        { stage: 3, icon: "🎙️", label: "Generating voiceover…"    },
                        { stage: 4, icon: "👄", label: "Syncing lips to audio…"   },
                        { stage: 5, icon: "✅", label: "Your avatar ad is ready!"  },
                      ].map(step => {
                        const isActive = ugcStage === step.stage;
                        const isDone   = ugcStage > step.stage;
                        return (
                          <div
                            key={step.stage}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                            style={{
                              background:  isActive ? "rgba(124,58,237,0.08)" : isDone ? "rgba(22,163,74,0.05)" : "rgba(0,0,0,0.03)",
                              border:      `1px solid ${isActive ? "rgba(124,58,237,0.22)" : isDone ? "rgba(22,163,74,0.18)" : "transparent"}`,
                            }}
                          >
                            {isActive
                              ? <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" style={{ color: "#7c3aed" }} />
                              : isDone
                              ? <Check className="w-4 h-4 flex-shrink-0" style={{ color: "#16a34a" }} />
                              : <span className="w-4 h-4 flex-shrink-0" />
                            }
                            <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 500, color: isActive ? "#7c3aed" : isDone ? "#16a34a" : "#9ca3af", fontFamily: "var(--font-inter)" }}>
                              {step.icon} {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Progress bar for stage 2 */}
                    {ugcStage === 2 && (
                      <div className="w-full max-w-sm space-y-1.5">
                        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(124,58,237,0.12)" }}>
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{ width: `${ugcProgress}%`, background: "linear-gradient(90deg,#7c3aed,#a855f7)" }}
                          />
                        </div>
                        <p className="text-[11px] text-[#9ca3af] text-center">This takes 2–3 minutes — please keep this tab open</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ─ Video output ─ */}
                {ugcVideoUrl && !ugcLoading && (
                  <motion.div
                    key="ugc-output"
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="space-y-5"
                  >
                    {/* Video title */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <p className="text-sm font-bold text-[#0a0a0f]">
                          {AVATAR_PRESETS.find(a => a.id === ugcAvatar)?.name ?? ugcAvatar} · {ugcHook} · {ugcDuration}s
                        </p>
                        <p className="text-xs text-[#9ca3af] mt-0.5">{ugcStyle} · {ugcRatio} · {ugcLang}</p>
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold" style={{ background: "rgba(22,163,74,0.10)", color: "#16a34a", border: "1px solid rgba(22,163,74,0.22)" }}>✅ Ready</span>
                        {ugcHasVoiceover && <span className="px-2.5 py-1 rounded-full text-[10px] font-bold" style={{ background: "rgba(124,58,237,0.10)", color: "#7c3aed", border: "1px solid rgba(124,58,237,0.22)" }}>🎙️ Voice</span>}
                        {ugcHasLipsync   && <span className="px-2.5 py-1 rounded-full text-[10px] font-bold" style={{ background: "rgba(59,130,246,0.10)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.22)" }}>👄 Synced</span>}
                      </div>
                    </div>

                    {/* Video player */}
                    <div
                      className="rounded-2xl overflow-hidden mx-auto bg-black"
                      style={{
                        width:  ugcRatio === "9:16" ? 280 : "100%",
                        aspectRatio: ugcRatio === "9:16" ? "9/16" : ugcRatio === "1:1" ? "1/1" : "16/9",
                        maxWidth: "100%",
                      }}
                    >
                      <video
                        src={ugcVideoUrl}
                        controls
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Clip 2 (15 s) */}
                    {ugcNeedsMerge && ugcClip2Url && (
                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold text-[#9ca3af]">Clip 2 — CTA Moment (5s)</p>
                        <div className="rounded-2xl overflow-hidden bg-black" style={{ aspectRatio: ugcRatio === "16:9" ? "16/9" : ugcRatio === "1:1" ? "1/1" : "9/16", maxWidth: ugcRatio === "9:16" ? 200 : "100%" }}>
                          <video src={ugcClip2Url} controls muted loop playsInline className="w-full h-full object-cover" />
                        </div>
                        <p className="text-[10px] text-[#9ca3af]">💡 Merge Clip 1 + Clip 2 in CapCut or Premiere for your full 15s video</p>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <a
                        href={ugcVideoUrl}
                        download={`adurai-ugc-${ugcHook.replace(/\//g,"-").toLowerCase()}-${ugcDuration}s.mp4`}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                        style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff", textDecoration: "none", boxShadow: "0 3px 12px rgba(124,58,237,0.28)" }}
                      >
                        <Download className="w-3.5 h-3.5" /> Download MP4
                      </a>
                      <button
                        onClick={generateUgc}
                        disabled={ugcLoading}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
                        style={{ background: "#fff", color: "#6b7280", border: "1px solid #E8E5E0" }}
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                      </button>
                      <button
                        onClick={() => {
                          if (ugcScript) {
                            navigator.clipboard.writeText(ugcScript);
                            setUgcScriptCopied(true);
                            setTimeout(() => setUgcScriptCopied(false), 2000);
                          }
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                        style={{ background: "#fff", color: ugcScriptCopied ? "#059669" : "#6b7280", border: `1px solid ${ugcScriptCopied ? "#a7f3d0" : "#E8E5E0"}` }}
                      >
                        {ugcScriptCopied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy Script</>}
                      </button>
                    </div>

                    {/* Pro tips */}
                    <div
                      className="rounded-2xl p-4 space-y-2"
                      style={{ background: "rgba(124,58,237,0.04)", border: "1px solid rgba(124,58,237,0.12)" }}
                    >
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed", fontFamily: "var(--font-inter)" }}>💡 Pro Tips for this UGC</p>
                      {[
                        "Hook should stop scroll in the first 1.5 seconds",
                        "Add captions — 85% of people watch without sound",
                        "Test 3 different hooks with the same product",
                      ].map(tip => (
                        <div key={tip} className="flex items-start gap-2">
                          <span style={{ color: "#a855f7", marginTop: 1, flexShrink: 0, fontSize: 10 }}>▸</span>
                          <p style={{ fontSize: 12, color: "#6b7280", fontFamily: "var(--font-inter)", lineHeight: 1.5 }}>{tip}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
            )} {/* end (isAdmin || ugcPlan !== "free") right panel */}

          </motion.div>
        )}

        {/* ════════════════════════════════════════════
            AVATAR SELECTION MODAL
        ════════════════════════════════════════════ */}
        {ugcAvatarModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
            onClick={e => { if (e.target === e.currentTarget) setUgcAvatarModalOpen(false); }}
          >
            <div className="w-full bg-white rounded-2xl shadow-2xl overflow-hidden" style={{ maxWidth: 520, maxHeight: "90vh", display: "flex", flexDirection: "column" }}>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0f0f5]">
                <div>
                  <p className="text-base font-bold text-[#0a0a0f]">Choose Your Avatar</p>
                  <p className="text-xs text-[#9ca3af] mt-0.5">Select a pre-built creator or upload your own photo</p>
                </div>
                <button
                  onClick={() => setUgcAvatarModalOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F7F5F2] transition-colors cursor-pointer"
                  style={{ color: "#9ca3af" }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="overflow-y-auto p-5 space-y-5">

                {/* Pre-built avatars */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#9ca3af]">PRE-BUILT CREATORS</p>
                  <div className="grid grid-cols-3 gap-3">
                    {AVATAR_PRESETS.map(av => {
                      const sel = ugcAvatarModalSel === av.id && !ugcAvatarModalCustom;
                      return (
                        <button
                          key={av.id}
                          onClick={() => { setUgcAvatarModalSel(av.id); setUgcAvatarModalCustom(null); }}
                          className="flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all cursor-pointer"
                          style={{
                            background:  sel ? "rgba(124,58,237,0.06)" : "#F7F5F2",
                            borderColor: sel ? "rgba(124,58,237,0.40)" : "#E8E5E0",
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={av.photo}
                            alt={av.name}
                            className="w-16 h-16 rounded-full object-cover"
                            style={{ border: `2px solid ${sel ? "rgba(124,58,237,0.40)" : "#E8E5E0"}` }}
                          />
                          <p style={{ fontSize: 12, fontWeight: 700, color: sel ? "#7c3aed" : "#0a0a0f" }}>{av.name}</p>
                          <p style={{ fontSize: 10, color: "#9ca3af", textAlign: "center", lineHeight: 1.3 }}>{av.style}</p>
                          {sel && (
                            <span style={{ fontSize: 9, fontWeight: 700, color: "#7c3aed", background: "rgba(124,58,237,0.10)", padding: "2px 8px", borderRadius: 100, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                              Selected
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px" style={{ background: "#E8E5E0" }} />
                  <span className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest">or upload your own</span>
                  <div className="flex-1 h-px" style={{ background: "#E8E5E0" }} />
                </div>

                {/* Custom avatar upload */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#9ca3af]">CUSTOM AVATAR</p>

                  {ugcAvatarModalCustom ? (
                    <div className="flex items-center gap-3 p-3 rounded-2xl border border-[#E8E5E0] bg-[#F7F5F2]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ugcAvatarModalCustom.previewUrl} alt="Custom" className="w-14 h-14 rounded-full object-cover border-2" style={{ borderColor: "rgba(124,58,237,0.35)" }} />
                      <div className="flex-1 min-w-0">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" /> Custom avatar ready
                        </span>
                        <p className="text-xs text-[#6b7280] mt-1 truncate">{ugcAvatarModalCustom.file.name}</p>
                      </div>
                      <button
                        onClick={() => setUgcAvatarModalCustom(null)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-[#9ca3af] hover:text-red-400 transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => ugcAvatarFileRef.current?.click()}
                      className="flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 border-dashed border-[#e0e0f0] hover:border-[#7c3aed]/40 hover:bg-[#7c3aed]/[0.025] transition-all cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#F7F5F2] flex items-center justify-center group-hover:bg-[#7c3aed]/8 transition-colors">
                        <Upload className="w-4 h-4 text-[#9ca3af] group-hover:text-[#7c3aed] transition-colors" />
                      </div>
                      <p className="text-sm font-semibold text-[#0a0a0f]">Upload a photo of yourself</p>
                      <p className="text-[11px] text-[#9ca3af]">JPG, PNG or WEBP · Clear face photo works best</p>
                    </div>
                  )}
                  <input
                    ref={ugcAvatarFileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setUgcAvatarModalCustom({ file: f, previewUrl: URL.createObjectURL(f) });
                      e.target.value = "";
                    }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t border-[#f0f0f5] flex items-center gap-3">
                <button
                  onClick={() => setUgcAvatarModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all"
                  style={{ background: "#F7F5F2", color: "#6b7280", border: "1px solid #E8E5E0" }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Commit selection: either custom upload or preset
                    if (ugcAvatarModalCustom) {
                      if (ugcAvatarCustomFile) URL.revokeObjectURL(ugcAvatarCustomFile.previewUrl);
                      setUgcAvatarCustomFile(ugcAvatarModalCustom);
                      setUgcAvatar(ugcAvatarModalSel);
                    } else {
                      if (ugcAvatarCustomFile) URL.revokeObjectURL(ugcAvatarCustomFile.previewUrl);
                      setUgcAvatarCustomFile(null);
                      setUgcAvatar(ugcAvatarModalSel);
                    }
                    setUgcAvatarModalOpen(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer transition-all"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", border: "none", boxShadow: "0 4px 16px rgba(124,58,237,0.30)" }}
                >
                  Use This Avatar →
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════
            LIBRARY TAB
        ════════════════════════════════════════════ */}
        {activeTab === "library" && (
          <motion.div
            key="library"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="p-6"
            style={{ minHeight: 480 }}
          >
            {_sessions.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center gap-4 py-20">
                <div
                  className="flex items-center justify-center rounded-2xl"
                  style={{ width: 56, height: 56, background: "#F7F5F2", border: "1px solid #E8E5E0" }}
                >
                  <ImageIcon className="w-6 h-6" style={{ color: "#C4C4D8" }} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-[#0a0a0f]">No saved creatives yet</p>
                  <p className="text-xs text-[#9ca3af] mt-1 max-w-xs">
                    Generate images or ad copy — everything you create is saved here automatically.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab("creative")}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                    style={{ background: "linear-gradient(135deg,#FF3CAC,#FF6B35)", color: "#fff", border: "none" }}
                  >
                    <Image className="w-3.5 h-3.5" /> Generate Images
                  </button>
                  <button
                    onClick={() => setActiveTab("adcopy")}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                    style={{ background: "#F7F5F2", color: "#6b7280", border: "1px solid #E8E5E0" }}
                  >
                    <FileText className="w-3.5 h-3.5" /> Write Copy
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-8">

                {/* ── Image sessions ── */}
                {imageSessions.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-[0.06em] mb-3">
                      Image Creatives · {imageSessions.length}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {imageSessions.map((session) => {
                        const isOpen = expandedHistoryIds.has(session.id);
                        const imgs   = Array.isArray(session.image_urls) ? session.image_urls : [];
                        return (
                          <div
                            key={session.id}
                            className="rounded-2xl overflow-hidden cursor-pointer"
                            style={{
                              background: "#F7F5F2",
                              border: `1px solid ${isOpen ? "rgba(255,60,172,0.28)" : "#E8E5E0"}`,
                              boxShadow: isOpen ? "0 4px 20px rgba(255,60,172,0.10)" : "none",
                              transition: "border-color 0.2s, box-shadow 0.2s",
                            }}
                            onClick={() => toggleHistory(session.id)}
                          >
                            {/* 2×2 thumbnail */}
                            <div className="grid grid-cols-2 gap-0.5" style={{ height: 120 }}>
                              {imgs.slice(0, 4).map((img, i) => (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                  key={i}
                                  src={img.url}
                                  alt={img.angle ?? `img ${i}`}
                                  className="w-full h-full object-cover"
                                  style={{ borderRadius: i === 0 ? "12px 0 0 0" : i === 1 ? "0 12px 0 0" : i === 2 ? "0 0 0 12px" : "0 0 12px 0" }}
                                />
                              ))}
                            </div>
                            {/* Footer */}
                            <div className="p-3">
                              <p className="text-xs font-semibold text-[#0a0a0f] line-clamp-1">
                                {session.prompt ?? "No prompt"}
                              </p>
                              <p className="text-[10px] text-[#9ca3af] mt-0.5">
                                {timeAgo(session.created_at)} · {imgs.length} image{imgs.length !== 1 ? "s" : ""}
                              </p>
                            </div>
                            {/* Expanded */}
                            {isOpen && (
                              <div
                                className="px-3 pb-3 grid grid-cols-2 gap-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {imgs.map((img, i) => (
                                  <div key={i} className="relative group/li">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={img.url}
                                      alt={img.angle ?? `Image ${i + 1}`}
                                      className="w-full aspect-square rounded-xl object-cover"
                                    />
                                    {img.angle && (
                                      <span
                                        className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold"
                                        style={{ background: "rgba(10,10,15,0.65)", color: "#fff" }}
                                      >
                                        {img.angle}
                                      </span>
                                    )}
                                    <button
                                      className="absolute bottom-1.5 right-1.5 opacity-0 group-hover/li:opacity-100 transition-opacity flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold"
                                      style={{ background: "rgba(255,255,255,0.92)", color: "#0a0a0f" }}
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                          const res  = await fetch(img.url);
                                          const blob = await res.blob();
                                          const obj  = URL.createObjectURL(blob);
                                          const a    = document.createElement("a");
                                          a.href     = obj;
                                          a.download = `adurai-${img.angle?.replace(/\s+/g,"-").toLowerCase() ?? "image"}-${i+1}.png`;
                                          a.click();
                                          URL.revokeObjectURL(obj);
                                        } catch { window.open(img.url,"_blank"); }
                                      }}
                                    >
                                      <Download className="w-2.5 h-2.5" /> Save
                                    </button>
                                  </div>
                                ))}
                                {imgs.length > 1 && (
                                  <button
                                    className="col-span-2 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold cursor-pointer mt-1"
                                    style={{ background: "rgba(255,60,172,0.08)", color: "#FF3CAC", border: "1px solid rgba(255,60,172,0.16)" }}
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      for (let i = 0; i < imgs.length; i++) {
                                        try {
                                          const res  = await fetch(imgs[i].url);
                                          const blob = await res.blob();
                                          const obj  = URL.createObjectURL(blob);
                                          const a    = document.createElement("a");
                                          a.href     = obj;
                                          a.download = `adurai-${imgs[i].angle?.replace(/\s+/g,"-").toLowerCase() ?? "image"}-${i+1}.png`;
                                          a.click();
                                          URL.revokeObjectURL(obj);
                                          await new Promise(r => setTimeout(r, 250));
                                        } catch { window.open(imgs[i].url,"_blank"); }
                                      }
                                    }}
                                  >
                                    <Download className="w-3.5 h-3.5" /> Download all {imgs.length}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Copy sessions ── */}
                {copySessions.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-[0.06em] mb-3">
                      Ad Copy · {copySessions.length}
                    </p>
                    <div className="space-y-2">
                      {copySessions.map((session) => {
                        const isOpen  = expandedHistoryIds.has(session.id);
                        const copies  = Array.isArray(session.copy_variants) ? session.copy_variants : [];
                        return (
                          <div
                            key={session.id}
                            className="rounded-2xl overflow-hidden cursor-pointer"
                            style={{
                              background: "#F7F5F2",
                              border: `1px solid ${isOpen ? "rgba(124,58,237,0.28)" : "#E8E5E0"}`,
                              transition: "border-color 0.2s",
                            }}
                            onClick={() => toggleHistory(session.id)}
                          >
                            {/* Collapsed row */}
                            <div className="flex items-center gap-3 p-3">
                              <div
                                className="flex-shrink-0 flex items-center justify-center rounded-xl text-base"
                                style={{ width: 40, height: 40, background: "linear-gradient(135deg,#fdf4ff,#eff6ff)", border: "1px solid rgba(124,58,237,0.15)" }}
                              >
                                ✍️
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-[#0a0a0f] line-clamp-1">
                                  {session.prompt ?? "No description"}
                                </p>
                                <p className="text-[10px] text-[#9ca3af] mt-0.5">
                                  {timeAgo(session.created_at)} · {copies.length} variant{copies.length !== 1 ? "s" : ""}
                                </p>
                              </div>
                              <span className="text-[10px] font-semibold px-2 py-1 rounded-lg flex-shrink-0"
                                style={{ background: "#fff", color: "#9ca3af", border: "1px solid #E8E5E0" }}>
                                {isOpen ? "▲" : "▼"}
                              </span>
                            </div>
                            {/* Expanded variants */}
                            {isOpen && (
                              <div className="px-3 pb-3 space-y-2" onClick={(e) => e.stopPropagation()}>
                                {copies.map((v, i) => {
                                  const color = hookColor(v.hookType);
                                  return (
                                    <div key={i} className="rounded-xl p-3 space-y-2 bg-white" style={{ border: "1px solid #E8E5E0" }}>
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold border"
                                          style={{ background: color.bg, color: color.text, borderColor: color.border }}>
                                          {v.hookType}
                                        </span>
                                        <button
                                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer"
                                          style={{ background: "#F7F5F2", color: "#6b7280", border: "1px solid #E8E5E0" }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const text = [v.primaryText, `HEADLINE: ${v.headline}`, v.description ? `DESCRIPTION: ${v.description}` : null, `CTA: ${v.cta}`].filter(Boolean).join("\n\n");
                                            navigator.clipboard.writeText(text);
                                          }}
                                        >
                                          <Copy className="w-3 h-3" /> Copy
                                        </button>
                                      </div>
                                      <p className="text-xs text-[#374151] leading-relaxed line-clamp-3">{v.primaryText}</p>
                                      <p className="text-xs font-bold text-[#0a0a0f]">{v.headline}</p>
                                      <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold"
                                        style={{ background: "rgba(255,60,172,0.08)", color: "#FF3CAC", border: "1px solid rgba(255,60,172,0.15)" }}>
                                        {v.cta}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  );
}
