"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag, Globe, Target, TrendingUp, Search, BarChart3,
  ChevronRight, ChevronLeft, ChevronDown, Upload, FileText, AlertCircle, Check,
} from "lucide-react";
import type { OnboardingData } from "@/lib/types";

/* ── Constants ──────────────────────────────────────────── */

const MARKET_GROUPS: { label: string; options: string[] }[] = [
  {
    label: "── Popular ──",
    options: [
      "United States", "United Kingdom", "Canada", "Australia", "UAE",
      "Saudi Arabia", "Morocco", "Algeria", "Egypt", "France",
      "Germany", "Spain", "Italy", "Netherlands",
    ],
  },
  {
    label: "── All Countries (A–Z) ──",
    options: [
      "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia","Australia","Austria","Azerbaijan",
      "Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan","Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi",
      "Cabo Verde","Cambodia","Cameroon","Canada","Central African Republic","Chad","Chile","China","Colombia","Comoros","Costa Rica","Croatia","Cuba","Cyprus","Czech Republic",
      "Denmark","Djibouti","Dominica","Dominican Republic","DR Congo",
      "Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia",
      "Fiji","Finland","France",
      "Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau","Guyana",
      "Haiti","Honduras","Hungary",
      "Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy","Ivory Coast",
      "Jamaica","Japan","Jordan",
      "Kazakhstan","Kenya","Kiribati","Kosovo","Kuwait","Kyrgyzstan",
      "Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg",
      "Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar",
      "Namibia","Nauru","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Korea","North Macedonia","Norway",
      "Oman",
      "Pakistan","Palau","Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal",
      "Qatar",
      "Romania","Russia","Rwanda",
      "Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland","Syria",
      "Taiwan","Tajikistan","Tanzania","Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Tuvalu",
      "Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan",
      "Vanuatu","Vatican City","Venezuela","Vietnam",
      "Yemen",
      "Zambia","Zimbabwe",
    ],
  },
];

const GOALS = [
  { value: "Lower my CPA",                      icon: TrendingUp, color: "#059669" },
  { value: "Scale my winning campaigns",         icon: BarChart3,  color: "#FF3CAC" },
  { value: "Find what's wasting money",          icon: Search,     color: "#e17055" },
  { value: "Understand my overall performance",  icon: Target,     color: "#0984e3" },
];

const NICHE_CHIPS = [
  "👗 Fashion", "💄 Beauty", "🏠 Home & Living",
  "📱 Electronics", "🍎 Food & Health", "📚 Courses", "Other",
];

const STEPS = [
  { num: 1, label: "Your Business",   desc: "What you sell & your market" },
  { num: 2, label: "Your Numbers",    desc: "AOV, COGS & break-even" },
  { num: 3, label: "Your Goals",      desc: "What you want to achieve" },
  { num: 4, label: "Upload CSV",      desc: "Your Meta Ads export" },
];

const STEP_HEADERS: Record<number, { title: string; subtitle: string }> = {
  1: {
    title:    "Tell us about your business",
    subtitle: "We'll tailor the AI analysis to your niche and market so every recommendation is actually relevant.",
  },
  2: {
    title:    "Your business numbers",
    subtitle: "We'll calculate your break-even ROAS and flag every campaign bleeding money after product costs.",
  },
  3: {
    title:    "What's your main goal?",
    subtitle: "We'll prioritize recommendations around this so every insight points to clear next steps.",
  },
  4: {
    title:    "Upload your Meta Ads CSV",
    subtitle: "Drag your file here or click to browse. Your data stays completely private — we never store it.",
  },
};

/* ── Props ─────────────────────────────────────────────── */

interface OnboardingFormProps {
  onComplete:     (data: OnboardingData) => void;
  onFileSelected: (file: File) => void;
  isLoading:      boolean;
}

/* ── Input helpers ─────────────────────────────────────── */

const INPUT_BASE: React.CSSProperties = {
  width:        "100%",
  height:        52,
  padding:      "0 16px 0 44px",
  fontSize:      15,
  color:        "#0D0D12",
  background:   "#F7F5F2",
  border:       "1.5px solid #E8E5E0",
  borderRadius:  12,
  fontFamily:   "var(--font-inter)",
  outline:      "none",
  transition:   "border-color 0.15s, box-shadow 0.15s, background 0.15s",
};

function focusInput(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = "#FF3CAC";
  e.currentTarget.style.background  = "#FFFFFF";
  e.currentTarget.style.boxShadow   = "0 0 0 4px rgba(255,60,172,0.10)";
}
function blurInput(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = "#E8E5E0";
  e.currentTarget.style.background  = "#F7F5F2";
  e.currentTarget.style.boxShadow   = "none";
}

/* ── Component ─────────────────────────────────────────── */

export default function OnboardingForm({ onComplete, onFileSelected, isLoading }: OnboardingFormProps) {
  const [step, setStep] = useState(1);

  const [product,   setProduct]   = useState("");
  const [market,    setMarket]    = useState("");
  const [aov,       setAov]       = useState("");
  const [cogs,      setCogs]      = useState("");
  const [targetCpa, setTargetCpa] = useState("");
  const [mainGoal,  setMainGoal]  = useState("");

  const [isDragging, setIsDragging] = useState(false);
  const [fileName,   setFileName]   = useState<string | null>(null);
  const [fileError,  setFileError]  = useState<string | null>(null);

  const breakEvenRoas = useMemo(() => {
    const a = parseFloat(aov);
    const c = parseFloat(cogs);
    if (!a || a <= 0 || !c || c <= 0 || c >= a) return 0;
    return Number((a / (a - c)).toFixed(2));
  }, [aov, cogs]);

  const step1Valid = product.trim() && market;
  const step2Valid = parseFloat(aov) > 0 && parseFloat(cogs) > 0;
  const step3Valid = !!mainGoal;
  const stepValid  = step === 1 ? step1Valid : step === 2 ? step2Valid : step === 3 ? step3Valid : false;

  function goNext() { setStep((s) => Math.min(s + 1, 4)); }
  function goBack() { setStep((s) => Math.max(s - 1, 1)); }

  function buildOnboardingData(): OnboardingData {
    return {
      product:          product.trim(),
      market,
      monthlyBudget:    "",
      adExperience:     "",
      aov:              parseFloat(aov) || 0,
      cogs:             parseFloat(cogs) || 0,
      breakEvenRoas,
      targetCpa:        parseFloat(targetCpa) || 0,
      currentRoas:      0,
      mainGoal,
      biggestChallenge: "",
      focusCampaigns:   "",
    };
  }

  const handleFile = useCallback(
    (file: File) => {
      setFileError(null);
      if (!file.name.toLowerCase().endsWith(".csv")) { setFileError("Please upload a CSV file."); return; }
      if (file.size > 10 * 1024 * 1024) { setFileError("File size must be under 10MB."); return; }
      setFileName(file.name);
      onComplete(buildOnboardingData());
      onFileSelected(file);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [product, market, aov, cogs, targetCpa, mainGoal, breakEvenRoas, onComplete, onFileSelected],
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

  const meta = STEP_HEADERS[step];

  return (
    <section
      style={{
        background:   "#FFFFFF",
        borderTop:    "1px solid #E8E5E0",
        paddingTop:    64,
        paddingBottom: 80,
      }}
    >
      {/* Subtle top gradient glow to separate from landing above */}
      <div style={{ position: "absolute", left: 0, right: 0, height: 320, background: "radial-gradient(ellipse 60% 100% at 50% 0%, rgba(255,60,172,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div className="relative px-4 sm:px-6" style={{ maxWidth: 600, margin: "0 auto" }}>

        {/* ── Header ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`header-${step}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-6 sm:mb-8"
          >
            <div
              className="inline-flex items-center gap-1.5 mb-4"
              style={{
                background:    "rgba(255,60,172,0.08)",
                border:        "1px solid rgba(255,60,172,0.20)",
                color:         "#FF3CAC",
                fontSize:       11,
                fontWeight:     700,
                letterSpacing: "0.09em",
                textTransform: "uppercase",
                padding:       "5px 14px",
                borderRadius:   100,
                fontFamily:    "var(--font-inter)",
              }}
            >
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#FF3CAC", display: "inline-block" }} />
              Step {step} of 4
            </div>
            <h2
              className="font-heading"
              style={{
                fontSize:      "clamp(28px, 4vw, 40px)",
                fontWeight:     900,
                letterSpacing: "-0.04em",
                lineHeight:     1.1,
                color:         "#0D0D12",
                marginBottom:    10,
              }}
            >
              {meta.title}
            </h2>
            <p
              style={{
                fontSize:   15,
                color:      "#6B6B72",
                lineHeight: 1.6,
                fontFamily: "var(--font-inter)",
                maxWidth:   500,
                margin:     "0 auto",
              }}
            >
              {meta.subtitle}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* ── Form card ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`card-${step}`}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="p-5 sm:p-8 md:p-10"
            style={{
              background:   "#FFFFFF",
              border:       "1px solid #E8E5E0",
              borderRadius:  20,
              boxShadow:    "0 8px 40px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)",
            }}
          >

            {/* ── STEP 1 ── */}
            {step === 1 && (
              <div>
                <FieldLabel>What do you sell?</FieldLabel>
                <FieldHint>Describe your product or service in a few words</FieldHint>
                <div className="relative mb-4">
                  <ShoppingBag className="w-4 h-4 absolute pointer-events-none" style={{ left: 14, top: "50%", transform: "translateY(-50%)", color: "#A8A5A0" }} />
                  <input
                    type="text"
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                    placeholder="e.g. Skincare products, Fashion brand, Online course"
                    style={INPUT_BASE}
                    onFocus={focusInput}
                    onBlur={blurInput}
                  />
                </div>
                <div className="flex flex-wrap gap-2 mb-7">
                  {NICHE_CHIPS.map((chip) => {
                    const selected = product === chip;
                    return (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setProduct(chip)}
                        className="cursor-pointer transition-all"
                        style={{
                          padding:    "7px 15px",
                          borderRadius: 100,
                          border:      selected ? "1.5px solid #FF3CAC" : "1.5px solid #E8E5E0",
                          background:  selected ? "rgba(255,60,172,0.08)" : "#F7F5F2",
                          color:       selected ? "#FF3CAC" : "#6B6B72",
                          fontSize:    13,
                          fontWeight:  selected ? 600 : 500,
                          fontFamily: "var(--font-inter)",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => { if (!selected) { (e.currentTarget as HTMLButtonElement).style.borderColor = "#FF3CAC"; (e.currentTarget as HTMLButtonElement).style.color = "#FF3CAC"; } }}
                        onMouseLeave={(e) => { if (!selected) { (e.currentTarget as HTMLButtonElement).style.borderColor = "#E8E5E0"; (e.currentTarget as HTMLButtonElement).style.color = "#6B6B72"; } }}
                      >
                        {chip}
                      </button>
                    );
                  })}
                </div>

                <div style={{ height: 1, background: "#F0EDE8", margin: "0 0 24px" }} />

                <FieldLabel>Target Market</FieldLabel>
                <FieldHint>Which country are you running your ads in?</FieldHint>
                <div className="relative">
                  <Globe className="w-4 h-4 absolute z-10 pointer-events-none" style={{ left: 14, top: "50%", transform: "translateY(-50%)", color: "#A8A5A0" }} />
                  <select
                    value={market}
                    onChange={(e) => setMarket(e.target.value)}
                    className="w-full appearance-none cursor-pointer"
                    style={{ ...INPUT_BASE, padding: "0 44px 0 44px", color: market ? "#0D0D12" : "#A8A5A0" }}
                    onFocus={focusInput}
                    onBlur={blurInput}
                  >
                    <option value="" disabled>Select your market</option>
                    {MARKET_GROUPS.map((g) => (
                      <optgroup key={g.label} label={g.label}>
                        {g.options.map((o) => <option key={o} value={o}>{o}</option>)}
                      </optgroup>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute pointer-events-none" style={{ right: 14, top: "50%", transform: "translateY(-50%)", color: "#A8A5A0" }} />
                </div>
              </div>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
                  <div>
                    <FieldLabel>Average Order Value</FieldLabel>
                    <FieldHint>Revenue per order</FieldHint>
                    <div className="relative">
                      <span className="absolute pointer-events-none" style={{ left: 14, top: "50%", transform: "translateY(-50%)", color: "#A8A5A0", fontSize: 15, fontFamily: "var(--font-inter)", fontWeight: 500 }}>$</span>
                      <input
                        type="number"
                        value={aov}
                        onChange={(e) => setAov(e.target.value)}
                        placeholder="75"
                        min="0"
                        style={{ ...INPUT_BASE, padding: "0 16px 0 32px" }}
                        onFocus={focusInput}
                        onBlur={blurInput}
                      />
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Product Cost (COGS)</FieldLabel>
                    <FieldHint>Cost per unit</FieldHint>
                    <div className="relative">
                      <span className="absolute pointer-events-none" style={{ left: 14, top: "50%", transform: "translateY(-50%)", color: "#A8A5A0", fontSize: 15, fontFamily: "var(--font-inter)", fontWeight: 500 }}>$</span>
                      <input
                        type="number"
                        value={cogs}
                        onChange={(e) => setCogs(e.target.value)}
                        placeholder="25"
                        min="0"
                        style={{ ...INPUT_BASE, padding: "0 16px 0 32px" }}
                        onFocus={focusInput}
                        onBlur={blurInput}
                      />
                    </div>
                  </div>
                </div>

                {/* Break-even display */}
                <AnimatePresence>
                  {breakEvenRoas > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                      animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      style={{ overflow: "hidden" }}
                    >
                      <div
                        style={{
                          padding:    "20px 24px",
                          borderRadius: 16,
                          background:  "rgba(255,60,172,0.05)",
                          border:      "1px solid rgba(255,60,172,0.18)",
                          display:     "flex",
                          alignItems:  "center",
                          gap:         20,
                        }}
                      >
                        <div>
                          <p style={{ fontSize: 12, color: "#6B6B72", marginBottom: 4, fontFamily: "var(--font-inter)" }}>
                            Your break-even ROAS
                          </p>
                          <p
                            className="font-heading"
                            style={{
                              fontSize:             36,
                              fontWeight:            900,
                              letterSpacing:        "-0.04em",
                              background:           "linear-gradient(135deg, #FF3CAC, #FF6B35)",
                              WebkitBackgroundClip: "text",
                              WebkitTextFillColor: "transparent",
                              backgroundClip:       "text",
                              lineHeight:           1,
                            }}
                          >
                            {breakEvenRoas}×
                          </p>
                        </div>
                        <p style={{ fontSize: 13, color: "#6B6B72", lineHeight: 1.55, fontFamily: "var(--font-inter)" }}>
                          Any campaign running below this ROAS is losing money after product costs.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <FieldLabel>
                  Target CPA{" "}
                  <span style={{ color: "#A8A5A0", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
                </FieldLabel>
                <FieldHint>Cost per acquisition target — leave blank if unknown</FieldHint>
                <div className="relative">
                  <span className="absolute pointer-events-none" style={{ left: 14, top: "50%", transform: "translateY(-50%)", color: "#A8A5A0", fontSize: 15, fontFamily: "var(--font-inter)", fontWeight: 500 }}>$</span>
                  <input
                    type="number"
                    value={targetCpa}
                    onChange={(e) => setTargetCpa(e.target.value)}
                    placeholder="Leave blank if unknown"
                    min="0"
                    style={{ ...INPUT_BASE, padding: "0 16px 0 32px" }}
                    onFocus={focusInput}
                    onBlur={blurInput}
                  />
                </div>
              </div>
            )}

            {/* ── STEP 3 ── */}
            {step === 3 && (
              <div className="flex flex-col gap-3">
                {GOALS.map((opt) => {
                  const Icon     = opt.icon;
                  const selected = mainGoal === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setMainGoal(opt.value)}
                      className="w-full flex items-center gap-4 text-left cursor-pointer transition-all"
                      style={{
                        padding:      "18px 20px",
                        borderRadius:  14,
                        border:        selected ? "1.5px solid #FF3CAC" : "1.5px solid #E8E5E0",
                        background:    selected ? "rgba(255,60,172,0.05)" : "#FAFAF9",
                        boxShadow:     selected ? "0 0 0 4px rgba(255,60,172,0.08)" : "none",
                        transition:   "all 0.15s",
                      }}
                      onMouseEnter={(e) => { if (!selected) (e.currentTarget as HTMLButtonElement).style.borderColor = "#D4D0CA"; }}
                      onMouseLeave={(e) => { if (!selected) (e.currentTarget as HTMLButtonElement).style.borderColor = "#E8E5E0"; }}
                    >
                      <div
                        className="flex-shrink-0 flex items-center justify-center"
                        style={{ width: 44, height: 44, borderRadius: 12, background: `${opt.color}14` }}
                      >
                        <Icon className="w-5 h-5" style={{ color: opt.color }} />
                      </div>
                      <span style={{ fontSize: 15, fontWeight: selected ? 600 : 500, color: selected ? "#0D0D12" : "#6B6B72", fontFamily: "var(--font-inter)", flex: 1 }}>
                        {opt.value}
                      </span>
                      {selected && (
                        <div
                          className="flex-shrink-0 flex items-center justify-center"
                          style={{ width: 24, height: 24, borderRadius: "50%", background: "linear-gradient(135deg, #FF3CAC, #FF6B35)" }}
                        >
                          <Check className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* ── STEP 4: Upload ── */}
            {step === 4 && (
              <div>
                {/* Summary */}
                <div
                  className="flex items-start gap-3 mb-6"
                  style={{
                    padding:    "14px 18px",
                    borderRadius: 14,
                    background:  "rgba(255,60,172,0.05)",
                    border:      "1px solid rgba(255,60,172,0.18)",
                  }}
                >
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#FF3CAC", flexShrink: 0, marginTop: 6 }} />
                  <p style={{ fontSize: 13, color: "#0D0D12", lineHeight: 1.6, fontFamily: "var(--font-inter)" }}>
                    Analyzing for <strong style={{ color: "#FF3CAC" }}>{market}</strong>
                    {" · "}AOV <strong style={{ color: "#FF3CAC" }}>${aov}</strong>
                    {breakEvenRoas > 0 && <> · Break-even <strong style={{ color: "#FF3CAC" }}>{breakEvenRoas}×</strong></>}
                    {" · "}Goal: <strong style={{ color: "#FF3CAC" }}>{mainGoal}</strong>
                  </p>
                </div>

                {/* Drop zone */}
                <label
                  htmlFor="csv-upload-onboarding"
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  className={`relative flex flex-col items-center justify-center w-full cursor-pointer ${isLoading ? "pointer-events-none opacity-60" : ""}`}
                >
                  <div
                    className="w-full flex flex-col items-center justify-center transition-all"
                    style={{
                      padding:      48,
                      border:      `2px dashed ${isDragging ? "#FF3CAC" : "#D4D0CA"}`,
                      borderRadius:  18,
                      background:    isDragging ? "rgba(255,60,172,0.04)" : "#F7F5F2",
                      transition:   "border-color 0.15s, background 0.15s",
                    }}
                  >
                    {fileName && !isLoading ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center justify-center" style={{ width: 60, height: 60, borderRadius: 16, background: "rgba(255,60,172,0.10)" }}>
                          <FileText className="w-7 h-7" style={{ color: "#FF3CAC" }} />
                        </div>
                        <p className="font-heading" style={{ fontSize: 16, fontWeight: 700, color: "#0D0D12", letterSpacing: "-0.02em" }}>{fileName}</p>
                        <p style={{ fontSize: 13, color: "#A8A5A0", fontFamily: "var(--font-inter)" }}>Drop another file or click to replace</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3 text-center">
                        <div
                          className="flex items-center justify-center"
                          style={{ width: 60, height: 60, borderRadius: 16, background: "linear-gradient(135deg, rgba(255,60,172,0.12), rgba(255,107,53,0.10))" }}
                        >
                          <Upload className="w-7 h-7" style={{ color: "#FF3CAC" }} />
                        </div>
                        <div>
                          <p className="font-heading" style={{ fontSize: 17, fontWeight: 700, color: "#0D0D12", letterSpacing: "-0.02em", marginBottom: 6 }}>
                            Drop your Meta Ads CSV here
                          </p>
                          <p style={{ fontSize: 14, color: "#6B6B72", fontFamily: "var(--font-inter)" }}>
                            or <span style={{ color: "#FF3CAC", fontWeight: 600 }}>click to browse</span> — export from Meta Ads Manager
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <input
                    id="csv-upload-onboarding"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    disabled={isLoading}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                  />
                </label>

                {fileError && (
                  <div className="flex items-center justify-center gap-2 mt-3" style={{ fontSize: 13, color: "#DC2626", fontFamily: "var(--font-inter)" }}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {fileError}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-center gap-6 mt-6">
                  {["No login required", "AI-powered insights", "Data stays private"].map((text) => (
                    <span key={text} className="flex items-center gap-1.5" style={{ fontSize: 12, color: "#A8A5A0", fontFamily: "var(--font-inter)" }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#16A34A", display: "inline-block" }} />
                      {text}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>

        {/* ── Footer nav ── */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-6">
          {step > 1 ? (
            <button
              type="button"
              onClick={goBack}
              disabled={isLoading}
              className="flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
              style={{
                fontSize:   14,
                fontWeight:  500,
                color:      "#6B6B72",
                background: "none",
                border:     "none",
                padding:    "10px 0",
                fontFamily: "var(--font-inter)",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#0D0D12"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#6B6B72"; }}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 && (
            <button
              type="button"
              onClick={goNext}
              disabled={!stepValid}
              className="inline-flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto"
              style={{
                padding:      "14px 36px",
                borderRadius:  100,
                background:   "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)",
                color:        "#FFFFFF",
                fontSize:      15,
                fontWeight:    600,
                letterSpacing: "-0.01em",
                boxShadow:    "0 4px 20px rgba(255,60,172,0.30)",
                border:       "none",
                fontFamily:   "var(--font-inter)",
                transition:   "transform 0.15s, box-shadow 0.15s, opacity 0.15s",
              }}
              onMouseEnter={(e) => {
                const b = e.currentTarget as HTMLButtonElement;
                if (!b.disabled) { b.style.transform = "translateY(-2px)"; b.style.boxShadow = "0 8px 28px rgba(255,60,172,0.40)"; }
              }}
              onMouseLeave={(e) => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.transform = "translateY(0)";
                b.style.boxShadow = "0 4px 20px rgba(255,60,172,0.30)";
              }}
            >
              {step === 3 ? "Continue to Upload" : "Continue"}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </section>
  );
}

/* ── Helpers ─────────────────────────────────────────────── */

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label
      className="block"
      style={{
        fontSize:      11,
        fontWeight:     700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color:         "#0D0D12",
        marginBottom:   6,
        fontFamily:    "var(--font-inter)",
      }}
    >
      {children}
    </label>
  );
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3" style={{ fontSize: 13, color: "#A8A5A0", fontFamily: "var(--font-inter)" }}>
      {children}
    </p>
  );
}
