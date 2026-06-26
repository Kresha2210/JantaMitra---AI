import React, { useState } from "react";

interface DoughnutSegment {
  label: string;
  count: number;
  color: string;
  statusKey: string;
}

interface DoughnutChartProps {
  data: DoughnutSegment[];
  centerLabel?: string;
}

export default function DoughnutChart({ data, centerLabel = "Total Issues" }: DoughnutChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const total = data.reduce((acc, curr) => acc + curr.count, 0);

  // SVG parameters
  const size = 200;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let accumulatedAngle = -90; // Start at twelve o'clock

  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-6 p-4 bg-white/70 backdrop-blur-md rounded-2xl border border-slate-100 shadow-sm transition-all duration-300">
      {/* SVG Doughnut */}
      <div className="relative" style={{ width: size, height: size }}>
        {total === 0 ? (
          <svg width={size} height={size} className="transform -rotate-90">
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="#F1F5F9"
              strokeWidth={strokeWidth}
            />
          </svg>
        ) : (
          <svg width={size} height={size} className="overflow-visible">
            {data.map((segment, idx) => {
              if (segment.count === 0) return null;

              const percentage = segment.count / total;
              const strokeDashoffset = circumference - percentage * circumference;
              const rotationAngle = accumulatedAngle;
              accumulatedAngle += percentage * 360;

              const isHovered = hoveredIdx === idx;

              return (
                <circle
                  key={segment.label}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="transparent"
                  stroke={segment.color}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  transform={`rotate(${rotationAngle} ${center} ${center})`}
                  className="transition-all duration-300 cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{
                    filter: isHovered ? "drop-shadow(0px 4px 6px rgba(0,0,0,0.08))" : "none",
                  }}
                />
              );
            })}
          </svg>
        )}

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {hoveredIdx !== null && data[hoveredIdx].count > 0 ? (
            <>
              <span className="text-2xl font-bold font-sans tracking-tight" style={{ color: data[hoveredIdx].color }}>
                {Math.round((data[hoveredIdx].count / total) * 100)}%
              </span>
              <span className="text-xs text-slate-400 font-medium tracking-wide uppercase mt-0.5">
                {data[hoveredIdx].label}
              </span>
            </>
          ) : (
            <>
              <span className="text-3xl font-extrabold font-sans tracking-tight text-slate-800">
                {total}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">
                {centerLabel}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Legend Grid */}
      <div className="flex flex-col gap-2.5 w-full md:w-auto min-w-[180px]">
        {data.map((segment, idx) => {
          const percentage = total > 0 ? Math.round((segment.count / total) * 100) : 0;
          return (
            <div
              key={segment.label}
              className={`flex items-center justify-between p-1.5 px-2.5 rounded-lg transition-all duration-200 ${
                hoveredIdx === idx ? "bg-slate-50 border border-slate-100" : "border border-transparent"
              }`}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded-full shrink-0 border border-white shadow-sm"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="text-sm text-slate-600 font-medium font-sans">
                  {segment.label}
                </span>
              </div>
              <div className="text-right flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-800 font-mono">
                  {segment.count}
                </span>
                <span className="text-xs text-slate-400 font-mono min-w-[32px] text-right">
                  ({percentage}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
