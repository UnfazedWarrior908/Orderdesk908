import React from 'react';

/**
 * FloralBackground
 * Soft, elegant fixed background of watercolor-style green leaves and pink cherry blossom flowers.
 * Subtle low opacity (10-14%) with a soft white tint overlay so text and numbers remain 100% readable.
 * Fully offline SVG illustrations (no external images).
 */
export const FloralBackground: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
    >
      {/* Gentle ambient wash gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-teal-50/20 via-rose-50/15 to-slate-50/30" />

      {/* Primary SVG Botanical Pattern with soft watercolor filters */}
      <svg
        className="absolute inset-0 w-full h-full object-cover opacity-12 sm:opacity-14"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1200 1200"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Petal Gradients */}
          <radialGradient id="pinkPetal1" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#ffd1dc" />
            <stop offset="55%" stopColor="#f472b6" />
            <stop offset="100%" stopColor="#ec4899" />
          </radialGradient>

          <radialGradient id="pinkPetalSoft" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ffe4e6" />
            <stop offset="60%" stopColor="#fbcfe8" />
            <stop offset="100%" stopColor="#f472b6" />
          </radialGradient>

          <radialGradient id="flowerCenter" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="70%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#e11d48" />
          </radialGradient>

          {/* Leaf Gradients */}
          <linearGradient id="leafGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a7f3d0" />
            <stop offset="50%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          <linearGradient id="leafGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6ee7b7" />
            <stop offset="50%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>

          <linearGradient id="branchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#78350f" />
            <stop offset="100%" stopColor="#451a03" />
          </linearGradient>

          {/* Reusable 5-Petal Flower Symbol */}
          <g id="blossom">
            {/* 5 rounded delicate petals */}
            <path
              d="M 0,-4 C -6,-16 6,-24 0,-32 C -6,-24 6,-16 0,-4"
              fill="url(#pinkPetalSoft)"
            />
            <path
              d="M 0,-4 C -6,-16 6,-24 0,-32 C -6,-24 6,-16 0,-4"
              fill="url(#pinkPetal1)"
              transform="rotate(72)"
            />
            <path
              d="M 0,-4 C -6,-16 6,-24 0,-32 C -6,-24 6,-16 0,-4"
              fill="url(#pinkPetalSoft)"
              transform="rotate(144)"
            />
            <path
              d="M 0,-4 C -6,-16 6,-24 0,-32 C -6,-24 6,-16 0,-4"
              fill="url(#pinkPetal1)"
              transform="rotate(216)"
            />
            <path
              d="M 0,-4 C -6,-16 6,-24 0,-32 C -6,-24 6,-16 0,-4"
              fill="url(#pinkPetalSoft)"
              transform="rotate(288)"
            />
            {/* Soft center pistil */}
            <circle cx="0" cy="0" r="4.5" fill="url(#flowerCenter)" />
            <circle cx="0" cy="0" r="1.5" fill="#fff" opacity="0.8" />
          </g>

          {/* Reusable Botanical Leaf Spray */}
          <g id="leafCluster">
            <path
              d="M 0,0 C 15,-10 28,-30 25,-55 C 8,-42 2,-25 0,0 Z"
              fill="url(#leafGrad1)"
            />
            <path
              d="M 0,0 C -15,-8 -26,-28 -22,-50 C -6,-38 -1,-22 0,0 Z"
              fill="url(#leafGrad2)"
            />
            <path
              d="M 0,-15 C 10,-28 12,-48 8,-65 C 2,-50 -2,-35 0,-15 Z"
              fill="url(#leafGrad1)"
            />
            <path d="M 0,0 Q 2,-35 0,-60" stroke="#047857" strokeWidth="1" fill="none" opacity="0.6" />
          </g>
        </defs>

        {/* --- Top-Left Floral Vignette --- */}
        <g transform="translate(100, 120)">
          <use href="#leafCluster" transform="rotate(-30) scale(1.2)" />
          <use href="#leafCluster" transform="translate(30, -20) rotate(25) scale(0.9)" />
          <use href="#blossom" transform="translate(10, -10) scale(1.1)" />
          <use href="#blossom" transform="translate(55, 20) scale(0.85) rotate(15)" />
          <use href="#blossom" transform="translate(-35, 30) scale(0.7) rotate(45)" />
        </g>

        {/* --- Top-Right Soft Petal Drift (under the header area) --- */}
        <g transform="translate(1050, 140)">
          <use href="#leafCluster" transform="rotate(110) scale(1.1)" />
          <use href="#blossom" transform="translate(-20, 20) scale(1.2)" />
          <use href="#blossom" transform="translate(-70, 60) scale(0.75) rotate(35)" />
        </g>

        {/* --- Mid-Left Floating Blossom Spray --- */}
        <g transform="translate(60, 580)">
          <use href="#leafCluster" transform="rotate(45) scale(0.9)" />
          <use href="#blossom" transform="translate(35, 10) scale(0.9) rotate(20)" />
          <circle cx="65" cy="-25" r="4" fill="#f472b6" opacity="0.7" />
          <circle cx="85" cy="45" r="3" fill="#fbcfe8" opacity="0.8" />
        </g>

        {/* --- Mid-Right Graceful Bloom --- */}
        <g transform="translate(1120, 650)">
          <use href="#leafCluster" transform="rotate(-120) scale(1.15)" />
          <use href="#leafCluster" transform="translate(-40, 20) rotate(-70) scale(0.8)" />
          <use href="#blossom" transform="translate(-30, -10) scale(1)" />
          <use href="#blossom" transform="translate(-80, 25) scale(0.7) rotate(60)" />
        </g>

        {/* --- Center Floating Petals (subtle depth) --- */}
        <g transform="translate(420, 360)">
          <path
            d="M 0,0 C 8,-12 18,-10 20,-2 C 22,6 10,12 0,0 Z"
            fill="url(#pinkPetalSoft)"
            transform="rotate(25)"
          />
        </g>
        <g transform="translate(760, 480)">
          <path
            d="M 0,0 C 9,-10 20,-8 18,2 C 16,8 6,12 0,0 Z"
            fill="url(#pinkPetal1)"
            transform="rotate(-40) scale(0.9)"
          />
        </g>
        <g transform="translate(320, 820)">
          <path
            d="M 0,0 C 10,-12 22,-8 20,4 C 18,10 6,14 0,0 Z"
            fill="url(#pinkPetalSoft)"
            transform="rotate(65) scale(0.8)"
          />
        </g>
        <g transform="translate(840, 860)">
          <path
            d="M 0,0 C 8,-10 16,-8 18,0 C 20,6 8,10 0,0 Z"
            fill="url(#pinkPetal1)"
            transform="rotate(15) scale(0.85)"
          />
        </g>

        {/* --- Bottom-Left Branch & Bloom --- */}
        <g transform="translate(120, 1060)">
          <use href="#leafCluster" transform="rotate(15) scale(1.3)" />
          <use href="#blossom" transform="translate(25, -20) scale(1.15) rotate(10)" />
          <use href="#blossom" transform="translate(80, 10) scale(0.8) rotate(35)" />
        </g>

        {/* --- Bottom-Right Full Botanical Garden Corner --- */}
        <g transform="translate(1040, 1020)">
          <use href="#leafCluster" transform="rotate(-135) scale(1.4)" />
          <use href="#leafCluster" transform="translate(-45, -35) rotate(-95) scale(1)" />
          <use href="#blossom" transform="translate(-30, -30) scale(1.25)" />
          <use href="#blossom" transform="translate(-95, -15) scale(0.9) rotate(40)" />
          <use href="#blossom" transform="translate(-60, 40) scale(0.75) rotate(-20)" />
        </g>
      </svg>
    </div>
  );
};
