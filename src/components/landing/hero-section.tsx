"use client";

import { Play, ArrowRight } from "lucide-react";
import FadeIn from "@/components/fade-in";

interface HeroSectionProps {
  onCtaClick: () => void;
}

export default function HeroSection({ onCtaClick }: HeroSectionProps) {
  return (
    <section style={{ background: "#F7F5F2" }}>

      {/* ── Hero copy ── */}
      <div
        className="flex flex-col items-center text-center mx-auto px-6"
        style={{ maxWidth: 900, paddingTop: 80, paddingBottom: 60 }}
      >

        {/* Headline */}
        <FadeIn delay={0.05}>
          <h1
            className="font-heading"
            style={{
              fontSize:      "clamp(44px, 5.5vw, 76px)",
              fontWeight:     800,
              lineHeight:     1.05,
              letterSpacing: "-0.04em",
              color:         "#0D0D12",
              maxWidth:       750,
              margin:        "0 auto 24px",
            }}
          >
            The AI Media Buyer
            <br />
            for Meta Ads.
          </h1>
        </FadeIn>

        {/* Subhead */}
        <FadeIn delay={0.15}>
          <p
            style={{
              fontSize:    18,
              fontWeight:  400,
              lineHeight:  1.65,
              color:       "#6B6B72",
              maxWidth:    540,
              marginBottom: 40,
              fontFamily:  "var(--font-inter)",
            }}
          >
            Upload your Meta Ads CSV and get a complete diagnosis in 60 seconds —
            what to kill, what to scale, and exactly why. No agency. No guesswork.
          </p>
        </FadeIn>

        {/* CTAs */}
        <FadeIn delay={0.25}>
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
            style={{ marginBottom: 16 }}
          >
            {/* Primary */}
            <button
              onClick={onCtaClick}
              className="inline-flex items-center gap-2.5 text-white font-semibold cursor-pointer"
              style={{
                padding:       "16px 36px",
                borderRadius:   12,
                background:    "linear-gradient(135deg, #7C3AED, #C026D3)",
                fontSize:       16,
                letterSpacing: "-0.01em",
                fontFamily:    "var(--font-inter)",
                boxShadow:     "0 4px 20px rgba(124,58,237,0.3)",
                border:        "none",
                transition:    "opacity 0.15s, transform 0.15s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.opacity   = "0.92";
                b.style.transform = "translateY(-2px)";
                b.style.boxShadow = "0 8px 28px rgba(124,58,237,0.35)";
              }}
              onMouseLeave={(e) => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.opacity   = "1";
                b.style.transform = "translateY(0)";
                b.style.boxShadow = "0 4px 20px rgba(124,58,237,0.3)";
              }}
            >
              Start Free Trial
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Secondary */}
            <button
              onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
              className="inline-flex items-center gap-2 font-medium cursor-pointer"
              style={{
                padding:       "16px 32px",
                borderRadius:   12,
                background:    "#ffffff",
                border:        "1.5px solid #E2E0DA",
                fontSize:       16,
                letterSpacing: "-0.01em",
                color:         "#0D0D12",
                fontFamily:    "var(--font-inter)",
                transition:    "border-color 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={(e) => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.borderColor = "#B0ADAA";
                b.style.boxShadow   = "0 2px 8px rgba(0,0,0,0.06)";
              }}
              onMouseLeave={(e) => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.borderColor = "#E2E0DA";
                b.style.boxShadow   = "none";
              }}
            >
              <Play className="w-4 h-4" fill="currentColor" />
              See how it works
            </button>
          </div>
        </FadeIn>

        {/* Trust text */}
        <FadeIn delay={0.30}>
          <p
            style={{
              fontSize:   13,
              color:      "#A8A5A0",
              fontFamily: "var(--font-inter)",
            }}
          >
            No credit card required · Free analysis on your first account
          </p>
        </FadeIn>

        {/* Proof pill */}
        <div style={{display:"inline-flex",alignItems:"center",gap:10,background:"#0D0D12",color:"#fff",borderRadius:100,padding:"11px 22px",fontSize:13,marginTop:32}}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{opacity:0.6,flexShrink:0}}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Built by media buyers who&apos;ve managed <strong style={{fontWeight:600,background:"linear-gradient(90deg,#A78BFA,#E879F9)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>&nbsp;$70M+&nbsp;</strong> in ad spend
        </div>

      </div>

      {/* Product preview */}
      <div style={{padding:"0 24px 80px",maxWidth:1000,margin:"0 auto"}}>
        <div style={{background:"#fff",border:"1px solid #E8E5E0",borderRadius:20,padding:2,boxShadow:"0 20px 60px rgba(0,0,0,0.08),0 4px 16px rgba(0,0,0,0.04)",overflow:"hidden"}}>
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"12px 16px",borderBottom:"1px solid #F0EDE8"}}>
            <div style={{width:10,height:10,borderRadius:"50%",background:"#FF5F57"}}></div>
            <div style={{width:10,height:10,borderRadius:"50%",background:"#FFBD2E"}}></div>
            <div style={{width:10,height:10,borderRadius:"50%",background:"#28C940"}}></div>
          </div>
          <div style={{padding:24,display:"grid",gridTemplateColumns:"240px 1fr",gap:16,minHeight:320}}>
            <div style={{background:"#F7F5F2",borderRadius:12,padding:16}}>
              <p style={{fontSize:10,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",color:"#A8A5A0",marginBottom:12}}>Account overview</p>
              <div style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid #EDE9E3"}}><span style={{fontSize:13,color:"#6B6B72"}}>Total spend</span><span style={{fontSize:13,fontWeight:600}}>$4,820</span></div>
              <div style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid #EDE9E3"}}><span style={{fontSize:13,color:"#6B6B72"}}>Avg. ROAS</span><span style={{fontSize:13,fontWeight:600,color:"#16A34A"}}>3.2×</span></div>
              <div style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid #EDE9E3"}}><span style={{fontSize:13,color:"#6B6B72"}}>CPP</span><span style={{fontSize:13,fontWeight:600,color:"#DC2626"}}>$38.40</span></div>
              <div style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid #EDE9E3"}}><span style={{fontSize:13,color:"#6B6B72"}}>Wasted budget</span><span style={{fontSize:13,fontWeight:600,color:"#DC2626"}}>$1,140</span></div>
              <div style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid #EDE9E3"}}><span style={{fontSize:13,color:"#6B6B72"}}>Active ad sets</span><span style={{fontSize:13,fontWeight:600}}>14</span></div>
              <div style={{display:"flex",justifyContent:"space-between",padding:"9px 0"}}><span style={{fontSize:13,color:"#6B6B72"}}>Health score</span><span style={{fontSize:13,fontWeight:600,color:"#D97706"}}>62 / 100</span></div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div style={{background:"#F7F5F2",borderRadius:12,padding:"16px 20px",display:"flex",alignItems:"flex-start",gap:12}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:"#DC2626",marginTop:5,flexShrink:0}}></div>
                <div><p style={{fontSize:13,fontWeight:600,marginBottom:4}}>Ad Set &quot;Lookalike 2% — Cold&quot; is bleeding budget</p><p style={{fontSize:12,color:"#6B6B72",lineHeight:1.5}}>$640 spent in 7 days. 0 purchases. CPM is 3× account average. Audience likely saturated.</p><span style={{display:"inline-block",marginTop:8,fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:6,background:"#FEE2E2",color:"#991B1B"}}>→ Pause immediately</span></div>
              </div>
              <div style={{background:"#F7F5F2",borderRadius:12,padding:"16px 20px",display:"flex",alignItems:"flex-start",gap:12}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:"#16A34A",marginTop:5,flexShrink:0}}></div>
                <div><p style={{fontSize:13,fontWeight:600,marginBottom:4}}>&quot;Retargeting — Viewers 7d&quot; has room to scale</p><p style={{fontSize:12,color:"#6B6B72",lineHeight:1.5}}>ROAS 5.8× on $320 spend. Frequency still low at 1.4. Budget is too conservative.</p><span style={{display:"inline-block",marginTop:8,fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:6,background:"#DCFCE7",color:"#14532D"}}>→ Scale budget 2×</span></div>
              </div>
              <div style={{background:"#F7F5F2",borderRadius:12,padding:"16px 20px",display:"flex",alignItems:"flex-start",gap:12}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:"#D97706",marginTop:5,flexShrink:0}}></div>
                <div><p style={{fontSize:13,fontWeight:600,marginBottom:4}}>Creative fatigue detected across 3 ad sets</p><p style={{fontSize:12,color:"#6B6B72",lineHeight:1.5}}>CTR dropped 40% week-over-week. Same creative running 18 days. Refresh needed.</p><span style={{display:"inline-block",marginTop:8,fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:6,background:"#FEF3C7",color:"#78350F"}}>→ Refresh creatives</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}
