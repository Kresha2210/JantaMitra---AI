import React from "react";

export default function Logo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Blue Gradient for 'J' */}
        <linearGradient id="jm-blue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#003cd2" />
          <stop offset="100%" stopColor="#0072ff" />
        </linearGradient>
        {/* Purple Gradient for 'M' */}
        <linearGradient id="jm-purple" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2c3e50" />
          <stop offset="50%" stopColor="#4a00e0" />
          <stop offset="100%" stopColor="#8e2de2" />
        </linearGradient>
        {/* Ring Gradient */}
        <linearGradient id="jm-ring" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0072ff" />
          <stop offset="100%" stopColor="#8e2de2" />
        </linearGradient>
      </defs>

      {/* Stylized Wrapping Ring */}
      <path
        d="M 78 24 A 85 85 0 1 0 156 142 M 165 74 A 85 85 0 0 0 95 18"
        stroke="url(#jm-ring)"
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* Letter 'J' stem and bottom hook */}
      <path
        d="M 85 64 L 85 130 C 85 152 45 152 45 130"
        stroke="url(#jm-blue)"
        strokeWidth="16"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Circle dot of 'J' / 'i' */}
      <circle cx="68" cy="28" r="14" fill="url(#jm-blue)" />

      {/* Letter 'M' with technical circuit board tracks integrated */}
      <path
        d="M 85 64 L 118 112 L 152 64 L 186 100"
        stroke="url(#jm-purple)"
        strokeWidth="16"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Technical Circuit Board Traces extending from 'M' */}
      {/* Trace 1 (Top) */}
      <path
        d="M 186 100 L 202 84"
        stroke="url(#jm-purple)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="202" cy="84" r="5.5" fill="url(#jm-purple)" />

      {/* Trace 2 (Middle) */}
      <path
        d="M 174 112 L 194 92"
        stroke="url(#jm-purple)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="194" cy="92" r="5.5" fill="url(#jm-purple)" />

      {/* Trace 3 (Bottom) */}
      <path
        d="M 162 124 L 182 104"
        stroke="url(#jm-purple)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="182" cy="104" r="5.5" fill="url(#jm-purple)" />
    </svg>
  );
}
