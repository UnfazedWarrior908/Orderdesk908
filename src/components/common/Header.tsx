import React, { useState, useEffect, useRef } from 'react';
import { Pill, Wifi, WifiOff, Download, Database, Info, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

interface HeaderProps {
  onOpenBackup: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenBackup }) => {
  const isOnline = useOnlineStatus();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  // Smart collapsible header on scroll
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const delta = currentScrollY - lastScrollY.current;

          // Only collapse if scrolled past 40px and scrolling downwards
          if (currentScrollY > 40 && delta > 8) {
            setIsHeaderHidden(true);
          } else if (delta < -6 || currentScrollY <= 20) {
            setIsHeaderHidden(false);
          }

          lastScrollY.current = Math.max(0, currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-30 bg-teal-900/95 backdrop-blur-md text-white shadow-sm border-b border-teal-800/80 transition-transform duration-300 ease-in-out ${
          isHeaderHidden ? '-translate-y-full' : 'translate-y-0'
        }`}
      >
        {/* PINK CHERRY BLOSSOM TREE ILLUSTRATION (Top-Right decorative corner) */}
        <div
          className="absolute top-0 right-0 h-full w-56 sm:w-80 pointer-events-none overflow-hidden select-none z-0"
          style={{
            maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)',
            WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)',
          }}
          aria-hidden="true"
        >
          <svg
            className="w-full h-full object-cover object-right"
            viewBox="0 0 320 60"
            preserveAspectRatio="xMaxYMid slice"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="headerBranchGrad" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#451a03" />
                <stop offset="60%" stopColor="#78350f" />
                <stop offset="100%" stopColor="#92400e" stopOpacity="0.8" />
              </linearGradient>

              <radialGradient id="cherryPetal" cx="30%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#ffe4e6" />
                <stop offset="45%" stopColor="#fbcfe8" />
                <stop offset="85%" stopColor="#f472b6" />
                <stop offset="100%" stopColor="#db2777" />
              </radialGradient>

              <radialGradient id="cherryCenter" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="70%" stopColor="#e11d48" />
              </radialGradient>

              {/* Cherry Blossom Flower Unit */}
              <g id="headerSakura">
                <circle cx="0" cy="-6" r="4.5" fill="url(#cherryPetal)" />
                <circle cx="5.7" cy="-1.8" r="4.5" fill="url(#cherryPetal)" />
                <circle cx="3.5" cy="4.8" r="4.5" fill="url(#cherryPetal)" />
                <circle cx="-3.5" cy="4.8" r="4.5" fill="url(#cherryPetal)" />
                <circle cx="-5.7" cy="-1.8" r="4.5" fill="url(#cherryPetal)" />
                <circle cx="0" cy="0" r="1.8" fill="url(#cherryCenter)" />
              </g>

              {/* Single Floating Petal */}
              <g id="floatingPetal">
                <path
                  d="M 0,0 C 2.5,-3.5 5.5,-3 5,-0.5 C 4.5,2 1.5,3.5 0,0 Z"
                  fill="url(#cherryPetal)"
                  opacity="0.85"
                />
              </g>
            </defs>

            {/* Tree Branches extending softly from top right */}
            <path
              d="M 330,-5 Q 280,10 240,16 Q 200,22 165,30 Q 140,35 110,34"
              stroke="url(#headerBranchGrad)"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 265,13 Q 235,5 195,6 Q 170,7 145,2"
              stroke="url(#headerBranchGrad)"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 220,19 Q 190,32 160,42 Q 135,48 115,46"
              stroke="url(#headerBranchGrad)"
              strokeWidth="1.6"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 295,3 Q 275,-8 245,-10"
              stroke="url(#headerBranchGrad)"
              strokeWidth="2.2"
              strokeLinecap="round"
              fill="none"
            />

            {/* Blossom Clusters along branches */}
            <use href="#headerSakura" transform="translate(310, 4) scale(1.3) rotate(20)" />
            <use href="#headerSakura" transform="translate(285, 14) scale(1.1) rotate(45)" />
            <use href="#headerSakura" transform="translate(260, 8) scale(0.9) rotate(-15)" />
            <use href="#headerSakura" transform="translate(242, 22) scale(1.2) rotate(30)" />
            <use href="#headerSakura" transform="translate(210, 16) scale(1) rotate(60)" />
            <use href="#headerSakura" transform="translate(185, 26) scale(0.95) rotate(-35)" />
            <use href="#headerSakura" transform="translate(160, 34) scale(0.85) rotate(10)" />
            <use href="#headerSakura" transform="translate(138, 32) scale(0.75) rotate(40)" />
            <use href="#headerSakura" transform="translate(195, 7) scale(0.8) rotate(15)" />
            <use href="#headerSakura" transform="translate(160, 5) scale(0.7) rotate(-25)" />
            <use href="#headerSakura" transform="translate(135, 47) scale(0.65) rotate(55)" />

            {/* Little pink buds */}
            <circle cx="112" cy="34" r="2.2" fill="#f472b6" />
            <circle cx="118" cy="46" r="2" fill="#fda4af" />
            <circle cx="146" cy="3" r="2" fill="#f472b6" />

            {/* Drifting petals floating subtly downwards */}
            <use href="#floatingPetal" transform="translate(130, 18) rotate(25) scale(1)" />
            <use href="#floatingPetal" transform="translate(95, 38) rotate(-40) scale(0.9)" />
            <use href="#floatingPetal" transform="translate(175, 48) rotate(70) scale(0.85)" />
            <use href="#floatingPetal" transform="translate(70, 48) rotate(15) scale(0.8)" />
          </svg>
        </div>

        {/* SLIM HEADER BAR (40% reduced height: compact, high density, max screen space) */}
        <div className="relative z-10 max-w-4xl mx-auto px-3 sm:px-4 py-1.5 flex items-center justify-between min-h-[46px]">
          {/* Logo & App Title */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-700/80 border border-teal-400/30 flex items-center justify-center shadow-xs text-teal-100 shrink-0">
              <Pill className="w-4 h-4 text-teal-200 rotate-45" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <h1 className="font-bold text-sm tracking-tight text-white leading-none">
                Order Desk
              </h1>
              <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.2 rounded bg-teal-800/90 text-teal-200 border border-teal-700/70">
                Pharma
              </span>
            </div>
          </div>

          {/* Right Header Controls - small, sleek icons */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Online / Offline status badge */}
            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition ${
                isOnline
                  ? 'bg-teal-800/70 text-teal-200 border border-teal-700/60'
                  : 'bg-amber-500/20 text-amber-200 border border-amber-400/40'
              }`}
              title={isOnline ? 'Online - All orders stored locally' : 'Offline Mode Active'}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-2.5 h-2.5 text-emerald-400" />
                  <span className="hidden xs:inline">Offline-ready</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-2.5 h-2.5 text-amber-300" />
                  <span>Offline</span>
                </>
              )}
            </div>

            {/* PWA Install Button */}
            {!isInstalled && isInstallable && (
              <button
                onClick={install}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-semibold shadow-xs transition active:scale-95 cursor-pointer"
                title="Install Order Desk to home screen"
              >
                <Download className="w-3 h-3" />
                <span className="hidden xs:inline">Install</span>
              </button>
            )}

            {!isInstalled && isIOS && (
              <button
                onClick={() => setShowIOSModal(true)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-800/90 hover:bg-teal-700 text-teal-100 text-[10px] font-medium border border-teal-700 transition"
              >
                <Download className="w-3 h-3 text-teal-300" />
                <span>Install</span>
              </button>
            )}

            {/* Backup / Data Management button */}
            <button
              onClick={onOpenBackup}
              className="p-1.5 rounded-md text-teal-200 hover:text-white hover:bg-teal-800/80 transition active:scale-95 cursor-pointer"
              title="Backup, Restore & Data Safety"
              aria-label="Backup and Data Safety"
            >
              <Database className="w-3.5 h-3.5" />
            </button>

            {/* Info modal button */}
            <button
              onClick={() => setShowAboutModal(true)}
              className="p-1.5 rounded-md text-teal-200 hover:text-white hover:bg-teal-800/80 transition active:scale-95 cursor-pointer"
              title="About Order Desk"
              aria-label="About"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* iOS Installation Instruction Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Install on iPhone / iPad</h3>
              <button
                onClick={() => setShowIOSModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-4 space-y-3 text-sm text-slate-600">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center shrink-0">
                  1
                </span>
                <p>
                  Tap the <strong className="text-slate-800">Share</strong> button (box with upward
                  arrow) in the Safari toolbar.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center shrink-0">
                  2
                </span>
                <p>
                  Scroll down and tap <strong className="text-slate-800">Add to Home Screen</strong>
                  .
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center shrink-0">
                  3
                </span>
                <p>Launch Order Desk like a native app with full offline capabilities!</p>
              </div>
            </div>
            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-teal-800 text-white font-medium text-sm hover:bg-teal-700 transition"
            >
              Got It
            </button>
          </div>
        </div>
      )}

      {/* About Order Desk Modal */}
      {showAboutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-700 text-white flex items-center justify-center">
                  <Pill className="w-4 h-4 rotate-45" />
                </div>
                <h3 className="text-base font-bold text-slate-800">Order Desk PWA</h3>
              </div>
              <button
                onClick={() => setShowAboutModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-4 space-y-2.5 text-xs text-slate-600 leading-relaxed">
              <p>
                <strong className="text-slate-800">Order Desk</strong> is purpose-built for medicine
                distributors and field sales booking representatives taking manual orders from
                pharmacies.
              </p>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5">
                <div className="font-semibold text-slate-700">Key Capabilities:</div>
                <ul className="list-disc pl-4 space-y-1 text-slate-600">
                  <li>
                    <strong>100% Offline:</strong> Operates seamlessly without internet connection.
                  </li>
                  <li>
                    <strong>Fast Order Entry:</strong> Instant fuzzy search &amp; 2-tap quantity
                    workflow.
                  </li>
                  <li>
                    <strong>Ultra-Compact List:</strong> Handles 50+ items smoothly on mobile.
                  </li>
                  <li>
                    <strong>Per-Item Discount:</strong> % or Rs. discount per item with live recalculation.
                  </li>
                  <li>
                    <strong>Professional PDF:</strong> Clean order sheets generated entirely
                    in-browser.
                  </li>
                  <li>
                    <strong>WhatsApp Sharing:</strong> Direct order sharing via Web Share or
                    formatted text.
                  </li>
                  <li>
                    <strong>Data Safety:</strong> Full JSON backup &amp; restore at any time.
                  </li>
                </ul>
              </div>
            </div>
            <button
              onClick={() => setShowAboutModal(false)}
              className="w-full py-2.5 rounded-xl bg-teal-800 text-white font-medium text-sm hover:bg-teal-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
