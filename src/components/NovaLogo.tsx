"use client";

import React from "react";

export const NovaLogo: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <div className="relative flex-shrink-0">
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="animate-float"
      >
        {/* Outer ring */}
        <circle
          cx="24"
          cy="24"
          r="22"
          stroke="url(#gradient1)"
          strokeWidth="2"
          className="animate-glow"
        />

        {/* Inner geometric shape */}
        <path
          d="M24 10L34 20L24 30L14 20Z"
          fill="url(#gradient2)"
          className="animate-pulse"
        />

        {/* Center dot */}
        <circle
          cx="24"
          cy="20"
          r="4"
          fill="url(#gradient3)"
          className="animate-ping"
        />

        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
          <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#60a5fa" />
          </linearGradient>
        </defs>
      </svg>
    </div>

    <div className="flex flex-col">
      <h1 className="text-3xl font-bold gradient-text leading-tight">NovaTask</h1>
      <p className="text-sm text-purple-200 leading-tight">Professional Todo Management</p>
    </div>
  </div>
);
