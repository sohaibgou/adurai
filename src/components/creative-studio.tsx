"use client";

import { useState, useCallback } from "react";
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
  dallePrompt: string;
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

/* ── Single concept card (with DALL-E generation) ──────── */

function ConceptCard({ concept, index }: { concept: CreativeConcept; index: number }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const formatKey = concept.format || "Feed 1080x1080";
  const fmtCfg = FORMAT_CONFIG[formatKey] || FORMAT_CONFIG["Feed 1080x1080"];
  const FormatIcon = fmtCfg.icon;

  // Determine DALL-E size from format
  const dalleSize: "1024x1024" | "1024x1792" =
    formatKey.includes("1920") ? "1024x1792" : "1024x1024";

  async function generateImage() {
    setImageLoading(true);
    setImageError(null);
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: concept.dallePrompt, size: dalleSize }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Image generation failed");
      }
      const data = await res.json();
      setImageUrl(data.imageUrl);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setImageLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.12, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-xl border border-card-border overflow-hidden hover:shadow-lg transition-all"
    >
      {/* ── Dark header ─────────────────────────── */}
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

      {/* ── White body ──────────────────────────── */}
      <div className="bg-white px-6 py-5 space-y-5">
        {/* Concept name */}
        <h4 className="text-lg font-bold text-foreground">{concept.name}</h4>

        {/* Visual description */}
        <div>
          <p className="text-[11px] font-semibold text-muted uppercase tracking-widest mb-2">
            Visual Description
          </p>
          <div className="px-4 py-3 rounded-lg bg-surface border border-card-border">
            <p className="text-foreground text-sm leading-relaxed select-all">
              {concept.visualDescription}
            </p>
          </div>
        </div>

        {/* Text overlay */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <p className="text-[11px] font-semibold text-muted uppercase tracking-widest mb-2">
              Headline Overlay
            </p>
            <div className="px-4 py-3 rounded-lg bg-surface border border-card-border flex items-center justify-between">
              <p className="text-foreground font-bold select-all">{concept.headlineOverlay}</p>
              <CopyButton text={concept.headlineOverlay} />
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-muted uppercase tracking-widest mb-2">
              Subtext
            </p>
            <div className="px-4 py-3 rounded-lg bg-surface border border-card-border flex items-center justify-between">
              <p className="text-foreground text-sm select-all">{concept.subtextOverlay}</p>
              <CopyButton text={concept.subtextOverlay} />
            </div>
          </div>
        </div>

        {/* Why it works */}
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg bg-purple/5 border border-purple/10">
          <Sparkles className="w-4 h-4 text-purple flex-shrink-0 mt-0.5" />
          <p className="text-sm text-foreground leading-relaxed">
            <span className="font-semibold">Why it works:</span> {concept.whyItWorks}
          </p>
        </div>

        {/* ── Generate with AI / Generated Image ── */}
        {!imageUrl && !imageLoading && !imageError && (
          <button
            onClick={generateImage}
            className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl text-sm font-semibold transition-all cursor-pointer
              bg-gradient-to-r from-purple to-teal text-white
              hover:shadow-lg hover:shadow-purple/20 hover:-translate-y-0.5
              active:translate-y-0"
          >
            <Wand2 className="w-4 h-4" />
            Generate with AI
          </button>
        )}

        {imageLoading && (
          <div className="w-full flex flex-col items-center justify-center gap-3 py-10 rounded-xl bg-surface border border-card-border">
            <Loader2 className="w-8 h-8 text-purple animate-spin" />
            <p className="text-sm text-muted font-medium">Generating image with DALL-E 3...</p>
            <p className="text-xs text-muted/60">This may take 10-20 seconds</p>
          </div>
        )}

        {imageError && (
          <div className="w-full rounded-xl border border-red-200 bg-red-50 p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-700 font-medium">Image generation failed</p>
                <p className="text-xs text-red-600 mt-1">{imageError}</p>
              </div>
            </div>
            <button
              onClick={generateImage}
              className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100 text-red-700 text-xs font-medium hover:bg-red-200 transition-colors cursor-pointer"
            >
              <Wand2 className="w-3 h-3" />
              Try Again
            </button>
          </div>
        )}

        {imageUrl && (
          <div className="rounded-xl overflow-hidden border border-card-border">
            <img
              src={imageUrl}
              alt={concept.name}
              className="w-full object-cover"
              style={{
                aspectRatio: dalleSize === "1024x1792" ? "9/16" : "1/1",
                maxHeight: 600,
              }}
            />
            <div className="flex items-center justify-between px-4 py-3 bg-surface border-t border-card-border">
              <p className="text-xs text-muted">Generated by DALL-E 3</p>
              <div className="flex items-center gap-2">
                <a
                  href={imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple/10 text-purple text-xs font-medium hover:bg-purple/20 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  Download
                </a>
                <button
                  onClick={() => { setImageUrl(null); setImageError(null); generateImage(); }}
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

  const suggestedProduct = summaries.map((s) => s.campaignName).join(", ");

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
    if (!productDesc.trim()) return;
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

        {/* Input */}
        <div className="p-7">
          <label className="block text-sm font-medium text-foreground mb-2">
            Describe your product or offer
          </label>
          <textarea
            value={productDesc}
            onChange={(e) => setProductDesc(e.target.value)}
            placeholder={`e.g., "Premium leather sneakers for men, $129, free shipping, 30-day returns"\n\nYour campaigns: ${suggestedProduct}`}
            className="w-full h-24 px-4 py-3 rounded-xl border border-card-border bg-surface text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple/30 focus:border-purple/50 transition-all placeholder:text-muted/50"
          />
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleGenerate}
              disabled={!productDesc.trim() || isLoading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple text-white text-sm font-medium transition-all hover:shadow-lg hover:shadow-purple/20 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none cursor-pointer"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              {isLoading
                ? activeTab === "copy" ? "Writing copy..." : "Designing concepts..."
                : activeTab === "copy" ? "Generate 5 Ad Variants" : "Generate 3 Concepts"}
            </button>
            {activeTab === "copy" && !copyLoading && (
              <p className="text-xs text-muted">
                5 hook types: Pain Point, Curiosity, Social Proof, Offer, Pattern Interrupt
              </p>
            )}
            {activeTab === "creatives" && !creativeLoading && (
              <p className="text-xs text-muted">
                3 concepts for Feed, Story, and Reel — each with AI image generation
              </p>
            )}
          </div>
          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
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
                  <ConceptCard key={i} concept={concept} index={i} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
