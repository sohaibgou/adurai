"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  Globe,
  Target,
  TrendingUp,
  Search,
  BarChart3,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Upload,
  FileText,
  AlertCircle,
  Check,
} from "lucide-react";
import type { OnboardingData } from "@/lib/types";

/* ── Constants ─────────────────────────────────────────── */

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
  { value: "Lower my CPA",                          icon: TrendingUp, color: "#059669" },
  { value: "Scale my winning campaigns",            icon: BarChart3,  color: "#7C3AED" },
  { value: "Find what's wasting money",             icon: Search,     color: "#e17055" },
  { value: "Understand my overall performance",     icon: Target,     color: "#0984e3" },
];

const NICHE_CHIPS = [
  "👗 Fashion",
  "💄 Beauty",
  "🏠 Home & Living",
  "📱 Electronics",
  "🍎 Food & Health",
  "📚 Courses",
  "Other",
];

const STEPS = [
  { num: 1, label: "Your Business",   desc: "What you sell & your market" },
  { num: 2, label: "Current Numbers", desc: "AOV, COGS & break-even" },
  { num: 3, label: "Your Goals",      desc: "What you want to achieve" },
  { num: 4, label: "Upload CSV",      desc: "Your Meta Ads export" },
];

const STEP_HEADERS: Record<number, { title: string; subtitle: string }> = {
  1: {
    title:    "Tell us about\nyour business",
    subtitle: "We'll tailor the AI analysis to your niche and market so recommendations are actually relevant.",
  },
  2: {
    title:    "Your business\nnumbers",
    subtitle: "We'll calculate your break-even ROAS and flag campaigns losing money after product costs.",
  },
  3: {
    title:    "What's your\nmain goal?",
    subtitle: "We'll prioritize recommendations around this so every insight has clear next steps.",
  },
  4: {
    title:    "Upload your\nMeta Ads export",
    subtitle: "Drag your CSV file here or click to browse. Your data stays private — we don't store it.",
  },
};

/* ── Props ─────────────────────────────────────────────── */

interface OnboardingFormProps {
  onComplete:     (data: OnboardingData) => void;
  onFileSelected: (file: File) => void;
  isLoading:      boolean;
}

/* ── Reusable input styles ─────────────────────────────── */

const INPUT_STYLE: React.CSSProperties = {
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
  e.currentTarget.style.borderColor = "#7C3AED";
  e.currentTarget.style.background  = "#FFFFFF";
  e.currentTarget.style.boxShadow   = "0 0 0 4px rgba(124,58,237,0.10)";
}
function blurInput(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = "#E8E5E0";
  e.currentTarget.style.background  = "#F7F5F2";
  e.currentTarget.style.boxShadow   = "none";
}

/* ── Main component ────────────────────────────────────── */

export default function OnboardingForm({ onComplete, onFileSelected, isLoading }: OnboardingFormProps) {
  const [step, setStep]           = useState(1);

  // Form state
  const [product, setProduct]     = useState("");
  const [market, setMarket]       = useState("");
  const [aov, setAov]             = useState("");
  const [cogs, setCogs]           = useState("");
  const [targetCpa, setTargetCpa] = useState("");
  const [mainGoal, setMainGoal]   = useState("");

  // Upload state
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName]     = useState<string | null>(null);
  const [fileError, setFileError]   = useState<string | null>(null);

  // Break-even ROAS
  const breakEvenRoas = useMemo(() => {
    const a = parseFloat(aov);
    const c = parseFloat(cogs);
    if (!a || a <= 0 || !c || c <= 0 || c >= a) return 0;
    return Number((a / (a - c)).toFixed(2));
  }, [aov, cogs]);

  // Validation
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
      if (!file.name.toLowerCase().endsWith(".csv")) {
        setFileError("Please upload a CSV file.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setFileError("File size must be under 10MB.");
        return;
      }
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

  const meta         = STEP_HEADERS[step];
  const progressPct  = (step / 4) * 100;

  return (
    <section className="relative" style={{ background: "#F7F5F2" }}>
      <div className="grid lg:grid-cols-[300px_1fr] min-h-screen">

        {/* ── SIDEBAR (desktop) ── */}
        <aside
          className="hidden lg:flex flex-col gap-2"
          style={{ background: "#FFFFFF", borderRight: "1px solid #E8E5E0", padding: "48px 32px" }}
        >
          <p
            className="mb-5"
            style={{
              fontSize:       11,
              fontWeight:      600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color:         "#A8A5A0",
              fontFamily:    "var(--font-inter)",
            }}
          >
            Setup your account
          </p>

          {STEPS.map((s, idx) => {
            const isActive = step === s.num;
            const isDone   = step > s.num;
            const isLocked = step < s.num;
            const isLast   = idx === STEPS.length - 1;

            return (
              <div key={s.num} className="relative">
                <div
                  className="flex items-start gap-3.5 transition-colors duration-150"
                  style={{
                    padding:    "14px 16px",
                    borderRadius: 12,
                    background:  isActive ? "rgba(124,58,237,0.08)" : "transparent",
                    opacity:     isLocked ? 0.4 : 1,
                    cursor:      isLocked ? "default" : "default",
                  }}
                >
                  <div
                    className="flex items-center justify-center flex-shrink-0 transition-all duration-200"
                    style={{
                      width:         28,
                      height:        28,
                      borderRadius: "50%",
                      background:    isDone
                        ? "#16A34A"
                        : isActive
                        ? "linear-gradient(135deg, #7C3AED, #C026D3)"
                        : "#FFFFFF",
                      border:        isDone || isActive ? "none" : "1.5px solid #D4D0CA",
                      color:         isDone || isActive ? "#FFFFFF" : "#A8A5A0",
                      fontSize:      12,
                      fontWeight:     700,
                      fontFamily:   "var(--font-inter)",
                      boxShadow:     isActive ? "0 4px 12px rgba(124,58,237,0.3)" : "none",
                    }}
                  >
                    {isDone ? <Check className="w-3.5 h-3.5" /> : s.num}
                  </div>

                  <div className="flex-1">
                    <p
                      style={{
                        fontSize:    13,
                        fontWeight:   600,
                        color:        isLocked ? "#A8A5A0" : "#0D0D12",
                        marginBottom: 2,
                        fontFamily:  "var(--font-inter)",
                      }}
                    >
                      {s.label}
                    </p>
                    <p
                      style={{
                        fontSize:   12,
                        color:       isActive ? "#7C3AED" : "#A8A5A0",
                        lineHeight: 1.4,
                        fontFamily: "var(--font-inter)",
                      }}
                    >
                      {s.desc}
                    </p>
                  </div>
                </div>

                {!isLast && (
                  <div
                    style={{
                      position:   "absolute",
                      left:        28,
                      top:         46,
                      width:        1,
                      height:      22,
                      background:  isDone ? "rgba(124,58,237,0.3)" : "#E8E5E0",
                    }}
                  />
                )}
              </div>
            );
          })}

          {/* Progress footer */}
          <div
            className="mt-auto"
            style={{ padding: "20px 16px", background: "#F7F5F2", borderRadius: 12 }}
          >
            <div
              className="flex justify-between mb-2.5"
              style={{ fontSize: 12, color: "#6B6B72", fontFamily: "var(--font-inter)" }}
            >
              <span>Progress</span>
              <strong style={{ color: "#0D0D12", fontWeight: 600 }}>Step {step} of 4</strong>
            </div>
            <div style={{ height: 4, background: "#E8E5E0", borderRadius: 100, overflow: "hidden" }}>
              <motion.div
                initial={false}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  height:       "100%",
                  borderRadius:  100,
                  background:   "linear-gradient(90deg, #7C3AED, #C026D3)",
                }}
              />
            </div>
          </div>
        </aside>

        {/* ── MOBILE STEPPER ── */}
        <div
          className="lg:hidden"
          style={{ background: "#FFFFFF", borderBottom: "1px solid #E8E5E0", padding: "16px 24px" }}
        >
          <div
            className="flex items-center justify-between mb-2.5"
            style={{ fontSize: 12, fontFamily: "var(--font-inter)" }}
          >
            <span style={{ color: "#6B6B72" }}>Step {step} of 4</span>
            <strong style={{ color: "#0D0D12", fontWeight: 600 }}>{STEPS[step - 1].label}</strong>
          </div>
          <div style={{ height: 4, background: "#E8E5E0", borderRadius: 100, overflow: "hidden" }}>
            <motion.div
              initial={false}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              style={{ height: "100%", borderRadius: 100, background: "linear-gradient(90deg, #7C3AED, #C026D3)" }}
            />
          </div>
        </div>

        {/* ── MAIN ── */}
        <main className="flex flex-col items-center" style={{ padding: "56px 24px" }}>

          {/* Form header */}
          <motion.div
            key={`header-${step}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="w-full mb-10"
            style={{ maxWidth: 600 }}
          >
            <div
              className="inline-flex items-center gap-1.5 mb-5"
              style={{
                background:    "rgba(124,58,237,0.08)",
                border:        "1px solid rgba(124,58,237,0.25)",
                color:         "#7C3AED",
                fontSize:       11,
                fontWeight:     600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding:       "5px 12px",
                borderRadius:   100,
                fontFamily:    "var(--font-inter)",
              }}
            >
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#7C3AED" }} />
              Step {step} of 4
            </div>
            <h1
              className="font-heading"
              style={{
                fontSize:      "clamp(28px, 4vw, 36px)",
                fontWeight:      800,
                letterSpacing: "-0.04em",
                lineHeight:     1.1,
                color:         "#0D0D12",
                marginBottom:    8,
                whiteSpace:    "pre-line",
              }}
            >
              {meta.title}
            </h1>
            <p
              style={{
                fontSize:    15,
                color:       "#6B6B72",
                lineHeight:  1.5,
                fontFamily: "var(--font-inter)",
              }}
            >
              {meta.subtitle}
            </p>
          </motion.div>

          {/* Form card */}
          <motion.div
            key={`card-${step}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.07 }}
            className="w-full"
            style={{
              maxWidth:    600,
              background: "#FFFFFF",
              border:     "1px solid #E8E5E0",
              borderRadius: 20,
              padding:     36,
              boxShadow:  "0 4px 24px rgba(0,0,0,0.05)",
            }}
          >
            <AnimatePresence mode="wait">

              {/* ── STEP 1 ── */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  {/* What do you sell */}
                  <FieldLabel>What do you sell?</FieldLabel>
                  <FieldHint>Describe your product or service in a few words</FieldHint>
                  <div className="relative">
                    <ShoppingBag className="w-4 h-4 absolute" style={{ left: 14, top: "50%", transform: "translateY(-50%)", color: "#A8A5A0" }} />
                    <input
                      type="text"
                      value={product}
                      onChange={(e) => setProduct(e.target.value)}
                      placeholder="e.g. Skincare products, Fashion brand, Online course"
                      style={INPUT_STYLE}
                      onFocus={focusInput}
                      onBlur={blurInput}
                    />
                  </div>

                  {/* Niche chips */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {NICHE_CHIPS.map((chip) => {
                      const selected = product === chip;
                      return (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => setProduct(chip)}
                          className="cursor-pointer transition-all"
                          style={{
                            padding:      "7px 14px",
                            borderRadius:  100,
                            border:        selected ? "1.5px solid #7C3AED" : "1.5px solid #E8E5E0",
                            background:    selected ? "rgba(124,58,237,0.08)" : "#FFFFFF",
                            color:         selected ? "#7C3AED" : "#6B6B72",
                            fontSize:       13,
                            fontWeight:     500,
                            fontFamily:   "var(--font-inter)",
                          }}
                          onMouseEnter={(e) => {
                            if (!selected) {
                              e.currentTarget.style.borderColor = "#7C3AED";
                              e.currentTarget.style.color       = "#7C3AED";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!selected) {
                              e.currentTarget.style.borderColor = "#E8E5E0";
                              e.currentTarget.style.color       = "#6B6B72";
                            }
                          }}
                        >
                          {chip}
                        </button>
                      );
                    })}
                  </div>

                  {/* Divider */}
                  <div style={{ height: 1, background: "#E8E5E0", margin: "28px 0" }} />

                  {/* Target Market */}
                  <FieldLabel>Target Market</FieldLabel>
                  <FieldHint>Which country are you running your ads in?</FieldHint>
                  <div className="relative">
                    <Globe className="w-4 h-4 absolute z-10 pointer-events-none" style={{ left: 14, top: "50%", transform: "translateY(-50%)", color: "#A8A5A0" }} />
                    <select
                      value={market}
                      onChange={(e) => setMarket(e.target.value)}
                      className="w-full appearance-none cursor-pointer"
                      style={{
                        ...INPUT_STYLE,
                        padding: "0 44px 0 44px",
                        color:    market ? "#0D0D12" : "#A8A5A0",
                      }}
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
                </motion.div>
              )}

              {/* ── STEP 2 ── */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-7">
                    {/* AOV */}
                    <div>
                      <FieldLabel>Average Order Value</FieldLabel>
                      <FieldHint>Revenue per order</FieldHint>
                      <div className="relative">
                        <span className="absolute" style={{ left: 14, top: "50%", transform: "translateY(-50%)", color: "#A8A5A0", fontSize: 15, fontFamily: "var(--font-inter)", fontWeight: 500 }}>$</span>
                        <input
                          type="number"
                          value={aov}
                          onChange={(e) => setAov(e.target.value)}
                          placeholder="75"
                          min="0"
                          style={{ ...INPUT_STYLE, padding: "0 16px 0 32px" }}
                          onFocus={focusInput}
                          onBlur={blurInput}
                        />
                      </div>
                    </div>

                    {/* COGS */}
                    <div>
                      <FieldLabel>Product Cost (COGS)</FieldLabel>
                      <FieldHint>Cost per unit</FieldHint>
                      <div className="relative">
                        <span className="absolute" style={{ left: 14, top: "50%", transform: "translateY(-50%)", color: "#A8A5A0", fontSize: 15, fontFamily: "var(--font-inter)", fontWeight: 500 }}>$</span>
                        <input
                          type="number"
                          value={cogs}
                          onChange={(e) => setCogs(e.target.value)}
                          placeholder="25"
                          min="0"
                          style={{ ...INPUT_STYLE, padding: "0 16px 0 32px" }}
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
                        animate={{ opacity: 1, height: "auto", marginBottom: 28 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        style={{ overflow: "hidden" }}
                      >
                        <div
                          style={{
                            padding:    "16px 20px",
                            borderRadius: 12,
                            background:  "rgba(124,58,237,0.06)",
                            border:      "1px solid rgba(124,58,237,0.20)",
                          }}
                        >
                          <p style={{ fontSize: 12, color: "#6B6B72", marginBottom: 4, fontFamily: "var(--font-inter)" }}>
                            Your break-even ROAS is
                          </p>
                          <p
                            className="font-heading"
                            style={{
                              fontSize:             32,
                              fontWeight:            800,
                              letterSpacing:        "-0.03em",
                              background:           "linear-gradient(135deg, #7C3AED, #C026D3)",
                              WebkitBackgroundClip: "text",
                              WebkitTextFillColor: "transparent",
                              backgroundClip:       "text",
                              lineHeight:           1,
                            }}
                          >
                            {breakEvenRoas}×
                          </p>
                          <p style={{ fontSize: 12, color: "#A8A5A0", marginTop: 6, fontFamily: "var(--font-inter)" }}>
                            Any campaign below this ROAS is losing money after product costs.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Target CPA */}
                  <FieldLabel>
                    Target CPA <span style={{ color: "#A8A5A0", fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
                  </FieldLabel>
                  <FieldHint>Cost per acquisition target — leave blank if unknown</FieldHint>
                  <div className="relative">
                    <span className="absolute" style={{ left: 14, top: "50%", transform: "translateY(-50%)", color: "#A8A5A0", fontSize: 15, fontFamily: "var(--font-inter)", fontWeight: 500 }}>$</span>
                    <input
                      type="number"
                      value={targetCpa}
                      onChange={(e) => setTargetCpa(e.target.value)}
                      placeholder="Leave blank if unknown"
                      min="0"
                      style={{ ...INPUT_STYLE, padding: "0 16px 0 32px" }}
                      onFocus={focusInput}
                      onBlur={blurInput}
                    />
                  </div>
                </motion.div>
              )}

              {/* ── STEP 3 ── */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col gap-3"
                >
                  {GOALS.map((opt) => {
                    const Icon = opt.icon;
                    const selected = mainGoal === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setMainGoal(opt.value)}
                        className="w-full flex items-center gap-4 text-left transition-all cursor-pointer"
                        style={{
                          padding:    "18px 20px",
                          borderRadius: 14,
                          border:       selected ? "1.5px solid #7C3AED" : "1.5px solid #E8E5E0",
                          background:   selected ? "rgba(124,58,237,0.06)" : "#FFFFFF",
                          boxShadow:    selected ? "0 0 0 3px rgba(124,58,237,0.08)" : "none",
                        }}
                        onMouseEnter={(e) => { if (!selected) (e.currentTarget as HTMLButtonElement).style.borderColor = "#D4D0CA"; }}
                        onMouseLeave={(e) => { if (!selected) (e.currentTarget as HTMLButtonElement).style.borderColor = "#E8E5E0"; }}
                      >
                        <div
                          className="flex-shrink-0 flex items-center justify-center"
                          style={{
                            width:        44,
                            height:       44,
                            borderRadius:  12,
                            background:  `${opt.color}18`,
                          }}
                        >
                          <Icon className="w-5 h-5" style={{ color: opt.color }} />
                        </div>
                        <span
                          style={{
                            fontSize:    15,
                            fontWeight:    500,
                            color:        selected ? "#0D0D12" : "#6B6B72",
                            fontFamily: "var(--font-inter)",
                          }}
                        >
                          {opt.value}
                        </span>
                        {selected && (
                          <Check className="w-5 h-5 ml-auto flex-shrink-0" style={{ color: "#7C3AED" }} />
                        )}
                      </button>
                    );
                  })}
                </motion.div>
              )}

              {/* ── STEP 4: Upload ── */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  {/* Summary banner */}
                  <div
                    className="mb-6 flex items-start gap-3"
                    style={{
                      padding:    "14px 18px",
                      borderRadius: 12,
                      background:  "rgba(124,58,237,0.06)",
                      border:      "1px solid rgba(124,58,237,0.20)",
                    }}
                  >
                    <div className="flex-shrink-0" style={{ width: 6, height: 6, borderRadius: "50%", background: "#7C3AED", marginTop: 7 }} />
                    <p style={{ fontSize: 13, color: "#0D0D12", lineHeight: 1.55, fontFamily: "var(--font-inter)" }}>
                      Analyzing for <strong style={{ color: "#7C3AED" }}>{market}</strong>
                      {" · "}AOV <strong style={{ color: "#7C3AED" }}>${aov}</strong>
                      {breakEvenRoas > 0 && <> · Break-even <strong style={{ color: "#7C3AED" }}>{breakEvenRoas}×</strong></>}
                      {" · "}Goal <strong style={{ color: "#7C3AED" }}>{mainGoal}</strong>
                    </p>
                  </div>

                  {/* Upload zone */}
                  <label
                    htmlFor="csv-upload-onboarding"
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    className={`relative flex flex-col items-center justify-center w-full cursor-pointer transition-all ${
                      isLoading ? "pointer-events-none opacity-60" : ""
                    }`}
                  >
                    <div
                      className="w-full flex flex-col items-center justify-center"
                      style={{
                        padding:    40,
                        border:    `2px dashed ${isDragging ? "#7C3AED" : "#D4D0CA"}`,
                        borderRadius: 14,
                        background:  isDragging ? "rgba(124,58,237,0.04)" : "#F7F5F2",
                        transition: "border-color 0.15s, background 0.15s",
                      }}
                    >
                      {fileName && !isLoading ? (
                        <div className="flex flex-col items-center gap-3">
                          <div className="flex items-center justify-center" style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(124,58,237,0.10)" }}>
                            <FileText className="w-7 h-7" style={{ color: "#7C3AED" }} />
                          </div>
                          <p className="font-heading" style={{ fontSize: 16, fontWeight: 600, color: "#0D0D12", letterSpacing: "-0.01em" }}>{fileName}</p>
                          <p style={{ fontSize: 13, color: "#A8A5A0", fontFamily: "var(--font-inter)" }}>Drop another file or click to replace</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <div className="flex items-center justify-center" style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(124,58,237,0.10)" }}>
                            <Upload className="w-7 h-7" style={{ color: "#7C3AED" }} />
                          </div>
                          <p className="font-heading" style={{ fontSize: 17, fontWeight: 700, color: "#0D0D12", letterSpacing: "-0.02em" }}>
                            Drop your Meta Ads CSV here
                          </p>
                          <p style={{ fontSize: 13, color: "#6B6B72", fontFamily: "var(--font-inter)" }}>
                            or click to browse — exports from Meta Ads Manager
                          </p>
                        </div>
                      )}
                    </div>
                    <input
                      id="csv-upload-onboarding"
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

                  {fileError && (
                    <div className="flex items-center justify-center gap-2 mt-3" style={{ fontSize: 13, color: "#DC2626", fontFamily: "var(--font-inter)" }}>
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {fileError}
                    </div>
                  )}

                  {/* Trust badges */}
                  <div className="flex flex-wrap items-center justify-center gap-5 mt-5">
                    {["No login required", "AI-powered insights", "Data stays private"].map((text) => (
                      <span key={text} className="flex items-center gap-1.5" style={{ fontSize: 12, color: "#A8A5A0", fontFamily: "var(--font-inter)" }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#16A34A" }} />
                        {text}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </motion.div>

          {/* Form footer */}
          <motion.div
            key={`footer-${step}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.14 }}
            className="w-full flex items-center justify-between mt-6"
            style={{ maxWidth: 600 }}
          >
            {step > 1 ? (
              <button
                type="button"
                onClick={goBack}
                disabled={isLoading}
                className="flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                style={{
                  fontSize:    14,
                  fontWeight:    500,
                  color:        "#6B6B72",
                  background:   "none",
                  border:       "none",
                  padding:      "10px 0",
                  fontFamily:  "var(--font-inter)",
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
                className="inline-flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  padding:       "14px 32px",
                  borderRadius:   12,
                  background:    "linear-gradient(135deg, #7C3AED, #C026D3)",
                  color:         "#FFFFFF",
                  fontSize:       15,
                  fontWeight:     600,
                  letterSpacing: "-0.01em",
                  boxShadow:     "0 4px 16px rgba(124,58,237,0.3)",
                  border:        "none",
                  fontFamily:   "var(--font-inter)",
                }}
                onMouseEnter={(e) => {
                  const btn = e.currentTarget as HTMLButtonElement;
                  if (!btn.disabled) {
                    btn.style.transform = "translateY(-1px)";
                    btn.style.boxShadow = "0 8px 24px rgba(124,58,237,0.38)";
                  }
                }}
                onMouseLeave={(e) => {
                  const btn = e.currentTarget as HTMLButtonElement;
                  btn.style.transform = "translateY(0)";
                  btn.style.boxShadow = "0 4px 16px rgba(124,58,237,0.3)";
                }}
              >
                {step === 3 ? "Continue to Upload" : "Continue"}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </motion.div>

        </main>
      </div>
    </section>
  );
}

/* ── Small helpers ─────────────────────────────────────── */

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label
      className="block"
      style={{
        fontSize:       11,
        fontWeight:      700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color:         "#0D0D12",
        marginBottom:    6,
        fontFamily:    "var(--font-inter)",
      }}
    >
      {children}
    </label>
  );
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mb-3"
      style={{
        fontSize:    13,
        color:       "#A8A5A0",
        fontFamily: "var(--font-inter)",
      }}
    >
      {children}
    </p>
  );
}
