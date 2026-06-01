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
  Smartphone,
  Monitor,
  Camera,
  Square,
  User,
  Users,
  Star,
  Link2,
  Globe,
  Search,
  ChevronDown,
  Lock,
  ArrowRight,
  Pencil,
  ShoppingBag,
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
  video_url?:    string;
  media_type?:   "image" | "video" | "copy";
}

interface CreativeStudioProps {
  summaries:        CampaignSummary[];
  winners?:         string[];
  isPaid?:          boolean;
  isAdmin?:         boolean;
  isProPlan?:       boolean;
  planTier?:        "free" | "starter" | "growth" | "pro";
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

interface ProductInfo {
  title:       string;
  description: string;
  image:       string;
  logo:        string;
  publisher:   string;
  url:         string;
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

/* ── Avatar presets ─────────────────────────────────────────────────────────
   apiId maps to the 6 voice/video presets in generate-avatar-ugc/route.ts.
   Extra UI avatars reuse an existing apiId so the backend stays unchanged.
─────────────────────────────────────────────────────────────────────────── */
const AVATAR_PRESETS = [
  // ── Female ────────────────────────────────────────────────────────────
  {
    id: "sarah",   apiId: "sarah",  name: "Sarah",   gender: "female" as const,
    style: "Casual",
    photo: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=600&fit=crop&auto=format&q=80",
  },
  {
    id: "maya",    apiId: "maya",   name: "Maya",    gender: "female" as const,
    style: "Professional",
    photo: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=600&fit=crop&auto=format&q=80",
  },
  {
    id: "zoe",     apiId: "zoe",    name: "Zoe",     gender: "female" as const,
    style: "Trendy",
    photo: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=600&fit=crop&auto=format&q=80",
  },
  {
    id: "adriana", apiId: "zoe",    name: "Adriana", gender: "female" as const,
    style: "Street",
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop&auto=format&q=80",
  },
  {
    id: "sofia",   apiId: "maya",   name: "Sofia",   gender: "female" as const,
    style: "Soft",
    photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=600&fit=crop&auto=format&q=80",
  },
  {
    id: "mei",     apiId: "sarah",  name: "Mei",     gender: "female" as const,
    style: "Minimal",
    photo: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=600&fit=crop&auto=format&q=80",
  },
  // ── Male ──────────────────────────────────────────────────────────────
  {
    id: "alex",    apiId: "alex",   name: "Alex",    gender: "male" as const,
    style: "Casual",
    photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop&auto=format&q=80",
  },
  {
    id: "jordan",  apiId: "jordan", name: "Jordan",  gender: "male" as const,
    style: "Professional",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&auto=format&q=80",
  },
  {
    id: "marcus",  apiId: "marcus", name: "Marcus",  gender: "male" as const,
    style: "Tech",
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=600&fit=crop&auto=format&q=80",
  },
  {
    id: "jayden",  apiId: "alex",   name: "Jayden",  gender: "male" as const,
    style: "Street",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop&auto=format&q=80",
  },
  {
    id: "stefan",  apiId: "jordan", name: "Stefan",  gender: "male" as const,
    style: "Smart",
    photo: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=600&fit=crop&auto=format&q=80",
  },
  {
    id: "liam",    apiId: "marcus", name: "Liam",    gender: "male" as const,
    style: "Modern",
    photo: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400&h=600&fit=crop&auto=format&q=80",
  },
];

// Monthly generation limits per plan
const UGC_LIMIT: Record<string, number> = { free: 0, starter: 3, growth: 10, pro: 30 };

type UgcPlan = "free" | "starter" | "growth" | "pro";

function getUgcPlan(): UgcPlan {
  try {
    const p = localStorage.getItem("adur_plan");
    if (p === "pro")     return "pro";
    if (p === "growth")  return "growth";
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

export default function CreativeStudio({ summaries: _s, winners: _w, isPaid = false, isAdmin = false, isProPlan = false, planTier, onPaywall, onSaved, onLibraryOpen, savedSessions = [] }: CreativeStudioProps) {
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
  // Server-authoritative usage (synced on mount)
  const [serverImageUsage,   setServerImageUsage]   = useState<number | null>(null);
  const [serverCopyUsage,    setServerCopyUsage]    = useState<number | null>(null);
  const [serverUgcUsage,     setServerUgcUsage]     = useState<number | null>(null);
  const [serverUgcLimit,     setServerUgcLimit]     = useState<number | null>(null);
  const [savingToHub,        setSavingToHub]        = useState(false);
  const [savingCopyToHub,    setSavingCopyToHub]    = useState(false);
  const [saveStatus,         setSaveStatus]         = useState<"idle" | "saving" | "ok" | "err">("idle");
  const [expandedHistoryIds, setExpandedHistoryIds] = useState<Set<string>>(new Set());
  const [libFilter,          setLibFilter]          = useState<"all"|"videos"|"images"|"copy">("all");
  const [libHoveredId,       setLibHoveredId]       = useState<string|null>(null);


  // Derived history lists — fully guarded against null/undefined from DB
  const _sessions      = Array.isArray(savedSessions) ? savedSessions : [];
  const videoSessions  = _sessions.filter((s) => s.media_type === "video" && !!s.video_url);
  const imageSessions  = _sessions.filter((s) => s.media_type !== "video" && Array.isArray(s.image_urls) && s.image_urls.length > 0);
  const copySessions   = _sessions.filter((s) => s.media_type !== "video" && Array.isArray(s.copy_variants) && s.copy_variants.length > 0);

  function toggleHistory(id: string) {
    setExpandedHistoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const timerRef      = useRef<ReturnType<typeof setInterval> | null>(null);

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
  const [ugcPlan,        setUgcPlan]          = useState<"free" | "starter" | "growth" | "pro">("free");
  const [ugcUsage,       setUgcUsage]         = useState(0);
  // Avatar UGC extras
  const [ugcAvatar,           setUgcAvatar]          = useState<string>("sarah");
  const [ugcAvatarCustomFile, setUgcAvatarCustomFile] = useState<{ file: File; previewUrl: string } | null>(null);
  const [ugcAvatarModalOpen,  setUgcAvatarModalOpen]  = useState(false);
  const [ugcAvatarModalSel,   setUgcAvatarModalSel]   = useState<string>("sarah");
  const [ugcAvatarModalCustom, setUgcAvatarModalCustom] = useState<{ file: File; previewUrl: string } | null>(null);
  const ugcAvatarFileRef = useRef<HTMLInputElement>(null);
  const [avatarSearch,        setAvatarSearch]        = useState("");
  const [avatarGenderFilter,  setAvatarGenderFilter]  = useState<"all" | "male" | "female">("all");
  const [avatarCategory,      setAvatarCategory]      = useState<"all" | "mine">("all");
  const [ugcInputMode,   setUgcInputMode]     = useState<"image" | "url">("image");
  const [ugcProductUrl,  setUgcProductUrl]    = useState("");
  // Direct product image (og:image) pulled from the pasted URL — used as the
  // real product reference so we don't fall back to a lossy page screenshot.
  const [ugcProductImageUrl, setUgcProductImageUrl] = useState("");
  const productUrlInputRef = useRef<HTMLInputElement>(null);
  const [ugcResolution,  setUgcResolution]    = useState<"480p" | "720p" | "1080p">("720p");

  // Product / App info modal
  const [productModalOpen,   setProductModalOpen]   = useState(false);
  const [productModalMode,   setProductModalMode]   = useState<"main" | "manual">("main");
  const [productUrlDraft,    setProductUrlDraft]    = useState("");
  const [fetchingInfo,       setFetchingInfo]       = useState(false);
  const [fetchInfoErr,       setFetchInfoErr]       = useState<string | null>(null);
  const [fetchedInfo,        setFetchedInfo]        = useState<ProductInfo | null>(null);
  const [confirmedProductTitle, setConfirmedProductTitle] = useState<string>("");
  const [manualName,         setManualName]         = useState("");
  const [manualDesc,         setManualDesc]         = useState("");
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

  /* ── UGC progress is driven by real backend NDJSON events, but the video
        stage has a long (2–3 min) gap between events. Gently creep the bar
        forward so it never looks frozen; real events snap it to the truth. ── */
  useEffect(() => {
    if (!ugcLoading) return;
    const id = setInterval(() => {
      setUgcProgress((p) => (p >= 95 ? p : Math.min(95, p + 0.4)));
    }, 1500);
    return () => clearInterval(id);
  }, [ugcLoading]);

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
    // planTier (when provided) is the source of truth from the subscription
    if (planTier) { setUgcPlan(planTier); return; }
    if (isProPlan) setUgcPlan("pro");
    else if (isPaid) setUgcPlan("starter");
    else setUgcPlan("free");
  }, [isAdmin, isProPlan, isPaid, planTier]);

  /* ── Fetch server-side usage counts (authoritative — prevents localStorage bypass) ── */
  useEffect(() => {
    const token = session?.access_token;
    if (!token) return;
    (async () => {
      try {
        const res  = await fetch("/api/usage", { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const data = await res.json() as {
          imageCount?:   number;
          copyCount?:    number;
          ugcCount?:     number;
          ugcLimit?:     number | null;
        };
        if (typeof data.imageCount === "number") {
          setServerImageUsage(data.imageCount);
          setImageUsage(data.imageCount);
          try { localStorage.setItem("adur_image_count", String(data.imageCount)); } catch { /**/ }
        }
        if (typeof data.copyCount === "number") {
          setServerCopyUsage(data.copyCount);
          setCopyUsage(data.copyCount);
          try { localStorage.setItem("adur_copy_count", String(data.copyCount)); } catch { /**/ }
        }
        if (typeof data.ugcCount === "number") {
          setServerUgcUsage(data.ugcCount);
          setUgcUsage(data.ugcCount);
        }
        setServerUgcLimit(data.ugcLimit ?? null);
      } catch { /**/ }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.access_token]);

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
    language: string,
  ): Promise<{ images: CreativeImage[]; briefs: CreativeBrief[]; arabicTexts?: ArabicTextData[] }> {
    if (refImage) {
      const fd = new FormData();
      fd.append("image",    refImage.file, refImage.file.name || "product.jpg");
      fd.append("prompt",   p.trim());
      fd.append("isArabic", String(arabicMode));
      fd.append("language", language);
      const res  = await fetch("/api/generate-creative-with-image", { method: "POST", body: fd });
      const data = await res.json() as { images?: CreativeImage[]; briefs?: CreativeBrief[]; arabicTexts?: ArabicTextData[]; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? `Error ${res.status}`);
      return { images: data.images ?? [], briefs: data.briefs ?? [], arabicTexts: data.arabicTexts };
    }

    const res  = await fetch("/api/generate-creative", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ prompt: p.trim(), isArabic: arabicMode, language }),
    });
    const data = await res.json() as {
      images?:      CreativeImage[];
      briefs?:      CreativeBrief[];
      arabicTexts?: ArabicTextData[];
      error?:       string;
    };
    if (!res.ok || data.error) {
      const err = data as { error?: string; code?: string };
      if (res.status === 403 && (err.code === "LIMIT_EXCEEDED" || err.code === "PLAN_REQUIRED")) {
        onPaywall?.("image");
        throw new Error("__paywall__");
      }
      throw new Error(data.error ?? `Error ${res.status}`);
    }
    return { images: data.images ?? [], briefs: data.briefs ?? [], arabicTexts: data.arabicTexts };
  }

  async function generate() {
    if (!prompt.trim() || loading) return;
    // Client-side pre-check (server will also enforce — this is just UX)
    if (!isAdmin && !isPaid && imageUsage >= CREATIVE_LIMIT) { onPaywall?.("image"); return; }

    // Arabic uses the no-text image + RTL overlay path; selected language drives copy language.
    const arabicMode = barLang === "Arabic" || /arabic/i.test(prompt);
    setIsArabicMode(arabicMode);
    setArabicTexts([]);
    setLoading(true); setError(null); setImages([]); setBriefs([]); setRegenMap({});

    try {
      const { images: newImages, briefs: newBriefs, arabicTexts: newArabicTexts } =
        await callGenerateApi(prompt, arabicMode, barLang);

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
      if (!isAdmin && !isPaid) {
        const next = incrementImageCount();
        setImageUsage(next);
        setServerImageUsage(next);
      }
      // Save to creative hub (best-effort, non-blocking)
      saveToHub(finalImages, prompt.trim());
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Generation failed. Please try again.";
      if (msg !== "__paywall__") {
        console.error("[creative-studio] generate error:", msg);
        setError(msg);
      }
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

  // Video lives on a cross-origin CDN (fal.ai), where the <a download> attribute
  // is ignored — the browser just opens the file in a new tab. Fetching it as a
  // blob and downloading the object URL forces a real "Save" on a same-origin URL.
  async function downloadVideo(url: string, filename = "adur-ugc.mp4", e?: React.MouseEvent) {
    e?.preventDefault();
    try {
      const res  = await fetch(url);
      const blob = await res.blob();
      const obj  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = obj;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(obj);
    } catch {
      window.open(url, "_blank");
    }
  }

  /* ── UGC image helpers ──────────────────────────── */
  function readUgcImage(file: File) {
    if (file.size > 10 * 1024 * 1024) { alert("Image must be under 10 MB."); return; }
    setUgcImage({ file, previewUrl: URL.createObjectURL(file) });
    setUgcInputMode("image");
    setConfirmedProductTitle(file.name.replace(/\.[^.]+$/, "") || "Product image");
    setUgcProductUrl("");
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

  /* ── Product / App URL fetch ─────────────────────────────── */
  async function fetchProductInfo(url: string) {
    const full = url.startsWith("http") ? url : `https://${url}`;
    setFetchingInfo(true);
    setFetchInfoErr(null);
    setFetchedInfo(null);
    try {
      const res  = await fetch("/api/fetch-product-info", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ url: full }),
      });
      const data = await res.json() as ProductInfo & { error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed to fetch");
      setFetchedInfo(data);
    } catch (e) {
      setFetchInfoErr(e instanceof Error ? e.message : "Could not fetch info from that URL.");
    } finally {
      setFetchingInfo(false);
    }
  }

  function confirmFetchedProduct() {
    if (!fetchedInfo) return;
    const desc = [fetchedInfo.title, fetchedInfo.description].filter(Boolean).join(". ");
    setUgcProduct(desc);
    setUgcProductUrl(fetchedInfo.url);
    setUgcProductImageUrl(fetchedInfo.image || fetchedInfo.logo || "");
    setUgcInputMode("url");
    setConfirmedProductTitle(fetchedInfo.title || fetchedInfo.publisher || fetchedInfo.url);
    setProductModalOpen(false);
    setFetchedInfo(null);
    setProductUrlDraft("");
  }

  function clearConfirmedProduct() {
    setUgcProduct("");
    setUgcProductUrl("");
    setUgcProductImageUrl("");
    setUgcInputMode("image");
    setConfirmedProductTitle("");
    setFetchedInfo(null);
    setProductUrlDraft("");
    setManualName(""); setManualDesc("");
    // Also clear uploaded image if any
    if (ugcImage) { URL.revokeObjectURL(ugcImage.previewUrl); setUgcImage(null); }
  }

  function confirmManualProduct() {
    if (!manualName.trim() && !manualDesc.trim()) return;
    const desc = [manualName.trim(), manualDesc.trim()].filter(Boolean).join(". ");
    setUgcProduct(desc);
    setConfirmedProductTitle(manualName.trim() || "Custom product");
    setProductModalOpen(false);
    setProductModalMode("main");
    setManualName(""); setManualDesc("");
  }

  /* ── Generate Avatar UGC video ─────────────────────────────── */
  async function generateUgc() {
    const hasProduct = ugcInputMode === "image" ? !!ugcImage : !!ugcProductUrl.trim();
    if (!hasProduct || ugcLoading) return;

    // Client-side pre-check (server is the authoritative gate)
    if (!isAdmin && ugcPlan === "free") { onPaywall?.("ugc"); return; }
    const ugcLimitNum = isAdmin ? Infinity : (UGC_LIMIT[ugcPlan] ?? 0);
    if (!isAdmin && ugcUsage >= ugcLimitNum) { onPaywall?.("ugc"); return; }

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

    try {
      const fd = new FormData();
      if (ugcInputMode === "image" && ugcImage) {
        fd.append("image", ugcImage.file, ugcImage.file.name || "product.jpg");
      } else {
        fd.append("productUrl", ugcProductUrl.trim());
        // Real product image from the pasted link — backend uses it directly
        // instead of screenshotting the whole page.
        if (ugcProductImageUrl.trim()) fd.append("productImageUrl", ugcProductImageUrl.trim());
      }
      // Map UI avatar ID → API preset ID (extra UI avatars share a base voice/video preset)
      const avatarApiId = AVATAR_PRESETS.find(a => a.id === ugcAvatar)?.apiId ?? ugcAvatar;
      fd.append("avatarId",           avatarApiId);
      fd.append("productDescription", ugcProduct);
      fd.append("hookType",           ugcHook);
      fd.append("creatorStyle",       ugcStyle);
      fd.append("language",           ugcLang);
      fd.append("duration",           String(ugcDuration));
      fd.append("aspectRatio",        ugcRatio);
      fd.append("resolution",         ugcResolution);

      // Avatar image — custom upload takes priority over preset photo URL
      if (ugcAvatarCustomFile) {
        fd.append("avatarImageFile", ugcAvatarCustomFile.file, ugcAvatarCustomFile.file.name || "avatar.jpg");
      } else {
        const preset = AVATAR_PRESETS.find(a => a.id === ugcAvatar);
        if (preset) fd.append("avatarImageUrl", preset.photo);
      }

      const res = await fetch("/api/generate-avatar-ugc", { method: "POST", body: fd });

      // Plan / usage / validation errors come back as a plain JSON body (non-200,
      // no stream). The success path is an NDJSON stream of progress events.
      if (!res.ok || !res.body) {
        let data: { error?: string; code?: string } = {};
        try { data = await res.json(); } catch { /* non-JSON body */ }
        if (res.status === 403 && (data.code === "PLAN_REQUIRED" || data.code === "UGC_MONTHLY_LIMIT")) {
          onPaywall?.("ugc");
          setUgcStage(0);
          return;
        }
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      // ── Read the NDJSON progress stream ──
      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let result: {
        videoUrl?: string; script?: string; hook?: string;
        hasVoiceover?: boolean; hasLipsync?: boolean;
      } | null = null;

      streamLoop: while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let nl: number;
        while ((nl = buffer.indexOf("\n")) >= 0) {
          const line = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          if (!line) continue;

          let msg: {
            type: string; stage?: number; progress?: number; error?: string;
            videoUrl?: string; script?: string; hook?: string;
            hasVoiceover?: boolean; hasLipsync?: boolean;
          };
          try { msg = JSON.parse(line); } catch { continue; }

          if (msg.type === "progress") {
            if (typeof msg.stage === "number")    setUgcStage(msg.stage);
            if (typeof msg.progress === "number") setUgcProgress(msg.progress);
          } else if (msg.type === "done") {
            result = msg;
            break streamLoop;
          } else if (msg.type === "error") {
            throw new Error(msg.error ?? "Generation failed. Please try again.");
          }
        }
      }

      if (!result?.videoUrl) throw new Error("Generation did not complete. Please try again.");

      setUgcVideoUrl(result.videoUrl ?? null);
      setUgcScript(result.script ?? null);
      setUgcHookLine(result.hook ?? null);
      setUgcHasVoiceover(result.hasVoiceover ?? false);
      setUgcHasLipsync(result.hasLipsync ?? false);
      setUgcNeedsMerge(false);
      setUgcProgress(100);
      setUgcStage(5); // ✅ Done
      setUgcScriptOpen(true);
      if (!isAdmin) {
        const next = incrementUgcCount();
        setUgcUsage(next);
        setServerUgcUsage(next);
      }
    } catch (err) {
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
    // Client-side pre-check (server also enforces)
    if (!isAdmin && !isPaid && copyUsage >= CREATIVE_LIMIT) { onPaywall?.("copy"); return; }
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
      const data = await res.json() as { variants?: AdCopyVariant[]; error?: string; code?: string };
      if (!res.ok || data.error) {
        if (res.status === 403 && (data.code === "LIMIT_EXCEEDED" || data.code === "PLAN_REQUIRED")) {
          onPaywall?.("copy");
          return;
        }
        throw new Error(data.error ?? `Error ${res.status}`);
      }
      const variants = data.variants ?? [];
      setCopyVariants(variants);
      if (!isAdmin && !isPaid) {
        const next = incrementCopyCount();
        setCopyUsage(next);
        setServerCopyUsage(next);
      }
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

  /* ── Prompt-bar extra state ─────────────────────── */
  const [barLang,  setBarLang]  = useState("English");
  const [openDD,   setOpenDD]   = useState<string | null>(null);

  // Route bar textarea to the right per-tab state
  const barValue =
    activeTab === "creative" ? prompt :
    activeTab === "adcopy"   ? copyProduct :
    activeTab === "ugc"      ? ugcProduct  : "";

  function setBarValue(v: string) {
    if (activeTab === "creative") setPrompt(v);
    else if (activeTab === "adcopy") setCopyProduct(v);
    else if (activeTab === "ugc")    setUgcProduct(v);
  }

  // Language per-tab
  const activeLang =
    activeTab === "adcopy" ? copyLang :
    activeTab === "ugc"    ? ugcLang  : barLang;

  function setActiveLang(v: string) {
    if (activeTab === "adcopy") setCopyLang(v);
    else if (activeTab === "ugc") setUgcLang(v);
    else setBarLang(v);
  }

  // Format: for video uses ugcRatio, image is fixed 1:1 Meta
  const imageFormatLabel =
    ugcRatio === "9:16" ? "Mobile" : "Desktop";

  function handleGenerate() {
    if (activeTab === "creative") generate();
    else if (activeTab === "adcopy") generateAdCopy();
    else if (activeTab === "ugc") generateUgc();
  }

  const genBtnLabel =
    activeTab === "creative" ? "Generate 4 Ads" :
    activeTab === "adcopy"   ? "Generate Copy"  :
    activeTab === "ugc"      ? "Generate Video" : "";

  const isGenerating = loading || copyLoading || ugcLoading;

  // Dropdown helper
  function toggleDD(id: string) { setOpenDD(prev => prev === id ? null : id); }

  // Close dropdowns on outside click
  // (handled inline via onBlur on parent)


  /* ── Render ──────────────────────────────────────── */
  const S = {
    bg:      "#0F0F1C",
    bg2:     "#16162A",
    bg3:     "#1E1E30",
    bg4:     "#27273C",
    ink:     "#EEEEF5",
    ink2:    "#9090AC",
    ink3:    "#52526A",
    border:  "rgba(255,255,255,0.07)",
    border2: "rgba(255,255,255,0.13)",
    accent:  "#FF3CAC",
    accent2: "#FF6B35",
    grad:    "linear-gradient(135deg,#FF3CAC 0%,#FF6B35 100%)",
    glow:    "0 4px 24px rgba(255,60,172,0.3)",
  } as const;

  // Resolve avatar photo for current selection
  const selectedAvatarPreset = AVATAR_PRESETS.find(a => a.id === ugcAvatar);
  const avatarDisplayPhoto   = ugcAvatarCustomFile?.previewUrl ?? selectedAvatarPreset?.photo;
  const avatarDisplayName    = ugcAvatarCustomFile ? "Custom" : (selectedAvatarPreset?.name ?? "Sarah");

  return (
    <div
      onClick={() => setOpenDD(null)}
      style={{
        background: `radial-gradient(ellipse 110% 55% at 50% -5%, rgba(255,60,172,0.08) 0%, transparent 55%), ${S.bg}`,
        height: "100%",
        display: "flex", flexDirection: "column",
        fontFamily: "'Geist',system-ui,sans-serif", color: S.ink,
        overflow: "hidden",
      }}
    >
      {/* ── Progress line (top of content) ── */}
      <style>{`
        @keyframes csProgress{0%{width:0%}40%{width:55%}80%{width:85%}100%{width:100%}}
        @keyframes csSpin{to{transform:rotate(360deg)}}
        @keyframes csShimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
        .cs-shimmer{background:linear-gradient(90deg,rgba(255,255,255,0.03) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.03) 75%);background-size:400px 100%;animation:csShimmer 1.4s ease-in-out infinite}
        .cs-canvas::-webkit-scrollbar{width:3px}
        .cs-canvas::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:10px}
        @media (max-width:860px){.cs-results-grid{grid-template-columns:repeat(2,1fr)!important}}
      `}</style>
      {isGenerating && (
        <div style={{ height: 2, flexShrink: 0, overflow: "hidden" }}>
          <div style={{ height: "100%", background: S.grad, animation: "csProgress 3s ease forwards" }} />
        </div>
      )}

      {/* ── Tab bar (flex-shrink:0, top of component) ── */}
      <div style={{
        flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
        borderBottom: `1px solid ${S.border}`, padding: "8px 20px", gap: 16,
        background: S.bg,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 2, background: S.bg3, border: `1px solid ${S.border}`, borderRadius: 10, padding: 3 }}>
          {([
            { id: "creative", label: "Image Ads" },
            { id: "adcopy",   label: "Copy" },
            { id: "ugc",      label: "Video Ads", pro: true },
            { id: "library",  label: "My Ads", count: _sessions.length },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={(e) => { e.stopPropagation(); setActiveTab(t.id); }}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 14px", borderRadius: 7, border: "none",
                fontSize: 12, fontWeight: 500, cursor: "pointer",
                fontFamily: "inherit", whiteSpace: "nowrap", transition: "all 0.15s",
                background: activeTab === t.id ? S.bg4 : "none",
                color:      activeTab === t.id ? S.ink  : S.ink2,
                boxShadow:  activeTab === t.id ? "0 1px 4px rgba(0,0,0,0.5)" : "none",
              }}
            >
              {t.label}
              {"pro" in t && t.pro && <span style={{ fontSize: 9, fontWeight: 700, background: S.grad, color: "#fff", padding: "1px 5px", borderRadius: 4 }}>PRO</span>}
              {"count" in t && (t.count ?? 0) > 0 && <span style={{ fontSize: 9, fontWeight: 700, background: "rgba(255,60,172,0.15)", color: S.accent, padding: "1px 5px", borderRadius: 4 }}>{t.count}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* ── Scrollable canvas (flex:1) ── */}
      <div className="cs-canvas" style={{
        flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden",
        padding: "0 28px",
      }}>
      {/* ════ IMAGE ADS TAB ════ */}
      {activeTab === "creative" && (
        <motion.div key="creative" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} style={{ minHeight: "100%", display: "flex", flexDirection: "column" }}>

          {/* Error */}
          {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 14px", margin: "16px 0", color: "#fca5a5", fontSize: 13 }}>⚠️ {error}</div>}

          {/* Loading — skeleton cards */}
          {loading && (
            <div style={{ paddingTop: 28, paddingBottom: 24 }}>
              {/* Label row */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div className="cs-shimmer" style={{ width: 130, height: 10, borderRadius: 6 }} />
                <div className="cs-shimmer" style={{ width: 54, height: 22, borderRadius: 6 }} />
              </div>
              {/* 4-card skeleton grid — centered, large */}
              <div style={{ maxWidth: 1080, margin: "0 auto" }}>
                <div className="cs-results-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
                  {[0,1,2,3].map(i => (
                    <div key={i} style={{ borderRadius: 12, overflow: "hidden", aspectRatio: "1", position: "relative" }}>
                      <div className="cs-shimmer" style={{ width: "100%", height: "100%", background: "rgba(255,255,255,0.04)", borderRadius: 12 }} />
                      {/* angle badge skeleton */}
                      <div className="cs-shimmer" style={{ position: "absolute", top: 8, left: 8, width: 44, height: 14, borderRadius: 4 }} />
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: S.accent, opacity: 0.8, animation: "csSpin 1.5s linear infinite" }} />
                  <span style={{ fontSize: 12, color: S.ink2, fontWeight: 500 }}>Generating 4 ad variants…</span>
                </div>
              </div>
            </div>
          )}

          {/* Image results */}
          {!loading && images.length > 0 && (
            <div style={{ marginBottom: 24, paddingTop: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: S.ink3 }}>YOUR GENERATED ADS</div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {saveStatus === "ok" && <span style={{ fontSize: 11, color: "#4ade80" }}>✓ Saved</span>}
                  <button onClick={() => { setImages([]); setBriefs([]); }} style={{ background: S.bg3, border: `1px solid ${S.border}`, borderRadius: 6, padding: "4px 10px", fontSize: 11, color: S.ink2, cursor: "pointer" }}>↺ Reset</button>
                </div>
              </div>
              {/* Cards — 1:1, large & centred */}
              <div style={{ maxWidth: 1080, margin: "0 auto", paddingBottom: 24 }}>
                <div className="cs-results-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
                  {images.map((img, idx) => (
                    <div key={idx} onMouseEnter={() => setHoveredIdx(idx)} onMouseLeave={() => setHoveredIdx(null)} style={{ borderRadius: 12, overflow: "hidden", position: "relative", border: `1px solid ${hoveredIdx===idx ? S.border2 : S.border}`, cursor: "pointer", aspectRatio: "1", transition: "transform 0.2s, box-shadow 0.2s", transform: hoveredIdx===idx ? "translateY(-3px) scale(1.015)" : "none", boxShadow: hoveredIdx===idx ? "0 12px 32px rgba(0,0,0,0.55)" : "none" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt={img.angle ?? `Ad ${idx+1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      {regenMap[idx] && <div style={{ position: "absolute", inset: 0, background: "rgba(15,15,24,0.75)", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 22, height: 22, borderRadius: "50%", border: "2px solid rgba(255,60,172,0.3)", borderTopColor: S.accent, animation: "csSpin 1s linear infinite" }} /></div>}
                      {img.angle && <span style={{ position: "absolute", top: 6, left: 6, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", color: "rgba(255,255,255,0.7)", fontSize: 8, fontWeight: 700, padding: "2px 5px", borderRadius: 4, letterSpacing: "0.06em" }}>{img.angle.toUpperCase()}</span>}
                      {hoveredIdx===idx && (
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "14px 7px 7px", background: "linear-gradient(0deg,rgba(0,0,0,0.85) 0%,transparent 100%)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 9, fontWeight: 700, color: "#fff" }}>{img.angle ?? `Variant ${String.fromCharCode(65+idx)}`}</span>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button onClick={() => regenerateOne(idx)} style={{ width: 22, height: 22, borderRadius: 5, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title="Regenerate"><RefreshCw className="w-3 h-3" /></button>
                            <button onClick={() => downloadImage(img, idx)} style={{ width: 22, height: 22, borderRadius: 5, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title="Download"><Download className="w-3 h-3" /></button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Empty state — full Higgsfield-style centered input ── */}
          {!loading && images.length === 0 && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 0 48px", textAlign: "center" }}>

              {/* Headline */}
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255,60,172,0.08)", border: "1px solid rgba(255,60,172,0.2)", color: S.accent, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 10px", borderRadius: 100, marginBottom: 16 }}>
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: S.accent, display: "inline-block" }} /> Image Ads
                </div>
                <h1 style={{ fontSize: 40, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.05, color: S.ink, marginBottom: 10 }}>
                  Turn any product into{" "}
                  <span style={{ background: S.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>scroll-stopping ads.</span>
                </h1>
                <p style={{ fontSize: 13, color: S.ink2, lineHeight: 1.6, maxWidth: 380, margin: "0 auto" }}>
                  Upload your product image, describe the style — get 4 Meta-ready 1:1 ad variants.
                </p>
              </div>

              {/* ── Higgsfield-style centered input card ── */}
              <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 660, background: "rgba(255,255,255,0.028)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 20, overflow: "visible", boxShadow: "0 12px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)" }}>

                {/* ── Options row ── */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "11px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexWrap: "wrap" }}>

                  {/* Add Image */}
                  <button onClick={() => imageInputRef.current?.click()} style={{ display: "flex", alignItems: "center", gap: 6, background: refImage ? "rgba(255,60,172,0.10)" : "rgba(255,255,255,0.05)", border: `1px solid ${refImage ? S.accent : "rgba(255,255,255,0.10)"}`, borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 500, color: refImage ? S.accent : S.ink2, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit", transition: "all 0.15s" }}>
                    <Camera className="w-3.5 h-3.5" style={{ flexShrink: 0 }} /> {refImage ? "Image added ✓" : "Add Image"}
                  </button>

                  <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.07)", flexShrink: 0 }} />

                  {/* Format — fixed 1:1 Meta Ads (no selector) */}
                  <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 500, color: S.ink3, userSelect: "none" }}>
                    <Square className="w-3 h-3" style={{ flexShrink: 0 }} /> <span style={{ color: S.ink2, fontWeight: 600, marginLeft: 2 }}>1:1 Meta</span>
                  </div>

                  {/* Language */}
                  <div onClick={(e) => { e.stopPropagation(); toggleDD("lang-dd-c"); }} style={{ display: "flex", alignItems: "center", gap: 5, background: openDD === "lang-dd-c" ? "rgba(255,60,172,0.08)" : "rgba(255,255,255,0.04)", border: `1px solid ${openDD === "lang-dd-c" ? S.accent : "rgba(255,255,255,0.08)"}`, borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 500, color: openDD === "lang-dd-c" ? S.accent : S.ink2, cursor: "pointer", position: "relative", userSelect: "none" }}>
                    <Globe className="w-3.5 h-3.5" style={{ flexShrink: 0 }} /> <span style={{ color: S.ink, fontWeight: 600, marginLeft: 2 }}>{activeLang}</span> <ChevronDown className="w-3 h-3" style={{ opacity: 0.4, marginLeft: 1 }} />
                    {openDD === "lang-dd-c" && (
                      <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, background: S.bg2, border: `1px solid ${S.border2}`, borderRadius: 10, padding: 4, minWidth: 130, boxShadow: "0 8px 32px rgba(0,0,0,0.6)", zIndex: 300 }}>
                        {[["English","English"],["French","French"],["Arabic","Arabic"],["Darija","Darija"]].map(([label,val]) => (
                          <div key={val} onClick={(e) => { e.stopPropagation(); setActiveLang(val); setOpenDD(null); }} style={{ padding: "7px 10px", borderRadius: 7, fontSize: 12, color: activeLang === val ? S.accent : S.ink2, cursor: "pointer", display: "flex", justifyContent: "space-between" }}>
                            {label} {activeLang === val && <Check className="w-3 h-3" />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Textarea + Generate row ── */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px 16px" }}>
                  {/* Image thumb — required indicator when missing */}
                  {refImage ? (
                    <div style={{ width: 42, height: 42, borderRadius: 8, overflow: "hidden", border: `1px solid ${S.accent}`, flexShrink: 0, position: "relative", boxShadow: "0 0 8px rgba(255,60,172,0.25)" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={refImage.previewUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button onClick={clearImage} style={{ position: "absolute", top: 1, right: 1, width: 14, height: 14, borderRadius: "50%", background: "rgba(0,0,0,0.7)", border: "none", color: "#fff", fontSize: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>×</button>
                    </div>
                  ) : (
                    <button onClick={() => imageInputRef.current?.click()} style={{ width: 42, height: 42, borderRadius: 8, border: `2px dashed rgba(255,60,172,0.4)`, background: "rgba(255,60,172,0.04)", color: S.accent, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }} title="Add product image (required)"><ImageIcon className="w-5 h-5" /></button>
                  )}
                  <textarea
                    value={barValue}
                    onChange={(e) => setBarValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
                    placeholder={refImage ? "Describe your ad style… e.g. Bold dark background, Dubai luxury lifestyle." : "Add your product image first, then describe the ad style…"}
                    style={{ flex: 1, background: "transparent", border: "none", color: S.ink, fontSize: 14, outline: "none", resize: "none", lineHeight: 1.5, height: 46, fontFamily: "inherit", padding: 0 }}
                  />
                  {!isPaid && (
                    <span style={{ fontSize: 10, color: S.ink3, whiteSpace: "nowrap", flexShrink: 0 }}>
                      {Math.max(0, CREATIVE_LIMIT - imageUsage)} left
                    </span>
                  )}
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !barValue.trim() || !refImage}
                    title={!refImage ? "Add a product image first" : undefined}
                    style={{ display: "flex", alignItems: "center", gap: 7, background: isGenerating || !refImage ? S.bg4 : S.grad, border: "none", borderRadius: 12, color: "#fff", fontFamily: "inherit", fontSize: 13, fontWeight: 700, padding: "0 22px", height: 46, cursor: isGenerating || !refImage ? "not-allowed" : "pointer", boxShadow: isGenerating || !refImage ? "none" : "0 4px 20px rgba(255,60,172,0.4)", opacity: isGenerating || !refImage ? 0.45 : 1, whiteSpace: "nowrap", flexShrink: 0, transition: "opacity 0.15s, box-shadow 0.15s" }}
                  >
                    {isGenerating
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" style={{ flexShrink: 0 }} /> Generating…</>
                      : <><Sparkles className="w-3.5 h-3.5" style={{ flexShrink: 0 }} /> Generate 4 Ads</>
                    }
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ════ COPY TAB ════ */}
      {activeTab === "adcopy" && (
        <motion.div key="adcopy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} style={{ minHeight: "100%", display: "flex", flexDirection: "column" }}>

          {/* Error */}
          {copyError && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 14px", margin: "16px 0", color: "#fca5a5", fontSize: 13 }}>⚠️ {copyError}</div>}

          {/* Loading — skeleton copy cards */}
          {copyLoading && (
            <div style={{ paddingTop: 28, paddingBottom: 24 }}>
              {/* Header skeleton */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div className="cs-shimmer" style={{ width: 130, height: 10, borderRadius: 6 }} />
                <div className="cs-shimmer" style={{ width: 48, height: 22, borderRadius: 6 }} />
              </div>
              {/* 3-col card grid (5 cards) */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                {[0,1,2,3,4].map(i => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 16 }}>
                    {/* Hook badge */}
                    <div className="cs-shimmer" style={{ width: 88, height: 18, borderRadius: 100, marginBottom: 12 }} />
                    {/* Headline lines */}
                    <div className="cs-shimmer" style={{ width: "100%", height: 14, borderRadius: 5, marginBottom: 6 }} />
                    <div className="cs-shimmer" style={{ width: "68%", height: 14, borderRadius: 5, marginBottom: 14 }} />
                    {/* Body lines */}
                    {[100,95,88,82,72].map((w, j) => (
                      <div key={j} className="cs-shimmer" style={{ width: `${w}%`, height: 10, borderRadius: 4, marginBottom: 5 }} />
                    ))}
                    {/* CTA row */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
                      <div className="cs-shimmer" style={{ width: 84, height: 26, borderRadius: 100 }} />
                      <div className="cs-shimmer" style={{ width: 58, height: 26, borderRadius: 7 }} />
                    </div>
                  </div>
                ))}
              </div>
              {/* Status row */}
              <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: S.accent, opacity: 0.9, animation: "csSpin 1.5s linear infinite" }} />
                <span style={{ fontSize: 12, color: S.ink2, fontWeight: 500 }}>Writing 5 ad copy variants…</span>
              </div>
            </div>
          )}

          {/* Copy variants — when generated */}
          {!copyLoading && copyVariants.length > 0 && (
            <div style={{ paddingTop: 24, marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: S.ink3 }}>GENERATED COPY</div>
                <button onClick={() => setCopyVariants([])} style={{ fontSize: 11, color: S.accent, background: "none", border: "none", cursor: "pointer" }}>↺ Clear</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                {copyVariants.map((v, idx) => {
                  const hc = hookColor(v.hookType);
                  return (
                    <div key={idx} style={{ background: S.bg2, border: `1px solid ${S.border}`, borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: S.ink3 }}>Variant {String.fromCharCode(65 + idx)} — {v.hookType}</span>
                      <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.3, color: S.ink }}>{v.headline}</div>
                      <div style={{ fontSize: 12, color: S.ink2, lineHeight: 1.55, flex: 1 }}>{v.primaryText}</div>
                      {v.description && <div style={{ fontSize: 11, color: S.ink3, lineHeight: 1.5 }}>{v.description}</div>}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
                        <span style={{ display: "inline-flex", background: S.grad, color: "#fff", fontSize: 10, fontWeight: 700, padding: "4px 12px", borderRadius: 100 }}>{v.cta}</span>
                        <button onClick={() => copyToClipboard(v, idx)} style={{ display: "flex", alignItems: "center", gap: 4, background: S.bg3, border: `1px solid ${S.border}`, borderRadius: 7, padding: "4px 8px", fontSize: 11, color: copiedIdx === idx ? "#4ade80" : S.ink2, cursor: "pointer" }}>
                          {copiedIdx === idx ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Empty state — Higgsfield centered ── */}
          {!copyLoading && copyVariants.length === 0 && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 0 48px", textAlign: "center" }}>

              <div style={{ marginBottom: 32 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255,60,172,0.08)", border: "1px solid rgba(255,60,172,0.2)", color: S.accent, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 10px", borderRadius: 100, marginBottom: 16 }}>
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: S.accent, display: "inline-block" }} /> AI Copywriter
                </div>
                <h1 style={{ fontSize: 40, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.05, color: S.ink, marginBottom: 10 }}>
                  Ad copy that{" "}
                  <span style={{ background: S.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>actually converts.</span>
                </h1>
                <p style={{ fontSize: 13, color: S.ink2, lineHeight: 1.6, maxWidth: 380, margin: "0 auto" }}>
                  Describe your product in one line — get 5 proven variants in any language.
                </p>
              </div>

              {/* Centered input card */}
              <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 660, background: "rgba(255,255,255,0.028)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 20, overflow: "visible", boxShadow: "0 12px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)" }}>
                {/* Options row */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "11px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexWrap: "wrap" }}>
                  {/* Lang */}
                  <div onClick={(e) => { e.stopPropagation(); toggleDD("lang-dd-copy"); }} style={{ display: "flex", alignItems: "center", gap: 5, background: openDD === "lang-dd-copy" ? "rgba(255,60,172,0.08)" : "rgba(255,255,255,0.04)", border: `1px solid ${openDD === "lang-dd-copy" ? S.accent : "rgba(255,255,255,0.08)"}`, borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 500, color: openDD === "lang-dd-copy" ? S.accent : S.ink2, cursor: "pointer", position: "relative", userSelect: "none" }}>
                    <Globe className="w-3.5 h-3.5" style={{ flexShrink: 0 }} /> <span style={{ color: S.ink, fontWeight: 600, marginLeft: 2 }}>{activeLang}</span> <ChevronDown className="w-3 h-3" style={{ opacity: 0.4, marginLeft: 1 }} />
                    {openDD === "lang-dd-copy" && (
                      <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, background: S.bg2, border: `1px solid ${S.border2}`, borderRadius: 10, padding: 4, minWidth: 130, boxShadow: "0 8px 32px rgba(0,0,0,0.6)", zIndex: 300 }}>
                        {[["English","English"],["French","French"],["Arabic","Arabic"],["Darija","Darija"]].map(([label,val]) => (
                          <div key={val} onClick={(e) => { e.stopPropagation(); setActiveLang(val); setOpenDD(null); }} style={{ padding: "7px 10px", borderRadius: 7, fontSize: 12, color: activeLang === val ? S.accent : S.ink2, cursor: "pointer", display: "flex", justifyContent: "space-between" }}>
                            {label} {activeLang === val && <Check className="w-3 h-3" />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {/* Textarea + Generate */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px 16px" }}>
                  <textarea
                    value={barValue}
                    onChange={(e) => setBarValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
                    placeholder="Describe your product… e.g. Anti-aging serum. Visible results in 7 days."
                    style={{ flex: 1, background: "transparent", border: "none", color: S.ink, fontSize: 14, outline: "none", resize: "none", lineHeight: 1.5, height: 46, fontFamily: "inherit", padding: 0 }}
                  />
                  {!isPaid && <span style={{ fontSize: 10, color: S.ink3, whiteSpace: "nowrap", flexShrink: 0 }}>{Math.max(0, CREATIVE_LIMIT - copyUsage)} left</span>}
                  <button onClick={handleGenerate} disabled={isGenerating || !barValue.trim()} style={{ display: "flex", alignItems: "center", gap: 7, background: isGenerating ? S.bg4 : S.grad, border: "none", borderRadius: 12, color: "#fff", fontFamily: "inherit", fontSize: 13, fontWeight: 700, padding: "0 22px", height: 46, cursor: isGenerating ? "not-allowed" : "pointer", boxShadow: isGenerating ? "none" : "0 4px 20px rgba(255,60,172,0.4)", opacity: isGenerating ? 0.7 : 1, whiteSpace: "nowrap", flexShrink: 0, transition: "opacity 0.15s" }}>
                    {isGenerating ? <><Loader2 className="w-3.5 h-3.5 animate-spin" style={{ flexShrink: 0 }} /> Generating…</> : <><Sparkles className="w-3.5 h-3.5" style={{ flexShrink: 0 }} /> Generate Copy</>}
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ════ VIDEO ADS TAB ════ */}
      {activeTab === "ugc" && (
        <motion.div key="ugc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} style={{ minHeight: "100%", display: "flex", flexDirection: "column" }}>

          {/* Error */}
          {ugcError && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 14px", margin: "16px 0", color: "#fca5a5", fontSize: 13 }}>⚠️ {ugcError}</div>}

          {/* Loading — pipeline stepper */}
          {ugcLoading && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 20px" }}>
              {/* Pipeline card */}
              <div style={{ width: "100%", maxWidth: 420, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "24px 28px", marginBottom: 24 }}>
                {[
                  { stage: 1, label: "Writing your script…",     sub: "Adur is crafting your hook, script & scene" },
                  { stage: 2, label: "Staging your creator…",    sub: "Placing your product naturally in hand" },
                  { stage: 3, label: "Filming your video…",      sub: "Adur is bringing your creator to life" },
                  { stage: 4, label: "Finishing up…",            sub: "Polishing & saving your video" },
                ].map(({ stage, label, sub }, i) => {
                  const isActive = ugcStage === stage;
                  const isDone   = ugcStage > stage;
                  return (
                    <div key={stage} style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: i < 3 ? 18 : 0 }}>
                      {/* Step indicator */}
                      <div style={{ position: "relative", flexShrink: 0, marginTop: 2 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: "50%",
                          background: isDone ? "rgba(74,222,128,0.15)" : isActive ? "rgba(255,60,172,0.15)" : "rgba(255,255,255,0.04)",
                          border: `2px solid ${isDone ? "#4ade80" : isActive ? S.accent : "rgba(255,255,255,0.1)"}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "all 0.3s",
                        }}>
                          {isDone
                            ? <Check className="w-3.5 h-3.5" style={{ color: "#4ade80" }} />
                            : isActive
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: S.accent }} />
                              : <span style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "block" }} />
                          }
                        </div>
                        {/* Connector line */}
                        {i < 3 && (
                          <div style={{ position: "absolute", top: 30, left: "50%", transform: "translateX(-50%)", width: 2, height: 18, background: isDone ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.06)", marginTop: -2 }} />
                        )}
                      </div>
                      {/* Text */}
                      <div style={{ paddingTop: 3 }}>
                        <div style={{ fontSize: 13, fontWeight: isActive ? 700 : isDone ? 500 : 400, color: isDone ? "#4ade80" : isActive ? S.ink : S.ink3, transition: "all 0.3s" }}>
                          {label}
                        </div>
                        {isActive && (
                          <div style={{ fontSize: 11, color: S.ink3, marginTop: 2, lineHeight: 1.4 }}>{sub}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Progress bar */}
              <div style={{ width: 320, background: S.bg3, borderRadius: 100, height: 3, overflow: "hidden", marginBottom: 10 }}>
                <div style={{ height: "100%", background: S.grad, width: `${ugcProgress}%`, transition: "width 0.5s ease", borderRadius: 100 }} />
              </div>
              <div style={{ fontSize: 11, color: S.ink3 }}>
                {ugcProgress > 0 ? `${Math.round(ugcProgress)}% · ` : ""}This can take 2–3 minutes
              </div>
            </div>
          )}

          {/* UGC result */}
          {!ugcLoading && ugcVideoUrl && (
            <div style={{ paddingTop: 24, marginBottom: 32, maxWidth: 760 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: S.ink3 }}>YOUR UGC VIDEO</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <a href={ugcVideoUrl} download="adur-ugc.mp4" onClick={(e) => downloadVideo(ugcVideoUrl, "adur-ugc.mp4", e)} style={{ display: "flex", alignItems: "center", gap: 5, background: S.bg3, border: `1px solid ${S.border}`, borderRadius: 8, padding: "7px 12px", fontSize: 12, color: S.ink2, textDecoration: "none", cursor: "pointer" }}>⬇ Download</a>
                  <button
                    onClick={() => { setUgcVideoUrl(null); setUgcClip2Url(null); setUgcScript(null); setUgcHookLine(null); setUgcError(null); setUgcStage(0); setUgcProgress(0); }}
                    style={{ display: "flex", alignItems: "center", gap: 6, background: S.grad, border: "none", borderRadius: 8, color: "#fff", fontFamily: "inherit", fontSize: 12, fontWeight: 700, padding: "7px 14px", cursor: "pointer", boxShadow: "0 4px 16px rgba(255,60,172,0.32)", transition: "transform 0.15s, box-shadow 0.15s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(255,60,172,0.45)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(255,60,172,0.32)"; }}
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Generate New Video
                  </button>
                </div>
              </div>
              <div className="cs-video-result" style={{ display: "flex", gap: 20, alignItems: "stretch", flexWrap: "wrap" }}>
                <video controls src={ugcVideoUrl} style={{ borderRadius: 14, border: `1px solid ${S.border}`, background: "#000", width: 280, maxWidth: "100%", flexShrink: 0, aspectRatio: ugcRatio === "9:16" ? "9/16" : ugcRatio === "1:1" ? "1/1" : "16/9", objectFit: "cover" }} />
                {ugcScript && (
                  <div style={{ flex: 1, minWidth: 0, maxWidth: 440, background: S.bg2, border: `1px solid ${S.border}`, borderRadius: 14, padding: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: S.ink3 }}>SCRIPT</div>
                      <button onClick={() => { navigator.clipboard.writeText(ugcScript); setUgcScriptCopied(true); setTimeout(() => setUgcScriptCopied(false), 2000); }} style={{ display: "flex", alignItems: "center", gap: 4, background: S.bg3, border: `1px solid ${S.border}`, borderRadius: 7, padding: "4px 8px", fontSize: 11, color: ugcScriptCopied ? "#4ade80" : S.ink2, cursor: "pointer" }}>
                        {ugcScriptCopied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                      </button>
                    </div>
                    {ugcHookLine && <div style={{ fontSize: 13, fontWeight: 700, color: S.ink, marginBottom: 8, lineHeight: 1.4, borderLeft: `3px solid ${S.accent}`, paddingLeft: 10 }}>{ugcHookLine}</div>}
                    <div style={{ fontSize: 12, color: S.ink2, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{ugcScript}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Free users: full UGC lock screen ── */}
          {!ugcLoading && !ugcVideoUrl && !isAdmin && ugcPlan === "free" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px 48px", textAlign: "center" }}>
              {/* Lock icon */}
              <div style={{ width: 56, height: 56, borderRadius: 18, background: "rgba(255,60,172,0.1)", border: "1px solid rgba(255,60,172,0.22)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                <Lock className="w-7 h-7" style={{ color: "#FF3CAC" }} />
              </div>
              <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.04em", color: S.ink, marginBottom: 8 }}>UGC Video Ads</h2>
              <p style={{ fontSize: 13, color: S.ink2, maxWidth: 360, lineHeight: 1.65, marginBottom: 32 }}>
                Turn your product into scroll-stopping lip-synced UGC ads. Available on Starter and Pro.
              </p>
              {/* Single upgrade button — opens the Starter/Pro paywall modal */}
              <button
                onClick={() => onPaywall?.("ugc")}
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, background: "linear-gradient(135deg,#FF3CAC,#FF6B35)", border: "none", borderRadius: 12, color: "#fff", fontFamily: "inherit", fontSize: 14, fontWeight: 800, padding: "14px 32px", cursor: "pointer", boxShadow: "0 6px 22px rgba(255,60,172,0.32)", marginBottom: 16 }}
              >
                Upgrade to unlock <ArrowRight className="w-4 h-4" />
              </button>
              <p style={{ fontSize: 11, color: S.ink3 }}>Starter &amp; Pro · Cancel anytime · Instant access</p>
            </div>
          )}

          {/* ── Empty state — Higgsfield centered (paid users only) ── */}
          {!ugcLoading && !ugcVideoUrl && (isAdmin || ugcPlan !== "free") && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 0 48px", textAlign: "center" }}>

              {/* Hero */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255,60,172,0.08)", border: "1px solid rgba(255,60,172,0.2)", color: S.accent, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 10px", borderRadius: 100, marginBottom: 14 }}>
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: S.accent, display: "inline-block" }} /> AI Video Studio
                </div>
                <h1 style={{ fontSize: 40, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.05, color: S.ink, marginBottom: 10 }}>
                  <span style={{ background: S.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>UGC videos</span> in 60 seconds.
                </h1>
                <p style={{ fontSize: 13, color: S.ink2, lineHeight: 1.6, maxWidth: 400, margin: "0 auto" }}>
                  Pick an avatar, describe your product — generate a lip-synced UGC ad.
                </p>
              </div>

              {/* Monthly usage pill for paid plans */}
              {!isAdmin && (
                <div style={{ marginBottom: 16, display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 100, padding: "5px 14px" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: ugcUsage >= (UGC_LIMIT[ugcPlan] ?? 0) ? "#F87171" : "#4ade80", display: "inline-block", flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: S.ink2, fontWeight: 500 }}>
                    {ugcUsage} / {UGC_LIMIT[ugcPlan] ?? 0} UGC videos used this month
                  </span>
                </div>
              )}

              {/* Avatar selector */}
              <div style={{ width: "100%", maxWidth: 660, display: "flex", alignItems: "center", gap: 12, marginBottom: 10, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "10px 16px" }}>
                {avatarDisplayPhoto ? (
                  <div style={{ width: 42, height: 42, borderRadius: "50%", overflow: "hidden", border: `2px solid ${S.accent}`, flexShrink: 0, boxShadow: "0 0 10px rgba(255,60,172,0.3)" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={avatarDisplayPhoto} alt={avatarDisplayName} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  </div>
                ) : (
                  <div style={{ width: 42, height: 42, borderRadius: "50%", background: S.bg3, border: `2px dashed ${S.border2}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: S.ink3 }}><User className="w-5 h-5" /></div>
                )}
                <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: S.ink }}>{avatarDisplayName}</div>
                  <div style={{ fontSize: 11, color: S.ink3 }}>{ugcAvatarCustomFile ? "Custom avatar" : (selectedAvatarPreset?.style ?? "No avatar selected")}</div>
                </div>
                <button onClick={() => { setUgcAvatarModalSel(ugcAvatar); setUgcAvatarModalCustom(ugcAvatarCustomFile); setUgcAvatarModalOpen(true); }} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.06)", border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, color: S.ink2, cursor: "pointer", flexShrink: 0, fontFamily: "inherit", whiteSpace: "nowrap" }}>
                  <User className="w-3.5 h-3.5" style={{ flexShrink: 0 }} /> {avatarDisplayPhoto ? "Change Avatar" : "Select Avatar"}
                </button>
              </div>

              {/* Main input card */}
              <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 660, background: "rgba(255,255,255,0.028)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 20, overflow: "visible", boxShadow: "0 12px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)" }}>

                {/* Options row */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "11px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexWrap: "wrap" }}>

                  {/* ── Product chip ── */}
                  {(confirmedProductTitle || ugcImage) ? (
                    /* Product is set — compact chip */
                    <div style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(255,60,172,0.08)", border: `1px solid ${S.accent}`, borderRadius: 8, padding: "4px 10px 4px 6px", maxWidth: 180 }}>
                      {ugcImage ? (
                        <div style={{ width: 24, height: 24, borderRadius: 5, overflow: "hidden", flexShrink: 0 }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={ugcImage.previewUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                      ) : (
                        <Link2 className="w-3.5 h-3.5" style={{ flexShrink: 0, color: S.accent }} />
                      )}
                      <span style={{ fontSize: 11, fontWeight: 600, color: S.accent, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                        {confirmedProductTitle || "Product"}
                      </span>
                      <button onClick={clearConfirmedProduct} style={{ background: "none", border: "none", color: S.accent, cursor: "pointer", fontSize: 12, padding: 0, lineHeight: 1, flexShrink: 0 }}>×</button>
                    </div>
                  ) : (
                    /* No product yet — dashed add button */
                    <button
                      onClick={() => { setFetchedInfo(null); setProductUrlDraft(""); setFetchInfoErr(null); setProductModalOpen(true); }}
                      style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.03)", border: "1.5px dashed rgba(255,255,255,0.15)", borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 500, color: S.ink3, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit", transition: "all 0.15s" }}
                    >
                      + Add Product
                    </button>
                  )}

                  <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.07)", flexShrink: 0 }} />

                  {/* ── Format (Higgsfield-style card dropdown) ── */}
                  <div onClick={(e) => { e.stopPropagation(); toggleDD("ugc-fmt-dd"); }} style={{ display: "flex", alignItems: "center", gap: 6, background: openDD === "ugc-fmt-dd" ? "rgba(255,60,172,0.08)" : "rgba(255,255,255,0.04)", border: `1px solid ${openDD === "ugc-fmt-dd" ? S.accent : "rgba(255,255,255,0.08)"}`, borderRadius: 8, padding: "5px 11px", fontSize: 12, fontWeight: 600, color: openDD === "ugc-fmt-dd" ? S.accent : S.ink, cursor: "pointer", position: "relative", userSelect: "none" }}>
                    {ugcRatio === "9:16" ? <Smartphone className="w-3.5 h-3.5" style={{ flexShrink: 0 }} /> : <Monitor className="w-3.5 h-3.5" style={{ flexShrink: 0 }} />}
                    <span>{ugcRatio === "9:16" ? "Mobile" : "Desktop"}</span>
                    <span style={{ opacity: 0.4, fontSize: 10 }}>▾</span>
                    {openDD === "ugc-fmt-dd" && (
                      <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, background: "#111120", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 16, padding: 8, width: 340, boxShadow: "0 20px 60px rgba(0,0,0,0.8)", zIndex: 400 }}>
                        {([
                          { ratio: "16:9" as const, label: "Desktop", Icon: Monitor,    desc: "UGC ad for your website or desktop app", preview: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=200&h=110&fit=crop&auto=format&q=75",  tw: 90, th: 58 },
                          { ratio: "9:16" as const, label: "Mobile",  Icon: Smartphone, desc: "Vertical UGC for TikTok, Reels & Stories", preview: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200&h=355&fit=crop&auto=format&q=75", tw: 46, th: 76 },
                        ] as const).map(({ ratio, label, Icon, desc, preview, tw, th }) => {
                          const active = ugcRatio === ratio;
                          return (
                            <div
                              key={ratio}
                              onClick={() => { setUgcRatio(ratio); setOpenDD(null); }}
                              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "10px 12px", borderRadius: 12, cursor: "pointer", background: active ? "rgba(255,255,255,0.07)" : "none", marginBottom: 4, transition: "background 0.12s" }}
                            >
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                                  <Icon className="w-4 h-4" style={{ color: active ? "#FF3CAC" : "#9090AC", flexShrink: 0 }} />
                                  <span style={{ fontSize: 14, fontWeight: 700, color: "#EEEEF5" }}>{label}</span>
                                </div>
                                <div style={{ fontSize: 11, color: "#52526A", lineHeight: 1.4 }}>{desc}</div>
                              </div>
                              <div style={{ width: tw, height: th, borderRadius: 9, overflow: "hidden", flexShrink: 0, background: "#1E1E30", border: active ? "1.5px solid #FF3CAC" : "1.5px solid rgba(255,255,255,0.06)", boxSizing: "border-box" }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={preview} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Duration */}
                  <div onClick={(e) => { e.stopPropagation(); toggleDD("dur-dd-c"); }} style={{ display: "flex", alignItems: "center", gap: 5, background: openDD === "dur-dd-c" ? "rgba(255,60,172,0.08)" : "rgba(255,255,255,0.04)", border: `1px solid ${openDD === "dur-dd-c" ? S.accent : "rgba(255,255,255,0.08)"}`, borderRadius: 8, padding: "5px 11px", fontSize: 12, fontWeight: 500, color: S.ink2, cursor: "pointer", position: "relative", userSelect: "none" }}>
                    <span style={{ color: S.ink, fontWeight: 600 }}>{ugcDuration}s</span> <span style={{ opacity: 0.4, fontSize: 10, marginLeft: 2 }}>▾</span>
                    {openDD === "dur-dd-c" && (
                      <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, background: S.bg2, border: `1px solid ${S.border2}`, borderRadius: 10, padding: 4, minWidth: 90, boxShadow: "0 8px 32px rgba(0,0,0,0.6)", zIndex: 300 }}>
                        {[5,10,15].map(d => (
                          <div key={d} onClick={(e) => { e.stopPropagation(); setUgcDuration(d as 5|10|15); setOpenDD(null); }} style={{ padding: "7px 10px", borderRadius: 7, fontSize: 12, color: ugcDuration === d ? S.accent : S.ink2, cursor: "pointer", display: "flex", justifyContent: "space-between" }}>
                            {d}s {ugcDuration === d && <span style={{ fontSize: 10 }}>✓</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Lang */}
                  <div onClick={(e) => { e.stopPropagation(); toggleDD("lang-dd-ugc"); }} style={{ display: "flex", alignItems: "center", gap: 5, background: openDD === "lang-dd-ugc" ? "rgba(255,60,172,0.08)" : "rgba(255,255,255,0.04)", border: `1px solid ${openDD === "lang-dd-ugc" ? S.accent : "rgba(255,255,255,0.08)"}`, borderRadius: 8, padding: "5px 11px", fontSize: 12, fontWeight: 500, color: openDD === "lang-dd-ugc" ? S.accent : S.ink2, cursor: "pointer", position: "relative", userSelect: "none" }}>
                    <Globe className="w-3.5 h-3.5" style={{ flexShrink: 0 }} /> <span style={{ color: S.ink, fontWeight: 600, marginLeft: 2 }}>{activeLang}</span> <ChevronDown className="w-3 h-3" style={{ opacity: 0.4, marginLeft: 1 }} />
                    {openDD === "lang-dd-ugc" && (
                      <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, background: S.bg2, border: `1px solid ${S.border2}`, borderRadius: 10, padding: 4, minWidth: 130, boxShadow: "0 8px 32px rgba(0,0,0,0.6)", zIndex: 300 }}>
                        {[["English","English"],["French","French"],["Arabic","Arabic"],["Darija","Darija"]].map(([label,val]) => (
                          <div key={val} onClick={(e) => { e.stopPropagation(); setActiveLang(val); setOpenDD(null); }} style={{ padding: "7px 10px", borderRadius: 7, fontSize: 12, color: activeLang === val ? S.accent : S.ink2, cursor: "pointer", display: "flex", justifyContent: "space-between" }}>
                            {label} {activeLang === val && <Check className="w-3 h-3" />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quality / Resolution */}
                  <div style={{ display: "flex", alignItems: "center", gap: 3, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "4px 6px", flexShrink: 0 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: S.ink3, padding: "0 4px" }}>Quality</span>
                    {(["480p", "720p", "1080p"] as const).map(r => (
                      <button
                        key={r}
                        onClick={() => setUgcResolution(r)}
                        title={r === "480p" ? "Fast & lightweight" : r === "720p" ? "Recommended" : "Maximum quality (slower)"}
                        style={{ background: ugcResolution === r ? S.grad : "transparent", border: "none", borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: ugcResolution === r ? 700 : 500, color: ugcResolution === r ? "#fff" : S.ink3, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s", whiteSpace: "nowrap" }}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Textarea + Generate row */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px 16px" }}>
                  <textarea
                    value={barValue}
                    onChange={(e) => setBarValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
                    placeholder={confirmedProductTitle ? `Describe the ad for "${confirmedProductTitle}"…` : "Add a product above, then describe your ad…"}
                    style={{ flex: 1, background: "transparent", border: "none", color: S.ink, fontSize: 14, outline: "none", resize: "none", lineHeight: 1.5, height: 46, fontFamily: "inherit", padding: 0 }}
                  />
                  <button
                    onClick={handleGenerate}
                    disabled={ugcLoading || (!barValue.trim() && !(ugcInputMode === "url" && ugcProductUrl.trim()))}
                    style={{ display: "flex", alignItems: "center", gap: 7, background: ugcLoading ? S.bg4 : S.grad, border: "none", borderRadius: 12, color: "#fff", fontFamily: "inherit", fontSize: 13, fontWeight: 700, padding: "0 22px", height: 46, cursor: ugcLoading ? "not-allowed" : "pointer", boxShadow: ugcLoading ? "none" : "0 4px 20px rgba(255,60,172,0.4)", opacity: ugcLoading ? 0.7 : 1, whiteSpace: "nowrap", flexShrink: 0, transition: "opacity 0.15s" }}
                  >
                    {ugcLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" style={{ flexShrink: 0 }} /> Generating…</> : <><Sparkles className="w-3.5 h-3.5" style={{ flexShrink: 0 }} /> Generate Video</>}
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ════ LIBRARY TAB ════ */}
      {activeTab === "library" && (
        <motion.div key="library" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          <div style={{ paddingTop: 28, paddingBottom: 40 }}>

            {/* ── Library header ── */}
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.03em", color: S.ink, marginBottom: 4 }}>My Ads</h2>
                <div style={{ fontSize: 12, color: S.ink3 }}>
                  {_sessions.length === 0 ? "No saved creatives yet" : `${videoSessions.length} video${videoSessions.length !== 1 ? "s" : ""} · ${imageSessions.length} image${imageSessions.length !== 1 ? "s" : ""} · ${copySessions.length} copy`}
                </div>
              </div>
              {/* Filter pills */}
              <div style={{ display: "flex", gap: 4 }}>
                {([["all","All"], ["videos","Videos 🎬"], ["images","Images"], ["copy","Copy"]] as const).map(([key, label]) => {
                  const count = key === "all" ? _sessions.length : key === "videos" ? videoSessions.length : key === "images" ? imageSessions.length : copySessions.length;
                  const active = libFilter === key;
                  return (
                    <button key={key} onClick={() => setLibFilter(key)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500, border: `1px solid ${active ? S.accent : S.border}`, background: active ? "rgba(255,60,172,0.1)" : S.bg3, color: active ? S.accent : S.ink2, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
                      {label}
                      {count > 0 && <span style={{ background: active ? S.accent : "rgba(255,255,255,0.1)", color: active ? "#fff" : S.ink3, fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 100 }}>{count}</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Video Ads grid ── */}
            {(libFilter === "all" || libFilter === "videos") && videoSessions.length > 0 && (
              <div style={{ marginBottom: 36 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: S.ink3 }}>VIDEO ADS</div>
                  <div style={{ flex: 1, height: 1, background: S.border }} />
                  <div style={{ fontSize: 10, color: S.ink3 }}>{videoSessions.length} video{videoSessions.length !== 1 ? "s" : ""}</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
                  {videoSessions.map((sess) => {
                    const isHov = libHoveredId === `vid-${sess.id}`;
                    const hook  = sess.copy_variants?.[0]?.headline ?? "";
                    const script = sess.copy_variants?.[0]?.primaryText ?? "";
                    return (
                      <div
                        key={sess.id}
                        onMouseEnter={() => setLibHoveredId(`vid-${sess.id}`)}
                        onMouseLeave={() => setLibHoveredId(null)}
                        style={{ background: S.bg2, border: `1px solid ${isHov ? "rgba(255,60,172,0.35)" : S.border}`, borderRadius: 16, overflow: "hidden", transition: "border-color 0.2s, transform 0.2s, box-shadow 0.2s", transform: isHov ? "translateY(-2px)" : "none", boxShadow: isHov ? "0 12px 40px rgba(0,0,0,0.4)" : "none" }}
                      >
                        {/* Video player */}
                        <div style={{ position: "relative", background: "#000", aspectRatio: "9/16", maxHeight: 280, overflow: "hidden" }}>
                          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                          <video
                            src={sess.video_url}
                            controls
                            playsInline
                            preload="metadata"
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          />
                          {/* Download button */}
                          <a
                            href={sess.video_url}
                            download
                            onClick={(e) => { e.stopPropagation(); downloadVideo(sess.video_url!, `adur-ugc-${sess.id ?? "video"}.mp4`, e); }}
                            title="Download video"
                            style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: 8, background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#fff", textDecoration: "none", backdropFilter: "blur(4px)", cursor: "pointer" }}
                          >⬇</a>
                          {/* UGC badge */}
                          <span style={{ position: "absolute", top: 8, left: 8, fontSize: 9, fontWeight: 700, background: "linear-gradient(135deg,#ff3cac,#784ba0)", color: "#fff", padding: "3px 7px", borderRadius: 6 }}>UGC</span>
                        </div>

                        {/* Info */}
                        <div style={{ padding: "12px 14px 14px" }}>
                          {hook && (
                            <div style={{ fontSize: 11, fontWeight: 700, color: S.ink, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {hook}
                            </div>
                          )}
                          {script && (
                            <div style={{ fontSize: 10, color: S.ink3, lineHeight: 1.4, marginBottom: 8, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                              {script}
                            </div>
                          )}
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 10, color: S.ink3 }}>{timeAgo(sess.created_at)}</span>
                            <span style={{ fontSize: 10, background: "rgba(255,255,255,0.06)", border: `1px solid ${S.border}`, color: S.ink3, padding: "2px 7px", borderRadius: 100 }}>
                              {sess.prompt ? sess.prompt.slice(0, 24) + (sess.prompt.length > 24 ? "…" : "") : "Video Ad"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Image Ads grid ── */}
            {(libFilter === "all" || libFilter === "images") && imageSessions.length > 0 && (
              <div style={{ marginBottom: 36 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: S.ink3 }}>IMAGE ADS</div>
                  <div style={{ flex: 1, height: 1, background: S.border }} />
                  <div style={{ fontSize: 10, color: S.ink3 }}>{imageSessions.length} batch{imageSessions.length !== 1 ? "es" : ""}</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
                  {imageSessions.map((sess) => {
                    const isHov = libHoveredId === sess.id;
                    const isExp = expandedHistoryIds.has(sess.id);
                    return (
                      <div
                        key={sess.id}
                        onMouseEnter={() => setLibHoveredId(sess.id)}
                        onMouseLeave={() => setLibHoveredId(null)}
                        style={{ background: S.bg2, border: `1px solid ${isHov ? "rgba(255,60,172,0.35)" : S.border}`, borderRadius: 16, overflow: "hidden", cursor: "pointer", transition: "border-color 0.2s, transform 0.2s, box-shadow 0.2s", transform: isHov ? "translateY(-2px)" : "none", boxShadow: isHov ? "0 12px 40px rgba(0,0,0,0.4)" : "none" }}
                        onClick={() => toggleHistory(sess.id)}
                      >
                        {/* 2×2 thumbnail mosaic */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: S.bg3 }}>
                          {sess.image_urls.slice(0, 4).map((img, i) => (
                            <div key={i} style={{ aspectRatio: "1", overflow: "hidden", background: S.bg3, position: "relative" }}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={img.url} alt={img.angle ?? `Ad ${i+1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                            </div>
                          ))}
                          {/* Fill empty slots */}
                          {Array.from({ length: Math.max(0, 4 - sess.image_urls.length) }).map((_, i) => (
                            <div key={`empty-${i}`} style={{ aspectRatio: "1", background: S.bg3 }} />
                          ))}
                        </div>

                        {/* Info */}
                        <div style={{ padding: "12px 14px 14px" }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: S.ink, marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.3 }}>
                            {sess.prompt || "Image Ad"}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 11, color: S.ink3 }}>{timeAgo(sess.created_at)}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 10, background: "rgba(255,255,255,0.06)", border: `1px solid ${S.border}`, color: S.ink3, padding: "2px 7px", borderRadius: 100 }}>
                                {sess.image_urls.length} images
                              </span>
                              <span style={{ fontSize: 10, color: S.ink3, opacity: 0.5 }}>{isExp ? "▲" : "▼"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Expanded full grid */}
                        {isExp && (
                          <div style={{ padding: "0 12px 14px", borderTop: `1px solid ${S.border}` }}>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 6, paddingTop: 12 }}>
                              {sess.image_urls.map((img, i) => (
                                <div key={i} style={{ borderRadius: 8, overflow: "hidden", position: "relative", aspectRatio: "0.56", background: S.bg3 }}>
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={img.url} alt={img.angle ?? `Ad ${i+1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                                  {img.angle && <span style={{ position: "absolute", top: 5, left: 5, background: "rgba(0,0,0,0.65)", color: "#fff", fontSize: 7, fontWeight: 700, padding: "2px 5px", borderRadius: 4 }}>{img.angle}</span>}
                                  <a href={img.url} download target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ position: "absolute", bottom: 5, right: 5, width: 22, height: 22, borderRadius: 6, background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", textDecoration: "none" }}>⬇</a>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Copy sessions ── */}
            {(libFilter === "all" || libFilter === "copy") && copySessions.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: S.ink3 }}>AD COPY</div>
                  <div style={{ flex: 1, height: 1, background: S.border }} />
                  <div style={{ fontSize: 10, color: S.ink3 }}>{copySessions.length} session{copySessions.length !== 1 ? "s" : ""}</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
                  {copySessions.map((sess) => {
                    const lead = sess.copy_variants?.[0];
                    const isHov = libHoveredId === `copy-${sess.id}`;
                    const isExp = expandedHistoryIds.has(sess.id);
                    return (
                      <div
                        key={sess.id}
                        onMouseEnter={() => setLibHoveredId(`copy-${sess.id}`)}
                        onMouseLeave={() => setLibHoveredId(null)}
                        style={{ background: S.bg2, border: `1px solid ${isHov ? "rgba(255,60,172,0.35)" : S.border}`, borderRadius: 16, padding: 18, cursor: "pointer", transition: "border-color 0.2s, transform 0.2s, box-shadow 0.2s", transform: isHov ? "translateY(-2px)" : "none", boxShadow: isHov ? "0 12px 40px rgba(0,0,0,0.4)" : "none" }}
                        onClick={() => toggleHistory(sess.id)}
                      >
                        {/* Big quote mark */}
                        <div style={{ fontSize: 40, lineHeight: 1, color: S.accent, opacity: 0.25, fontFamily: "Georgia,serif", marginBottom: 4, userSelect: "none" }}>&quot;</div>

                        {/* Lead headline */}
                        {lead && (
                          <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.3, color: S.ink, marginBottom: 8 }}>
                            {lead.headline}
                          </div>
                        )}

                        {/* Primary text preview */}
                        {lead && (
                          <div style={{ fontSize: 12, color: S.ink2, lineHeight: 1.65, marginBottom: 14, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
                            {lead.primaryText}
                          </div>
                        )}

                        {/* Footer row */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            {lead?.cta && (
                              <span style={{ display: "inline-flex", background: S.grad, color: "#fff", fontSize: 9, fontWeight: 700, padding: "3px 10px", borderRadius: 100 }}>{lead.cta}</span>
                            )}
                            <span style={{ fontSize: 10, background: "rgba(255,255,255,0.06)", border: `1px solid ${S.border}`, color: S.ink3, padding: "2px 7px", borderRadius: 100 }}>
                              {sess.copy_variants?.length ?? 0} variants
                            </span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 11, color: S.ink3 }}>{timeAgo(sess.created_at)}</span>
                            <span style={{ fontSize: 10, color: S.ink3, opacity: 0.5 }}>{isExp ? "▲" : "▼"}</span>
                          </div>
                        </div>

                        {/* Expanded all variants */}
                        {isExp && sess.copy_variants && (
                          <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${S.border}`, display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8 }}>
                            {sess.copy_variants.map((v, i) => (
                              <div key={i} style={{ background: S.bg3, border: `1px solid ${S.border}`, borderRadius: 10, padding: 12 }}>
                                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: S.ink3, marginBottom: 5 }}>Variant {String.fromCharCode(65+i)} · {v.hookType}</div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: S.ink, marginBottom: 5, lineHeight: 1.3 }}>{v.headline}</div>
                                <div style={{ fontSize: 11, color: S.ink2, lineHeight: 1.5, marginBottom: 8 }}>{v.primaryText}</div>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                  <span style={{ display: "inline-flex", background: S.grad, color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 100 }}>{v.cta}</span>
                                  <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(`${v.headline}\n\n${v.primaryText}\n\n${v.cta}`); }} style={{ background: S.bg4, border: `1px solid ${S.border}`, borderRadius: 6, padding: "3px 8px", fontSize: 10, color: S.ink2, cursor: "pointer" }}>Copy</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Empty state ── */}
            {_sessions.length === 0 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", textAlign: "center" }}>
                {/* Animated gradient orb */}
                <div style={{ width: 80, height: 80, borderRadius: "50%", background: S.grad, opacity: 0.15, marginBottom: 24, filter: "blur(16px)" }} />
                <div style={{ fontSize: 48, marginBottom: 16, marginTop: -60 }}>✨</div>
                <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 8, color: S.ink }}>Your creative library is empty</div>
                <div style={{ fontSize: 13, maxWidth: 300, margin: "0 auto 24px", lineHeight: 1.7, color: S.ink2 }}>
                  Generate image ads, copy variants, or UGC videos — they&apos;ll all appear here automatically.
                </div>
                <button onClick={() => setActiveTab("creative")} style={{ display: "flex", alignItems: "center", gap: 7, background: S.grad, border: "none", borderRadius: 12, color: "#fff", fontFamily: "inherit", fontSize: 13, fontWeight: 700, padding: "10px 24px", cursor: "pointer", boxShadow: "0 4px 20px rgba(255,60,172,0.4)" }}>
                  <Sparkles className="w-3.5 h-3.5" /> Create your first ad
                </button>
              </div>
            )}

            {/* ── No results for filter ── */}
            {_sessions.length > 0 && (
              (libFilter === "videos"  && videoSessions.length  === 0) ||
              (libFilter === "images"  && imageSessions.length  === 0) ||
              (libFilter === "copy"    && copySessions.length   === 0)
            ) && (
              <div style={{ textAlign: "center", padding: "60px 0", color: S.ink2 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>
                  {libFilter === "videos" ? "🎬" : libFilter === "images" ? "🖼" : "✍️"}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: S.ink, marginBottom: 6 }}>
                  No {libFilter === "videos" ? "video ads" : libFilter === "images" ? "image ads" : "copy"} saved yet
                </div>
                <button
                  onClick={() => setActiveTab(libFilter === "copy" ? "adcopy" : "ugc")}
                  style={{ marginTop: 12, background: "none", border: `1px solid ${S.border}`, borderRadius: 8, padding: "6px 16px", fontSize: 12, color: S.ink2, cursor: "pointer", fontFamily: "inherit" }}
                >
                  Generate {libFilter === "videos" ? "video ads" : libFilter === "images" ? "image ads" : "copy"} →
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}

      </div>{/* end scrollable canvas */}

      {/* ════ PROMPT BAR (flex-shrink:0, bottom of column) ════ */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          flexShrink: 0,
          background: "rgba(15,15,24,0.97)", backdropFilter: "blur(24px)",
          borderTop: `1px solid ${S.border}`,
          padding: "12px 24px 16px",
          display: (
            (activeTab === "creative" && (loading     || images.length === 0)) ||
            (activeTab === "adcopy"   && (copyLoading  || copyVariants.length === 0)) ||
            (activeTab === "ugc"      && (ugcLoading   || !ugcVideoUrl))
          ) ? "none" : "flex",
          flexDirection: "column", gap: 10,
        }}
      >
        {/* Options row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>

          {/* Add Image (image tab) */}
          {activeTab === "creative" && (
            <>
              <button onClick={() => imageInputRef.current?.click()} style={{ display: "flex", alignItems: "center", gap: 6, background: refImage ? "rgba(255,60,172,0.08)" : S.bg3, border: `1px solid ${refImage ? S.accent : S.border}`, borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 500, color: refImage ? S.accent : S.ink2, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, fontFamily: "inherit" }}>
                <Camera className="w-3.5 h-3.5" style={{ flexShrink: 0 }} /> {refImage ? "Image added ✓" : "Add Image"}
              </button>
              <div style={{ width: 1, height: 20, background: S.border, flexShrink: 0 }} />
            </>
          )}

          {/* Add Product (video tab image mode) */}
          {activeTab === "ugc" && ugcInputMode === "image" && (
            <>
              <button onClick={() => ugcImageRef.current?.click()} style={{ display: "flex", alignItems: "center", gap: 6, background: ugcImage ? "rgba(255,60,172,0.08)" : S.bg3, border: `1px solid ${ugcImage ? S.accent : S.border}`, borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 500, color: ugcImage ? S.accent : S.ink2, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, fontFamily: "inherit" }}>
                <Camera className="w-3.5 h-3.5" style={{ flexShrink: 0 }} /> {ugcImage ? "Product added ✓" : "Add Product"}
              </button>
              <div style={{ width: 1, height: 20, background: S.border, flexShrink: 0 }} />
            </>
          )}

          {/* Format (video only in bottom bar) */}
          {activeTab === "ugc" && (
            <div onClick={(e) => { e.stopPropagation(); toggleDD("fmt-dd"); }} style={{ display: "flex", alignItems: "center", gap: 6, background: openDD === "fmt-dd" ? "rgba(255,60,172,0.08)" : S.bg3, border: `1px solid ${openDD === "fmt-dd" ? S.accent : S.border}`, borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, color: openDD === "fmt-dd" ? S.accent : S.ink, cursor: "pointer", position: "relative", userSelect: "none" }}>
              {ugcRatio === "9:16" ? <Smartphone className="w-3.5 h-3.5" style={{ flexShrink: 0 }} /> : <Monitor className="w-3.5 h-3.5" style={{ flexShrink: 0 }} />}
              <span>{imageFormatLabel}</span> <span style={{ opacity: 0.5, fontSize: 10 }}>▾</span>
              {openDD === "fmt-dd" && (
                <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", bottom: "calc(100% + 8px)", left: 0, background: "#111120", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 16, padding: 8, width: 340, boxShadow: "0 20px 60px rgba(0,0,0,0.8)", zIndex: 400 }}>
                  {([
                    { val: "16:9" as const, label: "Desktop", Icon: Monitor,    desc: "UGC ad for your website or desktop app",    preview: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=200&h=110&fit=crop&auto=format&q=75",  tw: 90, th: 58 },
                    { val: "9:16" as const, label: "Mobile",  Icon: Smartphone, desc: "Vertical UGC for TikTok, Reels & Stories", preview: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200&h=355&fit=crop&auto=format&q=75", tw: 46, th: 76 },
                  ] as const).map(({ val, label, Icon, desc, preview, tw, th }) => {
                    const active = ugcRatio === val;
                    return (
                    <div key={val} onClick={(e) => { e.stopPropagation(); setUgcRatio(val); setOpenDD(null); }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "10px 12px", borderRadius: 12, cursor: "pointer", background: active ? "rgba(255,255,255,0.07)" : "none", marginBottom: 4, transition: "background 0.12s" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                          <Icon className="w-4 h-4" style={{ color: active ? "#FF3CAC" : "#9090AC", flexShrink: 0 }} />
                          <span style={{ fontSize: 14, fontWeight: 700, color: "#EEEEF5" }}>{label}</span>
                        </div>
                        <div style={{ fontSize: 11, color: "#52526A", lineHeight: 1.4 }}>{desc}</div>
                      </div>
                      <div style={{ width: tw, height: th, borderRadius: 9, overflow: "hidden", flexShrink: 0, background: "#1E1E30", border: active ? "1.5px solid #FF3CAC" : "1.5px solid rgba(255,255,255,0.06)", boxSizing: "border-box" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={preview} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Language (all except library) */}
          {activeTab !== "library" && (
            <div onClick={(e) => { e.stopPropagation(); toggleDD("lang-dd"); }} style={{ display: "flex", alignItems: "center", gap: 5, background: openDD === "lang-dd" ? "rgba(255,60,172,0.08)" : S.bg3, border: `1px solid ${openDD === "lang-dd" ? S.accent : S.border}`, borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 500, color: openDD === "lang-dd" ? S.accent : S.ink2, cursor: "pointer", position: "relative", userSelect: "none" }}>
              <Globe className="w-3.5 h-3.5" style={{ flexShrink: 0 }} /> <span style={{ color: S.ink, fontWeight: 600, marginLeft: 3 }}>{activeLang}</span> <ChevronDown className="w-3 h-3" style={{ opacity: 0.5, marginLeft: 2 }} />
              {openDD === "lang-dd" && (
                <div style={{ position: "absolute", bottom: "calc(100% + 6px)", left: 0, background: S.bg2, border: `1px solid ${S.border2}`, borderRadius: 10, padding: 4, minWidth: 130, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", zIndex: 200 }}>
                  {[["English","English"],["French","French"],["Arabic","Arabic"],["Darija","Darija"]].map(([label,val]) => (
                    <div key={val} onClick={(e) => { e.stopPropagation(); setActiveLang(val); setOpenDD(null); }} style={{ padding: "7px 10px", borderRadius: 7, fontSize: 12, color: activeLang === val ? S.accent : S.ink2, cursor: "pointer", display: "flex", justifyContent: "space-between" }}>
                      {label} {activeLang === val && <Check className="w-3 h-3" />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}


          {/* Duration (video only) */}
          {activeTab === "ugc" && (
            <div onClick={(e) => { e.stopPropagation(); toggleDD("dur-dd"); }} style={{ display: "flex", alignItems: "center", gap: 5, background: openDD === "dur-dd" ? "rgba(255,60,172,0.08)" : S.bg3, border: `1px solid ${openDD === "dur-dd" ? S.accent : S.border}`, borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 500, color: openDD === "dur-dd" ? S.accent : S.ink2, cursor: "pointer", position: "relative", userSelect: "none" }}>
              Duration: <span style={{ color: S.ink, fontWeight: 600, marginLeft: 3 }}>{ugcDuration}s</span> <span style={{ opacity: 0.5, fontSize: 10 }}>▾</span>
              {openDD === "dur-dd" && (
                <div style={{ position: "absolute", bottom: "calc(100% + 6px)", left: 0, background: S.bg2, border: `1px solid ${S.border2}`, borderRadius: 10, padding: 4, minWidth: 100, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", zIndex: 200 }}>
                  {[5,10,15].map(d => (
                    <div key={d} onClick={(e) => { e.stopPropagation(); setUgcDuration(d as 5|10|15); setOpenDD(null); }} style={{ padding: "7px 10px", borderRadius: 7, fontSize: 12, color: ugcDuration === d ? S.accent : S.ink2, cursor: "pointer", display: "flex", justifyContent: "space-between" }}>
                      {d}s {ugcDuration === d && <span style={{ fontSize: 10 }}>✓</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Input row */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>

          {/* Image preview */}
          {activeTab === "creative" && refImage && (
            <div style={{ width: 40, height: 40, borderRadius: 8, overflow: "hidden", border: `1px solid ${S.border2}`, flexShrink: 0, position: "relative" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={refImage.previewUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <button onClick={clearImage} style={{ position: "absolute", top: 1, right: 1, width: 14, height: 14, borderRadius: "50%", background: "rgba(0,0,0,0.7)", border: "none", color: "#fff", fontSize: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>×</button>
            </div>
          )}
          {activeTab === "ugc" && ugcImage && (
            <div style={{ width: 40, height: 40, borderRadius: 8, overflow: "hidden", border: `1px solid ${S.border2}`, flexShrink: 0, position: "relative" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ugcImage.previewUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <button onClick={clearUgcImage} style={{ position: "absolute", top: 1, right: 1, width: 14, height: 14, borderRadius: "50%", background: "rgba(0,0,0,0.7)", border: "none", color: "#fff", fontSize: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>×</button>
            </div>
          )}

          {/* Hide the input textarea for free users on the UGC tab — the lock screen is the CTA */}
          {!(activeTab === "ugc" && !isAdmin && ugcPlan === "free") && (
            <textarea
              value={barValue}
              onChange={(e) => setBarValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
              placeholder={
                activeTab === "creative" ? "Describe your ad… e.g. Premium skincare serum, bold dark background." :
                activeTab === "adcopy"   ? "Describe your product… e.g. Anti-aging serum. Results in 7 days." :
                activeTab === "ugc"      ? "Describe your product… e.g. Whitening serum for women. 299 DH." :
                "Search your saved ads…"
              }
              style={{ flex: 1, background: S.bg3, border: `1px solid ${S.border}`, borderRadius: 10, padding: "10px 14px", fontFamily: "inherit", fontSize: 13, color: S.ink, outline: "none", resize: "none", lineHeight: 1.4, height: 42, transition: "border-color 0.15s" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(255,60,172,0.4)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = S.border; }}
            />
          )}

          {/* Remaining count chip — image/copy on free plan */}
          {!isPaid && !isAdmin && activeTab !== "library" && activeTab !== "ugc" && (
            <span style={{ fontSize: 10, color: S.ink3, whiteSpace: "nowrap", flexShrink: 0 }}>
              {activeTab === "creative" ? `${Math.max(0, CREATIVE_LIMIT - imageUsage)} left` :
               activeTab === "adcopy"   ? `${Math.max(0, CREATIVE_LIMIT - copyUsage)} left` : ""}
            </span>
          )}

          {/* Generate button — show Lock for free UGC users, normal otherwise */}
          {activeTab !== "library" && (
            activeTab === "ugc" && !isAdmin && ugcPlan === "free"
              ? (
                <button
                  onClick={() => onPaywall?.("ugc")}
                  style={{ display: "flex", alignItems: "center", gap: 7, background: S.bg4, border: `1px solid rgba(255,60,172,0.3)`, borderRadius: 10, color: "#FF3CAC", fontFamily: "inherit", fontSize: 13, fontWeight: 600, padding: "0 20px", height: 42, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
                >
                  <Lock className="w-3.5 h-3.5" style={{ flexShrink: 0 }} /> Unlock UGC
                </button>
              ) : (
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || (!barValue.trim() && !(activeTab === "ugc" && ugcInputMode === "url" && ugcProductUrl.trim()))}
                  style={{ display: "flex", alignItems: "center", gap: 7, background: isGenerating ? S.bg4 : S.grad, border: "none", borderRadius: 10, color: "#fff", fontFamily: "inherit", fontSize: 13, fontWeight: 600, padding: "0 20px", height: 42, cursor: isGenerating ? "not-allowed" : "pointer", boxShadow: isGenerating ? "none" : S.glow, transition: "opacity 0.15s", opacity: isGenerating ? 0.7 : 1, letterSpacing: "-0.01em", whiteSpace: "nowrap", flexShrink: 0 }}
                >
                  {isGenerating ? <><Loader2 className="w-3.5 h-3.5 animate-spin" style={{ flexShrink: 0 }} /> Generating…</> : <><Sparkles className="w-3.5 h-3.5" style={{ flexShrink: 0 }} /> {genBtnLabel}</>}
                </button>
              )
          )}
        </div>
      </div>

      {/* ════ HIDDEN FILE INPUTS ════ */}
      <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={handleImageChange} />
      <input ref={ugcImageRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleUgcImageChange} />
      <input ref={ugcAvatarFileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        const previewUrl = URL.createObjectURL(f);
        setUgcAvatarModalCustom({ file: f, previewUrl });
        e.target.value = "";
      }} />

      {/* ════ PRODUCT / APP MODAL ════ */}
      {productModalOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(6,6,14,0.88)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={() => { setProductModalOpen(false); setProductModalMode("main"); }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#14142A", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 24, width: "100%", maxWidth: 680, overflow: "hidden", boxShadow: "0 32px 100px rgba(0,0,0,0.7)" }}
          >
            {/* ── Top bar: tabs + back/close ── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "6px 14px", fontSize: 12, fontWeight: 700, color: "#EEEEF5" }}>
                <ShoppingBag className="w-3.5 h-3.5" style={{ color: "#FF3CAC" }} /> Product
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {productModalMode === "manual" && (
                  <button onClick={() => setProductModalMode("main")} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "5px 12px", cursor: "pointer", color: "#9090AC", fontSize: 12, fontFamily: "inherit" }}>← Back</button>
                )}
                <button onClick={() => { setProductModalOpen(false); setProductModalMode("main"); }} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, width: 30, height: 30, cursor: "pointer", color: "#9090AC", fontSize: 14, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
              </div>
            </div>

            {/* ══ MANUAL MODE ══ */}
            {productModalMode === "manual" ? (
              <div style={{ padding: "24px 28px 28px" }}>
                <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.03em", color: "#EEEEF5", marginBottom: 6, lineHeight: 1.1 }}>
                  Describe your product manually
                </h2>
                <p style={{ fontSize: 13, color: "#52526A", lineHeight: 1.5, marginBottom: 20 }}>
                  Fill in the details — we&apos;ll use this to write the perfect UGC script.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {/* Name field */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#52526A", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
                      Product name *
                    </label>
                    <input
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      placeholder="e.g. AquaGlow Serum"
                      style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 10, padding: "10px 14px", color: "#EEEEF5", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                      autoFocus
                    />
                  </div>

                  {/* Description field */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#52526A", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
                      Description
                    </label>
                    <textarea
                      value={manualDesc}
                      onChange={(e) => setManualDesc(e.target.value)}
                      placeholder="e.g. Anti-aging serum for women. Visible results in 7 days. 299 DH."
                      rows={3}
                      style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 10, padding: "10px 14px", color: "#EEEEF5", fontSize: 14, outline: "none", fontFamily: "inherit", resize: "none", lineHeight: 1.5, boxSizing: "border-box" }}
                    />
                  </div>

                  {/* Upload image */}
                  <div
                    onClick={() => { ugcImageRef.current?.click(); }}
                    style={{ display: "flex", alignItems: "center", gap: 10, background: ugcImage ? "rgba(255,60,172,0.06)" : "rgba(255,255,255,0.025)", border: `1.5px dashed ${ugcImage ? "#FF3CAC" : "rgba(255,255,255,0.1)"}`, borderRadius: 10, padding: "10px 14px", cursor: "pointer" }}
                  >
                    {ugcImage ? (
                      <div style={{ width: 32, height: 32, borderRadius: 6, overflow: "hidden", flexShrink: 0 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={ugcImage.previewUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                    ) : (
                      <Upload className="w-4 h-4" style={{ color: "#9090AC", flexShrink: 0 }} />
                    )}
                    <span style={{ fontSize: 13, color: ugcImage ? "#FF3CAC" : "#9090AC", fontWeight: 500 }}>
                      {ugcImage ? `Image added: ${ugcImage.file.name}` : "Upload product image (optional)"}
                    </span>
                  </div>
                </div>

                <button
                  onClick={confirmManualProduct}
                  disabled={!manualName.trim() && !manualDesc.trim()}
                  style={{ marginTop: 20, width: "100%", background: "linear-gradient(135deg,#FF3CAC 0%,#FF6B35 100%)", border: "none", borderRadius: 12, padding: "12px 0", fontSize: 14, fontWeight: 700, color: "#fff", cursor: (!manualName.trim() && !manualDesc.trim()) ? "not-allowed" : "pointer", fontFamily: "inherit", boxShadow: "0 4px 20px rgba(255,60,172,0.35)", opacity: (!manualName.trim() && !manualDesc.trim()) ? 0.45 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  <Sparkles className="w-4 h-4" /> Use this product
                </button>
              </div>

            ) : (
              /* ══ MAIN (URL) MODE ══ */
              <>
                {/* Hero section */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "24px 28px 20px" }}>
                  <div style={{ flex: 1, paddingRight: 24 }}>
                    <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.03em", color: "#EEEEF5", marginBottom: 8, lineHeight: 1.1 }}>
                      ADD YOUR PRODUCT
                    </h2>
                    <p style={{ fontSize: 13, color: "#52526A", lineHeight: 1.6, marginBottom: 20, maxWidth: 340 }}>
                      Paste your product link — we&apos;ll pull the image and details automatically. Or upload an image.
                    </p>

                    {/* URL input row */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: 200, display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 12, padding: "10px 14px" }}>
                        <Link2 className="w-4 h-4" style={{ color: "#52526A", flexShrink: 0 }} />
                        <input
                          ref={productUrlInputRef}
                          value={productUrlDraft}
                          onChange={(e) => setProductUrlDraft(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter" && productUrlDraft.trim()) fetchProductInfo(productUrlDraft.trim()); }}
                          placeholder="www.yourproduct.com"
                          style={{ flex: 1, background: "none", border: "none", color: "#EEEEF5", fontSize: 13, outline: "none", fontFamily: "inherit" }}
                        />
                        {productUrlDraft.trim() && (
                          <button
                            onClick={() => fetchProductInfo(productUrlDraft.trim())}
                            disabled={fetchingInfo}
                            style={{ background: "#FF3CAC", border: "none", borderRadius: 7, padding: "4px 12px", fontSize: 12, fontWeight: 700, color: "#fff", cursor: fetchingInfo ? "not-allowed" : "pointer", whiteSpace: "nowrap", fontFamily: "inherit", opacity: fetchingInfo ? 0.6 : 1, flexShrink: 0 }}
                          >
                            {fetchingInfo ? "Fetching…" : "Fetch →"}
                          </button>
                        )}
                      </div>
                      <span style={{ fontSize: 12, color: "#52526A", flexShrink: 0 }}>or</span>
                      <button
                        onClick={() => setProductModalMode("manual")}
                        style={{ background: "#EEEEF5", border: "none", borderRadius: 12, padding: "10px 16px", fontSize: 13, fontWeight: 700, color: "#0F0F1C", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit", flexShrink: 0 }}
                      >
                        Create manually
                      </button>
                    </div>

                    {fetchInfoErr && (
                      <div style={{ marginTop: 10, fontSize: 12, color: "#fca5a5", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "7px 12px" }}>
                        ⚠️ {fetchInfoErr}
                      </div>
                    )}
                  </div>

                  {/* Decorative avatar collage */}
                  <div style={{ position: "relative", width: 140, height: 110, flexShrink: 0 }}>
                    {[
                      { src: AVATAR_PRESETS[0].photo, x: 0,  y: 10, rot: -6 },
                      { src: AVATAR_PRESETS[2].photo, x: 50, y: 0,  rot: 3  },
                      { src: AVATAR_PRESETS[3].photo, x: 90, y: 15, rot: -4 },
                    ].map((av, i) => (
                      <div key={i} style={{ position: "absolute", left: av.x, top: av.y, width: 64, height: 64, borderRadius: "50%", overflow: "hidden", border: "2.5px solid #14142A", boxShadow: "0 4px 16px rgba(0,0,0,0.5)", transform: `rotate(${av.rot}deg)` }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={av.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom preview area */}
                <div style={{ background: "rgba(0,0,0,0.25)", borderTop: "1px solid rgba(255,255,255,0.05)", padding: "20px 28px 24px", minHeight: 160 }}>
                  {fetchingInfo ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10, paddingTop: 16 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid rgba(255,60,172,0.2)", borderTopColor: "#FF3CAC", animation: "csSpin 1s linear infinite" }} />
                      <div style={{ fontSize: 13, color: "#9090AC" }}>Fetching info…</div>
                    </div>
                  ) : fetchedInfo ? (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#52526A", marginBottom: 12 }}>
                        PRODUCT FOUND
                      </div>
                      <div style={{ display: "flex", gap: 14, alignItems: "flex-start", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 14, marginBottom: 16 }}>
                        {(fetchedInfo.image || fetchedInfo.logo) && (
                          <div style={{ width: 64, height: 64, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "rgba(255,255,255,0.05)" }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={fetchedInfo.image || fetchedInfo.logo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {fetchedInfo.publisher && <div style={{ fontSize: 10, fontWeight: 700, color: "#52526A", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>{fetchedInfo.publisher}</div>}
                          <div style={{ fontSize: 15, fontWeight: 800, color: "#EEEEF5", marginBottom: 5, lineHeight: 1.2 }}>{fetchedInfo.title || "Untitled"}</div>
                          {fetchedInfo.description && (
                            <div style={{ fontSize: 12, color: "#9090AC", lineHeight: 1.55, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
                              {fetchedInfo.description}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={confirmFetchedProduct}
                        style={{ width: "100%", background: "linear-gradient(135deg,#FF3CAC 0%,#FF6B35 100%)", border: "none", borderRadius: 12, padding: "12px 0", fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 20px rgba(255,60,172,0.35)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                      >
                        <Sparkles className="w-4 h-4" /> Use this product
                      </button>
                    </div>
                  ) : (
                    /* Upload + URL hints */
                    <div style={{ display: "flex", gap: 10, width: "100%" }}>
                      <div
                        onClick={() => { ugcImageRef.current?.click(); setProductModalOpen(false); setProductModalMode("main"); }}
                        style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, background: "rgba(255,255,255,0.025)", border: "1.5px dashed rgba(255,255,255,0.1)", borderRadius: 14, padding: "22px 0", cursor: "pointer" }}
                      >
                        <Upload className="w-6 h-6" style={{ color: "#9090AC" }} />
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#9090AC" }}>Upload image</div>
                        <div style={{ fontSize: 10, color: "#52526A" }}>JPG, PNG, WEBP</div>
                      </div>
                      <div
                        onClick={() => productUrlInputRef.current?.focus()}
                        style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, background: "rgba(255,255,255,0.025)", border: "1.5px dashed rgba(255,255,255,0.1)", borderRadius: 14, padding: "22px 0", cursor: "pointer" }}
                      >
                        <Link2 className="w-6 h-6" style={{ color: "#9090AC" }} />
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#9090AC" }}>Paste a URL</div>
                        <div style={{ fontSize: 10, color: "#52526A" }}>Any product page</div>
                      </div>
                      <div
                        onClick={() => setProductModalMode("manual")}
                        style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, background: "rgba(255,255,255,0.025)", border: "1.5px dashed rgba(255,255,255,0.1)", borderRadius: 14, padding: "22px 0", cursor: "pointer" }}
                      >
                        <Pencil className="w-6 h-6" style={{ color: "#9090AC" }} />
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#9090AC" }}>Write manually</div>
                        <div style={{ fontSize: 10, color: "#52526A" }}>Type name + details</div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ════ AVATAR MODAL — Higgsfield style ════ */}
      {ugcAvatarModalOpen && (() => {
        const q = avatarSearch.toLowerCase();
        const filtered = AVATAR_PRESETS.filter(av =>
          (avatarGenderFilter === "all" || av.gender === avatarGenderFilter) &&
          (!q || av.name.toLowerCase().includes(q) || av.style.toLowerCase().includes(q))
        );
        const showMine = avatarCategory === "mine";
        return (
          <div
            style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(4,4,12,0.90)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
            onClick={() => setUgcAvatarModalOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ background: "#111120", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, width: "100%", maxWidth: 940, maxHeight: "82vh", display: "flex", overflow: "hidden", boxShadow: "0 40px 120px rgba(0,0,0,0.8)" }}
            >
              {/* ── Left sidebar ── */}
              <div style={{ width: 190, flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.06)", padding: "24px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#EEEEF5", letterSpacing: "-0.02em", marginBottom: 12 }}>Select Avatar</div>

                {/* Search */}
                <div style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 9, padding: "7px 10px", marginBottom: 8 }}>
                  <Search className="w-3.5 h-3.5" style={{ color: "#52526A", flexShrink: 0 }} />
                  <input
                    value={avatarSearch}
                    onChange={(e) => setAvatarSearch(e.target.value)}
                    placeholder="Search..."
                    style={{ flex: 1, background: "none", border: "none", color: "#EEEEF5", fontSize: 12, outline: "none", fontFamily: "inherit" }}
                  />
                </div>

                {/* Category pills */}
                {([
                  { key: "all",  label: "All",        Icon: Users },
                  { key: "mine", label: "My avatars", Icon: Star  },
                ] as const).map(({ key, label, Icon }) => {
                  const active = avatarCategory === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setAvatarCategory(key)}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: active ? 600 : 400, cursor: "pointer", fontFamily: "inherit", background: active ? "rgba(255,255,255,0.07)" : "none", color: active ? "#EEEEF5" : "#9090AC", textAlign: "left", width: "100%" }}
                    >
                      <Icon className="w-4 h-4" style={{ flexShrink: 0 }} /> {label}
                    </button>
                  );
                })}

                {/* Gender filter */}
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#52526A", marginBottom: 8 }}>Gender</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {([["all","All"],["male","Male"],["female","Female"]] as const).map(([key, label]) => {
                      const active = avatarGenderFilter === key;
                      return (
                        <button
                          key={key}
                          onClick={() => setAvatarGenderFilter(key)}
                          style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 7, border: "none", fontSize: 12, fontWeight: active ? 600 : 400, cursor: "pointer", fontFamily: "inherit", background: active ? "rgba(255,60,172,0.10)" : "none", color: active ? "#FF3CAC" : "#9090AC", textAlign: "left", width: "100%" }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: active ? "#FF3CAC" : "#52526A", flexShrink: 0, display: "inline-block" }} />
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom upload indicator */}
                {ugcAvatarModalCustom && (
                  <div style={{ marginTop: "auto", paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 6, overflow: "hidden", flexShrink: 0, border: "1.5px solid #FF3CAC" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={ugcAvatarModalCustom.previewUrl} alt="Custom" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#FF3CAC" }}>Custom uploaded</div>
                        <button onClick={() => ugcAvatarFileRef.current?.click()} style={{ background: "none", border: "none", fontSize: 10, color: "#52526A", cursor: "pointer", padding: 0, fontFamily: "inherit" }}>Change</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Main grid ── */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, position: "relative" }}>
                {/* Grid header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
                  <div style={{ fontSize: 12, color: "#52526A" }}>
                    {showMine ? (ugcAvatarModalCustom ? "1 avatar" : "No avatars yet") : `${filtered.length} avatars`}
                  </div>
                  <button onClick={() => setUgcAvatarModalOpen(false)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, width: 28, height: 28, cursor: "pointer", color: "#9090AC", fontSize: 14, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                </div>

                {/* Scrollable grid */}
                <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px 76px" }}>

                  {/* ── MY AVATARS view ── */}
                  {showMine ? (
                    ugcAvatarModalCustom ? (
                      /* Show the uploaded avatar */
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8 }}>
                        <div
                          onClick={() => setUgcAvatarModalSel("custom")}
                          style={{ aspectRatio: "0.65", borderRadius: 12, overflow: "hidden", position: "relative", border: `2px solid ${ugcAvatarModalSel === "custom" ? "#FF3CAC" : "rgba(255,255,255,0.08)"}`, cursor: "pointer", background: "#1E1E30", transition: "all 0.15s", boxShadow: ugcAvatarModalSel === "custom" ? "0 0 20px rgba(255,60,172,0.25)" : "none" }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={ugcAvatarModalCustom.previewUrl} alt="Custom" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                          {ugcAvatarModalSel === "custom" && (
                            <div style={{ position: "absolute", top: 7, right: 7, width: 22, height: 22, borderRadius: "50%", background: "#FF3CAC", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", fontWeight: 800 }}>✓</div>
                          )}
                          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "24px 9px 9px", background: "linear-gradient(0deg,rgba(0,0,0,0.85) 0%,transparent 100%)" }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>My Avatar</div>
                            <button onClick={(e) => { e.stopPropagation(); ugcAvatarFileRef.current?.click(); }} style={{ background: "none", border: "none", fontSize: 10, color: "rgba(255,255,255,0.45)", cursor: "pointer", padding: 0, fontFamily: "inherit" }}>Replace</button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Empty state */
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 0", gap: 14, textAlign: "center" }}>
                        <div style={{ width: 64, height: 64, borderRadius: 16, background: "rgba(255,255,255,0.04)", border: "1.5px dashed rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#52526A" }}><User className="w-7 h-7" /></div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: "#EEEEF5", marginBottom: 5 }}>No custom avatars yet</div>
                          <div style={{ fontSize: 12, color: "#52526A", lineHeight: 1.5 }}>Upload a photo to create your own avatar</div>
                        </div>
                        <button
                          onClick={() => ugcAvatarFileRef.current?.click()}
                          style={{ display: "flex", alignItems: "center", gap: 7, background: "linear-gradient(135deg,#FF3CAC 0%,#FF6B35 100%)", border: "none", borderRadius: 10, padding: "9px 20px", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 16px rgba(255,60,172,0.35)" }}
                        >
                          <Upload className="w-4 h-4" /> Upload avatar photo
                        </button>
                      </div>
                    )
                  ) : (
                    /* ── ALL AVATARS view ── */
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8 }}>
                      {/* Create / Upload card */}
                      <div
                        onClick={() => ugcAvatarFileRef.current?.click()}
                        style={{ aspectRatio: "0.65", borderRadius: 12, border: "1.5px dashed rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.025)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}
                      >
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>+</div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#9090AC", textAlign: "center", lineHeight: 1.3 }}>Create<br/>avatar</div>
                      </div>

                      {/* Custom uploaded avatar if exists */}
                      {ugcAvatarModalCustom && (
                        <div
                          onClick={() => setUgcAvatarModalSel("custom")}
                          style={{ aspectRatio: "0.65", borderRadius: 12, overflow: "hidden", position: "relative", border: `2px solid ${ugcAvatarModalSel === "custom" ? "#FF3CAC" : "rgba(255,255,255,0.08)"}`, cursor: "pointer", background: "#1E1E30", transition: "all 0.15s", boxShadow: ugcAvatarModalSel === "custom" ? "0 0 20px rgba(255,60,172,0.25)" : "none" }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={ugcAvatarModalCustom.previewUrl} alt="Custom" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                          {ugcAvatarModalSel === "custom" && (
                            <div style={{ position: "absolute", top: 7, right: 7, width: 22, height: 22, borderRadius: "50%", background: "#FF3CAC", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", fontWeight: 800 }}>✓</div>
                          )}
                          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "24px 9px 9px", background: "linear-gradient(0deg,rgba(0,0,0,0.85) 0%,transparent 100%)" }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>My Avatar</div>
                          </div>
                        </div>
                      )}

                      {/* Preset avatar cards */}
                      {filtered.map((av) => {
                        const isSel = ugcAvatarModalSel === av.id;
                        return (
                          <div
                            key={av.id}
                            onClick={() => setUgcAvatarModalSel(av.id)}
                            style={{ aspectRatio: "0.65", borderRadius: 12, overflow: "hidden", position: "relative", border: `2px solid ${isSel ? "#FF3CAC" : "transparent"}`, cursor: "pointer", background: "#1E1E30", transition: "all 0.15s", boxShadow: isSel ? "0 0 20px rgba(255,60,172,0.25)" : "none" }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={av.photo} alt={av.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                            {isSel && (
                              <div style={{ position: "absolute", top: 7, right: 7, width: 22, height: 22, borderRadius: "50%", background: "#FF3CAC", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", fontWeight: 800, boxShadow: "0 2px 8px rgba(255,60,172,0.5)" }}>✓</div>
                            )}
                            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "28px 9px 9px", background: "linear-gradient(0deg,rgba(0,0,0,0.82) 0%,transparent 100%)" }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em" }}>{av.name}</div>
                              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 1 }}>{av.style}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Sticky confirm bar — left: 0 because this is already inside the flex child */}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "10px 20px 14px", background: "linear-gradient(0deg,#111120 65%,transparent 100%)", display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ flex: 1, fontSize: 12, color: "#52526A" }}>
                    {ugcAvatarModalSel === "custom" && ugcAvatarModalCustom
                      ? "My Avatar selected"
                      : `Selected: ${AVATAR_PRESETS.find(a => a.id === ugcAvatarModalSel)?.name ?? ugcAvatarModalSel}`}
                  </div>
                  <button onClick={() => setUgcAvatarModalOpen(false)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "9px 18px", fontSize: 13, fontWeight: 600, color: "#9090AC", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                  <button
                    onClick={() => {
                      if (ugcAvatarModalSel === "custom" && ugcAvatarModalCustom) {
                        setUgcAvatarCustomFile(ugcAvatarModalCustom);
                        setUgcAvatar("custom");
                      } else {
                        setUgcAvatar(ugcAvatarModalSel);
                        setUgcAvatarCustomFile(null);
                      }
                      setUgcAvatarModalOpen(false);
                    }}
                    style={{ background: "linear-gradient(135deg,#FF3CAC 0%,#FF6B35 100%)", border: "none", borderRadius: 10, padding: "9px 24px", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 16px rgba(255,60,172,0.4)" }}
                  >Confirm Avatar</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
