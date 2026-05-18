"use client";

import { Play, ArrowRight } from "lucide-react";
import FadeIn from "@/components/fade-in";

interface HeroSectionProps {
  onCtaClick: () => void;
}

export default function HeroSection({ onCtaClick }: HeroSectionProps) {
  return (
    <section style={{ background: "transparent" }}>

      {/* ── Hero copy ── */}
      <div
        className="flex flex-col items-center text-center mx-auto px-6"
        style={{ maxWidth: 960, paddingTop: 96, paddingBottom: 64 }}
      >

        {/* Headline */}
        <FadeIn delay={0.05}>
          <h1
            className="font-heading"
            style={{
              fontSize:      "clamp(52px, 8vw, 88px)",
              fontWeight:     900,
              lineHeight:     1.03,
              letterSpacing: "-0.04em",
              color:         "#0D0D12",
              maxWidth:       820,
              marginLeft:    "auto",
              marginRight:   "auto",
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
              fontSize:    "clamp(15px, 2vw, 18px)",
              fontWeight:  400,
              lineHeight:  1.65,
              color:       "#6B6B72",
              maxWidth:    520,
              marginTop:   24,
              marginBottom: 40,
              fontFamily:  "var(--font-inter)",
            }}
          >
            Upload your Meta Ads CSV and get a complete diagnosis in 60 seconds — what to kill, what to scale, and AI-generated creatives to replace them. No agency. No guesswork.
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
                padding:       "17px 40px",
                borderRadius:   100,
                background:    "linear-gradient(135deg, #FF3CAC 0%, #FF6B35 100%)",
                fontSize:       16,
                letterSpacing: "-0.01em",
                fontFamily:    "var(--font-inter)",
                boxShadow:     "0 4px 24px rgba(255, 60, 172, 0.38)",
                border:        "none",
                transition:    "opacity 0.15s, transform 0.15s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.opacity   = "0.92";
                b.style.transform = "translateY(-2px)";
                b.style.boxShadow = "0 10px 32px rgba(255, 60, 172, 0.48)";
              }}
              onMouseLeave={(e) => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.opacity   = "1";
                b.style.transform = "translateY(0)";
                b.style.boxShadow = "0 4px 24px rgba(255, 60, 172, 0.38)";
              }}
            >
              Start Free Trial
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Secondary */}
            <button
              onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
              className="inline-flex items-center gap-2 font-semibold cursor-pointer"
              style={{
                padding:       "17px 36px",
                borderRadius:   100,
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
                b.style.boxShadow   = "0 2px 10px rgba(0,0,0,0.07)";
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
        <div style={{display:"inline-flex",alignItems:"center",gap:10,background:"#0D0D12",color:"#fff",borderRadius:20,padding:"10px 18px",marginTop:32}}>
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{opacity:0.6,flexShrink:0}}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <div style={{textAlign:"center",lineHeight:1.4}}>
            <div style={{fontSize:12,whiteSpace:"nowrap"}}>Built by media buyers who&apos;ve managed&nbsp;<strong style={{fontWeight:700,background:"linear-gradient(90deg,#FF3CAC,#FF6B35)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>$70M+</strong></div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.5)"}}>in ad spend</div>
          </div>
        </div>

      </div>

      {/* Product preview */}
      <div className="px-4 sm:px-6" style={{paddingBottom:80,maxWidth:1040,margin:"0 auto"}}>
        <div style={{background:"#fff",border:"1px solid #E8E5E0",borderRadius:20,padding:2,boxShadow:"0 24px 64px rgba(0,0,0,0.09),0 4px 16px rgba(0,0,0,0.04)",overflow:"hidden"}}>
          {/* Browser chrome */}
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"12px 16px",borderBottom:"1px solid #F0EDE8"}}>
            <div style={{width:10,height:10,borderRadius:"50%",background:"#FF5F57"}}></div>
            <div style={{width:10,height:10,borderRadius:"50%",background:"#FFBD2E"}}></div>
            <div style={{width:10,height:10,borderRadius:"50%",background:"#28C940"}}></div>
          </div>
          {/* Content — sidebar stacks below on mobile */}
          <div className="flex flex-col md:flex-row gap-4 p-4 md:p-6">
            {/* Sidebar */}
            <div className="md:w-56 flex-shrink-0" style={{background:"#F7F5F2",borderRadius:12,padding:16}}>
              <p style={{fontSize:10,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",color:"#A8A5A0",marginBottom:12}}>Account overview</p>
              {[
                {label:"Total spend",  val:"$4,820",   color:undefined},
                {label:"Avg. ROAS",    val:"3.2×",     color:"#16A34A"},
                {label:"CPP",          val:"$38.40",   color:"#DC2626"},
                {label:"Wasted spend", val:"$1,140",   color:"#DC2626"},
                {label:"Active ad sets",val:"14",      color:undefined},
                {label:"Health score", val:"62 / 100", color:"#D97706"},
              ].map((row, i, arr) => (
                <div key={row.label} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom: i < arr.length-1 ? "1px solid #EDE9E3" : "none"}}>
                  <span style={{fontSize:12,color:"#6B6B72"}}>{row.label}</span>
                  <span style={{fontSize:12,fontWeight:600,color:row.color ?? "#0D0D12"}}>{row.val}</span>
                </div>
              ))}
            </div>
            {/* Diagnosis cards */}
            <div className="flex-1 flex flex-col gap-3">
              {[
                {dot:"#DC2626", title:'Ad Set "Lookalike 2% — Cold" is bleeding budget', body:"$640 spent in 7 days. 0 purchases. CPM is 3× account average. Audience likely saturated.", tag:"→ Pause immediately", tagBg:"#FEE2E2", tagColor:"#991B1B"},
                {dot:"#16A34A", title:'"Retargeting — Viewers 7d" has room to scale', body:"ROAS 5.8× on $320 spend. Frequency still low at 1.4. Budget is too conservative.", tag:"→ Scale budget 2×", tagBg:"#DCFCE7", tagColor:"#14532D"},
                {dot:"#D97706", title:"Creative fatigue detected across 3 ad sets", body:"CTR dropped 40% week-over-week. Same creative running 18 days. Refresh needed.", tag:"→ Refresh creatives", tagBg:"#FEF3C7", tagColor:"#78350F"},
              ].map(card => (
                <div key={card.tag} style={{background:"#F7F5F2",borderRadius:12,padding:"14px 18px",display:"flex",alignItems:"flex-start",gap:12}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:card.dot,marginTop:5,flexShrink:0}}></div>
                  <div>
                    <p style={{fontSize:13,fontWeight:600,marginBottom:4}}>{card.title}</p>
                    <p style={{fontSize:12,color:"#6B6B72",lineHeight:1.5}}>{card.body}</p>
                    <span style={{display:"inline-block",marginTop:8,fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:6,background:card.tagBg,color:card.tagColor}}>{card.tag}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}
