"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  Globe,
  DollarSign,
  Clock,
  Calculator,
  Target,
  AlertTriangle,
  TrendingUp,
  Search,
  BarChart3,
  ArrowRight,
  ArrowLeft,
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
      "United States",
      "United Kingdom",
      "Canada",
      "Australia",
      "UAE",
      "Saudi Arabia",
      "Morocco",
      "Algeria",
      "Egypt",
      "France",
      "Germany",
      "Spain",
      "Italy",
      "Netherlands",
    ],
  },
  {
    label: "── All Countries (A–Z) ──",
    options: [
      "Afghanistan",
      "Albania",
      "Algeria",
      "Andorra",
      "Angola",
      "Antigua and Barbuda",
      "Argentina",
      "Armenia",
      "Australia",
      "Austria",
      "Azerbaijan",
      "Bahamas",
      "Bahrain",
      "Bangladesh",
      "Barbados",
      "Belarus",
      "Belgium",
      "Belize",
      "Benin",
      "Bhutan",
      "Bolivia",
      "Bosnia and Herzegovina",
      "Botswana",
      "Brazil",
      "Brunei",
      "Bulgaria",
      "Burkina Faso",
      "Burundi",
      "Cabo Verde",
      "Cambodia",
      "Cameroon",
      "Canada",
      "Central African Republic",
      "Chad",
      "Chile",
      "China",
      "Colombia",
      "Comoros",
      "Costa Rica",
      "Croatia",
      "Cuba",
      "Cyprus",
      "Czech Republic",
      "Denmark",
      "Djibouti",
      "Dominica",
      "Dominican Republic",
      "DR Congo",
      "Ecuador",
      "Egypt",
      "El Salvador",
      "Equatorial Guinea",
      "Eritrea",
      "Estonia",
      "Eswatini",
      "Ethiopia",
      "Fiji",
      "Finland",
      "France",
      "Gabon",
      "Gambia",
      "Georgia",
      "Germany",
      "Ghana",
      "Greece",
      "Grenada",
      "Guatemala",
      "Guinea",
      "Guinea-Bissau",
      "Guyana",
      "Haiti",
      "Honduras",
      "Hungary",
      "Iceland",
      "India",
      "Indonesia",
      "Iran",
      "Iraq",
      "Ireland",
      "Israel",
      "Italy",
      "Jamaica",
      "Japan",
      "Jordan",
      "Kazakhstan",
      "Kenya",
      "Kiribati",
      "Kuwait",
      "Kyrgyzstan",
      "Laos",
      "Latvia",
      "Lebanon",
      "Lesotho",
      "Liberia",
      "Libya",
      "Liechtenstein",
      "Lithuania",
      "Luxembourg",
      "Madagascar",
      "Malawi",
      "Malaysia",
      "Maldives",
      "Mali",
      "Malta",
      "Marshall Islands",
      "Mauritania",
      "Mauritius",
      "Mexico",
      "Micronesia",
      "Moldova",
      "Monaco",
      "Mongolia",
      "Montenegro",
      "Morocco",
      "Mozambique",
      "Myanmar",
      "Namibia",
      "Nauru",
      "Nepal",
      "Netherlands",
      "New Zealand",
      "Nicaragua",
      "Niger",
      "Nigeria",
      "North Korea",
      "North Macedonia",
      "Norway",
      "Oman",
      "Pakistan",
      "Palau",
      "Palestine",
      "Panama",
      "Papua New Guinea",
      "Paraguay",
      "Peru",
      "Philippines",
      "Poland",
      "Portugal",
      "Qatar",
      "Romania",
      "Russia",
      "Rwanda",
      "Saint Kitts and Nevis",
      "Saint Lucia",
      "Saint Vincent and the Grenadines",
      "Samoa",
      "San Marino",
      "Sao Tome and Principe",
      "Saudi Arabia",
      "Senegal",
      "Serbia",
      "Seychelles",
      "Sierra Leone",
      "Singapore",
      "Slovakia",
      "Slovenia",
      "Solomon Islands",
      "Somalia",
      "South Africa",
      "South Korea",
      "South Sudan",
      "Spain",
      "Sri Lanka",
      "Sudan",
      "Suriname",
      "Sweden",
      "Switzerland",
      "Syria",
      "Taiwan",
      "Tajikistan",
      "Tanzania",
      "Thailand",
      "Timor-Leste",
      "Togo",
      "Tonga",
      "Trinidad and Tobago",
      "Tunisia",
      "Turkey",
      "Turkmenistan",
      "Tuvalu",
      "UAE",
      "Uganda",
      "Ukraine",
      "United Kingdom",
      "United States",
      "Uruguay",
      "Uzbekistan",
      "Vanuatu",
      "Vatican City",
      "Venezuela",
      "Vietnam",
      "Yemen",
      "Zambia",
      "Zimbabwe",
    ],
  },
];
const BUDGETS = ["Under $1K", "$1K-$5K", "$5K-$20K", "$20K+"];
const EXPERIENCE = ["Less than 3 months", "3-12 months", "1-3 years", "3+ years"];

const GOALS = [
  { value: "Lower my CPA", icon: TrendingUp, color: "#059669" },
  { value: "Scale my winning campaigns", icon: BarChart3, color: "#6c5ce7" },
  { value: "Find what's wasting money", icon: Search, color: "#e17055" },
  { value: "Understand my overall performance", icon: Target, color: "#0984e3" },
];

const CHALLENGES = [
  { value: "My ROAS is too low", icon: AlertTriangle, color: "#dc2626" },
  { value: "I don't know which campaigns to scale", icon: BarChart3, color: "#7c3aed" },
  { value: "My costs keep rising", icon: TrendingUp, color: "#ea580c" },
  { value: "I'm not getting enough conversions", icon: Target, color: "#2563eb" },
];

/* ── Props ─────────────────────────────────────────────── */

interface OnboardingFormProps {
  onComplete: (data: OnboardingData) => void;
  onFileSelected: (file: File) => void;
  isLoading: boolean;
}

/* ── Slide animation variants ──────────────────────────── */

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
};

/* ── Select component ──────────────────────────────────── */

function Select({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 rounded-xl border border-card-border bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple/30 focus:border-purple/50 transition-all appearance-none cursor-pointer"
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center" }}
    >
      <option value="" disabled>{placeholder}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

/* ── Grouped select (with <optgroup>) ─────────────────── */

function GroupedSelect({
  value,
  onChange,
  groups,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  groups: { label: string; options: string[] }[];
  placeholder: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 rounded-xl border border-card-border bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple/30 focus:border-purple/50 transition-all appearance-none cursor-pointer"
      style={{
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 14px center",
      }}
    >
      <option value="" disabled>{placeholder}</option>
      {groups.map((group) => (
        <optgroup key={group.label} label={group.label}>
          {group.options.map((o) => (
            <option key={`${group.label}-${o}`} value={o}>{o}</option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

/* ── Radio group ───────────────────────────────────────── */

function RadioGroup({
  options,
  value,
  onChange,
}: {
  options: { value: string; icon: React.ElementType; color: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {options.map((opt) => {
        const Icon = opt.icon;
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
              selected
                ? "border-purple bg-purple/5 shadow-sm"
                : "border-card-border bg-white hover:border-purple/30"
            }`}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${opt.color}15` }}
            >
              <Icon className="w-4 h-4" style={{ color: opt.color }} />
            </div>
            <span className={`text-sm font-medium ${selected ? "text-foreground" : "text-muted"}`}>
              {opt.value}
            </span>
            {selected && (
              <Check className="w-4 h-4 text-purple ml-auto flex-shrink-0" />
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ── Main component ────────────────────────────────────── */

export default function OnboardingForm({ onComplete, onFileSelected, isLoading }: OnboardingFormProps) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);

  // Step 1
  const [product, setProduct] = useState("");
  const [market, setMarket] = useState("");
  const [monthlyBudget, setMonthlyBudget] = useState("");
  const [adExperience, setAdExperience] = useState("");

  // Step 2
  const [aov, setAov] = useState("");
  const [cogs, setCogs] = useState("");
  const [targetCpa, setTargetCpa] = useState("");
  const [currentRoas, setCurrentRoas] = useState("");

  // Step 3
  const [mainGoal, setMainGoal] = useState("");
  const [biggestChallenge, setBiggestChallenge] = useState("");
  const [focusCampaigns, setFocusCampaigns] = useState("");

  // Upload
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Break-even ROAS
  const breakEvenRoas = useMemo(() => {
    const a = parseFloat(aov);
    const c = parseFloat(cogs);
    if (!a || a <= 0 || !c || c <= 0 || c >= a) return 0;
    return Number((a / (a - c)).toFixed(2));
  }, [aov, cogs]);

  // Step validation
  const step1Valid = product.trim() && market && monthlyBudget && adExperience;
  const step2Valid = parseFloat(aov) > 0 && parseFloat(cogs) > 0;
  const step3Valid = mainGoal && biggestChallenge;

  function goNext() {
    setDirection(1);
    setStep((s) => Math.min(s + 1, 4));
  }

  function goBack() {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 1));
  }

  function buildOnboardingData(): OnboardingData {
    return {
      product: product.trim(),
      market,
      monthlyBudget,
      adExperience,
      aov: parseFloat(aov) || 0,
      cogs: parseFloat(cogs) || 0,
      breakEvenRoas,
      targetCpa: parseFloat(targetCpa) || 0,
      currentRoas: parseFloat(currentRoas) || 0,
      mainGoal,
      biggestChallenge,
      focusCampaigns: focusCampaigns.trim(),
    };
  }

  const handleFile = useCallback(
    (file: File) => {
      setFileError(null);
      if (!file.name.endsWith(".csv")) {
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
    [product, market, monthlyBudget, adExperience, aov, cogs, targetCpa, currentRoas, mainGoal, biggestChallenge, focusCampaigns, breakEvenRoas],
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
    <section className="relative py-16 px-6">
      <div className="max-w-xl mx-auto">
        {/* Progress bar */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-3">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step >= s
                      ? "bg-purple text-white shadow-md shadow-purple/20"
                      : "bg-gray-100 text-muted"
                  }`}
                >
                  {step > s ? <Check className="w-4 h-4" /> : s}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${step >= s ? "text-foreground" : "text-muted"}`}>
                  {s === 1 ? "Business" : s === 2 ? "Numbers" : s === 3 ? "Goals" : "Upload"}
                </span>
              </div>
            ))}
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple to-teal rounded-full"
              initial={false}
              animate={{ width: `${((step - 1) / 3) * 100}%` }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <p className="text-xs text-muted mt-2 text-center">
            Step {Math.min(step, 3)} of 3{step === 4 ? " — Upload your data" : ""}
          </p>
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait" custom={direction}>
          {/* ── STEP 1 ────────────────────────────── */}
          {step === 1 && (
            <motion.div
              key="step1"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white rounded-2xl border border-card-border shadow-lg p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-purple/10 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-purple" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-semibold text-foreground">About Your Business</h3>
                  <p className="text-muted text-sm">Help us tailor the analysis to your market</p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">What do you sell?</label>
                  <div className="relative">
                    <ShoppingBag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input
                      type="text"
                      value={product}
                      onChange={(e) => setProduct(e.target.value)}
                      placeholder="e.g. Skincare products, Fashion brand, Online course"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-card-border bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple/30 focus:border-purple/50 transition-all placeholder:text-muted/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    <Globe className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5 text-muted" />
                    Target market
                  </label>
                  <GroupedSelect value={market} onChange={setMarket} groups={MARKET_GROUPS} placeholder="Select your market" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    <DollarSign className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5 text-muted" />
                    Monthly ad budget
                  </label>
                  <Select value={monthlyBudget} onChange={setMonthlyBudget} options={BUDGETS} placeholder="Select budget range" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    <Clock className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5 text-muted" />
                    Meta Ads experience
                  </label>
                  <Select value={adExperience} onChange={setAdExperience} options={EXPERIENCE} placeholder="How long have you been running ads?" />
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <button
                  onClick={goNext}
                  disabled={!step1Valid}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple text-white text-sm font-medium transition-all hover:shadow-lg hover:shadow-purple/20 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none cursor-pointer"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 2 ────────────────────────────── */}
          {step === 2 && (
            <motion.div
              key="step2"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white rounded-2xl border border-card-border shadow-lg p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-purple/10 flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-purple" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-semibold text-foreground">Your Numbers</h3>
                  <p className="text-muted text-sm">We'll calculate your break-even point</p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Average Order Value</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted text-sm font-medium">$</span>
                      <input
                        type="number"
                        value={aov}
                        onChange={(e) => setAov(e.target.value)}
                        placeholder="75"
                        min="0"
                        className="w-full pl-8 pr-4 py-3 rounded-xl border border-card-border bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple/30 focus:border-purple/50 transition-all placeholder:text-muted/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Product Cost / COGS</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted text-sm font-medium">$</span>
                      <input
                        type="number"
                        value={cogs}
                        onChange={(e) => setCogs(e.target.value)}
                        placeholder="25"
                        min="0"
                        className="w-full pl-8 pr-4 py-3 rounded-xl border border-card-border bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple/30 focus:border-purple/50 transition-all placeholder:text-muted/50"
                      />
                    </div>
                  </div>
                </div>

                {/* Break-even ROAS display */}
                <AnimatePresence>
                  {breakEvenRoas > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-5 py-4 rounded-xl bg-purple/5 border-2 border-purple/20"
                    >
                      <p className="text-sm text-muted mb-1">Your break-even ROAS is</p>
                      <p className="text-3xl font-bold text-purple">{breakEvenRoas}x</p>
                      <p className="text-xs text-muted mt-1">
                        Any campaign below this ROAS is losing money after product costs.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Target CPA</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted text-sm font-medium">$</span>
                    <input
                      type="number"
                      value={targetCpa}
                      onChange={(e) => setTargetCpa(e.target.value)}
                      placeholder="Leave blank if unknown"
                      min="0"
                      className="w-full pl-8 pr-4 py-3 rounded-xl border border-card-border bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple/30 focus:border-purple/50 transition-all placeholder:text-muted/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Current average ROAS <span className="text-muted font-normal">(optional)</span></label>
                  <div className="relative">
                    <input
                      type="number"
                      value={currentRoas}
                      onChange={(e) => setCurrentRoas(e.target.value)}
                      placeholder="e.g. 2.5"
                      min="0"
                      step="0.1"
                      className="w-full pl-4 pr-8 py-3 rounded-xl border border-card-border bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple/30 focus:border-purple/50 transition-all placeholder:text-muted/50"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted text-sm font-medium">x</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <button
                  onClick={goBack}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-foreground border border-card-border hover:border-purple/30 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  onClick={goNext}
                  disabled={!step2Valid}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple text-white text-sm font-medium transition-all hover:shadow-lg hover:shadow-purple/20 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none cursor-pointer"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 3 ────────────────────────────── */}
          {step === 3 && (
            <motion.div
              key="step3"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white rounded-2xl border border-card-border shadow-lg p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-purple/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-purple" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-semibold text-foreground">Your Goals</h3>
                  <p className="text-muted text-sm">We'll prioritize recommendations around these</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">What is your main goal right now?</label>
                  <RadioGroup options={GOALS} value={mainGoal} onChange={setMainGoal} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">What is your biggest challenge?</label>
                  <RadioGroup options={CHALLENGES} value={biggestChallenge} onChange={setBiggestChallenge} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Any specific campaigns to focus on? <span className="text-muted font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={focusCampaigns}
                    onChange={(e) => setFocusCampaigns(e.target.value)}
                    placeholder="e.g. Summer Sale, Retargeting BOF"
                    className="w-full px-4 py-3 rounded-xl border border-card-border bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple/30 focus:border-purple/50 transition-all placeholder:text-muted/50"
                  />
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <button
                  onClick={goBack}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-foreground border border-card-border hover:border-purple/30 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  onClick={goNext}
                  disabled={!step3Valid}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple text-white text-sm font-medium transition-all hover:shadow-lg hover:shadow-purple/20 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none cursor-pointer"
                >
                  Continue to Upload
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 4: Upload ────────────────────── */}
          {step === 4 && (
            <motion.div
              key="step4"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Summary banner */}
              <div className="mb-6 px-5 py-4 rounded-xl bg-purple/5 border border-purple/20">
                <p className="text-sm text-foreground font-medium">
                  Analyzing for <span className="text-purple font-semibold">{market}</span>
                  {" | "}AOV: <span className="text-purple font-semibold">${aov}</span>
                  {breakEvenRoas > 0 && <> | Break-even ROAS: <span className="text-purple font-semibold">{breakEvenRoas}x</span></>}
                  {" | "}Goal: <span className="text-purple font-semibold">{mainGoal}</span>
                </p>
              </div>

              {/* Upload zone */}
              <div className="bg-white rounded-2xl border border-card-border shadow-lg overflow-hidden">
                <label
                  htmlFor="csv-upload-onboarding"
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  className={`relative flex flex-col items-center justify-center w-full cursor-pointer transition-all ${
                    isLoading ? "pointer-events-none opacity-60" : ""
                  }`}
                >
                  <div className={`w-full p-10 m-4 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-colors duration-300 ${
                    isDragging ? "border-purple/60 bg-purple/5" : "border-card-border"
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
                  <div className="flex items-center justify-center gap-2 px-6 pb-5 text-red-500 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {fileError}
                  </div>
                )}
              </div>

              <div className="flex justify-start mt-6">
                <button
                  onClick={goBack}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-foreground border border-card-border hover:border-purple/30 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 mt-6">
                {["No login required", "AI-powered insights", "Data stays private"].map((text) => (
                  <span key={text} className="flex items-center gap-2 text-muted text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-green flex-shrink-0" />
                    {text}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
