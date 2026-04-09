"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, Code2 } from "lucide-react";
import type { Mode } from "@/lib/types";
import "./landing-page.css";

type LandingPageProps = {
  onSelect: (mode: Mode) => void;
};

function BusinessFigure() {
  return (
    <svg viewBox="0 0 220 480" className="silhouette-svg">
      {/* Head */}
      <ellipse cx="110" cy="48" rx="26" ry="29" />
      {/* Hair - short professional */}
      <path d="M84,40 Q82,20 110,18 Q138,20 136,40 Q135,30 110,28 Q85,30 84,40Z" />
      {/* Neck */}
      <rect x="100" y="75" width="20" height="14" rx="5" />
      {/* Suit jacket */}
      <path d="M68,89 L58,180 Q56,192 68,194 L95,196 L95,89 Q95,86 80,86 Z" />
      <path d="M152,89 L162,180 Q164,192 152,194 L125,196 L125,89 Q125,86 140,86 Z" />
      {/* Jacket front panels */}
      <rect x="95" y="89" width="30" height="107" />
      {/* Shirt/tie area */}
      <rect x="104" y="89" width="12" height="90" fill="currentColor" opacity="0.08" />
      {/* Tie */}
      <path d="M108,92 L112,92 L113,130 L110,138 L107,130 Z" fill="currentColor" opacity="0.12" />
      {/* Collar */}
      <path d="M95,89 L105,89 L100,102 Z" fill="currentColor" opacity="0.06" />
      <path d="M125,89 L115,89 L120,102 Z" fill="currentColor" opacity="0.06" />
      {/* Left arm with briefcase */}
      <path d="M68,92 Q48,100 44,130 L40,175 Q38,185 48,186 L65,188 Q68,188 68,184 L68,92Z" />
      {/* Briefcase */}
      <rect x="28" y="175" width="36" height="26" rx="4" fill="currentColor" opacity="0.1" />
      <rect x="40" y="170" width="12" height="8" rx="3" fill="currentColor" opacity="0.08" />
      {/* Right arm */}
      <path d="M152,92 Q172,100 176,130 L180,175 Q182,185 172,186 L155,188 Q152,188 152,184 L152,92Z" />
      {/* Suit trousers */}
      <path d="M75,194 L68,370 Q66,380 75,382 L100,384 Q108,384 108,376 L110,194 Z" />
      <path d="M145,194 L152,370 Q154,380 145,382 L120,384 Q112,384 112,376 L110,194 Z" />
      {/* Belt */}
      <rect x="72" y="190" width="76" height="8" rx="2" fill="currentColor" opacity="0.06" />
      {/* Shoes - dress shoes */}
      <path d="M65,378 Q60,378 56,384 Q54,390 60,394 L95,396 Q104,396 104,390 L102,378 Z" />
      <path d="M155,378 Q160,378 164,384 Q166,390 160,394 L125,396 Q116,396 116,390 L118,378 Z" />
    </svg>
  );
}

function DeveloperFigure() {
  return (
    <svg viewBox="0 0 220 480" className="silhouette-svg">
      {/* Head */}
      <ellipse cx="110" cy="48" rx="26" ry="29" />
      {/* Hair - slightly messy/longer */}
      <path d="M82,42 Q78,18 110,15 Q142,18 138,42 Q140,25 110,22 Q80,25 82,42Z" />
      <path d="M134,28 Q140,24 142,30 Q138,28 134,28Z" />
      {/* Neck */}
      <rect x="100" y="75" width="20" height="14" rx="5" />
      {/* Hoodie body */}
      <path d="M65,89 L55,195 Q54,205 65,206 L155,206 Q166,205 165,195 L155,89 Q150,84 110,84 Q70,84 65,89Z" />
      {/* Hoodie pocket */}
      <path d="M80,155 Q80,148 90,148 L130,148 Q140,148 140,155 L140,175 Q140,180 130,180 L90,180 Q80,180 80,175 Z" fill="currentColor" opacity="0.05" />
      {/* Hood shape */}
      <path d="M78,89 Q75,80 85,76 L95,89 Z" fill="currentColor" opacity="0.04" />
      <path d="M142,89 Q145,80 135,76 L125,89 Z" fill="currentColor" opacity="0.04" />
      {/* Hoodie string */}
      <line x1="100" y1="89" x2="98" y2="110" stroke="currentColor" strokeWidth="1.5" opacity="0.06" />
      <line x1="120" y1="89" x2="122" y2="110" stroke="currentColor" strokeWidth="1.5" opacity="0.06" />
      {/* Left arm - holding laptop */}
      <path d="M65,94 Q42,105 38,140 L35,185 Q34,195 44,196 L68,198 Q72,198 72,194 L72,94Z" />
      {/* Right arm */}
      <path d="M155,94 Q178,105 182,140 L185,185 Q186,195 176,196 L152,198 Q148,198 148,194 L148,94Z" />
      {/* Laptop open */}
      <rect x="30" y="160" width="60" height="5" rx="2" fill="currentColor" opacity="0.1" />
      <path d="M33,160 L42,125 Q44,118 52,118 L82,118 Q90,118 88,125 L80,160 Z" fill="currentColor" opacity="0.07" />
      {/* Screen glow */}
      <path d="M45,130 L78,130 L74,155 L38,155 Z" fill="currentColor" opacity="0.04" />
      {/* Jeans */}
      <path d="M72,204 L65,370 Q63,382 72,384 L98,386 Q106,386 106,378 L110,204 Z" />
      <path d="M148,204 L155,370 Q157,382 148,384 L122,386 Q114,386 114,378 L110,204 Z" />
      {/* Sneakers */}
      <path d="M60,380 Q54,380 50,386 Q48,394 56,398 L94,400 Q104,400 104,392 L102,380 Z" />
      <path d="M160,380 Q166,380 170,386 Q172,394 164,398 L126,400 Q116,400 116,392 L118,380 Z" />
      {/* Sneaker detail lines */}
      <line x1="58" y1="392" x2="95" y2="392" stroke="currentColor" strokeWidth="1" opacity="0.04" />
      <line x1="162" y1="392" x2="125" y2="392" stroke="currentColor" strokeWidth="1" opacity="0.04" />
    </svg>
  );
}

export function LandingPage({ onSelect }: LandingPageProps) {
  const [hovered, setHovered] = useState<Mode | null>(null);
  const [selected, setSelected] = useState<Mode | null>(null);

  function handleSelect(mode: Mode) {
    setSelected(mode);
    setTimeout(() => onSelect(mode), 800);
  }

  const spotlightAngle = hovered === "business" ? 22 : hovered === "developer" ? -22 : 0;
  const spotlightIntensity = hovered ? 1 : 0;

  return (
    <AnimatePresence>
      {!selected ? (
        <motion.div
          className="landing-root"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.6 }}
        >
          {/* Starfield background (CSS-only, no WebGL) */}
          <div className="landing-starfield" />
          <div className="landing-starfield landing-starfield--layer2" />

          {/* Circuit patterns */}
          <div className="landing-circuits landing-circuits-left" />
          <div className="landing-circuits landing-circuits-right" />

          {/* Single centered spotlight */}
          <div className="spotlight-anchor">
            <motion.div
              className="spotlight-beam"
              animate={{
                rotate: spotlightAngle,
                opacity: spotlightIntensity,
              }}
              transition={{
                rotate: { type: "spring", stiffness: 35, damping: 20, mass: 1.2 },
                opacity: { duration: 0.6, ease: "easeInOut" },
              }}
            />
            <motion.div
              className="spotlight-fixture"
              animate={{ opacity: hovered ? 1 : 0.15 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>

          {/* Ground glow follows hover */}
          <motion.div
            className="ground-glow"
            animate={{
              x: hovered === "business" ? "-30%" : hovered === "developer" ? "30%" : "0%",
              opacity: hovered ? 0.7 : 0,
              scaleX: hovered ? 1.3 : 0.5,
            }}
            transition={{
              x: { type: "spring", stiffness: 35, damping: 20, mass: 1.2 },
              opacity: { duration: 0.5, ease: "easeInOut" },
              scaleX: { type: "spring", stiffness: 40, damping: 18 },
            }}
          />

          {/* Title */}
          <motion.div
            className="landing-title-block"
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <h1 className="landing-title">CHOOSE YOUR PATH</h1>
            <p className="landing-subtitle">Select your role to get started</p>
          </motion.div>

          {/* Figures */}
          <div className="landing-figures">
            {/* Business */}
            <motion.div
              className={`landing-figure ${hovered === "business" ? "landing-figure--active" : ""}`}
              initial={{ x: -80, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.7, type: "spring", stiffness: 80 }}
              onMouseEnter={() => setHovered("business")}
              onMouseLeave={() => setHovered(null)}
              onClick={() => handleSelect("business")}
            >
              <div className="silhouette-container">
                <BusinessFigure />
              </div>
              <motion.button
                className="landing-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Briefcase className="h-4 w-4" />
                I&apos;M A BUSINESS PROFESSIONAL
              </motion.button>
            </motion.div>

            {/* Developer */}
            <motion.div
              className={`landing-figure ${hovered === "developer" ? "landing-figure--active" : ""}`}
              initial={{ x: 80, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.7, type: "spring", stiffness: 80 }}
              onMouseEnter={() => setHovered("developer")}
              onMouseLeave={() => setHovered(null)}
              onClick={() => handleSelect("developer")}
            >
              <div className="silhouette-container">
                <DeveloperFigure />
              </div>
              <motion.button
                className="landing-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Code2 className="h-4 w-4" />
                I&apos;M A DEVELOPER
              </motion.button>
            </motion.div>
          </div>

        </motion.div>
      ) : (
        <motion.div
          className="landing-root"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.6 }}
        />
      )}
    </AnimatePresence>
  );
}
