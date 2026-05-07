export interface CampaignRow {
  campaignName: string;
  adSetName: string;
  adName: string;
  objective: string;
  resultIndicator: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  conversions: number;
  purchases: number;
  costPerResult: number;
  revenue: number;
  roas: number;
  reach: number;
  frequency: number;
  [key: string]: string | number;
}

export type CampaignObjective = "TRAFFIC" | "CONVERSIONS" | "LEADS" | "ENGAGEMENT" | "UNKNOWN";

export interface CampaignSummary {
  campaignName: string;
  objective: CampaignObjective;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
  purchases: number;
  revenue: number;
  roas: number;
  costPerResult: number;
}

export interface BattlePlanDay {
  day: number;
  title: string;
  action: string;
  effort: "Quick Win" | "Strategic" | "Monitor";
}

export interface AnalysisResult {
  summaries: CampaignSummary[];
  summary: string;
  score: number;
  winners: string[];
  killers: string[];
  recommendations: string[];
  battlePlan: BattlePlanDay[];
  insights: string[];
  totalSpend: number;
  totalRevenue: number;
  /** Results from Conversion-objective campaigns only */
  convResults: number;
  /** Avg Cost Per Result from Conversion-objective campaigns only */
  convAvgCPR: number;
  /** Best ROAS from Conversion-objective campaigns only */
  convBestRoas: number;
  analysisMode: "roas" | "traffic";
}

export interface OnboardingData {
  // Step 1
  product: string;
  market: string;
  monthlyBudget: string;
  adExperience: string;
  // Step 2
  aov: number;
  cogs: number;
  breakEvenRoas: number;
  targetCpa: number;
  currentRoas: number;
  // Step 3
  mainGoal: string;
  biggestChallenge: string;
  focusCampaigns: string;
}

// Common Meta Ads CSV column name mappings
export const COLUMN_MAP: Record<string, string> = {
  "campaign name": "campaignName",
  "campaign_name": "campaignName",
  campaign: "campaignName",
  "ad set name": "adSetName",
  "adset name": "adSetName",
  "adset_name": "adSetName",
  "ad name": "adName",
  "ad_name": "adName",
  "amount spent (usd)": "spend",
  "amount spent": "spend",
  spend: "spend",
  cost: "spend",
  impressions: "impressions",
  clicks: "clicks",
  "link clicks": "clicks",
  ctr: "ctr",
  "ctr (link click-through rate)": "ctr",
  "ctr (all)": "ctr",
  "cost per click (all)": "cpc",
  "cost per link click": "cpc",
  "cpc (cost per link click) (usd)": "cpc",
  "cpc (all)": "cpc",
  cpc: "cpc",
  cpm: "cpm",
  "cpm (cost per 1,000 impressions)": "cpm",
  "cpm (cost per 1,000 impressions) (usd)": "cpm",
  results: "conversions",
  conversions: "conversions",
  purchases: "purchases",
  "website purchases": "purchases",
  "total purchases": "purchases",
  "cost per result": "costPerResult",
  "cost per results": "costPerResult",
  "cost per purchase": "costPerResult",
  "result indicator": "resultIndicator",
  "purchase roas": "roas",
  roas: "roas",
  "website purchase roas": "roas",
  "conversion value": "revenue",
  "purchase conversion value": "revenue",
  "website purchases conversion value": "revenue",
  revenue: "revenue",
  reach: "reach",
  frequency: "frequency",
  objective: "objective",
  "campaign objective": "objective",
  "campaign_objective": "objective",
  goal: "objective",
  "campaign goal": "objective",
  "optimization goal": "objective",
  "optimization_goal": "objective",
  "delivery optimization": "objective",
};
