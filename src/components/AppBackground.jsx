import React from 'react';
import './AppBackground.css';

/**
 * The home page's background (soft gradient, waves, leaves, heartbeat line),
 * drawn once behind every page in the project. It is fixed to the screen,
 * so pages scroll over it.
 */
export default function AppBackground() {
  return (
    <div className="app-bg" aria-hidden="true">
      <svg className="app-bg__waves" viewBox="0 0 1536 324" preserveAspectRatio="none">
        <defs>
          <linearGradient id="app-bg-main" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#8dd8dc" />
            <stop offset="0.45" stopColor="#8fd6e2" />
            <stop offset="0.75" stopColor="#9ed4f0" />
            <stop offset="1" stopColor="#a8dcf3" />
          </linearGradient>
        </defs>
        <path d="M0 100 C70 96 130 104 200 130 C320 172 420 215 520 245 L520 324 L0 324Z" fill="#b6ebe6" />
        <path d="M440 215 C650 262 900 262 1130 205 C1300 160 1420 120 1536 126 L1536 324 L440 324Z" fill="#d6edfd" />
        <path d="M0 176 C120 150 260 170 400 205 C560 245 700 300 900 302 C1100 304 1350 230 1536 112 L1536 324 L0 324Z" fill="url(#app-bg-main)" />
      </svg>

      <svg className="app-bg__leaves" viewBox="0 36 160 182">
        <path d="M70 210 C30 170 28 100 62 40 C92 90 98 160 70 210Z" fill="#6cc0d6" />
        <path d="M62 40 C92 90 98 160 70 210 C72 150 70 95 62 40Z" fill="#8fd3e3" />
        <path d="M70 210 C70 150 68 95 62 40" stroke="#4aa5bf" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <path d="M76 214 C80 160 110 110 154 96 C156 150 126 196 76 214Z" fill="#74cfa6" />
        <path d="M154 96 C156 150 126 196 76 214 C100 170 124 128 154 96Z" fill="#9adfc0" />
        <path d="M76 214 C100 170 124 128 154 96" stroke="#55b88c" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <path d="M62 214 C28 196 6 164 8 124 C44 138 66 172 62 214Z" fill="#5eb7cf" />
        <path d="M8 124 C44 138 66 172 62 214 C46 178 28 148 8 124Z" fill="#7fcadb" />
        <path d="M62 214 C46 178 28 148 8 124" stroke="#439fba" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </svg>

      <svg className="app-bg__ecg" viewBox="0 0 346 160">
        <g fill="none" stroke="#78b8e8" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 99 H62 L75 80 L91 122 L111 39 L129 139 L146 81 L158 99 H193" />
          <path d="M220 104 C196 86 180 72 180 52 C180 34 192 24 206 24 C214 24 219 30 220 43 C221 30 226 24 234 24 C248 24 261 34 261 52 C261 72 244 86 220 104 Z" />
          <path d="M220 104 C226 100 230 99 240 99 H346" />
        </g>
      </svg>
    </div>
  );
}